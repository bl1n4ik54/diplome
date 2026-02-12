import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";

import { db } from "../../../../../server/db";
import { comics, chapters, chapterPages } from "../../../../../server/db/schema";
import ReaderClient from "./reader-client";
import "./reader.css";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; chapterId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id, chapterId } = await params;
  const sp = await searchParams;

  const comicIdNum = Number(id);
  const chapterIdNum = Number(chapterId);
  const initialPage = Math.max(1, Number(sp?.page ?? "1") || 1);

  if (!comicIdNum || !chapterIdNum) return notFound();

  const comic = await db.query.comics.findFirst({ where: eq(comics.id, comicIdNum) });
  if (!comic) return notFound();

  const chapter = await db.query.chapters.findFirst({
    where: and(eq(chapters.id, chapterIdNum), eq(chapters.comicId, comicIdNum)),
  });
  if (!chapter) return notFound();

  const pagesDb = await db
    .select({
      pageNumber: chapterPages.pageNumber,
      imageUrl: chapterPages.imageUrl,
    })
    .from(chapterPages)
    .where(eq(chapterPages.chapterId, chapterIdNum))
    .orderBy(asc(chapterPages.pageNumber));

  // список глав для навигации (нужен для выпадашки)
  const allChaps = await db
    .select({ id: chapters.id, chapterNumber: chapters.chapterNumber, title: chapters.title })
    .from(chapters)
    .where(eq(chapters.comicId, comicIdNum))
    .orderBy(asc(chapters.chapterNumber));

  const idx = allChaps.findIndex((c) => c.id === chapterIdNum);
  const prevChapterId = idx > 0 ? allChaps[idx - 1].id : null;
  const nextChapterId = idx >= 0 && idx < allChaps.length - 1 ? allChaps[idx + 1].id : null;

  const nextChapterHref = nextChapterId ? `/comics/${comicIdNum}/chapters/${nextChapterId}?page=1` : null;

  return (
    <div className="readerWrap">
      <div className="readerTop">
        <Link className="readerBack" href={`/comics/${comicIdNum}`}>
          ← Назад к манге
        </Link>

        <div className="readerMeta">
          <div className="readerTitle">{comic.title}</div>
          <div className="readerSub">
            Глава {chapter.chapterNumber}
            {chapter.title ? ` • ${chapter.title}` : ""}
          </div>
        </div>

        <div className="readerChNav">
          {prevChapterId ? (
            <Link className="readerBtn" href={`/comics/${comicIdNum}/chapters/${prevChapterId}?page=1`}>
              ← Пред. глава
            </Link>
          ) : (
            <span className="readerBtn disabled">← Пред. глава</span>
          )}

          {nextChapterId ? (
            <Link className="readerBtn" href={nextChapterHref!}>
              След. глава →
            </Link>
          ) : (
            <span className="readerBtn disabled">След. глава →</span>
          )}
        </div>
      </div>

      <ReaderClient
        comicId={comicIdNum}
        chapterId={chapterIdNum}
        pages={pagesDb}
        initialPage={initialPage}
        nextChapterHref={nextChapterHref}
        chaptersNav={allChaps}
      />

      {pagesDb.length === 0 && (
        <div className="readerEmpty">
          Для этой главы пока нет страниц. Заполни таблицу <code>chapter_pages</code>.
        </div>
      )}
    </div>
  );
}
