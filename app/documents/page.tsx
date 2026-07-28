import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentsClient, type DocRow } from "@/components/documents/DocumentsClient";
import { getProjects, getArtifacts, userById } from "@/lib/mock";
import { docCategory, docFormat, docSize, DOC_CATEGORIES, type DocCategory } from "@/lib/documents";
import { titleCase } from "@/lib/status";

export default function DocumentsPage() {
  const rows: DocRow[] = [];
  for (const p of getProjects()) {
    for (const a of getArtifacts(p.id)) {
      const owner = userById(a.ownerId);
      const format = docFormat(a.type);
      rows.push({
        id: a.id,
        title: a.title,
        category: docCategory(a.type),
        format,
        size: docSize(a.id, format),
        projectId: p.id,
        projectTitle: p.title,
        status: titleCase(a.status),
        revision: a.currentRevision,
        ownerName: owner.name,
        ownerInitials: owner.initials,
        updatedAt: a.updatedAt,
      });
    }
  }
  rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const categories = DOC_CATEGORIES
    .map((name) => ({ name: name as DocCategory, count: rows.filter((r) => r.category === name).length }))
    .filter((c) => c.count > 0);

  const projects = getProjects().map((p) => ({ id: p.id, title: p.title }));

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Documents"
        subtitle="Every file belongs to a project — searchable, version-controlled, always in context."
      />
      <DocumentsClient rows={rows} categories={categories} projects={projects} />
    </>
  );
}
