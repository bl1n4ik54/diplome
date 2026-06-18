import Link from "next/link";
import { getServerSession } from "next-auth";

import HeaderNav from "./HeaderNav";
import styles from "./header.module.css";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function Header() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const name = session?.user?.name ?? null;
  const role = session?.user?.role ?? "user";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          MangaWorld
        </Link>

        <HeaderNav email={email} name={name} role={role} />
      </div>
    </header>
  );
}
