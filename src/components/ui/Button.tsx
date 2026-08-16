"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center font-bold transition-all select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none brutal-border brutal-shadow brutal-btn-press tracking-wide",
  {
    variants: {
      variant: {
        primary: "bg-[#3355FF] text-white hover:bg-[#2545EE]",
        yellow: "bg-[#FFD400] text-[#181818] hover:bg-[#E6C000]",
        pink: "bg-[#FF6FA5] text-[#181818] hover:bg-[#F25E96]",
        green: "bg-[#6FCB6F] text-[#181818] hover:bg-[#5BB85B]",
        orange: "bg-[#FF7A2E] text-white hover:bg-[#E8671C]",
        purple: "bg-[#8B5CF6] text-white hover:bg-[#7843E6]",
        white: "bg-white text-[#181818] hover:bg-neutral-50",
        dark: "bg-[#181818] text-white hover:bg-neutral-800",
        danger: "bg-red-500 text-white hover:bg-red-600",
        ghost: "bg-transparent border-transparent shadow-none hover:bg-black/5 hover:border-black/20",
      },
      size: {
        sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
        md: "px-5 py-2.5 text-sm md:text-base rounded-2xl gap-2",
        lg: "px-7 py-3.5 text-base md:text-lg rounded-2xl gap-2.5",
        xl: "px-8 py-4 text-lg md:text-xl rounded-3xl gap-3 font-extrabold",
        icon: "h-11 w-11 p-0 rounded-2xl",
      },
      pill: {
        true: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "yellow",
      size: "md",
      pill: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pill, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, pill, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
