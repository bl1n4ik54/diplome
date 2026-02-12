import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

import { db } from "../../../../../server/db";
import {
  comics,
  chapters,
  ratings,
  favorites,
  comicGenres,
  covers,
  userComicLists,
  readingProgress,
} from "../../../../../server/db/schema";
import { eq } from "drizzle-orm";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;
  return session.user.role === "admin";
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const comicId = Number(params.id);
  if (!comicId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await db.transaction(async (tx) => {
    await tx.delete(readingProgress).where(eq(readingProgress.comicId, comicId));
    await tx.delete(userComicLists).where(eq(userComicLists.comicId, comicId));
    await tx.delete(favorites).where(eq(favorites.comicId, comicId));
    await tx.delete(ratings).where(eq(ratings.comicId, comicId));
    await tx.delete(comicGenres).where(eq(comicGenres.comicId, comicId));
    await tx.delete(covers).where(eq(covers.comicId, comicId));
    await tx.delete(chapters).where(eq(chapters.comicId, comicId));
    await tx.delete(comics).where(eq(comics.id, comicId));
  });

  return NextResponse.json({ ok: true });
}
