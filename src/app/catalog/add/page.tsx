// Catalog Add Page: доступ только admin
import Link from "next/link";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

import { authOptions } from "../../api/auth/[...nextauth]/route";
import { db } from "../../../server/db";
import { users } from "../../../server/db/schema";

import AddComicForm from "./AddComicForm";

export default async function AddComicPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1>Нет доступа</h1>
        <p>Нужно войти как администратор.</p>
        <Link href="/catalog">← Назад в каталог</Link>
      </div>
    );
  }

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  const isAdmin = me?.role === "admin";

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1>Нет доступа</h1>
        <p>Добавлять мангу может только администратор.</p>
        <Link href="/catalog">← Назад в каталог</Link>
      </div>
    );
  }

  return <AddComicForm />;
}
