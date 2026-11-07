import type { WesternSignId } from "@/lib/fortune/astrology";
import { cn } from "@/lib/utils";

// Stylised constellation outlines (decorative, 0–100 coordinate space).
const CONSTELLATIONS: Record<WesternSignId, [number, number][]> = {
  aries: [[18, 40], [42, 30], [62, 34], [80, 52]],
  taurus: [[15, 25], [35, 45], [50, 55], [65, 45], [85, 28], [50, 55], [55, 78]],
  gemini: [[25, 15], [28, 45], [30, 80], [30, 45], [68, 45], [70, 15], [68, 45], [72, 82]],
  cancer: [[50, 15], [50, 45], [25, 75], [50, 45], [78, 72]],
  leo: [[20, 70], [35, 50], [55, 45], [70, 25], [82, 35], [75, 55], [55, 45], [60, 75]],
  virgo: [[15, 30], [35, 40], [50, 30], [62, 50], [80, 45], [62, 50], [55, 80]],
  libra: [[20, 65], [35, 35], [65, 35], [80, 65], [35, 35], [50, 15], [65, 35]],
  scorpio: [[12, 25], [25, 35], [40, 45], [55, 55], [65, 70], [78, 78], [88, 65]],
  sagittarius: [[20, 75], [40, 55], [55, 40], [75, 22], [55, 40], [72, 55], [40, 55], [35, 30]],
  capricorn: [[15, 30], [40, 55], [70, 70], [85, 40], [55, 35], [15, 30]],
  aquarius: [[12, 35], [28, 50], [42, 35], [58, 50], [72, 35], [88, 50]],
  pisces: [[12, 20], [25, 40], [45, 60], [60, 80], [72, 60], [88, 45]],
};

export function ZodiacEmblem({
  sign,
  symbol,
  size = 112,
  className,
}: {
  sign: WesternSignId;
  symbol: string;
  size?: number;
  className?: string;
}) {
  const pts = CONSTELLATIONS[sign];
  return (
    <div
      className={cn("relative grid shrink-0 place-items-center rounded-full gold-ring", className)}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 30% 25%, rgba(124,58,237,0.55), rgba(10,16,48,0.95) 70%)",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full p-[14%] opacity-60">
        <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#e9c46a" strokeWidth="0.8" strokeOpacity="0.6" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.8" fill="#f6dc8c" />
        ))}
      </svg>
      <span className="relative leading-none text-gold-300 drop-shadow-[0_0_10px_rgba(233,196,106,0.6)]" style={{ fontSize: size * 0.42, fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols', 'DejaVu Sans', serif" }}>
        {symbol}
      </span>
    </div>
  );
}
