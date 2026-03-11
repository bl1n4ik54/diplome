"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Status = "reading" | "planned" | "completed" | "on_hold" | "dropped";
const STATUS_LABEL: Record<Status, string> = {
  reading: "Читаю",
  planned: "В планах",
  completed: "Прочитано",
  on_hold: "Отложено",
  dropped: "Брошено",
};

type ListItem = {
  id: number;
  status: Status;
  progress: number;
  comicId: number;
  title: string;
  coverUrl: string | null;
};

type Friendship =
  | { state: "guest" }
  | { state: "self" }
  | { state: "none" }
  | { state: "friends"; otherUserId: number }
  | { state: "incoming"; requestId: number }
  | { state: "outgoing"; requestId: number };

export default function UserPageClient({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState<{ id: number; username: string; email?: string } | null>(null);
  const [friendship, setFriendship] = useState<Friendship>({ state: "guest" });
  const [lists, setLists] = useState<ListItem[] | null>(null);

  const grouped = useMemo(() => {
    const g: Record<Status, ListItem[]> = {
      reading: [],
      planned: [],
      completed: [],
      on_hold: [],
      dropped: [],
    };
    if (!lists) return g;
    for (const it of lists) g[it.status].push(it);
    return g;
  }, [lists]);

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/users/${userId}`);
    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Ошибка загрузки");
      return;
    }

    setUser(data.user);
    setFriendship(data.friendship);
    setLists(data.lists); // может быть null (если нет доступа)
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function addFriend() {
    setError("");
    const res = await fetch("/api/profile/friends/requestById", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(userId) }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return setError(data?.error ?? "Не удалось отправить заявку");
    await load();
  }

  async function accept(requestId: number) {
    setError("");
    const res = await fetch("/api/profile/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return setError(data?.error ?? "Не удалось принять");
    await load();
  }

  async function removeFriend() {
    setError("");
    const res = await fetch("/api/profile/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: Number(userId) }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return setError(data?.error ?? "Не удалось удалить/отменить");
    await load();
  }

  const canSeeLists = lists !== null;

  return (
    <div className="home-page">
      {/* ❌ убрали фейковый nav/header — используется общий Header из layout.tsx */}

      <main className="home-main">
        <div className="profile-wrap">
          <div className="profile-hero">
            <h1 className="home-title">{loading ? "Загрузка..." : user ? user.username : "Пользователь"}</h1>
            <p className="home-subtitle">Страница пользователя и его списков</p>

            <div style={{ marginTop: 10 }}>
              <Link href="/profile" className="btn btn-ghost">
                ← В профиль
              </Link>
            </div>
          </div>

          {error && <div className="profile-error">{error}</div>}

          {/* Карточка статуса дружбы */}
          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">Дружба</div>
            </div>

            {!loading && friendship.state === "guest" && (
              <div className="profile-muted">Войди в аккаунт, чтобы добавлять друзей и смотреть списки.</div>
            )}

            {!loading && friendship.state === "self" && <div className="profile-muted">Это твоя страница 🙂</div>}

            {!loading && friendship.state === "none" && (
              <div className="profile-row">
                <div className="profile-muted">Вы не друзья</div>
                <button className="btn btn-primary" onClick={addFriend}>
                  Добавить в друзья
                </button>
              </div>
            )}

            {!loading && friendship.state === "outgoing" && (
              <div className="profile-row">
                <div className="profile-muted">Заявка отправлена</div>
                <button className="btn btn-ghost" onClick={removeFriend}>
                  Отменить
                </button>
              </div>
            )}

            {!loading && friendship.state === "incoming" && (
              <div className="profile-row">
                <div className="profile-muted">Вам пришла заявка от этого пользователя</div>
                <button className="btn btn-primary" onClick={() => accept(friendship.requestId)}>
                  Принять
                </button>
                <button className="btn btn-ghost" onClick={removeFriend}>
                  Отклонить
                </button>
              </div>
            )}

            {!loading && friendship.state === "friends" && (
              <div className="profile-row">
                <div className="profile-muted">Вы друзья ✅</div>
                <button className="btn btn-ghost" onClick={removeFriend}>
                  Удалить из друзей
                </button>
              </div>
            )}
          </div>

          {/* Списки друга */}
          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">Списки</div>
            </div>

            {!loading && !canSeeLists && <div className="profile-muted">Списки доступны только друзьям.</div>}
          </div>

          {canSeeLists && (
            <div className="profile-grid">
              {(["reading", "planned", "completed", "on_hold", "dropped"] as Status[]).map((st) => (
                <section key={st} className="profile-card">
                  <div className="profile-card-head">
                    <div className="profile-card-title">{STATUS_LABEL[st]}</div>
                    <div className="profile-muted">{grouped[st].length}</div>
                  </div>

                  {grouped[st].length === 0 ? (
                    <div className="profile-muted">Пусто</div>
                  ) : (
                    <div className="profile-list">
                      {grouped[st].map((it) => (
                        <div key={it.id} className="profile-item">
                          <div className="profile-item-top">
                            <div className="profile-cover small" aria-hidden>
                              {it.coverUrl ? <img src={it.coverUrl} alt="" /> : <span>📙</span>}
                            </div>
                            <div className="profile-item-info">
                              <div className="profile-item-title">{it.title}</div>
                              <div className="profile-muted">progress: {it.progress}</div>
                            </div>
                          </div>

                          <Link href={`/comics/${it.comicId}`} className="btn btn-ghost">
                            Открыть
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}