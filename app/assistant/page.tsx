import { PageHeader } from "@/components/ui/PageHeader";
import { AIAssistantClient } from "@/components/assistant/AIAssistantClient";

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        eyebrow="AI"
        title="AI Assistant"
        subtitle="Read a tender, recommend a configuration, estimate from history, and draft the quotation — grounded in your own data."
      />
      <AIAssistantClient />
    </>
  );
}
