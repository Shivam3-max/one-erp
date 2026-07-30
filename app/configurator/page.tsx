import { PageHeader } from "@/components/ui/PageHeader";
import { ConfiguratorClient } from "@/components/configurator/ConfiguratorClient";
import { getProjects } from "@/lib/data";

export default async function ConfiguratorPage() {
  const all = await getProjects();
  const projects = all.map((p) => ({ id: p.id, title: p.title }));
  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="Product Configurator"
        subtitle="Configure a product as data — it compiles to a BOM, a live cost and a datasheet in one pass."
      />
      <ConfiguratorClient projects={projects} />
    </>
  );
}
