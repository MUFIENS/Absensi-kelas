import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "white" | "yellow" | "blue" | "pink" | "green" | "orange" | "purple" | "crt";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "blue" | "pink" | "yellow" | "green";
  borderWidth?: "normal" | "thick" | "thin";
}

export function Card({
  className,
  variant = "white",
  shadow = "md",
  borderWidth = "normal",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    white: "bg-white text-[#181818]",
    yellow: "bg-[#FFD400] text-[#181818]",
    blue: "bg-[#3355FF] text-white",
    pink: "bg-[#FF6FA5] text-[#181818]",
    green: "bg-[#6FCB6F] text-[#181818]",
    orange: "bg-[#FF7A2E] text-white",
    purple: "bg-[#8B5CF6] text-white",
    crt: "bg-[#121629] text-[#70FF94] border-[#181818]",
  };

  const shadowStyles = {
    none: "shadow-none",
    sm: "brutal-shadow-sm",
    md: "brutal-shadow",
    lg: "brutal-shadow-lg",
    xl: "brutal-shadow-xl",
    blue: "brutal-shadow-blue",
    pink: "brutal-shadow-pink",
    yellow: "brutal-shadow-yellow",
    green: "brutal-shadow-green",
  };

  const borderStyles = {
    thin: "brutal-border-2",
    normal: "brutal-border",
    thick: "brutal-border-thick",
  };

  return (
    <div
      className={cn(
        "rounded-3xl p-5 md:p-7 relative transition-all",
        variantStyles[variant],
        shadowStyles[shadow],
        borderStyles[borderWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xl md:text-2xl font-black font-fredoka tracking-tight leading-none",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm font-medium opacity-80", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center pt-4", className)}
      {...props}
    />
  );
}
