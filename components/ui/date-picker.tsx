"use client";

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface DatePickerProps {
  value?: string; // ISO string format: YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  label?: string;
  required?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày...",
  minDate = startOfDay(new Date()),
  maxDate,
  className = "",
  label,
  required = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : undefined;
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Calculate day offset for starting day of the week (Monday start)
  const startDay = (startOfMonth(currentMonth).getDay() + 6) % 7; // 0 = Monday, 6 = Sunday

  const handleSelectDay = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const weekDayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-2 block text-xs font-semibold text-muted-foreground">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button (shadcn button input) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-sm transition-all focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none ${
          selectedDate ? "text-foreground font-medium" : "text-muted-foreground"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="size-4 text-orange-500 shrink-0" />
          <span>
            {selectedDate
              ? format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: vi })
              : placeholder}
          </span>
        </div>

        {selectedDate ? (
          <span
            onClick={handleClear}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Xóa ngày đã chọn"
          >
            <X className="size-3.5" />
          </span>
        ) : (
          <ChevronRight className="size-4 text-muted-foreground/60 transition-transform duration-200 group-hover:translate-x-0.5" />
        )}
      </button>

      {/* Popover Calendar (shadcn styled) */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header Month Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h4 className="text-sm font-semibold capitalize text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: vi })}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date())}
                className="flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Về tháng hiện tại"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Weekday Grid */}
          <div className="grid grid-cols-7 gap-1 py-2 text-center text-[11px] font-semibold text-muted-foreground">
            {weekDayLabels.map((wd, i) => (
              <div key={i} className="py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Blank leading days */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`blank-${i}`} className="p-2" />
            ))}

            {/* Days in Month */}
            {daysInMonth.map((day, i) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);
              const isDisabled =
                (minDate && isBefore(day, minDate) && !isSameDay(day, minDate)) ||
                (maxDate && isBefore(maxDate, day));

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`flex size-8 sm:size-9 items-center justify-center rounded-xl font-medium transition-all ${
                    isSelected
                      ? "bg-accent font-bold text-white shadow-md shadow-orange-500/30 scale-105"
                      : isCurrentDay
                      ? "border border-accent text-accent font-semibold"
                      : isDisabled
                      ? "text-muted-foreground/30 cursor-not-allowed"
                      : "text-foreground hover:bg-muted hover:text-accent"
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px]">
            <button
              type="button"
              onClick={() => handleSelectDay(new Date())}
              className="font-medium text-muted-foreground hover:text-accent"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => handleSelectDay(addDays(new Date(), 1))}
              className="font-medium text-muted-foreground hover:text-accent"
            >
              Ngày mai
            </button>
            <button
              type="button"
              onClick={() => handleSelectDay(addDays(new Date(), 7))}
              className="font-medium text-muted-foreground hover:text-accent"
            >
              Tuần tới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
