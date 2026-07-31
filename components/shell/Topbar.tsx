"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Command, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { NewProjectButton } from "@/components/project/NewProjectButton";
import { signOut } from "@/app/actions/auth";
import { can } from "@/lib/permissions";

export function Topbar({
  customers,
  user,
  accessLevel,
}: {
  customers: { id: string; name: string }[];
  user: { name: string; initials: string; role: string };
  accessLevel: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const canCreate = can({ accessLevel }, "project.create");

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/projects?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:px-6 print:hidden">
      <form onSubmit={search} className="flex-1 max-w-md">
        <div className="group flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-left text-[13px] text-ink-4 transition-colors focus-within:border-brand-line focus-within:bg-surface">
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects, artifacts, customers…"
            className="flex-1 bg-transparent text-ink outline-none placeholder:text-ink-4" />
          <kbd className="hidden items-center gap-0.5 rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-4 sm:flex">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </div>
      </form>

      <div className="flex-1" />

      {canCreate && (
        <div className="hidden sm:block">
          <NewProjectButton customers={customers} />
        </div>
      )}

      <button onClick={() => router.push("/")} title="Alerts & activity"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink">
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
      </button>

      <button onClick={() => router.push("/settings")} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-surface-3">
        <Avatar initials={user.initials} name={user.name} size={30} />
        <div className="hidden leading-tight md:block text-left">
          <div className="text-[12.5px] font-semibold text-ink">{user.name}</div>
          <div className="text-[10.5px] text-ink-4">{user.role}</div>
        </div>
      </button>

      <form action={signOut}>
        <button type="submit" title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger">
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </form>
    </header>
  );
}
