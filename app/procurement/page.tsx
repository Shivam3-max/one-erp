import { PageHeader } from "@/components/ui/PageHeader";
import { ProcurementClient } from "@/components/procurement/ProcurementClient";
import { getProjectsForProcurement, getRequirements, getVendors } from "@/lib/data";

export default async function ProcurementPage() {
  const [projects, vendors] = await Promise.all([getProjectsForProcurement(), getVendors()]);
  const reqsByProject: Record<string, Awaited<ReturnType<typeof getRequirements>>> = {};
  await Promise.all(projects.map(async (p) => { reqsByProject[p.id] = await getRequirements(p.id); }));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Procurement"
        subtitle="Material requirements exploded straight from the BOM — vendor RFQ, PO and receipt, no spreadsheets."
      />
      <ProcurementClient projects={projects} reqsByProject={reqsByProject} vendors={vendors} />
    </>
  );
}
