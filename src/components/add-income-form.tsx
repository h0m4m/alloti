"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
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
import { addIncome } from "@/lib/actions";
import { formatCurrency, formatDateInput } from "@/lib/format";
import type { BudgetPeriod } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  periods: BudgetPeriod[];
}

function AddIncomeFormInner({
  onClose,
  periods,
}: {
  onClose: () => void;
  periods: BudgetPeriod[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!amount || !source) return;
    setSaving(true);
    await addIncome({
      amount: parseFloat(amount),
      date,
      source,
      note: note || undefined,
    });
    setSaving(false);
    onClose();
    router.refresh();
    toast.success("Income added", {
      description: `${formatCurrency(parseFloat(amount))} from ${source}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inc-source">Source</Label>
        <Input
          id="inc-source"
          placeholder="e.g. Salary, Freelance, Gift"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="inc-amount">Amount</Label>
          <Input
            id="inc-amount"
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

      <div className="space-y-2">
        <Label htmlFor="inc-note">Note (optional)</Label>
        <Input
          id="inc-note"
          placeholder="Any additional details"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Income will be automatically matched to the budget period that covers
        the date you select.
      </p>

      <Button
        className="w-full"
        size="lg"
        disabled={!amount || !source || saving}
        onClick={handleSubmit}
      >
        {saving ? "Adding..." : "Add Income"}
      </Button>
    </div>
  );
}

export function AddIncomeForm({ open, onClose, periods }: Props) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
            <DialogDescription className="sr-only">
              Record income received
            </DialogDescription>
          </DialogHeader>
          {open && <AddIncomeFormInner onClose={onClose} periods={periods} />}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>Add Income</DrawerTitle>
          </DrawerHeader>
          {open && <AddIncomeFormInner onClose={onClose} periods={periods} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
