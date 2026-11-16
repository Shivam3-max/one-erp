import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsClient, type SettingsData } from "@/components/settings/SettingsClient";
import { getTenant, getUsers, getFamilies, getWorkflows, getStandards, getRateCards, getCommercialConfig, getQuoteTemplate } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default async function SettingsPage() {
  const [user, tenant, users, families, workflows, standards, rateCards, commercial, quoteTemplate] = await Promise.all([
    getCurrentUser(), getTenant(), getUsers(), getFamilies(), getWorkflows(), getStandards(), getRateCards(), getCommercialConfig(), getQuoteTemplate(),
  ]);
  const canManage = can(user, "settings.manage");
  const data: SettingsData = {
    tenant: { id: tenant.id, name: tenant.name, code: tenant.code, logoText: tenant.logoText, primaryCurrency: tenant.primaryCurrency, country: tenant.country, brandColor: (tenant as { brandColor?: string }).brandColor ?? "#2050e0" },
    users, families, workflows, standards, rateCards, commercial, quoteTemplate,
  };
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        subtitle="Tenant configuration — families, workflows, rate cards, standards and branding. This is what makes OneERP a product, not a one-off."
      />
      <SettingsClient data={data} canManage={canManage} />
    </>
  );
}
