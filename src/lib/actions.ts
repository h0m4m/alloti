"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { BudgetPeriod, type IBudgetPeriod } from "@/lib/models/budget-period";
import { Expense } from "@/lib/models/expense";
import { BudgetTemplate } from "@/lib/models/budget-template";
import { CategoryTransfer } from "@/lib/models/category-transfer";
import { RecurringExpense } from "@/lib/models/recurring-expense";
import { Income } from "@/lib/models/income";
import { SavingsGoal } from "@/lib/models/savings-goal";
import { GoalContribution } from "@/lib/models/goal-contribution";
import { NotificationPreference } from "@/lib/models/notification-preference";
import { CategoryRule } from "@/lib/models/category-rule";
import { ExpenseAttachment } from "@/lib/models/expense-attachment";
import { UserPreferences } from "@/lib/models/user-preferences";
import { BudgetRollover } from "@/lib/models/budget-rollover";
import { ChatConversation } from "@/lib/models/chat-conversation";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { formatCurrency, setCurrencyCode } from "@/lib/format";
import type {
  RecurringFrequency,
  AppNotification,
  MatchType,
  CategorySuggestion,
  RolloverAction,
  UserPreferencesData,
} from "@/lib/types";

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
  await CategoryTransfer.deleteMany({ budgetPeriodId: id });
  await BudgetPeriod.findByIdAndDelete(id);
  revalidatePath("/");
}

// ── Update Budget ──

export async function updateBudgetPeriod(
  id: string,
  data: {
    name: string;
    startDate: string;
    endDate: string;
    totalBudget: number;
    categories: {
      _id?: string;
      name: string;
      allocated: number;
      color: string;
    }[];
  }
) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({ _id: id, userId });
  if (!period) throw new Error("Not found");

  // Build a map of existing category IDs to their spent amounts
  const existingSpent = new Map<string, number>();
  for (const cat of period.categories) {
    existingSpent.set(cat._id.toString(), cat.spent);
  }

  period.name = data.name;
  period.startDate = new Date(data.startDate);
  period.endDate = new Date(data.endDate);
  period.totalBudget = data.totalBudget;
  period.categories = data.categories.map((c) => ({
    ...(c._id ? { _id: c._id } : {}),
    name: c.name,
    allocated: c.allocated,
    color: c.color,
    // Preserve spent for existing categories, 0 for new ones
    spent: c._id ? (existingSpent.get(c._id) ?? 0) : 0,
  }));

  await period.save();
  revalidatePath("/");
  revalidatePath(`/budget/${id}`);
  return JSON.parse(JSON.stringify(period));
}

// ── Duplicate Budget ──

export async function duplicateBudgetPeriod(
  sourceId: string,
  data: {
    name: string;
    startDate: string;
    endDate: string;
    totalBudget: number;
  }
) {
  const userId = await requireUser();
  await connectDB();

  const source = await BudgetPeriod.findOne({ _id: sourceId, userId }).lean<IBudgetPeriod>();
  if (!source) throw new Error("Not found");

  const period = await BudgetPeriod.create({
    userId,
    name: data.name,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    totalBudget: data.totalBudget,
    categories: source.categories.map((c) => ({
      name: c.name,
      allocated: c.allocated,
      spent: 0,
      color: c.color,
    })),
  });

  revalidatePath("/");
  return JSON.parse(JSON.stringify(period));
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

export async function searchExpenses(params: {
  budgetPeriodId?: string;
  categoryId?: string;
  query?: string;
  sortBy?: "date" | "amount" | "description";
  sortOrder?: "asc" | "desc";
}) {
  const userId = await requireUser();
  await connectDB();

  // If a specific budget period is given, verify ownership
  if (params.budgetPeriodId) {
    const period = await BudgetPeriod.findOne({
      _id: params.budgetPeriodId,
      userId,
    });
    if (!period) throw new Error("Not found");
  }

  // Get all user's budget period IDs for filtering
  const userPeriods = await BudgetPeriod.find({ userId })
    .select("_id")
    .lean();
  const periodIds = userPeriods.map((p) => p._id);

  const filter: Record<string, unknown> = {
    budgetPeriodId: params.budgetPeriodId
      ? new Types.ObjectId(params.budgetPeriodId)
      : { $in: periodIds },
  };

  if (params.categoryId) {
    filter.categoryId = new Types.ObjectId(params.categoryId);
  }

  if (params.query) {
    filter.description = { $regex: params.query, $options: "i" };
  }

  const sortField = params.sortBy || "date";
  const sortDir = params.sortOrder === "asc" ? 1 : -1;

  const expenses = await Expense.find(filter)
    .sort({ [sortField]: sortDir })
    .limit(100)
    .lean();
  return JSON.parse(JSON.stringify(expenses));
}

export async function updateExpense(data: {
  expenseId: string;
  budgetPeriodId: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  oldCategoryId: string;
  oldAmount: number;
}) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({
    _id: data.budgetPeriodId,
    userId,
  });
  if (!period) throw new Error("Not found");

  await Expense.findByIdAndUpdate(data.expenseId, {
    categoryId: new Types.ObjectId(data.categoryId),
    description: data.description,
    amount: data.amount,
    date: new Date(data.date),
  });

  // Reverse old category spent
  await BudgetPeriod.updateOne(
    { _id: data.budgetPeriodId, "categories._id": data.oldCategoryId },
    { $inc: { "categories.$.spent": -data.oldAmount } }
  );

  // Apply new category spent
  await BudgetPeriod.updateOne(
    { _id: data.budgetPeriodId, "categories._id": data.categoryId },
    { $inc: { "categories.$.spent": data.amount } }
  );

  revalidatePath("/");
  revalidatePath(`/budget/${data.budgetPeriodId}`);
  revalidatePath("/expenses");
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
  await ExpenseAttachment.deleteMany({
    expenseId: new Types.ObjectId(expenseId),
  });

  await BudgetPeriod.updateOne(
    { _id: budgetPeriodId, "categories._id": categoryId },
    { $inc: { "categories.$.spent": -amount } }
  );

  revalidatePath("/");
  revalidatePath(`/budget/${budgetPeriodId}`);
}

// ── Expense Attachment Actions ──

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

export async function addExpenseAttachment(data: {
  expenseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string; // base64 data URL
}) {
  const userId = await requireUser();
  await connectDB();

  if (!ALLOWED_FILE_TYPES.includes(data.fileType)) {
    throw new Error("File type not supported. Use JPEG, PNG, WebP, HEIC, or PDF.");
  }
  if (data.fileSize > MAX_ATTACHMENT_SIZE) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  // Verify the expense belongs to user (via budget period)
  const expense = await Expense.findById(data.expenseId).lean();
  if (!expense) throw new Error("Expense not found");

  const period = await BudgetPeriod.findOne({
    _id: expense.budgetPeriodId,
    userId,
  });
  if (!period) throw new Error("Not found");

  const attachment = await ExpenseAttachment.create({
    userId,
    expenseId: new Types.ObjectId(data.expenseId),
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize,
    data: data.data,
  });

  // Mark expense as having an attachment
  await Expense.findByIdAndUpdate(data.expenseId, {
    $set: { hasAttachment: true },
  });

  const budgetPeriodId = String(expense.budgetPeriodId);
  revalidatePath(`/budget/${budgetPeriodId}`);
  revalidatePath("/expenses");
  return JSON.parse(
    JSON.stringify({
      _id: attachment._id,
      expenseId: attachment.expenseId,
      fileName: attachment.fileName,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      createdAt: attachment.createdAt,
    })
  );
}

export async function getExpenseAttachments(expenseId: string) {
  const userId = await requireUser();
  await connectDB();

  const attachments = await ExpenseAttachment.find({
    expenseId: new Types.ObjectId(expenseId),
    userId,
  })
    .select("_id expenseId fileName fileType fileSize data createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(attachments));
}

export async function deleteExpenseAttachment(attachmentId: string) {
  const userId = await requireUser();
  await connectDB();

  const attachment = await ExpenseAttachment.findOne({
    _id: attachmentId,
    userId,
  });
  if (!attachment) throw new Error("Not found");

  const expenseId = String(attachment.expenseId);
  await ExpenseAttachment.findByIdAndDelete(attachmentId);

  // Check if expense still has other attachments
  const remaining = await ExpenseAttachment.countDocuments({
    expenseId: new Types.ObjectId(expenseId),
  });
  if (remaining === 0) {
    await Expense.findByIdAndUpdate(expenseId, {
      $set: { hasAttachment: false },
    });
  }

  // Get the budget period for revalidation
  const expense = await Expense.findById(expenseId).lean();
  if (expense) {
    revalidatePath(`/budget/${expense.budgetPeriodId}`);
  }
  revalidatePath("/expenses");
}

// ── Category Transfer Actions ──

export async function transferBetweenCategories(data: {
  budgetPeriodId: string;
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
  note?: string;
}) {
  const userId = await requireUser();
  await connectDB();

  if (data.fromCategoryId === data.toCategoryId) {
    throw new Error("Cannot transfer to the same category");
  }
  if (data.amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const period = await BudgetPeriod.findOne({
    _id: data.budgetPeriodId,
    userId,
  });
  if (!period) throw new Error("Not found");

  // Decrease source allocation, increase destination allocation
  await BudgetPeriod.updateOne(
    { _id: data.budgetPeriodId, "categories._id": data.fromCategoryId },
    { $inc: { "categories.$.allocated": -data.amount } }
  );
  await BudgetPeriod.updateOne(
    { _id: data.budgetPeriodId, "categories._id": data.toCategoryId },
    { $inc: { "categories.$.allocated": data.amount } }
  );

  await CategoryTransfer.create({
    userId,
    budgetPeriodId: new Types.ObjectId(data.budgetPeriodId),
    fromCategoryId: new Types.ObjectId(data.fromCategoryId),
    toCategoryId: new Types.ObjectId(data.toCategoryId),
    amount: data.amount,
    note: data.note || "",
  });

  revalidatePath(`/budget/${data.budgetPeriodId}`);
  revalidatePath("/");
}

export async function getTransferHistory(budgetPeriodId: string) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  });
  if (!period) throw new Error("Not found");

  const transfers = await CategoryTransfer.find({
    budgetPeriodId: new Types.ObjectId(budgetPeriodId),
    userId,
  })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(transfers));
}

// ── Budget Template Actions ──

export async function createBudgetTemplate(data: {
  name: string;
  description?: string;
  categories: { name: string; defaultAmount: number; color: string }[];
}) {
  const userId = await requireUser();
  await connectDB();

  const template = await BudgetTemplate.create({
    userId,
    name: data.name,
    description: data.description || "",
    categories: data.categories.map((c, i) => ({
      ...c,
      defaultPercentage: null,
      sortOrder: i,
    })),
  });

  revalidatePath("/budget/new");
  return JSON.parse(JSON.stringify(template));
}

export async function saveAsTemplate(
  budgetPeriodId: string,
  templateName: string
) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  }).lean<IBudgetPeriod>();
  if (!period) throw new Error("Not found");

  const template = await BudgetTemplate.create({
    userId,
    name: templateName,
    description: `Created from ${period.name}`,
    categories: period.categories.map((c, i) => ({
      name: c.name,
      defaultAmount: c.allocated,
      defaultPercentage: null,
      color: c.color,
      sortOrder: i,
    })),
  });

  revalidatePath("/budget/new");
  return JSON.parse(JSON.stringify(template));
}

export async function getBudgetTemplates() {
  const userId = await requireUser();
  await connectDB();
  const templates = await BudgetTemplate.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(templates));
}

export async function deleteBudgetTemplate(id: string) {
  const userId = await requireUser();
  await connectDB();
  const template = await BudgetTemplate.findOne({ _id: id, userId });
  if (!template) throw new Error("Not found");
  await BudgetTemplate.findByIdAndDelete(id);
  revalidatePath("/budget/new");
}

// ── Budget Review Data ──

export async function getBudgetReview(budgetPeriodId: string) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  }).lean<IBudgetPeriod>();
  if (!period) throw new Error("Not found");

  const expenses = await Expense.find({
    budgetPeriodId: new Types.ObjectId(budgetPeriodId),
  })
    .sort({ date: -1 })
    .lean();

  const transfers = await CategoryTransfer.find({
    budgetPeriodId: new Types.ObjectId(budgetPeriodId),
    userId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const totalSpent = period.categories.reduce(
    (sum: number, c) => sum + c.spent,
    0
  );
  const totalAllocated = period.categories.reduce(
    (sum: number, c) => sum + c.allocated,
    0
  );
  const remaining = period.totalBudget - totalSpent;
  const unallocated = period.totalBudget - totalAllocated;

  // Merchant breakdown
  const merchantMap = new Map<string, { total: number; count: number }>();
  for (const exp of expenses) {
    const key = exp.description;
    const entry = merchantMap.get(key) || { total: 0, count: 0 };
    entry.total += exp.amount;
    entry.count += 1;
    merchantMap.set(key, entry);
  }
  const topMerchants = Array.from(merchantMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Overspent categories
  const overspentCategories = period.categories
    .filter((c) => c.spent > c.allocated)
    .map((c) => ({
      _id: String(c._id),
      name: c.name,
      allocated: c.allocated,
      spent: c.spent,
      over: c.spent - c.allocated,
      color: c.color,
    }));

  const incomes = await Income.find({
    userId,
    budgetPeriodId: new Types.ObjectId(budgetPeriodId),
  }).lean();
  const totalIncome = incomes.reduce(
    (sum: number, i) => sum + (i.amount as number),
    0
  );

  return JSON.parse(
    JSON.stringify({
      period,
      expenses,
      transfers,
      totalSpent,
      totalAllocated,
      remaining,
      unallocated,
      topMerchants,
      overspentCategories,
      expenseCount: expenses.length,
      totalIncome,
      incomeCount: incomes.length,
    })
  );
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

// ── Recurring Expense Actions ──

function computeNextDueDate(
  from: Date,
  frequency: RecurringFrequency
): Date {
  const d = new Date(from);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

export async function createRecurringExpense(data: {
  name: string;
  amount: number;
  categoryName: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
}) {
  const userId = await requireUser();
  await connectDB();

  const startDate = new Date(data.startDate);
  const now = new Date();
  // If start is in the past, the next due is the start date itself
  // Otherwise it's the start date
  let nextDue = startDate;
  while (nextDue < now) {
    nextDue = computeNextDueDate(nextDue, data.frequency);
  }

  const recurring = await RecurringExpense.create({
    userId,
    name: data.name,
    amount: data.amount,
    categoryName: data.categoryName,
    frequency: data.frequency,
    startDate,
    endDate: data.endDate ? new Date(data.endDate) : null,
    nextDueDate: nextDue,
    status: "active",
  });

  revalidatePath("/recurring");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(recurring));
}

export async function getRecurringExpenses() {
  const userId = await requireUser();
  await connectDB();
  const items = await RecurringExpense.find({ userId })
    .sort({ nextDueDate: 1 })
    .lean();
  return JSON.parse(JSON.stringify(items));
}

export async function toggleRecurringExpenseStatus(id: string) {
  const userId = await requireUser();
  await connectDB();

  const item = await RecurringExpense.findOne({ _id: id, userId });
  if (!item) throw new Error("Not found");

  item.status = item.status === "active" ? "paused" : "active";
  await item.save();

  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function markRecurringExpensePaid(
  id: string,
  budgetPeriodId?: string,
  categoryId?: string
) {
  const userId = await requireUser();
  await connectDB();

  const item = await RecurringExpense.findOne({ _id: id, userId });
  if (!item) throw new Error("Not found");

  // If budget & category provided, create an actual expense
  if (budgetPeriodId && categoryId) {
    const period = await BudgetPeriod.findOne({
      _id: budgetPeriodId,
      userId,
    });
    if (period) {
      await Expense.create({
        budgetPeriodId: new Types.ObjectId(budgetPeriodId),
        categoryId: new Types.ObjectId(categoryId),
        description: item.name,
        amount: item.amount,
        date: item.nextDueDate,
      });

      await BudgetPeriod.updateOne(
        { _id: budgetPeriodId, "categories._id": categoryId },
        { $inc: { "categories.$.spent": item.amount } }
      );

      revalidatePath(`/budget/${budgetPeriodId}`);
    }
  }

  // Advance next due date
  item.nextDueDate = computeNextDueDate(item.nextDueDate, item.frequency);

  // If end date exists and next due is past it, pause
  if (item.endDate && item.nextDueDate > item.endDate) {
    item.status = "paused";
  }

  await item.save();
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function deleteRecurringExpense(id: string) {
  const userId = await requireUser();
  await connectDB();
  const item = await RecurringExpense.findOne({ _id: id, userId });
  if (!item) throw new Error("Not found");
  await RecurringExpense.findByIdAndDelete(id);
  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function getUpcomingRecurring(daysAhead: number = 7) {
  const userId = await requireUser();
  await connectDB();

  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const items = await RecurringExpense.find({
    userId,
    status: "active",
    nextDueDate: { $lte: cutoff },
  })
    .sort({ nextDueDate: 1 })
    .lean();

  return JSON.parse(JSON.stringify(items));
}

// ── Income Actions ──

export async function addIncome(data: {
  amount: number;
  date: string;
  source: string;
  note?: string;
  budgetPeriodId?: string;
}) {
  const userId = await requireUser();
  await connectDB();

  // Auto-match to budget period by date if not provided
  let matchedPeriodId = data.budgetPeriodId || null;
  if (!matchedPeriodId) {
    const incomeDate = new Date(data.date);
    const matchedPeriod = await BudgetPeriod.findOne({
      userId,
      startDate: { $lte: incomeDate },
      endDate: { $gte: incomeDate },
    }).lean();
    if (matchedPeriod) {
      matchedPeriodId = String(matchedPeriod._id);
    }
  }

  const income = await Income.create({
    userId,
    budgetPeriodId: matchedPeriodId
      ? new Types.ObjectId(matchedPeriodId)
      : null,
    amount: data.amount,
    date: new Date(data.date),
    source: data.source,
    note: data.note || "",
  });

  revalidatePath("/income");
  revalidatePath("/");
  if (matchedPeriodId) {
    revalidatePath(`/budget/${matchedPeriodId}`);
  }
  return JSON.parse(JSON.stringify(income));
}

export async function getIncomes(budgetPeriodId?: string) {
  const userId = await requireUser();
  await connectDB();

  const filter: Record<string, unknown> = { userId };
  if (budgetPeriodId) {
    filter.budgetPeriodId = new Types.ObjectId(budgetPeriodId);
  }

  const incomes = await Income.find(filter).sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(incomes));
}

export async function deleteIncome(id: string) {
  const userId = await requireUser();
  await connectDB();
  const item = await Income.findOne({ _id: id, userId });
  if (!item) throw new Error("Not found");
  await Income.findByIdAndDelete(id);
  revalidatePath("/income");
  revalidatePath("/");
  if (item.budgetPeriodId) {
    revalidatePath(`/budget/${item.budgetPeriodId}`);
  }
}

export async function getIncomeSummary(budgetPeriodId: string) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  }).lean<IBudgetPeriod>();
  if (!period) throw new Error("Not found");

  const incomes = await Income.find({
    userId,
    budgetPeriodId: new Types.ObjectId(budgetPeriodId),
  }).lean();

  const totalIncome = incomes.reduce(
    (sum: number, i) => sum + (i.amount as number),
    0
  );
  const budgetedAmount = period.totalBudget;
  const unbudgetedIncome = totalIncome - budgetedAmount;

  return JSON.parse(
    JSON.stringify({
      totalIncome,
      budgetedAmount,
      unbudgetedIncome,
      incomeCount: incomes.length,
      incomes,
    })
  );
}

// ── Savings Goal Actions ──

export async function createSavingsGoal(data: {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
}) {
  const userId = await requireUser();
  await connectDB();

  const goal = await SavingsGoal.create({
    userId,
    name: data.name,
    targetAmount: data.targetAmount,
    currentAmount: data.currentAmount || 0,
    targetDate: data.targetDate ? new Date(data.targetDate) : null,
    status: (data.currentAmount || 0) > 0 ? "in_progress" : "not_started",
  });

  revalidatePath("/goals");
  revalidatePath("/");
  return JSON.parse(JSON.stringify(goal));
}

export async function getSavingsGoals() {
  const userId = await requireUser();
  await connectDB();
  const goals = await SavingsGoal.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(goals));
}

export async function getSavingsGoalWithContributions(goalId: string) {
  const userId = await requireUser();
  await connectDB();

  const goal = await SavingsGoal.findOne({ _id: goalId, userId }).lean();
  if (!goal) return null;

  const contributions = await GoalContribution.find({
    goalId: new Types.ObjectId(goalId),
    userId,
  })
    .sort({ date: -1 })
    .lean();

  return JSON.parse(JSON.stringify({ goal, contributions }));
}

export async function addGoalContribution(data: {
  goalId: string;
  amount: number;
  date: string;
  note?: string;
  sourceBudgetPeriodId?: string;
}) {
  const userId = await requireUser();
  await connectDB();

  const goal = await SavingsGoal.findOne({ _id: data.goalId, userId });
  if (!goal) throw new Error("Not found");

  await GoalContribution.create({
    userId,
    goalId: new Types.ObjectId(data.goalId),
    sourceBudgetPeriodId: data.sourceBudgetPeriodId
      ? new Types.ObjectId(data.sourceBudgetPeriodId)
      : null,
    amount: data.amount,
    date: new Date(data.date),
    note: data.note || "",
  });

  goal.currentAmount += data.amount;
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = "completed";
  } else if (goal.currentAmount > 0) {
    goal.status = "in_progress";
  }
  await goal.save();

  revalidatePath("/goals");
  revalidatePath(`/goals/${data.goalId}`);
  revalidatePath("/");
}

export async function deleteSavingsGoal(id: string) {
  const userId = await requireUser();
  await connectDB();
  const goal = await SavingsGoal.findOne({ _id: id, userId });
  if (!goal) throw new Error("Not found");
  await GoalContribution.deleteMany({ goalId: id });
  await SavingsGoal.findByIdAndDelete(id);
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function toggleGoalPause(id: string) {
  const userId = await requireUser();
  await connectDB();

  const goal = await SavingsGoal.findOne({ _id: id, userId });
  if (!goal) throw new Error("Not found");

  if (goal.status === "paused") {
    goal.status = goal.currentAmount > 0 ? "in_progress" : "not_started";
  } else if (goal.status !== "completed") {
    goal.status = "paused";
  }
  await goal.save();

  revalidatePath("/goals");
  revalidatePath("/");
}

// ── Reports ──

export async function getSpendingByCategoryReport(budgetPeriodId: string) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  }).lean<IBudgetPeriod>();
  if (!period) throw new Error("Not found");

  const totalSpent = period.categories.reduce(
    (sum: number, c) => sum + c.spent,
    0
  );

  const categories = period.categories.map((c) => ({
    _id: String(c._id),
    name: c.name,
    color: c.color,
    allocated: c.allocated,
    spent: c.spent,
    percentage: totalSpent > 0 ? Math.round((c.spent / totalSpent) * 100) : 0,
  }));

  // Sort by spent descending
  categories.sort((a, b) => b.spent - a.spent);

  return JSON.parse(
    JSON.stringify({
      periodName: period.name,
      totalSpent,
      totalBudget: period.totalBudget,
      categories,
    })
  );
}

export async function getBudgetVsActualReport(budgetPeriodId: string) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  }).lean<IBudgetPeriod>();
  if (!period) throw new Error("Not found");

  const categories = period.categories.map((c) => ({
    _id: String(c._id),
    name: c.name,
    color: c.color,
    planned: c.allocated,
    actual: c.spent,
    difference: c.allocated - c.spent,
  }));

  const totalPlanned = period.categories.reduce(
    (sum: number, c) => sum + c.allocated,
    0
  );
  const totalActual = period.categories.reduce(
    (sum: number, c) => sum + c.spent,
    0
  );

  return JSON.parse(
    JSON.stringify({
      periodName: period.name,
      totalPlanned,
      totalActual,
      totalDifference: totalPlanned - totalActual,
      categories,
    })
  );
}

export async function getMonthlyComparisonReport() {
  const userId = await requireUser();
  await connectDB();

  const periods = await BudgetPeriod.find({ userId })
    .sort({ startDate: -1 })
    .limit(12)
    .lean<IBudgetPeriod[]>();

  const comparison = periods.reverse().map((p) => {
    const spent = p.categories.reduce(
      (sum: number, c) => sum + c.spent,
      0
    );
    return {
      _id: String(p._id),
      name: p.name,
      startDate: p.startDate,
      budget: p.totalBudget,
      spent,
      remaining: p.totalBudget - spent,
    };
  });

  return JSON.parse(JSON.stringify(comparison));
}

export async function getTopMerchantsReport(budgetPeriodId?: string) {
  const userId = await requireUser();
  await connectDB();

  let periodIds: Types.ObjectId[];
  if (budgetPeriodId) {
    const period = await BudgetPeriod.findOne({
      _id: budgetPeriodId,
      userId,
    });
    if (!period) throw new Error("Not found");
    periodIds = [new Types.ObjectId(budgetPeriodId)];
  } else {
    const periods = await BudgetPeriod.find({ userId }).select("_id").lean();
    periodIds = periods.map((p) => p._id as Types.ObjectId);
  }

  const expenses = await Expense.find({
    budgetPeriodId: { $in: periodIds },
  }).lean();

  const merchantMap = new Map<string, { total: number; count: number }>();
  for (const exp of expenses) {
    const key = exp.description as string;
    const entry = merchantMap.get(key) || { total: 0, count: 0 };
    entry.total += exp.amount as number;
    entry.count += 1;
    merchantMap.set(key, entry);
  }

  const merchants = Array.from(merchantMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return JSON.parse(JSON.stringify(merchants));
}

export async function getCategoryTrendReport(categoryName: string) {
  const userId = await requireUser();
  await connectDB();

  const periods = await BudgetPeriod.find({ userId })
    .sort({ startDate: 1 })
    .lean<IBudgetPeriod[]>();

  const dataPoints = [];
  for (const p of periods) {
    const cat = p.categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (cat) {
      dataPoints.push({
        periodId: String(p._id),
        periodName: p.name,
        startDate: p.startDate,
        allocated: cat.allocated,
        spent: cat.spent,
      });
    }
  }

  return JSON.parse(JSON.stringify(dataPoints));
}

export async function getAllCategoryNames() {
  const userId = await requireUser();
  await connectDB();

  const periods = await BudgetPeriod.find({ userId })
    .select("categories.name categories.color")
    .lean<IBudgetPeriod[]>();

  const categoryMap = new Map<string, string>();
  for (const p of periods) {
    for (const c of p.categories) {
      if (!categoryMap.has(c.name)) {
        categoryMap.set(c.name, c.color);
      }
    }
  }

  return Array.from(categoryMap.entries())
    .map(([name, color]) => ({ name, color }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ── Category Rule Actions ──

export async function createCategoryRule(data: {
  keyword: string;
  categoryName: string;
  matchType: MatchType;
}) {
  const userId = await requireUser();
  await connectDB();

  if (!data.keyword.trim() || !data.categoryName.trim()) {
    throw new Error("Keyword and category name are required");
  }

  const rule = await CategoryRule.create({
    userId,
    keyword: data.keyword.trim().toLowerCase(),
    categoryName: data.categoryName.trim(),
    matchType: data.matchType,
  });

  revalidatePath("/");
  return JSON.parse(JSON.stringify(rule));
}

export async function getCategoryRules() {
  const userId = await requireUser();
  await connectDB();
  const rules = await CategoryRule.find({ userId })
    .sort({ keyword: 1 })
    .lean();
  return JSON.parse(JSON.stringify(rules));
}

export async function updateCategoryRule(
  id: string,
  data: {
    keyword?: string;
    categoryName?: string;
    matchType?: MatchType;
  }
) {
  const userId = await requireUser();
  await connectDB();

  const rule = await CategoryRule.findOne({ _id: id, userId });
  if (!rule) throw new Error("Not found");

  const update: Record<string, unknown> = {};
  if (data.keyword !== undefined) update.keyword = data.keyword.trim().toLowerCase();
  if (data.categoryName !== undefined) update.categoryName = data.categoryName.trim();
  if (data.matchType !== undefined) update.matchType = data.matchType;

  await CategoryRule.findByIdAndUpdate(id, { $set: update });
  revalidatePath("/");
}

export async function deleteCategoryRule(id: string) {
  const userId = await requireUser();
  await connectDB();
  const rule = await CategoryRule.findOne({ _id: id, userId });
  if (!rule) throw new Error("Not found");
  await CategoryRule.findByIdAndDelete(id);
  revalidatePath("/");
}

export async function suggestCategory(
  description: string,
  budgetPeriodId: string
): Promise<CategorySuggestion | null> {
  const userId = await requireUser();
  await connectDB();

  const desc = description.trim().toLowerCase();
  if (!desc) return null;

  // 1. Check user-defined rules (highest priority)
  const rules = await CategoryRule.find({ userId }).lean();

  for (const rule of rules) {
    const keyword = (rule.keyword as string).toLowerCase();
    let matched = false;

    switch (rule.matchType) {
      case "exact":
        matched = desc === keyword;
        break;
      case "starts_with":
        matched = desc.startsWith(keyword);
        break;
      case "contains":
      default:
        matched = desc.includes(keyword);
        break;
    }

    if (matched) {
      return {
        categoryName: rule.categoryName as string,
        reason: `Suggested ${rule.categoryName} because "${rule.keyword}" matches your rule.`,
        ruleId: String(rule._id),
      };
    }
  }

  // 2. Learn from expense history — find the most common category for similar descriptions
  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  }).lean<IBudgetPeriod>();
  if (!period) return null;

  // Get all user's budget period IDs
  const userPeriods = await BudgetPeriod.find({ userId })
    .select("_id categories")
    .lean<IBudgetPeriod[]>();
  const periodIds = userPeriods.map((p) => p._id);

  // Build category ID → name map across all periods
  const catMap = new Map<string, string>();
  for (const p of userPeriods) {
    for (const c of p.categories) {
      catMap.set(String(c._id), c.name);
    }
  }

  // Find past expenses with similar descriptions
  const pastExpenses = await Expense.find({
    budgetPeriodId: { $in: periodIds },
    description: { $regex: desc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
  })
    .select("categoryId")
    .limit(50)
    .lean();

  if (pastExpenses.length === 0) return null;

  // Count occurrences per category
  const catCounts = new Map<string, number>();
  for (const exp of pastExpenses) {
    const catId = String(exp.categoryId);
    catCounts.set(catId, (catCounts.get(catId) || 0) + 1);
  }

  // Find the most common category
  let topCatId = "";
  let topCount = 0;
  for (const [catId, count] of catCounts) {
    if (count > topCount) {
      topCatId = catId;
      topCount = count;
    }
  }

  const topCatName = catMap.get(topCatId);
  if (!topCatName) return null;

  // Only suggest if there's a clear pattern (2+ occurrences)
  if (topCount < 2) return null;

  return {
    categoryName: topCatName,
    reason: `Suggested ${topCatName} because you categorized "${description}" there ${topCount} times before.`,
  };
}

export async function learnCategoryRulesFromHistory() {
  const userId = await requireUser();
  await connectDB();

  // Get all user budget periods with categories
  const periods = await BudgetPeriod.find({ userId })
    .select("_id categories")
    .lean<IBudgetPeriod[]>();
  const periodIds = periods.map((p) => p._id);

  // Build category ID → name map
  const catMap = new Map<string, string>();
  for (const p of periods) {
    for (const c of p.categories) {
      catMap.set(String(c._id), c.name);
    }
  }

  // Get all expenses
  const expenses = await Expense.find({
    budgetPeriodId: { $in: periodIds },
  })
    .select("description categoryId")
    .lean();

  // Group by description → category counts
  const descMap = new Map<string, Map<string, number>>();
  for (const exp of expenses) {
    const desc = (exp.description as string).trim().toLowerCase();
    if (!desc) continue;
    if (!descMap.has(desc)) descMap.set(desc, new Map());
    const counts = descMap.get(desc)!;
    const catId = String(exp.categoryId);
    counts.set(catId, (counts.get(catId) || 0) + 1);
  }

  // Get existing rules to avoid duplicates
  const existingRules = await CategoryRule.find({ userId }).lean();
  const existingKeywords = new Set(
    existingRules.map((r) => (r.keyword as string).toLowerCase())
  );

  // Create rules for descriptions that are consistently categorized (3+ times, 80%+ same category)
  const newRules: { keyword: string; categoryName: string; matchType: MatchType }[] = [];

  for (const [desc, counts] of descMap) {
    if (existingKeywords.has(desc)) continue;

    let totalCount = 0;
    let topCatId = "";
    let topCount = 0;

    for (const [catId, count] of counts) {
      totalCount += count;
      if (count > topCount) {
        topCatId = catId;
        topCount = count;
      }
    }

    // Only create rule if 3+ occurrences and 80%+ consistency
    if (totalCount >= 3 && topCount / totalCount >= 0.8) {
      const catName = catMap.get(topCatId);
      if (catName) {
        newRules.push({
          keyword: desc,
          categoryName: catName,
          matchType: "contains",
        });
      }
    }
  }

  if (newRules.length > 0) {
    await CategoryRule.insertMany(
      newRules.map((r) => ({ userId, ...r }))
    );
    revalidatePath("/");
  }

  return newRules.length;
}

// ── Notification Actions ──

export async function getNotificationPreferences() {
  const userId = await requireUser();
  await connectDB();

  let prefs = await NotificationPreference.findOne({ userId }).lean();
  if (!prefs) {
    prefs = await NotificationPreference.create({ userId });
    prefs = await NotificationPreference.findOne({ userId }).lean();
  }

  return JSON.parse(JSON.stringify(prefs));
}

export async function updateNotificationPreferences(data: {
  categoryNearLimit?: boolean;
  categoryOverBudget?: boolean;
  budgetNearEnd?: boolean;
  recurringExpenseDue?: boolean;
  uncategorizedCleanup?: boolean;
  goalProgressReminder?: boolean;
  endOfPeriodReview?: boolean;
}) {
  const userId = await requireUser();
  await connectDB();

  await NotificationPreference.findOneAndUpdate(
    { userId },
    { $set: data },
    { upsert: true }
  );

  revalidatePath("/");
}

export async function generateNotifications(): Promise<AppNotification[]> {
  const userId = await requireUser();
  await connectDB();

  // Set currency for formatCurrency calls
  const userPrefs = await UserPreferences.findOne({ userId }).lean();
  if (userPrefs?.defaultCurrency) {
    setCurrencyCode(userPrefs.defaultCurrency as string);
  }

  // Load preferences (create defaults if missing)
  let prefs = await NotificationPreference.findOne({ userId }).lean();
  if (!prefs) {
    await NotificationPreference.create({ userId });
    prefs = await NotificationPreference.findOne({ userId }).lean();
  }

  const notifications: AppNotification[] = [];
  const now = new Date();

  // Get active budget periods
  const periods = await BudgetPeriod.find({
    userId,
    endDate: { $gte: now },
    startDate: { $lte: now },
  }).lean<IBudgetPeriod[]>();

  for (const period of periods) {
    const periodId = String(period._id);
    const totalSpent = period.categories.reduce(
      (sum: number, c) => sum + c.spent,
      0
    );
    const totalAllocated = period.categories.reduce(
      (sum: number, c) => sum + c.allocated,
      0
    );

    // N-01: Category near limit (80%+)
    if (prefs!.categoryNearLimit) {
      for (const cat of period.categories) {
        if (cat.allocated <= 0) continue;
        const pct = cat.spent / cat.allocated;
        if (pct >= 0.8 && pct < 1) {
          notifications.push({
            id: `cat-near-${periodId}-${cat._id}`,
            type: "category_near_limit",
            title: `${cat.name} is ${Math.round(pct * 100)}% spent`,
            message: `${cat.name} in ${period.name} has ${formatCurrency(cat.allocated - cat.spent)} remaining`,
            severity: "warning",
            relatedId: periodId,
            relatedPath: `/budget/${periodId}`,
          });
        }
      }
    }

    // N-02: Category over budget
    if (prefs!.categoryOverBudget) {
      for (const cat of period.categories) {
        if (cat.allocated <= 0) continue;
        if (cat.spent > cat.allocated) {
          notifications.push({
            id: `cat-over-${periodId}-${cat._id}`,
            type: "category_over_budget",
            title: `${cat.name} is over budget`,
            message: `${cat.name} in ${period.name} is ${formatCurrency(cat.spent - cat.allocated)} over`,
            severity: "critical",
            relatedId: periodId,
            relatedPath: `/budget/${periodId}`,
          });
        }
      }
    }

    // N-03: Budget near end (3 days or less)
    if (prefs!.budgetNearEnd) {
      const endDate = new Date(period.endDate);
      const daysLeft = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft <= 3 && daysLeft >= 0) {
        notifications.push({
          id: `budget-end-${periodId}`,
          type: "budget_near_end",
          title: `${period.name} ends ${daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}`,
          message: `${formatCurrency(period.totalBudget - totalSpent)} remaining of ${formatCurrency(period.totalBudget)} budget`,
          severity: daysLeft <= 1 ? "critical" : "warning",
          relatedId: periodId,
          relatedPath: `/budget/${periodId}`,
        });
      }
    }

    // N-05: Uncategorized cleanup (unallocated spend)
    if (prefs!.uncategorizedCleanup) {
      const unallocated = period.totalBudget - totalAllocated;
      if (unallocated > 0) {
        notifications.push({
          id: `unallocated-${periodId}`,
          type: "uncategorized_cleanup",
          title: `${formatCurrency(unallocated)} unallocated in ${period.name}`,
          message: "Consider allocating this money to categories",
          severity: "info",
          relatedId: periodId,
          relatedPath: `/budget/${periodId}`,
        });
      }
    }
  }

  // N-04: Recurring expense due (within 3 days)
  if (prefs!.recurringExpenseDue) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 3);

    const upcomingRecurring = await RecurringExpense.find({
      userId,
      status: "active",
      nextDueDate: { $lte: cutoff },
    }).lean();

    for (const item of upcomingRecurring) {
      const dueDate = new Date(item.nextDueDate as Date);
      const daysUntil = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `recurring-due-${item._id}`,
        type: "recurring_expense_due",
        title: `${item.name} ${daysUntil <= 0 ? "is due" : `due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}`,
        message: `${formatCurrency(item.amount as number)} — ${item.frequency}`,
        severity: daysUntil <= 0 ? "critical" : "warning",
        relatedPath: "/recurring",
      });
    }
  }

  // N-06: Goal progress reminder (goals with no progress)
  if (prefs!.goalProgressReminder) {
    const goals = await SavingsGoal.find({
      userId,
      status: { $in: ["not_started", "in_progress"] },
    }).lean();

    for (const goal of goals) {
      const pct =
        (goal.targetAmount as number) > 0
          ? (goal.currentAmount as number) / (goal.targetAmount as number)
          : 0;
      if (pct === 0) {
        notifications.push({
          id: `goal-progress-${goal._id}`,
          type: "goal_progress_reminder",
          title: `${goal.name} has no contributions yet`,
          message: `Target: ${formatCurrency(goal.targetAmount as number)}`,
          severity: "info",
          relatedPath: `/goals/${goal._id}`,
        });
      }
    }
  }

  // N-07: End-of-period review (past periods not reviewed)
  if (prefs!.endOfPeriodReview) {
    const recentlyEnded = await BudgetPeriod.find({
      userId,
      endDate: {
        $lt: now,
        $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }).lean<IBudgetPeriod[]>();

    for (const period of recentlyEnded) {
      notifications.push({
        id: `review-${period._id}`,
        type: "end_of_period_review",
        title: `Review ${period.name}`,
        message: "This budget period has ended. Review your spending.",
        severity: "info",
        relatedId: String(period._id),
        relatedPath: `/budget/${period._id}/review`,
      });
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  notifications.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return notifications;
}

// ── Data Export Actions ──

export type ExportScope =
  | "expenses"
  | "budgets"
  | "income"
  | "savings_goals"
  | "recurring_expenses";

export type ExportFormat = "csv" | "json";

function toCsvRow(values: (string | number | boolean | null | undefined)[]) {
  return values
    .map((v) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    })
    .join(",");
}

export async function exportData(
  scopes: ExportScope[],
  format: ExportFormat,
  dateFrom?: string,
  dateTo?: string
): Promise<string> {
  const userId = await requireUser();
  await connectDB();

  // Build date filter for date-bearing collections
  const dateFilter: Record<string, unknown> = {};
  if (dateFrom) dateFilter.$gte = new Date(dateFrom);
  if (dateTo) dateFilter.$lte = new Date(dateTo);
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const sections: Record<string, unknown[]> = {};

  if (scopes.includes("budgets")) {
    const query: Record<string, unknown> = { userId };
    if (hasDateFilter) query.startDate = dateFilter;
    const periods = await BudgetPeriod.find(query)
      .sort({ startDate: -1 })
      .lean<IBudgetPeriod[]>();
    sections.budgets = periods.map((p) => ({
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      totalBudget: p.totalBudget,
      categories: p.categories.map((c) => ({
        name: c.name,
        allocated: c.allocated,
        spent: c.spent,
        color: c.color,
      })),
    }));
  }

  if (scopes.includes("expenses")) {
    const expQuery: Record<string, unknown> = { userId };
    if (hasDateFilter) expQuery.date = dateFilter;
    const expenses = await Expense.find(expQuery)
      .sort({ date: -1 })
      .lean();

    // Build category name lookup
    const periods = await BudgetPeriod.find({ userId }).lean<IBudgetPeriod[]>();
    const catMap = new Map<string, string>();
    const periodMap = new Map<string, string>();
    for (const p of periods) {
      periodMap.set(String(p._id), p.name);
      for (const c of p.categories) {
        catMap.set(String(c._id), c.name);
      }
    }

    sections.expenses = expenses.map((e) => ({
      description: e.description,
      amount: e.amount,
      date: e.date,
      category: catMap.get(String(e.categoryId)) || "",
      budget: periodMap.get(String(e.budgetPeriodId)) || "",
    }));
  }

  if (scopes.includes("income")) {
    const incQuery: Record<string, unknown> = { userId };
    if (hasDateFilter) incQuery.date = dateFilter;
    const incomes = await Income.find(incQuery)
      .sort({ date: -1 })
      .lean();
    sections.income = incomes.map((i) => ({
      source: i.source,
      amount: i.amount,
      date: i.date,
      note: i.note || "",
    }));
  }

  if (scopes.includes("savings_goals")) {
    const goals = await SavingsGoal.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    const contributions = await GoalContribution.find({ userId })
      .sort({ date: -1 })
      .lean();
    const contribByGoal = new Map<string, typeof contributions>();
    for (const c of contributions) {
      const gid = String(c.goalId);
      if (!contribByGoal.has(gid)) contribByGoal.set(gid, []);
      contribByGoal.get(gid)!.push(c);
    }
    sections.savings_goals = goals.map((g) => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      status: g.status,
      targetDate: g.targetDate || "",
      contributions: (contribByGoal.get(String(g._id)) || []).map((c) => ({
        amount: c.amount,
        date: c.date,
        note: c.note || "",
      })),
    }));
  }

  if (scopes.includes("recurring_expenses")) {
    const recurring = await RecurringExpense.find({ userId })
      .sort({ name: 1 })
      .lean();
    sections.recurring_expenses = recurring.map((r) => ({
      name: r.name,
      amount: r.amount,
      categoryName: r.categoryName,
      frequency: r.frequency,
      startDate: r.startDate,
      endDate: r.endDate || "",
      nextDueDate: r.nextDueDate,
      status: r.status,
    }));
  }

  if (format === "json") {
    return JSON.stringify(sections, null, 2);
  }

  // CSV — one section per scope, separated by blank lines
  const csvParts: string[] = [];

  if (sections.budgets) {
    csvParts.push("# Budgets");
    csvParts.push(
      toCsvRow([
        "Name",
        "Start Date",
        "End Date",
        "Total Budget",
        "Categories",
      ])
    );
    for (const b of sections.budgets as Record<string, unknown>[]) {
      const cats = b.categories as { name: string; allocated: number; spent: number }[];
      csvParts.push(
        toCsvRow([
          b.name as string,
          b.startDate as string,
          b.endDate as string,
          b.totalBudget as number,
          cats.map((c) => `${c.name}(${formatCurrency(c.allocated)}/${formatCurrency(c.spent)})`).join("; "),
        ])
      );
    }
    csvParts.push("");
  }

  if (sections.expenses) {
    csvParts.push("# Expenses");
    csvParts.push(
      toCsvRow(["Description", "Amount", "Date", "Category", "Budget"])
    );
    for (const e of sections.expenses as Record<string, unknown>[]) {
      csvParts.push(
        toCsvRow([
          e.description as string,
          e.amount as number,
          e.date as string,
          e.category as string,
          e.budget as string,
        ])
      );
    }
    csvParts.push("");
  }

  if (sections.income) {
    csvParts.push("# Income");
    csvParts.push(toCsvRow(["Source", "Amount", "Date", "Note"]));
    for (const i of sections.income as Record<string, unknown>[]) {
      csvParts.push(
        toCsvRow([
          i.source as string,
          i.amount as number,
          i.date as string,
          i.note as string,
        ])
      );
    }
    csvParts.push("");
  }

  if (sections.savings_goals) {
    csvParts.push("# Savings Goals");
    csvParts.push(
      toCsvRow([
        "Name",
        "Target",
        "Current",
        "Status",
        "Target Date",
      ])
    );
    for (const g of sections.savings_goals as Record<string, unknown>[]) {
      csvParts.push(
        toCsvRow([
          g.name as string,
          g.targetAmount as number,
          g.currentAmount as number,
          g.status as string,
          g.targetDate as string,
        ])
      );
    }
    csvParts.push("");
  }

  if (sections.recurring_expenses) {
    csvParts.push("# Recurring Expenses");
    csvParts.push(
      toCsvRow([
        "Name",
        "Amount",
        "Category",
        "Frequency",
        "Start Date",
        "End Date",
        "Next Due",
        "Status",
      ])
    );
    for (const r of sections.recurring_expenses as Record<string, unknown>[]) {
      csvParts.push(
        toCsvRow([
          r.name as string,
          r.amount as number,
          r.categoryName as string,
          r.frequency as string,
          r.startDate as string,
          r.endDate as string,
          r.nextDueDate as string,
          r.status as string,
        ])
      );
    }
    csvParts.push("");
  }

  return csvParts.join("\n");
}

// ── User Preferences Actions ──

export async function getUserPreferences(): Promise<UserPreferencesData> {
  const userId = await requireUser();
  await connectDB();

  let prefs = await UserPreferences.findOne({ userId }).lean();
  if (!prefs) {
    prefs = await UserPreferences.create({ userId });
    prefs = prefs.toObject();
  }

  return {
    defaultCurrency: prefs!.defaultCurrency as string,
    defaultBudgetDuration: prefs!.defaultBudgetDuration as number,
    firstDayOfWeek: prefs!.firstDayOfWeek as number,
    dateFormat: prefs!.dateFormat as string,
    numberFormat: prefs!.numberFormat as string,
    defaultTemplateId: (prefs!.defaultTemplateId as string) || null,
    defaultRolloverBehavior: prefs!.defaultRolloverBehavior as UserPreferencesData["defaultRolloverBehavior"],
  };
}

export async function updateUserPreferences(
  data: Partial<UserPreferencesData>
) {
  const userId = await requireUser();
  await connectDB();

  await UserPreferences.findOneAndUpdate(
    { userId },
    { $set: data },
    { upsert: true }
  );

  revalidatePath("/");
  revalidatePath("/settings");
}

export async function deleteAllUserData() {
  const userId = await requireUser();
  await connectDB();

  await Promise.all([
    Expense.deleteMany({ userId }),
    ExpenseAttachment.deleteMany({ userId }),
    BudgetPeriod.deleteMany({ userId }),
    BudgetTemplate.deleteMany({ userId }),
    CategoryTransfer.deleteMany({ userId }),
    RecurringExpense.deleteMany({ userId }),
    Income.deleteMany({ userId }),
    SavingsGoal.deleteMany({ userId }),
    GoalContribution.deleteMany({ userId }),
    CategoryRule.deleteMany({ userId }),
    NotificationPreference.deleteMany({ userId }),
    UserPreferences.deleteMany({ userId }),
    BudgetRollover.deleteMany({ userId }),
  ]);

  revalidatePath("/");
}

// ── Budget Rollover Actions ──

export async function getRolloverAmount(budgetPeriodId: string) {
  const userId = await requireUser();
  await connectDB();

  const period = await BudgetPeriod.findOne({
    _id: budgetPeriodId,
    userId,
  }).lean<IBudgetPeriod>();

  if (!period) return { remaining: 0, hasRolledOver: false };

  const totalSpent = period.categories.reduce((s, c) => s + c.spent, 0);
  const remaining = period.totalBudget - totalSpent;

  const existing = await BudgetRollover.findOne({
    userId,
    fromBudgetPeriodId: budgetPeriodId,
  }).lean();

  return {
    remaining,
    hasRolledOver: !!existing,
    rolloverRecord: existing
      ? JSON.parse(JSON.stringify(existing))
      : null,
  };
}

export async function rolloverToBudget(
  fromBudgetPeriodId: string,
  toBudgetPeriodId: string,
  amount: number
) {
  const userId = await requireUser();
  await connectDB();

  // Add amount to target budget's total
  await BudgetPeriod.findOneAndUpdate(
    { _id: toBudgetPeriodId, userId },
    { $inc: { totalBudget: amount } }
  );

  // Record rollover
  await BudgetRollover.create({
    userId,
    fromBudgetPeriodId,
    toBudgetPeriodId,
    amount,
    action: "rollover_to_budget",
  });

  revalidatePath("/");
  revalidatePath(`/budget/${toBudgetPeriodId}`);
  revalidatePath(`/budget/${fromBudgetPeriodId}/review`);
}

export async function rolloverToGoal(
  fromBudgetPeriodId: string,
  goalId: string,
  amount: number
) {
  const userId = await requireUser();
  await connectDB();

  // Add contribution to goal
  await SavingsGoal.findOneAndUpdate(
    { _id: goalId, userId },
    { $inc: { currentAmount: amount } }
  );

  await GoalContribution.create({
    userId,
    goalId,
    sourceBudgetPeriodId: fromBudgetPeriodId,
    amount,
    date: new Date(),
    note: "Budget rollover",
  });

  // Record rollover
  await BudgetRollover.create({
    userId,
    fromBudgetPeriodId,
    toGoalId: goalId,
    amount,
    action: "rollover_to_goal",
  });

  revalidatePath("/");
  revalidatePath(`/goals/${goalId}`);
  revalidatePath(`/budget/${fromBudgetPeriodId}/review`);
}

export async function ignoreRollover(
  fromBudgetPeriodId: string,
  amount: number
) {
  const userId = await requireUser();
  await connectDB();

  await BudgetRollover.create({
    userId,
    fromBudgetPeriodId,
    amount,
    action: "ignored",
  });

  revalidatePath(`/budget/${fromBudgetPeriodId}/review`);
}

export async function getRolloverHistory() {
  const userId = await requireUser();
  await connectDB();

  const records = await BudgetRollover.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(records));
}

// ── Chat Conversation Actions ──

export async function createChatConversation() {
  const userId = await requireUser();
  await connectDB();

  const conv = await ChatConversation.create({
    userId,
    title: "New chat",
    messages: [],
  });

  return JSON.parse(JSON.stringify(conv));
}

export async function getChatConversations() {
  const userId = await requireUser();
  await connectDB();

  const convs = await ChatConversation.find({ userId })
    .select("_id title updatedAt")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return JSON.parse(JSON.stringify(convs));
}

export async function getChatConversation(id: string) {
  const userId = await requireUser();
  await connectDB();

  const conv = await ChatConversation.findOne({ _id: id, userId }).lean();
  if (!conv) return null;
  return JSON.parse(JSON.stringify(conv));
}

export async function saveChatMessages(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: { id: string; role: "user" | "assistant"; parts: any[] }[],
  title?: string
) {
  const userId = await requireUser();
  await connectDB();

  const update: Record<string, unknown> = { messages };
  if (title) update.title = title;

  await ChatConversation.updateOne(
    { _id: id, userId },
    { $set: update }
  );
}

export async function deleteChatConversation(id: string) {
  const userId = await requireUser();
  await connectDB();

  await ChatConversation.deleteOne({ _id: id, userId });
}

export async function searchChatConversations(query: string) {
  const userId = await requireUser();
  await connectDB();

  const convs = await ChatConversation.find({
    userId,
    title: { $regex: query, $options: "i" },
  })
    .select("_id title updatedAt")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return JSON.parse(JSON.stringify(convs));
}
