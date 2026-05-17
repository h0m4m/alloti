"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Plus,
  Receipt,
  CalendarClock,
  TrendingUp,
  Target,
  BarChart3,
  Briefcase,
  Wallet,
  User,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronsUpDown,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { SparkleHighlight } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { AppNotification } from "@/lib/types";

const NAV_LINKS = [
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/recurring", label: "Recurring", icon: CalendarClock },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/investments", label: "Invest", icon: Briefcase },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/ai", label: "AI", icon: SparkleHighlight },
];

interface Props {
  notifications: AppNotification[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function DesktopSidebar({ notifications, user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <aside className="hidden sm:flex fixed inset-y-0 left-0 z-40 w-52 flex-col bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex flex-col h-full px-3 py-4">
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-4">
          <Image src="/logo.svg" alt="" width={24} height={24} className="dark:hidden" aria-hidden />
          <Image src="/logowhite.svg" alt="" width={24} height={24} className="hidden dark:block" aria-hidden />
          <span className="text-lg font-bold tracking-tight">Alloti</span>
        </Link>

        <Popover open={createOpen} onOpenChange={setCreateOpen}>
          <PopoverTrigger className="w-full mb-4">
            <Button size="sm" className="w-full justify-start gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" sideOffset={4} className="w-48 p-1.5">
            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm hover:bg-accent transition-colors"
              onClick={() => {
                setCreateOpen(false);
                router.push("/budget/new");
              }}
            >
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Create Budget
            </button>
            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm hover:bg-accent transition-colors"
              onClick={() => {
                setCreateOpen(false);
                router.push("/expenses");
              }}
            >
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Log Expense
            </button>
          </PopoverContent>
        </Popover>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start gap-2 ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <SidebarProfileMenu user={user} notifications={notifications} />
      </div>
    </aside>
  );
}

function SeverityIcon({ severity }: { severity: AppNotification["severity"] }) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
    case "warning":
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
    case "info":
      return <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  }
}

function SidebarProfileMenu({
  user,
  notifications,
}: {
  user: Props["user"];
  notifications: AppNotification[];
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const count = visible.length;
  const hasCritical = visible.some((n) => n.severity === "critical");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full rounded-md px-2 py-2 hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex items-center gap-2">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="h-8 w-8 rounded-full shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="h-4 w-4" />
            Light
            {theme === "light" && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="h-4 w-4" />
            Dark
            {theme === "dark" && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="h-4 w-4" />
            System
            {theme === "system" && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="relative">
              <Bell className="h-4 w-4" />
              {count > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 flex items-center justify-center h-3.5 min-w-3.5 px-0.5 rounded-full text-[9px] font-bold ${
                    hasCritical
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </div>
            Notifications
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-72 p-0">
            {count === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No notifications
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {visible.slice(0, 5).map((notif, i) => (
                  <div key={notif.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-start gap-2 px-3 py-2.5 group hover:bg-muted/50 transition-colors">
                      <SeverityIcon severity={notif.severity} />
                      <div className="flex-1 min-w-0">
                        {notif.relatedPath ? (
                          <Link
                            href={notif.relatedPath}
                            className="text-xs font-medium hover:underline"
                          >
                            {notif.title}
                          </Link>
                        ) : (
                          <span className="text-xs font-medium">{notif.title}</span>
                        )}
                        <p className="text-[11px] text-muted-foreground truncate">
                          {notif.message}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissed((prev) => new Set(prev).add(notif.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-muted"
                        aria-label="Dismiss"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {count > 0 && (
              <>
                <Separator />
                <div className="p-2">
                  <Link href="/notifications">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View all notifications
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
