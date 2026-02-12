import Link from "next/link";
import { getServerSession } from "next-auth";
import { ilike, sql, eq } from "drizzle-orm";

import styles from "./catalog.module.css";
import { authOptions } from "../api/auth/[...nextauth]/route";

import { db } from "../../server/db";
import { comics, users } from "../../server/db/schema";

export default async function CatalogPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams?.q ?? "").trim();

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  let isAdmin = false;
  if (email) {
    const me = await db.query.users.findFirst({ where: eq(users.email, email) });
    isAdmin = me?.role === "admin";
  }

  const items = await db
    .select({
      id: comics.id,
      title: comics.title,
      rating: comics.rating,
      coverUrl: sql<string | null>`
        coalesce(
          (select image_url from covers c
            where c.comic_id = ${comics.id}
            order by c.is_main desc, c.id asc
            limit 1),
          ${comics.coverUrl}
        )
      `,
    })
    .from(comics)
    .where(q ? ilike(comics.title, `%${q}%`) : sql`true`)
    .orderBy(sql`${comics.createdAt} desc`)
    .limit(60);

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <h1 className={styles.title}>Каталог</h1>

        <form action="/catalog" className={styles.actions}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Поиск по названию…"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "transparent",
              color: "inherit",
              minWidth: 260,
            }}
          />
          <button type="submit" className={styles.addBtn}>
            Найти
          </button>

          {isAdmin ? (
            <Link className={styles.addBtn} href="/catalog/add">
              ➕ Добавить мангу
            </Link>
          ) : null}
        </form>
      </div>

      <div className={styles.grid}>
        {items.map((it) => {
          const r = typeof it.rating === "number" ? it.rating : 0;
          const ratingText = r > 0 ? r.toFixed(1) : null;

          return (
            <Link key={it.id} href={`/comics/${it.id}`} className={styles.card}>
              <div className={styles.cover}>
                {ratingText && <div className={styles.badge}>{ratingText}</div>}

                {it.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.coverImg} src={it.coverUrl} alt={it.title} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", opacity: 0.7 }}>
                    📘
                  </div>
                )}
              </div>

              <div className={styles.text}>
                <div className={styles.name}>{it.title}</div>
                <div className={styles.type}>Manga</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
