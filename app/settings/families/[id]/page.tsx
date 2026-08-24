import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { FamilyStudio } from "@/components/settings/FamilyStudio";
import { getFamily, getActiveRateBook } from "@/lib/data";

export default async function FamilyStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [family, rateBook] = await Promise.all([getFamily(id), getActiveRateBook()]);
  if (!family) notFound();
  return (
    <>
      <PageHeader
        eyebrow="Platform · Family Studio"
        title={family.name}
        subtitle="Author this product family as data — attributes and BOM rules compile to a live cost against the active rate card."
      />
      <FamilyStudio family={family} rateBook={rateBook} />
    </>
  );
}
