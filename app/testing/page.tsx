import { PageHeader } from "@/components/ui/PageHeader";
import { TestingClient } from "@/components/testing/TestingClient";

export default function TestingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Quality"
        title="Testing & QA"
        subtitle="Routine, type and special tests — results, calibration, client witness and a certificate tied to every serial number."
      />
      <TestingClient />
    </>
  );
}
