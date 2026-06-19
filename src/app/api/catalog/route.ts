import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

import { db } from "../../../server/db";
import { authors, comics } from "../../../server/db/schema";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 60;

function readInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const offset = readInt(url.searchParams.get("offset"), 0);
  const limit = Math.min(readInt(url.searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);

  const whereSql =
    q.length > 0
      ? sql`(lower(${comics.title}) like ${"%" + q + "%"} or lower(${authors.name}) like ${"%" + q + "%"})`
      : sql`true`;

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
    .orderBy(sql`${comics.createdAt} desc`, sql`${comics.id} desc`)
    .limit(limit + 1)
    .offset(offset);

  return NextResponse.json({
    items: rows.slice(0, limit),
    hasMore: rows.length > limit,
  });
}
