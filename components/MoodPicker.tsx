"use client";

import type { Mood } from "@/lib/types";
import { MOOD_META } from "@/lib/utils";

const MOODS: Mood[] = ["inspired", "calm", "driven", "tired", "stressed"];

interface MoodPickerProps {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {MOODS.map((mood) => {
        const meta = MOOD_META[mood];
        const active = value === mood;

        return (
          <button
            key={mood}
            type="button"
            className={`mood-pill px-3 py-3 ${active ? "active" : ""}`}
            onClick={() => onChange(mood)}
          >
            <span className="mb-1 block text-lg">{meta.emoji}</span>
            <span className="text-sm font-medium">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

