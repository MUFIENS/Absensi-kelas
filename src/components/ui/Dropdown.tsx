"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownOption<T = string | number> {
  value: T;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownProps<T = string | number> {
  options: DropdownOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  variant?: "white" | "yellow" | "blue" | "pink" | "neutral";
  size?: "sm" | "md" | "lg";
  direction?: "down" | "up";
  align?: "left" | "right";
  name?: string;
  id?: string;
  required?: boolean;
}

export function Dropdown<T = string | number>({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  label,
  error,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Cari opsi...",
  className,
  triggerClassName,
  menuClassName,
  variant = "white",
  size = "md",
  direction = "down",
  align = "left",
  id,
  required = false,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uniqueId = useId();
  const dropdownId = id || uniqueId;

  // Selected Option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filtered Options for Search
  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  // Close on Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus Search on Open
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (isOpen) {
      const idx = filteredOptions.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery("");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const currentOpt = filteredOptions[highlightedIndex];
      if (currentOpt && !currentOpt.disabled) {
        onChange?.(currentOpt.value);
        setIsOpen(false);
        setSearchQuery("");
      }
    }
  };

  const handleSelect = (opt: DropdownOption<T>) => {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl",
    lg: "px-4 py-3 text-sm sm:text-base rounded-2xl",
  };

  // Variant styles
  const variantStyles = {
    white: "bg-white text-[#181818] border-2 border-[#181818] hover:bg-neutral-50",
    yellow: "bg-[#FFD400] text-[#181818] border-2 border-[#181818] hover:bg-[#ffe033]",
    blue: "bg-[#3355FF] text-white border-2 border-[#181818] hover:bg-[#2546eb]",
    pink: "bg-[#FF6FA5] text-[#181818] border-2 border-[#181818] hover:bg-[#ff85b3]",
    neutral: "bg-neutral-100 text-[#181818] border-2 border-neutral-300 hover:bg-neutral-200",
  };

  return (
    <div className={cn("relative inline-block w-full text-left", className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={dropdownId}
          className="block text-xs font-black uppercase tracking-wider text-[#181818] mb-1.5"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={dropdownId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "w-full flex items-center justify-between gap-2 font-black transition-all brutal-shadow-sm select-none",
          "focus:outline-hidden focus:ring-3 focus:ring-[#3355FF]/40",
          sizeStyles[size],
          variantStyles[variant],
          isOpen && "ring-2 ring-[#181818] translate-x-[1px] translate-y-[1px] brutal-shadow-none",
          disabled && "opacity-50 cursor-not-allowed bg-neutral-200 border-neutral-400 text-neutral-500",
          error && "border-red-500 ring-2 ring-red-300",
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedOption?.icon && (
            <span className="shrink-0 text-current">{selectedOption.icon}</span>
          )}
          <span className={cn("truncate", !selectedOption && "text-neutral-500 font-bold")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Animated Directional Chevron */}
        <div className="shrink-0 ml-1 flex items-center justify-center">
          <ChevronDown
            className={cn(
              "w-4 h-4 text-current transition-transform duration-200 ease-out stroke-[2.5]",
              isOpen && (direction === "down" ? "rotate-180" : "-rotate-180")
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu Container */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full min-w-full sm:min-w-[150px] bg-white rounded-2xl brutal-border-2 brutal-shadow-lg overflow-hidden",
            "animate-in fade-in zoom-in-95 duration-150",
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            direction === "down" ? "top-full mt-1.5" : "bottom-full mb-1.5 origin-bottom",
            menuClassName
          )}
        >
          {/* Optional Search Box */}
          {searchable && (
            <div className="p-2 border-b-2 border-neutral-200 bg-neutral-50">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 bg-white rounded-xl text-xs font-bold border border-neutral-300 focus:outline-hidden focus:border-[#3355FF]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-neutral-400 hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto p-1.5 space-y-1 focus:outline-hidden select-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs font-bold text-neutral-400">
                Tidak ada opsi ditemukan
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors cursor-pointer",
                      isSelected && "bg-[#FFD400] text-[#181818] brutal-border-2",
                      !isSelected && isHighlighted && "bg-neutral-100 text-[#181818]",
                      !isSelected && !isHighlighted && "text-neutral-700 hover:bg-neutral-50",
                      opt.disabled && "opacity-40 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <p className="truncate leading-tight">{opt.label}</p>
                        {opt.subLabel && (
                          <p className="text-[10px] font-bold text-neutral-500 truncate leading-none mt-0.5">
                            {opt.subLabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 shrink-0 text-[#181818] stroke-[3]" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-1 text-xs font-bold text-red-500">{error}</p>}
    </div>
  );
}
