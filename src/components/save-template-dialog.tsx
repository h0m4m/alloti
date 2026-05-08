"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { saveAsTemplate } from "@/lib/actions";

interface Props {
  open: boolean;
  onClose: () => void;
  budgetPeriodId: string;
  budgetName: string;
}

export function SaveTemplateDialog({
  open,
  onClose,
  budgetPeriodId,
  budgetName,
}: Props) {
  const [templateName, setTemplateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!templateName.trim()) return;
    setSaving(true);
    await saveAsTemplate(budgetPeriodId, templateName.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setTemplateName("");
      onClose();
    }, 1200);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setTemplateName("");
          setSaved(false);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save the categories from &quot;{budgetName}&quot; as a reusable
            template for future budgets.
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <p className="text-sm text-center py-4 text-green-600">
            Template saved!
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Monthly Budget"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>
        )}

        {!saved && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!templateName.trim() || saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
