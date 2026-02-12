import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

import { db } from "../../../../server/db";
import { users } from "../../../../server/db/schema";
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
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt, // Date | null
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(500);

  // ✅ Date -> string
  const items = itemsDb.map((u) => ({
    ...u,
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
  }));

  return NextResponse.json({ items });
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const userId = Number(body?.userId);
  const role = String(body?.role ?? "");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (!["user", "admin"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role });

  return NextResponse.json({ user: updated });
}
