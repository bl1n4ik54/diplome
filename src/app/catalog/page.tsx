import Link from "next/link";
import { getServerSession } from "next-auth";
import { asc, eq, sql } from "drizzle-orm";
import { Star } from "lucide-react";

import { authOptions } from "../api/auth/[...nextauth]/route";
import { db } from "../../server/db";
import { comics, authors, genres } from "../../server/db/schema";
import CatalogFilters from "./CatalogFilters";
import CatalogGrid from "./CatalogGrid";

const CATALOG_PAGE_SIZE = 24;

type CatalogSort = "newest" | "rating" | "year";
type CatalogSortDir = "asc" | "desc";
type CatalogSearchParams = {
  q?: string;
  sort?: string;
  dir?: string;
  genre?: string | string[];
  excludeGenre?: string | string[];
};

function readCatalogSort(value: string | undefined): CatalogSort {
  if (value === "rating" || value === "trending") return "rating";
  if (value === "year") return "year";
  return "newest";
}

function readCatalogSortDir(value: string | undefined): CatalogSortDir {
  return value === "asc" ? "asc" : "desc";
}

function readParamValues(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function readGenreIds(value: string | string[] | undefined) {
  const ids = readParamValues(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

  return [...new Set(ids)];
}

function getGenreFilters(sp: CatalogSearchParams) {
  const excludedGenreIds = readGenreIds(sp.excludeGenre);
  const excludedSet = new Set(excludedGenreIds);
  const includedGenreIds = readGenreIds(sp.genre).filter((id) => !excludedSet.has(id));

  return { includedGenreIds, excludedGenreIds };
}

function numberListSql(values: number[]) {
  return sql.join(values.map((value) => sql`${value}`), sql`, `);
}

function getCatalogWhere(q: string, includedGenreIds: number[], excludedGenreIds: number[]) {
  const searchSql =
    q.length > 0
      ? sql`(lower(${comics.title}) like ${"%" + q + "%"} or lower(${authors.name}) like ${"%" + q + "%"})`
      : sql`true`;

  const includedGenresSql =
    includedGenreIds.length > 0
      ? sql`${comics.id} in (
          select cg.comic_id
          from comic_genres cg
          where cg.genre_id in (${numberListSql(includedGenreIds)})
          group by cg.comic_id
          having count(distinct cg.genre_id) = ${includedGenreIds.length}
        )`
      : sql`true`;

  const excludedGenresSql =
    excludedGenreIds.length > 0
      ? sql`not exists (
          select 1
          from comic_genres cg
          where cg.comic_id = ${comics.id}
            and cg.genre_id in (${numberListSql(excludedGenreIds)})
        )`
      : sql`true`;

  return sql`(${searchSql}) and (${includedGenresSql}) and (${excludedGenresSql})`;
}

function getOrderBy(sort: CatalogSort, dir: CatalogSortDir) {
  const order = dir === "asc" ? sql`asc` : sql`desc`;
  const idOrder = dir === "asc" ? sql`${comics.id} asc` : sql`${comics.id} desc`;

  if (sort === "rating") {
    return [
      sql`coalesce(${comics.rating}, 0) ${order}`,
      sql`${comics.createdAt} desc`,
      idOrder,
    ];
  }

  if (sort === "year") {
    return [
      sql`${comics.releaseYear} ${order} nulls last`,
      sql`${comics.createdAt} desc`,
      idOrder,
    ];
  }

  return [sql`${comics.createdAt} ${order}`, idOrder];
}

const sortLabels: Record<CatalogSort, string> = {
  newest: "сначала новые",
  rating: "по рейтингу",
  year: "по году выпуска",
};

const dirLabels: Record<CatalogSortDir, string> = {
  desc: "по убыванию",
  asc: "по возрастанию",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim().toLowerCase();
  const sort = readCatalogSort(sp?.sort);
  const sortDir = readCatalogSortDir(sp?.dir);
  const { includedGenreIds, excludedGenreIds } = getGenreFilters(sp ?? {});

  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "user";
  const isAdmin = role === "admin";

  const whereSql = getCatalogWhere(q, includedGenreIds, excludedGenreIds);
  const orderBy = getOrderBy(sort, sortDir);

  const [itemRows, totalRows, allGenres] = await Promise.all([
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
      .orderBy(...orderBy)
      .limit(CATALOG_PAGE_SIZE + 1),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(comics)
      .innerJoin(authors, eq(comics.authorId, authors.id))
      .where(whereSql),
    db
      .select({ id: genres.id, name: genres.name })
      .from(genres)
      .orderBy(asc(genres.name), asc(genres.id)),
  ]);

  const items = itemRows.slice(0, CATALOG_PAGE_SIZE);
  const hasMore = itemRows.length > CATALOG_PAGE_SIZE;
  const totalItems = Number(totalRows[0]?.total ?? items.length);
  const genreNames = new Map(allGenres.map((genre) => [genre.id, genre.name]));
  const includedGenreNames = includedGenreIds.map((id) => genreNames.get(id)).filter((name): name is string => Boolean(name));
  const excludedGenreNames = excludedGenreIds.map((id) => genreNames.get(id)).filter((name): name is string => Boolean(name));

  return (
    <div className="mw-page">
      <section className="mw-hero">
        <div className="mw-container">
          <div className="mw-heroTop">
            <div style={{ display: "grid", gap: 10 }}>
              <div className="mw-pill">Каталог</div>
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
            <CatalogFilters
              genres={allGenres}
              query={sp?.q ?? ""}
              sort={sort}
              sortDir={sortDir}
              includedGenreIds={includedGenreIds}
              excludedGenreIds={excludedGenreIds}
            />

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
            <span className="mw-badge">Сортировка: {sortLabels[sort]}, {dirLabels[sortDir]}</span>
            <span className="mw-badge"><Star size={13} fill="currentColor" strokeWidth={2.2} /> рейтинг</span>
            <span className="mw-badge">главы</span>
            {includedGenreNames.length > 0 ? <span className="mw-badge">Жанры: {includedGenreNames.join(", ")}</span> : null}
            {excludedGenreNames.length > 0 ? <span className="mw-badge">Без жанров: {excludedGenreNames.join(", ")}</span> : null}
          </div>
        </div>

        <CatalogGrid
          initialItems={items}
          initialHasMore={hasMore}
          query={q}
          sort={sort}
          sortDir={sortDir}
          includedGenreIds={includedGenreIds}
          excludedGenreIds={excludedGenreIds}
        />
      </main>
    </div>
  );
}
