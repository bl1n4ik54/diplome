"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type CatalogItem = {
  id: number;
  title: string;
  status: string | null;
  releaseYear: number | null;
  rating: number | null;
  authorName: string;
  coverUrl: string | null;
};

type CatalogResponse = {
  items?: CatalogItem[];
  hasMore?: boolean;
};

const PAGE_SIZE = 24;

function CatalogCard({ item }: { item: CatalogItem }) {
  return (
    <Link
      href={`/comics/${item.id}`}
      className="mw-cardLink"
      style={{ padding: 12, borderRadius: 22 }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.02)",
          display: "grid",
          placeItems: "center",
        }}
        aria-hidden
      >
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 18, opacity: 0.85 }}>M</span>
        )}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </div>

        <div className="mw-muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.authorName}
          {item.releaseYear ? ` | ${item.releaseYear}` : ""}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {item.status ? <span className="mw-badge">{item.status}</span> : null}
          <span className="mw-badge">* {typeof item.rating === "number" ? item.rating.toFixed(1) : "-"}</span>
        </div>
      </div>
    </Link>
  );
}

export default function CatalogGrid({
  initialItems,
  initialHasMore,
  query,
}: {
  initialItems: CatalogItem[];
  initialHasMore: boolean;
  query: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setHasMore(initialHasMore);
    setNextOffset(initialItems.length);
    setLoading(false);
    setError(null);
  }, [initialHasMore, initialItems, query]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      offset: String(nextOffset),
      limit: String(PAGE_SIZE),
    });

    if (query) params.set("q", query);

    try {
      const res = await fetch(`/api/catalog?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load catalog page");

      const data = (await res.json()) as CatalogResponse;
      const nextItems = Array.isArray(data.items) ? data.items : [];

      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...nextItems.filter((item) => !seen.has(item.id))];
      });
      setNextOffset((current) => current + nextItems.length);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Не удалось загрузить следующую страницу.");
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, nextOffset, query]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "360px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (items.length === 0) {
    return (
      <div className="mw-cardFlat">
        <div className="mw-title">Ничего не найдено</div>
        <div className="mw-subtitle">Попробуй изменить запрос или сбросить фильтр.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="mw-gridCompact">
        {items.map((item) => (
          <CatalogCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore || error ? (
        <div ref={sentinelRef} className="mw-row" style={{ justifyContent: "center", paddingTop: 4 }}>
          {hasMore ? (
            <button type="button" className="mw-btn" onClick={() => void loadMore()} disabled={loading}>
              {loading ? "Загрузка..." : error ? "Попробовать еще" : "Показать еще"}
            </button>
          ) : null}
          {error ? <span className="mw-muted2">{error}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
