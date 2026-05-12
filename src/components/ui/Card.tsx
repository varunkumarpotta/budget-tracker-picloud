import { cn } from "@/lib/utils";

export default function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-app-border/70 bg-app-surface/70 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

