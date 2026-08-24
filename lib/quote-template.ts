/**
 * Quotation template — the boilerplate that makes every tenant's offer look
 * like theirs: scope-of-supply, exclusions, standard T&Cs, and cover/footer
 * notes. Editable in Settings → Quotation; consumed when a quote is generated.
 * (Payment / validity / warranty terms come from the Commercial config so
 * they're not duplicated here.)
 */

export interface QuoteTerm {
  label: string;
  value: string;
}

export interface QuoteTemplate {
  scope: string[];
  exclusions: string[];
  terms: QuoteTerm[];     // extra standard terms, appended after the commercial ones
  coverNote: string;      // cover-letter body (supports {{product}} / {{customer}} tokens)
  footerNote: string;     // note printed under the totals
}

export const DEFAULT_QUOTE_TEMPLATE: QuoteTemplate = {
  scope: [
    "Design, manufacture & routine testing",
    "Supply ex-works / FOR site",
    "Installation supervision",
    "Commissioning assistance",
    "Test certificates & O&M documentation",
    "Warranty support",
  ],
  exclusions: [
    "Civil foundations & grouting",
    "HV/LV cabling & terminations",
    "Unloading & storage at site",
    "Statutory & utility approvals",
    "Any taxes/duties beyond those stated",
  ],
  terms: [
    { label: "Delivery", value: "20 weeks from approved drawings & advance" },
    { label: "Price basis", value: "Firm, ex-works; taxes extra at actuals" },
  ],
  coverNote:
    "Dear Sir/Madam, thank you for the opportunity to quote for {{product}}. We are pleased to submit our technical and commercial offer, designed and manufactured to the applicable IS / IEC standards. We remain at your disposal for any clarification.",
  footerNote: "Optional items are not included in the grand total.",
};

/** Fill {{product}} / {{customer}} tokens in a template string. */
export function fillTokens(text: string, vars: { product?: string; customer?: string }): string {
  return text
    .replace(/\{\{\s*product\s*\}\}/gi, vars.product ?? "")
    .replace(/\{\{\s*customer\s*\}\}/gi, vars.customer ?? "");
}
