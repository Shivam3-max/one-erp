import { PageHeader } from "@/components/ui/PageHeader";
import { ComplianceClient } from "@/components/compliance/ComplianceClient";
import { getProjectsWithCompliance, getComplianceItems, getUserMap } from "@/lib/data";

export default async function CompliancePage() {
  const [projects, userMap] = await Promise.all([getProjectsWithCompliance(), getUserMap()]);
  const data: Record<string, Awaited<ReturnType<typeof getComplianceItems>>> = {};
  await Promise.all(projects.map(async (p) => { data[p.id] = await getComplianceItems(p.id); }));

  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="Compliance Matrix"
        subtitle="Tender requirement → company specification → comply / deviate, with the engineer's note on every gap."
      />
      <ComplianceClient projects={projects} data={data} users={userMap} />
    </>
  );
}
