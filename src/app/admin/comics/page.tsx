import { db } from "../../../server/db";
import { comics, authors } from "../../../server/db/schema";
import { desc, eq } from "drizzle-orm";
import AdminComicsClient from "./AdminComicsClient";

export default async function AdminComicsPage() {
  const initialDb = await db
    .select({
      id: comics.id,
      title: comics.title,
      status: comics.status,
      releaseYear: comics.releaseYear,
      rating: comics.rating,
      authorName: authors.name,
      createdAt: comics.createdAt, // Date | null
    })
    .from(comics)
    .leftJoin(authors, eq(comics.authorId, authors.id))
    .orderBy(desc(comics.createdAt))
    .limit(200);

  const initial = initialDb.map((c) => ({
    ...c,
    createdAt: c.createdAt ? c.createdAt.toISOString() : null,
  }));

  return (
    <div className="admin-card">
      <div style={{ fontWeight: 900, fontSize: 16 }}>Манга</div>
      <div style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>
        Поиск, переход к тайтлу, удаление
      </div>

      <AdminComicsClient initialItems={initial} />
    </div>
  );
}
