import Link from "next/link";
import { getServerSession } from "next-auth";
import { eq, sql } from "drizzle-orm";

import { authOptions } from "../api/auth/[...nextauth]/route";
import { db } from "../../server/db";
import { comics, authors } from "../../server/db/schema";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim().toLowerCase();

  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role ?? "user";
  const isAdmin = role === "admin";

  const whereSql =
    q.length > 0
      ? sql`(lower(${comics.title}) like ${"%" + q + "%"} or lower(${authors.name}) like ${"%" + q + "%"})`
      : sql`true`;

  const items = await db
    .select({
      id: comics.id,
      title: comics.title,
      status: comics.status,
      releaseYear: comics.releaseYear,
      rating: comics.rating,
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
    })
    .from(comics)
    .innerJoin(authors, eq(comics.authorId, authors.id))
    .where(whereSql)
    .orderBy(sql`${comics.createdAt} desc`);

  return (
    <div className="mw-page">
      <section className="mw-hero">
        <div className="mw-container">
          <div className="mw-heroTop">
            <div style={{ display: "grid", gap: 10 }}>
              <div className="mw-pill">📚 Каталог</div>
              <h1 className="mw-h1" style={{ fontSize: 40 }}>
                Каталог MangaWorld
              </h1>
              <div className="mw-subtitle">
                Быстрый поиск по названию и автору. Открой карточку тайтла и начинай читать.
              </div>
            </div>

            <div className="mw-actions">
              {isAdmin ? (
                <Link className="mw-btn mw-btnPrimary" href="/catalog/add">
                  + Добавить мангу
                </Link>
              ) : null}
              <Link className="mw-btn" href="/">
                На главную
              </Link>
            </div>
          </div>

          <div className="mw-cardFlat" style={{ marginTop: 16 }}>
            <form action="/catalog" method="GET" className="mw-row">
              <div style={{ flex: 1, minWidth: 240 }}>
                <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
                  ПОИСК
                </div>
                <input
                  name="q"
                  defaultValue={sp?.q ?? ""}
                  placeholder="Название или автор…"
                  className="mw-input"
                />
              </div>

              <button type="submit" className="mw-btn" style={{ marginTop: 18 }}>
                Найти →
              </button>

              {q ? (
                <Link className="mw-btn" href="/catalog" style={{ marginTop: 18 }}>
                  Сбросить
                </Link>
              ) : null}
            </form>

            <hr className="mw-divider" style={{ margin: "14px 0" }} />

            <div className="mw-muted2">
              Подсказка: в карточке тайтла можно начать чтение, а прогресс будет сохраняться автоматически.
            </div>
          </div>
        </div>
      </section>

      <main className="mw-container mw-main">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
          <div>
            <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
              РЕЗУЛЬТАТЫ
            </div>
            <div className="mw-title" style={{ marginTop: 6 }}>
              {q ? `Найдено: ${items.length}` : `Всего тайтлов: ${items.length}`}
            </div>
          </div>

          <div className="mw-row">
            <span className="mw-badge">★ рейтинг</span>
            <span className="mw-badge">❤ избранное</span>
            <span className="mw-badge">📖 главы</span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mw-cardFlat">
            <div className="mw-title">Ничего не найдено</div>
            <div className="mw-subtitle">Попробуй изменить запрос или сбросить фильтр.</div>
          </div>
        ) : (
          <div className="mw-gridCards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            {items.map((it) => (
              <Link
                key={it.id}
                href={`/comics/${it.id}`}
                className="mw-cardLink"
                style={{ padding: 12, borderRadius: 22 }}
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
                  {it.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 18, opacity: 0.85 }}>📘</span>
                  )}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {it.title}
                  </div>

                  <div className="mw-muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {it.authorName}
                    {it.releaseYear ? ` • ${it.releaseYear}` : ""}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {it.status ? <span className="mw-badge">{it.status}</span> : null}
                    <span className="mw-badge">★ {typeof it.rating === "number" ? it.rating.toFixed(1) : "—"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}