"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, X } from "lucide-react";
import { addDocument } from "@/app/actions/documents";
import { DOC_CATEGORIES, MAX_DOCUMENT_BYTES } from "@/lib/documents";
import { useModalA11y } from "@/components/ui/useModalA11y";

export function AddDocumentButton({ projects }: { projects: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [category, setCategory] = useState<string>(DOC_CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const close = () => !pending && setOpen(false);
  const dialogRef = useModalA11y(open, close);

  const chooseFile = (selected: File | null) => {
    setFile(selected);
    setError("");
    if (selected && !title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, ""));
  };

  const submit = () => {
    if (!file || !title.trim() || !projectId) return;
    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("projectId", projectId);
      formData.set("category", category);
      formData.set("file", file);
      const result = await addDocument(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setTitle("");
      setFile(null);
      router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink">
        <FileUp className="h-4 w-4" /> Add document
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 backdrop-blur-sm" onClick={close}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-document-title" onClick={(event) => event.stopPropagation()}
            className="my-16 w-full max-w-lg rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <h2 id="add-document-title" className="text-[15px] font-bold text-ink">Add document</h2>
                <p className="text-[12px] text-ink-3">Upload a file and attach it to its project.</p>
              </div>
              <button onClick={close} disabled={pending} aria-label="Close dialog" className="text-ink-4 hover:text-ink disabled:opacity-40"><X className="h-5 w-5" /></button>
            </div>

            {projects.length === 0 ? (
              <div className="p-6 text-center">
                <FileUp className="mx-auto h-8 w-8 text-ink-4" />
                <div className="mt-3 text-[14px] font-semibold text-ink">Create a project first</div>
                <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-ink-3">Every document must belong to a project. Add a customer, create its project, then return here to upload the file.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Link href="/customers" className="rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink-2 hover:bg-surface-3">Customers</Link>
                  <Link href="/projects" className="rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-brand-ink">Projects</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <label className="block text-[11.5px] font-semibold text-ink-2">Project <span className="text-danger">*</span>
                  <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={inputCls}>
                    {projects.map((project) => <option key={project.id} value={project.id}>{project.id} · {project.title}</option>)}
                  </select>
                </label>
                <label className="block text-[11.5px] font-semibold text-ink-2">Document title <span className="text-danger">*</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder="e.g. Approved customer drawing" className={inputCls} />
                </label>
                <label className="block text-[11.5px] font-semibold text-ink-2">Category <span className="text-danger">*</span>
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputCls}>
                    {DOC_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="block text-[11.5px] font-semibold text-ink-2">File <span className="text-danger">*</span>
                  <input type="file" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.dwg,.zip,.eml"
                    className="mt-1 block w-full rounded-lg border border-dashed border-line bg-surface-2 px-3 py-4 text-[12.5px] text-ink-3 file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-brand" />
                  <span className="mt-1 block text-[10.5px] font-normal text-ink-4">PDF, Office, CSV, text, image, DWG, ZIP or EML · maximum {MAX_DOCUMENT_BYTES / (1024 * 1024)} MB</span>
                </label>
              </div>
            )}

            {error && <div role="alert" className="mx-5 mb-3 rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">{error}</div>}
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={close} disabled={pending} className="rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-3 disabled:opacity-40">Cancel</button>
              {projects.length > 0 && (
                <button onClick={submit} disabled={pending || !file || !title.trim() || !projectId}
                  className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40">
                  {pending ? "Uploading…" : "Upload document"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand-soft";
