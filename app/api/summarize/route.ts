import { NextResponse } from "next/server";
import type { AiProvider } from "@/lib/types";

function extractSummaryAndKeywords(content: string) {
  const stripped = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    const parsed = JSON.parse(stripped) as { summary?: unknown; keywords?: unknown };
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const keywords = Array.isArray(parsed.keywords)
      ? (parsed.keywords as unknown[])
          .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
          .map((k) => k.trim())
          .slice(0, 5)
      : [];
    return { summary, keywords };
  } catch {
    const lines = stripped.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return { summary: "", keywords: [] as string[] };
    const lastLine = lines[lines.length - 1];
    const keywordMatch = /^(keywords?|key themes?|关键词)[:：]\s*/i.test(lastLine);
    const keywordSource = keywordMatch
      ? lastLine.replace(/^(keywords?|key themes?|关键词)[:：]\s*/i, "")
      : "";
    const keywords = keywordSource.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 5);
    return {
      summary: keywordMatch ? lines.slice(0, -1).join("\n\n") : lines.join("\n\n"),
      keywords,
    };
  }
}

function buildPrompts(type: "week" | "month", entries: string) {
  const systemPrompt =
    `You are the Chrysalis journal companion — a perceptive reader who finds hidden connections across journal entries.\n\n` +
    `Your job is NOT to summarize what happened. The writer already knows that. Instead:\n` +
    `- Find connections between entries that the writer probably didn't notice (e.g., a reflection in one entry echoes a problem from another day in a different domain).\n` +
    `- Read mood shifts as signals: what triggers the shift? What does the pattern reveal about what energizes or drains the writer?\n` +
    `- Look at to-do patterns: which tasks get done instantly vs. which ones get carried forward for days? What does that say?\n` +
    `- Surface one specific, non-obvious observation — something that would make the writer think "I hadn't noticed that."\n\n` +
    `Tone: direct and precise. No generic affirmations ("great job", "keep it up", "you're growing"). No vague encouragement.\n` +
    `Write as if speaking to a smart, self-aware person who wants signal, not comfort.\n\n` +
    `Respond ONLY with valid JSON — no markdown fences, no extra text:\n` +
    `{"summary":"...","keywords":["...","..."]}`;

  const weekPrompt =
    `Here are this week's journal entries. Each entry contains: date, a daily summary, a personal reflection, mood, tags, and to-do status.\n\n` +
    `Write a 3–5 sentence weekly synthesis that surfaces hidden patterns, cross-entry connections, and non-obvious observations. ` +
    `Do NOT restate what happened — instead tell the writer something they might not have realized about their own week.\n` +
    `Then provide 3–5 keywords that capture the underlying themes (not surface-level topics).\n` +
    `Respond in the same language as the entries.\n\n---\n${entries}`;

  const monthPrompt =
    `Here are this month's journal entries. Each entry contains: date, a daily summary, a personal reflection, mood, tags, and to-do status.\n\n` +
    `Write a 4–6 sentence monthly synthesis that surfaces hidden patterns, recurring tensions, and shifts in how the writer thinks. ` +
    `Do NOT restate what happened — instead tell the writer something they might not have realized about their own month.\n` +
    `Then provide 3–5 keywords that capture the underlying themes (not surface-level topics).\n` +
    `Respond in the same language as the entries.\n\n---\n${entries}`;

  return { systemPrompt, userPrompt: type === "week" ? weekPrompt : monthPrompt };
}

async function callOpenAICompatible(
  baseUrl: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 800,
      response_format: { type: "json_object" },
    }),
  });

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(payload.error?.message ?? `${baseUrl} request failed.`);
  }

  return payload.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(apiKey: string, systemPrompt: string, userPrompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const payload = (await res.json()) as {
    content?: { type: string; text: string }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(payload.error?.message ?? "Anthropic request failed.");
  }

  return payload.content?.find((b) => b.type === "text")?.text ?? "";
}

export async function POST(request: Request) {
  try {
    const { entries, type, apiKey, provider = "deepseek" } = (await request.json()) as {
      entries?: string;
      type?: "week" | "month";
      apiKey?: string;
      provider?: AiProvider;
    };

    if (!entries || !type) {
      return NextResponse.json({ error: "Missing entries or summary type." }, { status: 400 });
    }

    const providerEnvKey =
      provider === "openai"
        ? process.env.OPENAI_API_KEY
        : provider === "anthropic"
          ? process.env.ANTHROPIC_API_KEY
          : process.env.DEEPSEEK_API_KEY;

    const resolvedApiKey = apiKey?.trim() || providerEnvKey;

    if (!resolvedApiKey) {
      const providerName =
        provider === "openai" ? "OpenAI" : provider === "anthropic" ? "Anthropic" : "DeepSeek";
      return NextResponse.json(
        { error: `Missing ${providerName} API key. Add one in Settings.` },
        { status: 500 },
      );
    }

    const { systemPrompt, userPrompt } = buildPrompts(type, entries);

    let rawContent: string;

    if (provider === "anthropic") {
      rawContent = await callAnthropic(resolvedApiKey, systemPrompt, userPrompt);
    } else if (provider === "openai") {
      rawContent = await callOpenAICompatible(
        "https://api.openai.com/v1",
        "gpt-4o-mini",
        resolvedApiKey,
        systemPrompt,
        userPrompt,
      );
    } else {
      rawContent = await callOpenAICompatible(
        "https://api.deepseek.com",
        "deepseek-chat",
        resolvedApiKey,
        systemPrompt,
        userPrompt,
      );
    }

    const { summary, keywords } = extractSummaryAndKeywords(rawContent);
    return NextResponse.json({ summary, keywords });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error while generating summary." },
      { status: 500 },
    );
  }
}
