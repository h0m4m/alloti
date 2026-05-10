"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCategoryRule,
  deleteCategoryRule,
  learnCategoryRulesFromHistory,
} from "@/lib/actions";
import type { CategoryRule, MatchType } from "@/lib/types";

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  contains: "Contains",
  exact: "Exact match",
  starts_with: "Starts with",
};

interface Props {
  rules: CategoryRule[];
  categoryNames: string[];
}

export function CategoryRulesView({ rules, categoryNames }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryName, setCategoryName] = useState(categoryNames[0] || "");
  const [matchType, setMatchType] = useState<MatchType>("contains");
  const [saving, setSaving] = useState(false);
  const [learning, setLearning] = useState(false);

  async function handleAdd() {
    if (!keyword.trim() || !categoryName.trim()) return;
    setSaving(true);
    await createCategoryRule({
      keyword: keyword.trim(),
      categoryName,
      matchType,
    });
    setSaving(false);
    setShowAdd(false);
    setKeyword("");
    router.refresh();
    toast.success("Rule created", {
      description: `"${keyword}" → ${categoryName}`,
    });
  }

  async function handleDelete(id: string, kw: string) {
    await deleteCategoryRule(id);
    router.refresh();
    toast.success("Rule deleted", { description: kw });
  }

  async function handleLearn() {
    setLearning(true);
    const count = await learnCategoryRulesFromHistory();
    setLearning(false);
    router.refresh();
    if (count > 0) {
      toast.success(`Learned ${count} rule${count === 1 ? "" : "s"}`, {
        description: "Created from your expense history",
      });
    } else {
      toast.info("No new rules to learn", {
        description:
          "Need 3+ consistent expenses with the same description to create a rule",
      });
    }
  }

  // Group rules by category
  const grouped = new Map<string, CategoryRule[]>();
  for (const rule of rules) {
    const group = grouped.get(rule.categoryName) || [];
    group.push(rule);
    grouped.set(rule.categoryName, group);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }]} title="Category Rules">
          <div>
            <h1 className="text-xl font-bold">Category Rules</h1>
            <p className="text-xs text-muted-foreground">
              Auto-suggest categories when adding expenses
            </p>
          </div>
        </PageHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleLearn}
            disabled={learning}
          >
            <BookOpen className="h-4 w-4" />
            {learning ? "Learning..." : "Auto-learn"}
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* How it works */}
      <Card className="border-primary/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Rules auto-suggest a category when you type a matching
              description while adding an expense.
            </p>
            <p>
              Use <strong>Auto-learn</strong> to create rules from your
              expense history (needs 3+ consistent entries).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rules list */}
      {rules.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No rules yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add rules manually or use Auto-learn from your expense history
          </p>
        </div>
      )}

      {Array.from(grouped.entries()).map(([catName, catRules]) => (
        <section key={catName} className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {catName}
          </h2>
          <Card>
            <CardContent className="p-4 space-y-2">
              {catRules.map((rule, i) => (
                <div key={rule._id}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium">
                        {rule.keyword}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {MATCH_TYPE_LABELS[rule.matchType]}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(rule._id, rule.keyword)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ))}

      {/* Add Rule Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Category Rule</DialogTitle>
            <DialogDescription>
              When an expense description matches this keyword, the category
              will be suggested automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-keyword">Keyword</Label>
              <Input
                id="rule-keyword"
                placeholder="e.g. Starbucks, Netflix, Petrol"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={categoryName}
                onValueChange={(v) => v && setCategoryName(v)}
                items={Object.fromEntries(
                  categoryNames.map((n) => [n, n])
                )}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Match type</Label>
              <Select
                value={matchType}
                onValueChange={(v) => setMatchType(v as MatchType)}
                items={{
                  contains: "Contains",
                  exact: "Exact match",
                  starts_with: "Starts with",
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="exact">Exact match</SelectItem>
                  <SelectItem value="starts_with">Starts with</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button
              disabled={!keyword.trim() || !categoryName.trim() || saving}
              onClick={handleAdd}
            >
              {saving ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
