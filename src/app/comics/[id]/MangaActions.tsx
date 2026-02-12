"use client";


import { useEffect, useMemo, useState } from "react";

type Status = "reading" | "planned" | "completed" | "on_hold" | "dropped";

const STATUSES: { key: Status; label: string }[] = [
  { key: "planned", label: "В планах" },
  { key: "reading", label: "Читаю" },
  { key: "completed", label: "Прочитано" },
  { key: "on_hold", label: "Пауза" },
  { key: "dropped", label: "Брошено" },
];

type ListItem = {
  id: number;
  comicId: number;
  status: Status;
  progress: number;
};

export default function MangaActions({ comicId }: { comicId: number }) {
  const [item, setItem] = useState<ListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // грузим текущий статус (если уже добавлено)
  useEffect(() => {
    let alive = true;

    (async () => {
      setMsg(null);
      const res = await fetch("/api/profile/lists", { method: "GET" });

      if (!alive) return;

      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }

      if (!res.ok) return;

      const data = (await res.json().catch(() => null)) as { items?: ListItem[] } | null;
      const found = data?.items?.find((x) => x.comicId === comicId) ?? null;
      setItem(found);
    })();

    return () => {
      alive = false;
    };
  }, [comicId]);

  const currentLabel = useMemo(() => {
    if (!item) return "Не в списках";
    return STATUSES.find((s) => s.key === item.status)?.label ?? item.status;
  }, [item]);

  async function setStatus(status: Status) {
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/profile/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId, status }),
    });

    const data = await res.json().catch(() => null);

    setLoading(false);

    if (res.status === 401) {
      setUnauthorized(true);
      setMsg("Нужно войти в аккаунт");
      return;
    }

    if (!res.ok) {
      setMsg(data?.error || data?.message || "Ошибка");
      return;
    }

    if (data?.item) {
      setItem(data.item as ListItem);
      setMsg("✅ Обновлено");
    }
  }

  async function removeFromList() {
    if (!item) return;

    setLoading(true);
    setMsg(null);

    const res = await fetch(`/api/profile/lists/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);

    setLoading(false);

    if (res.status === 401) {
      setUnauthorized(true);
      setMsg("Нужно войти в аккаунт");
      return;
    }

    if (!res.ok) {
      setMsg(data?.error || data?.message || "Ошибка удаления");
      return;
    }

    setItem(null);
    setMsg("✅ Удалено из списков");
  }

  if (unauthorized) {
    return (
      <div style={{ opacity: 0.85 }}>
        Войдите, чтобы добавлять в списки.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ opacity: 0.85 }}>
        Статус: <b>{currentLabel}</b>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STATUSES.map((s) => {
          const active = item?.status === s.key;
          return (
            <button
              key={s.key}
              disabled={loading}
              onClick={() => setStatus(s.key)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                color: "inherit",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          );
        })}

        <button
          disabled={loading || !item}
          onClick={removeFromList}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(239, 68, 68, 0.14)",
            color: "inherit",
            fontWeight: 900,
            cursor: item ? "pointer" : "not-allowed",
          }}
        >
          Убрать
        </button>
      </div>

      {msg && <div style={{ opacity: 0.85 }}>{msg}</div>}
    </div>
  );
}
