"use client";

import { useMemo, useState } from "react";

export default function GenresChips({
  genres,
  limit = 8,
}: {
  genres: string[];
  limit?: number;
}) {
  const [open, setOpen] = useState(false);

  const cleaned = useMemo(() => {
    return (genres ?? [])
      .map((g) => String(g).trim())
      .filter(Boolean);
  }, [genres]);

  const total = cleaned.length;
  const hasMore = total > limit;

  const visible = open ? cleaned : cleaned.slice(0, limit);
  const remaining = hasMore ? total - limit : 0;

  if (total === 0) return <span style={{ opacity: 0.7 }}>Жанры не указаны</span>;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {visible.map((name) => (
        <span
          key={name}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            fontSize: 12,
            fontWeight: 700,
            opacity: 0.9,
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </span>
      ))}

      {hasMore && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          + ещё ({remaining})
        </button>
      )}

      {hasMore && open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            fontSize: 12,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Свернуть
        </button>
      )}
    </div>
  );
}
