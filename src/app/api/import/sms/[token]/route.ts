import crypto from "crypto";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { ImportToken } from "@/lib/models/import-token";
import { Expense } from "@/lib/models/expense";
import {
  BudgetPeriod,
  type IBudgetCategory,
} from "@/lib/models/budget-period";
import { UserPreferences } from "@/lib/models/user-preferences";
import { Types } from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { message } = body as { message?: string };

    if (!message) {
      return Response.json(
        { success: false, error: "Missing message" },
        { status: 400 }
      );
    }

    await connectDB();

    // Resolve user via import token
    const importToken = await ImportToken.findOne({ token, enabled: true });
    if (!importToken) {
      return Response.json(
        { success: false, error: "Invalid or disabled token" },
        { status: 401 }
      );
    }

    const userId = importToken.userId;

    // Duplicate detection via raw message hash
    const rawMessageHash = crypto
      .createHash("sha256")
      .update(message)
      .digest("hex");

    const existingExpense = await Expense.findOne({ userId, rawMessageHash });
    if (existingExpense) {
      return Response.json({ success: true, status: "duplicate" });
    }

    // Load user context: active budget + currency preference
    const now = new Date();
    const [activeBudget, prefs] = await Promise.all([
      BudgetPeriod.findOne({
        userId,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .sort({ createdAt: -1 })
        .lean(),
      UserPreferences.findOne({ userId }).lean(),
    ]);

    const userCurrency = prefs?.defaultCurrency ?? "USD";
    const categoryNames = activeBudget
      ? activeBudget.categories.map((c: IBudgetCategory) => c.name)
      : [];

    // Build schema with the user's actual categories
    const categoryEnum =
      categoryNames.length > 0
        ? (categoryNames as [string, ...string[]])
        : (["Uncategorized"] as [string, ...string[]]);

    const schema = z.object({
      amount: z
        .number()
        .describe(
          `The transaction amount converted to ${userCurrency}. If the SMS shows a different currency, convert to ${userCurrency} at approximate market rate.`
        ),
      originalAmount: z
        .number()
        .nullable()
        .describe(
          "The original amount if in a different currency, or null if already in user currency"
        ),
      originalCurrency: z
        .string()
        .nullable()
        .describe(
          "The original currency code if different from user currency, or null"
        ),
      description: z
        .string()
        .describe(
          "Short description for the expense — use the merchant/vendor name if available, otherwise summarize the transaction"
        ),
      category: z
        .enum(categoryEnum)
        .describe("The best-matching category for this expense"),
      isExpense: z
        .boolean()
        .describe(
          "true if this SMS describes an expense/purchase/payment. false if it is not a transaction (OTP, promo, alert, balance inquiry, etc.)"
        ),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Confidence score from 0 to 1 for the overall parsing"),
    });

    const { object: parsed } = await generateObject({
      model: openai("gpt-4.1-nano"),
      schema,
      prompt: `You are a transaction parser. Extract expense details from this bank SMS.

User's currency: ${userCurrency}
User's budget categories: ${categoryNames.join(", ") || "None configured"}

Rules:
- If the SMS is not an expense (OTP, promo, balance alert, etc.), set isExpense to false
- Pick the most appropriate category from the user's list
- If the amount is in a different currency than ${userCurrency}, convert it approximately and note the original
- Use the merchant name as the description

SMS: ${message}`,
    });

    // Not an expense — skip
    if (!parsed.isExpense || !parsed.amount || parsed.amount <= 0) {
      return Response.json({
        success: true,
        status: "skipped",
        reason: "Not an expense transaction",
      });
    }

    // Match category to budget
    let budgetPeriodId: Types.ObjectId | null = null;
    let categoryId: Types.ObjectId | null = null;

    if (activeBudget) {
      budgetPeriodId = activeBudget._id as Types.ObjectId;

      const matchedCategory = activeBudget.categories.find(
        (c: IBudgetCategory) =>
          c.name.toLowerCase() === parsed.category.toLowerCase()
      );

      if (matchedCategory) {
        categoryId = matchedCategory._id as Types.ObjectId;
      }
    }

    // Create the expense
    const expense = await Expense.create({
      userId,
      budgetPeriodId,
      categoryId,
      description: parsed.description,
      amount: parsed.amount,
      currency: parsed.originalCurrency ?? userCurrency,
      date: now,
      merchant: parsed.description,
      source: "apple_shortcuts_sms",
      rawImportMessage: message,
      rawMessageHash,
      importConfidence: parsed.confidence,
    });

    // Update budget category spent amount if matched
    if (budgetPeriodId && categoryId) {
      await BudgetPeriod.updateOne(
        { _id: budgetPeriodId, "categories._id": categoryId },
        { $inc: { "categories.$.spent": parsed.amount } }
      );
    }

    // Update last import timestamp
    await ImportToken.updateOne(
      { _id: importToken._id },
      { $set: { lastImportAt: now } }
    );

    return Response.json({
      success: true,
      status: "created",
      expense: {
        id: expense._id.toString(),
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        confidence: parsed.confidence,
        originalAmount: parsed.originalAmount,
        originalCurrency: parsed.originalCurrency,
        budgetMatched: !!budgetPeriodId,
        categoryMatched: !!categoryId,
      },
    });
  } catch (error) {
    console.error("SMS import error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
