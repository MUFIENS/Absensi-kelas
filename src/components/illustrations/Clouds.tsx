import React from "react";
import { cn } from "@/lib/utils";

export function PopCloud({
  className = "w-32 h-18 text-white",
  strokeColor = "#181818",
  fillColor = "#FFFFFF",
}: {
  className?: string;
  strokeColor?: string;
  fillColor?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[4px_4px_0px_#181818]", className)}>
      <svg
        viewBox="0 0 160 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          d="M 30 75 
             C 10 75 5 55 20 42 
             C 15 25 35 15 52 25 
             C 65 8 95 8 108 24 
             C 125 15 145 28 140 45 
             C 155 58 148 75 130 75 
             Z"
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function PopStar({
  className = "w-10 h-10",
  fill = "#FFD400",
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[3px_3px_0px_#181818]", className)}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path
          d="M 50 5 L 63 35 L 95 38 L 70 60 L 78 92 L 50 75 L 22 92 L 30 60 L 5 38 L 37 35 Z"
          fill={fill}
          stroke="#181818"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function ComicArrow({
  className = "w-20 h-12",
  direction = "right",
  color = "#FFD400",
}: {
  className?: string;
  direction?: "right" | "down" | "left" | "up";
  color?: string;
}) {
  const rotStyles = {
    right: "rotate-0",
    down: "rotate-90",
    left: "rotate-180",
    up: "-rotate-90",
  };

  return (
    <div className={cn("inline-block select-none drop-shadow-[4px_4px_0px_#181818]", rotStyles[direction], className)}>
      <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path
          d="M 10 20 L 70 20 L 70 5 L 115 30 L 70 55 L 70 40 L 10 40 Z"
          fill={color}
          stroke="#181818"
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
