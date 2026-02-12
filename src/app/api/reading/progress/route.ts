import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { db } from "../../../../server/db";
import { users, readingProgress } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const comicId = Number(body?.comicId);
  const chapterId = Number(body?.chapterId);
  const page = Math.max(1, Number(body?.page ?? 1) || 1);

  if (!comicId || !chapterId) {
    return NextResponse.json({ error: "comicId & chapterId required" }, { status: 400 });
  }

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();

  await db
    .insert(readingProgress)
    .values({
      userId: me.id,
      comicId,
      chapterId,
      page,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.comicId],
      set: { chapterId, page, updatedAt: now },
    });

  return NextResponse.json({ ok: true });
}
