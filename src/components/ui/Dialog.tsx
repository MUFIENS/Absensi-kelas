"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, AlertTriangle, CheckCircle, Info, HelpCircle, AlertCircle } from "lucide-react";
import { Button } from "./Button";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "white" | "yellow" | "blue" | "pink";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showCloseButton?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  variant = "white",
  maxWidth = "md",
  className,
  showCloseButton = true,
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Pause Lenis smooth scroll so mouse wheel events scroll the dialog cleanly
      if (typeof window !== "undefined" && (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis) {
        (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis?.stop();
      }
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
      if (typeof window !== "undefined" && (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis) {
        (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis?.start();
      }
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
      if (typeof window !== "undefined" && (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis) {
        (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis?.start();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    "2xl": "max-w-4xl",
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
      {/* Backdrop with subtle blur */}
      <div
        className="fixed inset-0 bg-[#181818]/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div
        data-lenis-prevent="true"
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-h-[88vh] sm:max-h-[92vh] flex flex-col rounded-[28px] sm:rounded-3xl brutal-border-thick brutal-shadow-xl z-10 my-auto overflow-hidden",
          "transition-all transform animate-in zoom-in-95 fade-in duration-200",
          bgStyles[variant],
          maxWidthStyles[maxWidth],
          className
        )}
      >
        {/* Pinned Header */}
        {(title || showCloseButton) && (
          <div className="shrink-0 flex items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b-3 border-[#181818] bg-inherit">
            <div className="min-w-0 pr-3">
              {typeof title === "string" ? (
                <h3 className="text-lg sm:text-xl md:text-2xl font-black font-fredoka tracking-tight text-[#181818] leading-tight">
                  {title}
                </h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs sm:text-sm font-bold text-neutral-600 mt-1">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <Button
                variant="pink"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 ml-auto"
                aria-label="Tutup Dialog"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#181818] stroke-[3]" />
              </Button>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div
          data-lenis-prevent="true"
          className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 text-[#181818] space-y-4"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Confirmation Dialog (Modern replacement for confirm())
// ----------------------------------------------------
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "pink" | "yellow" | "green" | "danger" | "orange" | "purple" | "white" | "dark";
  type?: "warning" | "danger" | "info" | "question";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  subMessage,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  confirmVariant = "primary",
  type = "warning",
  isLoading = false,
}: ConfirmDialogProps) {
  const iconTypes = {
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-[#181818] stroke-[2.5]" />,
      bg: "bg-[#FFD400]",
    },
    danger: {
      icon: <AlertCircle className="w-8 h-8 text-white stroke-[2.5]" />,
      bg: "bg-red-500",
    },
    info: {
      icon: <Info className="w-8 h-8 text-white stroke-[2.5]" />,
      bg: "bg-[#3355FF]",
    },
    question: {
      icon: <HelpCircle className="w-8 h-8 text-[#181818] stroke-[2.5]" />,
      bg: "bg-[#FF6FA5]",
    },
  };

  const selectedIcon = iconTypes[type];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      showCloseButton={false}
      className="p-1"
    >
      <div className="text-center space-y-4 pt-2">
        {/* Animated Badge Icon */}
        <div
          className={cn(
            "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center brutal-border-2 brutal-shadow-sm rotate-2 animate-in zoom-in-50 duration-200",
            selectedIcon.bg
          )}
        >
          {selectedIcon.icon}
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-xl sm:text-2xl font-black font-fredoka text-[#181818] leading-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed">
            {message}
          </p>
          {subMessage && (
            <p className="text-[11px] font-bold text-neutral-500 bg-neutral-100 p-2 rounded-xl mt-2 border border-neutral-200">
              {subMessage}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t-2 border-neutral-200">
          <Button
            type="button"
            variant="white"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            className="w-full justify-center text-xs font-black"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            size="md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className="w-full justify-center text-xs font-black shadow-md"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ----------------------------------------------------
// Alert / Info Dialog (Modern replacement for alert())
// ----------------------------------------------------
export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  type?: "info" | "warning" | "danger" | "success";
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "Mengerti",
  type = "info",
}: AlertDialogProps) {
  const iconTypes = {
    info: {
      icon: <Info className="w-8 h-8 text-white stroke-[2.5]" />,
      bg: "bg-[#3355FF]",
      buttonVariant: "primary" as const,
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-[#181818] stroke-[2.5]" />,
      bg: "bg-[#FFD400]",
      buttonVariant: "yellow" as const,
    },
    danger: {
      icon: <AlertCircle className="w-8 h-8 text-white stroke-[2.5]" />,
      bg: "bg-red-500",
      buttonVariant: "danger" as const,
    },
    success: {
      icon: <CheckCircle className="w-8 h-8 text-white stroke-[2.5]" />,
      bg: "bg-green-600",
      buttonVariant: "green" as const,
    },
  };

  const selectedIcon = iconTypes[type] || iconTypes.info;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      showCloseButton={false}
      className="p-1"
    >
      <div className="text-center space-y-4 pt-2">
        <div
          className={cn(
            "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center brutal-border-2 brutal-shadow-sm rotate-2 animate-in zoom-in-50 duration-200",
            selectedIcon.bg
          )}
        >
          {selectedIcon.icon}
        </div>

        <div className="space-y-1.5 px-2">
          <h3 className="text-xl sm:text-2xl font-black font-fredoka text-[#181818] leading-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        <div className="pt-2 border-t-2 border-neutral-200">
          <Button
            type="button"
            variant={selectedIcon.buttonVariant}
            size="md"
            onClick={onClose}
            className="w-full justify-center text-xs font-black shadow-md"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

