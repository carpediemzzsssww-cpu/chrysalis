"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getWeekId, todayKey } from "@/lib/utils";

function HomeIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function WriteIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function SummaryIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 20v-5" />
      <path d="M12 20V9" />
      <path d="M18 20V4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.68 0 1.27.4 1.51 1H21a2 2 0 1 1 0 4h-.09c-.24.6-.83 1-1.51 1Z" />
    </svg>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const currentDate = todayKey();
  const items = [
    { href: "/", label: "Home", icon: HomeIcon, active: pathname === "/" },
    {
      href: `/entry/${currentDate}`,
      label: "Write",
      icon: WriteIcon,
      active: pathname.startsWith("/entry"),
    },
    {
      href: `/summary/week/${getWeekId(currentDate)}`,
      label: "Summary",
      icon: SummaryIcon,
      active: pathname.startsWith("/summary"),
    },
    {
      href: "/settings",
      label: "Settings",
      icon: SettingsIcon,
      active: pathname.startsWith("/settings"),
    },
  ];

  return (
    <nav className="tab-bar-shell" aria-label="Primary">
      <div className="tab-bar">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`tab-link ${item.active ? "active" : ""}`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

