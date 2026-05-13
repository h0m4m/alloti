import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const smsParseSchema = z.object({
  amount: z.number().describe("The transaction amount as a positive number"),
  currency: z
    .string()
    .nullable()
    .describe("The currency code (e.g. AED, USD, EUR) or null if unclear"),
  merchant: z
    .string()
    .nullable()
    .describe("The merchant or vendor name, or null if unclear"),
  category: z
    .enum([
      "Food",
      "Transport",
      "Shopping",
      "Subscriptions",
      "Bills",
      "Entertainment",
      "Health",
      "Travel",
      "Groceries",
      "Cash Withdrawal",
      "Transfers",
      "Uncategorized",
    ])
    .describe("The best-matching expense category"),
  cardLastFour: z
    .string()
    .nullable()
    .describe("Last 4 digits of the card used, or null if not mentioned"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "Confidence score from 0 to 1 for the overall parsing accuracy"
    ),
});

export type SmsParseOutput = z.infer<typeof smsParseSchema>;

export async function parseSmsMessage(
  message: string
): Promise<SmsParseOutput | null> {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4.1-nano"),
      schema: smsParseSchema,
      prompt: `Extract transaction details from this bank SMS message. Be precise with the amount — never hallucinate or invent values. If a field is uncertain, use null. Return a confidence score reflecting your certainty.

SMS: ${message}`,
    });

    return object;
  } catch {
    return null;
  }
}
