export type TestCat = "routine" | "type" | "special";
export type TestResult = "pass" | "fail" | "pending";

export interface TestRecord {
  id: string;
  name: string;
  category: TestCat;
  result: TestResult;
  value?: string;
  limit?: string;
  engineerId: string;
  witnessed?: boolean;
}

export interface TestUnit {
  serial: string;
  projectId: string;
  projectShort: string;
  product: string;
  tests: TestRecord[];
  certIssued: boolean;
  issuedAt?: string;
}

const routine = (i: number, name: string, result: TestResult, value?: string, limit?: string, witnessed = true): TestRecord =>
  ({ id: `R${i}`, name, category: "routine", result, value, limit, engineerId: "U-08", witnessed });

export const TEST_UNITS: TestUnit[] = [
  {
    serial: "CTR/2026/0129/A", projectId: "PRJ-2026-0129", projectShort: "GETCO", product: "20 MVA 132/33 kV ONAN/ONAF",
    certIssued: false,
    tests: [
      routine(1, "Winding resistance measurement", "pass", "Balanced ±1.2%", "±2%"),
      routine(2, "Voltage ratio & polarity", "pass", "132/33 kV ±0.28%", "±0.5%"),
      routine(3, "No-load loss & current", "pass", "18.2 kW", "≤ 19 kW"),
      routine(4, "Load loss & impedance voltage", "pass", "Z = 12.35%", "12.5% ±10%"),
      routine(5, "Insulation resistance (IR/PI)", "pass", "> 5 GΩ, PI 1.8", "≥ 1 GΩ"),
      routine(6, "Separate-source voltage withstand", "pass", "70 kV / 1 min", "withstood"),
      routine(7, "Induced overvoltage withstand", "pass", "2× / 60 s", "withstood"),
      routine(8, "Oil dielectric strength (BDV)", "pass", "72 kV", "≥ 60 kV"),
      { id: "T1", name: "Temperature-rise test", category: "type", result: "pass", value: "52 / 58 °C", limit: "≤ 55 / 60 °C", engineerId: "U-08", witnessed: true },
      { id: "T2", name: "Lightning impulse (LI) test", category: "type", result: "pending", value: "scheduled 02 Aug", limit: "650 kVp", engineerId: "U-08", witnessed: true },
      { id: "S1", name: "Short-circuit withstand", category: "special", result: "pending", value: "at CPRI Bhopal", limit: "IS 2026-1", engineerId: "U-08", witnessed: true },
    ],
  },
  {
    serial: "CTR/2026/0142/U1", projectId: "PRJ-2026-0142", projectShort: "MSEDCL", product: "5 MVA 33/11 kV ONAN (Unit 1)",
    certIssued: false,
    tests: [
      routine(1, "Winding resistance measurement", "pending", undefined, "±2%"),
      routine(2, "Voltage ratio & polarity", "pending", undefined, "±0.5%"),
      routine(3, "No-load loss & current", "pending", undefined, "≤ 3.7 kW"),
      routine(4, "Load loss & impedance voltage", "pending", undefined, "6.25% ±10%"),
      { id: "T1", name: "Temperature-rise test", category: "type", result: "pending", limit: "≤ 55 / 60 °C", engineerId: "U-08" },
    ],
  },
  {
    serial: "CTR/2026/0117/A", projectId: "PRJ-2026-0117", projectShort: "JSW", product: "31.5 MVA 132/33 kV Furnace Duty",
    certIssued: true, issuedAt: "2026-07-19",
    tests: [
      routine(1, "Winding resistance measurement", "pass", "Balanced ±0.9%", "±2%"),
      routine(2, "Voltage ratio & polarity", "pass", "±0.2%", "±0.5%"),
      routine(3, "No-load loss & current", "pass", "24.8 kW", "≤ 26 kW"),
      routine(4, "Load loss & impedance voltage", "pass", "Z = 14.1%", "14% ±10%"),
      routine(5, "Insulation resistance (IR/PI)", "pass", "> 8 GΩ", "≥ 1 GΩ"),
      routine(6, "Separate-source voltage withstand", "pass", "70 kV / 1 min", "withstood"),
      routine(7, "Oil dielectric strength (BDV)", "pass", "78 kV", "≥ 60 kV"),
      { id: "T1", name: "Temperature-rise test", category: "type", result: "pass", value: "49 / 54 °C", limit: "≤ 55 / 60 °C", engineerId: "U-08", witnessed: true },
    ],
  },
];

export const CAT_LABEL: Record<TestCat, string> = { routine: "Routine", type: "Type", special: "Special" };
