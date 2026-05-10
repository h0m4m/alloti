"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileDown,
  CalendarRange,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { exportData } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import type { ExportScope } from "@/lib/actions";

type Format = "csv" | "json" | "xlsx" | "pdf";

const SCOPES: { key: ExportScope; label: string; description: string }[] = [
  {
    key: "expenses",
    label: "Expenses",
    description: "All expense records with categories and dates",
  },
  {
    key: "budgets",
    label: "Budget Periods",
    description: "Budget periods with category allocations and spending",
  },
  {
    key: "income",
    label: "Income",
    description: "Income entries with sources and amounts",
  },
  {
    key: "savings_goals",
    label: "Savings Goals",
    description: "Goals and their contributions",
  },
  {
    key: "recurring_expenses",
    label: "Recurring Expenses",
    description: "Recurring bills and subscriptions",
  },
];

const FORMATS: {
  key: Format;
  label: string;
  description: string;
  icon: typeof FileText;
}[] = [
  { key: "csv", label: "CSV", description: "Spreadsheet-friendly", icon: FileSpreadsheet },
  { key: "xlsx", label: "XLSX", description: "Excel workbook", icon: FileDown },
  { key: "pdf", label: "PDF", description: "Print-ready document", icon: FileText },
  { key: "json", label: "JSON", description: "Structured data", icon: FileJson },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function generateXlsx(data: Record<string, unknown[]>) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  if (data.budgets) {
    const rows = (data.budgets as Record<string, unknown>[]).map((b) => {
      const cats = b.categories as { name: string; allocated: number; spent: number }[];
      return {
        Name: b.name,
        "Start Date": b.startDate,
        "End Date": b.endDate,
        "Total Budget": b.totalBudget,
        Categories: cats.map((c) => `${c.name} (${formatCurrency(c.allocated)}/${formatCurrency(c.spent)})`).join("; "),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Budgets");
  }

  if (data.expenses) {
    const rows = (data.expenses as Record<string, unknown>[]).map((e) => ({
      Description: e.description,
      Amount: e.amount,
      Date: e.date,
      Category: e.category,
      Budget: e.budget,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  }

  if (data.income) {
    const rows = (data.income as Record<string, unknown>[]).map((i) => ({
      Source: i.source,
      Amount: i.amount,
      Date: i.date,
      Note: i.note,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Income");
  }

  if (data.savings_goals) {
    const rows = (data.savings_goals as Record<string, unknown>[]).map((g) => ({
      Name: g.name,
      Target: g.targetAmount,
      Current: g.currentAmount,
      Status: g.status,
      "Target Date": g.targetDate,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Savings Goals");
  }

  if (data.recurring_expenses) {
    const rows = (data.recurring_expenses as Record<string, unknown>[]).map((r) => ({
      Name: r.name,
      Amount: r.amount,
      Category: r.categoryName,
      Frequency: r.frequency,
      "Start Date": r.startDate,
      "End Date": r.endDate,
      "Next Due": r.nextDueDate,
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Recurring Expenses");
  }

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

async function generatePdf(data: Record<string, unknown[]>) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(18);
  doc.text("Alloti — Data Export", 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleDateString("en-US", { dateStyle: "long" }), 14, y);
  doc.setTextColor(0);
  y += 10;

  if (data.expenses) {
    const rows = (data.expenses as Record<string, unknown>[]).map((e) => [
      String(e.description ?? ""),
      formatCurrency(Number(e.amount)),
      String(e.date ?? ""),
      String(e.category ?? ""),
      String(e.budget ?? ""),
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Description", "Amount", "Date", "Category", "Budget"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 41, 41] },
      didDrawPage: () => {
        doc.setFontSize(11);
        doc.text("Expenses", 14, y - 3);
      },
    });
    y = ((doc as unknown as Record<string, { finalY: number }>).lastAutoTable).finalY + 12;
  }

  if (data.budgets) {
    if (y > 240) { doc.addPage(); y = 15; }
    const rows = (data.budgets as Record<string, unknown>[]).map((b) => {
      const cats = b.categories as { name: string; allocated: number; spent: number }[];
      return [
        String(b.name ?? ""),
        String(b.startDate ?? ""),
        String(b.endDate ?? ""),
        formatCurrency(Number(b.totalBudget)),
        cats.map((c) => c.name).join(", "),
      ];
    });
    autoTable(doc, {
      startY: y,
      head: [["Name", "Start", "End", "Total Budget", "Categories"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 41, 41] },
      didDrawPage: () => {
        doc.setFontSize(11);
        doc.text("Budget Periods", 14, y - 3);
      },
    });
    y = ((doc as unknown as Record<string, { finalY: number }>).lastAutoTable).finalY + 12;
  }

  if (data.income) {
    if (y > 240) { doc.addPage(); y = 15; }
    const rows = (data.income as Record<string, unknown>[]).map((i) => [
      String(i.source ?? ""),
      formatCurrency(Number(i.amount)),
      String(i.date ?? ""),
      String(i.note ?? ""),
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Source", "Amount", "Date", "Note"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 41, 41] },
      didDrawPage: () => {
        doc.setFontSize(11);
        doc.text("Income", 14, y - 3);
      },
    });
    y = ((doc as unknown as Record<string, { finalY: number }>).lastAutoTable).finalY + 12;
  }

  if (data.savings_goals) {
    if (y > 240) { doc.addPage(); y = 15; }
    const rows = (data.savings_goals as Record<string, unknown>[]).map((g) => [
      String(g.name ?? ""),
      formatCurrency(Number(g.targetAmount)),
      formatCurrency(Number(g.currentAmount)),
      String(g.status ?? ""),
      g.targetDate ? String(g.targetDate) : "—",
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Name", "Target", "Current", "Status", "Target Date"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 41, 41] },
      didDrawPage: () => {
        doc.setFontSize(11);
        doc.text("Savings Goals", 14, y - 3);
      },
    });
    y = ((doc as unknown as Record<string, { finalY: number }>).lastAutoTable).finalY + 12;
  }

  if (data.recurring_expenses) {
    if (y > 240) { doc.addPage(); y = 15; }
    const rows = (data.recurring_expenses as Record<string, unknown>[]).map((r) => [
      String(r.name ?? ""),
      formatCurrency(Number(r.amount)),
      String(r.categoryName ?? ""),
      String(r.frequency ?? ""),
      String(r.status ?? ""),
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Name", "Amount", "Category", "Frequency", "Status"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 41, 41] },
      didDrawPage: () => {
        doc.setFontSize(11);
        doc.text("Recurring Expenses", 14, y - 3);
      },
    });
  }

  return doc.output("blob");
}

export function ExportDataView() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<ExportScope>>(
    new Set(SCOPES.map((s) => s.key))
  );
  const [format, setFormat] = useState<Format>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState(false);

  function toggleScope(scope: ExportScope) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) next.delete(scope);
      else next.add(scope);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(SCOPES.map((s) => s.key)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  async function handleExport() {
    if (selected.size === 0) {
      toast.error("Select at least one data type to export");
      return;
    }

    setExporting(true);
    const date = new Date().toISOString().split("T")[0];
    const scopes = Array.from(selected);

    const from = dateFrom || undefined;
    const to = dateTo || undefined;

    try {
      if (format === "xlsx" || format === "pdf") {
        const raw = await exportData(scopes, "json", from, to);
        const data = JSON.parse(raw) as Record<string, unknown[]>;

        if (format === "xlsx") {
          const blob = await generateXlsx(data);
          downloadBlob(blob, `alloti-export-${date}.xlsx`);
        } else {
          const blob = await generatePdf(data);
          downloadBlob(blob, `alloti-export-${date}.pdf`);
        }
      } else {
        const data = await exportData(scopes, format, from, to);
        const blob = new Blob([data], {
          type: format === "json" ? "application/json" : "text/csv",
        });
        downloadBlob(blob, `alloti-export-${date}.${format}`);
      }

      toast.success("Export downloaded", {
        description: `${selected.size} data type${selected.size > 1 ? "s" : ""} as ${format.toUpperCase()}`,
      });
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-6 pb-8 space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
      <PageHeader crumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }]} title="Export Data">
        <div>
          <h1 className="text-xl font-bold">Export Data</h1>
          <p className="text-xs text-muted-foreground">
            Download your data in any format
          </p>
        </div>
      </PageHeader>
      </div>

      {/* Format Selection */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <p className="text-sm font-medium">Format</p>
          <div className="grid grid-cols-2 gap-3">
            {FORMATS.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFormat(f.key)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    format === f.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${format === f.key ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scope Selection */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Data to Export</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                All
              </Button>
              <Button variant="ghost" size="sm" onClick={selectNone}>
                None
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {SCOPES.map((scope, i) => (
              <div key={scope.key}>
                {i > 0 && <Separator className="my-2" />}
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor={`scope-${scope.key}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {scope.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {scope.description}
                    </p>
                  </div>
                  <Switch
                    id={`scope-${scope.key}`}
                    checked={selected.has(scope.key)}
                    onCheckedChange={() => toggleScope(scope.key)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Date Range</p>
            <span className="text-xs text-muted-foreground ml-auto">
              Optional
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty to export all data. Filters expenses, income, and
            budgets by date.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date-from" className="text-xs">
                From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-to" className="text-xs">
                To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear dates
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button
        className="w-full gap-2"
        size="lg"
        disabled={selected.size === 0 || exporting}
        onClick={handleExport}
      >
        <Download className="h-4 w-4" />
        {exporting
          ? "Exporting..."
          : `Export ${selected.size} data type${selected.size !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
