"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createBudgetPeriod } from "@/lib/actions";
import { formatDateInput } from "@/lib/format";

interface CategoryDraft {
  id: string;
  name: string;
  allocated: number;
  color: string;
}

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#14b8a6",
  "#f97316",
  "#a855f7",
];

interface Props {
  suggestions: { name: string; color: string }[];
}

export function CreateBudgetForm({ suggestions }: Props) {
  const router = useRouter();
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(formatDateInput(today));
  const [endDate, setEndDate] = useState(formatDateInput(endOfMonth));
  const [totalBudget, setTotalBudget] = useState("");
  const [categories, setCategories] = useState<CategoryDraft[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const allocated = categories.reduce((s, c) => s + c.allocated, 0);
  const remaining = (parseFloat(totalBudget) || 0) - allocated;

  function addCategory() {
    if (!newCatName.trim() || !newCatAmount) return;
    const color = COLORS[categories.length % COLORS.length];
    setCategories([
      ...categories,
      {
        id: crypto.randomUUID(),
        name: newCatName.trim(),
        allocated: parseFloat(newCatAmount),
        color,
      },
    ]);
    setNewCatName("");
    setNewCatAmount("");
  }

  function removeCategory(id: string) {
    setCategories(categories.filter((c) => c.id !== id));
  }

  function addSuggestion(s: { name: string; color: string }) {
    if (categories.some((c) => c.name === s.name)) return;
    setCategories([
      ...categories,
      { id: crypto.randomUUID(), name: s.name, allocated: 0, color: s.color },
    ]);
  }

  async function handleSubmit() {
    if (!name || !totalBudget || categories.length === 0) return;
    setSaving(true);
    await createBudgetPeriod({
      name,
      startDate,
      endDate,
      totalBudget: parseFloat(totalBudget),
      categories: categories.map((c) => ({
        name: c.name,
        allocated: c.allocated,
        color: c.color,
      })),
    });
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">New Budget</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Budget name</Label>
          <Input
            id="name"
            placeholder="e.g. May 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="start">Start date</Label>
            <Input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End date</Label>
            <Input
              id="end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Total budget</Label>
          <Input
            id="budget"
            type="number"
            placeholder="0.00"
            inputMode="decimal"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Categories</Label>
          {totalBudget && (
            <span
              className={`text-xs ${remaining < 0 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {remaining >= 0
                ? `$${remaining.toFixed(2)} unallocated`
                : `$${Math.abs(remaining).toFixed(2)} over`}
            </span>
          )}
        </div>

        {suggestions.length > 0 && categories.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <Badge
                  key={s.name}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => addSuggestion(s)}
                >
                  + {s.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-sm font-medium">{cat.name}</span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                className="w-24 h-8 text-sm"
                value={cat.allocated || ""}
                onChange={(e) =>
                  setCategories(
                    categories.map((c) =>
                      c.id === cat.id
                        ? { ...c, allocated: parseFloat(e.target.value) || 0 }
                        : c
                    )
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeCategory(cat.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-2">
          <Input
            placeholder="Category name"
            className="flex-1"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Amount"
            className="w-24"
            value={newCatAmount}
            onChange={(e) => setNewCatAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Button variant="outline" size="icon" onClick={addCategory}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!name || !totalBudget || categories.length === 0 || saving}
        onClick={handleSubmit}
      >
        {saving ? "Creating..." : "Create Budget"}
      </Button>
    </div>
  );
}
