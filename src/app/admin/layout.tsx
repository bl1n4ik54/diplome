import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route";
import "./admin.css";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/auth/login");
  if (session.user.role !== "admin") redirect("/");

  return (
    <div className="admin-wrap">
      <div className="admin-top">
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Админ-панель</div>
          <div style={{ opacity: 0.8, fontSize: 12 }}>{session.user.email}</div>
        </div>

        <nav className="admin-nav">
          <Link className="admin-link" href="/admin">Дашборд</Link>
          <Link className="admin-link" href="/admin/comics">Манга</Link>
          <Link className="admin-link" href="/admin/users">Пользователи</Link>
          <Link className="admin-link" href="/">На сайт</Link>
        </nav>
      </div>

      {children}
    </div>
  );
}
