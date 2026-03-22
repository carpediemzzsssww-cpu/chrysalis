import type { AiProvider, SummaryType } from "@/lib/types";

export interface SummaryResponse {
  summary: string;
  keywords: string[];
}

export async function requestSummary(
  entries: string,
  type: SummaryType,
  apiKey?: string,
  provider: AiProvider = "deepseek",
): Promise<SummaryResponse> {
  const response = await fetch("/api/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entries,
      type,
      apiKey: apiKey?.trim() || undefined,
      provider,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | (SummaryResponse & { error?: never })
    | { summary?: string; keywords?: string[]; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to generate summary right now.");
  }

  return {
    summary: payload?.summary ?? "",
    keywords: Array.isArray(payload?.keywords) ? payload.keywords : [],
  };
}
