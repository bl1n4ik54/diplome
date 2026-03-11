"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ChapterItem = { id: number; chapterNumber: number };

export default function ReaderClient({
  comicId,
  comicTitle,
  authorName,
  chapterId,
  chapterNumber,
  pages,
  page,
  total,
  chapters,
  prevChapterHref,
  nextChapterHref,
}: {
  comicId: number;
  comicTitle: string;
  authorName: string | null;
  chapterId: number;
  chapterNumber: number;
  pages: string[];
  page: number;
  total: number;
  chapters: ChapterItem[];
  prevChapterHref: string | null;
  nextChapterHref: string | null;
}) {
  const router = useRouter();

  const [cur, setCur] = useState(page);
  const [openChapters, setOpenChapters] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // sync with url changes
  useEffect(() => {
    setCur(page);
  }, [page]);

  // close dropdown on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpenChapters(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const imgUrl = pages[Math.max(0, cur - 1)] ?? null;

  const hrefForPage = (p: number) => `/comics/${comicId}/chapters/${chapterId}?page=${p}`;

  async function saveProgress(p: number) {
    // тихо пытаемся сохранить
    fetch("/api/reading/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId, chapterId, page: p }),
    }).catch(() => null);
  }

  async function go(p: number) {
    const nextP = Math.max(1, Math.min(total, p));
    setCur(nextP);
    await saveProgress(nextP);
    router.push(hrefForPage(nextP));
  }

  async function next() {
    if (cur < total) {
      await go(cur + 1);
      return;
    }
    if (cur >= total && nextChapterHref) {
      await saveProgress(cur);
      router.push(nextChapterHref);
    }
  }

  async function prev() {
    if (cur > 1) {
      await go(cur - 1);
      return;
    }
    if (cur <= 1 && prevChapterHref) {
      router.push(prevChapterHref);
    }
  }

  // keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") setOpenChapters(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur, total, nextChapterHref, prevChapterHref]);

  return (
    <div className="mw-page">
      <section className="mw-hero" style={{ paddingBottom: 10 }}>
        <div className="mw-container">
          <div className="mw-heroTop">
            <div style={{ display: "grid", gap: 8 }}>
              <div className="mw-pill">📖 Читалка</div>
              <h1 className="mw-h1" style={{ fontSize: 34 }}>
                {comicTitle}
              </h1>
              <div className="mw-subtitle">
                {authorName ? `${authorName} • ` : ""}Глава {chapterNumber}
              </div>
            </div>

            <div className="mw-actions">
              <Link className="mw-btn" href={`/comics/${comicId}`}>
                ← К тайтлу
              </Link>
              <Link className="mw-btn" href="/catalog">
                Каталог
              </Link>
            </div>
          </div>

          {/* top bar */}
          <div className="mw-cardFlat" style={{ marginTop: 12 }}>
            <div className="mw-row" style={{ justifyContent: "space-between" }} ref={wrapRef}>
              <div className="mw-row">
                <button className="mw-btn" onClick={prev} disabled={!prevChapterHref && cur === 1}>
                  ←
                </button>
                <button className="mw-btn mw-btnPrimary" onClick={next} disabled={!nextChapterHref && cur === total}>
                  →
                </button>
              </div>

              {/* page counter (opens chapter dropdown) */}
              <button
                className="mw-btn"
                onClick={() => setOpenChapters((v) => !v)}
                style={{ position: "relative" }}
                type="button"
              >
                Стр. {cur}/{total} • Глава {chapterNumber} ▾
              </button>

              {openChapters ? (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 14,
                    width: 320,
                    maxHeight: 320,
                    overflow: "auto",
                    background: "#0A0A0F",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 16,
                    padding: 10,
                    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
                    zIndex: 50,
                  }}
                >
                  <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2, marginBottom: 8 }}>
                    ВЫБОР ГЛАВЫ
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {chapters.map((ch) => (
                      <Link
                        key={ch.id}
                        href={`/comics/${comicId}/chapters/${ch.id}?page=1`}
                        className="mw-cardLink"
                        style={{
                          padding: 10,
                          borderRadius: 14,
                          background: ch.id === chapterId ? "rgba(236,72,153,0.12)" : "rgba(255,255,255,0.02)",
                        }}
                        onClick={() => setOpenChapters(false)}
                      >
                        Глава {ch.chapterNumber}
                      </Link>
                    ))}
                  </div>

                  <button className="mw-btn" style={{ marginTop: 10, width: "100%" }} onClick={() => setOpenChapters(false)}>
                    Закрыть
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="mw-container mw-main" style={{ gap: 14 }}>
        <div className="mw-cardFlat" style={{ padding: 14 }}>
          <div style={{ display: "grid", placeItems: "center" }}>
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt={`page ${cur}`}
                style={{
                  width: "min(900px, 100%)",
                  height: "auto",
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.02)",
                }}
              />
            ) : (
              <div className="mw-muted2">Нет страницы</div>
            )}
          </div>

          <div className="mw-muted2" style={{ marginTop: 10, lineHeight: 1.6 }}>
            Подсказка: стрелки клавиатуры ← → листают страницы. В конце главы → перейдёт на следующую главу (если есть).
          </div>
        </div>
      </main>
    </div>
  );
}