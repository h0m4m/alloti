"use client";

import { usePathname } from "next/navigation";

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const topLevelPages = ["/", "/expenses", "/ai", "/reports"];
  const hasBottomNav = topLevelPages.includes(pathname);

  return (
    <main className={`flex-1 ${hasBottomNav ? "pb-16" : "pb-0"} sm:pb-0 sm:pl-52 sm:pt-6`}>
      {children}
    </main>
  );
}
