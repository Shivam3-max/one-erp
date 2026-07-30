import { PageHeader } from "@/components/ui/PageHeader";
import { CustomersClient, type CustomerRow } from "@/components/crm/CustomersClient";
import { getCustomers, getProjects, getOpportunities } from "@/lib/data";
import { initialsOf } from "@/lib/format";

export default async function CustomersPage() {
  const [customers, projects, opps] = await Promise.all([getCustomers(), getProjects(), getOpportunities()]);
  const rows: CustomerRow[] = customers.map((c) => {
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
      openOpps: opps.filter((o) => o.customerId === c.id && o.stage !== "won" && o.stage !== "lost").length,
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
