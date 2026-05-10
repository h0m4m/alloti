"use client";

import { useEffect, useState } from "react";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/actions";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { NotificationPreferences } from "@/lib/types";

const NOTIFICATION_OPTIONS: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: "categoryNearLimit",
    label: "Category near limit",
    description: "When a category reaches 80% spent",
  },
  {
    key: "categoryOverBudget",
    label: "Category over budget",
    description: "When a category exceeds its allocation",
  },
  {
    key: "budgetNearEnd",
    label: "Budget ending soon",
    description: "3 days before a budget period ends",
  },
  {
    key: "recurringExpenseDue",
    label: "Recurring expense due",
    description: "When a recurring payment is coming up",
  },
  {
    key: "uncategorizedCleanup",
    label: "Unallocated money",
    description: "When budget money is not allocated to categories",
  },
  {
    key: "goalProgressReminder",
    label: "Goal progress",
    description: "Reminders for savings goals with no contributions",
  },
  {
    key: "endOfPeriodReview",
    label: "Period review",
    description: "Reminder to review ended budget periods",
  },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotificationPreferences().then((data) => {
      setPrefs({
        categoryNearLimit: data.categoryNearLimit,
        categoryOverBudget: data.categoryOverBudget,
        budgetNearEnd: data.budgetNearEnd,
        recurringExpenseDue: data.recurringExpenseDue,
        uncategorizedCleanup: data.uncategorizedCleanup,
        goalProgressReminder: data.goalProgressReminder,
        endOfPeriodReview: data.endOfPeriodReview,
      });
      setLoading(false);
    });
  }, []);

  async function toggle(key: keyof NotificationPreferences) {
    if (!prefs) return;
    const newValue = !prefs[key];
    setPrefs({ ...prefs, [key]: newValue });
    await updateNotificationPreferences({ [key]: newValue });
  }

  if (loading) {
    return (
      <p className="text-xs text-muted-foreground py-2">Loading...</p>
    );
  }

  if (!prefs) return null;

  return (
    <div className="space-y-3">
      {NOTIFICATION_OPTIONS.map((opt, i) => (
        <div key={opt.key}>
          {i > 0 && <Separator className="mb-3" />}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground">
                {opt.description}
              </p>
            </div>
            <Switch
              checked={prefs[opt.key]}
              onCheckedChange={() => toggle(opt.key)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
