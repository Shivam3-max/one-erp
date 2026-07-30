import { PageHeader } from "@/components/ui/PageHeader";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { getOpportunities, getCustomerMap, getUserMap } from "@/lib/data";

export default async function PipelinePage() {
  const [opportunities, customerMap, userMap] = await Promise.all([getOpportunities(), getCustomerMap(), getUserMap()]);
  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Pipeline"
        subtitle="Every opportunity from lead to won — a won deal becomes a project on the same spine."
      />
      <PipelineBoard opportunities={opportunities} customerMap={customerMap} userMap={userMap} />
    </>
  );
}
