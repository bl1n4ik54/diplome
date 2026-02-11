import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

import { db } from "../../../../../server/db";
import { users, friendRequests } from "../../../../../server/db/schema";
import { and, eq, or } from "drizzle-orm";

async function getMe() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  return (await db.query.users.findFirst({ where: eq(users.email, email) })) ?? null;
}

export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const toUserId = Number(body?.userId);
  if (!Number.isFinite(toUserId)) return NextResponse.json({ error: "Bad userId" }, { status: 400 });
  if (toUserId === me.id) return NextResponse.json({ error: "Нельзя добавить себя" }, { status: 400 });

  // проверим, что пользователь существует
  const target = await db.query.users.findFirst({ where: eq(users.id, toUserId) });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // существующая связь/заявка в любую сторону
  const existing = await db.query.friendRequests.findFirst({
    where: or(
      and(eq(friendRequests.fromUserId, me.id), eq(friendRequests.toUserId, toUserId)),
      and(eq(friendRequests.fromUserId, toUserId), eq(friendRequests.toUserId, me.id))
    ),
  });

  // если он уже отправил тебе — авто-accept
  if (existing && existing.status === "pending" && existing.fromUserId === toUserId) {
    const [updated] = await db
      .update(friendRequests)
      .set({ status: "accepted" })
      .where(eq(friendRequests.id, existing.id))
      .returning();
    return NextResponse.json({ accepted: true, request: updated });
  }

  if (existing && existing.status === "accepted")
    return NextResponse.json({ error: "Вы уже друзья" }, { status: 409 });

  if (existing && existing.status === "pending")
    return NextResponse.json({ error: "Заявка уже существует" }, { status: 409 });

  const [created] = await db
    .insert(friendRequests)
    .values({ fromUserId: me.id, toUserId, status: "pending" })
    .returning();

  return NextResponse.json({ request: created });
}
