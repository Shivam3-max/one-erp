import { PageHeader } from "@/components/ui/PageHeader";
import { ProcurementClient } from "@/components/procurement/ProcurementClient";
import { getProjects, stageIndex } from "@/lib/mock";

export default function ProcurementPage() {
  const projects = getProjects()
    .filter((p) => stageIndex(p.currentStage) >= stageIndex("procurement"))
    .map((p) => ({ id: p.id, title: p.title }));
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Procurement"
        subtitle="Material requirements exploded straight from the BOM — vendor RFQ, PO and receipt, no spreadsheets."
      />
      <ProcurementClient projects={projects} />
    </>
  );
}
