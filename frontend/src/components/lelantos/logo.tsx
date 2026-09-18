import * as React from "react";

interface LelantosLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LelantosLogo({ className = "", size = "md" }: LelantosLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  }[size];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center border border-zinc-700 bg-black overflow-hidden ${sizeClasses} ${className}`}
      title="Lelantos"
    >
      <img
        src="/lelantos-logo.jpg"
        alt="Lelantos Greek Deity"
        className="h-full w-full object-cover object-[center_28%] scale-[1.25] select-none pointer-events-none"
      />
      {/* Voxel corner markers matching the Lelantos aesthetic */}
      <div className="absolute -top-0.5 -left-0.5 h-1 w-1 bg-white pointer-events-none" />
      <div className="absolute -top-0.5 -right-0.5 h-1 w-1 bg-white pointer-events-none" />
      <div className="absolute -bottom-0.5 -left-0.5 h-1 w-1 bg-white pointer-events-none" />
      <div className="absolute -bottom-0.5 -right-0.5 h-1 w-1 bg-white pointer-events-none" />
    </div>
  );
}
