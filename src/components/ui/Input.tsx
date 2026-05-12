import { cn } from "@/lib/utils";

export default function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-app-border/70 bg-app-surface/40 px-3 text-sm text-app-foreground placeholder:text-app-muted outline-none transition focus:border-app-border focus:bg-app-surface/60 focus:ring-2 focus:ring-[rgba(var(--accent),0.24)]",
        className,
      )}
      {...props}
    />
  );
}

