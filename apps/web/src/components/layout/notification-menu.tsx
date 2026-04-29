"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import type { NotificationSummary } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationMenu({
  summary,
}: {
  summary: NotificationSummary;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative ml-auto rounded-full border-[#dfd2bf] bg-white/70"
        >
          <Bell className="size-4" />
          {summary.unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#d8ff74] text-[0.65rem] font-bold text-[#160f09]">
              {summary.unreadCount}
            </span>
          ) : null}
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-2xl border-[#dfd2bf] bg-[#fffaf2] p-2"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#75695b]">
          Notificaciones
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {summary.latest.length ? (
          summary.latest.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              asChild
              className="cursor-pointer rounded-xl p-0"
            >
              <Link href="/notifications" className="block w-full px-3 py-2">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {notification.title}
                  </span>
                  {notification.isUnread ? (
                    <span className="rounded-full bg-[#d8ff74] px-2 py-0.5 text-[0.65rem] font-bold text-[#160f09]">
                      Nuevo
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#75695b]">
                  {notification.body}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <div className="px-3 py-4 text-sm text-[#75695b]">
            No hay notificaciones pendientes.
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
          <Link href="/notifications">Ver centro de notificaciones</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
