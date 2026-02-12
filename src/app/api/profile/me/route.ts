import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "../../../../server/db";
import { users } from "../../../../server/db/schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: me.id,
      username: me.username ?? "",
      email: me.email ?? "",
      role: me.role ?? "user",
      provider: me.provider ?? "local",
      createdAt: me.createdAt ? me.createdAt.toISOString() : null,
    },
  });
}
