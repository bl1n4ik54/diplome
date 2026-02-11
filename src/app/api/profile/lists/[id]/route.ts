// API: обновить/удалить элемент списка пользователя по id
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";

import { authOptions } from "../../../auth/[...nextauth]/route";
import { db } from "../../../../../server/db";
import { users, userComicLists } from "../../../../../server/db/schema";

type Status = "reading" | "planned" | "completed" | "on_hold" | "dropped";
const STATUSES: Status[] = ["reading", "planned", "completed", "on_hold", "dropped"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const id = Number(params.id);
  if (!id || Number.isNaN(id)) return NextResponse.json({ error: "Некорректный id" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as Partial<{ status: Status; progress: number }> | null;
  if (!body) return NextResponse.json({ error: "Невалидный JSON" }, { status: 400 });

  const patch: any = { updatedAt: new Date() };

  if (body.status) {
    if (!STATUSES.includes(body.status)) return NextResponse.json({ error: "Некорректный status" }, { status: 400 });
    patch.status = body.status;
  }
  if (typeof body.progress === "number") {
    patch.progress = Math.max(0, Math.floor(body.progress));
  }

  const [updated] = await db
    .update(userComicLists)
    .set(patch)
    .where(and(eq(userComicLists.id, id), eq(userComicLists.userId, me.id)))
    .returning({
      id: userComicLists.id,
      status: userComicLists.status,
      progress: userComicLists.progress,
      comicId: userComicLists.comicId,
    });

  if (!updated) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const id = Number(params.id);
  if (!id || Number.isNaN(id)) return NextResponse.json({ error: "Некорректный id" }, { status: 400 });

  const deleted = await db
    .delete(userComicLists)
    .where(and(eq(userComicLists.id, id), eq(userComicLists.userId, me.id)))
    .returning({ id: userComicLists.id });

  if (!deleted.length) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
