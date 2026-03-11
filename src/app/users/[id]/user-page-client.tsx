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
    const g: Record<Status, ListItem[]> = { reading: [], planned: [], completed: [], on_hold: [], dropped: [] };
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
    setLists(data.lists); // null если нет доступа
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
    <div className="mw-page">
      <section className="mw-hero">
        <div className="mw-container">
          <div className="mw-heroTop">
            <div style={{ display: "grid", gap: 10 }}>
              <div className="mw-pill">👤 Пользователь</div>
              <h1 className="mw-h1" style={{ fontSize: 40 }}>
                {loading ? "Загрузка..." : user ? user.username : "Пользователь"}
              </h1>
              <div className="mw-subtitle">Страница пользователя и его списков (если есть доступ).</div>

              <div className="mw-row">
                <Link className="mw-btn" href="/profile">
                  ← В профиль
                </Link>
                <Link className="mw-btn" href="/catalog">
                  Каталог
                </Link>
              </div>
            </div>

            <div className="mw-card" style={{ width: 360, maxWidth: "100%" }}>
              <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
                ДРУЖБА
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {!loading && friendship.state === "guest" ? (
                  <div className="mw-muted2">Войди в аккаунт, чтобы добавлять друзей и смотреть списки.</div>
                ) : null}

                {!loading && friendship.state === "self" ? <div className="mw-muted2">Это твоя страница 🙂</div> : null}

                {!loading && friendship.state === "none" ? (
                  <div className="mw-row" style={{ justifyContent: "space-between" }}>
                    <div className="mw-muted2">Вы не друзья</div>
                    <button className="mw-btn mw-btnPrimary" onClick={addFriend}>
                      Добавить
                    </button>
                  </div>
                ) : null}

                {!loading && friendship.state === "outgoing" ? (
                  <div className="mw-row" style={{ justifyContent: "space-between" }}>
                    <div className="mw-muted2">Заявка отправлена</div>
                    <button className="mw-btn" onClick={removeFriend}>
                      Отменить
                    </button>
                  </div>
                ) : null}

                {!loading && friendship.state === "incoming" ? (
                  <div className="mw-row" style={{ justifyContent: "space-between" }}>
                    <div className="mw-muted2">Вам пришла заявка</div>
                    <div className="mw-row">
                      <button className="mw-btn mw-btnPrimary" onClick={() => accept(friendship.requestId)}>
                        Принять
                      </button>
                      <button className="mw-btn" onClick={removeFriend}>
                        Отклонить
                      </button>
                    </div>
                  </div>
                ) : null}

                {!loading && friendship.state === "friends" ? (
                  <div className="mw-row" style={{ justifyContent: "space-between" }}>
                    <div className="mw-muted2">Вы друзья ✅</div>
                    <button className="mw-btn" onClick={removeFriend}>
                      Удалить
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mw-cardFlat" style={{ marginTop: 12, borderColor: "rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.10)" }}>
              <b>Ошибка:</b> {error}
            </div>
          ) : null}
        </div>
      </section>

      <main className="mw-container mw-main">
        <section className="mw-cardFlat">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
            <div>
              <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
                СПИСКИ
              </div>
              <div className="mw-title" style={{ marginTop: 6 }}>
                Списки пользователя
              </div>
              <div className="mw-subtitle" style={{ marginTop: 8 }}>
                {canSeeLists ? "Доступ разрешён — можно смотреть." : "Списки доступны только друзьям."}
              </div>
            </div>
          </div>

          {!loading && !canSeeLists ? (
            <div className="mw-muted2" style={{ marginTop: 12 }}>
              Добавь в друзья (или дождись подтверждения), чтобы увидеть списки.
            </div>
          ) : null}

          {canSeeLists ? (
            <div className="mw-gridCards" style={{ marginTop: 14, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {(Object.keys(grouped) as Status[]).map((st) => (
                <div key={st} className="mw-cardFlat">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <div style={{ fontWeight: 950 }}>{STATUS_LABEL[st]}</div>
                    <span className="mw-badge">{grouped[st].length}</span>
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    {grouped[st].length === 0 ? (
                      <div className="mw-muted2">Пусто</div>
                    ) : (
                      grouped[st].map((it) => (
                        <Link key={it.id} href={`/comics/${it.comicId}`} className="mw-cardLink" style={{ padding: 10 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div className="mw-cover" aria-hidden>
                              {it.coverUrl ? <img src={it.coverUrl} alt="" /> : <span>📘</span>}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {it.title}
                              </div>
                              <div className="mw-muted">progress: {it.progress}</div>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}