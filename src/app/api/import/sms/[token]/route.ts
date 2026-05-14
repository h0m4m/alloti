import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { ImportToken } from "@/lib/models/import-token";
import { Expense } from "@/lib/models/expense";
import {
  BudgetPeriod,
  type IBudgetCategory,
} from "@/lib/models/budget-period";
import { CategoryRule } from "@/lib/models/category-rule";
import { parseSmsMessage } from "@/lib/sms-parser";
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

    const existingExpense = await Expense.findOne({
      userId,
      rawMessageHash,
    });

    if (existingExpense) {
      return Response.json({ success: true, status: "duplicate" });
    }

    // Parse SMS with AI
    const parsed = await parseSmsMessage(message);

    if (!parsed || !parsed.amount || parsed.amount <= 0) {
      return Response.json(
        { success: false, error: "Could not extract amount from message" },
        { status: 422 }
      );
    }

    // Determine category — low confidence defaults to Uncategorized
    const categoryName =
      parsed.confidence < 0.7
        ? "Uncategorized"
        : (parsed.category ?? "Uncategorized");

    // Find active budget period: today within range, most recently created
    const now = new Date();
    const activeBudget = await BudgetPeriod.findOne({
      userId,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Try to match category in the active budget
    let budgetPeriodId: Types.ObjectId | null = null;
    let categoryId: Types.ObjectId | null = null;

    if (activeBudget) {
      budgetPeriodId = activeBudget._id as Types.ObjectId;

      // Try case-insensitive match
      const matchedCategory = activeBudget.categories.find(
        (c: IBudgetCategory) =>
          c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (matchedCategory) {
        categoryId = matchedCategory._id as Types.ObjectId;
      } else {
        // Check user's category rules for a better match
        const rules = await CategoryRule.find({ userId }).lean();
        const merchantLower = (parsed.merchant ?? "").toLowerCase();

        for (const rule of rules) {
          const kw = rule.keyword.toLowerCase();
          let matched = false;
          if (rule.matchType === "exact") matched = merchantLower === kw;
          else if (rule.matchType === "starts_with")
            matched = merchantLower.startsWith(kw);
          else matched = merchantLower.includes(kw);

          if (matched) {
            const ruleCategory = activeBudget.categories.find(
              (c: IBudgetCategory) =>
                c.name.toLowerCase() === rule.categoryName.toLowerCase()
            );
            if (ruleCategory) {
              categoryId = ruleCategory._id as Types.ObjectId;
              break;
            }
          }
        }
      }
    }

    // Build description
    const description = parsed.merchant
      ? `${parsed.merchant}`
      : "Imported transaction";

    // Create the expense
    const expense = await Expense.create({
      userId,
      budgetPeriodId,
      categoryId,
      description,
      amount: parsed.amount,
      currency: parsed.currency,
      date: now,
      merchant: parsed.merchant,
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
        currency: parsed.currency,
        merchant: parsed.merchant,
        category: categoryName,
        confidence: parsed.confidence,
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
