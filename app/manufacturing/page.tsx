import { PageHeader } from "@/components/ui/PageHeader";
import { ManufacturingBoard } from "@/components/manufacturing/ManufacturingBoard";

export default function ManufacturingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Manufacturing"
        subtitle="Every project becomes work orders — core, winding, tank, assembly, drying, testing, painting, packing."
      />
      <ManufacturingBoard />
    </>
  );
}
