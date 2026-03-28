"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButterflyHero } from "@/components/ButterflyHero";
import { Calendar } from "@/components/Calendar";
import { TabBar } from "@/components/TabBar";
import type { Entry, Settings } from "@/lib/types";
import { exportData, getAllEntries, getSettings, recordExport } from "@/lib/storage";
import { formatHomeDate, getGreeting, getMonthId, getWeekId, parseDateKey, todayKey } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const currentDate = todayKey();
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [settings, setSettings] = useState<Settings | null>(null);
  const [month, setMonth] = useState(() => parseDateKey(currentDate));
  const [showBackupBanner, setShowBackupBanner] = useState(false);

  useEffect(() => {
    const load = () => {
      const allEntries = getAllEntries();
      const s = getSettings();
      setEntries(allEntries);
      setSettings(s);

      const entryList = Object.values(allEntries);
      const hasEntries = entryList.length > 0;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (hasEntries) {
        // Use last export time if available, otherwise use the oldest entry's creation date
        const reference = s.lastExportedAt
          ? new Date(s.lastExportedAt).getTime()
          : Math.min(...entryList.map((e) => new Date(e.createdAt).getTime()));
        if (Date.now() - reference > sevenDays) {
          setShowBackupBanner(true);
        }
      }
    };

    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  const handleBackupExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chrysalis-${currentDate}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    recordExport();
    setShowBackupBanner(false);
  };

  const todayEntry = entries[currentDate];
  const allTodos = (todayEntry?.todos ?? []).filter((todo) => todo.text.trim().length > 0);
  const previewTodos = allTodos.slice(0, 4);
  const remainingTodos = allTodos.length - previewTodos.length;

  return (
    <main className="app-shell">
      <div className="page-stack">
        <section className="pt-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
            {formatHomeDate(currentDate)}
          </p>
          <h1 className="mt-3 font-display text-[44px] leading-none text-[color:var(--text-primary)]">
            {getGreeting()}
            {settings?.userName?.trim() ? (
              <>, <em className="text-lavender">{settings.userName.trim()}</em></>
            ) : null}
          </h1>
          <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[color:var(--text-secondary)]">
            Each reflection becomes a trace of movement. Keep the rhythm soft, precise, and honest.
          </p>
        </section>

        <ButterflyHero />

        {showBackupBanner && (
          <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[color:var(--border)] bg-misty-blue-light px-4 py-3">
            <p className="text-sm text-[color:var(--text-secondary)]">
              It&apos;s been a week since your last backup. Export now?
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="soft-button py-2 text-xs"
                onClick={handleBackupExport}
              >
                Export
              </button>
              <button
                type="button"
                className="text-xs text-[color:var(--text-tertiary)]"
                onClick={() => setShowBackupBanner(false)}
              >
                Later
              </button>
            </div>
          </div>
        )}

        <section className="glass-card flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-lavender-ultra text-lavender">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div>
            <p className="section-label mb-1">Writing streak</p>
            <p className="font-display text-[30px] text-[color:var(--text-primary)]">
              {settings?.streakCurrent ?? 0} {settings?.streakCurrent === 1 ? "day" : "days"}
            </p>
            <p className="text-sm text-[color:var(--text-tertiary)]">
              longest: {settings?.streakLongest ?? 0} {settings?.streakLongest === 1 ? "day" : "days"}
            </p>
          </div>
        </section>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Link href={`/entry/${currentDate}`} className="soft-button whitespace-nowrap">
            Today
          </Link>
          <Link href={`/summary/week/${getWeekId(currentDate)}`} className="secondary-button whitespace-nowrap">
            Week summary
          </Link>
          <Link href={`/summary/month/${getMonthId(currentDate)}`} className="secondary-button whitespace-nowrap">
            Month summary
          </Link>
          <Link href="/entries" className="secondary-button whitespace-nowrap">
            All entries
          </Link>
        </div>

        <section id="calendar">
          <p className="section-label">Calendar</p>
          <Calendar
            month={month}
            entryDates={Object.keys(entries)}
            selectedDate={currentDate}
            onMonthChange={setMonth}
            onSelectDate={(dateKey) => router.push(`/entry/${dateKey}`)}
          />
        </section>

        <section>
          <p className="section-label">Today&apos;s reflection</p>
          <Link href={`/entry/${currentDate}`} className="glass-card block p-5">
            <p className="whitespace-pre-wrap font-display text-[20px] leading-8 italic text-[color:var(--text-primary)]">
              {todayEntry?.summary?.trim() ? todayEntry.summary : "Your reflection will appear here."}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[color:var(--text-tertiary)]">
              <span className="h-2 w-2 rounded-full bg-pale-rose" />
              {todayEntry?.summary?.trim() ? "Return to the page" : "Begin today's reflection"}
            </div>
          </Link>
        </section>

        <section>
          <p className="section-label">Today&apos;s to-do</p>
          <div className="glass-card p-4">
            {previewTodos.length ? (
              <div className="space-y-3">
                {previewTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 border-b border-[color:var(--border)] pb-3 text-sm ${
                      todo.status === "done" || todo.status === "skipped" ? "text-[color:var(--text-tertiary)] line-through" : "text-[color:var(--text-secondary)]"
                    } last:border-b-0 last:pb-0`}
                  >
                    <span className={`todo-circle ${todo.status === "done" ? "done" : todo.status === "partial" ? "partial" : todo.status === "skipped" ? "skipped" : ""}`}>
                      {todo.status === "done" ? "✓" : todo.status === "partial" ? "—" : todo.status === "skipped" ? "✕" : ""}
                    </span>
                    <span>{todo.text}</span>
                  </div>
                ))}
                {remainingTodos > 0 && (
                  <p className="pt-1 text-center text-xs text-[color:var(--text-tertiary)]">
                    +{remainingTodos} more — open today&apos;s entry to see all
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-[18px] bg-lavender-ultra px-4 py-5 text-sm leading-6 text-[color:var(--text-secondary)]">
                Nothing to track yet — open today&apos;s entry to add tasks.
              </div>
            )}
          </div>
        </section>
      </div>

      <TabBar />
    </main>
  );
}

