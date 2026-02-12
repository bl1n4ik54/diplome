import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { db } from "../../../../../server/db";
import { comics, chapters } from "../../../../../server/db/schema";
import AddChapterForm from "./AddChapterForm";

export default async function AdminAddChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ важно
  const comicId = Number(id);
  if (!comicId) return notFound();

  const comic = await db.query.comics.findFirst({ where: eq(comics.id, comicId) });
  if (!comic) return notFound();

  const chapterList = await db
    .select({ chapterNumber: chapters.chapterNumber })
    .from(chapters)
    .where(eq(chapters.comicId, comicId))
    .orderBy(asc(chapters.chapterNumber));

  const lastNum = chapterList.length ? chapterList[chapterList.length - 1].chapterNumber : 0;
  const suggested = (lastNum ?? 0) + 1;

  return (
    <div className="admin-wrap">
      <div className="admin-top">
        <div>
          <div style={{ fontWeight: 950, fontSize: 18 }}>Добавить главу</div>
          <div style={{ opacity: 0.8, marginTop: 4 }}>
            Манга: <b>{comic.title}</b> (ID: {comicId})
          </div>
        </div>

        <div className="admin-nav">
          <Link className="admin-link" href="/admin/comics">
            ← Назад
          </Link>
          <Link className="admin-link" href={`/comics/${comicId}`}>
            Открыть мангу →
          </Link>
        </div>
      </div>

      <div className="admin-card">
        <AddChapterForm comicId={comicId} suggestedNumber={suggested} />
      </div>
    </div>
  );
}
