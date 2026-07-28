import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        subtitle="Tenant configuration — families, workflows, rate cards, standards and branding. This is what makes OneERP a product, not a one-off."
      />
      <SettingsClient />
    </>
  );
}
