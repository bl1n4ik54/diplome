import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "../../../../server/db";
import { users } from "../../../../server/db/schema";

function sanitizeUsername(input: unknown) {
  const raw = typeof input === "string" ? input.trim() : "";
  // можно пусто -> станет null
  if (!raw) return null;

  // базовые ограничения
  const v = raw.slice(0, 50);
  if (v.length < 3) return "__too_short__";
  return v;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const username = sanitizeUsername(body?.username);

  if (username === "__too_short__") {
    return NextResponse.json({ error: "Ник должен быть минимум 3 символа" }, { status: 400 });
  }

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [updated] = await db
    .update(users)
    .set({ username: username as any })
    .where(eq(users.id, me.id))
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
    });

  return NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      username: updated.username ?? "",
      email: updated.email ?? "",
      role: updated.role ?? "user",
    },
  });
}
