import { PageHeader } from "@/components/ui/PageHeader";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";

export default function PipelinePage() {
  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Pipeline"
        subtitle="Every opportunity from lead to won — a won deal becomes a project on the same spine."
      />
      <PipelineBoard />
    </>
  );
}
