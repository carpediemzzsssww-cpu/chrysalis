"use client";

import { useParams } from "next/navigation";
import { TabBar } from "@/components/TabBar";
import { WeeklySummary } from "@/components/WeeklySummary";

export default function MonthlySummaryPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <main className="app-shell">
      <WeeklySummary id={id} type="month" />
      <TabBar />
    </main>
  );
}

