import { PageHeader } from "@/components/ui/PageHeader";
import { EstimationClient } from "@/components/estimation/EstimationClient";

export default function EstimationPage() {
  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="Estimation"
        subtitle="Cost rolled up from the BOM against a dated rate card — and back-tested against what your delivered units actually cost."
      />
      <EstimationClient />
    </>
  );
}
