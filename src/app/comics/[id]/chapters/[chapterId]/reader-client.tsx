"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  // sync with url changes
  useEffect(() => {
    setCur(page);
  }, [page]);

  const imgUrl = pages[Math.max(0, cur - 1)] ?? null;
  const canGoPrev = Boolean(prevChapterHref) || cur > 1;
  const canGoNext = Boolean(nextChapterHref) || cur < total;
  const pageOptions = Array.from({ length: total }, (_, index) => index + 1);

  const hrefForPage = (p: number) => `/comics/${comicId}/chapters/${chapterId}?page=${p}`;

  async function saveProgress(p: number) {
    // тихо пытаемся сохранить
    fetch("/api/reading/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId, chapterId, page: p }),
    }).catch(() => null);
  }

  function go(p: number) {
    const nextP = Math.max(1, Math.min(total, p));
    setCur(nextP);
    void saveProgress(nextP);
    router.push(hrefForPage(nextP));
  }

  function goToChapter(nextChapterId: number) {
    if (nextChapterId === chapterId) return;
    void saveProgress(cur);
    router.push(`/comics/${comicId}/chapters/${nextChapterId}?page=1`);
  }

  function next() {
    if (cur < total) {
      go(cur + 1);
      return;
    }
    if (cur >= total && nextChapterHref) {
      void saveProgress(cur);
      router.push(nextChapterHref);
    }
  }

  function prev() {
    if (cur > 1) {
      go(cur - 1);
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
              <h1 className="mw-h1">
                <Link className="readerTitleLink" href={`/comics/${comicId}`}>
                  {comicTitle}
                </Link>
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
            <div className="mw-row readerToolbar" style={{ justifyContent: "space-between" }}>
              <div className="mw-row readerArrowGroup">
                <button type="button" className="mw-btn readerArrowBtn" onClick={prev} disabled={!canGoPrev}>
                  ←
                </button>
                <button type="button" className="mw-btn mw-btnPrimary readerArrowBtn" onClick={next} disabled={!canGoNext}>
                  →
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                  width: "min(340px, 100%)",
                  marginLeft: "auto",
                }}
              >
                <select
                  aria-label="Выбор страницы"
                  className="mw-btn readerSelect"
                  value={cur}
                  onChange={(e) => void go(Number(e.target.value))}
                  style={{
                    width: "100%",
                    minWidth: 0,
                    textAlign: "left",
                    display: "block",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    colorScheme: "dark",
                  }}
                >
                  {pageOptions.map((p) => (
                    <option key={p} value={p}>
                      Стр. {p} из {total}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Выбор главы"
                  className="mw-btn readerSelect"
                  value={chapterId}
                  onChange={(e) => void goToChapter(Number(e.target.value))}
                  style={{
                    width: "100%",
                    minWidth: 0,
                    textAlign: "left",
                    display: "block",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    colorScheme: "dark",
                  }}
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Глава {ch.chapterNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mw-container mw-main" style={{ gap: 14 }}>
        <div className="mw-cardFlat" style={{ padding: 14 }}>
          <div style={{ display: "grid", placeItems: "center", position: "relative" }}>
            {imgUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`page ${cur}`}
                  style={{
                    width: "min(900px, 100%)",
                    height: "auto",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.02)",
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={prev}
                  disabled={!canGoPrev}
                  style={{
                    position: "absolute",
                    inset: "0 auto 0 0",
                    width: "50%",
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    cursor: canGoPrev ? "w-resize" : "default",
                    opacity: 0,
                    touchAction: "manipulation",
                  }}
                />
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={next}
                  disabled={!canGoNext}
                  style={{
                    position: "absolute",
                    inset: "0 0 0 auto",
                    width: "50%",
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    cursor: canGoNext ? "e-resize" : "default",
                    opacity: 0,
                    touchAction: "manipulation",
                  }}
                />
              </>
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
