import Link from "next/link";
import { db } from "../../server/db";
import { users, comics, chapters, ratings, favorites } from "../../server/db/schema";
import { sql } from "drizzle-orm";

export default async function AdminDashboard() {
  const [u] = await db.select({ c: sql<number>`count(*)` }).from(users);
  const [c] = await db.select({ c: sql<number>`count(*)` }).from(comics);
  const [ch] = await db.select({ c: sql<number>`count(*)` }).from(chapters);
  const [r] = await db.select({ c: sql<number>`count(*)` }).from(ratings);
  const [f] = await db.select({ c: sql<number>`count(*)` }).from(favorites);

  return (
    <>
      <div className="admin-card">
        <div style={{ fontWeight: 900, fontSize: 16 }}>Сводка</div>
        <div className="admin-grid">
          <div className="admin-kpi">
            <div className="admin-kpi-title">Пользователей</div>
            <div className="admin-kpi-value">{u.c}</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-title">Манги</div>
            <div className="admin-kpi-value">{c.c}</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-title">Глав</div>
            <div className="admin-kpi-value">{ch.c}</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-title">Оценок</div>
            <div className="admin-kpi-value">{r.c}</div>
          </div>
          <div className="admin-kpi">
            <div className="admin-kpi-title">Избранного</div>
            <div className="admin-kpi-value">{f.c}</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }} className="row">
          <Link className="admin-link" href="/admin/comics">Управлять мангой →</Link>
          <Link className="admin-link" href="/admin/users">Управлять пользователями →</Link>
        </div>
      </div>
    </>
  );
}
