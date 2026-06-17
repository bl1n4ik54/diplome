import Link from "next/link";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

import { authOptions } from "../../api/auth/[...nextauth]/route";
import { db } from "../../../server/db";
import { users } from "../../../server/db/schema";

import AddComicForm from "./AddComicForm";
import styles from "./add.module.css";

function AccessDenied({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mw-page">
      <main className={`mw-container ${styles.gateWrap}`}>
        <section className={`mw-card ${styles.gateCard}`}>
          <span className="mw-pill">Ограниченный доступ</span>
          <h1 className="mw-title" style={{ margin: 0 }}>
            {title}
          </h1>
          <p className="mw-subtitle" style={{ margin: 0 }}>
            {description}
          </p>
          <div className={styles.gateActions}>
            <Link className="mw-btn mw-btnPrimary" href="/catalog">
              В каталог
            </Link>
            <Link className="mw-btn" href="/">
              На главную
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default async function AddComicPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    return (
      <AccessDenied
        title="Нет доступа"
        description="Нужно войти под администратором, чтобы добавлять новые тайтлы."
      />
    );
  }

  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  const isAdmin = me?.role === "admin";

  if (!isAdmin) {
    return (
      <AccessDenied
        title="Недостаточно прав"
        description="Добавлять мангу может только администратор. Если это ошибка, проверь роль аккаунта."
      />
    );
  }

  return <AddComicForm />;
}
