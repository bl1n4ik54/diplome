import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, sql } from "drizzle-orm";

import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "../../../server/db";
import { comics, ratings, users } from "../../../server/db/schema";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { comicId?: number; value?: number } | null;
  const comicId = Number(body?.comicId);
  const value = Number(body?.value);

  if (!comicId || Number.isNaN(comicId)) {
    return NextResponse.json({ error: "comicId обязателен" }, { status: 400 });
  }
  if (!Number.isInteger(value) || value < 1 || value > 10) {
    return NextResponse.json({ error: "Оценка должна быть от 1 до 10" }, { status: 400 });
  }

  const [comic] = await db.select({ id: comics.id }).from(comics).where(eq(comics.id, comicId)).limit(1);
  if (!comic) return NextResponse.json({ error: "Тайтл не найден" }, { status: 404 });

  const where = and(eq(ratings.userId, me.id), eq(ratings.comicId, comicId));
  const existing = await db.select({ id: ratings.id }).from(ratings).where(where).limit(1);

  if (existing.length > 0) {
    await db.update(ratings).set({ value }).where(where);
  } else {
    await db.insert(ratings).values({ userId: me.id, comicId, value });
  }

  const [summary] = await db
    .select({
      ratingAvg: sql<number | null>`avg(${ratings.value})::float`,
      ratingCount: sql<number>`count(*)::int`,
    })
    .from(ratings)
    .where(eq(ratings.comicId, comicId));

  const ratingAvg = summary?.ratingAvg ?? null;
  const ratingCount = summary?.ratingCount ?? 0;

  await db
    .update(comics)
    .set({ rating: ratingAvg ?? 0 })
    .where(eq(comics.id, comicId));

  return NextResponse.json({ myRating: value, ratingAvg, ratingCount });
}
