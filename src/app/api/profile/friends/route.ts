import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { db } from "../../../../server/db";
import { users, friendRequests } from "../../../../server/db/schema";
import { eq, or, sql } from "drizzle-orm";

async function getMe() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  return (await db.query.users.findFirst({ where: eq(users.email, email) })) ?? null;
}

export async function GET() {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: friendRequests.id,
      fromUserId: friendRequests.fromUserId,
      toUserId: friendRequests.toUserId,
      status: friendRequests.status,
      createdAt: friendRequests.createdAt,

      fromName: sql<string>`(select username from users u where u.id = ${friendRequests.fromUserId})`,
      fromEmail: sql<string>`(select email from users u where u.id = ${friendRequests.fromUserId})`,
      toName: sql<string>`(select username from users u where u.id = ${friendRequests.toUserId})`,
      toEmail: sql<string>`(select email from users u where u.id = ${friendRequests.toUserId})`,
    })
    .from(friendRequests)
    .where(or(eq(friendRequests.fromUserId, me.id), eq(friendRequests.toUserId, me.id)))
    .orderBy(sql`${friendRequests.createdAt} desc`);

  const accepted = rows
    .filter((r) => r.status === "accepted")
    .map((r) => {
      const isMeFrom = r.fromUserId === me.id;
      return {
        requestId: r.id,
        userId: isMeFrom ? r.toUserId : r.fromUserId,
        username: isMeFrom ? r.toName : r.fromName,
        email: isMeFrom ? r.toEmail : r.fromEmail,
      };
    });

  const incoming = rows
    .filter((r) => r.status === "pending" && r.toUserId === me.id)
    .map((r) => ({
      requestId: r.id,
      fromUserId: r.fromUserId,
      username: r.fromName,
      email: r.fromEmail,
    }));

  const outgoing = rows
    .filter((r) => r.status === "pending" && r.fromUserId === me.id)
    .map((r) => ({
      requestId: r.id,
      toUserId: r.toUserId,
      username: r.toName,
      email: r.toEmail,
    }));

  return NextResponse.json({ accepted, incoming, outgoing });
}
