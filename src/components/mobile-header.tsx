"use client";

import Image from "next/image";
import Link from "next/link";
import { NotificationsBell } from "@/components/notifications-card";
import { UserMenu } from "@/components/user-menu";
import type { AppNotification } from "@/lib/types";

interface Props {
  notifications: AppNotification[];
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function MobileHeader({ notifications, user }: Props) {
  return (
    <div className="flex items-center justify-between px-4 pt-8 sm:hidden">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/logo.svg" alt="" width={32} height={32} className="dark:hidden" aria-hidden />
        <Image src="/logowhite.svg" alt="" width={32} height={32} className="hidden dark:block" aria-hidden />
        <span className="text-2xl font-bold tracking-tight">Alloti</span>
      </Link>
      {user && (
        <div className="flex items-center gap-2">
          <NotificationsBell notifications={notifications} />
          <UserMenu
            name={user.name}
            email={user.email}
            image={user.image}
          />
        </div>
      )}
    </div>
  );
}
