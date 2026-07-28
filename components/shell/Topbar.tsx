"use client";

import { Search, Bell, Plus, Command } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { CURRENT_USER } from "@/lib/mock/org";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <button className="group flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-left text-[13px] text-ink-4 transition-colors hover:border-line-strong hover:bg-surface">
          <Search className="h-4 w-4" strokeWidth={2} />
          <span className="flex-1 truncate">Search projects, artifacts, customers…</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-4 sm:flex">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <button className="hidden items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink sm:flex">
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        New Project
      </button>

      <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink">
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
      </button>

      <div className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2">
        <Avatar initials={CURRENT_USER.initials} name={CURRENT_USER.name} size={30} />
        <div className="hidden leading-tight md:block">
          <div className="text-[12.5px] font-semibold text-ink">{CURRENT_USER.name}</div>
          <div className="text-[10.5px] text-ink-4">{CURRENT_USER.role}</div>
        </div>
      </div>
    </header>
  );
}
