import { FileQuestion } from "lucide-react";
import { NAV } from "@/components/shell/nav";
import { ComingSoon } from "@/components/ComingSoon";

const PHASE: Record<string, { phase: string; description: string }> = {
  "/pipeline": { phase: "Phase 2 · Sales", description: "Leads → opportunity → won, with pipeline analytics and forecasting — built on the same project spine you see in Overview." },
  "/customers": { phase: "Phase 2 · Sales", description: "Customer, consultant and dealer management with communication history, all linked back to their projects." },
  "/configurator": { phase: "Phase 3 · Engineering", description: "The rule-driven product configurator — define any electrical product as data and let it emit BOM, cost and datasheet in one pass." },
  "/estimation": { phase: "Phase 3 · Engineering", description: "Cost sheets rolled up from the BOM against dated rate cards, with margin, contribution and break-even — and estimates that learn from delivered projects." },
  "/quotations": { phase: "Phase 3 · Engineering", description: "The document-assembly quotation engine: commercial, technical, compliance and terms — composed from structured project data, fully revision-tracked." },
  "/compliance": { phase: "Phase 3 · Engineering", description: "Tender requirement → company spec → comply / deviate — the compliance matrix, generated and maintained against every tender." },
  "/procurement": { phase: "Phase 5 · Operations", description: "Material requirements exploded from the BOM, vendor RFQs, comparison and purchase orders — procurement driven by engineering, not spreadsheets." },
  "/manufacturing": { phase: "Phase 5 · Operations", description: "Every project becomes work orders — core, coil, tank, assembly, testing — each stage recording operator, machine, time, inspection and photos." },
  "/testing": { phase: "Phase 5 · Operations", description: "Routine, type and special tests with results, calibration certificates and client witness — auto-generating test certificates tied to serial numbers." },
  "/documents": { phase: "Phase 1 · Platform", description: "Every file, versioned and searchable, always attached to its project — tenders, drawings, certificates, photos and more." },
  "/assistant": { phase: "Phase 4 · AI", description: "Read a 400-page tender and extract every requirement, recommend a configuration, estimate from history, and draft quotations and compliance matrices." },
  "/settings": { phase: "Phase 2 · Platform", description: "Tenant configuration — product families, workflows, approval chains, rate cards, standards and branding. This is what makes OneERP a product, not a one-off." },
};

export default async function ModulePlaceholder({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const href = "/" + slug.join("/");
  const item = NAV.flatMap((s) => s.items).find((i) => i.href === href);
  const info = PHASE[href];

  return (
    <ComingSoon
      title={item?.label ?? "Module"}
      icon={item?.icon ?? FileQuestion}
      phase={info?.phase ?? "Upcoming phase"}
      description={
        info?.description ??
        "This module is part of the OneERP roadmap and will be built on the same project spine and multi-tenant foundation."
      }
    />
  );
}
