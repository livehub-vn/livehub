"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";

export interface BookedDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: "approved" | "pending" | "in_progress" | "completed";
  customerName?: string;
}

interface ServiceBookingCalendarProps {
  pricePerDay: number;
  bookedRanges?: BookedDateRange[];
  onDateRangeChange: (start: string | null, end: string | null, totalDays: number) => void;
}

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function parseDateStr(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isPast: boolean;
  bookedStatus: string | null;
  bookedLabel: string | null;
}

export function ServiceBookingCalendar({
  pricePerDay,
  bookedRanges = [],
  onDateRangeChange,
}: ServiceBookingCalendarProps) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Convert booked ranges into daily lookup
  const bookedDaysMap = useMemo(() => {
    const map = new Map<string, { status: string; label: string }>();

    bookedRanges.forEach((range) => {
      try {
        const start = parseDateStr(range.startDate);
        const end = parseDateStr(range.endDate);
        const cur = new Date(start);

        const isConfirmed = range.status === "approved" || range.status === "in_progress" || range.status === "completed";
        const label = isConfirmed ? "Đã có khách thuê" : "Đang chờ duyệt";
        const statusKey = isConfirmed ? "confirmed" : "pending";

        while (cur <= end) {
          map.set(formatDateStr(cur), { status: statusKey, label });
          cur.setDate(cur.getDate() + 1);
        }
      } catch {
        // ignore malformed date
      }
    });

    return map;
  }, [bookedRanges]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      const str = formatDateStr(d);
      const booked = bookedDaysMap.get(str);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: false,
        isPast: d < today,
        bookedStatus: booked?.status || null,
        bookedLabel: booked?.label || null,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const str = formatDateStr(d);
      const booked = bookedDaysMap.get(str);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: true,
        isPast: d < today,
        bookedStatus: booked?.status || null,
        bookedLabel: booked?.label || null,
      });
    }

    // Next month padding to fill 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const str = formatDateStr(d);
      const booked = bookedDaysMap.get(str);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: false,
        isPast: false,
        bookedStatus: booked?.status || null,
        bookedLabel: booked?.label || null,
      });
    }

    return days;
  }, [currentMonth, today, bookedDaysMap]);

  // Handle day click for range selection
  const handleDayClick = (d: Date, isBooked: boolean, isPast: boolean) => {
    if (isBooked || isPast) return;

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // First click: reset and pick start
      setSelectedStart(d);
      setSelectedEnd(null);
      onDateRangeChange(formatDateStr(d), null, 1);
    } else if (selectedStart && !selectedEnd) {
      // Second click
      if (d < selectedStart) {
        // Clicked before start: make it the new start
        setSelectedStart(d);
        onDateRangeChange(formatDateStr(d), null, 1);
      } else {
        // Check if there are any booked days between start and this day
        let cur = new Date(selectedStart);
        let hasConflict = false;
        while (cur <= d) {
          if (bookedDaysMap.has(formatDateStr(cur))) {
            hasConflict = true;
            break;
          }
          cur.setDate(cur.getDate() + 1);
        }

        if (hasConflict) {
          // Conflict found: reset to this day
          setSelectedStart(d);
          setSelectedEnd(null);
          onDateRangeChange(formatDateStr(d), null, 1);
        } else {
          setSelectedEnd(d);
          const diffDays = Math.ceil((d.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          onDateRangeChange(formatDateStr(selectedStart), formatDateStr(d), diffDays);
        }
      }
    }
  };

  const selectedDaysCount = useMemo(() => {
    if (!selectedStart) return 0;
    if (!selectedEnd) return 1;
    return Math.ceil((selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [selectedStart, selectedEnd]);

  const subtotal = selectedDaysCount * pricePerDay;
  const deposit = Math.round(subtotal * 0.3);

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm text-foreground">
      {/* Calendar Header with Month Navigation */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-4 text-orange-500" />
          <h4 className="text-sm font-bold text-foreground capitalize">
            {currentMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors"
            title="Tháng trước"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors"
            title="Tháng sau"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-muted-foreground">
        {DAYS_OF_WEEK.map((dw) => (
          <div key={dw} className="py-1">
            {dw}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {calendarDays.map((cell, idx) => {
          const isSelectedStart = selectedStart && isSameDay(cell.date, selectedStart);
          const isSelectedEnd = selectedEnd && isSameDay(cell.date, selectedEnd);
          const isRangeMiddle =
            selectedStart &&
            selectedEnd &&
            cell.date > selectedStart &&
            cell.date < selectedEnd;
          const isHoverPreview =
            selectedStart &&
            !selectedEnd &&
            hoverDate &&
            cell.date > selectedStart &&
            cell.date <= hoverDate &&
            !cell.bookedStatus;

          const isBookedConfirmed = cell.bookedStatus === "confirmed";
          const isBookedPending = cell.bookedStatus === "pending";
          const isUnavailable = cell.isPast || isBookedConfirmed || isBookedPending;

          let cellBg = "bg-transparent hover:bg-muted/60 text-foreground";

          if (cell.isPast) {
            cellBg = "text-muted-foreground/30 pointer-events-none";
          } else if (isBookedConfirmed) {
            cellBg = "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/25 line-through pointer-events-none cursor-not-allowed";
          } else if (isBookedPending) {
            cellBg = "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/25 pointer-events-none cursor-not-allowed";
          } else if (isSelectedStart || isSelectedEnd) {
            cellBg = "bg-orange-500 text-white font-bold shadow-md scale-105 z-10";
          } else if (isRangeMiddle) {
            cellBg = "bg-orange-500/20 text-orange-600 dark:text-orange-300 font-semibold";
          } else if (isHoverPreview) {
            cellBg = "bg-orange-500/10 text-orange-500";
          } else if (!cell.isCurrentMonth) {
            cellBg = "text-muted-foreground/40";
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isUnavailable}
              onClick={() => handleDayClick(cell.date, !!cell.bookedStatus, cell.isPast)}
              onMouseEnter={() => setHoverDate(cell.date)}
              onMouseLeave={() => setHoverDate(null)}
              className={`group relative flex h-9 w-full flex-col items-center justify-center rounded-xl text-xs transition-all ${cellBg}`}
              title={cell.bookedLabel || (cell.isPast ? "Đã qua" : "Ngày trống")}
            >
              <span>{cell.date.getDate()}</span>

              {/* Status dot indicator */}
              {isBookedConfirmed && (
                <span className="absolute bottom-1 size-1 rounded-full bg-rose-500" />
              )}
              {isBookedPending && (
                <span className="absolute bottom-1 size-1 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Visual Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-[10px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-orange-500" />
          <span>Ngày bạn chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-rose-500/80" />
          <span>Đã có khách thuê</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500/80" />
          <span>Đang chờ duyệt</span>
        </div>
      </div>

      {/* Selected Range Summary Box */}
      {selectedStart && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Khoảng thời gian:</span>
            <span className="font-bold text-foreground">
              {selectedStart.toLocaleDateString("vi-VN")}
              {selectedEnd ? ` ➔ ${selectedEnd.toLocaleDateString("vi-VN")}` : " (1 ngày)"}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-orange-500/20 pt-2">
            <span className="text-muted-foreground font-medium">Tổng thời gian thuê:</span>
            <span className="font-bold text-orange-600">{selectedDaysCount} ngày</span>
          </div>

          <div className="flex items-center justify-between text-sm font-bold border-t border-orange-500/20 pt-2">
            <span>Tổng chi phí:</span>
            <span className="text-orange-600">{subtotal.toLocaleString("vi-VN")} đ</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Tiền cọc giữ lịch 30%:</span>
            <span className="font-semibold text-foreground">{deposit.toLocaleString("vi-VN")} đ</span>
          </div>
        </div>
      )}
    </div>
  );
}
