"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type ChapterListItem = {
  id: number;
  title: string | null;
  chapterNumber: number;
  createdAt: string | null;
};

type ChaptersResponse = {
  items?: ChapterListItem[];
  hasMore?: boolean;
};

const PAGE_SIZE = 30;
const chapterDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
});

function formatChapterDate(value: string | null) {
  if (!value) return "Нет даты";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Нет даты";

  return chapterDateFormatter.format(date);
}

function chapterLabel(chapter: ChapterListItem) {
  return `Глава ${chapter.chapterNumber}${chapter.title ? ` - ${chapter.title}` : ""}`;
}

export default function ChaptersList({
  comicId,
  initialItems,
  initialHasMore,
}: {
  comicId: number;
  initialItems: ChapterListItem[];
  initialHasMore: boolean;
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
  }, [comicId, initialHasMore, initialItems]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      offset: String(nextOffset),
      limit: String(PAGE_SIZE),
    });

    try {
      const res = await fetch(`/api/comics/${comicId}/chapters?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load chapters");

      const data = (await res.json()) as ChaptersResponse;
      const nextItems = Array.isArray(data.items) ? data.items : [];

      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...nextItems.filter((item) => !seen.has(item.id))];
      });
      setNextOffset((current) => current + nextItems.length);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setError("Не удалось загрузить главы.");
    } finally {
      setLoading(false);
    }
  }, [comicId, hasMore, loading, nextOffset]);

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

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
      {items.length === 0 ? (
        <div className="mw-muted2">Глав пока нет.</div>
      ) : (
        <div className="mw-gridWide">
          {items.map((ch) => (
            <Link
              key={ch.id}
              href={`/comics/${comicId}/chapters/${ch.id}?page=1`}
              className="mw-cardLink"
              style={{ padding: 12 }}
            >
              <div className="mw-chapterRow">
                <div className="mw-chapterInfo">
                  <div className="mw-chapterName">{chapterLabel(ch)}</div>
                  <div className="mw-muted">{formatChapterDate(ch.createdAt)}</div>
                </div>
                <span className="mw-badge">Открыть -&gt;</span>
              </div>
            </Link>
          ))}
        </div>
      )}

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
