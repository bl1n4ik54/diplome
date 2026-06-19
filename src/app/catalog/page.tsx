import Link from "next/link";
import { getServerSession } from "next-auth";
import { eq, sql } from "drizzle-orm";

import { authOptions } from "../api/auth/[...nextauth]/route";
import { db } from "../../server/db";
import { comics, authors } from "../../server/db/schema";
import CatalogGrid from "./CatalogGrid";

const CATALOG_PAGE_SIZE = 24;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim().toLowerCase();

  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "user";
  const isAdmin = role === "admin";

  const whereSql =
    q.length > 0
      ? sql`(lower(${comics.title}) like ${"%" + q + "%"} or lower(${authors.name}) like ${"%" + q + "%"})`
      : sql`true`;

  const [itemRows, totalRows] = await Promise.all([
    db
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
      .orderBy(sql`${comics.createdAt} desc`, sql`${comics.id} desc`)
      .limit(CATALOG_PAGE_SIZE + 1),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(comics)
      .innerJoin(authors, eq(comics.authorId, authors.id))
      .where(whereSql),
  ]);

  const items = itemRows.slice(0, CATALOG_PAGE_SIZE);
  const hasMore = itemRows.length > CATALOG_PAGE_SIZE;
  const totalItems = Number(totalRows[0]?.total ?? items.length);

  return (
    <div className="mw-page">
      <section className="mw-hero">
        <div className="mw-container">
          <div className="mw-heroTop">
            <div style={{ display: "grid", gap: 10 }}>
              <div className="mw-pill">📚 Каталог</div>
              <h1 className="mw-h1">
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
              <div style={{ flex: 1, minWidth: "min(240px, 100%)" }}>
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
              {q ? `Найдено: ${totalItems}` : `Всего тайтлов: ${totalItems}`}
            </div>
          </div>

          <div className="mw-row">
            <span className="mw-badge">★ рейтинг</span>
            <span className="mw-badge">📖 главы</span>
          </div>
        </div>

        <CatalogGrid initialItems={items} initialHasMore={hasMore} query={q} />
      </main>
    </div>
  );
}
