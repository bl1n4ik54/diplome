"use client";

// ProfileClient: без псевдо-хеддера, контент начинается сразу
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../HomePage.css";
import "./profile.css";

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

type ComicSearchItem = { id: number; title: string; coverUrl: string | null; rating: number | null };

type FriendAccepted = { requestId: number; userId: number; username: string; email: string };
type FriendIncoming = { requestId: number; fromUserId: number; username: string; email: string };
type FriendOutgoing = { requestId: number; toUserId: number; username: string; email: string };

export default function ProfileClient({ user }: { user: any }) {
  const [error, setError] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [friends, setFriends] = useState<FriendAccepted[]>([]);
  const [incoming, setIncoming] = useState<FriendIncoming[]>([]);
  const [outgoing, setOutgoing] = useState<FriendOutgoing[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ComicSearchItem[]>([]);

  const [friendEmail, setFriendEmail] = useState("");

  const grouped = useMemo(() => {
    const g: Record<Status, ListItem[]> = {
      reading: [],
      planned: [],
      completed: [],
      on_hold: [],
      dropped: [],
    };
    for (const it of items) g[it.status].push(it);
    return g;
  }, [items]);

  async function loadLists() {
    setLoadingLists(true);
    setError("");
    const res = await fetch("/api/profile/lists");
    const data = await res.json();
    setLoadingLists(false);
    if (!res.ok) return setError(data?.error ?? "Ошибка загрузки списков");
    setItems(data.items ?? []);
  }

  async function loadFriends() {
    setLoadingFriends(true);
    setError("");
    const res = await fetch("/api/profile/friends");
    const data = await res.json();
    setLoadingFriends(false);
    if (!res.ok) return setError(data?.error ?? "Ошибка загрузки друзей");
    setFriends(data.accepted ?? []);
    setIncoming(data.incoming ?? []);
    setOutgoing(data.outgoing ?? []);
  }

  useEffect(() => {
    loadLists();
    loadFriends();
  }, []);

  async function searchComics() {
    const query = q.trim();
    if (!query) return;
    setSearching(true);
    setError("");
    const res = await fetch(`/api/comics/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setSearching(false);
    if (!res.ok) return setError(data?.error ?? "Ошибка поиска");
    setResults(data.items ?? []);
  }

  async function addToList(comicId: number, status: Status) {
    setError("");
    const res = await fetch("/api/profile/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId, status }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data?.error ?? "Не удалось добавить");
    await loadLists();
  }

  async function patchItem(id: number, patch: Partial<{ status: Status; progress: number }>) {
    setError("");
    const res = await fetch(`/api/profile/lists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) return setError(data?.error ?? "Не удалось обновить");
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...data.item } : x)));
    await loadLists();
  }

  async function removeItem(id: number) {
    setError("");
    const res = await fetch(`/api/profile/lists/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return setError(data?.error ?? "Не удалось удалить");
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function sendFriendRequest() {
    const email = friendEmail.trim().toLowerCase();
    if (!email) return;
    setError("");

    const res = await fetch("/api/profile/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data?.error ?? "Не удалось отправить заявку");

    setFriendEmail("");
    await loadFriends();
  }

  async function acceptRequest(requestId: number) {
    setError("");
    const res = await fetch("/api/profile/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data?.error ?? "Не удалось принять");
    await loadFriends();
  }

  async function removeFriend(userId: number) {
    setError("");
    const res = await fetch("/api/profile/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data?.error ?? "Не удалось удалить/отменить");
    await loadFriends();
  }

  return (
    <div className="home-page">
      <main className="home-main">
        <div className="profile-wrap">
          <div className="profile-hero">
            <h1 className="home-title">Профиль</h1>
            <p className="home-subtitle">Списки чтения и друзья — как “главная” внутри аккаунта.</p>
          </div>

          {error && <div className="profile-error">{error}</div>}

          {/* Поиск и добавление комикса */}
          <div className="profile-card">
            <div className="profile-card-title">Добавить мангу в списки</div>
            <div className="profile-row">
              <input
                className="profile-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Введи название…"
              />
              <button className="btn btn-primary" onClick={searchComics} disabled={searching}>
                {searching ? "Поиск..." : "Найти"}
              </button>
            </div>

            {results.length > 0 && (
              <div className="profile-results">
                {results.map((r) => (
                  <div key={r.id} className="profile-result">
                    <div className="profile-result-left">
                      <div className="profile-cover" aria-hidden>
                        {r.coverUrl ? <img src={r.coverUrl} alt="" /> : <span>📘</span>}
                      </div>
                      <div>
                        <div className="profile-result-title">{r.title}</div>
                        <div className="profile-muted">ID: {r.id}</div>
                      </div>
                    </div>

                    <div className="profile-result-actions">
                      <button className="btn btn-ghost" onClick={() => addToList(r.id, "planned")}>
                        В планах
                      </button>
                      <button className="btn btn-primary" onClick={() => addToList(r.id, "reading")}>
                        Читаю
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Списки */}
          <div className="profile-grid">
            {(["reading", "planned", "completed", "on_hold", "dropped"] as Status[]).map((st) => (
              <section key={st} className="profile-card">
                <div className="profile-card-head">
                  <div className="profile-card-title">{STATUS_LABEL[st]}</div>
                  <div className="profile-muted">{loadingLists ? "…" : grouped[st].length}</div>
                </div>

                {!loadingLists && grouped[st].length === 0 && <div className="profile-muted">Пока пусто</div>}

                <div className="profile-list">
                  {grouped[st].map((it) => (
                    <div key={it.id} className="profile-item">
                      <div className="profile-item-top">
                        <div className="profile-cover small" aria-hidden>
                          {it.coverUrl ? <img src={it.coverUrl} alt="" /> : <span>📙</span>}
                        </div>
                        <div className="profile-item-info">
                          <div className="profile-item-title">
                            <Link href={`/comics/${it.comicId}`} style={{ textDecoration: "none", color: "inherit" }}>
                              {it.title}
                            </Link>
                          </div>
                          {/* <div className="profile-muted">comicId: {it.comicId}</div> */}
                        </div>
                      </div>

                      {/* <div className="profile-row">
                        <span className="profile-muted">Прогресс</span>
                        <input
                          className="profile-input small"
                          type="number"
                          min={0}
                          value={it.progress}
                          onChange={(e) => patchItem(it.id, { progress: Number(e.target.value) })}
                        />
                      </div> */}

                      {/* <div className="profile-actions">
                        <button className="btn btn-ghost" onClick={() => patchItem(it.id, { status: "reading" })}>
                          Читаю
                        </button>
                        <button className="btn btn-ghost" onClick={() => patchItem(it.id, { status: "planned" })}>
                          В планах
                        </button>
                        <button className="btn btn-ghost" onClick={() => patchItem(it.id, { status: "completed" })}>
                          Прочитано
                        </button>
                        <button className="btn btn-ghost" onClick={() => patchItem(it.id, { status: "on_hold" })}>
                          Отложено
                        </button>
                        <button className="btn btn-ghost" onClick={() => patchItem(it.id, { status: "dropped" })}>
                          Брошено
                        </button>
                        <button className="btn btn-primary danger" onClick={() => removeItem(it.id)}>
                          Удалить
                        </button>
                      </div> */}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Друзья */}
          <section className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">Друзья</div>
              <div className="profile-muted">{loadingFriends ? "…" : friends.length}</div>
            </div>

            <div className="profile-row">
              <input
                className="profile-input"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Email друга…"
              />
              <button className="btn btn-primary" onClick={sendFriendRequest}>
                Отправить заявку
              </button>
            </div>

            <div className="profile-friends-grid">
              <div className="profile-fbox">
                <div className="profile-fbox-title">Мои друзья</div>
                {friends.length === 0 && !loadingFriends && <div className="profile-muted">Пока нет</div>}
                {friends.map((f) => (
                  <div key={f.userId} className="profile-frow">
                    <Link href={`/users/${f.userId}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="profile-strong">{f.username}</div>
                      <div className="profile-muted">{f.email}</div>
                    </Link>

                    <button className="btn btn-ghost" onClick={() => removeFriend(f.userId)}>
                      Удалить
                    </button>
                  </div>
                ))}
              </div>

              <div className="profile-fbox">
                <div className="profile-fbox-title">Входящие заявки</div>
                {incoming.length === 0 && !loadingFriends && <div className="profile-muted">Нет</div>}
                {incoming.map((r) => (
                  <div key={r.requestId} className="profile-frow">
                    <Link href={`/users/${r.fromUserId}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="profile-strong">{r.username}</div>
                      <div className="profile-muted">{r.email}</div>
                    </Link>

                    <button className="btn btn-primary" onClick={() => acceptRequest(r.requestId)}>
                      Принять
                    </button>
                  </div>
                ))}
              </div>

              <div className="profile-fbox">
                <div className="profile-fbox-title">Исходящие заявки</div>
                {outgoing.length === 0 && !loadingFriends && <div className="profile-muted">Нет</div>}
                {outgoing.map((r) => (
                  <div key={r.requestId} className="profile-frow">
                    <Link href={`/users/${r.toUserId}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="profile-strong">{r.username}</div>
                      <div className="profile-muted">{r.email}</div>
                    </Link>

                    <button className="btn btn-ghost" onClick={() => removeFriend(r.toUserId)}>
                      Отменить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
