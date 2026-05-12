import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] shadow-[0_12px_32px_rgba(0,0,0,0.24)] hover:shadow-[0_16px_44px_rgba(0,0,0,0.28)]",
  secondary:
    "bg-app-surface/60 text-app-foreground border border-app-border/60 hover:bg-app-surface/80",
  ghost: "bg-transparent text-app-foreground hover:bg-app-surface/50",
  danger:
    "bg-red-500/90 text-white hover:bg-red-500 shadow-[0_10px_24px_rgba(239,68,68,0.25)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

