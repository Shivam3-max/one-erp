import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Not authenticated", { status: 401 });

  const { artifactId } = await params;
  const stored = await prisma.documentFile.findFirst({
    where: { artifactId, tenantId: user.tenantId },
    select: { fileName: true, mimeType: true, size: true, content: true },
  });
  if (!stored) return new Response("Document not found", { status: 404 });

  const encodedName = encodeURIComponent(stored.fileName);
  return new Response(new Uint8Array(stored.content), {
    headers: {
      "Content-Type": stored.mimeType || "application/octet-stream",
      "Content-Length": String(stored.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
