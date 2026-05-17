"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Crumb {
  label: string;
  href: string;
}

interface Props {
  crumbs: Crumb[];
  title: string;
  onBack?: () => void;
  children?: React.ReactNode;
}

export function PageHeader({ crumbs, title, onBack, children }: Props) {
  const router = useRouter();
  const backHref = crumbs.length > 0 ? crumbs[crumbs.length - 1].href : "/";
  const isTopLevel = crumbs.length === 1 && crumbs[0].href === "/";
  // For inner pages, skip the "Home" crumb — only show intermediate crumbs
  const innerCrumbs = isTopLevel ? [] : crumbs.filter((c) => c.href !== "/");

  return (
    <div className="flex items-center gap-3">
      {/* Mobile: back arrow */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={onBack ?? (() => router.push(backHref))}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      {/* Desktop: plain title for top-level, breadcrumbs for inner pages */}
      {isTopLevel ? (
        <h1 className="hidden sm:block text-xl font-bold truncate">{title}</h1>
      ) : (
        <nav className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground min-w-0">
          {innerCrumbs.map((crumb) => (
            <span key={crumb.href} className="flex items-center gap-1">
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </span>
          ))}
          <span className="text-foreground font-medium truncate">{title}</span>
        </nav>
      )}

      {/* Mobile: title (next to back arrow) */}
      <div className="sm:hidden flex-1 min-w-0">
        {children ?? <h1 className="text-xl font-bold truncate">{title}</h1>}
      </div>
    </div>
  );
}
