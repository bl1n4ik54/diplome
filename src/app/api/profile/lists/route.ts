// API: списки пользователя (получить список / добавить или обновить статус)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, sql } from "drizzle-orm";

import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "../../../../server/db";
import { users, userComicLists, comics } from "../../../../server/db/schema";

type Status = "reading" | "planned" | "completed" | "on_hold" | "dropped";
const STATUSES: Status[] = ["reading", "planned", "completed", "on_hold", "dropped"];

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const items = await db
    .select({
      id: userComicLists.id,
      status: userComicLists.status,
      progress: userComicLists.progress,
      comicId: userComicLists.comicId,
      title: comics.title,
      coverUrl: sql<string | null>`
        (select image_url from covers c
          where c.comic_id = ${userComicLists.comicId}
          order by c.is_main desc, c.id asc
          limit 1)
      `,
    })
    .from(userComicLists)
    .innerJoin(comics, eq(userComicLists.comicId, comics.id))
    .where(eq(userComicLists.userId, me.id))
    .orderBy(sql`${userComicLists.updatedAt} desc`);

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { comicId?: number; status?: Status } | null;
  const comicId = Number(body?.comicId);
  const status = body?.status as Status;

  if (!comicId || Number.isNaN(comicId)) {
    return NextResponse.json({ error: "comicId обязателен" }, { status: 400 });
  }
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Некорректный status" }, { status: 400 });
  }

  // upsert: если запись уже есть -> обновим статус, иначе создадим
  const [row] = await db
    .insert(userComicLists)
    .values({
      userId: me.id,
      comicId,
      status,
      progress: 0,
    })
    .onConflictDoUpdate({
      target: [userComicLists.userId, userComicLists.comicId],
      set: {
        status,
        updatedAt: new Date(),
      },
    })
    .returning({
      id: userComicLists.id,
      status: userComicLists.status,
      progress: userComicLists.progress,
      comicId: userComicLists.comicId,
    });

  return NextResponse.json({ item: row });
}
