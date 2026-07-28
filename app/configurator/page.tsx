import { PageHeader } from "@/components/ui/PageHeader";
import { ConfiguratorClient } from "@/components/configurator/ConfiguratorClient";

export default function ConfiguratorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="Product Configurator"
        subtitle="Configure a product as data — it compiles to a BOM, a live cost and a datasheet in one pass."
      />
      <ConfiguratorClient />
    </>
  );
}
