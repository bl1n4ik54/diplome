import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { db } from "../../../../server/db"; // если у тебя путь другой — поправь
import { users, readingProgress } from "../../../../server/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const comicId = Number(body?.comicId);
  const chapterId = Number(body?.chapterId);
  const page = body?.page != null ? Number(body.page) : 1;

  if (!Number.isFinite(comicId) || !Number.isFinite(chapterId)) {
    return NextResponse.json({ error: "comicId & chapterId required" }, { status: 400 });
  }

  // UPSERT: по userId+comicId обновляем chapterId/page/updatedAt
  await db
    .insert(readingProgress)
    .values({
      userId: me.id,
      comicId,
      chapterId,
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
      updatedAt: sql`now()`,
    })
    // drizzle pg: onConflictDoUpdate
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.comicId],
      set: {
        chapterId,
        page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
        updatedAt: sql`now()`,
      },
    });

    
  return NextResponse.json({ ok: true });
}
