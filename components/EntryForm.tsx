"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Mood, Todo, TodoStatus } from "@/lib/types";
import { deleteEntry, getAllEntries, getEntry, saveEntry } from "@/lib/storage";
import { addDays, countWords, createId, daysBetween, formatEntryHeaderDate, formatLongDate, formatShortWeekday, getWeekDates, parseDateKey, QUICK_CATEGORIES, todayKey } from "@/lib/utils";
import { MoodPicker } from "@/components/MoodPicker";
import { TodoList } from "@/components/TodoList";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function DatePicker({
  currentDate,
  onSelect,
  onClose,
}: {
  currentDate: string;
  onSelect: (dateKey: string) => void;
  onClose: () => void;
}) {
  const todayStr = todayKey();
  const todayParsed = new Date(`${todayStr}T12:00:00`);
  const nowYear = todayParsed.getFullYear();
  const nowMonth = todayParsed.getMonth();

  const [year, setYear] = useState(() => parseInt(currentDate.slice(0, 4), 10));
  const [month, setMonth] = useState<number | null>(() => parseInt(currentDate.slice(5, 7), 10) - 1);

  const pickerContent =
    month === null ? (
      <>
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            className="secondary-button h-8 w-8 p-0 text-base"
            disabled={year <= 2020}
            onClick={() => setYear((y) => y - 1)}
          >
            ‹
          </button>
          <span className="font-display text-[22px] text-[color:var(--text-primary)]">{year}</span>
          <button
            type="button"
            className="secondary-button h-8 w-8 p-0 text-base"
            disabled={year >= nowYear}
            onClick={() => setYear((y) => y + 1)}
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MONTHS_SHORT.map((name, i) => {
            const isFuture = year > nowYear || (year === nowYear && i > nowMonth);
            const isActive = currentDate.slice(0, 7) === `${year}-${String(i + 1).padStart(2, "0")}`;
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
                onClick={() => setMonth(i)}
              >
                {name}
              </button>
            );
          })}
        </div>
      </>
    ) : (
      <>
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            className="secondary-button h-8 w-8 p-0 text-base"
            onClick={() => setMonth(null)}
          >
            ‹
          </button>
          <span className="font-display text-[20px] text-[color:var(--text-primary)]">
            {MONTHS_SHORT[month]} {year}
          </span>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS_SHORT.map((d) => (
            <span
              key={d}
              className="text-center text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-tertiary)]"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: (() => { let d = new Date(year, month, 1).getDay() - 1; return d < 0 ? 6 : d; })() }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
            const day = i + 1;
            const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
            const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;
            const isFuture = dateKey > todayStr;
            const isActive = dateKey === currentDate;
            const isToday = dateKey === todayStr;
            return (
              <button
                key={day}
                type="button"
                disabled={isFuture}
                className={`aspect-square rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-lavender text-white"
                    : isToday
                      ? "ring-1 ring-lavender text-[color:var(--text-primary)]"
                      : isFuture
                        ? "text-[color:var(--text-tertiary)] opacity-40"
                        : "text-[color:var(--text-secondary)]"
                }`}
                onClick={() => {
                  onSelect(dateKey);
                  onClose();
                }}
              >
                {day}
              </button>
            );
          })}
        </div>
      </>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-[28px] bg-[color:var(--bg)] p-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {pickerContent}
      </div>
    </div>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}

function FullscreenEditor({
  label,
  hint,
  dotColor,
  value,
  placeholder,
  inputClassName,
  inputStyle,
  onChange,
  onClose,
}: {
  label: string;
  hint: string;
  dotColor: string;
  value: string;
  placeholder: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[color:var(--bg)]"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 16px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-5 pb-4">
        <div className="flex items-center gap-2 pt-1">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
              {label}
            </p>
            <p className="mt-0.5 font-display text-[13px] italic text-[color:var(--text-secondary)]">
              {hint}
            </p>
          </div>
        </div>
        <button type="button" className="soft-button shrink-0 py-2 text-sm" onClick={onClose}>
          Done
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        placeholder={placeholder}
        className={`flex-1 resize-none bg-transparent px-5 pt-5 text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-tertiary)] ${inputClassName ?? ""}`}
        style={inputStyle}
        onChange={(e) => onChange(e.target.value)}
      />

      <p className="border-t border-[color:var(--border)] px-5 py-4 text-right text-xs text-[color:var(--text-tertiary)]">
        {countWords(value)} words
      </p>
    </div>
  );
}

function formatSaveStatus(timestamp: string) {
  return `Saved ${new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function EntryForm({ date }: { date: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [reflection, setReflection] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  // Ref keeps todos in sync synchronously so onBlur never reads a stale closure
  const todosRef = useRef<Todo[]>([]);
  const [mood, setMood] = useState<Mood | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [savedMessage, setSavedMessage] = useState("Saves quietly as you write");
  const [knownDates, setKnownDates] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fullscreenField, setFullscreenField] = useState<"summary" | "reflection" | null>(null);
  const [focusTodoId, setFocusTodoId] = useState<string | null>(null);
  const [tagDupeHint, setTagDupeHint] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!focusTodoId) return;
    const t = setTimeout(() => setFocusTodoId(null), 100);
    return () => clearTimeout(t);
  }, [focusTodoId]);

  useEffect(() => {
    const existing = getEntry(date);
    setSummary(existing?.summary ?? "");
    setReflection(existing?.reflection ?? "");

    let initialTodos = existing?.todos ?? [];

    // Auto-carry unfinished todos from the previous day into a new entry
    if (!existing) {
      const yesterday = addDays(date, -1);
      const prev = getEntry(yesterday);
      if (prev) {
        const unfinished = prev.todos.filter(
          (todo) => todo.status === "pending" || todo.status === "partial",
        );
        if (unfinished.length > 0) {
          initialTodos = unfinished.map((todo) => ({
            ...todo,
            id: createId(),
            status: "pending" as TodoStatus,
            note: undefined,
            carriedFrom: yesterday,
          }));
        }
      }
    }

    setTodos(initialTodos);
    todosRef.current = initialTodos;
    setMood(existing?.mood ?? null);
    setTags(existing?.tags ?? []);
    setTagInput("");
    setKnownDates(Object.keys(getAllEntries()));
    setSavedMessage(existing ? formatSaveStatus(existing.updatedAt) : "Begin here");
  }, [date]);

  const persist = (overrides?: {
    summary?: string;
    reflection?: string;
    todos?: Todo[];
    mood?: Mood | null;
    tags?: string[];
  }) => {
    const nextSummary = overrides?.summary ?? summary;
    const nextReflection = overrides?.reflection ?? reflection;
    // Use todosRef.current as default so onBlur always reads the latest value,
    // even if React hasn't flushed the setTodos state update yet
    const nextTodos = (overrides?.todos ?? todosRef.current).filter((todo) => todo.text.trim().length > 0);
    const nextMood = overrides?.mood ?? mood;
    const nextTags = (overrides?.tags ?? tags).filter((tag) => tag.trim().length > 0);

    const saved = saveEntry({
      date,
      summary: nextSummary,
      reflection: nextReflection,
      todos: nextTodos,
      mood: nextMood,
      tags: nextTags,
      wordCount: countWords(nextSummary, nextReflection),
    });

    setKnownDates(Object.keys(getAllEntries()));
    setSavedMessage(formatSaveStatus(saved.updatedAt));
  };

  const updateTodos = (nextTodos: Todo[]) => {
    todosRef.current = nextTodos;
    setTodos(nextTodos);
    persist({ todos: nextTodos });
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (tags.includes(value)) {
      setTagInput("");
      setTagDupeHint(true);
      setTimeout(() => setTagDupeHint(false), 2000);
      return;
    }

    const nextTags = [...tags, value];
    setTags(nextTags);
    setTagInput("");
    persist({ tags: nextTags });
  };

  const weekDates = getWeekDates(date);

  return (
    <div className="page-stack">
      {showDatePicker && (
        <DatePicker
          currentDate={date}
          onSelect={(dateKey) => router.push(`/entry/${dateKey}`)}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      {fullscreenField === "summary" && (
        <FullscreenEditor
          label="Today's summary"
          hint="Write without stopping. Refine later."
          dotColor="bg-lavender"
          value={summary}
          placeholder="What did today teach you?"
          inputClassName="font-display italic leading-relaxed"
          inputStyle={{ fontSize: "var(--writing-font-size)" }}
          onChange={(val) => setSummary(val)}
          onClose={() => {
            setFullscreenField(null);
            persist({ summary });
          }}
        />
      )}
      {fullscreenField === "reflection" && (
        <FullscreenEditor
          label="Reflection"
          hint="The page holds what no one else needs to hear."
          dotColor="bg-pale-rose"
          value={reflection}
          placeholder="What felt true beneath the surface today?"
          inputClassName="leading-relaxed"
          inputStyle={{ fontSize: "var(--writing-font-size)" }}
          onChange={(val) => setReflection(val)}
          onClose={() => {
            setFullscreenField(null);
            persist({ reflection });
          }}
        />
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
            {formatLongDate(date)}
          </p>
          <h1 className="mt-1 font-display text-[32px] text-[color:var(--text-primary)]">
            Daily entry
          </h1>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-[color:var(--text-secondary)]"
            onClick={() => setShowDatePicker(true)}
          >
            {formatEntryHeaderDate(date)}
            <span className="text-[10px] text-[color:var(--text-tertiary)]">▾</span>
          </button>
        </div>
        <button type="button" className="soft-button shrink-0" onClick={() => persist()}>
          Save
        </button>
      </header>

      <div className="flex items-center justify-between rounded-[20px] border border-[color:var(--border)] bg-white/55 px-4 py-3 text-sm text-[color:var(--text-secondary)]">
        <span>{savedMessage}</span>
        <span>{countWords(summary, reflection)} words total</span>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {weekDates.map((weekDate) => {
          const active = weekDate === date;
          const hasEntry = knownDates.includes(weekDate);
          return (
            <button
              key={weekDate}
              type="button"
              className={`date-pill ${active ? "active" : ""} ${hasEntry ? "hasEntry" : ""}`}
              onClick={() => router.push(`/entry/${weekDate}`)}
            >
              <span className="dow">{formatShortWeekday(weekDate)}</span>
              <span className="num">{parseDateKey(weekDate).getDate()}</span>
            </button>
          );
        })}
        <Link href="/entries" className="secondary-button flex items-center whitespace-nowrap self-center">
          All entries
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lavender" />
          <p className="section-label mb-0">Today&apos;s summary</p>
        </div>
        <div className="field-area relative">
          <button
            type="button"
            className="absolute right-3 top-3 text-[color:var(--text-tertiary)]"
            aria-label="Expand to fullscreen"
            onClick={() => setFullscreenField("summary")}
          >
            <ExpandIcon />
          </button>
          <textarea
            rows={5}
            placeholder="What did today teach you?"
            className="font-display italic leading-relaxed text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)]"
            style={{ fontSize: "var(--writing-font-size)" }}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            onBlur={() => persist({ summary })}
          />
          <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--text-tertiary)]">
            <span>Capture the signal, not just the schedule.</span>
            <span>{countWords(summary)} words</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_CATEGORIES.map((cat) => {
            const active = tags.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                className={`mood-pill px-3 py-1.5 text-sm ${active ? "active" : ""}`}
                onClick={() => {
                  const nextTags = active
                    ? tags.filter((t) => t !== cat)
                    : [...tags, cat];
                  setTags(nextTags);
                  persist({ tags: nextTags });
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {tags.filter((tag) => !(QUICK_CATEGORIES as readonly string[]).includes(tag)).map((tag, index) => {
            const tone =
              index % 3 === 0
                ? "bg-lavender-ultra text-lavender"
                : index % 3 === 1
                  ? "bg-pale-rose-light text-[#b07880]"
                  : "bg-misty-blue-light text-[#6090A8]";

            return (
              <span key={tag} className={`tag-chip ${tone}`}>
                {tag}
                <button
                  type="button"
                  className="text-[11px]"
                  aria-label={`Remove ${tag}`}
                  onClick={() => {
                    const nextTags = tags.filter((item) => item !== tag);
                    setTags(nextTags);
                    persist({ tags: nextTags });
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-dashed border-[color:var(--border)] px-4 py-3">
          <input
            value={tagInput}
            placeholder={tagDupeHint ? "Already added" : "Add a tag"}
            className={`text-sm ${tagDupeHint ? "text-[color:var(--text-tertiary)]" : "text-[color:var(--text-secondary)]"}`}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag();
              }
            }}
          />
          <button type="button" className="soft-button py-2 text-xs" onClick={addTag}>
            Add
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-pale-rose" />
          <p className="section-label mb-0">Reflection</p>
        </div>
        <div className="field-area relative">
          <button
            type="button"
            className="absolute right-3 top-3 text-[color:var(--text-tertiary)]"
            aria-label="Expand to fullscreen"
            onClick={() => setFullscreenField("reflection")}
          >
            <ExpandIcon />
          </button>
          <textarea
            rows={5}
            placeholder="What felt true beneath the surface today?"
            className="leading-relaxed placeholder:text-[color:var(--text-tertiary)]"
            style={{ fontSize: "var(--writing-font-size)" }}
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            onBlur={() => persist({ reflection })}
          />
          <div className="mt-4 flex items-center justify-end text-xs text-[color:var(--text-tertiary)]">
            {countWords(reflection)} words
          </div>
        </div>
      </section>

      <section>
        {(() => {
          const ongoingTodos = todos.filter((t) => t.carriedFrom);
          const todayTodos = todos.filter((t) => !t.carriedFrom);

          const todoCallbacks = {
            onStatusChange: (id: string, status: TodoStatus) =>
              updateTodos(
                todosRef.current.map((todo) => (todo.id === id ? { ...todo, status } : todo)),
              ),
            onTextChange: (id: string, value: string) => {
              const next = todosRef.current.map((todo) =>
                todo.id === id ? { ...todo, text: value } : todo,
              );
              todosRef.current = next;
              setTodos(next);
            },
            onNoteChange: (id: string, note: string) =>
              updateTodos(
                todosRef.current.map((todo) => (todo.id === id ? { ...todo, note } : todo)),
              ),
            onRemove: (id: string) => updateTodos(todosRef.current.filter((todo) => todo.id !== id)),
            onBlur: () => persist(),
          };

          return (
            <>
              {ongoingTodos.length > 0 && (
                <div className="mb-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-lavender" />
                    <p className="section-label mb-0">Ongoing</p>
                  </div>
                  <div className="glass-card p-4">
                    <div className="space-y-3">
                      {ongoingTodos.map((todo) => {
                        const days = daysBetween(todo.carriedFrom!, date);
                        const isDone = todo.status === "done";
                        const isSkipped = todo.status === "skipped";
                        return (
                          <div
                            key={todo.id}
                            className={`rounded-[18px] border bg-white/55 px-3 py-3 border-[color:var(--border)] ${isSkipped ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className={`todo-circle ${todo.status === "done" ? "done" : todo.status === "partial" ? "partial" : todo.status === "skipped" ? "skipped" : ""}`}
                                onClick={() => todoCallbacks.onStatusChange(todo.id, todo.status === "pending" ? "done" : todo.status === "done" ? "partial" : todo.status === "partial" ? "skipped" : "pending")}
                              >
                                {todo.status === "done" ? "✓" : todo.status === "partial" ? "—" : todo.status === "skipped" ? "✕" : ""}
                              </button>
                              <span className={`flex-1 min-w-0 text-sm leading-snug ${isDone || isSkipped ? "line-through text-[color:var(--text-tertiary)]" : "text-[color:var(--text-primary)]"}`}>
                                {todo.text}
                              </span>
                              <span className="shrink-0 text-[10px] text-[color:var(--text-tertiary)]">
                                {todo.carriedFrom!.slice(5)} · {days}d
                              </span>
                              <button
                                type="button"
                                className="shrink-0 text-xs text-[color:var(--text-tertiary)]"
                                onClick={() => todoCallbacks.onRemove(todo.id)}
                              >
                                Remove
                              </button>
                            </div>
                            {todo.status !== "pending" && (
                              <div className="mt-2 pl-[2.75rem]">
                                <input
                                  value={todo.note ?? ""}
                                  placeholder={todo.status === "done" ? "How did it go?" : todo.status === "partial" ? "What's still left?" : "Why was it skipped?"}
                                  className="text-xs italic text-[color:var(--text-secondary)] placeholder:text-[color:var(--text-tertiary)]"
                                  onChange={(e) => todoCallbacks.onNoteChange(todo.id, e.target.value)}
                                  onBlur={todoCallbacks.onBlur}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-misty-blue" />
                  <p className="section-label mb-0">{ongoingTodos.length > 0 ? "Today" : "Today\u2019s to-do"}</p>
                </div>
                <TodoList
                  todos={todayTodos}
                  focusId={focusTodoId}
                  onStatusChange={todoCallbacks.onStatusChange}
                  onTextChange={todoCallbacks.onTextChange}
                  onNoteChange={todoCallbacks.onNoteChange}
                  onAdd={() => {
                    const newId = createId();
                    const next = [...todosRef.current, { id: newId, text: "", status: "pending" as TodoStatus }];
                    todosRef.current = next;
                    setTodos(next);
                    setFocusTodoId(newId);
                  }}
                  onRemove={todoCallbacks.onRemove}
                  onReorder={(reorderedToday) => {
                    updateTodos([...ongoingTodos, ...reorderedToday]);
                  }}
                  onBlur={todoCallbacks.onBlur}
                />
                <div className="mt-2 text-xs text-[color:var(--text-tertiary)]">
                  Tasks save when you leave a field.
                </div>
              </div>
            </>
          );
        })()}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-lavender" />
          <p className="section-label mb-0">Today&apos;s mood</p>
        </div>
        <MoodPicker
          value={mood}
          onChange={(nextMood) => {
            setMood(nextMood);
            persist({ mood: nextMood });
          }}
        />
      </section>

      <div className="flex justify-center pt-2 pb-1">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="soft-button bg-pale-rose-light text-[#B07880]"
              onClick={() => {
                deleteEntry(date);
                router.back();
              }}
            >
              Yes, delete entry
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="text-xs text-[color:var(--text-tertiary)] underline-offset-2 hover:underline"
            onClick={() => setConfirmDelete(true)}
          >
            Delete this entry
          </button>
        )}
      </div>
    </div>
  );
}
