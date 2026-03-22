"use client";

import type { Todo } from "@/lib/types";

interface TodoListProps {
  todos: Todo[];
  focusId?: string | null;
  onToggle: (id: string) => void;
  onTextChange: (id: string, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onBlur: () => void;
}

export function TodoList({
  todos,
  focusId,
  onToggle,
  onTextChange,
  onAdd,
  onRemove,
  onBlur,
}: TodoListProps) {
  return (
    <div className="glass-card p-4">
      <div className="space-y-3">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center gap-3 rounded-[18px] border border-[color:var(--border)] bg-white/55 px-3 py-3 ${
              todo.done ? "opacity-80" : ""
            }`}
          >
            <button
              type="button"
              className={`todo-circle ${todo.done ? "done" : ""}`}
              aria-label={todo.done ? "Mark todo as not done" : "Mark todo as done"}
              onClick={() => onToggle(todo.id)}
            >
              {todo.done ? "✓" : ""}
            </button>
            <input
              value={todo.text}
              placeholder="Add a task"
              autoFocus={todo.id === focusId}
              className={`text-sm ${todo.done ? "line-through text-[color:var(--text-tertiary)]" : "text-[color:var(--text-primary)]"}`}
              onChange={(event) => onTextChange(todo.id, event.target.value)}
              onBlur={onBlur}
            />
            <button
              type="button"
              className="text-xs text-[color:var(--text-tertiary)]"
              aria-label="Remove task"
              onClick={() => onRemove(todo.id)}
            >
              Remove
            </button>
          </div>
        ))}
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
