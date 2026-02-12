"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ComicRow = {
  id: number;
  title: string;
  status: string | null;
  releaseYear: number | null;
  rating: number | null;
  authorName: string | null;
  createdAt: string | null;
};

export default function AdminComicsClient({ initialItems }: { initialItems: ComicRow[] }) {
  const [items, setItems] = useState<ComicRow[]>(initialItems);
  const [q, setQ] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) => `${c.id} ${c.title} ${c.authorName ?? ""}`.toLowerCase().includes(s));
  }, [items, q]);

  async function refresh() {
    setMsg(null);
    const res = await fetch("/api/admin/comics");
    const data = await res.json().catch(() => null);
    if (res.ok) setItems(data.items ?? []);
    else setMsg(data?.error ?? "Ошибка загрузки");
  }

  async function remove(id: number) {
    if (!confirm(`Удалить мангу #${id}?`)) return;
    setMsg(null);
    setLoadingId(id);

    const res = await fetch(`/api/admin/comics/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);

    setLoadingId(null);

    if (!res.ok) {
      setMsg(data?.error ?? "Ошибка удаления");
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== id));
    setMsg("✅ Удалено");
  }

  return (
    <>
      <div className="row" style={{ marginTop: 12 }}>
        <input
          className="input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по названию/автору/ID…"
        />
        <button className="btn" onClick={refresh}>Обновить</button>

        {/* если хочешь добавлять мангу через старую форму */}
        <Link className="admin-link" href="/catalog/add">Добавить мангу</Link>
      </div>

      {msg && <div style={{ marginTop: 10, opacity: 0.9 }}>{msg}</div>}

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Тайтл</th>
            <th>Автор</th>
            <th>Статус</th>
            <th>Год</th>
            <th>Рейтинг</th>
            <th>Глава</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>
                <div style={{ fontWeight: 900 }}>{c.title}</div>
                <Link href={`/comics/${c.id}`} style={{ opacity: 0.8, fontSize: 12 }}>
                  открыть →
                </Link>
              </td>
              <td>{c.authorName ?? "—"}</td>
              <td><span className="badge">{c.status ?? "—"}</span></td>
              <td>{c.releaseYear ?? "—"}</td>
              <td>{c.rating ?? "—"}</td>

              {/* ✅ ссылка на добавление главы */}
              <td>
                <Link className="admin-link" href={`/admin/comics/${c.id}/add-chapter`}>
                  + Глава
                </Link>
              </td>

              <td>
                <button className="btn btn-danger" disabled={loadingId === c.id} onClick={() => remove(c.id)}>
                  {loadingId === c.id ? "Удаляю..." : "Удалить"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
