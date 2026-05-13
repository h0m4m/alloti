import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopHeader } from "@/components/desktop-header";
import { MobileHeader } from "@/components/mobile-header";
import { CurrencyProvider } from "@/components/currency-provider";
import { Toaster } from "@/components/ui/sonner";
import { getUserPreferences, getBudgetPeriods, generateNotifications } from "@/lib/actions";
import { auth } from "@/auth";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alloti — Budget Smarter",
  description: "Date-based budgeting with smart category tracking",
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let currency = "USD";
  let periods: Array<{ _id: string; name: string; categories: Array<{ _id: string; name: string; allocated: number; spent: number; color: string }> }> = [];
  let notifications: Array<import("@/lib/types").AppNotification> = [];
  let user: { name?: string | null; email?: string | null; image?: string | null } | null = null;
  try {
    const [prefs, allPeriods, session, notifs] = await Promise.all([
      getUserPreferences(),
      getBudgetPeriods(),
      auth(),
      generateNotifications(),
    ]);
    currency = prefs.defaultCurrency;
    notifications = notifs as typeof notifications;
    user = session?.user ?? null;
    const now = new Date();
    periods = allPeriods
      .filter((p: { endDate: string }) => new Date(p.endDate) >= now)
      .map((p: { _id: string; name: string; categories: Array<{ _id: string; name: string; allocated: number; spent: number; color: string }> }) => ({
        _id: p._id,
        name: p.name,
        categories: p.categories,
      }));
  } catch {
    // Not logged in — use default
  }

  return (
    <html
      lang="en"
      className={`${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <CurrencyProvider currency={currency} />
            {user && <DesktopHeader notifications={notifications} user={user} />}
            {user && <MobileHeader notifications={notifications} user={user} />}
            <main className="flex-1 pb-16 sm:pb-0">{children}</main>
            <BottomNav periods={periods} />
            <Toaster position="top-right" richColors closeButton />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
