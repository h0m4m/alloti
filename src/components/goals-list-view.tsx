"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Target,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AddGoalForm } from "@/components/add-goal-form";
import { formatDate } from "@/lib/format";
import { Currency } from "@/components/currency";
import { deleteSavingsGoal, toggleGoalPause } from "@/lib/actions";
import type { SavingsGoal } from "@/lib/types";

interface Props {
  goals: SavingsGoal[];
}

export function GoalsListView({ goals }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  const active = goals.filter(
    (g) => g.status === "in_progress" || g.status === "not_started"
  );
  const completed = goals.filter((g) => g.status === "completed");
  const paused = goals.filter((g) => g.status === "paused");

  async function handleDelete(id: string) {
    await deleteSavingsGoal(id);
    router.refresh();
    toast.success("Goal deleted");
  }

  async function handleToggle(id: string) {
    await toggleGoalPause(id);
    router.refresh();
  }

  function renderGoal(goal: SavingsGoal) {
    const pct =
      goal.targetAmount > 0
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
        : 0;

    return (
      <Link key={goal._id} href={`/goals/${goal._id}`}>
        <Card className="transition-colors hover:bg-accent/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">
                  {goal.name}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {goal.status === "completed" && (
                  <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                    Completed
                  </Badge>
                )}
                {goal.status === "paused" && (
                  <Badge variant="secondary" className="text-xs">
                    Paused
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggle(goal._id);
                  }}
                >
                  {goal.status === "paused" ? (
                    <Play className="h-3 w-3" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(goal._id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span><Currency amount={goal.currentAmount} /></span>
                <span className="text-muted-foreground">
                  <Currency amount={goal.targetAmount} />
                </span>
              </div>
              <Progress
                value={Math.min(pct, 100)}
                className={`h-2 ${pct >= 100 ? "[&>div]:bg-green-500" : ""}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pct}%</span>
                {goal.targetDate && (
                  <span>Target: {formatDate(goal.targetDate)}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="Savings Goals" />
        <Button
          size="sm"
          className="gap-1.5 hidden sm:flex"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Floating Action Button - mobile */}
      <button
        className="fixed bottom-20 right-4 z-40 sm:hidden flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        onClick={() => setShowAdd(true)}
      >
        <Plus className="h-5 w-5" />
      </button>

      {goals.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-muted-foreground">No savings goals yet</p>
          <p className="text-sm text-muted-foreground">
            Set goals for things you want to save for
          </p>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Create your first goal
          </Button>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map(renderGoal)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Completed
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {completed.map(renderGoal)}
          </div>
        </section>
      )}

      {paused.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Paused
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {paused.map(renderGoal)}
          </div>
        </section>
      )}

      <AddGoalForm open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
