import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_BYTES,
  documentFileExtension,
  formatFileSize,
  isAllowedDocumentName,
} from "@/lib/documents";

describe("document uploads", () => {
  it("accepts the supported file extensions case-insensitively", () => {
    expect(isAllowedDocumentName("approved-drawing.PDF")).toBe(true);
    expect(isAllowedDocumentName("panel-photo.JPEG")).toBe(true);
    expect(isAllowedDocumentName("archive.exe")).toBe(false);
    expect(isAllowedDocumentName("no-extension")).toBe(false);
    expect(documentFileExtension("panel-photo.JPEG")).toBe("jpg");
  });

  it("keeps the configured upload limit and formats stored sizes", () => {
    expect(MAX_DOCUMENT_BYTES).toBe(8 * 1024 * 1024);
    expect(formatFileSize(900)).toBe("900 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});
