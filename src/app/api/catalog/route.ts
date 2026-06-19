import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "../../../server/db";
import { authors, comics } from "../../../server/db/schema";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

type CatalogSort = "newest" | "rating" | "year";
type CatalogSortDir = "asc" | "desc";

function readInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function readCatalogSort(value: string | null): CatalogSort {
  if (value === "rating" || value === "trending") return "rating";
  if (value === "year") return "year";
  return "newest";
}

function readCatalogSortDir(value: string | null): CatalogSortDir {
  return value === "asc" ? "asc" : "desc";
}

function readGenreIds(url: URL, key: string) {
  const ids = url.searchParams
    .getAll(key)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  return [...new Set(ids)];
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const offset = readInt(url.searchParams.get("offset"), 0);
  const limit = Math.min(readInt(url.searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
  const sort = readCatalogSort(url.searchParams.get("sort"));
  const sortDir = readCatalogSortDir(url.searchParams.get("dir"));
  const excludedGenreIds = readGenreIds(url, "excludeGenre");
  const excludedSet = new Set(excludedGenreIds);
  const includedGenreIds = readGenreIds(url, "genre").filter((id) => !excludedSet.has(id));

  const whereSql = getCatalogWhere(q, includedGenreIds, excludedGenreIds);
  const orderBy = getOrderBy(sort, sortDir);

  const rows = await db
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
    .limit(limit + 1)
    .offset(offset);

  return NextResponse.json({
    items: rows.slice(0, limit),
    hasMore: rows.length > limit,
  });
}
