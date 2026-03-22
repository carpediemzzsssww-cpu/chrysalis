export const STORAGE_KEY = "chrysalis-data";

export type SummaryType = "week" | "month";
export type AiProvider = "deepseek" | "openai" | "anthropic";
export type ThemeMode = "light" | "dark";
export type Mood = "inspired" | "calm" | "driven" | "tired" | "stressed";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
}

export interface Entry {
  date: string;
  summary: string;
  reflection: string;
  todos: Todo[];
  mood: Mood | null;
  tags: string[];
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryStats {
  entriesCount: number;
  totalWords: number;
  todosCompleted: number;
  todosTotal: number;
  topMood: Mood | null;
}

export interface SummaryRecord {
  type: SummaryType;
  period: string;
  content: string;
  aiGenerated: boolean;
  keywords: string[];
  stats: SummaryStats;
  createdAt: string;
  updatedAt?: string;
  manualContent?: string;
}

export interface Settings {
  userName: string;
  theme: ThemeMode;
  aiProvider: AiProvider;
  deepseekApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  streakCurrent: number;
  streakLongest: number;
  lastExportedAt?: string;
}

export interface ChrysalisData {
  entries: Record<string, Entry>;
  summaries: Record<string, SummaryRecord>;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  userName: "",
  theme: "light",
  aiProvider: "deepseek",
  deepseekApiKey: "",
  openaiApiKey: "",
  anthropicApiKey: "",
  streakCurrent: 0,
  streakLongest: 0,
};
