import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

import { db } from "../server/db";
import { users, readingProgress, comics, chapters } from "../server/db/schema";
import { eq, sql } from "drizzle-orm";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  let continueItems: Array<{
    comicId: number;
    comicTitle: string;
    coverUrl: string | null;
    chapterId: number;
    chapterNumber: number;
    page: number | null;
    totalPages: number; // ✅ всего страниц в главе
  }> = [];

  if (email) {
    const me = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (me) {
      continueItems = await db
        .select({
          comicId: comics.id,
          comicTitle: comics.title,
          coverUrl: sql<string | null>`
            (select image_url from covers c
              where c.comic_id = ${comics.id}
              order by c.is_main desc, c.id asc
              limit 1)
          `,
          chapterId: chapters.id,
          chapterNumber: chapters.chapterNumber,
          page: readingProgress.page,

          // ✅ считаем кол-во страниц в главе (chapter_pages)
          totalPages: sql<number>`
            (select count(*)::int from chapter_pages cp
              where cp.chapter_id = ${chapters.id})
          `,
        })
        .from(readingProgress)
        .innerJoin(comics, eq(readingProgress.comicId, comics.id))
        .innerJoin(chapters, eq(readingProgress.chapterId, chapters.id))
        .where(eq(readingProgress.userId, me.id))
        .orderBy(sql`${readingProgress.updatedAt} desc`)
        .limit(6);
    }
  }

  function pct(page: number, total: number) {
    if (!total || total <= 0) return 0;
    const p = Math.round((page / total) * 100);
    return Math.max(0, Math.min(100, p));
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>Главная</h1>

      {/* Продолжить чтение */}
      {email && (
        <section style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Продолжить чтение</h2>
            <Link href="/catalog" style={{ opacity: 0.85 }}>
              Открыть каталог →
            </Link>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {continueItems.length === 0 ? (
              <div style={{ opacity: 0.75 }}>
                Пока нет прогресса. Открой главу — и я буду показывать кнопку “Продолжить”.
              </div>
            ) : (
              continueItems.map((it) => {
                const curPage = it.page ?? 1;
                const total = it.totalPages ?? 0;
                const progress = pct(curPage, total);

                return (
                  <div
                    key={`${it.comicId}-${it.chapterId}`}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 16,
                      padding: 12,
                      background: "rgba(255,255,255,0.03)",
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 14,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.12)",
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(255,255,255,0.02)",
                        }}
                        aria-hidden
                      >
                        {it.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span>📘</span>
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {it.comicTitle}
                        </div>
                        <div style={{ opacity: 0.75, fontSize: 12 }}>
                          Глава {it.chapterNumber}
                          {total > 0 ? ` • стр. ${curPage}/${total}` : curPage ? ` • стр. ${curPage}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* ✅ Полоска прогресса */}
                    <div
                      style={{
                        height: 10,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                        overflow: "hidden",
                      }}
                      aria-label="Прогресс чтения"
                      title={total > 0 ? `${progress}%` : "Нет данных о страницах"}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${total > 0 ? progress : 0}%`,
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.22)",
                          transition: "width .2s ease",
                        }}
                      />
                    </div>

                    <Link
                      href={`/comics/${it.comicId}/chapters/${it.chapterId}?page=${curPage}`}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        textDecoration: "none",
                        color: "inherit",
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      Продолжить
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Гостю показываем CTA */}
      {!email && (
        <section style={{ marginTop: 18 }}>
          <p style={{ opacity: 0.8 }}>
            Открой каталог, чтобы выбрать мангу. Войдите, чтобы сохранять прогресс и продолжать с места остановки.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/catalog"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Перейти в каталог
            </Link>
            <Link
              href="/auth/register"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Регистрация
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
