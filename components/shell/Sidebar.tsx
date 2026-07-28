"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";
import { cn } from "@/lib/cn";
import { TENANT } from "@/lib/mock/org";
import { Zap } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-surface lg:flex">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-[var(--shadow-rail)]">
          <Zap className="h-[18px] w-[18px]" strokeWidth={2.5} fill="currentColor" />
        </div>
        <div className="leading-none">
          <div className="text-[15px] font-extrabold tracking-tight text-ink">
            {TENANT.logoText}
            <span className="ml-1 font-mono text-[10px] font-semibold text-brand align-top">OneERP</span>
          </div>
          <div className="mt-1 text-[10px] font-medium text-ink-4">Project Lifecycle Platform</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-4">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                        active
                          ? "bg-brand-soft text-brand-ink"
                          : "text-ink-2 hover:bg-surface-3 hover:text-ink"
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "text-ink-4 group-hover:text-ink-2")}
                        strokeWidth={2}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.soon && (
                        <span className="rounded bg-surface-3 px-1 py-px text-[8.5px] font-bold uppercase tracking-wide text-ink-4">
                          soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Tenant footer */}
      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-[11px] font-bold text-white">
            CE
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[11px] font-semibold text-ink">CANDRON Electricals</div>
            <div className="text-[10px] text-ink-4">Tenant #1 · India</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
