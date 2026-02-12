import { db } from "../../../server/db";
import { users } from "../../../server/db/schema";
import { desc } from "drizzle-orm";
import AdminUsersClient from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const initialDb = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt, // Date | null
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);

  // ✅ Date -> string
  const initial = initialDb.map((u) => ({
    ...u,
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
  }));

  return (
    <div className="admin-card">
      <div style={{ fontWeight: 900, fontSize: 16 }}>Пользователи</div>
      <div style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>
        Смена роли (user/admin)
      </div>

      <AdminUsersClient initialItems={initial} />
    </div>
  );
}
