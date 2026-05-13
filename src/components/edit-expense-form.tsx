"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { updateExpense } from "@/lib/actions";
import { formatCurrency, formatDateInput } from "@/lib/format";
import type { BudgetCategory, Expense } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  expense: Expense;
  categories: BudgetCategory[];
}

function EditExpenseFormInner({
  onClose,
  expense,
  categories,
}: Omit<Props, "open">) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [date, setDate] = useState(
    formatDateInput(new Date(expense.date))
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!categoryId || !description || !amount) return;
    setSaving(true);

    await updateExpense({
      expenseId: expense._id,
      budgetPeriodId: expense.budgetPeriodId!,
      categoryId,
      description,
      amount: parseFloat(amount),
      date,
      oldCategoryId: expense.categoryId!,
      oldAmount: expense.amount,
    });

    setSaving(false);
    onClose();
    router.refresh();
    toast.success("Expense updated", {
      description: `${formatCurrency(parseFloat(amount))} — ${description}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                categoryId === cat._id
                  ? "ring-2 ring-offset-2 ring-offset-background font-medium"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: cat.color + "20",
                color: cat.color,
                ...(categoryId === cat._id ? { ringColor: cat.color } : {}),
              }}
              onClick={() => setCategoryId(cat._id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-desc">Description</Label>
        <Input
          id="edit-desc"
          placeholder="What did you spend on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="edit-amount">Amount</Label>
          <Input
            id="edit-amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <DatePicker value={date} onChange={setDate} />
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!categoryId || !description || !amount || saving}
        onClick={handleSubmit}
      >
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

export function EditExpenseForm({ open, onClose, expense, categories }: Props) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription className="sr-only">
              Edit this expense
            </DialogDescription>
          </DialogHeader>
          {open && (
            <EditExpenseFormInner
              onClose={onClose}
              expense={expense}
              categories={categories}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>Edit Expense</DrawerTitle>
          </DrawerHeader>
          {open && (
            <EditExpenseFormInner
              onClose={onClose}
              expense={expense}
              categories={categories}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
