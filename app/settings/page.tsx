import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsClient, type SettingsData } from "@/components/settings/SettingsClient";
import { getTenant, getUsers, getFamilies, getWorkflows, getStandards, getRateCards } from "@/lib/data";

export default async function SettingsPage() {
  const [tenant, users, families, workflows, standards, rateCards] = await Promise.all([
    getTenant(), getUsers(), getFamilies(), getWorkflows(), getStandards(), getRateCards(),
  ]);
  const data: SettingsData = {
    tenant: { id: tenant.id, name: tenant.name, code: tenant.code, logoText: tenant.logoText, primaryCurrency: tenant.primaryCurrency, country: tenant.country, brandColor: (tenant as { brandColor?: string }).brandColor ?? "#2050e0" },
    users, families, workflows, standards, rateCards,
  };
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        subtitle="Tenant configuration — families, workflows, rate cards, standards and branding. This is what makes OneERP a product, not a one-off."
      />
      <SettingsClient data={data} />
    </>
  );
}
