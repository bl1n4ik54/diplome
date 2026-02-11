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
  const otherUserId = Number(body?.userId);
  if (!Number.isFinite(otherUserId)) return NextResponse.json({ error: "Bad userId" }, { status: 400 });

  await db
    .delete(friendRequests)
    .where(
      or(
        and(eq(friendRequests.fromUserId, me.id), eq(friendRequests.toUserId, otherUserId)),
        and(eq(friendRequests.fromUserId, otherUserId), eq(friendRequests.toUserId, me.id))
      )
    );

  return NextResponse.json({ ok: true });
}
