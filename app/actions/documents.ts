"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import {
  DOC_CATEGORIES,
  MAX_DOCUMENT_BYTES,
  documentFileExtension,
  isAllowedDocumentName,
  type DocCategory,
} from "@/lib/documents";
import { logActivity } from "@/lib/activity";

function cleanFileName(value: string): string {
  return value.replace(/[\r\n\\/\0]/g, "_").trim().slice(0, 180) || "document";
}

export async function addDocument(formData: FormData) {
  const user = await requireUser();
  if (!can(user, "documents.manage")) return { ok: false as const, error: "You don't have permission to add documents." };

  const title = String(formData.get("title") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const rawCategory = String(formData.get("category") ?? "").trim();
  const upload = formData.get("file");

  if (!title || title.length > 180) return { ok: false as const, error: "Enter a document title of 180 characters or fewer." };
  if (!projectId) return { ok: false as const, error: "Select a project." };
  if (!DOC_CATEGORIES.includes(rawCategory as DocCategory)) return { ok: false as const, error: "Select a valid document category." };
  if (!(upload instanceof File) || upload.size === 0) return { ok: false as const, error: "Choose a file to upload." };
  if (upload.size > MAX_DOCUMENT_BYTES) return { ok: false as const, error: "The file must be 8 MB or smaller." };

  const extension = documentFileExtension(upload.name);
  if (!isAllowedDocumentName(upload.name)) {
    return { ok: false as const, error: "Unsupported file type. Upload PDF, Office, CSV, text, image, DWG, ZIP, or EML files." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: user.tenantId },
    select: { id: true, currentStage: true },
  });
  if (!project) return { ok: false as const, error: "Project not found or not available in this workspace." };

  const id = `DOC-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const fileName = cleanFileName(upload.name);
  const content = new Uint8Array(await upload.arrayBuffer());
  const format = extension.toUpperCase();

  await prisma.artifact.create({
    data: {
      id,
      tenantId: user.tenantId,
      projectId: project.id,
      type: "uploaded-document",
      title,
      status: "issued",
      stage: project.currentStage,
      currentRevision: 1,
      ownerId: user.id,
      updatedAt: now,
      upstreamStale: false,
      meta: {
        source: "upload",
        category: rawCategory,
        format,
        sizeBytes: upload.size,
        fileName,
      },
      revisions: {
        create: {
          rev: 1,
          createdAt: now,
          authorId: user.id,
          changeSummary: `Uploaded ${fileName}`,
        },
      },
      file: {
        create: {
          tenantId: user.tenantId,
          fileName,
          mimeType: upload.type || "application/octet-stream",
          size: upload.size,
          content,
          createdAt: now,
        },
      },
    },
  });

  await logActivity({
    tenantId: user.tenantId,
    actorId: user.id,
    verb: "uploaded document",
    target: `${id} — ${title}`,
    projectId: project.id,
  });
  revalidatePath("/documents");
  revalidatePath(`/projects/${project.id}`);
  return { ok: true as const, id };
}
