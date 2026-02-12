"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PageItem = { pageNumber: number; imageUrl: string };
type ChapterNav = { id: number; chapterNumber: number; title: string | null };

export default function ReaderClient({
  comicId,
  chapterId,
  pages,
  initialPage,
  nextChapterHref,
  chaptersNav,
}: {
  comicId: number;
  chapterId: number;
  pages: PageItem[];
  initialPage: number;
  nextChapterHref: string | null;
  chaptersNav: ChapterNav[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const total = pages.length;

  const clamp = (n: number) => {
    if (total <= 0) return 1;
    return Math.min(Math.max(1, n), total);
  };

  const [page, setPage] = useState(clamp(initialPage));

  // --- refs для стабильного keydown listener
  const pageRef = useRef(page);
  const totalRef = useRef(total);
  const nextHrefRef = useRef<string | null>(nextChapterHref);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  useEffect(() => {
    nextHrefRef.current = nextChapterHref ?? null;
  }, [nextChapterHref]);

  // синхронизация с URL (back/forward)
  useEffect(() => {
    const sp = Number(searchParams.get("page") ?? "1") || 1;
    setPage(clamp(sp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, total]);

  const current = useMemo(() => {
    if (total === 0) return null;
    return pages.find((p) => p.pageNumber === page) ?? pages[page - 1] ?? null;
  }, [pages, page, total]);

  function go(n: number) {
    const next = clamp(n);
    setPage(next);
    router.replace(`?page=${next}`);
  }

  function saveProgressNow(p: number) {
    fetch("/api/reading/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId, chapterId, page: p }),
    }).catch(() => null);
  }

  function pushTo(href: string) {
    saveProgressNow(pageRef.current);
    router.push(href);
  }

  function pushNextChapter() {
    const href = nextHrefRef.current;
    if (!href) return;
    pushTo(href);
  }

  function prev() {
    if (page > 1) go(page - 1);
  }

  function next() {
    if (page < total) {
      go(page + 1);
      return;
    }
    if (page >= total && nextChapterHref) {
      pushNextChapter();
    }
  }

  // ✅ keydown listener один раз
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        const p = pageRef.current;
        if (p > 1) {
          const nextP = p - 1;
          setPage(nextP);
          router.replace(`?page=${nextP}`);
        }
      }

      if (e.key === "ArrowRight") {
        const p = pageRef.current;
        const t = totalRef.current;

        if (p < t) {
          const nextP = p + 1;
          setPage(nextP);
          router.replace(`?page=${nextP}`);
          return;
        }

        if (p >= t && nextHrefRef.current) {
          pushNextChapter();
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // сохраняем прогресс (debounce)
  const tRef = useRef<number | null>(null);
  useEffect(() => {
    if (total === 0) return;

    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => {
      saveProgressNow(page);
    }, 250);

    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [comicId, chapterId, page, total]);

  // --- выпадашка на счётчике
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;

    function onDown(e: MouseEvent) {
      const el = pickerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setPickerOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  function goChapter(chId: number) {
    setPickerOpen(false);
    pushTo(`/comics/${comicId}/chapters/${chId}?page=1`);
  }

  function goPage(p: number) {
    setPickerOpen(false);
    go(p);
  }

  if (total === 0) return null;

  const nextBtnText = page >= total && nextChapterHref ? "След. глава →" : "Стр. →";
  const nextDisabled = page < total ? false : !nextChapterHref;

  return (
    <div className="readerBody">
      <div className="readerControls">
        <button className="readerBtn" onClick={prev} disabled={page <= 1}>
          ← Стр.
        </button>

        {/* ✅ СЧЁТЧИК = кнопка + поповер */}
        <div className="readerPickerWrap" ref={pickerRef}>
          <button
            type="button"
            className="readerCounterBtn"
            onClick={() => setPickerOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            title="Нажми, чтобы перейти на страницу/главу"
          >
            Стр. <b>{page}</b> из <b>{total}</b> ▾
          </button>

          {pickerOpen && (
            <div className="readerPicker">
              <div className="readerPickerTitle">Переход</div>

              <div className="readerPickerRow">
                <div className="readerPickerLabel">Страница</div>
                <select
                  className="readerPickerSelect"
                  value={page}
                  onChange={(e) => goPage(Number(e.target.value))}
                >
                  {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>
                      Стр. {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="readerPickerRow">
                <div className="readerPickerLabel">Глава</div>
                <select
                  className="readerPickerSelect"
                  value={chapterId}
                  onChange={(e) => goChapter(Number(e.target.value))}
                >
                  {chaptersNav.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Глава {ch.chapterNumber}
                      {ch.title ? ` — ${ch.title}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button type="button" className="readerPickerClose" onClick={() => setPickerOpen(false)}>
                Закрыть
              </button>
            </div>
          )}
        </div>

        <button className="readerBtn" onClick={next} disabled={nextDisabled}>
          {nextBtnText}
        </button>
      </div>

      <div className="readerImageBox">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="readerImg" src={current?.imageUrl ?? ""} alt={`Page ${page}`} />
      </div>

      <div className="readerControls bottom">
        <button className="readerBtn" onClick={() => go(1)} disabled={page === 1}>
          В начало
        </button>
        <button className="readerBtn" onClick={() => go(total)} disabled={page === total}>
          В конец
        </button>
      </div>
    </div>
  );
}
