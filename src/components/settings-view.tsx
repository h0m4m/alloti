"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  User,
  Settings2,
  Download,
  Sparkles,
  Smartphone,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateUserPreferences, deleteAllUserData } from "@/lib/actions";
import type { UserPreferencesData, BudgetTemplate } from "@/lib/types";

const CURRENCIES = [
  { code: "USD", label: "USD ($)" },
  { code: "EUR", label: "EUR (€)" },
  { code: "GBP", label: "GBP (£)" },
  { code: "AED", label: "AED (د.إ)" },
  { code: "SAR", label: "SAR (﷼)" },
  { code: "CAD", label: "CAD ($)" },
  { code: "AUD", label: "AUD ($)" },
  { code: "JPY", label: "JPY (¥)" },
  { code: "INR", label: "INR (₹)" },
];

const DURATIONS = [
  { value: 7, label: "Weekly (7 days)" },
  { value: 14, label: "Biweekly (14 days)" },
  { value: 30, label: "Monthly (30 days)" },
  { value: 90, label: "Quarterly (90 days)" },
  { value: 365, label: "Yearly (365 days)" },
];

const DATE_FORMATS = [
  { value: "MMM d, yyyy", label: "Jan 1, 2026" },
  { value: "dd/MM/yyyy", label: "01/01/2026" },
  { value: "MM/dd/yyyy", label: "01/01/2026 (US)" },
  { value: "yyyy-MM-dd", label: "2026-01-01" },
];

const WEEK_STARTS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 6, label: "Saturday" },
];

const ROLLOVER_OPTIONS = [
  { value: "ask", label: "Ask me each time" },
  { value: "rollover", label: "Always roll over" },
  { value: "ignore", label: "Always ignore" },
];

interface Props {
  user: { name: string | null; email: string | null; image: string | null };
  preferences: UserPreferencesData;
  templates: BudgetTemplate[];
}

export function SettingsView({ user, preferences, templates }: Props) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [showDeleteData, setShowDeleteData] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function savePrefs(updates: Partial<UserPreferencesData>) {
    const next = { ...prefs, ...updates };
    setPrefs(next);
    setSaving(true);
    await updateUserPreferences(updates);
    setSaving(false);
    toast.success("Settings saved");
  }

  async function handleDeleteAllData() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    await deleteAllUserData();
    setDeleting(false);
    setShowDeleteData(false);
    toast.success("All financial data deleted");
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="Settings" />
      </div>

      {/* Profile */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Profile</p>
          </div>
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-14 w-14 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Profile is managed through your sign-in provider.
          </p>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Preferences</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select
                value={prefs.defaultCurrency}
                onValueChange={(v) => v && savePrefs({ defaultCurrency: v })}
                items={Object.fromEntries(
                  CURRENCIES.map((c) => [c.code, c.label])
                )}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Budget Duration</Label>
              <Select
                value={String(prefs.defaultBudgetDuration)}
                onValueChange={(v) =>
                  v && savePrefs({ defaultBudgetDuration: Number(v) })
                }
                items={Object.fromEntries(
                  DURATIONS.map((d) => [String(d.value), d.label])
                )}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>First Day of Week</Label>
              <Select
                value={String(prefs.firstDayOfWeek)}
                onValueChange={(v) =>
                  v && savePrefs({ firstDayOfWeek: Number(v) })
                }
                items={Object.fromEntries(
                  WEEK_STARTS.map((w) => [String(w.value), w.label])
                )}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_STARTS.map((w) => (
                    <SelectItem key={w.value} value={String(w.value)}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={prefs.dateFormat}
                onValueChange={(v) => v && savePrefs({ dateFormat: v })}
                items={Object.fromEntries(
                  DATE_FORMATS.map((d) => [d.value, d.label])
                )}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Defaults */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <p className="text-sm font-medium">Budget Defaults</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Template</Label>
              <Select
                value={prefs.defaultTemplateId || "__none__"}
                onValueChange={(v) =>
                  savePrefs({
                    defaultTemplateId:
                      !v || v === "__none__" ? null : v,
                  })
                }
                items={{
                  __none__: "None",
                  ...Object.fromEntries(
                    templates.map((t) => [t._id, t.name])
                  ),
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rollover Behavior</Label>
              <Select
                value={prefs.defaultRolloverBehavior}
                onValueChange={(v) =>
                  v &&
                  savePrefs({
                    defaultRolloverBehavior:
                      v as UserPreferencesData["defaultRolloverBehavior"],
                  })
                }
                items={Object.fromEntries(
                  ROLLOVER_OPTIONS.map((r) => [r.value, r.label])
                )}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLLOVER_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-1">
          <Link
            href="/settings/rules"
            className="flex items-center gap-2 py-2 text-sm hover:text-primary transition-colors"
          >
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            Category Rules
            <span className="ml-auto text-xs text-muted-foreground">
              Manage
            </span>
          </Link>
          <Separator />
          <Link
            href="/settings/import"
            className="flex items-center gap-2 py-2 text-sm hover:text-primary transition-colors"
          >
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            Transaction Import
            <span className="ml-auto text-xs text-muted-foreground">
              SMS via Apple Shortcuts
            </span>
          </Link>
          <Separator />
          <Link
            href="/settings/export"
            className="flex items-center gap-2 py-2 text-sm hover:text-primary transition-colors"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
            Export Data
            <span className="ml-auto text-xs text-muted-foreground">
              CSV / XLSX / PDF / JSON
            </span>
          </Link>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">Danger Zone</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete All Financial Data</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove all budgets, expenses, income, goals, and
                settings. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteData(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">
                Sign out of your account.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteData} onOpenChange={setShowDeleteData}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all financial data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your budgets, expenses, income
              records, savings goals, templates, and settings. Your account will
              remain but all data will be gone forever.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>
              Type <span className="font-mono font-bold">DELETE</span> to
              confirm
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteData(false);
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE" || deleting}
              onClick={handleDeleteAllData}
            >
              {deleting ? "Deleting..." : "Delete Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
