import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";

import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "../../../../server/db";
import { users, friendRequests, userComicLists, comics } from "../../../../server/db/schema";

// helper: id текущего пользователя или null
async function getMeId() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return null;

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  return me?.id ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ FIX
  const targetId = Number(id);

  if (!Number.isFinite(targetId)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, targetId),
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const meId = await getMeId(); // null если гость

  // --- определяем дружбу
  let friendship:
    | { state: "guest" }
    | { state: "self" }
    | { state: "none" }
    | { state: "friends"; otherUserId: number }
    | { state: "incoming"; requestId: number }
    | { state: "outgoing"; requestId: number } = { state: "guest" };

  if (!meId) {
    friendship = { state: "guest" };
  } else if (meId === targetId) {
    friendship = { state: "self" };
  } else {
    // ищем заявку в любую сторону
    const reqRow = await db.query.friendRequests.findFirst({
      where: and(
        eq(friendRequests.fromUserId, meId),
        eq(friendRequests.toUserId, targetId)
      ),
    });

    const reqBack = await db.query.friendRequests.findFirst({
      where: and(
        eq(friendRequests.fromUserId, targetId),
        eq(friendRequests.toUserId, meId)
      ),
    });

    const accepted =
      (reqRow && reqRow.status === "accepted") || (reqBack && reqBack.status === "accepted");

    if (accepted) {
      friendship = { state: "friends", otherUserId: targetId };
    } else if (reqBack && reqBack.status === "pending") {
      friendship = { state: "incoming", requestId: reqBack.id };
    } else if (reqRow && reqRow.status === "pending") {
      friendship = { state: "outgoing", requestId: reqRow.id };
    } else {
      friendship = { state: "none" };
    }
  }

  // --- списки доступны только друзьям или самому себе
  const canSeeLists = friendship.state === "friends" || friendship.state === "self";
  let lists: any[] | null = null;

  if (canSeeLists) {
    const rows = await db
      .select({
        id: userComicLists.id,
        status: userComicLists.status,
        progress: userComicLists.progress,
        comicId: userComicLists.comicId,
        title: comics.title,
        coverUrl: comics.coverUrl,
      })
      .from(userComicLists)
      .innerJoin(comics, eq(userComicLists.comicId, comics.id))
      .where(eq(userComicLists.userId, targetId));

    lists = rows;
  }

  return NextResponse.json({
    user: {
      id: target.id,
      username: target.username ?? "Пользователь",
      email: target.email ?? undefined,
    },
    friendship,
    lists, // null если нет доступа
  });
}
