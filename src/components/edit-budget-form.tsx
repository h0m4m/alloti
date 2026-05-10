"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { updateBudgetPeriod } from "@/lib/actions";
import { formatCurrency, formatDateInput } from "@/lib/format";
import type { BudgetPeriod } from "@/lib/types";

interface CategoryDraft {
  id: string;
  _id?: string;
  name: string;
  allocated: number;
  spent: number;
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

export function EditBudgetForm({ period }: { period: BudgetPeriod }) {
  const router = useRouter();
  const [name, setName] = useState(period.name);
  const [startDate, setStartDate] = useState(
    formatDateInput(new Date(period.startDate))
  );
  const [endDate, setEndDate] = useState(
    formatDateInput(new Date(period.endDate))
  );
  const [totalBudget, setTotalBudget] = useState(
    String(period.totalBudget)
  );
  const [categories, setCategories] = useState<CategoryDraft[]>(
    period.categories.map((c) => ({
      id: c._id,
      _id: c._id,
      name: c.name,
      allocated: c.allocated,
      spent: c.spent,
      color: c.color,
    }))
  );
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const allocated = categories.reduce((s, c) => s + c.allocated, 0);
  const remaining = (parseFloat(totalBudget) || 0) - allocated;

  function addCategory() {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase()))
      return;
    setCategories([
      ...categories,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        allocated: parseFloat(newCatAmount) || 0,
        spent: 0,
        color: COLORS[categories.length % COLORS.length],
      },
    ]);
    setNewCatName("");
    setNewCatAmount("");
  }

  function removeCategory(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (cat && cat.spent > 0) {
      toast.error("Cannot remove category", {
        description: `${cat.name} has ${formatCurrency(cat.spent)} in expenses. Delete or move those expenses first.`,
      });
      return;
    }
    setCategories(categories.filter((c) => c.id !== id));
  }

  async function handleSubmit() {
    if (!name || !totalBudget || categories.length === 0) return;
    setSaving(true);
    await updateBudgetPeriod(period._id, {
      name,
      startDate,
      endDate,
      totalBudget: parseFloat(totalBudget),
      categories: categories.map((c) => ({
        ...(c._id ? { _id: c._id } : {}),
        name: c.name,
        allocated: c.allocated,
        color: c.color,
      })),
    });
    setSaving(false);
    toast.success("Budget updated", { description: name });
    router.push(`/budget/${period._id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
          <PageHeader
            crumbs={[{ label: "Home", href: "/" }, { label: period.name, href: `/budget/${period._id}` }]}
            title="Edit"
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Budget name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start date</Label>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <DatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-budget">Total budget</Label>
            <Input
              id="edit-budget"
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
                  ? `${formatCurrency(remaining)} unallocated`
                  : `${formatCurrency(Math.abs(remaining))} over`}
              </span>
            )}
          </div>

          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                {cat.spent > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(cat.spent)} spent
                  </span>
                )}
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
                          ? {
                              ...c,
                              allocated: parseFloat(e.target.value) || 0,
                            }
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
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
