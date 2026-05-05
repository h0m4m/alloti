"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { addExpense } from "@/lib/actions";
import { formatDateInput } from "@/lib/format";
import type { BudgetCategory } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  budgetPeriodId: string;
  categories: BudgetCategory[];
  defaultCategoryId: string | null;
}

export function AddExpenseForm({
  open,
  onClose,
  budgetPeriodId,
  categories,
  defaultCategoryId,
}: Props) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategoryId(defaultCategoryId || categories[0]?._id || "");
      setDescription("");
      setAmount("");
      setDate(formatDateInput(new Date()));
    }
  }, [open, defaultCategoryId, categories]);

  async function handleSubmit() {
    if (!categoryId || !description || !amount) return;
    setSaving(true);
    await addExpense({
      budgetPeriodId,
      categoryId,
      description,
      amount: parseFloat(amount),
      date,
    });
    setSaving(false);
    onClose();
    router.refresh();
  }

  const formContent = (
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
        <Label htmlFor="desc">Description</Label>
        <Input
          id="desc"
          placeholder="What did you spend on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!categoryId || !description || !amount || saving}
        onClick={handleSubmit}
      >
        {saving ? "Adding..." : "Add Expense"}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription className="sr-only">
              Add a new expense to this budget
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>Add Expense</DrawerTitle>
          </DrawerHeader>
          {formContent}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
