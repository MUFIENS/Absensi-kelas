import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = "text", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label className="block text-sm font-extrabold text-[#181818] tracking-wide">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "w-full px-4 py-3 bg-white text-[#181818] placeholder:text-neutral-400 font-bold rounded-2xl brutal-border brutal-shadow-sm focus:outline-none focus:brutal-shadow focus:bg-amber-50/40 transition-all text-base disabled:bg-neutral-100 disabled:cursor-not-allowed",
            error && "border-red-500 bg-red-50 focus:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg border border-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs font-semibold text-neutral-600 pl-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
>(({ className, label, children, ...props }, ref) => {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block text-sm font-extrabold text-[#181818] tracking-wide">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full px-4 py-3 bg-white text-[#181818] font-bold rounded-2xl brutal-border brutal-shadow-sm focus:outline-none focus:brutal-shadow cursor-pointer transition-all text-base",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

Select.displayName = "Select";
