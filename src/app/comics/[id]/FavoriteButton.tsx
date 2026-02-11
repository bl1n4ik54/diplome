"use client";

// UI: кнопка "Любимые" (избранное)
import { useState } from "react";

export default function FavoriteButton({
  comicId,
  initial,
}: {
  comicId: number;
  initial: boolean;
}) {
  const [favorited, setFavorited] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) return;
    setFavorited(Boolean(data?.favorited));
  }

  return (
    <button onClick={toggle} disabled={loading} style={favorited ? btnOn : btnOff}>
      {favorited ? "❤ В любимых" : "♡ В любимые"}
    </button>
  );
}

const btnOff: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 800,
};

const btnOn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(236, 72, 153, 0.18)",
  color: "inherit",
  cursor: "pointer",
  fontWeight: 900,
};
