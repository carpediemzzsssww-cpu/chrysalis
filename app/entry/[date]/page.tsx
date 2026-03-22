"use client";

import { useParams } from "next/navigation";
import { EntryForm } from "@/components/EntryForm";
import { TabBar } from "@/components/TabBar";

export default function EntryPage() {
  const params = useParams<{ date: string }>();
  const date = Array.isArray(params.date) ? params.date[0] : params.date;

  return (
    <main className="app-shell">
      <EntryForm date={date} />
      <TabBar />
    </main>
  );
}

