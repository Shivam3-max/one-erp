export interface DonutSegment {
  label: string;
  value: number;
  color: string; // explicit color so it reads on both themes
}

/**
 * A compact SVG donut with a legend. Server-renderable (no client JS); native
 * SVG <title> gives a hover tooltip. Identity is carried by the legend + values,
 * never colour alone.
 */
export function Donut({
  segments,
  centerValue,
  centerLabel,
  formatValue = (n) => String(n),
  size = 132,
}: {
  segments: DonutSegment[];
  centerValue: string;
  centerLabel: string;
  formatValue?: (n: number) => string;
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const shown = segments.filter((s) => s.value > 0);
  // r chosen so the circumference is 100 → dash lengths are percentages.
  const R = 15.915;
  let offset = 25; // start at 12 o'clock

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label={centerLabel} className="shrink-0">
        <circle cx="21" cy="21" r={R} fill="none" stroke="var(--color-surface-3, #e9edf5)" strokeWidth="4.5" />
        {total > 0 &&
          shown.map((s) => {
            const pct = (s.value / total) * 100;
            const dash = Math.max(pct - 1.2, 0.4); // small gap between segments
            const el = (
              <circle
                key={s.label}
                cx="21" cy="21" r={R} fill="none"
                stroke={s.color} strokeWidth="4.5" strokeLinecap="round"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={offset}
              >
                <title>{`${s.label}: ${formatValue(s.value)} (${pct.toFixed(0)}%)`}</title>
              </circle>
            );
            offset -= pct;
            return el;
          })}
        <text x="21" y="20.2" textAnchor="middle" className="donut-center-value" style={{ fontSize: "7px", fontWeight: 700, fill: "var(--color-ink, #141a26)" }}>
          {centerValue}
        </text>
        <text x="21" y="25.4" textAnchor="middle" style={{ fontSize: "2.9px", fill: "var(--color-ink-3, #697184)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {centerLabel}
        </text>
      </svg>

      <ul className="w-full space-y-1.5">
        {segments.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <li key={s.label} className="flex items-center gap-2 text-[12px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
              <span className="flex-1 truncate text-ink-2">{s.label}</span>
              <span className="tnum font-mono font-semibold text-ink">{formatValue(s.value)}</span>
              <span className="w-9 shrink-0 text-right tnum font-mono text-ink-4">{pct.toFixed(0)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
