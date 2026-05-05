"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { BudgetPeriod } from "@/lib/models/budget-period";
import { Expense } from "@/lib/models/expense";
import { Types } from "mongoose";
import { auth } from "@/auth";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ── Budget Period Actions ──

export async function createBudgetPeriod(data: {
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  categories: { name: string; allocated: number; color: string }[];
}) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.create({
    userId,
    name: data.name,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    totalBudget: data.totalBudget,
    categories: data.categories.map((c) => ({
      ...c,
      spent: 0,
    })),
  });

  revalidatePath("/");
  return JSON.parse(JSON.stringify(period));
}

export async function getBudgetPeriods() {
  const userId = await requireUser();
  await connectDB();
  const periods = await BudgetPeriod.find({ userId })
    .sort({ startDate: -1 })
    .lean();
  return JSON.parse(JSON.stringify(periods));
}

export async function getBudgetPeriod(id: string) {
  const userId = await requireUser();
  await connectDB();
  const period = await BudgetPeriod.findOne({ _id: id, userId }).lean();
  if (!period) return null;
  return JSON.parse(JSON.stringify(period));
}

export async function deleteBudgetPeriod(id: string) {
  const userId = await requireUser();
  await connectDB();
  const period = await BudgetPeriod.findOne({ _id: id, userId });
  if (!period) throw new Error("Not found");
  await Expense.deleteMany({ budgetPeriodId: id });
  await BudgetPeriod.findByIdAndDelete(id);
  revalidatePath("/");
}

// ── Expense Actions ──

export async function addExpense(data: {
  budgetPeriodId: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
}) {
  const userId = await requireUser();
  await connectDB();

  // Verify ownership
  const period = await BudgetPeriod.findOne({
    _id: data.budgetPeriodId,
    userId,
  });
  if (!period) throw new Error("Not found");

  const expense = await Expense.create({
    budgetPeriodId: new Types.ObjectId(data.budgetPeriodId),
    categoryId: new Types.ObjectId(data.categoryId),
    description: data.description,
    amount: data.amount,
    date: new Date(data.date),
  });

  await BudgetPeriod.updateOne(
    { _id: data.budgetPeriodId, "categories._id": data.categoryId },
    { $inc: { "categories.$.spent": data.amount } }
  );

  revalidatePath("/");
  revalidatePath(`/budget/${data.budgetPeriodId}`);
  return JSON.parse(JSON.stringify(expense));
}

export async function getExpenses(budgetPeriodId: string, categoryId?: string) {
  const userId = await requireUser();
  await connectDB();

  // Verify ownership
  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  });
  if (!period) throw new Error("Not found");

  const filter: Record<string, unknown> = {
    budgetPeriodId: new Types.ObjectId(budgetPeriodId),
  };
  if (categoryId) {
    filter.categoryId = new Types.ObjectId(categoryId);
  }

  const expenses = await Expense.find(filter).sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(expenses));
}

export async function deleteExpense(
  expenseId: string,
  budgetPeriodId: string,
  categoryId: string,
  amount: number
) {
  const userId = await requireUser();
  await connectDB();

  // Verify ownership
  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  });
  if (!period) throw new Error("Not found");

  await Expense.findByIdAndDelete(expenseId);

  await BudgetPeriod.updateOne(
    { _id: budgetPeriodId, "categories._id": categoryId },
    { $inc: { "categories.$.spent": -amount } }
  );

  revalidatePath("/");
  revalidatePath(`/budget/${budgetPeriodId}`);
}

// ── Category Suggestions ──

const DEFAULT_CATEGORIES = [
  { name: "Housing", color: "#6366f1" },
  { name: "Food & Groceries", color: "#22c55e" },
  { name: "Transportation", color: "#f59e0b" },
  { name: "Entertainment", color: "#ec4899" },
  { name: "Health", color: "#ef4444" },
  { name: "Shopping", color: "#8b5cf6" },
  { name: "Bills & Utilities", color: "#06b6d4" },
  { name: "Savings", color: "#14b8a6" },
  { name: "Education", color: "#f97316" },
  { name: "Personal Care", color: "#a855f7" },
];

export async function getCategorySuggestions() {
  const userId = await requireUser();
  await connectDB();

  const periods = await BudgetPeriod.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const usedCategories = new Map<string, string>();
  for (const period of periods) {
    for (const cat of period.categories) {
      if (!usedCategories.has(cat.name)) {
        usedCategories.set(cat.name, cat.color);
      }
    }
  }

  if (usedCategories.size > 0) {
    return Array.from(usedCategories.entries()).map(([name, color]) => ({
      name,
      color,
    }));
  }

  return DEFAULT_CATEGORIES;
}
