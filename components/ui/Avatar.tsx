import { cn } from "@/lib/cn";

const PALETTE = [
  "bg-[#e9efff] text-[#163aa8]",
  "bg-[#f8ede3] text-[#8a4a20]",
  "bg-[#e2f5ec] text-[#0b7a4d]",
  "bg-[#fbf1dc] text-[#9a5f0d]",
  "bg-[#efeafe] text-[#5b3ea8]",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  initials,
  name,
  size = 26,
  className,
}: {
  initials: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const color = PALETTE[hash(name ?? initials) % PALETTE.length];
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        color,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}
