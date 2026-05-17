"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  Receipt,
  CalendarClock,
  TrendingUp,
  Target,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { SparkleHighlight } from "@/components/icons";
import { NotificationsBell } from "@/components/notifications-card";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
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

export function DesktopHeader({ notifications, user }: Props) {
  const pathname = usePathname();

  return (
    <header className="hidden sm:block bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 mt-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="" width={24} height={24} className="dark:hidden" aria-hidden />
          <Image src="/logowhite.svg" alt="" width={24} height={24} className="hidden dark:block" aria-hidden />
          <span className="text-lg font-bold tracking-tight">Alloti</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 ${isActive ? "bg-accent text-accent-foreground" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            );
          })}
          <Link href="/budget/new">
            <Button size="sm" className="gap-1.5 ml-1">
              <Plus className="h-4 w-4" />
              New Budget
            </Button>
          </Link>
          <div className="ml-2 flex items-center gap-2">
            <NotificationsBell notifications={notifications} />
            <UserMenu
              name={user?.name}
              email={user?.email}
              image={user?.image}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}
