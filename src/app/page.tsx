import Link from "next/link";
import { getServerSession } from "next-auth";
import { eq, sql } from "drizzle-orm";

import { authOptions } from "./api/auth/[...nextauth]/route";
import { db } from "../server/db";
import { users, comics, authors, chapters, readingProgress, favorites } from "../server/db/schema";

// Клиентские компоненты (импортируем)
import { CardLink } from "../app/components/main-page-client/CardLink";
import { Badge } from "../app/components/main-page-client/Badge";
import { Section } from "../app/components/main-page-client/Section";

// Типы и утилиты (можно оставить здесь)
type ContinueItem = {
  comicId: number;
  comicTitle: string;
  authorName: string | null;
  coverUrl: string | null;
  chapterId: number;
  chapterNumber: number;
  page: number | null;
  totalPages: number;
};

type ComicCard = {
  id: number;
  title: string;
  authorName: string | null;
  coverUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  favCount: number;
  releaseYear: number | null;
  status: string | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pct(page: number, total: number) {
  if (!total || total <= 0) return 0;
  return clamp(Math.round((page / total) * 100), 0, 100);
}

function fmtRating(avg: number | null, count: number) {
  if (!avg || count <= 0) return "—";
  return `${avg.toFixed(1)} (${count})`;
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const role = (session?.user as any)?.role ?? "user";

  // --- Данные для "Продолжить чтение"
  let continueItems: ContinueItem[] = [];

  if (email) {
    const me = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (me) {
      continueItems = await db
        .select({
          comicId: comics.id,
          comicTitle: comics.title,
          authorName: authors.name,

          coverUrl: sql<string | null>`
            coalesce(
              (select image_url from covers c
                where c.comic_id = ${comics.id}
                order by c.is_main desc, c.id asc
                limit 1),
              ${comics.coverUrl}
            )
          `,

          chapterId: chapters.id,
          chapterNumber: chapters.chapterNumber,
          page: readingProgress.page,

          totalPages: sql<number>`
            (select count(*)::int from chapter_pages cp
              where cp.chapter_id = ${chapters.id})
          `,
        })
        .from(readingProgress)
        .innerJoin(comics, eq(readingProgress.comicId, comics.id))
        .innerJoin(authors, eq(comics.authorId, authors.id))
        .innerJoin(chapters, eq(readingProgress.chapterId, chapters.id))
        .where(eq(readingProgress.userId, me.id))
        .orderBy(sql`${readingProgress.updatedAt} desc`)
        .limit(6);
    }
  }

  // --- Trending (по избранному)
  const trending: ComicCard[] = await db
    .select({
      id: comics.id,
      title: comics.title,
      authorName: authors.name,
      releaseYear: comics.releaseYear,
      status: comics.status,

      coverUrl: sql<string | null>`
        coalesce(
          (select image_url from covers c
            where c.comic_id = ${comics.id}
            order by c.is_main desc, c.id asc
            limit 1),
          ${comics.coverUrl}
        )
      `,

      favCount: sql<number>`(select count(*)::int from favorites f where f.comic_id = ${comics.id})`,
      ratingAvg: sql<number | null>`(select avg(r.value)::float from ratings r where r.comic_id = ${comics.id})`,
      ratingCount: sql<number>`(select count(*)::int from ratings r where r.comic_id = ${comics.id})`,
    })
    .from(comics)
    .innerJoin(authors, eq(comics.authorId, authors.id))
    .orderBy(sql`(select count(*) from favorites f where f.comic_id = ${comics.id}) desc`, sql`${comics.createdAt} desc`)
    .limit(8);

  // --- Новинки
  const newItems: ComicCard[] = await db
    .select({
      id: comics.id,
      title: comics.title,
      authorName: authors.name,
      releaseYear: comics.releaseYear,
      status: comics.status,

      coverUrl: sql<string | null>`
        coalesce(
          (select image_url from covers c
            where c.comic_id = ${comics.id}
            order by c.is_main desc, c.id asc
            limit 1),
          ${comics.coverUrl}
        )
      `,

      favCount: sql<number>`(select count(*)::int from favorites f where f.comic_id = ${comics.id})`,
      ratingAvg: sql<number | null>`(select avg(r.value)::float from ratings r where r.comic_id = ${comics.id})`,
      ratingCount: sql<number>`(select count(*)::int from ratings r where r.comic_id = ${comics.id})`,
    })
    .from(comics)
    .innerJoin(authors, eq(comics.authorId, authors.id))
    .orderBy(sql`${comics.createdAt} desc`)
    .limit(8);

  return (
    <div style={{ background: "#0A0A0F", minHeight: "100vh" }}>
      {/* Hero секция (полностью статичная) */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Фоновое свечение */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(800px 400px at 20% 0%, rgba(139, 92, 246, 0.15), transparent 70%), radial-gradient(800px 400px at 80% 0%, rgba(236, 72, 153, 0.15), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "48px 24px 32px" }}>
          {/* Шапка */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 32 }}>🦊</span>
              <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: -0.5, background: "linear-gradient(135deg, #a78bfa, #f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                MangaWorld
              </span>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              {email ? (
                <>
                  <Link
                    href="/profile"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 40,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      textDecoration: "none",
                      fontWeight: 500,
                      fontSize: 14,
                    }}
                  >
                    Профиль
                  </Link>
                  {role === "admin" && (
                    <Link
                      href="/admin"
                      style={{
                        padding: "8px 16px",
                        borderRadius: 40,
                        background: "rgba(236,72,153,0.15)",
                        border: "1px solid rgba(236,72,153,0.3)",
                        color: "#f9a8d4",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Админка
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 40,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      textDecoration: "none",
                      fontWeight: 500,
                      fontSize: 14,
                    }}
                  >
                    Войти
                  </Link>
                  <Link
                    href="/auth/register"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 40,
                      background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                      border: "none",
                      color: "white",
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: 14,
                      boxShadow: "0 4px 20px rgba(236, 72, 153, 0.3)",
                    }}
                  >
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Заголовок и поиск */}
          <div style={{ maxWidth: 720, marginBottom: 40 }}>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.03, margin: "0 0 20px 0", background: "linear-gradient(135deg, #fff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Читай мангу, сохраняй прогресс, делись с друзьями
            </h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginBottom: 28, maxWidth: 600 }}>
              Тысячи тайтлов, персональные списки, оценки и друзья — всё в одном месте.
            </p>

            {/* Поиск (статичная форма) */}
            <form action="/catalog" method="GET" style={{ display: "flex", gap: 12 }}>
              <input
                name="q"
                placeholder="Поиск по названию или автору..."
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  borderRadius: 60,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(0,0,0,0.3)",
                  backdropFilter: "blur(8px)",
                  color: "white",
                  fontSize: 16,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "14px 32px",
                  borderRadius: 60,
                  border: "none",
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(236, 72, 153, 0.3)",
                }}
              >
                Найти
              </button>
            </form>
          </div>

          {/* Быстрые фичи (карточки) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { icon: "📌", label: "Списки чтения", desc: "Читаю, в планах, прочитано" },
              { icon: "⏩", label: "Прогресс", desc: "Автосохранение страницы" },
              { icon: "🧑‍🤝‍🧑", label: "Друзья", desc: "Смотри, что читают другие" },
              { icon: "⭐", label: "Оценки", desc: "Влияй на рейтинг" },
            ].map((f) => (
              <div
                key={f.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 60px", display: "grid", gap: 24 }}>
        {/* Continue reading */}
        {email && (
          <Section
            title="Продолжить чтение"
            action={
              <Link href="/catalog" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>
                Все тайтлы →
              </Link>
            }
          >
            {continueItems.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                Вы ещё ничего не читали. Перейдите в каталог и начните читать!
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {continueItems.map((it) => {
                  const currentPage = it.page ?? 1;
                  const total = it.totalPages ?? 0;
                  const progressPercent = total > 0 ? pct(currentPage, total) : 0;

                  return (
                    <CardLink
                      key={`${it.comicId}-${it.chapterId}`}
                      href={`/comics/${it.comicId}/chapters/${it.chapterId}?page=${currentPage}`}
                      title={it.comicTitle}
                      subtitle={`${it.authorName ?? "Автор неизвестен"} • Глава ${it.chapterNumber} • стр ${currentPage}/${total}`}
                      coverUrl={it.coverUrl}
                      badges={<Badge icon="⏳">{progressPercent}%</Badge>}
                      progress={progressPercent}
                    />
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* Если не залогинен */}
        {!email && (
          <Section
            title="Добро пожаловать!"
            action={
              <Link href="/catalog" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>
                Каталог →
              </Link>
            }
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ color: "rgba(255,255,255,0.7)" }}>
                Войдите, чтобы сохранять прогресс и списки. Гостям тоже доступен весь каталог.
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Link
                  href="/auth/login"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 40,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 40,
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  Регистрация
                </Link>
              </div>
            </div>
          </Section>
        )}

        {/* Тренды и новинки в две колонки */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <Section
            title="В тренде"
            action={
              <Link href="/catalog?sort=trending" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>
                Все тренды →
              </Link>
            }
          >
            <div style={{ display: "grid", gap: 12 }}>
              {trending.slice(0, 5).map((c) => (
                <CardLink
                  key={c.id}
                  href={`/comics/${c.id}`}
                  title={c.title}
                  subtitle={`${c.authorName ?? "Автор неизвестен"}${c.releaseYear ? ` • ${c.releaseYear}` : ""}`}
                  coverUrl={c.coverUrl}
                  badges={
                    <>
                      <Badge icon="❤️" variant="highlight">
                        {c.favCount}
                      </Badge>
                      <Badge icon="⭐">{fmtRating(c.ratingAvg, c.ratingCount)}</Badge>
                    </>
                  }
                  size="small"
                />
              ))}
            </div>
          </Section>

          <Section
            title="Новинки"
            action={
              <Link href="/catalog?sort=newest" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 14 }}>
                Все новинки →
              </Link>
            }
          >
            <div style={{ display: "grid", gap: 12 }}>
              {newItems.slice(0, 5).map((c) => (
                <CardLink
                  key={c.id}
                  href={`/comics/${c.id}`}
                  title={c.title}
                  subtitle={`${c.authorName ?? "Автор неизвестен"}${c.releaseYear ? ` • ${c.releaseYear}` : ""}`}
                  coverUrl={c.coverUrl}
                  badges={
                    <>
                      <Badge icon="⭐">{fmtRating(c.ratingAvg, c.ratingCount)}</Badge>
                      {c.favCount > 0 && (
                        <Badge icon="❤️" variant="highlight">
                          {c.favCount}
                        </Badge>
                      )}
                    </>
                  }
                  size="small"
                />
              ))}
            </div>
          </Section>
        </div>

        {/* Подвал с подсказкой */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1))",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 32,
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Совет</div>
            <div style={{ color: "rgba(255,255,255,0.6)", maxWidth: 500 }}>
              В читалке можно кликнуть на номер страницы и быстро перейти к нужной главе.
            </div>
          </div>
          <Link
            href="/catalog"
            style={{
              padding: "10px 24px",
              borderRadius: 40,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Каталог →
          </Link>
        </div>
      </main>
    </div>
  );
}