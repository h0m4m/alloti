export interface BudgetCategory {
  _id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

export interface BudgetPeriod {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  categories: BudgetCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  budgetPeriodId: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  hasAttachment: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── V2 Types ──

export interface BudgetTemplateCategory {
  _id: string;
  name: string;
  defaultAmount: number;
  defaultPercentage: number | null;
  color: string;
  sortOrder: number;
}

export interface BudgetTemplate {
  _id: string;
  name: string;
  description: string;
  currency: string;
  categories: BudgetTemplateCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTransfer {
  _id: string;
  budgetPeriodId: string;
  fromCategoryId: string;
  toCategoryId: string;
  amount: number;
  note: string;
  createdAt: string;
}

export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface RecurringExpense {
  _id: string;
  name: string;
  amount: number;
  currency: string;
  categoryName: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  status: "active" | "paused";
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  _id: string;
  budgetPeriodId: string | null;
  amount: number;
  currency: string;
  date: string;
  source: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type SavingsGoalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "paused";

export interface SavingsGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string | null;
  status: SavingsGoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  _id: string;
  goalId: string;
  sourceBudgetPeriodId: string | null;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

// ── Attachments ──

export interface ExpenseAttachment {
  _id: string;
  expenseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string;
  createdAt: string;
}

// ── Category Rules ──

export type MatchType = "contains" | "exact" | "starts_with";

export interface CategoryRule {
  _id: string;
  keyword: string;
  categoryName: string;
  matchType: MatchType;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySuggestion {
  categoryName: string;
  reason: string;
  ruleId?: string;
}

// ── Notifications ──

export type NotificationType =
  | "category_near_limit"
  | "category_over_budget"
  | "budget_near_end"
  | "recurring_expense_due"
  | "uncategorized_cleanup"
  | "goal_progress_reminder"
  | "end_of_period_review";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  relatedId?: string;
  relatedPath?: string;
}

export interface NotificationPreferences {
  categoryNearLimit: boolean;
  categoryOverBudget: boolean;
  budgetNearEnd: boolean;
  recurringExpenseDue: boolean;
  uncategorizedCleanup: boolean;
  goalProgressReminder: boolean;
  endOfPeriodReview: boolean;
}

// ── User Preferences ──

export interface UserPreferencesData {
  defaultCurrency: string;
  defaultBudgetDuration: number;
  firstDayOfWeek: number;
  dateFormat: string;
  numberFormat: string;
  defaultTemplateId: string | null;
  defaultRolloverBehavior: "ask" | "rollover" | "ignore";
}

// ── Budget Rollover ──

export type RolloverAction = "rollover_to_budget" | "rollover_to_goal" | "ignored";

export interface BudgetRolloverRecord {
  _id: string;
  fromBudgetPeriodId: string;
  toBudgetPeriodId: string | null;
  toGoalId: string | null;
  amount: number;
  action: RolloverAction;
  createdAt: string;
}

// ── Chat Conversations ──

export interface ChatConversation {
  _id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parts: any[];
}
