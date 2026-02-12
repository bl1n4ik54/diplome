import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { db } from "../../../../server/db";
import { comics, authors } from "../../../../server/db/schema";
import { desc, eq } from "drizzle-orm";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return false;
  return session.user.role === "admin";
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const itemsDb = await db
    .select({
      id: comics.id,
      title: comics.title,
      status: comics.status,
      releaseYear: comics.releaseYear,
      rating: comics.rating,
      authorName: authors.name,
      createdAt: comics.createdAt, // Date | null
    })
    .from(comics)
    .leftJoin(authors, eq(comics.authorId, authors.id))
    .orderBy(desc(comics.createdAt))
    .limit(500);


  const items = itemsDb.map((c) => ({
    ...c,
    createdAt: c.createdAt ? c.createdAt.toISOString() : null,
  }));

  return NextResponse.json({ items });
}
