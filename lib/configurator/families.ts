import type { AttrDef, GroupDef, FamilyDef, Values, Issue, BomLine, DatasheetGroup } from "./model";
import { num } from "./model";

/* ---------- small builders ---------- */
const opt = (value: string, label?: string) => ({ value, label: label ?? value });

const kV = (v: Values, id: string) => parseFloat(String(v[id]));

/* ---------- shared engine functions (both families are oil-filled transformers) ---------- */

function isForced(cooling: string): boolean {
  return cooling !== "ONAN";
}

function derive(v: Values): Record<string, number> {
  const mva = num(v, "powerRating");
  const alu = v.windingMaterial === "aluminium";
  const amorphous = v.coreMaterial === "amorphous";
  const forced = isForced(String(v.cooling));

  const windingKg = Math.round(mva * (alu ? 300 : 470));
  const coreKg = Math.round(mva * (amorphous ? 560 : 520));
  const steelKg = Math.round(mva * 380 + 450);
  const oilL = Math.round(mva * 720 + 800);
  const noLoadLoss = +(1.1 * Math.pow(mva, 0.75)).toFixed(1);
  const loadLoss = +(9 * Math.pow(Math.max(mva, 0.05), 0.82)).toFixed(1);
  const radiatorPanels = Math.max(4, Math.ceil(mva * 3) + 4);
  const fans = forced ? Math.max(2, Math.ceil(mva / 5) * 2) : 0;
  const paintKg = Math.round((mva * 6 + 20) * (num(v, "paintDft") / 120));
  const totalWeightKg = windingKg + coreKg + steelKg + oilL * 0.89 + 600;

  return {
    mva,
    windingKg,
    coreKg,
    steelKg,
    oilL,
    noLoadLoss,
    loadLoss,
    radiatorPanels,
    fans,
    paintKg,
    totalWeightT: +(totalWeightKg / 1000).toFixed(1),
    forced: forced ? 1 : 0,
  };
}

function validate(v: Values, d: Record<string, number>): Issue[] {
  const issues: Issue[] = [];
  if (kV(v, "secondaryVoltage") >= kV(v, "primaryVoltage"))
    issues.push({ level: "error", message: "Secondary voltage must be below primary voltage." });
  const z = num(v, "impedance");
  if (z < 4 || z > 12.5)
    issues.push({ level: "warn", message: `Impedance ${z}% is outside the typical 4–12.5% band.` });
  if (v.coreMaterial === "amorphous" && d.mva > 20)
    issues.push({ level: "warn", message: "Amorphous cores are uncommon above 20 MVA — confirm with vendor." });
  if (v.oilType === "ester")
    issues.push({ level: "note", message: "Ester fluid selected — K-class fire safety; cost premium applied." });
  if (v.windingMaterial === "aluminium")
    issues.push({ level: "note", message: "Aluminium winding — lower cost, larger footprint & weight." });
  return issues;
}

function line(key: string, category: string, description: string, qty: number, unit: string, rateKey: string): BomLine {
  return { key, category, description, qty, unit, rateKey };
}

function emitBom(v: Values, d: Record<string, number>): BomLine[] {
  const alu = v.windingMaterial === "aluminium";
  const amorphous = v.coreMaterial === "amorphous";
  const bom: BomLine[] = [
    line("winding", "Windings", `${alu ? "Aluminium" : "Copper"} winding (HV + LV)`, d.windingKg, "kg", alu ? "aluminium" : "copper"),
    line("core", "Core", `${amorphous ? "Amorphous" : "CRGO"} core, ${v.coreType}`, d.coreKg, "kg", amorphous ? "amorphous" : "crgo"),
    line("tank", "Tank", `Tank & fittings (${v.tankType})`, d.steelKg, "kg", "steel"),
    line("oil", "Oil", v.oilType === "ester" ? "Ester insulating fluid" : "Mineral oil (IS 335)", d.oilL, "L", v.oilType === "ester" ? "oil_ester" : "oil_mineral"),
    line("bush-hv", "Bushings", `HV bushings (${v.hvBushing})`, 3, "no.", v.hvBushing === "polymer" ? "bushing_polymer" : "bushing_porcelain"),
    line("bush-lv", "Bushings", `LV bushings (${v.lvBushing})`, 4, "no.", v.lvBushing === "polymer" ? "bushing_polymer" : "bushing_porcelain"),
    line("tap", "Tap Changer", v.tapChanger === "oltc" ? "On-load tap changer" : "Off-circuit tap changer", 1, "unit", v.tapChanger === "oltc" ? "oltc" : "octc"),
    line("radiator", "Cooling", "Radiator panels", d.radiatorPanels, "panel", "radiator"),
  ];
  if (d.fans > 0) bom.push(line("fans", "Cooling", "Cooling fans (forced)", d.fans, "no.", "fan"));
  if (v.conservator) bom.push(line("cons", "Accessories", "Conservator + silica breather", 1, "unit", "conservator"));
  if (v.buchholz) bom.push(line("buch", "Protection", "Buchholz relay", 1, "unit", "buchholz"));
  if (v.otiWti) bom.push(line("temp", "Protection", "Oil & winding temp indicators", 1, "set", "otiwti"));
  if (v.prv) bom.push(line("prv", "Protection", "Pressure relief valve", 1, "unit", "prv"));
  if (v.mog) bom.push(line("mog", "Protection", "Magnetic oil gauge", 1, "unit", "mog"));
  if (v.rtcc) bom.push(line("rtcc", "Monitoring", "RTCC + remote monitoring", 1, "unit", "rtcc"));
  bom.push(line("paint", "Finish", `Paint, ${v.paintDft}µm DFT`, d.paintKg, "kg", "paint"));
  bom.push(line("hw", "Accessories", "Hardware, gaskets & accessories", d.mva, "MVA-set", "hardware"));
  return bom;
}

function datasheet(v: Values, d: Record<string, number>): DatasheetGroup[] {
  const label = (id: string) => {
    for (const g of ALL_ATTRS) if (g.id === id) return g.options?.find((o) => o.value === v[id])?.label ?? String(v[id]);
    return String(v[id]);
  };
  return [
    {
      group: "Ratings",
      rows: [
        { label: "Rated power", value: `${d.mva} MVA` },
        { label: "Voltage ratio", value: `${v.primaryVoltage} / ${v.secondaryVoltage} kV` },
        { label: "Vector group", value: String(v.vectorGroup) },
        { label: "Frequency", value: `${v.frequency} Hz` },
        { label: "Impedance", value: `${v.impedance} %` },
      ],
    },
    {
      group: "Design",
      rows: [
        { label: "Cooling", value: String(v.cooling) },
        { label: "Winding", value: label("windingMaterial") },
        { label: "Core", value: label("coreMaterial") },
        { label: "Tap changer", value: label("tapChanger") },
        { label: "Insulating fluid", value: label("oilType") },
      ],
    },
    {
      group: "Performance & physical",
      rows: [
        { label: "No-load loss", value: `${d.noLoadLoss} kW` },
        { label: "Load loss (75°C)", value: `${d.loadLoss} kW` },
        { label: "Oil quantity", value: `${d.oilL.toLocaleString("en-IN")} L` },
        { label: "Total weight", value: `≈ ${d.totalWeightT} T` },
      ],
    },
  ];
}

/* ---------- attribute groups (data) ---------- */

function ratings(ratingOpts: { value: string; label: string }[], primOpts: string[], secOpts: string[]): GroupDef {
  return {
    id: "ratings",
    label: "Ratings",
    attributes: [
      { id: "powerRating", label: "Rated power", type: "enum", unit: "MVA", options: ratingOpts, default: ratingOpts[Math.min(2, ratingOpts.length - 1)].value, drivesBom: true },
      { id: "primaryVoltage", label: "Primary voltage", type: "enum", unit: "kV", options: primOpts.map((o) => opt(o)), default: primOpts[Math.floor(primOpts.length / 2)] },
      { id: "secondaryVoltage", label: "Secondary voltage", type: "enum", unit: "kV", options: secOpts.map((o) => opt(o)), default: secOpts[Math.floor(secOpts.length / 2)] },
      { id: "frequency", label: "Frequency", type: "enum", unit: "Hz", options: [opt("50"), opt("60")], default: "50" },
      { id: "vectorGroup", label: "Vector group", type: "enum", options: ["Dyn11", "YNyn0", "Dyn1", "YNd11"].map((o) => opt(o)), default: "Dyn11" },
      { id: "impedance", label: "Impedance", type: "number", unit: "%", default: 6.25, min: 3, max: 15, step: 0.25, help: "Percentage impedance at rated tap" },
    ],
  };
}

const windings: GroupDef = {
  id: "windings",
  label: "Windings",
  attributes: [
    { id: "windingMaterial", label: "Winding material", type: "enum", options: [opt("copper", "Copper"), opt("aluminium", "Aluminium")], default: "copper", drivesBom: true },
    { id: "insulationClass", label: "Insulation class", type: "enum", options: ["A", "E", "B", "F"].map((o) => opt(o)), default: "A" },
  ],
};

function cooling(coolingOpts: string[]): GroupDef {
  return {
    id: "cooling",
    label: "Cooling",
    attributes: [
      { id: "cooling", label: "Cooling type", type: "enum", options: coolingOpts.map((o) => opt(o)), default: coolingOpts[0], drivesBom: true },
      { id: "tempRise", label: "Temp rise (oil/wdg)", type: "enum", options: [opt("50/55", "50 / 55 °C"), opt("55/60", "55 / 60 °C")], default: "50/55" },
    ],
  };
}

const core: GroupDef = {
  id: "core",
  label: "Core",
  attributes: [
    { id: "coreMaterial", label: "Core material", type: "enum", options: [opt("crgo_m4", "CRGO M4"), opt("crgo_m5", "CRGO M5"), opt("amorphous", "Amorphous")], default: "crgo_m4", drivesBom: true },
    { id: "coreType", label: "Core construction", type: "enum", options: [opt("3-limb", "3-limb"), opt("5-limb", "5-limb")], default: "3-limb" },
  ],
};

function tank(tankOpts: { value: string; label: string }[], conservatorDefault: boolean): GroupDef {
  return {
    id: "tank",
    label: "Tank & Oil",
    attributes: [
      { id: "tankType", label: "Tank type", type: "enum", options: tankOpts, default: tankOpts[0].value, drivesBom: true },
      { id: "oilType", label: "Insulating fluid", type: "enum", options: [opt("mineral", "Mineral oil (IS 335)"), opt("ester", "Natural ester")], default: "mineral", drivesBom: true },
      { id: "conservator", label: "Conservator", type: "boolean", default: conservatorDefault },
    ],
  };
}

function tapChanger(allowOLTC: boolean): GroupDef {
  const opts = allowOLTC ? [opt("octc", "Off-circuit (OCTC)"), opt("oltc", "On-load (OLTC)")] : [opt("octc", "Off-circuit (OCTC)")];
  return {
    id: "tap",
    label: "Tap Changer",
    attributes: [
      { id: "tapChanger", label: "Tap changer", type: "enum", options: opts, default: "octc", drivesBom: true },
      { id: "tappingRange", label: "Tapping range", type: "enum", options: [opt("±5%"), opt("±10%"), opt("+5/-10%"), opt("±15%")], default: "±5%" },
      { id: "steps", label: "Steps", type: "number", default: 17, min: 5, max: 27, step: 2, visibleIf: (v) => v.tapChanger === "oltc" },
    ],
  };
}

const bushings: GroupDef = {
  id: "bushings",
  label: "Bushings",
  attributes: [
    { id: "hvBushing", label: "HV bushing", type: "enum", options: [opt("porcelain", "Porcelain"), opt("polymer", "Polymer")], default: "porcelain", drivesBom: true },
    { id: "lvBushing", label: "LV bushing", type: "enum", options: [opt("porcelain", "Porcelain"), opt("polymer", "Polymer")], default: "porcelain", drivesBom: true },
  ],
};

const protection: GroupDef = {
  id: "protection",
  label: "Protection & Monitoring",
  attributes: [
    { id: "buchholz", label: "Buchholz relay", type: "boolean", default: true, drivesBom: true },
    { id: "otiWti", label: "OTI / WTI indicators", type: "boolean", default: true, drivesBom: true },
    { id: "prv", label: "Pressure relief valve", type: "boolean", default: true, drivesBom: true },
    { id: "mog", label: "Magnetic oil gauge", type: "boolean", default: true, drivesBom: true },
    { id: "rtcc", label: "RTCC / remote monitoring", type: "boolean", default: false, drivesBom: true, visibleIf: (v) => v.tapChanger === "oltc" },
  ],
};

function standards(stdOpts: { value: string; label: string }[]): GroupDef {
  return {
    id: "standards",
    label: "Standards & Testing",
    attributes: [
      { id: "standard", label: "Standard", type: "enum", options: stdOpts, default: stdOpts[0].value },
      { id: "typeTest", label: "Type test", type: "boolean", default: false },
      { id: "impulseTest", label: "Impulse test (LI)", type: "boolean", default: false },
      { id: "scTest", label: "Short-circuit test", type: "boolean", default: false },
    ],
  };
}

const finish: GroupDef = {
  id: "finish",
  label: "Finish & Packing",
  attributes: [
    { id: "paintShade", label: "Paint shade", type: "enum", options: [opt("RAL7035", "RAL 7035 Grey"), opt("RAL5012", "RAL 5012 Blue"), opt("siemensgrey", "Siemens Grey")], default: "RAL7035" },
    { id: "paintDft", label: "Paint DFT", type: "number", unit: "µm", default: 120, min: 80, max: 250, step: 10, drivesBom: true },
    { id: "packing", label: "Packing", type: "enum", options: [opt("open", "Open"), opt("tarpaulin", "Tarpaulin"), opt("crate", "Wooden crate"), opt("seaworthy", "Sea-worthy")], default: "tarpaulin" },
  ],
};

function commercial(warrantyOpts: string[]): GroupDef {
  return {
    id: "commercial",
    label: "Commercial",
    attributes: [
      { id: "warranty", label: "Warranty", type: "enum", unit: "months", options: warrantyOpts.map((o) => opt(o)), default: warrantyOpts[1] ?? warrantyOpts[0] },
      { id: "quantity", label: "Quantity", type: "number", default: 1, min: 1, max: 50, step: 1, drivesBom: true },
    ],
  };
}

/* ---------- assemble families ---------- */

const POWER_RATINGS = [
  { value: "5", label: "5 MVA" }, { value: "10", label: "10 MVA" }, { value: "20", label: "20 MVA" },
  { value: "31.5", label: "31.5 MVA" }, { value: "50", label: "50 MVA" }, { value: "63", label: "63 MVA" },
];
const DIST_RATINGS = [
  { value: "0.25", label: "250 kVA" }, { value: "0.5", label: "500 kVA" }, { value: "0.63", label: "630 kVA" },
  { value: "1", label: "1000 kVA" }, { value: "1.6", label: "1600 kVA" }, { value: "2.5", label: "2500 kVA" },
];

export const POWER_TRANSFORMER: FamilyDef = {
  id: "power-transformer",
  name: "Power Transformer",
  category: "Transformers",
  blurb: "Oil-filled power transformer, 5–63 MVA, up to 220 kV class.",
  groups: [
    ratings(POWER_RATINGS, ["11", "22", "33", "66", "132", "220"], ["3.3", "6.6", "11", "33"]),
    windings,
    cooling(["ONAN", "ONAF", "ONAN/ONAF", "OFAF", "ODAF"]),
    core,
    tank([opt("conventional", "Conventional"), opt("corrugated", "Corrugated"), opt("hermetic", "Hermetically sealed")], true),
    tapChanger(true),
    bushings,
    protection,
    standards([opt("IS 2026", "IS 2026"), opt("IEC 60076", "IEC 60076"), opt("IEEE C57", "IEEE C57")]),
    finish,
    commercial(["18", "24", "36", "60"]),
  ],
  derive, validate, emitBom, datasheet,
};

export const DISTRIBUTION_TRANSFORMER: FamilyDef = {
  id: "distribution-transformer",
  name: "Distribution Transformer",
  category: "Transformers",
  blurb: "Oil-filled distribution transformer, 250–2500 kVA, 11/22/33 kV class.",
  groups: [
    ratings(DIST_RATINGS, ["11", "22", "33"], ["0.433", "3.3", "6.6"]),
    windings,
    cooling(["ONAN"]),
    core,
    tank([opt("hermetic", "Hermetically sealed"), opt("conventional", "Conventional"), opt("corrugated", "Corrugated")], false),
    tapChanger(false),
    bushings,
    protection,
    standards([opt("IS 1180", "IS 1180"), opt("IS 2026", "IS 2026"), opt("IEC 60076", "IEC 60076")]),
    finish,
    commercial(["18", "24", "36"]),
  ],
  derive, validate, emitBom, datasheet,
};

const AUTO_RATINGS = [
  { value: "40", label: "40 MVA" }, { value: "63", label: "63 MVA" }, { value: "100", label: "100 MVA" },
  { value: "167", label: "167 MVA" }, { value: "315", label: "315 MVA" },
];
const FURNACE_RATINGS = [
  { value: "10", label: "10 MVA" }, { value: "20", label: "20 MVA" }, { value: "31.5", label: "31.5 MVA" },
  { value: "45", label: "45 MVA" }, { value: "63", label: "63 MVA" },
];

export const AUTO_TRANSFORMER: FamilyDef = {
  id: "auto-transformer",
  name: "Auto Transformer",
  category: "Transformers",
  blurb: "Oil-filled auto-transformer, 40–315 MVA, 400 / 220 / 132 kV class.",
  groups: [
    ratings(AUTO_RATINGS, ["400", "220", "132"], ["220", "132", "66"]),
    windings,
    cooling(["ONAN/ONAF", "OFAF", "ODAF"]),
    core,
    tank([opt("conventional", "Conventional")], true),
    tapChanger(true),
    bushings,
    protection,
    standards([opt("IS 2026", "IS 2026"), opt("IEC 60076", "IEC 60076")]),
    finish,
    commercial(["24", "36", "60"]),
  ],
  derive, validate, emitBom, datasheet,
};

export const FURNACE_TRANSFORMER: FamilyDef = {
  id: "furnace-transformer",
  name: "Furnace Transformer",
  category: "Transformers",
  blurb: "Special-duty furnace transformer, 10–63 MVA, high secondary current.",
  groups: [
    ratings(FURNACE_RATINGS, ["33", "66", "132"], ["0.4", "0.7", "1.2"]),
    windings,
    cooling(["ONAN", "ONAF", "OFAF"]),
    core,
    tank([opt("conventional", "Conventional")], true),
    tapChanger(true),
    bushings,
    protection,
    standards([opt("IS 2026", "IS 2026"), opt("IEC 60076", "IEC 60076")]),
    finish,
    commercial(["12", "18", "24"]),
  ],
  derive, validate, emitBom, datasheet,
};

export const FAMILIES: FamilyDef[] = [POWER_TRANSFORMER, DISTRIBUTION_TRANSFORMER, AUTO_TRANSFORMER, FURNACE_TRANSFORMER];

/** flat attribute list for label lookups in datasheet */
const ALL_ATTRS: AttrDef[] = POWER_TRANSFORMER.groups.flatMap((g) => g.attributes);
