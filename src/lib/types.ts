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
  createdAt: string;
  updatedAt: string;
}
