"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Landmark, Trash2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  createInvestmentAccount,
  deleteInvestmentAccount,
  updateInvestmentAccount,
} from "@/lib/investment-actions";
import type { InvestmentAccount, InvestmentAccountType } from "@/lib/types";

interface Props {
  accounts: InvestmentAccount[];
}

const ACCOUNT_TYPE_LABELS: Record<InvestmentAccountType, string> = {
  brokerage: "Brokerage",
  manual: "Manual",
  retirement: "Retirement",
  other: "Other",
};

export function InvestmentAccountsView({ accounts }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<InvestmentAccountType>("brokerage");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setName("");
    setType("brokerage");
    setCurrency("USD");
    setEditingId(null);
  }

  function openEdit(account: InvestmentAccount) {
    setName(account.name);
    setType(account.type);
    setCurrency(account.currency);
    setEditingId(account._id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateInvestmentAccount(editingId, { name, type, currency });
        toast.success("Account updated");
      } else {
        await createInvestmentAccount({ name, type, currency });
        toast.success("Account created");
      }
      setShowForm(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Failed to save account");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInvestmentAccount(id);
      toast.success("Account deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete account");
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          crumbs={[{ label: "Investments", href: "/investments" }]}
          title="Accounts"
        />
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Account</span>
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Landmark className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">No investment accounts yet</p>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" />
            Create Investment Account
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <Card key={account._id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Landmark className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {account.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs">
                        {ACCOUNT_TYPE_LABELS[account.type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {account.currency}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(account._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setShowForm(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Account" : "Create Investment Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                placeholder="e.g. Interactive Brokers"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select
                value={type}
                onValueChange={(v) => { if (v) setType(v as InvestmentAccountType); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brokerage">Brokerage</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v) => { if (v) setCurrency(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Account"
                  : "Create Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
