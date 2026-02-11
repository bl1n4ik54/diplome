// API: toggle избранного (добавить/удалить)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";

import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "../../../server/db";
import { users, favorites } from "../../../server/db/schema";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ message: "User not found" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { comicId?: number } | null;
  const comicId = Number(body?.comicId);
  if (!comicId || Number.isNaN(comicId)) {
    return NextResponse.json({ message: "comicId is required" }, { status: 400 });
  }

  const where = and(eq(favorites.userId, me.id), eq(favorites.comicId, comicId));

  const existing = await db.select({ comicId: favorites.comicId }).from(favorites).where(where).limit(1);

  if (existing.length) {
    await db.delete(favorites).where(where);
    return NextResponse.json({ favorited: false });
  }

  await db.insert(favorites).values({ userId: me.id, comicId });
  return NextResponse.json({ favorited: true });
}
