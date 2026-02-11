import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

import { db } from "../../../../../server/db";
import { users, friendRequests } from "../../../../../server/db/schema";
import { and, eq } from "drizzle-orm";

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
  const requestId = Number(body?.requestId);
  if (!Number.isFinite(requestId)) return NextResponse.json({ error: "Bad requestId" }, { status: 400 });

  const [updated] = await db
    .update(friendRequests)
    .set({ status: "accepted" })
    .where(and(eq(friendRequests.id, requestId), eq(friendRequests.toUserId, me.id), eq(friendRequests.status, "pending")))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
