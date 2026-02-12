"use client";

import { useMemo, useState } from "react";

type UserRow = {
  id: number;
  username: string | null;
  email: string | null;
  role: string;
  createdAt: string | null;
};

export default function AdminUsersClient({ initialItems }: { initialItems: UserRow[] }) {
  const [items, setItems] = useState<UserRow[]>(initialItems);
  const [q, setQ] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((u) =>
      `${u.id} ${u.email ?? ""} ${u.username ?? ""} ${u.role}`.toLowerCase().includes(s)
    );
  }, [items, q]);

  async function setRole(userId: number, role: "user" | "admin") {
    setMsg(null);
    setLoadingId(userId);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    const data = await res.json().catch(() => null);
    setLoadingId(null);

    if (!res.ok) {
      setMsg(data?.error ?? "Ошибка обновления роли");
      return;
    }

    setItems((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    setMsg("✅ Роль обновлена");
  }

  return (
    <>
      <div className="row" style={{ marginTop: 12 }}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по email/имени/роли…" />
        <button
          className="btn"
          onClick={async () => {
            setMsg(null);
            const res = await fetch("/api/admin/users");
            const data = await res.json().catch(() => null);
            if (res.ok) setItems(data.items ?? []);
            else setMsg(data?.error ?? "Ошибка загрузки");
          }}
        >
          Обновить
        </button>
      </div>

      {msg && <div style={{ marginTop: 10, opacity: 0.9 }}>{msg}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Пользователь</th>
            <th>Роль</th>
            <th>Действия</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>
                <div style={{ fontWeight: 900 }}>{u.username ?? "—"}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>{u.email ?? "—"}</div>
              </td>
              <td>
                <span className="badge">{u.role}</span>
              </td>
              <td className="row">
                <button
                  className="btn"
                  disabled={loadingId === u.id || u.role === "user"}
                  onClick={() => setRole(u.id, "user")}
                >
                  user
                </button>
                <button
                  className="btn"
                  disabled={loadingId === u.id || u.role === "admin"}
                  onClick={() => setRole(u.id, "admin")}
                >
                  admin
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
