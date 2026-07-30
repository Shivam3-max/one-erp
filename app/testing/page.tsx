import { PageHeader } from "@/components/ui/PageHeader";
import { TestingClient } from "@/components/testing/TestingClient";
import { getTestUnits, getUserMap } from "@/lib/data";

export default async function TestingPage() {
  const [units, userMap] = await Promise.all([getTestUnits(), getUserMap()]);
  return (
    <>
      <PageHeader
        eyebrow="Quality"
        title="Testing & QA"
        subtitle="Routine, type and special tests — results, calibration, client witness and a certificate tied to every serial number."
      />
      <TestingClient units={units} users={userMap} />
    </>
  );
}
