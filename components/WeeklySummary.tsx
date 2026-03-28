"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AiProvider, Entry, SummaryRecord, SummaryType } from "@/lib/types";
import { requestSummary } from "@/lib/ai";
import { getEntriesForRange, getSettings, getSummary, saveSummary } from "@/lib/storage";
import { createEmptyInsights, getAdjacentMonthId, getAdjacentWeekId, getMonthDatesFromId, getMonthRangeLabel, getMoodEmoji, getMoodLabel, getWeekDatesFromId, getWeekRangeLabel, startOfWeek, summarizePeriodStats, todayKey, getWeekId, getMonthId } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function highlightSummary(content: string, keywords: string[]) {
  if (!keywords.length) {
    return content;
  }

  const escaped = keywords
    .filter((keyword) => keyword.trim().length > 0)
    .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) {
    return content;
  }

  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = content.split(regex);

  return parts.map((part, index) => {
    const matched = keywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase());
    if (!matched) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <span
        key={`${part}-${index}`}
        className="rounded-md bg-[rgba(196,181,224,0.24)] px-1.5 py-0.5"
      >
        {part}
      </span>
    );
  });
}

function buildEntriesPayload(entries: Entry[]) {
  return entries
    .map((entry) => {
      const todos = entry.todos.length
        ? entry.todos.map((todo) => `[${todo.status === "done" ? "x" : todo.status === "partial" ? "~" : todo.status === "skipped" ? "-" : " "}] ${todo.text}${todo.note ? ` (${todo.note})` : ""}`).join("; ")
        : "No todos";

      return [
        `Date: ${entry.date}`,
        `Summary: ${entry.summary || "None"}`,
        `Reflection: ${entry.reflection || "None"}`,
        `Mood: ${entry.mood ?? "None"}`,
        `Tags: ${entry.tags.join(", ") || "None"}`,
        `Todos: ${todos}`,
      ].join("\n");
    })
    .join("\n\n");
}

function createSummaryTitle(type: SummaryType) {
  return type === "week" ? "Weekly summary" : "Monthly summary";
}

export function WeeklySummary({ id, type }: { id: string; type: SummaryType }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [record, setRecord] = useState<SummaryRecord | null>(null);
  const [manualSummary, setManualSummary] = useState("");
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedApiKey, setSavedApiKey] = useState("");
  const [savedProvider, setSavedProvider] = useState<AiProvider>("deepseek");
  const [manualSaved, setManualSaved] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => parseInt(id.slice(0, 4), 10));

  const today = todayKey();
  const todayParsed = new Date(`${today}T12:00:00`);
  const currentYear = todayParsed.getFullYear();
  const currentMonth = todayParsed.getMonth(); // 0-indexed
  const currentId = type === "week" ? getWeekId(today) : getMonthId(today);
  const isCurrentPeriod = id === currentId;

  const prevId = type === "week" ? getAdjacentWeekId(id, -1) : getAdjacentMonthId(id, -1);
  const nextId = type === "week" ? getAdjacentWeekId(id, 1) : getAdjacentMonthId(id, 1);
  const nextPath = type === "week" ? `/summary/week/${nextId}` : `/summary/month/${nextId}`;
  const prevPath = type === "week" ? `/summary/week/${prevId}` : `/summary/month/${prevId}`;

  const dates = type === "week" ? getWeekDatesFromId(id) : getMonthDatesFromId(id);
  const rangeStart = dates[0];
  const rangeEnd = dates[dates.length - 1];

  useEffect(() => {
    const nextEntries = getEntriesForRange(rangeStart, rangeEnd);
    const existing = getSummary(id);
    const settings = getSettings();
    setEntries(nextEntries);
    setRecord(existing);
    setManualSummary(existing?.manualContent ?? (existing && !existing.aiGenerated ? existing.content : ""));
    setMode(existing?.aiGenerated ? "ai" : "manual");
    setSavedProvider(settings.aiProvider);
    const keyMap = {
      deepseek: settings.deepseekApiKey,
      openai: settings.openaiApiKey,
      anthropic: settings.anthropicApiKey,
    };
    setSavedApiKey(keyMap[settings.aiProvider]);
    setError(null);
    setShowPicker(false);
    setPickerYear(parseInt(id.slice(0, 4), 10));
  }, [id, rangeEnd, rangeStart]);

  const stats = summarizePeriodStats(entries);
  const missingDays = dates.length - entries.length;
  const insights = createEmptyInsights(entries, missingDays, stats.topMood);
  const entryMap = entries.reduce<Record<string, Entry>>((acc, entry) => {
    acc[entry.date] = entry;
    return acc;
  }, {});
  type ChartBar = { key: string; label: string; wordCount: number };
  const chartBars: ChartBar[] = type === "week"
    ? dates.map((dateKey) => ({
        key: dateKey,
        label: new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
        wordCount: entryMap[dateKey]?.wordCount ?? 0,
      }))
    : (() => {
        // Group by actual calendar week (Mon–Sun boundary)
        const weekMap = new Map<string, string[]>();
        for (const dateKey of dates) {
          const weekStart = startOfWeek(dateKey);
          if (!weekMap.has(weekStart)) weekMap.set(weekStart, []);
          weekMap.get(weekStart)!.push(dateKey);
        }
        return Array.from(weekMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([weekStart, chunk]) => {
            const firstDay = parseInt(chunk[0].slice(-2), 10);
            const lastDay = parseInt(chunk[chunk.length - 1].slice(-2), 10);
            const label = firstDay === lastDay ? `${firstDay}` : `${firstDay}–${lastDay}`;
            const total = chunk.reduce((sum, d) => sum + (entryMap[d]?.wordCount ?? 0), 0);
            return { key: weekStart, label, wordCount: total };
          });
      })();
  const chartMax = Math.max(...chartBars.map((b) => b.wordCount), 1);
  const heading = createSummaryTitle(type);

  const currentKeywords = record?.keywords ?? [];
  const displayContent = mode === "manual" ? manualSummary : (record?.aiGenerated ? record.content : "") ?? "";

  const persistManualSummary = () => {
    const saved = saveSummary({
      type,
      period: id,
      content: manualSummary,
      aiGenerated: false,
      keywords: record?.keywords ?? [],
      stats,
      createdAt: record?.createdAt ?? new Date().toISOString(),
      manualContent: manualSummary,
    });
    setRecord(saved);
    setMode("manual");
    setManualSaved(true);
    setTimeout(() => setManualSaved(false), 2000);
  };

  const handleGenerateSummary = async () => {
    if (!entries.length) return;

    setLoading(true);
    setError(null);

    try {
      const response = await requestSummary(buildEntriesPayload(entries), type, savedApiKey, savedProvider);
      const saved = saveSummary({
        type,
        period: id,
        content: response.summary,
        aiGenerated: true,
        keywords: response.keywords,
        stats,
        createdAt: record?.createdAt ?? new Date().toISOString(),
        manualContent: manualSummary,
      });
      setRecord(saved);
      setMode("ai");
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 2000);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something interrupted the summary. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
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
            <div className="mb-4 flex items-center justify-between">
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
                disabled={pickerYear >= currentYear}
                onClick={() => setPickerYear((y) => y + 1)}
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MONTHS.map((name, i) => {
                const isFuture = pickerYear > currentYear || (pickerYear === currentYear && i > currentMonth);
                const monthKey = `${pickerYear}-${String(i + 1).padStart(2, "0")}`;
                const isActive = type === "month"
                  ? id === monthKey
                  : rangeStart.slice(0, 7) === monthKey;

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
                      const firstDay = `${pickerYear}-${String(i + 1).padStart(2, "0")}-01`;
                      if (type === "month") {
                        router.push(`/summary/month/${monthKey}`);
                      } else {
                        router.push(`/summary/week/${getWeekId(firstDay)}`);
                      }
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

      <header className="flex items-start justify-between gap-4">
        <button
          type="button"
          className="secondary-button h-11 w-11 shrink-0 p-0 text-lg"
          aria-label="Go back"
          onClick={() => router.back()}
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
            Chrysalis
          </p>
          <h1 className="mt-1 font-display text-[32px] text-[color:var(--text-primary)]">{heading}</h1>
          <button
            type="button"
            className="mt-0.5 flex w-full items-center justify-center gap-1 text-sm text-[color:var(--text-secondary)]"
            onClick={() => setShowPicker(true)}
          >
            {type === "week" ? getWeekRangeLabel(id) : getMonthRangeLabel(id)}
            <span className="text-[10px] text-[color:var(--text-tertiary)]">▾</span>
          </button>

          <div className="mt-3 inline-flex rounded-full border border-[color:var(--border)] bg-white/55 p-1">
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                type === "week" ? "bg-lavender text-white" : "text-[color:var(--text-secondary)]"
              }`}
              onClick={() => {
                if (type === "week") return;
                // Anchor to today for current period, otherwise to start of period
                const anchor = isCurrentPeriod ? today : dates[0];
                router.push(`/summary/week/${getWeekId(anchor)}`);
              }}
            >
              Week
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                type === "month" ? "bg-lavender text-white" : "text-[color:var(--text-secondary)]"
              }`}
              onClick={() => {
                if (type === "month") return;
                const anchor = isCurrentPeriod ? today : dates[0];
                router.push(`/summary/month/${getMonthId(anchor)}`);
              }}
            >
              Month
            </button>
          </div>

          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              className="secondary-button h-8 w-8 p-0 text-base"
              aria-label="Previous period"
              onClick={() => router.push(prevPath)}
            >
              ‹
            </button>
            {!isCurrentPeriod && (
              <button
                type="button"
                className="secondary-button h-8 w-8 p-0 text-base"
                aria-label="Next period"
                onClick={() => router.push(nextPath)}
              >
                ›
              </button>
            )}
          </div>
        </div>
        <div className="h-11 w-11 shrink-0" />
      </header>

      {error ? (
        <div className="rounded-[18px] border border-[rgba(232,196,200,0.5)] bg-pale-rose-light px-4 py-3 text-sm text-[color:var(--text-secondary)]">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <p className="section-label mb-1">Entries</p>
          <p className="font-display text-[34px] text-[color:var(--text-primary)]">
            {stats.entriesCount}/{dates.length}
          </p>
          <p className="text-xs text-[color:var(--text-tertiary)]">
            {Math.round((stats.entriesCount / dates.length) * 100) || 0}% completion
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="section-label mb-1">Words written</p>
          <p className="font-display text-[34px] text-[color:var(--text-primary)]">
            {stats.totalWords.toLocaleString()}
          </p>
          <p className="text-xs text-[color:var(--text-tertiary)]">
            avg {entries.length ? Math.round(stats.totalWords / entries.length) : 0}/day
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="section-label mb-1">Tasks done</p>
          <p className="font-display text-[34px] text-[color:var(--text-primary)]">
            {stats.todosCompleted}/{stats.todosTotal}
          </p>
          <p className="text-xs text-[color:var(--text-tertiary)]">
            {stats.todosTotal ? Math.round((stats.todosCompleted / stats.todosTotal) * 100) : 0}% completion
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="section-label mb-1">Top mood</p>
          <p className="font-display text-[30px] text-[color:var(--text-primary)]">
            {getMoodLabel(stats.topMood)}
          </p>
          <p className="text-xs text-[color:var(--text-tertiary)]">
            {stats.topMood ? `${getMoodEmoji(stats.topMood)} most frequent` : "No mood data yet"}
          </p>
        </div>
      </section>

      <section className="glass-card p-4">
        <p className="section-label">{type === "week" ? "Daily word count" : "Weekly word count"}</p>
        <div className="mt-5 flex items-end gap-2 overflow-x-auto pb-1">
          {chartBars.map((bar) => {
            const height = Math.max(8, Math.round((bar.wordCount / chartMax) * 120));
            return (
              <div key={bar.key} className="flex min-w-[32px] flex-1 flex-col items-center gap-2">
                <span className="text-[10px] text-[color:var(--text-tertiary)]">
                  {bar.wordCount > 0 ? bar.wordCount : ""}
                </span>
                <div
                  className={`w-full rounded-t-[10px] ${bar.wordCount > chartMax * 0.66 ? "bg-lavender" : bar.wordCount > chartMax * 0.33 ? "bg-lavender-light" : "bg-[rgba(180,168,200,0.2)]"}`}
                  style={{ height }}
                />
                <span className="text-[10px] text-[color:var(--text-tertiary)]">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="section-label mb-0">Summary</p>
          <div className="flex rounded-full border border-[color:var(--border)] bg-white/55 p-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                mode === "ai" ? "bg-lavender text-white" : "text-[color:var(--text-secondary)]"
              }`}
              onClick={() => { setMode("ai"); setError(null); }}
            >
              AI
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                mode === "manual" ? "bg-lavender text-white" : "text-[color:var(--text-secondary)]"
              }`}
              onClick={() => { setMode("manual"); setError(null); }}
            >
              Manual
            </button>
          </div>
        </div>

        {mode === "ai" ? (
          <div className="glass-card border-lavender-light bg-lavender-ultra p-5">
            {displayContent ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex rounded-full bg-lavender px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    AI generated
                  </div>
                  {aiSaved && (
                    <span className="text-xs text-[color:var(--text-tertiary)]">Saved ✓</span>
                  )}
                </div>
                <div className="whitespace-pre-wrap text-[15px] leading-7 text-[color:var(--text-primary)]">
                  {highlightSummary(displayContent, currentKeywords)}
                </div>
                <button
                  type="button"
                  className="mt-5 text-xs text-[color:var(--text-tertiary)] underline-offset-2 hover:underline disabled:opacity-40"
                  disabled={loading}
                  onClick={handleGenerateSummary}
                >
                  {loading ? "Thinking…" : "Regenerate"}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <p className="text-sm text-[color:var(--text-tertiary)]">
                  {type === "week"
                    ? "Surface the threads woven through this week."
                    : "Trace the larger arc — what shifted in you this month."}
                </p>
                <button
                  type="button"
                  className="soft-button disabled:opacity-40"
                  disabled={loading || !entries.length}
                  onClick={handleGenerateSummary}
                >
                  {loading ? "Thinking…" : "Generate with AI"}
                </button>
                {!entries.length && (
                  <p className="text-xs text-[color:var(--text-tertiary)]">
                    {type === "week"
                      ? "Write a few entries this week first."
                      : "Add some entries this month first."}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="field-area">
              <textarea
                rows={6}
                placeholder={type === "week" ? "Distill the week in your own words…" : "What did this month ask of you? What did it give back?"}
                className="text-[15px] leading-7 placeholder:text-[color:var(--text-tertiary)]"
                value={manualSummary}
                onChange={(event) => setManualSummary(event.target.value)}
              />
            </div>
            <button type="button" className="soft-button" onClick={persistManualSummary}>
              {manualSaved ? "Saved ✓" : "Save summary"}
            </button>
          </div>
        )}
      </section>

      <section>
        <p className="section-label">Keywords</p>
        {currentKeywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentKeywords.map((keyword, index) => {
              const tone =
                index % 3 === 0
                  ? "bg-lavender-ultra text-lavender"
                  : index % 3 === 1
                    ? "bg-pale-rose-light text-[#B07880]"
                    : "bg-misty-blue-light text-[#6090A8]";
              return (
                <span key={keyword} className={`tag-chip ${tone}`}>
                  {keyword}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--text-tertiary)]">
            Keywords emerge after your first AI summary.
          </p>
        )}
      </section>

      <section className="glass-card p-4">
        <p className="section-label">Insights</p>
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const tone =
              index === 0
                ? "bg-lavender-ultra"
                : index === 1
                  ? "bg-pale-rose-light"
                  : "bg-misty-blue-light";
            const icon = index === 0 ? "↑" : index === 1 ? "~" : "→";

            return (
              <div
                key={insight}
                className="flex items-start gap-3 rounded-[18px] border border-[color:var(--border)] bg-white/55 p-3"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] ${tone}`}>
                  {icon}
                </span>
                <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{insight}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card p-4">
        <p className="section-label">Mood this period</p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {dates.map((dateKey) => (
            <div key={dateKey} className="min-w-[44px] text-center">
              <div className="text-[22px]">{getMoodEmoji(entryMap[dateKey]?.mood ?? null)}</div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[color:var(--text-tertiary)]">
                {type === "week"
                  ? new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })
                  : dateKey.slice(-2)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
