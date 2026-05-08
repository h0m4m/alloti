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
import { createSavingsGoal } from "@/lib/actions";

interface Props {
  open: boolean;
  onClose: () => void;
}

function AddGoalFormInner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!name || !targetAmount) return;
    setSaving(true);
    await createSavingsGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: currentAmount ? parseFloat(currentAmount) : undefined,
      targetDate: targetDate || undefined,
    });
    setSaving(false);
    onClose();
    router.refresh();
    toast.success("Savings goal created", {
      description: name,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-name">Goal name</Label>
        <Input
          id="goal-name"
          placeholder="e.g. Emergency Fund, New Laptop"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="goal-target">Target amount</Label>
          <Input
            id="goal-target"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-current">Starting amount</Label>
          <Input
            id="goal-current"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Target date (optional)</Label>
        <DatePicker
          value={targetDate}
          onChange={setTargetDate}
          placeholder="No target date"
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!name || !targetAmount || saving}
        onClick={handleSubmit}
      >
        {saving ? "Creating..." : "Create Goal"}
      </Button>
    </div>
  );
}

export function AddGoalForm({ open, onClose }: Props) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Savings Goal</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new savings goal
            </DialogDescription>
          </DialogHeader>
          {open && <AddGoalFormInner onClose={onClose} />}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>New Savings Goal</DrawerTitle>
          </DrawerHeader>
          {open && <AddGoalFormInner onClose={onClose} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
