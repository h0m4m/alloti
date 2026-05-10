"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
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
import { transferBetweenCategories } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import type { BudgetCategory } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  budgetPeriodId: string;
  categories: BudgetCategory[];
}

function TransferFormInner({
  onClose,
  budgetPeriodId,
  categories,
}: Omit<Props, "open">) {
  const router = useRouter();
  const [fromId, setFromId] = useState(categories[0]?._id || "");
  const [toId, setToId] = useState(categories[1]?._id || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fromCat = categories.find((c) => c._id === fromId);
  const fromRemaining = fromCat ? fromCat.allocated - fromCat.spent : 0;

  async function handleSubmit() {
    if (!fromId || !toId || !amount || fromId === toId) return;
    setSaving(true);
    await transferBetweenCategories({
      budgetPeriodId,
      fromCategoryId: fromId,
      toCategoryId: toId,
      amount: parseFloat(amount),
      note,
    });
    setSaving(false);
    onClose();
    router.refresh();
    toast.success("Money transferred", {
      description: `${formatCurrency(parseFloat(amount))} moved between categories`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>From</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                fromId === cat._id
                  ? "ring-2 ring-offset-2 ring-offset-background font-medium"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: cat.color + "20",
                color: cat.color,
              }}
              onClick={() => {
                setFromId(cat._id);
                if (toId === cat._id) setToId("");
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {fromCat && (
          <p className="text-xs text-muted-foreground">
            Available: {formatCurrency(fromCat.allocated)} allocated,{" "}
            {formatCurrency(fromRemaining)} remaining
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <Label>To</Label>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((cat) => cat._id !== fromId)
            .map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  toId === cat._id
                    ? "ring-2 ring-offset-2 ring-offset-background font-medium"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: cat.color + "20",
                  color: cat.color,
                }}
                onClick={() => setToId(cat._id)}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-amount">Amount</Label>
        <Input
          id="transfer-amount"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer-note">Note (optional)</Label>
        <Input
          id="transfer-note"
          placeholder="Why are you moving this money?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={
          !fromId ||
          !toId ||
          !amount ||
          parseFloat(amount) <= 0 ||
          fromId === toId ||
          saving
        }
        onClick={handleSubmit}
      >
        {saving ? "Transferring..." : "Move Money"}
      </Button>
    </div>
  );
}

export function TransferMoneyForm({
  open,
  onClose,
  budgetPeriodId,
  categories,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move Money</DialogTitle>
            <DialogDescription className="sr-only">
              Transfer allocation between categories
            </DialogDescription>
          </DialogHeader>
          {open && (
            <TransferFormInner
              onClose={onClose}
              budgetPeriodId={budgetPeriodId}
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
            <DrawerTitle>Move Money</DrawerTitle>
          </DrawerHeader>
          {open && (
            <TransferFormInner
              onClose={onClose}
              budgetPeriodId={budgetPeriodId}
              categories={categories}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
