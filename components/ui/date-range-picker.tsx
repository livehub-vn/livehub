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
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface DateRangePickerProps {
  value?: string; // e.g. "2026-08-25" or "2026-08-25 - 2026-08-28"
  onChange: (dateStr: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  label?: string;
  required?: boolean;
}

export function DateRangePicker({
  value = "",
  onChange,
  placeholder = "Chọn ngày hoặc khoảng thời gian...",
  minDate = startOfDay(new Date()),
  maxDate,
  className = "",
  label,
  required = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isRange = value.includes(" - ");
  const [mode, setMode] = useState<"single" | "range">(isRange ? "range" : "single");

  // Parse state dates
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    if (!value) return undefined;
    if (value.includes(" - ")) {
      const parts = value.split(" - ");
      return parts[0] ? parseISO(parts[0]) : undefined;
    }
    return parseISO(value);
  });

  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    if (!value || !value.includes(" - ")) return undefined;
    const parts = value.split(" - ");
    return parts[1] ? parseISO(parts[1]) : undefined;
  });

  const [currentMonth, setCurrentMonth] = useState<Date>(
    startDate || new Date()
  );

  // Close popover when clicking outside
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

  // Calculate day offset for Monday start
  const startDay = (startOfMonth(currentMonth).getDay() + 6) % 7;

  const handleSelectDay = (day: Date) => {
    if (mode === "single") {
      setStartDate(day);
      setEndDate(undefined);
      const formatted = format(day, "yyyy-MM-dd");
      onChange(formatted);
      setIsOpen(false);
    } else {
      // Range mode
      if (!startDate || (startDate && endDate)) {
        // Start new range selection
        setStartDate(day);
        setEndDate(undefined);
      } else if (startDate && !endDate) {
        if (isBefore(day, startDate)) {
          // If clicked before start, make it new start
          setStartDate(day);
          setEndDate(undefined);
        } else {
          // Complete the range
          setEndDate(day);
          const startStr = format(startDate, "yyyy-MM-dd");
          const endStr = format(day, "yyyy-MM-dd");
          onChange(`${startStr} - ${endStr}`);
          setIsOpen(false);
        }
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStartDate(undefined);
    setEndDate(undefined);
    onChange("");
  };

  const handlePreset = (start: Date, end?: Date) => {
    if (end) {
      setMode("range");
      setStartDate(start);
      setEndDate(end);
      onChange(`${format(start, "yyyy-MM-dd")} - ${format(end, "yyyy-MM-dd")}`);
    } else {
      setMode("single");
      setStartDate(start);
      setEndDate(undefined);
      onChange(format(start, "yyyy-MM-dd"));
    }
    setIsOpen(false);
  };

  const weekDayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // Format trigger label text
  const getDisplayLabel = () => {
    if (startDate && endDate) {
      return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
    }
    if (startDate) {
      return format(startDate, "dd/MM/yyyy (EEEE)", { locale: vi });
    }
    return placeholder;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-2 block text-xs font-semibold text-muted-foreground">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button (shadcn popover trigger) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-xs transition-all hover:border-orange-500/50 focus:border-orange-500 focus:outline-none cursor-pointer ${
          startDate ? "text-foreground font-semibold" : "text-muted-foreground"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {mode === "range" ? (
            <CalendarRange className="size-4 text-orange-500 shrink-0" />
          ) : (
            <CalendarIcon className="size-4 text-orange-500 shrink-0" />
          )}
          <span className="truncate">{getDisplayLabel()}</span>
        </div>

        {startDate ? (
          <span
            onClick={handleClear}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            title="Xóa ngày"
          >
            <X className="size-3.5" />
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
            Chọn lịch
          </span>
        )}
      </button>

      {/* Calendar Popover Dialog */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 sm:w-84 rounded-2xl border border-border bg-card p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-foreground">
          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 mb-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("single");
                setEndDate(undefined);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === "single"
                  ? "bg-background text-orange-500 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="size-3.5" />
              <span>1 ngày</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("range")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === "range"
                  ? "bg-background text-orange-500 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarRange className="size-3.5" />
              <span>Khoảng ngày</span>
            </button>
          </div>

          {/* Month Header Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-xs font-bold capitalize text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: vi })}
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date())}
                className="flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                title="Về tháng hiện tại"
              >
                <RotateCcw className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 py-1.5 text-center text-[10px] font-bold text-muted-foreground">
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
              <div key={`blank-${i}`} className="p-1.5" />
            ))}

            {/* Days in Month */}
            {daysInMonth.map((day, i) => {
              const isStart = startDate && isSameDay(day, startDate);
              const isEnd = endDate && isSameDay(day, endDate);
              const isInRange =
                startDate &&
                endDate &&
                isWithinInterval(day, { start: startDate, end: endDate });

              const isCurrentDay = isToday(day);
              const isDisabled =
                (minDate && isBefore(day, minDate) && !isSameDay(day, minDate)) ||
                (maxDate && isBefore(maxDate, day));

              let dayClasses = "text-foreground hover:bg-muted hover:text-orange-500";

              if (isDisabled) {
                dayClasses = "text-muted-foreground/30 cursor-not-allowed";
              } else if (isStart || isEnd) {
                dayClasses =
                  "bg-orange-500 text-white font-bold shadow-md shadow-orange-500/30 scale-105";
              } else if (isInRange) {
                dayClasses = "bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold";
              } else if (isCurrentDay) {
                dayClasses = "border border-orange-500/50 text-orange-500 font-bold";
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`flex size-8 sm:size-8.5 items-center justify-center rounded-xl text-xs font-medium transition-all cursor-pointer ${dayClasses}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Preset Shortcuts Footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-border pt-2.5 text-[10px] font-semibold text-muted-foreground">
            <button
              type="button"
              onClick={() => handlePreset(new Date())}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => handlePreset(addDays(new Date(), 1))}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              Ngày mai
            </button>
            <button
              type="button"
              onClick={() => handlePreset(new Date(), addDays(new Date(), 2))}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              3 ngày tới
            </button>
            <button
              type="button"
              onClick={() => handlePreset(new Date(), addDays(new Date(), 6))}
              className="hover:text-orange-500 transition-colors cursor-pointer"
            >
              7 ngày tới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
