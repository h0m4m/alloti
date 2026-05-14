import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { tools } from "@/ai/tools";
import { getUserPreferences } from "@/lib/actions";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const prefs = await getUserPreferences();
  const currency = prefs.defaultCurrency;

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: `You are Alloti AI, a helpful financial assistant built into the Alloti budgeting app. Today's date is ${new Date().toISOString().split("T")[0]}. The user's currency is ${currency}.

You help users manage their finances by:
- Answering questions about their budgets, expenses, income, and savings goals
- Logging new expenses and income
- Creating savings goals and making contributions
- Generating visual charts and reports about spending patterns
- Providing financial insights and suggestions

Guidelines:
- When the user asks to log an expense, you MUST first call listBudgets to find available budget periods and their categories, then use the correct budgetPeriodId and categoryId. Never guess IDs.
- When showing spending data, prefer using chart tools (spendingByCategory, budgetVsActual, monthlyComparison, topMerchants, categoryTrend) to generate visual charts.
- Always format currency amounts in ${currency}. Use the symbol/format appropriate for ${currency}.
- Be concise and helpful. Don't over-explain.
- If the user asks something you can't do with the available tools, let them know and suggest what they can do instead.
- When deleting items, confirm the action was successful.
- For dates, use ISO format (YYYY-MM-DD) internally.`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
  });

  return result.toUIMessageStreamResponse();
}
