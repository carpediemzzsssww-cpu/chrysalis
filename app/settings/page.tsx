"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import type { AiProvider, FontSize, Settings } from "@/lib/types";
import { clearAllData, exportData, getSettings, importData, recordExport, updateSettings } from "@/lib/storage";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState("All data is stored locally on this device.");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const syncTheme = (theme: "light" | "dark") => {
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "";
  };

  const handleThemeChange = (theme: "light" | "dark") => {
    const next = updateSettings({ theme });
    setSettings(next);
    syncTheme(theme);
    setStatus(`Theme updated to ${theme}.`);
  };

  const handleFontSizeChange = (fontSize: FontSize) => {
    const next = updateSettings({ fontSize });
    setSettings(next);
    document.documentElement.dataset.fontSize = fontSize;
    setStatus(`Writing size set to ${fontSize}.`);
  };

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `chrysalis-${today}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    recordExport();
    setSettings(getSettings());
    setStatus("Backup exported.");
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const next = importData(content);
      setSettings(next.settings);
      syncTheme(next.settings.theme);
      setStatus("Backup imported.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to import backup.");
    }
  };

  const handleNameSave = () => {
    if (!settings) {
      return;
    }
    const next = updateSettings({ userName: settings.userName });
    setSettings(next);
    setStatus(settings.userName.trim() ? `Name saved as "${settings.userName.trim()}".` : "Name cleared.");
  };

  const handleProviderChange = (provider: AiProvider) => {
    if (!settings) return;
    const next = updateSettings({ aiProvider: provider });
    setSettings(next);
    setStatus(`AI provider set to ${provider === "openai" ? "OpenAI" : provider === "anthropic" ? "Anthropic" : "DeepSeek"}.`);
  };

  const handleKeySave = () => {
    if (!settings) return;
    const next = updateSettings({
      deepseekApiKey: settings.deepseekApiKey,
      openaiApiKey: settings.openaiApiKey,
      anthropicApiKey: settings.anthropicApiKey,
    });
    setSettings(next);
    setStatus("API key saved.");
  };

  return (
    <main className="app-shell">
      <div className="page-stack">
        <header className="flex items-start justify-between gap-4">
          <button
            type="button"
            className="secondary-button h-11 w-11 shrink-0 p-0 text-lg"
            aria-label="Go back"
            onClick={() => router.push("/")}
          >
            ‹
          </button>
          <div className="flex-1 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--text-tertiary)]">
              Preferences
            </p>
            <h1 className="mt-1 font-display text-[32px] text-[color:var(--text-primary)]">
              Settings
            </h1>
            <p className="text-sm text-[color:var(--text-secondary)]">{status}</p>
          </div>
          <div className="h-11 w-11 shrink-0" />
        </header>

        <section className="glass-card p-5">
          <p className="section-label">Profile</p>
          <div className="field-area">
            <input
              type="text"
              placeholder="Your name (shown in greeting)"
              value={settings?.userName ?? ""}
              onChange={(event) =>
                setSettings((current) =>
                  current ? { ...current, userName: event.target.value } : current,
                )
              }
              onBlur={handleNameSave}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-[color:var(--text-tertiary)]">
            Appears in the home screen greeting. Leave blank to hide it.
          </p>
        </section>

        <section className="glass-card p-5">
          <p className="section-label">Data</p>
          <div className="grid gap-3">
            <button type="button" className="soft-button text-left" onClick={handleExport}>
              Export backup JSON
            </button>
            <label className="secondary-button block text-center">
              Import backup JSON
              <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
            </label>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="soft-button flex-1 bg-pale-rose-light text-[#B07880]"
                  onClick={() => {
                    clearAllData();
                    setSettings(getSettings());
                    setStatus("All local data cleared.");
                    setConfirmClear(false);
                  }}
                >
                  Yes, clear everything
                </button>
                <button
                  type="button"
                  className="secondary-button flex-1"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="secondary-button text-left text-[#B07880]"
                onClick={() => setConfirmClear(true)}
              >
                Clear all data
              </button>
            )}
          </div>
        </section>

        <section className="glass-card p-5">
          <p className="section-label">Theme</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`mood-pill px-4 py-4 ${settings?.theme === "light" ? "active" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={`mood-pill px-4 py-4 ${settings?.theme === "dark" ? "active" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              Dark
            </button>
          </div>
        </section>

        <section className="glass-card p-5">
          <p className="section-label">Writing size</p>
          <div className="grid grid-cols-3 gap-3">
            {(["small", "medium", "large"] as FontSize[]).map((size) => (
              <button
                key={size}
                type="button"
                className={`mood-pill py-4 ${settings?.fontSize === size ? "active" : ""}`}
                onClick={() => handleFontSizeChange(size)}
              >
                <span style={{ fontSize: size === "small" ? "13px" : size === "large" ? "19px" : "16px" }}>
                  A
                </span>
                <span className="block text-xs mt-0.5 capitalize">{size}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-[color:var(--text-tertiary)]">
            Affects the font size in the summary and reflection text areas.
          </p>
        </section>

        <section className="glass-card p-5">
          <p className="section-label">AI provider</p>
          <div className="grid grid-cols-3 gap-2">
            {(["deepseek", "openai", "anthropic"] as AiProvider[]).map((p) => {
              const label = p === "openai" ? "OpenAI" : p === "anthropic" ? "Anthropic" : "DeepSeek";
              return (
                <button
                  key={p}
                  type="button"
                  className={`mood-pill py-3 text-sm ${settings?.aiProvider === p ? "active" : ""}`}
                  onClick={() => handleProviderChange(p)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 field-area">
            {settings?.aiProvider === "deepseek" && (
              <input
                key="deepseek"
                type="password"
                placeholder="sk-... (DeepSeek)"
                value={settings?.deepseekApiKey ?? ""}
                onChange={(e) =>
                  setSettings((s) => s ? { ...s, deepseekApiKey: e.target.value } : s)
                }
                onBlur={handleKeySave}
              />
            )}
            {settings?.aiProvider === "openai" && (
              <input
                key="openai"
                type="password"
                placeholder="sk-... (OpenAI)"
                value={settings?.openaiApiKey ?? ""}
                onChange={(e) =>
                  setSettings((s) => s ? { ...s, openaiApiKey: e.target.value } : s)
                }
                onBlur={handleKeySave}
              />
            )}
            {settings?.aiProvider === "anthropic" && (
              <input
                key="anthropic"
                type="password"
                placeholder="sk-ant-... (Anthropic)"
                value={settings?.anthropicApiKey ?? ""}
                onChange={(e) =>
                  setSettings((s) => s ? { ...s, anthropicApiKey: e.target.value } : s)
                }
                onBlur={handleKeySave}
              />
            )}
          </div>

          <p className="mt-3 text-xs leading-5 text-[color:var(--text-tertiary)]">
            Keys are stored locally and sent only to your own server route. Each provider falls back
            to its server-side env variable if the field is left empty.
          </p>
        </section>

        <section className="glass-card p-5">
          <p className="section-label">About</p>
          <h2 className="font-display text-[30px] text-[color:var(--text-primary)]">Chrysalis</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            Version 1.0 · a butterfly-themed daily reflection and growth journal built as a
            mobile-first web app.
          </p>
        </section>
      </div>

      <TabBar />
    </main>
  );
}
