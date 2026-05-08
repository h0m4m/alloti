"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Paperclip, X, ImageIcon } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { addExpense, addExpenseAttachment, suggestCategory } from "@/lib/actions";
import { formatCurrency, formatDateInput } from "@/lib/format";
import type { BudgetCategory, CategorySuggestion } from "@/lib/types";

interface PendingFile {
  file: File;
  preview: string;
  dataUrl: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  budgetPeriodId: string;
  categories: BudgetCategory[];
  defaultCategoryId: string | null;
}

interface StandaloneProps {
  open: boolean;
  onClose: () => void;
  periods: Array<{ _id: string; name: string; categories: BudgetCategory[] }>;
}

function AddExpenseFormInner({
  onClose,
  budgetPeriodId,
  categories,
  defaultCategoryId,
}: Omit<Props, "open">) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState(
    defaultCategoryId || categories[0]?._id || ""
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(
    null
  );
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced category suggestion on description change
  useEffect(() => {
    if (suggestionApplied) return;
    if (description.trim().length < 2) {
      setSuggestion(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const result = await suggestCategory(description, budgetPeriodId);
      setSuggestion(result);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description, budgetPeriodId, suggestionApplied]);

  function applySuggestion() {
    if (!suggestion) return;
    const match = categories.find(
      (c) => c.name.toLowerCase() === suggestion.categoryName.toLowerCase()
    );
    if (match) {
      setCategoryId(match._id);
      setSuggestionApplied(true);
      setSuggestion(null);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: `${file.name} exceeds 5MB limit`,
        });
        continue;
      }

      const dataUrl = await readFileAsDataUrl(file);
      const preview = file.type.startsWith("image/") ? dataUrl : "";

      setPendingFiles((prev) => [...prev, { file, preview, dataUrl }]);
    }

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!categoryId || !description || !amount) return;
    setSaving(true);

    const expense = await addExpense({
      budgetPeriodId,
      categoryId,
      description,
      amount: parseFloat(amount),
      date,
    });

    // Upload attachments
    if (pendingFiles.length > 0) {
      for (const pf of pendingFiles) {
        try {
          await addExpenseAttachment({
            expenseId: expense._id,
            fileName: pf.file.name,
            fileType: pf.file.type,
            fileSize: pf.file.size,
            data: pf.dataUrl,
          });
        } catch {
          toast.error("Failed to upload receipt", {
            description: pf.file.name,
          });
        }
      }
    }

    setSaving(false);
    onClose();
    router.refresh();
    toast.success("Expense added", {
      description: `${formatCurrency(parseFloat(amount))} — ${description}${pendingFiles.length > 0 ? ` (${pendingFiles.length} receipt${pendingFiles.length > 1 ? "s" : ""})` : ""}`,
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                categoryId === cat._id
                  ? "ring-2 ring-offset-2 ring-offset-background font-medium"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: cat.color + "20",
                color: cat.color,
                ...(categoryId === cat._id ? { ringColor: cat.color } : {}),
              }}
              onClick={() => {
                setCategoryId(cat._id);
                setSuggestionApplied(true);
                setSuggestion(null);
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <Input
          id="desc"
          placeholder="What did you spend on?"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSuggestionApplied(false);
          }}
        />
        {suggestion && (
          <button
            type="button"
            onClick={applySuggestion}
            className="flex items-start gap-2 w-full text-left px-3 py-2 rounded-md bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <span className="text-xs text-muted-foreground">
              {suggestion.reason}
              <span className="text-primary font-medium ml-1">
                Apply
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <DatePicker value={date} onChange={setDate} />
        </div>
      </div>

      {/* Receipt attachment */}
      <div className="space-y-2">
        <Label>Receipt</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach receipt
          </Button>
          {pendingFiles.map((pf, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs group"
            >
              {pf.preview ? (
                <img
                  src={pf.preview}
                  alt={pf.file.name}
                  className="h-6 w-6 rounded object-cover"
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate max-w-25">{pf.file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
        {pendingFiles.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} —{" "}
            {(
              pendingFiles.reduce((s, f) => s + f.file.size, 0) /
              1024 /
              1024
            ).toFixed(1)}
            MB
          </p>
        )}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!categoryId || !description || !amount || saving}
        onClick={handleSubmit}
      >
        {saving ? "Adding..." : "Add Expense"}
      </Button>
    </div>
  );
}

export function AddExpenseForm({
  open,
  onClose,
  budgetPeriodId,
  categories,
  defaultCategoryId,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription className="sr-only">
              Add a new expense to this budget
            </DialogDescription>
          </DialogHeader>
          {open && (
            <AddExpenseFormInner
              onClose={onClose}
              budgetPeriodId={budgetPeriodId}
              categories={categories}
              defaultCategoryId={defaultCategoryId}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>Add Expense</DrawerTitle>
          </DrawerHeader>
          {open && (
            <AddExpenseFormInner
              onClose={onClose}
              budgetPeriodId={budgetPeriodId}
              categories={categories}
              defaultCategoryId={defaultCategoryId}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function StandaloneExpenseFormInner({
  onClose,
  periods,
}: Omit<StandaloneProps, "open">) {
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    periods[0]?._id || ""
  );

  const selectedPeriod = periods.find((p) => p._id === selectedPeriodId);
  const categories = selectedPeriod?.categories || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Budget</Label>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p._id}
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                selectedPeriodId === p._id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              onClick={() => setSelectedPeriodId(p._id)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      {selectedPeriodId && categories.length > 0 && (
        <AddExpenseFormInner
          onClose={onClose}
          budgetPeriodId={selectedPeriodId}
          categories={categories}
          defaultCategoryId={null}
        />
      )}
      {selectedPeriodId && categories.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          This budget has no categories yet.
        </p>
      )}
    </div>
  );
}

export function StandaloneAddExpenseForm({
  open,
  onClose,
  periods,
}: StandaloneProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (periods.length === 0) {
    if (isDesktop) {
      return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
              <DialogDescription className="sr-only">
                Add a new expense
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center py-4">
              Create a budget first to start logging expenses.
            </p>
          </DialogContent>
        </Dialog>
      );
    }
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg px-4 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle>Add Expense</DrawerTitle>
            </DrawerHeader>
            <p className="text-sm text-muted-foreground text-center py-4">
              Create a budget first to start logging expenses.
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription className="sr-only">
              Add a new expense
            </DialogDescription>
          </DialogHeader>
          {open && (
            <StandaloneExpenseFormInner onClose={onClose} periods={periods} />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle>Add Expense</DrawerTitle>
          </DrawerHeader>
          {open && (
            <StandaloneExpenseFormInner onClose={onClose} periods={periods} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
