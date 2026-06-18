"use client";

import { useState } from "react";

type Status = "reading" | "planned" | "completed" | "on_hold" | "dropped";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "reading", label: "Читаю" },
  { value: "planned", label: "В планах" },
  { value: "completed", label: "Прочитано" },
  { value: "on_hold", label: "Отложено" },
  { value: "dropped", label: "Брошено" },
];

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && STATUS_OPTIONS.some((option) => option.value === value);
}

export default function MangaActions({
  comicId,
  isAuthed,
  initialStatus,
}: {
  comicId: number;
  isAuthed: boolean;
  initialStatus?: Status | null;
}) {
  const [status, setStatus] = useState<Status | "">(initialStatus ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateStatus(nextStatus: Status) {
    if (!isAuthed) {
      window.location.href = "/auth/login";
      return;
    }

    const previousStatus = status;
    setStatus(nextStatus);
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicId, status: nextStatus }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Не удалось обновить статус");
      }

      setStatus(isStatus(data?.item?.status) ? data.item.status : nextStatus);
      setMessage("Статус обновлён");
    } catch (err) {
      setStatus(previousStatus);
      setError(err instanceof Error ? err.message : "Не удалось обновить статус");
    } finally {
      setSaving(false);
    }
  }

  const selectId = `manga-status-${comicId}`;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
        СТАТУС ЧТЕНИЯ
      </div>

      <select
        id={selectId}
        aria-label="Статус чтения"
        className="mw-input mw-select"
        value={status}
        disabled={saving}
        onChange={(event) => {
          const nextStatus = event.target.value;
          if (isStatus(nextStatus)) void updateStatus(nextStatus);
        }}
      >
        <option value="" disabled>
          Выбрать статус
        </option>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="mw-muted2" aria-live="polite">
        {saving
          ? "Сохраняю..."
          : error || message || "Статусы и списки можно посмотреть и менять в профиле."}
      </div>
    </div>
  );
}
