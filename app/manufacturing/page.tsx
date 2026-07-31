import { PageHeader } from "@/components/ui/PageHeader";
import { ManufacturingBoard } from "@/components/manufacturing/ManufacturingBoard";
import { GenerateForProject } from "@/components/ui/GenerateForProject";
import { getWorkOrders, getProjects, stageIndex } from "@/lib/data";
import { generateWorkOrders } from "@/app/actions/execution";

export default async function ManufacturingPage() {
  const [workOrders, projects] = await Promise.all([getWorkOrders(), getProjects()]);
  const eligible = projects
    .filter((p) => stageIndex(p.currentStage) >= stageIndex("engineering-approval"))
    .map((p) => ({ id: p.id, title: p.title }));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Manufacturing"
        subtitle="Every project becomes work orders — core, winding, tank, assembly, drying, testing, painting, packing."
        action={
          <GenerateForProject
            label="Generate work orders"
            title="Generate work orders"
            desc="Explode a project into its standard work-order set (per unit)."
            projects={eligible}
            action={generateWorkOrders}
          />
        }
      />
      <ManufacturingBoard workOrders={workOrders} />
    </>
  );
}
