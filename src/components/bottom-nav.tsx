"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Receipt,
  BarChart3,
  Plus,
  Wallet,
} from "lucide-react";
import { SparkleHighlight } from "@/components/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StandaloneAddExpenseForm } from "@/components/add-expense-form";
import type { BudgetCategory } from "@/lib/types";

interface Props {
  periods: Array<{
    _id: string;
    name: string;
    categories: BudgetCategory[];
  }>;
}

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/expenses", icon: Receipt, label: "Expenses" },
  { href: "#action", icon: Plus, label: "New", isAction: true },
  { href: "/ai", icon: SparkleHighlight, label: "AI" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
];

export function BottomNav({ periods }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Don't show on login page
  if (pathname === "/login") return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
        <div className="flex items-center justify-around h-14 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <Popover
                  key={item.href}
                  open={popoverOpen}
                  onOpenChange={setPopoverOpen}
                >
                  <PopoverTrigger
                    className="flex flex-col items-center justify-center -mt-3"
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md">
                      <Icon className="h-5 w-5" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    sideOffset={12}
                    className="w-48 p-1.5"
                  >
                    <button
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm hover:bg-accent transition-colors"
                      onClick={() => {
                        setPopoverOpen(false);
                        router.push("/budget/new");
                      }}
                    >
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      Create Budget
                    </button>
                    <button
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm hover:bg-accent transition-colors"
                      onClick={() => {
                        setPopoverOpen(false);
                        setShowExpenseForm(true);
                      }}
                    >
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      Log Expense
                    </button>
                  </PopoverContent>
                </Popover>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>

      <StandaloneAddExpenseForm
        open={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        periods={periods}
      />
    </>
  );
}
