"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { LogOut, Moon, Sun, Monitor, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Props {
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
}

export function UserMenu({ name, email, image }: Props) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        {image ? (
          <img
            src={image}
            alt={name || "User"}
            className="h-8 w-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Account</DialogTitle>
            <DialogDescription className="sr-only">
              Manage your account settings
            </DialogDescription>
          </DialogHeader>

          {/* Profile */}
          <div className="flex items-center gap-3">
            {image ? (
              <img
                src={image}
                alt={name || "User"}
                className="h-10 w-10 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>

          <Separator />

          {/* Theme */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Theme
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-3.5 w-3.5" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-3.5 w-3.5" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setTheme("system")}
              >
                <Monitor className="h-3.5 w-3.5" />
                Auto
              </Button>
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
            <span className="ml-auto text-xs text-muted-foreground">
              Preferences, export, rules
            </span>
          </Link>

          <Separator />

          {/* Sign out */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
