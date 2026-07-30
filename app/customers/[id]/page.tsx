import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Mail, Phone, Building2, Calendar, MessageSquare, PhoneCall, Users2, Send } from "lucide-react";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader } from "@/components/ui/Card";
import { getCustomer, getUserMap, getProjects, getOpportunities, getContactsFor, getCommsFor } from "@/lib/data";
import { STAGE_LABEL } from "@/lib/mock/pipeline";
import { LogCommButton } from "@/components/crm/LogCommButton";
import { money, shortDate, relDate } from "@/lib/format";
import { healthTone, healthLabel, titleCase } from "@/lib/status";

const inr = (n: number) => money({ amount: n, currency: "INR" });

const COMM_ICON = { email: Mail, call: PhoneCall, meeting: Users2, "site-visit": MapPin } as const;

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer || customer.id !== id) notFound();

  const [allProjects, allOpps, contacts, comms, userMap] = await Promise.all([
    getProjects(), getOpportunities(), getContactsFor(id), getCommsFor(id), getUserMap(),
  ]);
  const projects = allProjects.filter((p) => p.customerId === id);
  const opps = allOpps.filter((o) => o.customerId === id);
  const openOpps = opps.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const orderValue = projects.reduce((s, p) => s + p.value.amount, 0);

  return (
    <>
      <Link href="/customers" className="mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-brand">
        <ArrowLeft className="h-3.5 w-3.5" /> Customers
      </Link>

      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-[18px] font-bold text-white">{customer.name.replace(/(Ltd\.|Pvt\.|Co\.|Corp\.|GmbH)/g, "").trim().split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <div>
              <h1 className="text-[20px] font-extrabold tracking-tight text-ink">{customer.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-3">
                <span className="capitalize">{titleCase(customer.type)}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{customer.city}, {customer.state}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />since {shortDate(customer.since)}</span>
                {customer.gstin && <Mono className="text-ink-3">{customer.gstin}</Mono>}
              </div>
            </div>
          </div>
          <Badge tone={customer.rating === "A" ? healthTone["on-track"] : healthTone["at-risk"]} dot>Rating {customer.rating}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line-2 pt-4">
          <KPI value={String(projects.length)} label="Projects" />
          <KPI value={inr(orderValue)} label="Order value" />
          <KPI value={String(openOpps.length)} label="Open opportunities" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Projects */}
          <Card>
            <CardHeader title="Projects" subtitle={`${projects.length} on the spine`} />
            <div className="divide-y divide-line-2">
              {projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-2">
                  <span className={`h-8 w-1 rounded-full ${healthTone[p.health].dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{p.title}</div>
                    <div className="text-[11.5px] text-ink-3"><Mono>{p.id}</Mono> · {p.productSummary}</div>
                  </div>
                  <Badge tone={healthTone[p.health]}>{healthLabel[p.health]}</Badge>
                  <span className="tnum font-mono text-[13px] font-semibold text-ink">{inr(p.value.amount)}</span>
                </Link>
              ))}
              {projects.length === 0 && <div className="px-5 py-6 text-[12.5px] text-ink-4">No projects yet.</div>}
            </div>
          </Card>

          {/* Communication timeline */}
          <Card>
            <CardHeader title="Communication history" subtitle="Emails · calls · meetings · site visits"
              action={<LogCommButton customerId={id} />} />
            <div className="space-y-0 px-5 pb-5">
              {comms.map((c, i) => {
                const Icon = COMM_ICON[c.type];
                const actor = userMap[c.userId];
                return (
                  <div key={c.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-ink-3"><Icon className="h-4 w-4" /></span>
                      {i < comms.length - 1 && <span className="w-px flex-1 bg-line" style={{ minHeight: 14 }} />}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">{c.subject}</span>
                        <span className="rounded bg-surface-3 px-1.5 py-px text-[10px] font-semibold capitalize text-ink-4">{c.type.replace("-", " ")}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-ink-2">{c.summary}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-4"><Avatar initials={actor.initials} name={actor.name} size={16} />{actor.name.split(" ")[0]} · {relDate(c.date)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: contacts + opps */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Contacts" />
            <div className="divide-y divide-line-2">
              {contacts.map((ct) => (
                <div key={ct.email} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ink">{ct.name}</span>
                    {ct.primary && <span className="rounded bg-brand-soft px-1.5 py-px text-[9.5px] font-bold uppercase text-brand">Primary</span>}
                  </div>
                  <div className="text-[11.5px] text-ink-3">{ct.role}</div>
                  <div className="mt-1 space-y-0.5 text-[11.5px] text-ink-2">
                    <div className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3 text-ink-4" />{ct.email}</div>
                    <div className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3 text-ink-4" />{ct.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Open opportunities" />
            <div className="divide-y divide-line-2">
              {openOpps.map((o) => (
                <Link key={o.id} href="/pipeline" className="block px-5 py-3 hover:bg-surface-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-ink">{o.title}</span>
                    <span className="tnum font-mono text-[12px] font-semibold text-ink">{inr(o.value)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-3">
                    <Badge tone={healthTone["on-track"]}>{STAGE_LABEL[o.stage]}</Badge>
                    <span>close {shortDate(o.expectedClose)}</span>
                  </div>
                </Link>
              ))}
              {openOpps.length === 0 && <div className="px-5 py-6 text-[12.5px] text-ink-4">No open opportunities.</div>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function KPI({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="tnum font-mono text-[18px] font-semibold text-ink">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-4">{label}</div>
    </div>
  );
}
