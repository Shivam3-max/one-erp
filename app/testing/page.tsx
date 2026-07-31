import { PageHeader } from "@/components/ui/PageHeader";
import { TestingClient } from "@/components/testing/TestingClient";
import { GenerateForProject } from "@/components/ui/GenerateForProject";
import { getTestUnits, getUserMap, getProjects, stageIndex } from "@/lib/data";
import { generateTestPlan } from "@/app/actions/execution";

export default async function TestingPage() {
  const [units, userMap, projects] = await Promise.all([getTestUnits(), getUserMap(), getProjects()]);
  const eligible = projects
    .filter((p) => stageIndex(p.currentStage) >= stageIndex("manufacturing"))
    .map((p) => ({ id: p.id, title: p.title }));

  return (
    <>
      <PageHeader
        eyebrow="Quality"
        title="Testing & QA"
        subtitle="Routine, type and special tests — results, calibration, client witness and a certificate tied to every serial number."
        action={
          <GenerateForProject
            label="New test plan"
            title="Generate test plan"
            desc="Create a routine + type test plan (pending) for a project unit."
            projects={eligible}
            action={generateTestPlan}
          />
        }
      />
      <TestingClient units={units} users={userMap} />
    </>
  );
}
