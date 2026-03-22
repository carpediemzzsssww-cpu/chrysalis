"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TabBar } from "@/components/TabBar";
import { getAllEntries } from "@/lib/storage";
import { formatMonthLabel, getMoodEmoji, parseDateKey, sortDateKeys } from "@/lib/utils";
import type { Entry } from "@/lib/types";

function groupByMonth(entries: Entry[]): { label: string; items: Entry[] }[] {
  const map = new Map<string, Entry[]>();

  for (const entry of entries) {
    const d = parseDateKey(entry.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, items]) => ({
      label: formatMonthLabel(parseDateKey(items[0].date)),
      items,
    }));
}

export default function EntriesPage() {
  const [groups, setGroups] = useState<{ label: string; items: Entry[] }[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const all = getAllEntries();
    const sorted = sortDateKeys(Object.keys(all))
      .reverse()
      .map((date) => all[date]);
    setGroups(groupByMonth(sorted));
  }, []);

  const q = query.trim().toLowerCase();
  const filteredGroups = q
    ? groups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (entry) =>
              entry.summary?.toLowerCase().includes(q) ||
              entry.reflection?.toLowerCase().includes(q) ||
              entry.tags.some((tag) => tag.toLowerCase().includes(q)),
          ),
        }))
        .filter((group) => group.items.length > 0)
    : groups;

  return (
    <main className="app-shell">
      <div className="page-stack">
        <header className="pt-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
            Chrysalis
          </p>
          <h1 className="mt-2 font-display text-[40px] leading-none text-[color:var(--text-primary)]">
            All entries
          </h1>
        </header>

        {groups.length > 0 && (
          <div className="flex items-center gap-3 rounded-[18px] border border-[color:var(--border)] bg-white/55 px-4 py-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0 text-[color:var(--text-tertiary)]">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={query}
              placeholder="Search entries…"
              className="text-sm text-[color:var(--text-secondary)]"
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="shrink-0 text-xs text-[color:var(--text-tertiary)]">
                ✕
              </button>
            )}
          </div>
        )}

        {filteredGroups.length === 0 ? (
          <div className="glass-card px-5 py-8 text-center">
            <p className="font-display text-[26px] italic text-[color:var(--text-tertiary)]">
              {q ? "No matches found." : "The page is waiting."}
            </p>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              {q ? "Try a different word or tag." : "Every entry leaves a trace. Begin your first reflection."}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <section key={group.label}>
              <p className="section-label">{group.label}</p>
              <div className="glass-card divide-y divide-[color:var(--border)] overflow-hidden">
                {group.items.map((entry) => {
                  const d = parseDateKey(entry.date);
                  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = d.getDate();
                  const snippet = entry.summary?.trim() || entry.reflection?.trim();

                  return (
                    <Link
                      key={entry.date}
                      href={`/entry/${entry.date}`}
                      className="flex items-center gap-4 px-4 py-3 transition-colors active:bg-lavender-ultra"
                    >
                      <div className="flex w-10 shrink-0 flex-col items-center">
                        <span className="text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-tertiary)]">
                          {dayName}
                        </span>
                        <span className="font-display text-[24px] leading-tight text-[color:var(--text-primary)]">
                          {dayNum}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        {snippet ? (
                          <p className="truncate text-sm text-[color:var(--text-primary)]">
                            {snippet}
                          </p>
                        ) : (
                          <p className="text-sm italic text-[color:var(--text-tertiary)]">
                            Untitled moment
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-[color:var(--text-tertiary)]">
                          {entry.wordCount} words
                          {entry.tags.length > 0 && ` · ${entry.tags.slice(0, 2).join(", ")}`}
                        </p>
                      </div>

                      <span className="shrink-0 text-xl">{getMoodEmoji(entry.mood)}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      <TabBar />
    </main>
  );
}
