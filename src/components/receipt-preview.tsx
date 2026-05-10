"use client";

import { useState, useEffect } from "react";
import { Paperclip, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getExpenseAttachments,
  deleteExpenseAttachment,
} from "@/lib/actions";
import type { ExpenseAttachment } from "@/lib/types";

interface Props {
  expenseId: string;
  expenseDescription: string;
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function ReceiptPreview({
  expenseId,
  expenseDescription,
  open,
  onClose,
  onDeleted,
}: Props) {
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getExpenseAttachments(expenseId).then((data) => {
      setAttachments(data);
      setLoading(false);
    });
  }, [open, expenseId]);

  async function handleDelete(id: string, name: string) {
    await deleteExpenseAttachment(id);
    setAttachments((prev) => prev.filter((a) => a._id !== id));
    toast.success("Receipt deleted", { description: name });
    if (attachments.length <= 1) {
      onDeleted?.();
      onClose();
    }
  }

  function handleDownload(attachment: ExpenseAttachment) {
    const link = document.createElement("a");
    link.href = attachment.data;
    link.download = attachment.fileName;
    link.click();
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Receipts
          </DialogTitle>
          <DialogDescription>{expenseDescription}</DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Loading...
          </p>
        )}

        {!loading && attachments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No receipts attached
          </p>
        )}

        <div className="space-y-4">
          {attachments.map((att) => (
            <div key={att._id} className="space-y-2">
              {att.fileType.startsWith("image/") ? (
                <img
                  src={att.data}
                  alt={att.fileName}
                  className="w-full rounded-md border"
                />
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-md border">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">
                    {att.fileName}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {att.fileName} — {formatSize(att.fileSize)}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDownload(att)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(att._id, att.fileName)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
