import { PageHeader } from "@/components/ui/PageHeader";
import { CustomersClient, type CustomerRow } from "@/components/crm/CustomersClient";
import { CUSTOMERS } from "@/lib/mock/org";
import { getProjects } from "@/lib/mock";
import { OPPORTUNITIES } from "@/lib/mock/pipeline";
import { initialsOf } from "@/lib/format";

export default function CustomersPage() {
  const projects = getProjects();
  const rows: CustomerRow[] = CUSTOMERS.map((c) => {
    const cp = projects.filter((p) => p.customerId === c.id);
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      city: c.city,
      state: c.state,
      rating: c.rating,
      projectCount: cp.length,
      orderValue: cp.reduce((s, p) => s + p.value.amount, 0),
      openOpps: OPPORTUNITIES.filter((o) => o.customerId === c.id && o.stage !== "won" && o.stage !== "lost").length,
      initials: initialsOf(c.name.replace(/(Ltd\.|Pvt\.|Co\.|Corp\.|GmbH)/g, "").trim()),
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        subtitle="Utilities, EPCs and industrials — every relationship, project and conversation in one place."
      />
      <CustomersClient rows={rows} />
    </>
  );
}
