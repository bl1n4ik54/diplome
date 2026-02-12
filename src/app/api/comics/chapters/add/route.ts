import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

import { db } from "../../../../../server/db";
import { chapters, chapterPages } from "../../../../../server/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // если хочешь, чтобы только админы добавляли главы:
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const comicId = Number(body?.comicId);
  const chapterNumber = Number(body?.chapterNumber);
  const title = (body?.title ? String(body.title) : null) as string | null;
  const pages = Array.isArray(body?.pages) ? (body.pages as string[]) : [];

  if (!comicId || !chapterNumber) {
    return NextResponse.json({ error: "comicId & chapterNumber required" }, { status: 400 });
  }

  // (опционально) защита от дублей номера главы для комикса
  const exists = await db.query.chapters.findFirst({
    where: and(eq(chapters.comicId, comicId), eq(chapters.chapterNumber, chapterNumber)),
  });
  if (exists) {
    return NextResponse.json({ error: "Такая глава уже существует" }, { status: 409 });
  }

  const result = await db.transaction(async (tx) => {
    const [ch] = await tx
      .insert(chapters)
      .values({
        comicId,
        chapterNumber,
        title,
      })
      .returning({ id: chapters.id });

    if (!ch?.id) throw new Error("Failed to create chapter");

    if (pages.length > 0) {
      await tx.insert(chapterPages).values(
        pages
          .filter((x) => typeof x === "string" && x.trim().length > 0)
          .map((url, i) => ({
            chapterId: ch.id,
            pageNumber: i + 1,
            imageUrl: url.trim(),
          }))
      );
    }

    return ch.id;
  });

  return NextResponse.json({ ok: true, chapterId: result });
}