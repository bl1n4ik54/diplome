// Header: общая шапка сайта (SSR, знает сессию NextAuth)
import Link from "next/link";
import { getServerSession } from "next-auth";

import styles from "./header.module.css";
import LogoutButton from "./LogoutButton";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function Header() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const name = session?.user?.name ?? null;

  // ✅ роль (должна приходить из next-auth callbacks)
  const role = session?.user?.role ?? "user";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Название
        </Link>

        <nav className={styles.nav}>
          <Link href="/" className={styles.link}>
            Главная
          </Link>
          <Link href="/catalog" className={styles.link}>
            Каталог
          </Link>

          {/* ✅ Админка видна только админам */}
          {email && role === "admin" && (
            <Link href="/admin" className={styles.link}>
              Админ-панель
            </Link>
          )}

          <div className={styles.spacer} />

          {email ? (
            <>
              <Link href="/profile" className={styles.link}>
                Профиль
              </Link>

              <div className={styles.user}>
                <div className={styles.userName}>{name || "Пользователь"}</div>
                <div className={styles.userEmail}>{email}</div>
              </div>

              <LogoutButton className={styles.btn} callbackUrl="/" label="Выйти" />
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.btn}>
                Войти
              </Link>
              <Link href="/auth/register" className={styles.btnGhost}>
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
