import { tool } from "ai";
import { z } from "zod";
import {
  getBudgetPeriods,
  getBudgetPeriod,
  addExpense,
  searchExpenses,
  deleteExpense,
  addIncome,
  getIncomes,
  deleteIncome,
  getSavingsGoals,
  createSavingsGoal,
  addGoalContribution,
  getRecurringExpenses,
  getSpendingByCategoryReport,
  getBudgetVsActualReport,
  getMonthlyComparisonReport,
  getTopMerchantsReport,
  getCategoryTrendReport,
  getAllCategoryNames,
} from "@/lib/actions";

// ── Read Tools ──

export const listBudgets = tool({
  description:
    "List all budget periods for the user. Returns id, name, dates, totalBudget, and categories with allocated/spent amounts.",
  inputSchema: z.object({}),
  execute: async () => {
    const periods = await getBudgetPeriods();
    return { periods };
  },
});

export const getBudget = tool({
  description:
    "Get a specific budget period by ID with full category breakdown including allocated and spent amounts.",
  inputSchema: z.object({
    budgetPeriodId: z.string().describe("The budget period ID"),
  }),
  execute: async ({ budgetPeriodId }) => {
    const period = await getBudgetPeriod(budgetPeriodId);
    if (!period) return { error: "Budget period not found" };
    return { period };
  },
});

export const findExpenses = tool({
  description:
    "Search expenses across all or a specific budget period. Can filter by category, search by description text, and sort results.",
  inputSchema: z.object({
    budgetPeriodId: z
      .string()
      .optional()
      .describe("Filter by specific budget period ID"),
    query: z
      .string()
      .optional()
      .describe("Search text to match against expense descriptions"),
    sortBy: z
      .enum(["date", "amount", "description"])
      .optional()
      .describe("Sort field"),
    sortOrder: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
  }),
  execute: async (params) => {
    const expenses = await searchExpenses(params);
    return { expenses, count: expenses.length };
  },
});

export const listIncomes = tool({
  description: "List all income entries, optionally filtered by budget period.",
  inputSchema: z.object({
    budgetPeriodId: z
      .string()
      .optional()
      .describe("Filter by budget period ID"),
  }),
  execute: async ({ budgetPeriodId }) => {
    const incomes = await getIncomes(budgetPeriodId);
    return { incomes, count: incomes.length };
  },
});

export const listGoals = tool({
  description:
    "List all savings goals with their current progress, target amounts, and status.",
  inputSchema: z.object({}),
  execute: async () => {
    const goals = await getSavingsGoals();
    return { goals };
  },
});

export const listRecurring = tool({
  description:
    "List all recurring expenses with their frequency, amounts, next due dates, and status.",
  inputSchema: z.object({}),
  execute: async () => {
    const recurring = await getRecurringExpenses();
    return { recurring };
  },
});

export const listCategories = tool({
  description:
    "Get all unique category names used across all budget periods. Useful for understanding what categories are available.",
  inputSchema: z.object({}),
  execute: async () => {
    const categories = await getAllCategoryNames();
    return { categories };
  },
});

// ── Write Tools ──

export const logExpense = tool({
  description:
    "Log a new expense to a budget period under a specific category. Requires budget period ID, category ID, description, amount, and date.",
  inputSchema: z.object({
    budgetPeriodId: z.string().describe("The budget period ID to log to"),
    categoryId: z
      .string()
      .describe("The category ID within the budget period"),
    description: z.string().describe("What the expense was for"),
    amount: z.number().positive().describe("The expense amount"),
    date: z
      .string()
      .describe("The expense date in ISO format (YYYY-MM-DD)"),
  }),
  execute: async (data) => {
    const expense = await addExpense(data);
    return { success: true, expense };
  },
});

export const removeExpense = tool({
  description:
    "Delete an expense. Requires the expense ID, budget period ID, category ID, and amount (all returned by findExpenses).",
  inputSchema: z.object({
    expenseId: z.string().describe("The expense ID to delete"),
    budgetPeriodId: z
      .string()
      .describe("The budget period the expense belongs to"),
    categoryId: z.string().describe("The category ID of the expense"),
    amount: z.number().describe("The expense amount"),
  }),
  execute: async ({ expenseId, budgetPeriodId, categoryId, amount }) => {
    await deleteExpense(expenseId, budgetPeriodId, categoryId, amount);
    return { success: true };
  },
});

export const logIncome = tool({
  description:
    "Log a new income entry. Optionally link to a budget period. If no budget period specified, it auto-matches by date.",
  inputSchema: z.object({
    amount: z.number().positive().describe("Income amount"),
    date: z.string().describe("Income date in ISO format (YYYY-MM-DD)"),
    source: z.string().describe("Source of income (e.g. 'Salary', 'Freelance')"),
    note: z.string().optional().describe("Optional note"),
  }),
  execute: async (data) => {
    const income = await addIncome(data);
    return { success: true, income };
  },
});

export const removeIncome = tool({
  description: "Delete an income entry by its ID.",
  inputSchema: z.object({
    incomeId: z.string().describe("The income ID to delete"),
  }),
  execute: async ({ incomeId }) => {
    await deleteIncome(incomeId);
    return { success: true };
  },
});

export const createGoal = tool({
  description: "Create a new savings goal with a target amount and optional target date.",
  inputSchema: z.object({
    name: z.string().describe("Name of the savings goal"),
    targetAmount: z
      .number()
      .positive()
      .describe("Target amount to save"),
    currentAmount: z
      .number()
      .optional()
      .describe("Starting amount already saved"),
    targetDate: z
      .string()
      .optional()
      .describe("Target date in ISO format (YYYY-MM-DD)"),
  }),
  execute: async (data) => {
    const goal = await createSavingsGoal(data);
    return { success: true, goal };
  },
});

export const contributeToGoal = tool({
  description: "Add a contribution to a savings goal.",
  inputSchema: z.object({
    goalId: z.string().describe("The savings goal ID"),
    amount: z.number().positive().describe("Contribution amount"),
    note: z.string().optional().describe("Optional note for the contribution"),
  }),
  execute: async ({ goalId, amount, note }) => {
    const contribution = await addGoalContribution({
      goalId,
      amount,
      date: new Date().toISOString().split("T")[0],
      note,
    });
    return { success: true, contribution };
  },
});

// ── Chart/Report Tools ──

export const spendingByCategory = tool({
  description:
    "Get spending breakdown by category for a budget period. Returns data suitable for rendering a pie chart.",
  inputSchema: z.object({
    budgetPeriodId: z.string().describe("The budget period ID"),
  }),
  execute: async ({ budgetPeriodId }) => {
    const report = await getSpendingByCategoryReport(budgetPeriodId);
    return { type: "pie" as const, ...report };
  },
});

export const budgetVsActual = tool({
  description:
    "Compare budgeted vs actual spending per category for a budget period. Returns data suitable for rendering a bar chart.",
  inputSchema: z.object({
    budgetPeriodId: z.string().describe("The budget period ID"),
  }),
  execute: async ({ budgetPeriodId }) => {
    const report = await getBudgetVsActualReport(budgetPeriodId);
    return { type: "bar" as const, ...report };
  },
});

export const monthlyComparison = tool({
  description:
    "Get monthly spending comparison across the last 12 budget periods. Returns data suitable for a line chart showing budget vs spent over time.",
  inputSchema: z.object({}),
  execute: async () => {
    const data = await getMonthlyComparisonReport();
    return { type: "line" as const, data };
  },
});

export const topMerchants = tool({
  description:
    "Get the top merchants/descriptions by total spend. Optionally filter by budget period. Returns data suitable for a horizontal bar chart.",
  inputSchema: z.object({
    budgetPeriodId: z
      .string()
      .optional()
      .describe("Filter by budget period ID, or omit for all-time"),
  }),
  execute: async ({ budgetPeriodId }) => {
    const merchants = await getTopMerchantsReport(budgetPeriodId);
    return { type: "horizontalBar" as const, merchants };
  },
});

export const categoryTrend = tool({
  description:
    "Get spending trend for a specific category across all budget periods over time. Returns data suitable for a line chart.",
  inputSchema: z.object({
    categoryName: z.string().describe("The category name to track"),
  }),
  execute: async ({ categoryName }) => {
    const data = await getCategoryTrendReport(categoryName);
    return { type: "trend" as const, categoryName, data };
  },
});

// ── All tools ──

export const tools = {
  listBudgets,
  getBudget,
  findExpenses,
  listIncomes,
  listGoals,
  listRecurring,
  listCategories,
  logExpense,
  removeExpense,
  logIncome,
  removeIncome,
  createGoal,
  contributeToGoal,
  spendingByCategory,
  budgetVsActual,
  monthlyComparison,
  topMerchants,
  categoryTrend,
};
