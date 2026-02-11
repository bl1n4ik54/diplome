import { NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { comics, covers } from "../../../../server/db/schema";
import { ilike, sql } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ items: [] });

  const items = await db
    .select({
      id: comics.id,
      title: comics.title,
      rating: comics.rating,
      coverUrl: sql<string | null>`
        (select image_url from covers c
          where c.comic_id = ${comics.id}
          order by c.is_main desc, c.id asc
          limit 1)
      `,
    })
    .from(comics)
    .where(ilike(comics.title, `%${q}%`))
    .limit(10);

  return NextResponse.json({ items });
}
