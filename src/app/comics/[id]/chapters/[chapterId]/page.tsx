import { notFound } from "next/navigation";
import { eq, asc, sql } from "drizzle-orm";

import { db } from "../../../../../server/db";
import { comics, authors, chapters } from "../../../../../server/db/schema";
import { chapterPages } from "../../../../../server/db/schema"; // должно существовать в твоей схеме

import ReaderClient from "./reader-client";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; chapterId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id, chapterId } = await params;
  const sp = await searchParams;

  const comicId = Number(id);
  const chId = Number(chapterId);
  const page = Math.max(1, Number(sp?.page ?? "1") || 1);

  if (!Number.isFinite(comicId) || !Number.isFinite(chId)) return notFound();

  const comic = await db
    .select({
      id: comics.id,
      title: comics.title,
      authorName: authors.name,
    })
    .from(comics)
    .innerJoin(authors, eq(comics.authorId, authors.id))
    .where(eq(comics.id, comicId))
    .limit(1);

  if (!comic[0]) return notFound();

  const chapter = await db.query.chapters.findFirst({
    where: eq(chapters.id, chId),
  });
  if (!chapter || chapter.comicId !== comicId) return notFound();

  const pagesRows = await db
    .select({
      pageNumber: chapterPages.pageNumber,
      imageUrl: chapterPages.imageUrl,
    })
    .from(chapterPages)
    .where(eq(chapterPages.chapterId, chId))
    .orderBy(asc(chapterPages.pageNumber));

  const pages = pagesRows.map((x) => x.imageUrl).filter(Boolean);
  const total = pages.length || 1;
  const safePage = Math.min(page, total);

  // список глав для выпадающего
  const allChapters = await db
    .select({ id: chapters.id, chapterNumber: chapters.chapterNumber })
    .from(chapters)
    .where(eq(chapters.comicId, comicId))
    .orderBy(asc(chapters.chapterNumber));

  const idx = allChapters.findIndex((x) => x.id === chId);
  const prev = idx > 0 ? allChapters[idx - 1] : null;
  const next = idx >= 0 && idx < allChapters.length - 1 ? allChapters[idx + 1] : null;

  const prevChapterHref = prev ? `/comics/${comicId}/chapters/${prev.id}?page=1` : null;
  const nextChapterHref = next ? `/comics/${comicId}/chapters/${next.id}?page=1` : null;

  return (
    <ReaderClient
      comicId={comicId}
      comicTitle={comic[0].title}
      authorName={comic[0].authorName}
      chapterId={chId}
      chapterNumber={chapter.chapterNumber}
      pages={pages}
      page={safePage}
      total={total}
      chapters={allChapters}
      prevChapterHref={prevChapterHref}
      nextChapterHref={nextChapterHref}
    />
  );
}