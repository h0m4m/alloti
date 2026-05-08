"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import { formatCurrency, formatDate, formatDateInput } from "@/lib/format";
import { addGoalContribution } from "@/lib/actions";
import type { SavingsGoal, GoalContribution } from "@/lib/types";

interface Props {
  goal: SavingsGoal;
  contributions: GoalContribution[];
}

export function GoalDetailView({ goal, contributions }: Props) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [showContribute, setShowContribute] = useState(false);

  const pct =
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0;
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/goals")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl sm:text-2xl font-bold">{goal.name}</h1>
          </div>
          {goal.targetDate && (
            <p className="text-xs text-muted-foreground">
              Target: {formatDate(goal.targetDate)}
            </p>
          )}
        </div>
        {goal.status !== "completed" && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowContribute(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Contribute
          </Button>
        )}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-lg font-bold">
                {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-lg font-bold">
                {formatCurrency(goal.targetAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p
                className={`text-lg font-bold ${remaining <= 0 ? "text-green-600" : ""}`}
              >
                {formatCurrency(Math.max(0, remaining))}
              </p>
            </div>
          </div>
          <Progress
            value={Math.min(pct, 100)}
            className={`h-3 ${pct >= 100 ? "[&>div]:bg-green-500" : ""}`}
          />
          <p className="text-sm text-muted-foreground text-center">
            {pct}% complete
          </p>
        </CardContent>
      </Card>

      {/* Contributions */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Contributions</h2>
        {contributions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No contributions yet
          </p>
        ) : (
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-2">
              {contributions.map((c, i) => (
                <div key={c._id}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-green-600">
                        +{formatCurrency(c.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.date)}
                        {c.note && ` — ${c.note}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contribute Dialog */}
      <ContributeForm
        open={showContribute}
        onClose={() => setShowContribute(false)}
        goalId={goal._id}
        isDesktop={isDesktop}
      />
    </div>
  );
}

function ContributeFormInner({
  onClose,
  goalId,
}: {
  onClose: () => void;
  goalId: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!amount) return;
    setSaving(true);
    await addGoalContribution({
      goalId,
      amount: parseFloat(amount),
      date,
      note: note || undefined,
    });
    setSaving(false);
    onClose();
    router.refresh();
    toast.success("Contribution added", {
      description: `${formatCurrency(parseFloat(amount))}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="contrib-amount">Amount</Label>
          <Input
            id="contrib-amount"
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
        <Label htmlFor="contrib-note">Note (optional)</Label>
        <Input
          id="contrib-note"
          placeholder="e.g. Monthly savings"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!amount || saving}
        onClick={handleSubmit}
      >
        {saving ? "Adding..." : "Add Contribution"}
      </Button>
    </div>
  );
}

function ContributeForm({
  open,
  onClose,
  goalId,
  isDesktop,
}: {
  open: boolean;
  onClose: () => void;
  goalId: string;
  isDesktop: boolean;
}) {
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
            <DialogDescription className="sr-only">
              Add money to your savings goal
            </DialogDescription>
          </DialogHeader>
          {open && (
            <ContributeFormInner onClose={onClose} goalId={goalId} />
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
            <DrawerTitle>Add Contribution</DrawerTitle>
          </DrawerHeader>
          {open && (
            <ContributeFormInner onClose={onClose} goalId={goalId} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
