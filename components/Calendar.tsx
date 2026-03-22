"use client";

import { useState } from "react";
import { formatMonthLabel, formatShortWeekday, getMonthGrid, isSameMonth, isToday, parseDateKey } from "@/lib/utils";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CalendarProps {
  month: Date;
  entryDates: string[];
  selectedDate?: string;
  onMonthChange: (month: Date) => void;
  onSelectDate: (dateKey: string) => void;
}

export function Calendar({
  month,
  entryDates,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: CalendarProps) {
  const cells = getMonthGrid(month);
  const entrySet = new Set(entryDates);

  const today = new Date();
  const maxYear = today.getFullYear();
  const maxMonth = today.getMonth();

  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(month.getFullYear());

  return (
    <div className="glass-card p-4">
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-[28px] bg-[color:var(--bg)] p-6"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <button
                type="button"
                className="secondary-button h-8 w-8 p-0 text-base"
                disabled={pickerYear <= 2020}
                onClick={() => setPickerYear((y) => y - 1)}
              >
                ‹
              </button>
              <span className="font-display text-[22px] text-[color:var(--text-primary)]">{pickerYear}</span>
              <button
                type="button"
                className="secondary-button h-8 w-8 p-0 text-base"
                disabled={pickerYear >= maxYear}
                onClick={() => setPickerYear((y) => y + 1)}
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MONTHS_SHORT.map((name, i) => {
                const isFuture = pickerYear > maxYear || (pickerYear === maxYear && i > maxMonth);
                const isActive = pickerYear === month.getFullYear() && i === month.getMonth();
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={isFuture}
                    className={`rounded-[14px] py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-lavender text-white"
                        : isFuture
                          ? "text-[color:var(--text-tertiary)] opacity-40"
                          : "bg-white/55 text-[color:var(--text-secondary)]"
                    }`}
                    onClick={() => {
                      onMonthChange(new Date(pickerYear, i, 1, 12));
                      setShowPicker(false);
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-1"
          onClick={() => { setPickerYear(month.getFullYear()); setShowPicker(true); }}
        >
          <h2 className="font-display text-[26px] text-[color:var(--text-primary)]">
            {formatMonthLabel(month)}
          </h2>
          <span className="text-[11px] text-[color:var(--text-tertiary)]">▾</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            className="secondary-button h-10 w-10 p-0"
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next month"
            className="secondary-button h-10 w-10 p-0"
            disabled={month.getFullYear() === maxYear && month.getMonth() === maxMonth}
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-2 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="pb-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
            {day[0]}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center">
        {cells.map((dateKey, index) => {
          if (!dateKey) {
            return (
              <span key={`empty-${index}`} className="calendar-day empty" aria-hidden="true">
                0
              </span>
            );
          }

          const classes = ["calendar-day"];
          if (entrySet.has(dateKey)) {
            classes.push("hasEntry");
          }
          if (isToday(dateKey)) {
            classes.push("today");
          } else if (selectedDate === dateKey) {
            classes.push("selected");
          }

          return (
            <button
              type="button"
              key={dateKey}
              className={classes.join(" ")}
              aria-label={`${formatShortWeekday(dateKey)} ${parseDateKey(dateKey).getDate()}`}
              onClick={() => onSelectDate(dateKey)}
            >
              <span className={isSameMonth(dateKey, month) ? "" : "opacity-45"}>
                {parseDateKey(dateKey).getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

