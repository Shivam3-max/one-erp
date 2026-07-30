import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { getCustomers } from "@/lib/data";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const customers = (await getCustomers()).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-[248px]">
        <Topbar customers={customers} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
