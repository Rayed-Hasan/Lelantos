import * as React from "react";

import { cn } from "@/lib/utils";

type PrimitiveProps<T extends HTMLElement = HTMLDivElement> = React.HTMLAttributes<T>;

export function WatermelonSplitShell({ className, ...props }: PrimitiveProps) {
  return (
    <main
      className={cn(
        "grid min-h-screen grid-cols-2 overflow-hidden bg-background text-panel-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function WatermelonPanel({ className, ...props }: PrimitiveProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-screen min-w-0 flex-col border-panel-border bg-panel",
        className,
      )}
      {...props}
    />
  );
}

export function WatermelonHeader({ className, ...props }: PrimitiveProps<HTMLElement>) {
  return (
    <header
      className={cn("flex min-h-20 items-center justify-between border-panel-border px-8", className)}
      {...props}
    />
  );
}

export function WatermelonStack({ className, ...props }: PrimitiveProps) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)} {...props} />;
}

export function WatermelonGrid({ className, ...props }: PrimitiveProps) {
  return <div className={cn("grid min-h-0 flex-1 grid-rows-2 gap-4", className)} {...props} />;
}

export function WatermelonSurface({ className, ...props }: PrimitiveProps) {
  return (
    <div
      className={cn(
        "min-h-0 border border-panel-border bg-card shadow-hairline",
        className,
      )}
      {...props}
    />
  );
}

export function WatermelonKicker({ className, ...props }: PrimitiveProps<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-mono text-[0.625rem] font-medium uppercase leading-none tracking-normal text-panel-muted",
        className,
      )}
      {...props}
    />
  );
}