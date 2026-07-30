import { PageHeader } from "@/components/ui/PageHeader";
import { AIAssistantClient } from "@/components/assistant/AIAssistantClient";
import { getProjects } from "@/lib/data";

export default async function AssistantPage() {
  const all = await getProjects();
  const projects = all.map((p) => ({
    id: p.id, title: p.title, productSummary: p.productSummary, tags: p.tags,
    currentStage: p.currentStage, value: { amount: p.value.amount }, marginPct: p.marginPct, targetDelivery: p.targetDelivery,
  }));
  return (
    <>
      <PageHeader
        eyebrow="AI"
        title="AI Assistant"
        subtitle="Read a tender, recommend a configuration, estimate from history, and draft the quotation — grounded in your own data."
      />
      <AIAssistantClient projects={projects} />
    </>
  );
}
