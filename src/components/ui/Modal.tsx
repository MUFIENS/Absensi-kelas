"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: "white" | "yellow" | "blue" | "pink";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  variant = "white",
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Pause Lenis smooth scroll so mouse wheel events scroll the modal cleanly
      if (typeof window !== "undefined" && (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis) {
        (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis?.stop();
      }
    } else {
      document.body.style.overflow = "unset";
      if (typeof window !== "undefined" && (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis) {
        (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis?.start();
      }
    }
    return () => {
      document.body.style.overflow = "unset";
      if (typeof window !== "undefined" && (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis) {
        (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis?.start();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-3xl",
    "3xl": "max-w-4xl",
  };

  const bgStyles = {
    white: "bg-white",
    yellow: "bg-[#FFD400]",
    blue: "bg-[#3355FF] text-white",
    pink: "bg-[#FF6FA5]",
  };

  return (
    <div
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto overscroll-contain"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#181818]/65 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        data-lenis-prevent="true"
        className={cn(
          "relative w-full max-h-[86vh] sm:max-h-[90vh] flex flex-col rounded-[28px] sm:rounded-3xl brutal-border-thick brutal-shadow-xl z-10 my-auto overflow-hidden transition-all transform animate-in zoom-in-95 duration-150",
          bgStyles[variant],
          maxWidthStyles[maxWidth]
        )}
      >
        {/* Header (Pinned) */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 md:p-6 pb-3 sm:pb-4 border-b-3 border-[#181818] bg-inherit">
          {title && (
            <h3 className="text-lg sm:text-xl md:text-2xl font-black font-fredoka tracking-tight text-[#181818] truncate pr-2">
              {title}
            </h3>
          )}
          <Button
            variant="pink"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 ml-auto"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#181818] stroke-[3]" />
          </Button>
        </div>

        {/* Content (Scrollable) */}
        <div
          data-lenis-prevent="true"
          className="p-4 sm:p-5 md:p-6 overflow-y-auto overscroll-contain flex-1 text-[#181818]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
