import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { eq, sql, desc, asc, and } from "drizzle-orm";

import { authOptions } from "../../api/auth/[...nextauth]/route";
import { db } from "../../../server/db";
import {
  comics,
  authors,
  chapters,
  comicGenres,
  genres,
  favorites,
  readingProgress,
} from "../../../server/db/schema";

import FavoriteButton from "./FavoriteButton";
import MangaActions from "./MangaActions";
import GenresChips from "./GenresChips";

export default async function ComicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comicId = Number(id);
  if (!Number.isFinite(comicId)) return notFound();

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const role = (session?.user as any)?.role ?? "user";
  const isAdmin = role === "admin";

  const comic = await db
    .select({
      id: comics.id,
      title: comics.title,
      description: comics.description,
      status: comics.status,
      releaseYear: comics.releaseYear,
      rating: comics.rating,
      coverUrl: sql<string | null>`
        coalesce(
          (select image_url from covers c
            where c.comic_id = ${comics.id}
            order by c.is_main desc, c.id asc
            limit 1),
          ${comics.coverUrl}
        )
      `,
      authorName: authors.name,
    })
    .from(comics)
    .innerJoin(authors, eq(comics.authorId, authors.id))
    .where(eq(comics.id, comicId))
    .limit(1);

  if (!comic[0]) return notFound();

  const gRows = await db
    .select({ name: genres.name })
    .from(comicGenres)
    .innerJoin(genres, eq(comicGenres.genreId, genres.id))
    .where(eq(comicGenres.comicId, comicId))
    .orderBy(asc(genres.name));

  const chaptersRows = await db
    .select({
      id: chapters.id,
      title: chapters.title,
      chapterNumber: chapters.chapterNumber,
      createdAt: chapters.createdAt,
    })
    .from(chapters)
    .where(eq(chapters.comicId, comicId))
    .orderBy(asc(chapters.chapterNumber));

  const firstChapter = chaptersRows[0] ?? null;

  // favorite initial
  let initialFav = false;

  // continue reading link
  let continueHref: string | null = null;

  if (email) {
    const me = await db.query.users.findFirst({
      where: eq((await import("../../../server/db/schema")).users.email, email),
    });

    if (me) {
      const favRow = await db
        .select({ ok: sql<number>`1` })
        .from(favorites)
        .where(sql`${favorites.userId} = ${me.id} and ${favorites.comicId} = ${comicId}`)
        .limit(1);

      initialFav = favRow.length > 0;

      const prog = await db
        .select({
          chapterId: readingProgress.chapterId,
          page: readingProgress.page,
        })
        .from(readingProgress)
        .where(and(eq(readingProgress.userId, me.id), eq(readingProgress.comicId, comicId)))
        .limit(1);

      if (prog[0]) {
        const chId = prog[0].chapterId;
        const page = prog[0].page ?? 1;
        continueHref = `/comics/${comicId}/chapters/${chId}?page=${page}`;
      }
    }
  }

  const c = comic[0];

  return (
    <div className="mw-page">
      <section className="mw-hero">
        <div className="mw-container">
          <div className="mw-heroTop" style={{ alignItems: "stretch" }}>
            {/* LEFT */}
            <div style={{ display: "grid", gap: 12, maxWidth: 920 }}>
              <div className="mw-pill">📘 Тайтл</div>

              <h1 className="mw-h1" style={{ fontSize: 40 }}>
                {c.title}
              </h1>

              <div className="mw-subtitle">
                {c.authorName}
                {c.releaseYear ? ` • ${c.releaseYear}` : ""}
                {c.status ? ` • ${c.status}` : ""}
              </div>

              {gRows.length > 0 ? (
                <div style={{ marginTop: 6 }}>
                  <GenresChips genres={gRows.map((x) => x.name)} />
                </div>
              ) : (
                <div className="mw-muted2" style={{ marginTop: 6 }}>
                  Жанры не указаны
                </div>
              )}

              <div className="mw-row" style={{ marginTop: 4 }}>
                <span className="mw-badge">★ {typeof c.rating === "number" ? c.rating.toFixed(1) : "—"}</span>
                <span className="mw-badge">Глав: {chaptersRows.length}</span>
                {isAdmin ? <span className="mw-badge">admin</span> : null}
              </div>

              <div className="mw-actions" style={{ marginTop: 10 }}>
                {continueHref ? (
                  <Link className="mw-btn mw-btnPrimary" href={continueHref}>
                    ⏩ Продолжить чтение
                  </Link>
                ) : firstChapter ? (
                  <Link className="mw-btn mw-btnPrimary" href={`/comics/${comicId}/chapters/${firstChapter.id}?page=1`}>
                    ▶ Начать чтение
                  </Link>
                ) : (
                  <span className="mw-muted2">Пока нет глав</span>
                )}

                <Link className="mw-btn" href="/catalog">
                  ← В каталог
                </Link>

                {isAdmin ? (
                  <Link className="mw-btn" href={`/admin/comics/${comicId}`}>
                    🛠️ Редактировать (admin)
                  </Link>
                ) : null}
              </div>

              <div className="mw-cardFlat" style={{ marginTop: 10 }}>
                <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
                  ОПИСАНИЕ
                </div>
                <div style={{ marginTop: 10, opacity: 0.82, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {c.description || "Описание отсутствует."}
                </div>
              </div>
            </div>

            {/* RIGHT POSTER */}
            <div
              className="mw-card"
              style={{
                width: 340,
                maxWidth: "100%",
                height: "fit-content",
                padding: 14,
              }}
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
                {c.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 24, opacity: 0.85 }}>📘</span>
                )}
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {email ? (
                  <FavoriteButton comicId={comicId} initial={initialFav} />
                ) : (
                  <Link className="mw-btn" href="/login">
                    ❤ Войти, чтобы добавлять в избранное
                  </Link>
                )}

                <MangaActions comicId={comicId} isAuthed={Boolean(email)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mw-container mw-main">
        <section className="mw-cardFlat">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
            <div>
              <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
                ГЛАВЫ
              </div>
              <div className="mw-title" style={{ marginTop: 6 }}>
                Список глав
              </div>
              <div className="mw-subtitle" style={{ marginTop: 8 }}>
                Нажми на главу — откроется читалка. Прогресс сохранится автоматически.
              </div>
            </div>

            {firstChapter ? (
              <Link className="mw-btn mw-btnPrimary" href={`/comics/${comicId}/chapters/${firstChapter.id}?page=1`}>
                Читать с начала →
              </Link>
            ) : null}
          </div>

          <div className="mw-gridWide" style={{ marginTop: 14 }}>
            {chaptersRows.length === 0 ? (
              <div className="mw-muted2">Глав пока нет.</div>
            ) : (
              chaptersRows.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/comics/${comicId}/chapters/${ch.id}?page=1`}
                  className="mw-cardLink"
                  style={{ padding: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Глава {ch.chapterNumber}
                        {ch.title ? ` — ${ch.title}` : ""}
                      </div>
                      <div className="mw-muted">
                        {ch.createdAt ? new Date(ch.createdAt as any).toLocaleDateString("ru-RU") : "—"}
                      </div>
                    </div>
                    <span className="mw-badge">Открыть →</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}