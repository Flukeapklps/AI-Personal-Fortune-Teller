"use client";

import { History, LayoutGrid, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/fortune", label: "ภาพรวม", icon: LayoutGrid },
  { href: "/fortune/predict", label: "ดูดวง", icon: Sparkles },
  { href: "/fortune/history", label: "ประวัติ", icon: History },
  { href: "/fortune/profile", label: "ข้อมูลวันเกิด", icon: UserRound },
];

export function FortuneTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="ดูดวง" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
        {TABS.map((t) => {
          const active =
            t.href === "/fortune"
              ? pathname === "/fortune"
              : pathname.startsWith(t.href) || (t.href === "/fortune/predict" && pathname.startsWith("/fortune/result"));
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm transition",
                  active ? "bg-gradient-to-r from-cosmic-700 to-cosmic-500/70 text-gold-300 shadow" : "text-white/70 hover:text-white",
                )}
              >
                <t.icon className="size-4" aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
