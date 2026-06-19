import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { eq, sql, asc, and } from "drizzle-orm";

import { authOptions } from "../../api/auth/[...nextauth]/route";
import { db } from "../../../server/db";
import {
  comics,
  authors,
  chapters,
  comicGenres,
  genres,
  ratings,
  readingProgress,
  userComicLists,
} from "../../../server/db/schema";

import RatingModal from "./RatingModal";
import MangaActions from "./MangaActions";
import GenresChips from "./GenresChips";
import ChaptersList, { type ChapterListItem } from "./ChaptersList";

export const dynamic = "force-dynamic";

const CHAPTERS_PAGE_SIZE = 30;

function formatRating(avg: number | null, count: number) {
  if (!avg || count <= 0) return "—";
  return `${avg.toFixed(1)} (${count})`;
}

function toIso(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

export default async function ComicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comicId = Number(id);
  if (!Number.isFinite(comicId)) return notFound();

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const role = session?.user?.role ?? "user";
  const isAdmin = role === "admin";

  const comic = await db
    .select({
      id: comics.id,
      title: comics.title,
      description: comics.description,
      status: comics.status,
      releaseYear: comics.releaseYear,
      ratingAvg: sql<number | null>`(select avg(r.value)::float from ratings r where r.comic_id = ${comics.id})`,
      ratingCount: sql<number>`(select count(*)::int from ratings r where r.comic_id = ${comics.id})`,
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

  const [chapterRows, chapterCountRows] = await Promise.all([
    db
      .select({
        id: chapters.id,
        title: chapters.title,
        chapterNumber: chapters.chapterNumber,
        createdAt: chapters.createdAt,
      })
      .from(chapters)
      .where(eq(chapters.comicId, comicId))
      .orderBy(asc(chapters.chapterNumber), asc(chapters.id))
      .limit(CHAPTERS_PAGE_SIZE + 1),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(chapters)
      .where(eq(chapters.comicId, comicId)),
  ]);

  const firstChapter = chapterRows[0] ?? null;
  const chapterCount = Number(chapterCountRows[0]?.total ?? 0);
  const initialChapters: ChapterListItem[] = chapterRows.slice(0, CHAPTERS_PAGE_SIZE).map((ch) => ({
    id: ch.id,
    title: ch.title,
    chapterNumber: ch.chapterNumber,
    createdAt: toIso(ch.createdAt),
  }));
  const hasMoreChapters = chapterRows.length > CHAPTERS_PAGE_SIZE;

  let initialListStatus: "reading" | "planned" | "completed" | "on_hold" | "dropped" | null = null;
  let initialMyRating: number | null = null;

  // continue reading link
  let continueHref: string | null = null;

  if (email) {
    const me = await db.query.users.findFirst({
      where: eq((await import("../../../server/db/schema")).users.email, email),
    });

    if (me) {
      const listRow = await db
        .select({ status: userComicLists.status })
        .from(userComicLists)
        .where(and(eq(userComicLists.userId, me.id), eq(userComicLists.comicId, comicId)))
        .limit(1);

      const listStatus = listRow[0]?.status;
      if (
        listStatus === "reading" ||
        listStatus === "planned" ||
        listStatus === "completed" ||
        listStatus === "on_hold" ||
        listStatus === "dropped"
      ) {
        initialListStatus = listStatus;
      }

      const ratingRow = await db
        .select({ value: ratings.value })
        .from(ratings)
        .where(and(eq(ratings.userId, me.id), eq(ratings.comicId, comicId)))
        .limit(1);

      initialMyRating = ratingRow[0]?.value ?? null;

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

  const readHref = continueHref ?? (firstChapter ? `/comics/${comicId}/chapters/${firstChapter.id}?page=1` : null);
  const c = comic[0];

  return (
    <div className="mw-page">
      <section className="mw-hero">
        <div className="mw-container">
          <div className="mw-heroTop mw-comicHero">
            {/* LEFT */}
            <div className="mw-comicInfo">
              <div className="mw-pill">📘 Тайтл</div>

              <h1 className="mw-h1">
                {c.title}
              </h1>

              <div className="mw-subtitle">
                {c.authorName}
                {c.releaseYear ? ` • ${c.releaseYear}` : ""}
                {c.status ? ` • ${c.status}` : ""}
              </div>

              {gRows.length > 0 ? (
                <div className="mw-comicGenres">
                  <GenresChips genres={gRows.map((x) => x.name)} />
                </div>
              ) : (
                <div className="mw-muted2 mw-comicGenres">
                  Жанры не указаны
                </div>
              )}

              <div className="mw-row mw-comicStats">
                <span className="mw-badge">★ {formatRating(c.ratingAvg, c.ratingCount ?? 0)}</span>
                <span className="mw-badge">Глав: {chapterCount}</span>
                {isAdmin ? <span className="mw-badge">admin</span> : null}
              </div>

              <div className="mw-actions mw-comicActions">
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

                <RatingModal
                  comicId={comicId}
                  isAuthed={Boolean(email)}
                  initialRatingAvg={c.ratingAvg}
                  initialRatingCount={c.ratingCount ?? 0}
                  initialMyRating={initialMyRating}
                />

                {isAdmin ? (
                  <Link className="mw-btn" href={`/admin/comics/${comicId}/add-chapter`}>
                    🛠️ Редактировать (admin)
                  </Link>
                ) : null}
              </div>

              <div className="mw-cardFlat mw-comicDescription">
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
              className="mw-card mw-comicPoster"
              style={{
                height: "fit-content",
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
                {readHref ? (
                  <Link className="mw-btn mw-btnPrimary mw-readCoverBtn" href={readHref}>
                    {continueHref ? "⏩ Читать дальше" : "▶ Начать читать"}
                  </Link>
                ) : (
                  <span className="mw-btn mw-btnDisabled mw-readCoverBtn" aria-disabled="true">
                    Пока нет глав
                  </span>
                )}

                <MangaActions comicId={comicId} isAuthed={Boolean(email)} initialStatus={initialListStatus} />
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

          <ChaptersList comicId={comicId} initialItems={initialChapters} initialHasMore={hasMoreChapters} />
        </section>
      </main>
    </div>
  );
}
