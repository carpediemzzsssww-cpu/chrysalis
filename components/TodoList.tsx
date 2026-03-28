"use client";

import { useRef, useState } from "react";
import type { Todo, TodoStatus } from "@/lib/types";

interface TodoListProps {
  todos: Todo[];
  focusId?: string | null;
  onStatusChange: (id: string, status: TodoStatus) => void;
  onTextChange: (id: string, value: string) => void;
  onNoteChange: (id: string, note: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReorder: (todos: Todo[]) => void;
  onBlur: () => void;
}

const STATUS_CYCLE: TodoStatus[] = ["pending", "done", "partial", "skipped"];

function nextStatus(current: TodoStatus): TodoStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function DragHandle() {
  return (
    <svg
      viewBox="0 0 16 24"
      width="10"
      height="16"
      fill="currentColor"
      className="shrink-0 cursor-grab text-[color:var(--text-tertiary)] active:cursor-grabbing"
      aria-hidden="true"
    >
      <circle cx="4" cy="5" r="1.8" />
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="4" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="4" cy="19" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function StatusButton({ status, onClick }: { status: TodoStatus; onClick: () => void }) {
  if (status === "done") {
    return (
      <button
        type="button"
        className="todo-circle done"
        onClick={onClick}
        aria-label="Done — click to cycle status"
      >
        ✓
      </button>
    );
  }
  if (status === "partial") {
    return (
      <button
        type="button"
        className="todo-circle partial"
        onClick={onClick}
        aria-label="Partial — click to cycle status"
      >
        —
      </button>
    );
  }
  if (status === "skipped") {
    return (
      <button
        type="button"
        className="todo-circle skipped"
        onClick={onClick}
        aria-label="Skipped — click to cycle status"
      >
        ✕
      </button>
    );
  }
  return (
    <button
      type="button"
      className="todo-circle"
      onClick={onClick}
      aria-label="Mark as done"
    />
  );
}

const NOTE_PLACEHOLDER: Record<TodoStatus, string> = {
  done: "How did it go?",
  partial: "What was done / what's still left?",
  skipped: "Why was it skipped?",
  pending: "",
};

export function TodoList({
  todos,
  focusId,
  onStatusChange,
  onTextChange,
  onNoteChange,
  onAdd,
  onRemove,
  onReorder,
  onBlur,
}: TodoListProps) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === index) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }
    const next = [...todos];
    const [item] = next.splice(from, 1);
    next.splice(index, 0, item);
    onReorder(next);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="glass-card p-4">
      <div className="space-y-3">
        {todos.map((todo, index) => {
          const isDone = todo.status === "done";
          const isSkipped = todo.status === "skipped";
          const isDraggingOver = dragOverIndex === index && dragIndexRef.current !== index;

          return (
            <div
              key={todo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-[18px] border bg-white/55 px-3 py-3 transition-all ${
                isDraggingOver
                  ? "border-[color:var(--misty-blue)] ring-2 ring-[color:var(--misty-blue)] ring-opacity-30"
                  : "border-[color:var(--border)]"
              } ${isSkipped ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <DragHandle />
                <StatusButton
                  status={todo.status}
                  onClick={() => onStatusChange(todo.id, nextStatus(todo.status))}
                />
                <textarea
                  rows={1}
                  value={todo.text}
                  placeholder="Add a task"
                  autoFocus={todo.id === focusId}
                  ref={(el) => {
                    if (el) {
                      el.style.height = "auto";
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  className={`flex-1 min-w-0 text-sm leading-snug ${
                    isDone || isSkipped
                      ? "line-through text-[color:var(--text-tertiary)]"
                      : "text-[color:var(--text-primary)]"
                  }`}
                  style={{ overflow: "hidden" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                  onChange={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                    onTextChange(todo.id, e.target.value);
                  }}
                  onBlur={onBlur}
                />
                {todo.carriedFrom && (
                  <span
                    className="shrink-0 text-[10px] text-[color:var(--text-tertiary)]"
                    title={`Carried from ${todo.carriedFrom}`}
                  >
                    ↩
                  </span>
                )}
                <button
                  type="button"
                  className="shrink-0 text-xs text-[color:var(--text-tertiary)]"
                  aria-label="Remove task"
                  onClick={() => onRemove(todo.id)}
                >
                  Remove
                </button>
              </div>

              {todo.status !== "pending" && (
                <div className="mt-2 pl-[3.875rem]">
                  <input
                    value={todo.note ?? ""}
                    placeholder={NOTE_PLACEHOLDER[todo.status]}
                    className="text-xs italic text-[color:var(--text-secondary)] placeholder:text-[color:var(--text-tertiary)]"
                    onChange={(e) => onNoteChange(todo.id, e.target.value)}
                    onBlur={onBlur}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-[20px] border border-dashed border-[color:var(--border)] px-4 py-3 text-sm text-[color:var(--text-secondary)]"
        onClick={onAdd}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[color:var(--border)]">
          +
        </span>
        Add task
      </button>
    </div>
  );
}
