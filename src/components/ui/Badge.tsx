import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "yellow" | "blue" | "pink" | "green" | "orange" | "purple" | "white" | "dark" | "pending" | "verified" | "rejected";
  size?: "sm" | "md" | "lg";
  rotate?: "none" | "left" | "right";
}

export function Badge({
  className,
  variant = "yellow",
  size = "md",
  rotate = "none",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    yellow: "bg-[#FFD400] text-[#181818]",
    blue: "bg-[#3355FF] text-white",
    pink: "bg-[#FF6FA5] text-[#181818]",
    green: "bg-[#6FCB6F] text-[#181818]",
    orange: "bg-[#FF7A2E] text-white",
    purple: "bg-[#8B5CF6] text-white",
    white: "bg-white text-[#181818]",
    dark: "bg-[#181818] text-white",
    pending: "bg-[#FFD400] text-[#181818]",
    verified: "bg-[#6FCB6F] text-[#181818]",
    rejected: "bg-[#FF4D4D] text-white",
  };

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-xs font-bold rounded-lg border-[2px]",
    md: "px-3.5 py-1 text-xs md:text-sm font-extrabold rounded-xl border-[2.5px]",
    lg: "px-5 py-2 text-sm md:text-base font-black rounded-2xl border-[3px]",
  };

  const rotateStyles = {
    none: "",
    left: "-rotate-2",
    right: "rotate-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 border-[#181818] brutal-shadow-sm select-none uppercase tracking-wider font-fredoka",
        variantStyles[variant],
        sizeStyles[size],
        rotateStyles[rotate],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Section Header Badge as defined in design.md (Pill badge with eyebrow label)
export function SectionHeadingBadge({
  title,
  subtitle,
  badgeColor = "bg-[#FF6FA5]",
  textColor = "text-[#181818]",
  className,
}: {
  title: string;
  subtitle: string;
  badgeColor?: string;
  textColor?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center my-4", className)}>
      <div
        className={cn(
          "px-8 py-3 rounded-full brutal-border-thick brutal-shadow-lg text-2xl md:text-3xl font-black font-fredoka tracking-wide transform hover:scale-105 transition-transform",
          badgeColor,
          textColor
        )}
      >
        {title}
      </div>
      <span className="mt-2 text-xs md:text-sm font-extrabold tracking-[0.25em] text-[#181818] uppercase bg-white px-3 py-0.5 rounded-md brutal-border-2 brutal-shadow-sm">
        ▶ {subtitle} ◀
      </span>
    </div>
  );
}
