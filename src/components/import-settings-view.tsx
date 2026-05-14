"use client";

import { useState } from "react";
import {
  Smartphone,
  Copy,
  RefreshCw,
  Check,
  ExternalLink,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  createImportToken,
  regenerateImportToken,
  toggleImportToken,
  deleteImportToken,
} from "@/lib/actions";
import type { ImportTokenData } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface Props {
  importToken: ImportTokenData | null;
}

export function ImportSettingsView({ importToken: initial }: Props) {
  const [token, setToken] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);

  const importUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/import/sms/${token.token}`
    : "";

  async function handleSetup() {
    setLoading(true);
    const result = await createImportToken();
    setToken(result);
    setLoading(false);
    toast.success("Import token created");
  }

  async function handleRegenerate() {
    setLoading(true);
    const result = await regenerateImportToken();
    setToken(result);
    setLoading(false);
    setShowRegenerate(false);
    toast.success("Import token regenerated");
  }

  async function handleToggle(enabled: boolean) {
    await toggleImportToken(enabled);
    setToken((prev) => (prev ? { ...prev, enabled } : null));
    toast.success(enabled ? "Import enabled" : "Import disabled");
  }

  async function handleDelete() {
    setLoading(true);
    await deleteImportToken();
    setToken(null);
    setLoading(false);
    setShowDelete(false);
    toast.success("Import token deleted");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      <div className="sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader
          crumbs={[
            { label: "Home", href: "/" },
            { label: "Settings", href: "/settings" },
          ]}
          title="Transaction Import"
        />
      </div>

      {/* Status Overview */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                SMS Import via Apple Shortcuts
              </p>
            </div>
            {token && (
              <Badge variant={token.enabled ? "default" : "secondary"}>
                {token.enabled ? "Active" : "Disabled"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Automatically import bank transaction SMS messages as expenses using
            Apple Shortcuts. Each SMS is parsed by AI to extract the amount,
            merchant, and category.
          </p>
        </CardContent>
      </Card>

      {!token ? (
        /* Setup Card */
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Get Started</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Set up automatic SMS import to have your bank transaction alerts
              create expenses in your budget automatically.
            </p>
            <Button onClick={handleSetup} disabled={loading}>
              {loading ? "Setting up..." : "Set Up SMS Import"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Enable/Disable */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Enable Import</Label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, incoming SMS requests will be rejected.
                  </p>
                </div>
                <Switch
                  checked={token.enabled}
                  onCheckedChange={handleToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Connection Details */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <p className="text-sm font-medium">Connection Details</p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Import URL
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md break-all font-mono">
                      {importUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(importUrl)}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your token is embedded in the URL. Keep this URL private.
                  </p>
                </div>

                {token.lastImportAt && (
                  <p className="text-xs text-muted-foreground">
                    Last import:{" "}
                    {formatDistanceToNow(new Date(token.lastImportAt), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerate(true)}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Regenerate Token
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Guide */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Apple Shortcuts Setup</p>
              </div>

              <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                <li>
                  Open the <strong>Shortcuts</strong> app on your iPhone.
                </li>
                <li>
                  Create a new <strong>Automation</strong> that triggers when you
                  receive an SMS from your bank.
                </li>
                <li>
                  Add a <strong>&quot;Get Contents of URL&quot;</strong> action with:
                  <ul className="mt-1.5 ml-5 space-y-1 list-disc">
                    <li>
                      URL: <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{importUrl}</code>
                    </li>
                    <li>Method: <strong>POST</strong></li>
                    <li>
                      Headers: <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">Content-Type: application/json</code>
                    </li>
                    <li>
                      Request Body (JSON):
                      <pre className="mt-1 text-xs bg-muted px-3 py-2 rounded-md font-mono overflow-x-auto">
{`{
  "message": "[Shortcut Input]"
}`}
                      </pre>
                    </li>
                  </ul>
                </li>
                <li>
                  Set the automation to <strong>Run Immediately</strong> without
                  asking.
                </li>
                <li>
                  That&apos;s it! Bank SMS alerts will now automatically create
                  expenses in your budget.
                </li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}

      {/* Regenerate Confirmation */}
      <Dialog open={showRegenerate} onOpenChange={setShowRegenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate import token?</DialogTitle>
            <DialogDescription>
              This will invalidate your current token. You&apos;ll need to update
              the token in your Apple Shortcut.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerate(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRegenerate} disabled={loading}>
              {loading ? "Regenerating..." : "Regenerate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove SMS import?</DialogTitle>
            <DialogDescription>
              This will delete your import token. Any Apple Shortcuts using this
              token will stop working. Your existing imported expenses will not
              be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
