import { DEFAULT_SETTINGS, STORAGE_KEY, type AiProvider, type ChrysalisData, type Entry, type Settings, type SummaryRecord } from "@/lib/types";
import { calculateStreaks, countWords } from "@/lib/utils";

function createDefaultData(): ChrysalisData {
  return {
    entries: {},
    summaries: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function sanitizeEntry(date: string, value: Partial<Entry>): Entry {
  const now = new Date().toISOString();

  return {
    date,
    summary: typeof value.summary === "string" ? value.summary : "",
    reflection: typeof value.reflection === "string" ? value.reflection : "",
    todos: Array.isArray(value.todos)
      ? value.todos
          .filter((todo) => todo && typeof todo.text === "string")
          .map((todo) => ({
            id: typeof todo.id === "string" ? todo.id : `${Date.now()}-${Math.random()}`,
            text: todo.text,
            done: Boolean(todo.done),
          }))
      : [],
    mood: value.mood ?? null,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
      : [],
    wordCount:
      typeof value.wordCount === "number"
        ? value.wordCount
        : countWords(value.summary, value.reflection),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

function sanitizeSummary(period: string, value: Partial<SummaryRecord>): SummaryRecord {
  const now = new Date().toISOString();

  return {
    type: value.type === "month" ? "month" : "week",
    period,
    content: typeof value.content === "string" ? value.content : "",
    aiGenerated: Boolean(value.aiGenerated),
    keywords: Array.isArray(value.keywords)
      ? value.keywords.filter((keyword): keyword is string => typeof keyword === "string")
      : [],
    stats: {
      entriesCount: value.stats?.entriesCount ?? 0,
      totalWords: value.stats?.totalWords ?? 0,
      todosCompleted: value.stats?.todosCompleted ?? 0,
      todosTotal: value.stats?.todosTotal ?? 0,
      topMood: value.stats?.topMood ?? null,
    },
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
    manualContent: typeof value.manualContent === "string" ? value.manualContent : "",
  };
}

function sanitizeSettings(value: Partial<Settings> | undefined): Settings {
  const validProviders: AiProvider[] = ["deepseek", "openai", "anthropic"];
  return {
    userName: typeof value?.userName === "string" ? value.userName : "",
    theme: value?.theme === "dark" ? "dark" : "light",
    aiProvider: validProviders.includes(value?.aiProvider as AiProvider)
      ? (value?.aiProvider as AiProvider)
      : "deepseek",
    deepseekApiKey: typeof value?.deepseekApiKey === "string" ? value.deepseekApiKey : "",
    openaiApiKey: typeof value?.openaiApiKey === "string" ? value.openaiApiKey : "",
    anthropicApiKey: typeof value?.anthropicApiKey === "string" ? value.anthropicApiKey : "",
    streakCurrent: typeof value?.streakCurrent === "number" ? value.streakCurrent : 0,
    streakLongest: typeof value?.streakLongest === "number" ? value.streakLongest : 0,
    lastExportedAt: typeof value?.lastExportedAt === "string" ? value.lastExportedAt : undefined,
  };
}

function readData(): ChrysalisData {
  if (!isBrowser()) {
    return createDefaultData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultData();
    }

    const parsed = JSON.parse(raw) as Partial<ChrysalisData>;
    const entries = Object.entries(parsed.entries ?? {}).reduce<Record<string, Entry>>((acc, [date, value]) => {
      acc[date] = sanitizeEntry(date, value);
      return acc;
    }, {});
    const summaries = Object.entries(parsed.summaries ?? {}).reduce<Record<string, SummaryRecord>>(
      (acc, [period, value]) => {
        acc[period] = sanitizeSummary(period, value);
        return acc;
      },
      {},
    );
    const settings = sanitizeSettings(parsed.settings);
    const streaks = calculateStreaks(entries);

    return {
      entries,
      summaries,
      settings: {
        ...settings,
        streakCurrent: streaks.current,
        streakLongest: Math.max(settings.streakLongest, streaks.longest),
      },
    };
  } catch {
    return createDefaultData();
  }
}

function writeData(data: ChrysalisData): void {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function withFreshStreaks(data: ChrysalisData): ChrysalisData {
  const streaks = calculateStreaks(data.entries);
  return {
    ...data,
    settings: {
      ...data.settings,
      streakCurrent: streaks.current,
      streakLongest: Math.max(data.settings.streakLongest, streaks.longest),
    },
  };
}

export function getAllEntries(): Record<string, Entry> {
  return readData().entries;
}

export function getEntry(date: string): Entry | null {
  return readData().entries[date] ?? null;
}

export function saveEntry(entry: Partial<Entry> & Pick<Entry, "date">): Entry {
  const data = readData();
  const previous = data.entries[entry.date];
  const savedEntry = sanitizeEntry(entry.date, {
    ...previous,
    ...entry,
    createdAt: previous?.createdAt ?? entry.createdAt,
    updatedAt: new Date().toISOString(),
    wordCount: countWords(entry.summary ?? previous?.summary, entry.reflection ?? previous?.reflection),
  });

  const next = withFreshStreaks({
    ...data,
    entries: {
      ...data.entries,
      [entry.date]: savedEntry,
    },
  });
  writeData(next);
  return savedEntry;
}

export function deleteEntry(date: string): void {
  const data = readData();
  const nextEntries = { ...data.entries };
  delete nextEntries[date];
  writeData(withFreshStreaks({ ...data, entries: nextEntries }));
}

export function getEntriesForRange(start: string, end: string): Entry[] {
  const entries = Object.values(readData().entries)
    .filter((entry) => entry.date >= start && entry.date <= end)
    .sort((left, right) => left.date.localeCompare(right.date));
  return entries;
}

export function getSummary(period: string): SummaryRecord | null {
  return readData().summaries[period] ?? null;
}

export function saveSummary(summary: SummaryRecord): SummaryRecord {
  const data = readData();
  const savedSummary = sanitizeSummary(summary.period, {
    ...data.summaries[summary.period],
    ...summary,
    updatedAt: new Date().toISOString(),
  });

  writeData({
    ...data,
    summaries: {
      ...data.summaries,
      [summary.period]: savedSummary,
    },
  });

  return savedSummary;
}

export function exportData(): string {
  return JSON.stringify(readData(), null, 2);
}

export function recordExport(): void {
  const data = readData();
  writeData({
    ...data,
    settings: { ...data.settings, lastExportedAt: new Date().toISOString() },
  });
}

export function importData(json: string): ChrysalisData {
  const incoming = JSON.parse(json) as Partial<ChrysalisData>;
  const existing = readData();
  const mergedEntries = { ...existing.entries };

  Object.entries(incoming.entries ?? {}).forEach(([date, value]) => {
    const normalized = sanitizeEntry(date, value);
    const current = mergedEntries[date];

    if (!current || normalized.updatedAt >= current.updatedAt) {
      mergedEntries[date] = normalized;
    }
  });

  const mergedSummaries = { ...existing.summaries };
  Object.entries(incoming.summaries ?? {}).forEach(([period, value]) => {
    const normalized = sanitizeSummary(period, value);
    const current = mergedSummaries[period];

    if (!current || (normalized.updatedAt ?? normalized.createdAt) >= (current.updatedAt ?? current.createdAt)) {
      mergedSummaries[period] = normalized;
    }
  });

  const next = withFreshStreaks({
    entries: mergedEntries,
    summaries: mergedSummaries,
    settings: {
      ...existing.settings,
      ...sanitizeSettings(incoming.settings),
    },
  });

  writeData(next);
  return next;
}

export function getSettings(): Settings {
  return readData().settings;
}

export function updateSettings(partial: Partial<Settings>): Settings {
  const data = readData();
  const next = {
    ...data,
    settings: sanitizeSettings({
      ...data.settings,
      ...partial,
    }),
  };
  writeData(next);
  return next.settings;
}

export function clearAllData(): void {
  writeData(createDefaultData());
}

