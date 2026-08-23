import { PageHeader } from "@/components/ui/PageHeader";
import { EstimationClient } from "@/components/estimation/EstimationClient";
import { getProjects, getActiveRateBook, getCommercialConfig } from "@/lib/data";

export default async function EstimationPage() {
  const [all, rateBook, commercial] = await Promise.all([getProjects(), getActiveRateBook(), getCommercialConfig()]);
  const projects = all.map((p) => ({ id: p.id, title: p.title }));
  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="Estimation"
        subtitle="Cost rolled up from the BOM against a dated rate card — with commercial build-up, and back-tested against what your delivered units actually cost."
      />
      <EstimationClient projects={projects} rateBook={rateBook} commercial={commercial} />
    </>
  );
}
