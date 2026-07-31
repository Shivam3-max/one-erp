import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") || "";
  // auth pages render without the app chrome
  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/login/") || pathname.startsWith("/register/")) {
    return <>{children}</>;
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [tenant, customers] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: user.tenantId } }),
    prisma.customer.findMany({ where: { tenantId: user.tenantId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const brand = tenant?.brandColor || "#2050e0";

  return (
    <div className="min-h-screen" style={{ ["--color-brand" as string]: brand, ["--color-brand-2" as string]: brand } as React.CSSProperties}>
      <Sidebar logoText={tenant?.logoText ?? "CANDRON"} tenantName={tenant?.name ?? "CANDRON Electricals"} />
      <div className="lg:pl-[248px] print:pl-0">
        <Topbar
          customers={customers}
          user={{ name: user.name, initials: user.initials, role: user.role }}
          accessLevel={user.accessLevel}
        />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
