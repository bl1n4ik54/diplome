import { NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { users, friendRequests, userComicLists, comics, covers } from "../../../../server/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

type Status = "reading" | "planned" | "completed" | "on_hold" | "dropped";
const ALLOWED: Status[] = ["reading", "planned", "completed", "on_hold", "dropped"];

async function getMeId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  return me?.id ?? null;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const targetId = Number(params.id);
  if (!Number.isFinite(targetId)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const meId = await getMeId(); // может быть null (гость)

  const target = await db.query.users.findFirst({
    where: eq(users.id, targetId),
    columns: { id: true, username: true, email: true },
  });

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Статус дружбы (если не гость и не сам себе)
  let friendship:
    | { state: "self" }
    | { state: "guest" }
    | { state: "none" }
    | { state: "friends"; otherUserId: number }
    | { state: "incoming"; requestId: number }
    | { state: "outgoing"; requestId: number } = { state: "guest" };

  if (!meId) {
    friendship = { state: "guest" };
  } else if (meId === targetId) {
    friendship = { state: "self" };
  } else {
    const fr = await db.query.friendRequests.findFirst({
      where: or(
        and(eq(friendRequests.fromUserId, meId), eq(friendRequests.toUserId, targetId)),
        and(eq(friendRequests.fromUserId, targetId), eq(friendRequests.toUserId, meId))
      ),
    });

    if (!fr) friendship = { state: "none" };
    else if (fr.status === "accepted") friendship = { state: "friends", otherUserId: targetId };
    else if (fr.status === "pending" && fr.toUserId === meId) friendship = { state: "incoming", requestId: fr.id };
    else if (fr.status === "pending" && fr.fromUserId === meId) friendship = { state: "outgoing", requestId: fr.id };
    else friendship = { state: "none" };
  }

  // ПРАВИЛА ПРИВАТНОСТИ:
  // - гость: списки скрыты
  // - не друг: списки скрыты
  // - друзья или self: списки видны
const canViewLists =
  friendship.state === "self" ||
  friendship.state === "friends" ||
  friendship.state === "none"; // авторизованный, но не друг


  if (!canViewLists) {
    return NextResponse.json({
      user: { id: target.id, username: target.username }, // можно не отдавать email
      friendship,
      lists: null,
    });
  }

  const lists = await db
    .select({
      id: userComicLists.id,
      status: userComicLists.status,
      progress: userComicLists.progress,
      updatedAt: userComicLists.updatedAt,
      comicId: comics.id,
      title: comics.title,
      coverUrl: sql<string | null>`
        (select image_url from covers c
          where c.comic_id = ${comics.id}
          order by c.is_main desc, c.id asc
          limit 1)
      `,
    })
    .from(userComicLists)
    .innerJoin(comics, eq(userComicLists.comicId, comics.id))
    .where(and(eq(userComicLists.userId, targetId)))
    .orderBy(sql`${userComicLists.updatedAt} desc`);

  // фильтр на случай мусорного status
  const safeLists = lists.filter((x) => ALLOWED.includes(x.status as Status));

  return NextResponse.json({
    user: { id: target.id, username: target.username, email: target.email },
    friendship,
    lists: safeLists,
  });
}
