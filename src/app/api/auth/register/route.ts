import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { db } from "../../../../server/db";
import { users } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Record<"username" | "email" | "password", unknown>>;
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password || !username) {
      return NextResponse.json({ error: "Заполните все поля" }, { status: 400 });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email), 
    });

    if (existingUser) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      username,
      email,
      passwordHash,
      provider: "local",
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Ошибка регистрации:", err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
