"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AppNotification } from "@/lib/types";

function SeverityIcon({ severity }: { severity: AppNotification["severity"] }) {
  switch (severity) {
    case "critical":
      return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  }
}

function severityLabel(severity: AppNotification["severity"]) {
  switch (severity) {
    case "critical":
      return "Critical";
    case "warning":
      return "Warning";
    case "info":
      return "Info";
  }
}

interface Props {
  notifications: AppNotification[];
}

export function NotificationsPageView({ notifications }: Props) {
  const router = useRouter();

  const critical = notifications.filter((n) => n.severity === "critical");
  const warnings = notifications.filter((n) => n.severity === "warning");
  const info = notifications.filter((n) => n.severity === "info");

  const groups = [
    { label: "Critical", items: critical, color: "text-destructive" },
    { label: "Warnings", items: warnings, color: "text-amber-600" },
    { label: "Info", items: info, color: "text-blue-500" },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-4 lg:px-6 pt-8 sm:pt-2 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sticky top-0 z-30 bg-background pt-4 pb-2 -mt-4 -mx-4 px-4 sm:static sm:z-auto sm:bg-transparent sm:pt-0 sm:pb-0 sm:mt-0 sm:mx-0 sm:px-0">
        <PageHeader crumbs={[{ label: "Home", href: "/" }]} title="Notifications">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
        </PageHeader>
        {notifications.length > 0 && (
          <span className="text-sm text-muted-foreground ml-auto">
            {notifications.length} total
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications right now</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Alerts appear when budgets need attention
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <h2
                className={`text-xs font-medium uppercase tracking-wider ${group.color}`}
              >
                {group.label} ({group.items.length})
              </h2>
              <Card>
                <CardContent className="p-0">
                  {group.items.map((notif, i) => (
                    <div key={notif.id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-start gap-3 px-4 py-3">
                        <SeverityIcon severity={notif.severity} />
                        <div className="flex-1 min-w-0">
                          {notif.relatedPath ? (
                            <Link
                              href={notif.relatedPath}
                              className="text-sm font-medium hover:underline"
                            >
                              {notif.title}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium">{notif.title}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notif.message}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">
                          {severityLabel(notif.severity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
