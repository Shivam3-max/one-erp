import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectsTable, type ProjectRow } from "@/components/project/ProjectsTable";
import { NewProjectButton } from "@/components/project/NewProjectButton";
import { getProjects, getCustomerMap, getUserMap } from "@/lib/data";
import { STAGE_META, LIFECYCLE, stageIndex } from "@/lib/lifecycle";

export default async function ProjectsPage() {
  const [projects, customerMap, userMap] = await Promise.all([getProjects(), getCustomerMap(), getUserMap()]);
  const rows: ProjectRow[] = projects.map((p) => {
    const cust = customerMap[p.customerId];
    const owner = userMap[p.ownerId];
    return {
      id: p.id,
      title: p.title,
      customer: cust.name,
      location: p.location,
      product: p.productSummary,
      tags: p.tags,
      stageLabel: STAGE_META[p.currentStage].label,
      stageIdx: stageIndex(p.currentStage),
      stageTotal: LIFECYCLE.length,
      value: p.value.amount,
      margin: p.marginPct,
      health: p.health,
      ownerName: owner.name,
      ownerInitials: owner.initials,
      target: p.targetDelivery,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        subtitle={`${rows.length} projects · every customer inquiry, one lifecycle`}
        action={<NewProjectButton customers={Object.values(customerMap).map((c) => ({ id: c.id, name: c.name }))} />}
      />
      <ProjectsTable rows={rows} />
    </>
  );
}
