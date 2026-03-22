# Chrysalis

A butterfly-themed daily reflection journal built as a mobile-first PWA. Designed for personal use on iPhone — write daily entries, track mood, review weekly and monthly summaries powered by AI.

All data is stored locally in your browser. Nothing is sent to any server except your own AI summary requests.

---

## Features

- **Daily entries** — summary, reflection, to-do list, mood, and tags
- **Week & month summaries** — AI-generated or written manually
- **AI provider choice** — DeepSeek, OpenAI, or Anthropic (bring your own key)
- **Writing streak** tracker
- **Calendar** view with quick month/year navigation
- **Search** across all entries
- **Dark mode**
- **Export / import** JSON backup with weekly reminder
- **PWA** — installable on iPhone via Safari "Add to Home Screen"

---

## Deploy your own (Vercel)

### 1. Fork or clone this repo

```bash
git clone https://github.com/your-username/chrysalis.git
cd chrysalis
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Add whichever provider(s) you want to use as server-side fallbacks.
# Users can also enter their own keys in the app's Settings page.

DEEPSEEK_API_KEY=your_deepseek_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

You only need to fill in the key(s) for the provider(s) you intend to use.

### 3. Deploy to Vercel

Push to GitHub, then import the repo in [Vercel](https://vercel.com). In **Settings → Environment Variables**, add the same keys from your `.env.local`.

Vercel auto-detects Next.js — no extra configuration needed.

### 4. Install on iPhone

Open the deployed URL in Safari → tap the Share icon → **Add to Home Screen**. The app runs in fullscreen standalone mode like a native app.

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## AI summary setup

Chrysalis uses AI to generate weekly and monthly summaries of your journal entries.

Go to **Settings → AI provider** and choose one:

| Provider | Model | Where to get a key |
|----------|-------|-------------------|
| DeepSeek | deepseek-chat | [platform.deepseek.com](https://platform.deepseek.com) |
| OpenAI | gpt-4o-mini | [platform.openai.com](https://platform.openai.com) |
| Anthropic | claude-haiku | [console.anthropic.com](https://console.anthropic.com) |

Enter your API key in the Settings page — it's saved locally and only sent to your own server when you generate a summary. If you've set a server-side environment variable, you can leave the field empty.

---

## Data & privacy

- All journal data is stored in your browser's `localStorage` — nothing is synced to any external database.
- API keys are stored locally and sent only to the `/api/summarize` route on your own Vercel deployment.
- Use **Settings → Export backup JSON** to download a local copy of all your data. The app will remind you weekly.
- Use **Settings → Import backup JSON** to restore or migrate data.

---

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- localStorage for persistence (no backend database)
- DeepSeek / OpenAI / Anthropic for AI summaries

---

## License

MIT
