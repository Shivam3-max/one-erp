"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Sparkles, Send, FileSearch, SlidersHorizontal, ClipboardCheck, Calculator,
  FileText, ArrowRight, Check, TrendingUp, Building2, CircleDot,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { money, shortDate } from "@/lib/format";
import { Mono, Badge } from "@/components/ui/Badge";
import { stageIndex } from "@/lib/lifecycle";
import type { StageKey } from "@/lib/types";

type ProjLite = { id: string; title: string; productSummary: string; tags: string[]; currentStage: StageKey; value: { amount: number }; marginPct?: number; targetDelivery?: string };
import { healthTone } from "@/lib/status";

const inr = (n: number) => money({ amount: n, currency: "INR" });

type Kind = "text" | "pipeline" | "projects" | "recommend" | "quotes";
interface Msg { id: string; role: "user" | "assistant"; kind: Kind; text?: string }

const GREETING: Msg = {
  id: "g0", role: "assistant", kind: "text",
  text: "I'm the CANDRON assistant — trained on your products, templates and delivered projects. I can read tenders, recommend configurations, estimate from history, and draft quotations & compliance matrices. Try one of these:",
};

const SUGGESTIONS: { label: string; kind: Kind; icon: typeof FileSearch }[] = [
  { label: "Read the MSEDCL tender & draft a quotation", kind: "pipeline", icon: FileSearch },
  { label: "Show 33 kV-class projects nearing delivery", kind: "projects", icon: Building2 },
  { label: "Recommend a config for a 5 MVA 33/11 kV feeder", kind: "recommend", icon: SlidersHorizontal },
  { label: "Which live orders have margin risk?", kind: "quotes", icon: TrendingUp },
];

function route(text: string): Kind {
  const t = text.toLowerCase();
  if (t.includes("tender") || t.includes("draft") || t.includes("quot")) return "pipeline";
  if (t.includes("recommend") || t.includes("config")) return "recommend";
  if (t.includes("margin") || t.includes("risk")) return "quotes";
  if (t.includes("show") || t.includes("project") || t.includes("delivered") || t.includes("kv")) return "projects";
  return "text";
}

export function AIAssistantClient({ projects }: { projects: ProjLite[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, thinking]);

  const ask = (text: string, kind: Kind) => {
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: "user", kind: "text", text }]);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMsgs((m) => [...m, { id: `a${Date.now()}`, role: "assistant", kind, text: kind === "text" ? "I can help with tenders, configurations, estimates and quotations — pick a suggested action to see it work end-to-end." : undefined }]);
    }, 700);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-190px)] max-w-3xl flex-col rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-line px-5 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-white"><Sparkles className="h-4 w-4" /></span>
        <div>
          <div className="text-[13.5px] font-bold text-ink">OneERP Assistant</div>
          <div className="text-[11px] text-ink-4">Grounded in CANDRON's catalogue & project history</div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[10.5px] font-semibold text-ok"><CircleDot className="h-2.5 w-2.5" /> online</span>
      </div>

      {/* thread */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {msgs.map((m) => <Message key={m.id} msg={m} onAsk={ask} projects={projects} />)}
        {thinking && (
          <div className="flex items-center gap-2 text-[12.5px] text-ink-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-white"><Sparkles className="h-3.5 w-3.5" /></span>
            Analyzing<span className="tnum">…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* suggestions + input */}
      <div className="border-t border-line px-5 py-3">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => ask(s.label, s.kind)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-ink-2 transition-colors hover:border-brand-line hover:bg-brand-soft hover:text-brand-ink">
                <Icon className="h-3 w-3" />{s.label}
              </button>
            );
          })}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { ask(input.trim(), route(input)); setInput(""); } }}
          className="flex items-center gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a tender, a configuration, an estimate…"
            className="flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-4 focus:border-brand-line focus:bg-surface" />
          <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink"><Send className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
}

function Message({ msg, onAsk, projects }: { msg: Msg; onAsk: (t: string, k: Kind) => void; projects: ProjLite[] }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-[13px] text-white">{msg.text}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-white"><Sparkles className="h-3.5 w-3.5" /></span>
      <div className="min-w-0 flex-1">
        {msg.text && <p className="text-[13px] leading-relaxed text-ink-2">{msg.text}</p>}
        {msg.kind === "pipeline" && <PipelineResult />}
        {msg.kind === "projects" && <ProjectsResult projects={projects} />}
        {msg.kind === "recommend" && <RecommendResult onAsk={onAsk} />}
        {msg.kind === "quotes" && <QuotesResult projects={projects} />}
      </div>
    </div>
  );
}

/* ---- tender → quote pipeline ---- */
function PipelineResult() {
  const steps = [
    { icon: FileSearch, title: "Extracted requirements", detail: "63 technical requirements parsed from the 147-page tender (NIT-2026/Nagpur/033).", href: "/compliance" },
    { icon: SlidersHorizontal, title: "Mapped to configuration", detail: "Power Transformer · 5 MVA · 33/11 kV · ONAN · OLTC — 312 fields auto-filled.", href: "/configurator" },
    { icon: ClipboardCheck, title: "Built compliance matrix", detail: "13 comply · 3 deviate · 1 note — deviations drafted with engineer rationale.", href: "/compliance" },
    { icon: Calculator, title: "Estimated from history", detail: "₹2.11 Cr/unit from 3 similar delivered units — flagged +5.9% overrun risk.", href: "/estimation" },
    { icon: FileText, title: "Drafted quotation", detail: "CAN/Q/2026/0142 assembled — commercial, technical, compliance & terms.", href: "/quotations/PRJ-2026-0142" },
  ];
  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-2/50 p-3">
      <div className="mb-2 text-[12px] font-semibold text-ink">Tender → Quote · completed in 42s</div>
      <div className="space-y-1.5">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link key={i} href={s.href} className="group flex items-start gap-2.5 rounded-lg bg-surface px-2.5 py-2 transition-colors hover:bg-brand-soft/50">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><Icon className="h-3.5 w-3.5 text-brand" />{s.title}</div>
                <div className="text-[11.5px] text-ink-3">{s.detail}</div>
              </div>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
      <Link href="/quotations/PRJ-2026-0142" className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-brand-ink">
        Open the draft quotation <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <p className="mt-2 text-[10.5px] text-ink-4">Draft for engineer review — nothing is issued automatically.</p>
    </div>
  );
}

function ProjectsResult({ projects }: { projects: ProjLite[] }) {
  const rows = projects.filter((p) => p.tags.some((t) => t.includes("33")) && stageIndex(p.currentStage) >= stageIndex("testing"));
  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-2/50 p-2">
      <div className="px-1.5 pb-1.5 text-[11.5px] text-ink-3">Found <b className="text-ink">{rows.length}</b> 33 kV-class projects nearing or past delivery:</div>
      <div className="space-y-1">
        {rows.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2 hover:bg-brand-soft/50">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-ink">{p.title}</div>
              <div className="text-[11px] text-ink-3"><Mono>{p.id}</Mono> · {p.productSummary}</div>
            </div>
            <span className="tnum font-mono text-[12px] font-semibold text-ink">{inr(p.value.amount)}</span>
            <span className="text-[10.5px] text-ink-4">{shortDate(p.targetDelivery)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecommendResult({ onAsk }: { onAsk: (t: string, k: Kind) => void }) {
  const specs = [
    ["Family", "Power Transformer"], ["Rating", "5 MVA"], ["Voltage", "33 / 11 kV"], ["Cooling", "ONAN"],
    ["Vector group", "Dyn11"], ["Tap changer", "OLTC ± 10%"], ["Core", "CRGO M4"], ["Standard", "IS 2026"],
  ];
  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-2/50 p-3">
      <div className="mb-2 text-[12px] text-ink-2">Based on 3 similar delivered units, I recommend:</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {specs.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-line-2 py-1 text-[12px]"><span className="text-ink-4">{k}</span><span className="font-medium text-ink">{v}</span></div>
        ))}
      </div>
      <div className="mt-2 text-[11.5px] text-ink-3">Estimated <b className="text-ink">₹2.11 Cr/unit</b> · no-load loss 3.7 kW · Z 6.25%.</div>
      <button onClick={() => onAsk("Read the MSEDCL tender & draft a quotation", "pipeline")} className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-ink">
        Draft a quotation from this <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function QuotesResult({ projects }: { projects: ProjLite[] }) {
  const rows = projects.filter((p) => p.marginPct != null && p.marginPct < 16);
  return (
    <div className="mt-2 rounded-xl border border-line bg-surface-2/50 p-2">
      <div className="px-1.5 pb-1.5 text-[11.5px] text-ink-3"><b className="text-ink">{rows.length}</b> live orders below the 16% margin floor:</div>
      <div className="space-y-1">
        {rows.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2 hover:bg-brand-soft/50">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-ink">{p.title}</div>
              <div className="text-[11px] text-ink-3">{p.productSummary}</div>
            </div>
            <Badge tone={healthTone["at-risk"]}>{p.marginPct!.toFixed(1)}%</Badge>
          </Link>
        ))}
      </div>
      <div className="px-1.5 pt-1.5 text-[11px] text-warn">Also: QUO-0142 references a superseded drawing (GA R2 → R3) — review before re-issue.</div>
    </div>
  );
}
