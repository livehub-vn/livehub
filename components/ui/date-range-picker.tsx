"use client";

import {
  addDays,
  addMonths,
  differenceInCalendarDays,
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
  Check,
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
  const parseStartDate = (val: string): Date | undefined => {
    if (!val) return undefined;
    if (val.includes(" - ")) {
      const parts = val.split(" - ");
      return parts[0] ? parseISO(parts[0]) : undefined;
    }
    return parseISO(val);
  };

  const parseEndDate = (val: string): Date | undefined => {
    if (!val || !val.includes(" - ")) return undefined;
    const parts = val.split(" - ");
    return parts[1] ? parseISO(parts[1]) : undefined;
  };

  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(() => parseStartDate(value));
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(() => parseEndDate(value));
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>(undefined);

  // Always default to CURRENT MONTH
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));

  // Sync temp dates when popover opens
  useEffect(() => {
    if (isOpen) {
      setTempStartDate(parseStartDate(value));
      setTempEndDate(parseEndDate(value));
      // Always focus on current month when opened
      setCurrentMonth(startOfMonth(new Date()));
    }
  }, [isOpen, value]);

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
      setTempStartDate(day);
      setTempEndDate(undefined);
    } else {
      // Range mode
      if (!tempStartDate || (tempStartDate && tempEndDate)) {
        // Start picking new range
        setTempStartDate(day);
        setTempEndDate(undefined);
      } else if (tempStartDate && !tempEndDate) {
        if (isBefore(day, tempStartDate)) {
          // If clicked day is before start date, make it the new start date
          setTempStartDate(day);
          setTempEndDate(undefined);
        } else {
          // Select end date (DO NOT AUTO-CLOSE - wait for OK confirm)
          setTempEndDate(day);
        }
      }
    }
  };

  const handleConfirm = () => {
    if (mode === "single") {
      if (tempStartDate) {
        onChange(format(tempStartDate, "yyyy-MM-dd"));
      } else {
        onChange("");
      }
    } else {
      if (tempStartDate && tempEndDate) {
        onChange(`${format(tempStartDate, "yyyy-MM-dd")} - ${format(tempEndDate, "yyyy-MM-dd")}`);
      } else if (tempStartDate) {
        onChange(format(tempStartDate, "yyyy-MM-dd"));
      } else {
        onChange("");
      }
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    onChange("");
  };

  const handlePreset = (start: Date, end?: Date) => {
    if (end) {
      setMode("range");
      setTempStartDate(start);
      setTempEndDate(end);
    } else {
      setMode("single");
      setTempStartDate(start);
      setTempEndDate(undefined);
    }
  };

  const weekDayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // Display label on trigger button
  const getDisplayLabel = () => {
    const savedStart = parseStartDate(value);
    const savedEnd = parseEndDate(value);

    if (savedStart && savedEnd) {
      return `${format(savedStart, "dd/MM/yyyy")} - ${format(savedEnd, "dd/MM/yyyy")}`;
    }
    if (savedStart) {
      return format(savedStart, "dd/MM/yyyy (EEEE)", { locale: vi });
    }
    return placeholder;
  };

  // Preview helper in popover
  const getPreviewText = () => {
    if (mode === "single") {
      if (tempStartDate) {
        return format(tempStartDate, "dd/MM/yyyy (EEEE)", { locale: vi });
      }
      return "Chưa chọn ngày";
    }

    if (tempStartDate && tempEndDate) {
      const days = differenceInCalendarDays(tempEndDate, tempStartDate) + 1;
      return `${format(tempStartDate, "dd/MM/yyyy")} → ${format(tempEndDate, "dd/MM/yyyy")} (${days} ngày)`;
    }

    if (tempStartDate) {
      return `Bắt đầu: ${format(tempStartDate, "dd/MM/yyyy")} (Hãy chọn ngày kết thúc)`;
    }

    return "Hãy chọn ngày bắt đầu và ngày kết thúc";
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-2 block text-xs font-semibold text-muted-foreground">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-left text-xs transition-all hover:border-orange-500/50 focus:border-orange-500 focus:outline-none cursor-pointer ${
          value ? "text-foreground font-semibold" : "text-muted-foreground"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isRange ? (
            <CalendarRange className="size-4 text-orange-500 shrink-0" />
          ) : (
            <CalendarIcon className="size-4 text-orange-500 shrink-0" />
          )}
          <span className="truncate">{getDisplayLabel()}</span>
        </div>

        {value ? (
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

      {/* Popover Calendar with OK Confirm Button */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-76 sm:w-88 rounded-2xl border border-border bg-card p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-foreground">
          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 mb-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("single");
                setTempEndDate(undefined);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                mode === "single"
                  ? "bg-background text-orange-500 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarIcon className="size-3.5" />
              <span>1 ngày cụ thể</span>
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

          {/* Month Header Navigation (Default to Current Month) */}
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
                onClick={() => setCurrentMonth(startOfMonth(new Date()))}
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
              const isStart = tempStartDate && isSameDay(day, tempStartDate);
              const isEnd = tempEndDate && isSameDay(day, tempEndDate);
              const isInRange =
                tempStartDate &&
                tempEndDate &&
                isWithinInterval(day, { start: tempStartDate, end: tempEndDate });

              const isHoverRange =
                mode === "range" &&
                tempStartDate &&
                !tempEndDate &&
                hoveredDate &&
                isBefore(tempStartDate, hoveredDate) &&
                isWithinInterval(day, { start: tempStartDate, end: hoveredDate });

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
              } else if (isInRange || isHoverRange) {
                dayClasses = "bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold";
              } else if (isCurrentDay) {
                dayClasses = "border border-orange-500/50 text-orange-500 font-bold";
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onMouseEnter={() => mode === "range" && setHoveredDate(day)}
                  onClick={() => handleSelectDay(day)}
                  className={`flex size-8 sm:size-9 items-center justify-center rounded-xl text-xs font-medium transition-all cursor-pointer ${dayClasses}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-border pt-2 text-[10px] font-semibold text-muted-foreground">
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

          {/* Selection Status & OK Confirm Button Footer */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 bg-muted/20 -mx-4 -mb-4 p-3 rounded-b-2xl">
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider block">
                Đã chọn:
              </span>
              <p className="text-[11px] font-bold text-foreground truncate">
                {getPreviewText()}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!tempStartDate}
                className="inline-flex items-center gap-1 rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Check className="size-3.5" />
                <span>Xác nhận</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
