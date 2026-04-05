import type { Entry, Mood } from "@/lib/types";

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const QUICK_CATEGORIES = ["实习", "学习", "生活"] as const;

export const MOOD_META: Record<
  Mood,
  {
    label: string;
    emoji: string;
    tone: string;
  }
> = {
  inspired: { label: "Inspired", emoji: "✨", tone: "lavender" },
  calm: { label: "Calm", emoji: "🌿", tone: "green" },
  driven: { label: "Driven", emoji: "💪", tone: "misty-blue" },
  tired: { label: "Tired", emoji: "☁", tone: "stone" },
  stressed: { label: "Stressed", emoji: "⚡", tone: "rose" },
};

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00`);
}

export function todayKey(): string {
  return formatDateKey(new Date());
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round((parseDateKey(b).getTime() - parseDateKey(a).getTime()) / msPerDay);
}

export function startOfWeek(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return formatDateKey(date);
}

export function endOfWeek(dateKey: string): string {
  return addDays(startOfWeek(dateKey), 6);
}

export function getWeekDates(dateKey: string): string[] {
  const weekStart = startOfWeek(dateKey);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

export function getMonthDays(date: Date): string[] {
  const firstDay = getMonthStart(date);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) =>
    formatDateKey(new Date(firstDay.getFullYear(), firstDay.getMonth(), index + 1, 12)),
  );
}

export function getMonthGrid(date: Date): Array<string | null> {
  const firstDay = getMonthStart(date);
  const weekdayOffset = (firstDay.getDay() + 6) % 7;
  const monthDays = getMonthDays(date);
  const cells: Array<string | null> = Array.from({ length: weekdayOffset }, () => null);
  cells.push(...monthDays);

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function formatLongDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEntryHeaderDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    weekday: "long",
  });
}

export function formatShortWeekday(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("en-US", { weekday: "short" });
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatHomeDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const monthDayYear = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${monthDayYear} · ${weekday}`.toUpperCase();
}

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  const min = date.getMinutes();
  const day = date.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const seed = date.getDate(); // deterministic variant per calendar day

  // ── Exact-minute easter eggs ─────────────────────────────────────────
  if (hour === 0 && min === 0) return "A brand-new day";
  if (hour === 11 && min === 11) return "11:11 — make a wish";
  if (hour === 3 && min === 14) return "π o'clock";
  if (hour === 22 && min === 22) return "22:22 — in alignment";

  // ── Day × time easter eggs ───────────────────────────────────────────
  if (day === 1 && hour >= 5 && hour < 10) return "New week energy";
  if (day === 5 && hour >= 17 && hour < 22) return "Happy Friday evening";
  if ((day === 6 || day === 0) && hour >= 9 && hour < 12) return "Slow morning";
  if ((day === 6 || day === 0) && hour >= 14 && hour < 18) return "Lazy afternoon";

  // ── Time pools (pick by day-of-month for daily variety) ─────────────
  if (hour >= 0 && hour < 5) {
    return ["Still awake", "The quiet hours", "Late-night mode"][seed % 3];
  }
  if (hour < 9) {
    return ["Good morning", "Good morning", "Rise and reflect", "Morning light"][seed % 4];
  }
  if (hour < 12) {
    return ["Good morning", "Good morning", "The day is opening up"][seed % 3];
  }
  if (hour < 14) {
    return ["Good afternoon", "Midday check-in"][seed % 2];
  }
  if (hour < 18) {
    return ["Good afternoon", "Good afternoon", "Afternoon light"][seed % 3];
  }
  if (hour < 22) {
    return ["Good evening", "Good evening", "The day softens"][seed % 3];
  }
  return ["Good evening", "Winding down", "Almost midnight"][seed % 3];
}

export function countWords(...segments: Array<string | undefined | null>): number {
  const text = segments.filter(Boolean).join(" ").trim();
  if (!text) return 0;

  // Each CJK character counts as one word (Chinese/Japanese/Korean convention)
  const cjkCount = (
    text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) ?? []
  ).length;

  // Non-CJK word tokens (Latin, numbers, etc.) counted separately
  const latinCount = (
    text
      .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, " ")
      .match(/[\p{L}\p{N}’’-]+/gu) ?? []
  ).length;

  return cjkCount + latinCount;
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isToday(dateKey: string): boolean {
  return dateKey === todayKey();
}

export function isSameMonth(dateKey: string, monthDate: Date): boolean {
  const date = parseDateKey(dateKey);
  return (
    date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth()
  );
}

export function getISOWeekInfo(dateKey: string): { year: number; week: number } {
  const date = parseDateKey(dateKey);
  const target = new Date(date.valueOf());
  const dayNumber = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstThursdayDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDayNumber + 3);
  const diff = target.getTime() - firstThursday.getTime();
  const week = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));

  return { year: target.getFullYear(), week };
}

export function getWeekId(dateKey: string): string {
  const { year, week } = getISOWeekInfo(dateKey);
  return `${year}-W${`${week}`.padStart(2, "0")}`;
}

export function getWeekDatesFromId(weekId: string): string[] {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) {
    return getWeekDates(todayKey());
  }

  const [, yearText, weekText] = match;
  const year = Number(yearText);
  const week = Number(weekText);
  const januaryFourth = new Date(year, 0, 4, 12);
  const januaryFourthOffset = (januaryFourth.getDay() + 6) % 7;
  januaryFourth.setDate(januaryFourth.getDate() - januaryFourthOffset);
  januaryFourth.setDate(januaryFourth.getDate() + (week - 1) * 7);

  return Array.from({ length: 7 }, (_, index) =>
    formatDateKey(new Date(januaryFourth.getFullYear(), januaryFourth.getMonth(), januaryFourth.getDate() + index, 12)),
  );
}

export function getMonthId(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function getMonthDatesFromId(monthId: string): string[] {
  const match = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!match) {
    return getMonthDays(parseDateKey(todayKey()));
  }

  const [, yearText, monthText] = match;
  return getMonthDays(new Date(Number(yearText), Number(monthText) - 1, 1, 12));
}

export function getWeekRangeLabel(weekId: string): string {
  const dates = getWeekDatesFromId(weekId);
  const first = parseDateKey(dates[0]);
  const last = parseDateKey(dates[6]);
  const firstMonth = first.toLocaleDateString("en-US", { month: "long" });
  const lastMonth = last.toLocaleDateString("en-US", { month: "long" });
  const year = last.getFullYear();
  const week = weekId.split("-W")[1] ?? "";

  if (firstMonth === lastMonth) {
    return `${firstMonth} ${first.getDate()}-${last.getDate()}, ${year} · Week ${week}`;
  }

  return `${firstMonth} ${first.getDate()} - ${lastMonth} ${last.getDate()}, ${year} · Week ${week}`;
}

export function getAdjacentWeekId(weekId: string, delta: 1 | -1): string {
  const dates = getWeekDatesFromId(weekId);
  return getWeekId(addDays(dates[0], delta * 7));
}

export function getAdjacentMonthId(monthId: string, delta: 1 | -1): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!match) return monthId;
  const [, yearText, monthText] = match;
  const d = new Date(Number(yearText), Number(monthText) - 1 + delta, 1, 12);
  return getMonthId(formatDateKey(d));
}

export function getMonthRangeLabel(monthId: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!match) {
    return formatMonthLabel(parseDateKey(todayKey()));
  }

  const [, yearText, monthText] = match;
  const date = new Date(Number(yearText), Number(monthText) - 1, 1, 12);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function sortDateKeys(dateKeys: string[]): string[] {
  return [...dateKeys].sort((left, right) => left.localeCompare(right));
}

export function calculateStreaks(entries: Record<string, Entry>): {
  current: number;
  longest: number;
} {
  const dates = sortDateKeys(Object.keys(entries)).filter((dateKey) => {
    const entry = entries[dateKey];
    return Boolean(entry?.summary?.trim() || entry?.reflection?.trim() || entry?.todos?.length);
  });

  if (dates.length === 0) {
    return { current: 0, longest: 0 };
  }

  let longest = 1;
  let running = 1;

  for (let index = 1; index < dates.length; index += 1) {
    const previous = parseDateKey(dates[index - 1]);
    const current = parseDateKey(dates[index]);
    const diff = Math.round((current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000));

    if (diff === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  // Use a Set of content-filtered dates so empty entries don't inflate the streak
  const datesSet = new Set(dates);

  let current = 0;
  let cursor = todayKey();

  while (datesSet.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  if (current === 0) {
    const latest = dates[dates.length - 1];
    if (latest === addDays(todayKey(), -1)) {
      current = 1;
      cursor = addDays(latest, -1);
      while (datesSet.has(cursor)) {
        current += 1;
        cursor = addDays(cursor, -1);
      }
    }
  }

  return { current, longest };
}

export function getMoodLabel(mood: Mood | null): string {
  if (!mood) {
    return "None";
  }
  return MOOD_META[mood].label;
}

export function getMoodEmoji(mood: Mood | null): string {
  if (!mood) {
    return "—";
  }
  return MOOD_META[mood].emoji;
}

export function getTopMood(entries: Entry[]): Mood | null {
  const counts = new Map<Mood, number>();

  entries.forEach((entry) => {
    if (!entry.mood) {
      return;
    }
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  });

  let topMood: Mood | null = null;
  let topCount = 0;

  counts.forEach((count, mood) => {
    if (count > topCount) {
      topMood = mood;
      topCount = count;
    }
  });

  return topMood;
}

export function createEmptyInsights(entries: Entry[], missingDays: number, topMood: Mood | null): string[] {
  const richestEntry = [...entries].sort((left, right) => right.wordCount - left.wordCount)[0];
  const completed = entries.flatMap((entry) => entry.todos).filter((todo) => todo.status === "done").length;

  return [
    richestEntry
      ? `${formatShortWeekday(richestEntry.date)} was your most expansive day — ${richestEntry.wordCount} words on the page.`
      : "Your first entry will anchor the period. There's no wrong place to begin.",
    missingDays > 0
      ? `${missingDays} day${missingDays > 1 ? "s" : ""} passed without a line. A single sentence still counts as showing up.`
      : "You wrote every day this period. That kind of constancy is worth protecting.",
    completed > 0
      ? `${completed} task${completed > 1 ? "s" : ""} moved to done. Let that momentum carry into what you name next.`
      : topMood
        ? `${getMoodLabel(topMood)} was the prevailing current. Notice what that energy wants to move toward.`
        : "No closed tasks yet. Try ending each entry with one small intention.",
  ];
}

export function summarizePeriodStats(entries: Entry[]) {
  const todos = entries.flatMap((entry) => entry.todos);
  return {
    entriesCount: entries.length,
    totalWords: entries.reduce((total, entry) => total + entry.wordCount, 0),
    todosCompleted: todos.filter((todo) => todo.status === "done").length,
    todosTotal: todos.length,
    topMood: getTopMood(entries),
  };
}

