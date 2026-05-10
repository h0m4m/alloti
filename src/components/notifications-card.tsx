"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { AppNotification } from "@/lib/types";

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

function fireToast(notif: AppNotification) {
  const opts = {
    description: notif.message,
    duration: notif.severity === "critical" ? 8000 : 5000,
  };

  switch (notif.severity) {
    case "critical":
      toast.error(notif.title, opts);
      break;
    case "warning":
      toast.warning(notif.title, opts);
      break;
    case "info":
      toast.info(notif.title, opts);
      break;
  }
}

function sendBrowserNotification(notif: AppNotification) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const tag = notif.id;
  const icon =
    notif.severity === "critical"
      ? "🚨"
      : notif.severity === "warning"
        ? "⚠️"
        : "ℹ️";

  new Notification(`${icon} ${notif.title}`, {
    body: notif.message,
    tag,
    silent: notif.severity === "info",
  });
}

interface Props {
  notifications: AppNotification[];
}

export function NotificationsBell({ notifications }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const firedRef = useRef(false);

  // Fire sonner toasts and browser notifications on mount (once)
  useEffect(() => {
    if (firedRef.current || notifications.length === 0) return;
    firedRef.current = true;

    const critical = notifications.filter((n) => n.severity === "critical");

    // Only toast critical alerts
    critical.slice(0, 3).forEach((notif, i) => {
      setTimeout(() => fireToast(notif), i * 800);
    });

    // Browser notifications for critical only
    critical.slice(0, 3).forEach((notif) => {
      sendBrowserNotification(notif);
    });
  }, [notifications]);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const hasCritical = notifications.some((n) => n.severity === "critical");
      if (hasCritical) {
        Notification.requestPermission();
      }
    }
  }, [notifications]);

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const count = visible.length;
  const hasCritical = visible.some((n) => n.severity === "critical");
  const shown = visible.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className="relative h-8 w-8" />
        }
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold ${
              hasCritical
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-medium">
            Notifications{" "}
            {count > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({count})
              </span>
            )}
          </p>
          {count > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() =>
                setDismissed(new Set(visible.map((n) => n.id)))
              }
            >
              Dismiss all
            </Button>
          )}
        </div>

        <Separator />

        {count === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No notifications
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {shown.map((notif, i) => (
              <div key={notif.id}>
                {i > 0 && <Separator />}
                <div className="flex items-start gap-2 px-3 py-2.5 group hover:bg-muted/50 transition-colors">
                  <SeverityIcon severity={notif.severity} />
                  <div className="flex-1 min-w-0">
                    {notif.relatedPath ? (
                      <Link
                        href={notif.relatedPath}
                        onClick={() => setOpen(false)}
                        className="text-xs font-medium hover:underline"
                      >
                        {notif.title}
                      </Link>
                    ) : (
                      <span className="text-xs font-medium">
                        {notif.title}
                      </span>
                    )}
                    <p className="text-[11px] text-muted-foreground truncate">
                      {notif.message}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setDismissed((prev) => new Set(prev).add(notif.id))
                    }
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
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
              >
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
