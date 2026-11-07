"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const fortune = item.module === "fortune";
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? fortune
                    ? "bg-gradient-to-r from-cosmic-700 to-night-800 text-gold-300 ring-1 ring-gold-400/40"
                    : "bg-accent/10 text-accent font-medium"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4 shrink-0", fortune && "text-gold-400")} aria-hidden />
              <span>{item.label}</span>
              {fortune && !active && (
                <span className="ml-auto rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-semibold text-gold-500">
                  ใหม่
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const inFortune = pathname.startsWith("/fortune");

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 px-3 text-lg font-semibold tracking-tight">
          HSK<span className="text-accent"> Learning</span>
        </Link>
        <nav aria-label="Main">
          <NavLinks />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 lg:hidden",
            inFortune ? "border-white/10 bg-night-900/90 text-white backdrop-blur" : "border-border bg-surface/90 backdrop-blur",
          )}
        >
          <Link href="/" className="font-semibold">
            HSK<span className={inFortune ? "text-gold-400" : "text-accent"}> Learning</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 hover:bg-foreground/10"
            aria-label="เปิดเมนู"
          >
            <Menu className="size-5" />
          </button>
        </header>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="เมนู">
            <button className="absolute inset-0 bg-black/50" aria-label="ปิดเมนู" onClick={() => setOpen(false)} />
            <nav className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-surface p-4 shadow-xl" aria-label="Main">
              <div className="mb-4 flex justify-end">
                <button className="rounded-lg p-2 hover:bg-foreground/10" onClick={() => setOpen(false)} aria-label="ปิดเมนู">
                  <X className="size-5" />
                </button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
