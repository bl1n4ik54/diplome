"use client";

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
const STATUS_EMOJI: Record<Status, string> = {
  reading: "📖",
  planned: "🗓️",
  completed: "✅",
  on_hold: "⏸️",
  dropped: "🚫",
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

type MeUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  provider: string;
  createdAt: string | null;
};

function Icon({ name }: { name: "user" | "edit" | "search" | "lists" | "friends" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };
  if (name === "user")
    return (
      <svg {...common}>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  if (name === "edit")
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    );
  if (name === "search")
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    );
  if (name === "lists")
    return (
      <svg {...common}>
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M16 11c1.66 0 3-1.57 3-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11Z" />
      <path d="M8 11c1.66 0 3-1.57 3-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Z" />
      <path d="M2 20c0-3 3-5 6-5" />
      <path d="M22 20c0-3-3-5-6-5" />
      <path d="M10 20c0-3 2-5 4-5s4 2 4 5" />
    </svg>
  );
}

export default function ProfileClient({ user }: { user: any }) {
  const [error, setError] = useState("");

  // --- profile settings
  const [me, setMe] = useState<MeUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  // --- lists
  const [items, setItems] = useState<ListItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // --- friends
  const [friends, setFriends] = useState<FriendAccepted[]>([]);
  const [incoming, setIncoming] = useState<FriendIncoming[]>([]);
  const [outgoing, setOutgoing] = useState<FriendOutgoing[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // --- search
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ComicSearchItem[]>([]);

  const [friendEmail, setFriendEmail] = useState("");

  const grouped = useMemo(() => {
    const g: Record<Status, ListItem[]> = { reading: [], planned: [], completed: [], on_hold: [], dropped: [] };
    for (const it of items) g[it.status].push(it);
    return g;
  }, [items]);

  const initials = useMemo(() => {
    const base = (me?.username || user?.name || "Пользователь").trim();
    const parts = base.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [me?.username, user?.name]);

  async function loadMe() {
    const res = await fetch("/api/profile/me");
    const data = await res.json().catch(() => null);
    if (!res.ok) return;
    setMe(data.user);
    setUsername(data.user?.username ?? "");
  }

  async function saveProfile() {
    setError("");
    setOkMsg("");

    const v = username.trim();
    if (v && v.length < 3) {
      setError("Ник должен быть минимум 3 символа");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: v }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Ошибка сохранения");
      return;
    }

    setMe((prev) => (prev ? { ...prev, username: data.user?.username ?? "" } : prev));
    setOkMsg("✅ Профиль сохранён");
    setEditOpen(false);
  }

  async function loadLists() {
    setLoadingLists(true);
    setError("");
    const res = await fetch("/api/profile/lists");
    const data = await res.json().catch(() => null);
    setLoadingLists(false);
    if (!res.ok) return setError(data?.error ?? "Ошибка загрузки списков");
    setItems(data.items ?? []);
  }

  async function loadFriends() {
    setLoadingFriends(true);
    setError("");
    const res = await fetch("/api/profile/friends");
    const data = await res.json().catch(() => null);
    setLoadingFriends(false);
    if (!res.ok) return setError(data?.error ?? "Ошибка загрузки друзей");
    setFriends(data.accepted ?? []);
    setIncoming(data.incoming ?? []);
    setOutgoing(data.outgoing ?? []);
  }

  useEffect(() => {
    loadMe();
    loadLists();
    loadFriends();
  }, []);

  async function searchComics() {
    const query = q.trim();
    if (!query) return;
    setSearching(true);
    setError("");
    const res = await fetch(`/api/comics/search?q=${encodeURIComponent(query)}`);
    const data = await res.json().catch(() => null);
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
    const data = await res.json().catch(() => null);
    if (!res.ok) return setError(data?.error ?? "Не удалось добавить");
    await loadLists();
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
    const data = await res.json().catch(() => null);
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
    const data = await res.json().catch(() => null);
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
    const data = await res.json().catch(() => null);
    if (!res.ok) return setError(data?.error ?? "Не удалось удалить/отменить");
    await loadFriends();
  }

  return (
    <div className="home-page">
      <main className="home-main">
        <div className="profile-wrap">
          <div className="profile-hero">
            <div className="profile-hero-left">
              <div className="profile-avatar" aria-hidden>
                {initials}
              </div>
              <div>
                <h1 className="home-title" style={{ marginBottom: 4 }}>
                  {me?.username?.trim() ? me.username : user?.name || "Пользователь"}
                </h1>
                <div className="profile-muted">
                  <span className="iconBadge"><Icon name="user" /></span>
                  {me?.email || user?.email}
                  {me?.role ? <span className="badge" style={{ marginLeft: 10 }}>{me.role}</span> : null}
                </div>
              </div>
            </div>

            <button className="btn btn-ghost" onClick={() => setEditOpen((v) => !v)}>
              <span className="iconInline"><Icon name="edit" /></span>
              Редактировать
            </button>
          </div>

          {error && <div className="profile-error">{error}</div>}
          {okMsg && <div className="profile-ok">{okMsg}</div>}

          {/* ✅ Редактирование профиля */}
          {editOpen && (
            <div className="profile-card">
              <div className="profile-card-head">
                <div className="profile-card-title">
                  <span className="iconBadge"><Icon name="edit" /></span>
                  Настройки профиля
                </div>
              </div>

              <div className="profile-grid-2">
                <div>
                  <div className="profile-muted" style={{ marginBottom: 6 }}>Ник (username)</div>
                  <input
                    className="profile-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Например: Egor"
                  />
                  <div className="profile-hint">Минимум 3 символа. Можно оставить пустым.</div>
                </div>

                <div>
                  <div className="profile-muted" style={{ marginBottom: 6 }}>Email</div>
                  <input className="profile-input" value={me?.email || user?.email || ""} readOnly />
                  <div className="profile-hint">Email менять нельзя (используется для входа).</div>
                </div>
              </div>

              <div className="profile-row" style={{ justifyContent: "flex-end", marginTop: 10 }}>
                <button className="btn btn-ghost" onClick={() => setEditOpen(false)} disabled={saving}>
                  Отмена
                </button>
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                  {saving ? "Сохраняю..." : "Сохранить"}
                </button>
              </div>
            </div>
          )}

          {/* Поиск и добавление комикса */}
          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">
                <span className="iconBadge"><Icon name="search" /></span>
                Добавить мангу в списки
              </div>
            </div>

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
          <div className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">
                <span className="iconBadge"><Icon name="lists" /></span>
                Списки чтения
              </div>
              <div className="profile-muted">{loadingLists ? "…" : items.length}</div>
            </div>

            <div className="profile-grid">
              {(["reading", "planned", "completed", "on_hold", "dropped"] as Status[]).map((st) => (
                <section key={st} className="profile-subcard">
                  <div className="profile-card-head">
                    <div className="profile-card-title">
                      <span className="statusEmoji" aria-hidden>{STATUS_EMOJI[st]}</span>
                      {STATUS_LABEL[st]}
                    </div>
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
                          </div>
                        </div>

                        {/* <Link href={`/comics/${it.comicId}`} className="btn btn-ghost" style={{ textAlign: "center" }}>
                          Открыть →
                        </Link> */}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Друзья */}
          <section className="profile-card">
            <div className="profile-card-head">
              <div className="profile-card-title">
                <span className="iconBadge"><Icon name="friends" /></span>
                Друзья
              </div>
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
