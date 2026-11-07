import { Slot } from "./slot";
import { cn } from "@/lib/utils";

type Variant = "gold" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  gold: "bg-gradient-to-r from-gold-300 to-gold-500 text-night-950 font-semibold shadow-[0_8px_30px_-8px_rgba(233,196,106,0.6)] hover:brightness-110",
  ghost: "text-white/80 hover:bg-white/10 hover:text-white",
  outline: "border border-gold-400/40 text-gold-300 hover:bg-gold-400/10",
  danger: "border border-red-400/40 text-red-300 hover:bg-red-500/10",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "size-10",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export function Button({ className, variant = "gold", size = "md", asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
