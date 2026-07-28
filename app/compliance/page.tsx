import { PageHeader } from "@/components/ui/PageHeader";
import { ComplianceClient } from "@/components/compliance/ComplianceClient";
import { projectsWithCompliance } from "@/lib/mock/compliance";

export default function CompliancePage() {
  const projects = projectsWithCompliance();
  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="Compliance Matrix"
        subtitle="Tender requirement → company specification → comply / deviate, with the engineer's note on every gap."
      />
      <ComplianceClient projects={projects} />
    </>
  );
}
