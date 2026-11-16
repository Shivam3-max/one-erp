import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { FamilyStudio } from "@/components/settings/FamilyStudio";
import { getFamily, getActiveRateBook } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default async function FamilyStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [family, rateBook, user] = await Promise.all([getFamily(id), getActiveRateBook(), getCurrentUser()]);
  if (!family) notFound();
  const canManage = can(user, "settings.manage");
  return (
    <>
      <PageHeader
        eyebrow="Platform · Family Studio"
        title={family.name}
        subtitle="Author this product family as data — attributes and BOM rules compile to a live cost against the active rate card."
      />
      <FamilyStudio family={family} rateBook={rateBook} canManage={canManage} />
    </>
  );
}
