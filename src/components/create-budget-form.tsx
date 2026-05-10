"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createBudgetPeriod,
  duplicateBudgetPeriod,
  deleteBudgetTemplate,
  createBudgetTemplate,
} from "@/lib/actions";
import { formatCurrency, formatDateInput } from "@/lib/format";
import type { BudgetPeriod, BudgetTemplate } from "@/lib/types";

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

type CreateMode = "blank" | "duplicate" | "template";

interface Props {
  suggestions: { name: string; color: string }[];
  previousBudgets: BudgetPeriod[];
  templates: BudgetTemplate[];
  initialMode?: CreateMode;
  initialSourceId?: string;
}

export function CreateBudgetForm({
  suggestions,
  previousBudgets,
  templates,
  initialMode,
  initialSourceId,
}: Props) {
  const router = useRouter();
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [mode, setMode] = useState<CreateMode | null>(
    initialMode || null
  );
  const [sourceId, setSourceId] = useState<string | null>(
    initialSourceId || null
  );

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(formatDateInput(today));
  const [endDate, setEndDate] = useState(formatDateInput(endOfMonth));
  const [totalBudget, setTotalBudget] = useState("");
  const [categories, setCategories] = useState<CategoryDraft[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Template management state
  const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(
    null
  );
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateCats, setEditTemplateCats] = useState<CategoryDraft[]>([]);
  const [editNewCatName, setEditNewCatName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  const allocated = categories.reduce((s, c) => s + c.allocated, 0);
  const remaining = (parseFloat(totalBudget) || 0) - allocated;

  function selectDuplicate(budget: BudgetPeriod) {
    setSourceId(budget._id);
    setMode("duplicate");
    setName("");
    setTotalBudget(String(budget.totalBudget));
    setCategories(
      budget.categories.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        allocated: c.allocated,
        color: c.color,
      }))
    );
  }

  function selectTemplate(template: BudgetTemplate) {
    setSourceId(template._id);
    setMode("template");
    setName("");
    setTotalBudget("");
    setCategories(
      template.categories.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        allocated: c.defaultAmount,
        color: c.color,
      }))
    );
  }

  function selectBlank() {
    setMode("blank");
    setSourceId(null);
    setCategories([]);
    setTotalBudget("");
    setName("");
  }

  function startEditTemplate(template: BudgetTemplate) {
    setEditingTemplate(template);
    setEditTemplateName(template.name);
    setEditTemplateCats(
      template.categories.map((c) => ({
        id: c._id,
        name: c.name,
        allocated: c.defaultAmount,
        color: c.color,
      }))
    );
    setEditNewCatName("");
  }

  function addEditCat() {
    if (!editNewCatName.trim()) return;
    const color = COLORS[editTemplateCats.length % COLORS.length];
    setEditTemplateCats([
      ...editTemplateCats,
      {
        id: crypto.randomUUID(),
        name: editNewCatName.trim(),
        allocated: 0,
        color,
      },
    ]);
    setEditNewCatName("");
  }

  async function saveEditedTemplate() {
    if (!editingTemplate || !editTemplateName.trim() || editTemplateCats.length === 0) return;
    setSavingTemplate(true);
    // Delete old and create new (simplest approach with current API)
    await deleteBudgetTemplate(editingTemplate._id);
    await createBudgetTemplate({
      name: editTemplateName.trim(),
      description: editingTemplate.description,
      categories: editTemplateCats.map((c) => ({
        name: c.name,
        defaultAmount: c.allocated,
        color: c.color,
      })),
    });
    setSavingTemplate(false);
    setEditingTemplate(null);
    router.refresh();
  }

  async function confirmDeleteTemplate() {
    if (!deleteTemplateId) return;
    setDeletingTemplate(true);
    await deleteBudgetTemplate(deleteTemplateId);
    setDeletingTemplate(false);
    setDeleteTemplateId(null);
    router.refresh();
  }

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

    if (mode === "duplicate" && sourceId) {
      const period = await duplicateBudgetPeriod(sourceId, {
        name,
        startDate,
        endDate,
        totalBudget: parseFloat(totalBudget),
      });
      router.push(`/budget/${period._id}`);
    } else {
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
  }

  // Mode selection screen
  if (mode === null) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
          <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="New Budget" />
        </div>

        <p className="text-sm text-muted-foreground">
          How would you like to create your budget?
        </p>

        <div className="space-y-3">
          <Card
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={selectBlank}
          >
            <CardContent className="p-4">
              <h3 className="font-medium">Start from scratch</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create a blank budget with custom categories
              </p>
            </CardContent>
          </Card>

          {previousBudgets.length > 0 && (
            <>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground pt-2">
                Duplicate a previous budget
              </h2>
              {previousBudgets.slice(0, 5).map((budget) => (
                <Card
                  key={budget._id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => selectDuplicate(budget)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{budget.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {budget.categories.length} categories
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {budget.categories.slice(0, 4).map((c) => (
                          <span
                            key={c._id}
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: c.color + "20",
                              color: c.color,
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {templates.length > 0 && (
            <>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground pt-2">
                Use a template
              </h2>
              {templates.map((template) => (
                <Card
                  key={template._id}
                  className="transition-colors hover:bg-accent/50"
                >
                  <CardContent className="p-4">
                    <div
                      className="cursor-pointer"
                      onClick={() => selectTemplate(template)}
                    >
                      <h3 className="font-medium">{template.name}</h3>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {template.description}
                        </p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {template.categories.slice(0, 4).map((c) => (
                          <span
                            key={c._id}
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: c.color + "20",
                              color: c.color,
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                        {template.categories.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            +{template.categories.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground"
                        onClick={() => startEditTemplate(template)}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground"
                        onClick={() => setDeleteTemplateId(template._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Edit Template Dialog */}
        <Dialog
          open={editingTemplate !== null}
          onOpenChange={(o) => !o && setEditingTemplate(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription className="sr-only">
                Edit template name and categories
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tpl-name">Template name</Label>
                <Input
                  id="edit-tpl-name"
                  value={editTemplateName}
                  onChange={(e) => setEditTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                {editTemplateCats.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 text-sm">{cat.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setEditTemplateCats(
                          editTemplateCats.filter((c) => c.id !== cat.id)
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="New category"
                    className="flex-1"
                    value={editNewCatName}
                    onChange={(e) => setEditNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEditCat()}
                  />
                  <Button variant="outline" size="icon" onClick={addEditCat}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingTemplate(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !editTemplateName.trim() ||
                  editTemplateCats.length === 0 ||
                  savingTemplate
                }
                onClick={saveEditedTemplate}
              >
                {savingTemplate ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Template Confirmation */}
        <Dialog
          open={deleteTemplateId !== null}
          onOpenChange={(o) => !o && setDeleteTemplateId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete template?</DialogTitle>
              <DialogDescription>
                This will permanently delete this template. This cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteTemplateId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deletingTemplate}
                onClick={confirmDeleteTemplate}
              >
                {deletingTemplate ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Budget form (shared for all modes)
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader
          crumbs={[{ label: "Home", href: "/" }]}
          title="New Budget"
          onBack={() => {
            if (previousBudgets.length > 0 || templates.length > 0) {
              setMode(null);
            } else {
              router.back();
            }
          }}
        >
          <div>
            <h1 className="text-xl font-bold">New Budget</h1>
            {mode === "duplicate" && (
              <p className="text-xs text-muted-foreground">
                Duplicating previous budget
              </p>
            )}
            {mode === "template" && (
              <p className="text-xs text-muted-foreground">From template</p>
            )}
          </div>
        </PageHeader>
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
            <Label>Start date</Label>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>
          <div className="space-y-2">
            <Label>End date</Label>
            <DatePicker value={endDate} onChange={setEndDate} />
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
                ? `${formatCurrency(remaining)} unallocated`
                : `${formatCurrency(Math.abs(remaining))} over`}
            </span>
          )}
        </div>

        {mode === "blank" &&
          suggestions.filter((s) => !categories.some((c) => c.name === s.name)).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions
                .filter((s) => !categories.some((c) => c.name === s.name))
                .map((s) => (
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
