import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectsTable, type ProjectRow } from "@/components/project/ProjectsTable";
import { getProjects, customerById, userById, stageIndex, LIFECYCLE } from "@/lib/mock";
import { STAGE_META } from "@/lib/lifecycle";

export default function ProjectsPage() {
  const rows: ProjectRow[] = getProjects().map((p) => {
    const cust = customerById(p.customerId);
    const owner = userById(p.ownerId);
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
        action={
          <button className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink">
            <Plus className="h-4 w-4" strokeWidth={2.5} /> New Project
          </button>
        }
      />
      <ProjectsTable rows={rows} />
    </>
  );
}
