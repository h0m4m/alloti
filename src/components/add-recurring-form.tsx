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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRecurringExpense } from "@/lib/actions";
import { formatCurrency, formatDateInput } from "@/lib/format";
import type { RecurringFrequency } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const FREQUENCY_ITEMS = Object.fromEntries(
  FREQUENCY_OPTIONS.map((o) => [o.value, o.label])
);

function AddRecurringFormInner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [startDate, setStartDate] = useState(formatDateInput(new Date()));
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name || !amount) return;
    setSaving(true);
    await createRecurringExpense({
      name,
      amount: parseFloat(amount),
      categoryName,
      frequency,
      startDate,
      endDate: endDate || undefined,
    });
    setSaving(false);
    onClose();
    router.refresh();
    toast.success("Recurring expense added", {
      description: `${name} — ${formatCurrency(parseFloat(amount))} ${frequency}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rec-name">Name</Label>
        <Input
          id="rec-name"
          placeholder="e.g. Netflix, Gym, Rent"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="rec-amount">Amount</Label>
          <Input
            id="rec-amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={frequency}
            onValueChange={(v) => {
              if (v) setFrequency(v as RecurringFrequency);
            }}
            items={FREQUENCY_ITEMS}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rec-category">Category (optional)</Label>
        <Input
          id="rec-category"
          placeholder="e.g. Subscriptions"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Start date</Label>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>
        <div className="space-y-2">
          <Label>End date (optional)</Label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="No end date"
          />
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!name || !amount || saving}
        onClick={handleSubmit}
      >
        {saving ? "Adding..." : "Add Recurring Expense"}
      </Button>
    </div>
  );
}

export function AddRecurringForm({ open, onClose }: Props) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Recurring Expense</DialogTitle>
            <DialogDescription className="sr-only">
              Set up a recurring payment to track
            </DialogDescription>
          </DialogHeader>
          {open && <AddRecurringFormInner onClose={onClose} />}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>Add Recurring Expense</DrawerTitle>
          </DrawerHeader>
          {open && <AddRecurringFormInner onClose={onClose} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
