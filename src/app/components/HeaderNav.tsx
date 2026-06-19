"use client";

import Link from "next/link";
import { useState } from "react";

import LogoutButton from "./LogoutButton";
import styles from "./header.module.css";

type HeaderNavProps = {
  email: string | null;
  name: string | null;
  role: string;
};

export default function HeaderNav({ email, name, role }: HeaderNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className={styles.menuIcon} />
      </button>

      {isOpen ? <button type="button" className={styles.backdrop} aria-label="Закрыть меню" onClick={closeMenu} /> : null}

      <nav className={`${styles.nav} ${isOpen ? styles.navOpen : ""}`}>
        <Link href="/catalog" className={styles.link} onClick={closeMenu}>
          Каталог
        </Link>

        {email && role === "admin" ? (
          <Link href="/admin" className={styles.link} onClick={closeMenu}>
            Админ-панель
          </Link>
        ) : null}

        <div className={styles.spacer} />

        {email ? (
          <>
            <Link href="/profile" className={styles.link} onClick={closeMenu}>
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
            <Link href="/auth/login" className={styles.btn} onClick={closeMenu}>
              Войти
            </Link>
            <Link href="/auth/register" className={styles.btnGhost} onClick={closeMenu}>
              Регистрация
            </Link>
          </>
        )}
      </nav>
    </>
  );
}
