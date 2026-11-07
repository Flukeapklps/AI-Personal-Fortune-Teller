import { interpretScore, type ScoreLevel } from "@/lib/fortune/scoring";
import { cn } from "@/lib/utils";

const LEVEL_COLOR: Record<ScoreLevel, string> = {
  excellent: "#f6dc8c",
  very_good: "#c4b5fd",
  good: "#7dd3fc",
  moderate: "#fdba74",
  careful: "#fca5a5",
};

export function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const { level, labelTh } = interpretScore(score);
  const stroke = Math.max(6, size / 14);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = LEVEL_COLOR[level];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label ?? "คะแนนดวง"} ${score} จาก 100 (${labelTh})`}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - score / 100)}
            style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-display font-bold leading-none text-white" style={{ fontSize: size / 3.6 }}>
              {score}
            </div>
            <div className="text-white/50" style={{ fontSize: Math.max(10, size / 11) }}>
              /100
            </div>
          </div>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color }}>
        {labelTh}
      </span>
      {label && <span className="text-xs text-white/60">{label}</span>}
    </div>
  );
}

export function ScoreBar({ score, label, emoji, className }: { score: number; label: string; emoji?: string; className?: string }) {
  const { level, labelTh } = interpretScore(score);
  const color = LEVEL_COLOR[level];
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-white/85">
          {emoji && <span aria-hidden>{emoji} </span>}
          {label}
        </span>
        <span>
          <span className="font-semibold text-white">{score}</span>
          <span className="text-white/50">/100 · </span>
          <span style={{ color }}>{labelTh}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={label}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </div>
    </div>
  );
}

export const SCORE_LEGEND = [
  { range: "90–100", labelTh: "ดีเยี่ยม", level: "excellent" },
  { range: "80–89", labelTh: "ดีมาก", level: "very_good" },
  { range: "70–79", labelTh: "ดี", level: "good" },
  { range: "60–69", labelTh: "ปานกลาง", level: "moderate" },
  { range: "< 60", labelTh: "ควรระมัดระวัง", level: "careful" },
] as const;

export function ScoreLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
      {SCORE_LEGEND.map((s) => (
        <li key={s.level} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: LEVEL_COLOR[s.level] }} aria-hidden />
          {s.range} {s.labelTh}
        </li>
      ))}
    </ul>
  );
}
