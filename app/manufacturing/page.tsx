import { PageHeader } from "@/components/ui/PageHeader";
import { ManufacturingBoard } from "@/components/manufacturing/ManufacturingBoard";
import { getWorkOrders } from "@/lib/data";

export default async function ManufacturingPage() {
  const workOrders = await getWorkOrders();
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Manufacturing"
        subtitle="Every project becomes work orders — core, winding, tank, assembly, drying, testing, painting, packing."
      />
      <ManufacturingBoard workOrders={workOrders} />
    </>
  );
}
