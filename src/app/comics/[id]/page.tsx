import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { and, asc, eq, sql } from "drizzle-orm";

import { authOptions } from "../../api/auth/[...nextauth]/route";
import { db } from "../../../server/db";
import { comics, authors, chapters, comicGenres, genres, users, readingProgress } from "../../../server/db/schema";

import MangaActions from "./MangaActions";
import GenresChips from "./GenresChips";

export default async function MangaPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const p: any = await Promise.resolve(params as any);
  const idStr = String(p?.id ?? "").trim();
  if (!idStr) notFound();

  const comicId = Number(idStr);
  if (!Number.isFinite(comicId)) notFound();

  // --- манга ---
  const rows = await db
    .select({
      id: comics.id,
      title: comics.title,
      description: comics.description,
      rating: comics.rating,
      releaseYear: comics.releaseYear,
      status: comics.status,
      authorName: authors.name,

      // ✅ обложка: главная из covers для каждой манги (не одинаковая)
      coverUrl: sql<string | null>`
        coalesce(
          (select image_url from covers c
            where c.comic_id = ${comics.id}
            order by c.is_main desc, c.id asc
            limit 1),
          ${comics.coverUrl}
        )
      `,
    })
    .from(comics)
    .innerJoin(authors, eq(comics.authorId, authors.id))
    .where(eq(comics.id, comicId))
    .limit(1);

  if (rows.length === 0) notFound();
  const comic = rows[0];

  // --- жанры ---
  const genreRows = await db
    .select({ name: genres.name })
    .from(comicGenres)
    .innerJoin(genres, eq(comicGenres.genreId, genres.id))
    .where(eq(comicGenres.comicId, comicId));

  // --- главы ---
  const chapterRows = await db
    .select({ id: chapters.id, title: chapters.title, number: chapters.chapterNumber })
    .from(chapters)
    .where(eq(chapters.comicId, comicId))
    .orderBy(asc(chapters.chapterNumber));

  const firstChapter = chapterRows[0] ?? null;

  // --- прогресс (для кнопки "Продолжить") ---
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  let continueChapterId: number | null = null;
  let continuePage: number | null = null;

  if (email) {
    const me = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (me) {
      const rp = await db.query.readingProgress.findFirst({
        where: and(eq(readingProgress.userId, me.id), eq(readingProgress.comicId, comicId)),
      });

      if (rp) {
        continueChapterId = rp.chapterId;
        continuePage = (rp.page ?? 1) as number;
      }
    }
  }

  const continueHref =
    continueChapterId ? `/comics/${comicId}/chapters/${continueChapterId}?page=${continuePage ?? 1}` : null;

  const startHref = firstChapter ? `/comics/${comicId}/chapters/${firstChapter.id}?page=1` : null;

  const ratingText = typeof comic.rating === "number" && comic.rating > 0 ? comic.rating.toFixed(1) : "—";

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <Link href="/catalog" style={{ textDecoration: "none", opacity: 0.85 }}>
        ← Назад в каталог
      </Link>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>
        {/* ЛЕВАЯ: обложка + чтение */}
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.03)",
              aspectRatio: "3 / 4",
            }}
          >
            {comic.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={comic.coverUrl} alt={comic.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", opacity: 0.7 }}>
                📘
              </div>
            )}
          </div>

          {continueHref ? (
            <>
              <Link
                href={continueHref}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: 950,
                  textAlign: "center",
                }}
              >
                Продолжить чтение
              </Link>

              {startHref && (
                <Link
                  href={startHref}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    textDecoration: "none",
                    color: "inherit",
                    fontWeight: 900,
                    textAlign: "center",
                    opacity: 0.9,
                  }}
                >
                  Читать с начала
                </Link>
              )}
            </>
          ) : startHref ? (
            <Link
              href={startHref}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.16)",
                textDecoration: "none",
                color: "inherit",
                fontWeight: 900,
                textAlign: "center",
              }}
            >
              Читать
            </Link>
          ) : (
            <button
              disabled
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.55)",
                fontWeight: 900,
                textAlign: "center",
                cursor: "not-allowed",
              }}
            >
              Читать (нет глав)
            </button>
          )}
        </div>

        {/* ПРАВАЯ: инфо */}
        <div style={{ display: "grid", gap: 10 }}>
          <h1 style={{ margin: 0 }}>{comic.title}</h1>

          <div style={{ opacity: 0.85 }}>
            Автор: <b>{comic.authorName}</b>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.85 }}>
            <span>
              Рейтинг: <b>{ratingText}</b>
            </span>
            {comic.releaseYear ? (
              <span>
                Год: <b>{comic.releaseYear}</b>
              </span>
            ) : null}
            {comic.status ? (
              <span>
                Статус: <b>{comic.status}</b>
              </span>
            ) : null}
          </div>

          {/* ✅ ЖАНРЫ: максимум 8 + "+ ещё (N)" */}
          <GenresChips genres={genreRows.map((g) => g.name)} limit={8} />

          <div style={{ marginTop: 6 }}>
            <MangaActions comicId={comicId} />
          </div>

          <div style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.5 }}>
            {comic.description ?? "Описание отсутствует."}
          </div>
        </div>
      </div>

      <section style={{ marginTop: 22 }}>
        <h2 style={{ margin: "0 0 10px 0" }}>Главы</h2>

        {chapterRows.length === 0 ? (
          <div style={{ opacity: 0.75 }}>Пока нет глав.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {chapterRows.map((ch) => {
              const isContinue = continueChapterId === ch.id;

              return (
                <Link
                  key={ch.id}
                  href={`/comics/${comicId}/chapters/${ch.id}?page=1`}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: isContinue ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontWeight: 800 }}>
                    Глава {ch.number}
                    {ch.title ? ` — ${ch.title}` : ""}
                    {isContinue ? (
                      <span style={{ marginLeft: 10, opacity: 0.8, fontWeight: 900 }}>
                        • продолжить (стр. {continuePage ?? 1})
                      </span>
                    ) : null}
                  </span>

                  <span style={{ opacity: 0.7 }}>→</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
