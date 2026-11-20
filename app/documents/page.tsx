import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentsClient, type DocRow } from "@/components/documents/DocumentsClient";
import { getProjects, getArtifacts, getUserMap } from "@/lib/data";
import { docCategory, docFormat, docSize, formatFileSize, DOC_CATEGORIES, type DocCategory } from "@/lib/documents";
import { titleCase } from "@/lib/status";
import { AddDocumentButton } from "@/components/documents/AddDocumentButton";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

function uploadedCategory(value: unknown): DocCategory | undefined {
  return typeof value === "string" && DOC_CATEGORIES.includes(value as DocCategory) ? value as DocCategory : undefined;
}

export default async function DocumentsPage() {
  const [user, projects, userMap] = await Promise.all([getCurrentUser(), getProjects(), getUserMap()]);
  const rows: DocRow[] = [];
  for (const p of projects) {
    const arts = await getArtifacts(p.id);
    for (const a of arts) {
      const owner = userMap[a.ownerId];
      const isUpload = a.meta?.source === "upload";
      const format = isUpload && typeof a.meta?.format === "string" ? a.meta.format : docFormat(a.type);
      const category = isUpload ? uploadedCategory(a.meta?.category) ?? docCategory(a.type) : docCategory(a.type);
      const size = isUpload && typeof a.meta?.sizeBytes === "number" ? formatFileSize(a.meta.sizeBytes) : docSize(a.id, format);
      rows.push({
        id: a.id, title: a.title, category, format, size,
        projectId: p.id, projectTitle: p.title, status: titleCase(a.status), revision: a.currentRevision,
        ownerName: owner?.name ?? "—", ownerInitials: owner?.initials ?? "?", updatedAt: a.updatedAt,
        downloadUrl: isUpload ? `/api/documents/${encodeURIComponent(a.id)}` : undefined,
      });
    }
  }
  rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const categories = DOC_CATEGORIES
    .map((name) => ({ name: name as DocCategory, count: rows.filter((r) => r.category === name).length }))
    .filter((c) => c.count > 0);
  const projectList = projects.map((p) => ({ id: p.id, title: p.title }));

  return (
    <>
      <PageHeader eyebrow="Platform" title="Documents" subtitle="Every file belongs to a project — searchable, version-controlled, always in context."
        action={can(user, "documents.manage") ? <AddDocumentButton projects={projectList} /> : undefined} />
      <DocumentsClient rows={rows} categories={categories} projects={projectList} />
    </>
  );
}
