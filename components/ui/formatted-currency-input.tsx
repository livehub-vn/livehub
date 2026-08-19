"use client";

import React, { useMemo } from "react";

interface FormattedCurrencyInputProps {
  value: string; // Raw numeric string e.g. "5000000"
  onChange: (value: string) => void;
  placeholder?: string;
  presetAmounts?: number[];
  unitSuffix?: string; // e.g. "/ngày" or ""
  required?: boolean;
}

// Convert number to friendly Vietnamese text (e.g. 5000000 -> "5 triệu VNĐ")
function formatVietnameseText(amount: number): string {
  if (isNaN(amount) || amount <= 0) return "";
  if (amount >= 1_000_000_000) {
    const b = amount / 1_000_000_000;
    return `${Number(b.toFixed(2))} tỷ VNĐ`;
  }
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${Number(m.toFixed(2))} triệu VNĐ`;
  }
  if (amount >= 1_000) {
    const k = amount / 1_000;
    return `${Number(k.toFixed(1))} nghìn VNĐ`;
  }
  return `${amount.toLocaleString("vi-VN")} VNĐ`;
}

export function FormattedCurrencyInput({
  value,
  onChange,
  placeholder = "Nhập số tiền...",
  presetAmounts,
  unitSuffix = "",
  required = false,
}: FormattedCurrencyInputProps) {
  const numericVal = parseFloat(value) || 0;

  // Formatted display string e.g. "5.000.000"
  const displayValue = useMemo(() => {
    if (!value) return "";
    const clean = value.replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("vi-VN");
  }, [value]);

  const vietnameseReading = useMemo(() => {
    return formatVietnameseText(numericVal);
  }, [numericVal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    onChange(rawDigits);
  };

  const handleSelectPreset = (amount: number) => {
    onChange(amount.toString());
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-xs focus:border-orange-500 focus:outline-none pr-16 font-semibold"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
          VNĐ{unitSuffix}
        </div>
      </div>

      {/* Realtime Spelled-out Reading & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        {vietnameseReading ? (
          <span className="font-semibold text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-md">
            ≈ {vietnameseReading} {unitSuffix}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Gợi ý mức giá thường dùng:
          </span>
        )}

        {presetAmounts && presetAmounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectPreset(amt)}
                className={`rounded-lg border px-2 py-0.5 text-[10px] font-medium transition-all ${
                  numericVal === amt
                    ? "border-orange-500 bg-orange-500 text-white font-bold"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-orange-500/50 hover:text-foreground"
                }`}
              >
                {formatVietnameseText(amt).replace(" VNĐ", "")}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
