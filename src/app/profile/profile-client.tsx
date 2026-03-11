"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

type ComicSearchItem = {
  id: number;
  title: string;
  coverUrl: string | null;
  rating: number | null;
};

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
  const [okMsg, setOkMsg] = useState("");

  // profile settings
  const [me, setMe] = useState<MeUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  // lists
  const [items, setItems] = useState<ListItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // friends
  const [friends, setFriends] = useState<FriendAccepted[]>([]);
  const [incoming, setIncoming] = useState<FriendIncoming[]>([]);
  const [outgoing, setOutgoing] = useState<FriendOutgoing[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // search
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

  const countAll = items.length;
  const countReading = grouped.reading.length;
  const countPlanned = grouped.planned.length;
  const countCompleted = grouped.completed.length;
  const countHold = grouped.on_hold.length;
  const countDropped = grouped.dropped.length;

  return (
    <div className="mw-page">
      {/* HERO like main */}
      <section className="mw-hero">
        <div className="mw-container">
          <div className="mw-heroTop">
            <div style={{ display: "grid", gap: 10 }}>
              <div className="mw-pill">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="mwIconBox" aria-hidden>
                    <Icon name="user" />
                  </span>
                  Профиль
                </span>
              </div>

              <h1 className="mw-h1" style={{ fontSize: 40 }}>
                {me?.username?.trim() ? me.username : user?.name || "Пользователь"}
              </h1>

              <div className="mw-subtitle">
                Управляй списками чтения, друзьями и настройками аккаунта. Прогресс чтения сохраняется автоматически.
              </div>

              <div className="mw-row" style={{ marginTop: 2 }}>
                <span className="mw-badge">{me?.email || user?.email}</span>
                {me?.role ? <span className="mw-badge">{me.role}</span> : null}
                <span className="mw-badge">Списков: {countAll}</span>
                <span className="mw-badge">Друзей: {loadingFriends ? "…" : friends.length}</span>
              </div>
            </div>

            <div className="mw-actions">
              <button className="mw-btn mw-btnPrimary" onClick={() => setEditOpen((v) => !v)}>
                <Icon name="edit" /> Редактировать
              </button>
              <Link className="mw-btn" href="/catalog">
                Каталог →
              </Link>
            </div>
          </div>

          {/* KPI row */}
          <div className="mwProfileKpis">
            {[
              { t: "Читаю", v: countReading, e: "📖" },
              { t: "В планах", v: countPlanned, e: "🗓️" },
              { t: "Прочитано", v: countCompleted, e: "✅" },
              { t: "Отложено", v: countHold, e: "⏸️" },
              { t: "Брошено", v: countDropped, e: "🚫" },
            ].map((k) => (
              <div key={k.t} className="mw-cardFlat mwKpi">
                <div className="mw-muted">{k.e} {k.t}</div>
                <div className="mwKpiVal">{loadingLists ? "…" : k.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mw-container mw-main">
        {error ? <div className="mwNotice mwNoticeErr">{error}</div> : null}
        {okMsg ? <div className="mwNotice mwNoticeOk">{okMsg}</div> : null}

        {/* Settings */}
        {editOpen ? (
          <section className="mw-cardFlat">
            <div className="mwSectionHead">
              <div className="mwSectionTitle">
                <span className="mwIconBox" aria-hidden><Icon name="edit" /></span>
                Настройки профиля
              </div>
              <button className="mw-btn" onClick={() => setEditOpen(false)} disabled={saving}>
                Закрыть
              </button>
            </div>

            <div className="mwGrid2">
              <div>
                <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>НИК (до 15 символов)</div>
                <input
                  className="mw-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Например: Egor"
                  maxLength={15}
                />
                <div className="mw-muted2" style={{ marginTop: 8 }}>
                  Минимум 3 символа. Можно оставить пустым.
                </div>
              </div>

              <div>
                <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>EMAIL</div>
                <input className="mw-input" value={me?.email || user?.email || ""} readOnly />
                <div className="mw-muted2" style={{ marginTop: 8 }}>
                  Email используется для входа и не изменяется в настройках профиля.
                </div>
              </div>
            </div>

            <div className="mw-row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
              <button className="mw-btn" onClick={() => setEditOpen(false)} disabled={saving}>
                Отмена
              </button>
              <button className="mw-btn mw-btnPrimary" onClick={saveProfile} disabled={saving}>
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
            </div>
          </section>
        ) : null}

        {/* Add to lists */}
        <section className="mw-cardFlat">
          <div className="mwSectionHead">
            <div className="mwSectionTitle">
              <span className="mwIconBox" aria-hidden><Icon name="search" /></span>
              Добавить мангу в списки
            </div>
          </div>

          <div className="mwGrid2" style={{ alignItems: "end" }}>
            <div>
              <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>ПОИСК</div>
              <input
                className="mw-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Введи название…"
              />
            </div>

            <div className="mw-row" style={{ justifyContent: "flex-end" }}>
              <button className="mw-btn mw-btnPrimary" onClick={searchComics} disabled={searching}>
                {searching ? "Поиск..." : "Найти"}
              </button>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="mw-gridWide" style={{ marginTop: 12 }}>
              {results.map((r) => (
                <div key={r.id} className="mw-cardLink" style={{ padding: 12 }}>
                  <div className="mwProfileResultRow">
                    <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                      <div className="mw-cover" aria-hidden>
                        {r.coverUrl ? <img src={r.coverUrl} alt="" /> : <span>📘</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="mwStrong">{r.title}</div>
                        <div className="mw-muted">ID: {r.id}</div>
                      </div>
                    </div>

                    <div className="mw-row">
                      <button className="mw-btn" onClick={() => addToList(r.id, "planned")}>
                        В планах
                      </button>
                      <button className="mw-btn mw-btnPrimary" onClick={() => addToList(r.id, "reading")}>
                        Читаю
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mw-muted2" style={{ marginTop: 10 }}>
              Введи запрос и нажми «Найти». Результаты появятся ниже.
            </div>
          )}
        </section>

        {/* Lists (5 columns) */}
        <section className="mw-cardFlat">
          <div className="mwSectionHead">
            <div className="mwSectionTitle">
              <span className="mwIconBox" aria-hidden><Icon name="lists" /></span>
              Списки чтения
            </div>
            <div className="mw-muted">{loadingLists ? "…" : countAll}</div>
          </div>

          <div className="mwProfileGrid5">
            {(["reading", "planned", "completed", "on_hold", "dropped"] as Status[]).map((st) => (
              <div key={st} className="mw-cardFlat mwStatusCol">
                <div className="mwStatusHead">
                  <div className="mwStrong">
                    <span style={{ marginRight: 8 }} aria-hidden>{STATUS_EMOJI[st]}</span>
                    {STATUS_LABEL[st]}
                  </div>
                  <span className="mw-badge">{loadingLists ? "…" : grouped[st].length}</span>
                </div>

                {!loadingLists && grouped[st].length === 0 ? (
                  <div className="mw-muted2">Пока пусто</div>
                ) : (
                  <div className="mwStatusList">
                    {grouped[st].map((it) => (
                      <div key={it.id} className="mwStatusItem">
                        <div className="mw-cover" aria-hidden>
                          {it.coverUrl ? <img src={it.coverUrl} alt="" /> : <span>📙</span>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/comics/${it.comicId}`} className="mwStatusLink">
                            {it.title}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Friends */}
        <section className="mw-cardFlat">
          <div className="mwSectionHead">
            <div className="mwSectionTitle">
              <span className="mwIconBox" aria-hidden><Icon name="friends" /></span>
              Друзья
            </div>
            <div className="mw-muted">{loadingFriends ? "…" : friends.length}</div>
          </div>

          <div className="mwGrid2" style={{ alignItems: "end" }}>
            <div>
              <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>EMAIL ДРУГА</div>
              <input
                className="mw-input"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="friend@mail.com"
              />
            </div>
            <div className="mw-row" style={{ justifyContent: "flex-end" }}>
              <button className="mw-btn mw-btnPrimary" onClick={sendFriendRequest}>
                Отправить заявку
              </button>
            </div>
          </div>

          <div className="mwFriendsGrid">
            <div className="mw-cardFlat">
              <div className="mwStrong">Мои друзья</div>
              <div className="mw-muted2">Список подтверждённых друзей</div>

              <div className="mwFriendsList">
                {friends.length === 0 && !loadingFriends ? <div className="mw-muted2">Пока нет</div> : null}
                {friends.map((f) => (
                  <div key={f.userId} className="mwFriendRow">
                    <Link href={`/users/${f.userId}`} className="mwFriendLink">
                      <div className="mwStrong">{f.username}</div>
                      <div className="mw-muted">{f.email}</div>
                    </Link>
                    <button className="mw-btn" onClick={() => removeFriend(f.userId)}>
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mw-cardFlat">
              <div className="mwStrong">Входящие заявки</div>
              <div className="mw-muted2">Кто хочет добавить тебя</div>

              <div className="mwFriendsList">
                {incoming.length === 0 && !loadingFriends ? <div className="mw-muted2">Нет</div> : null}
                {incoming.map((r) => (
                  <div key={r.requestId} className="mwFriendRow">
                    <Link href={`/users/${r.fromUserId}`} className="mwFriendLink">
                      <div className="mwStrong">{r.username}</div>
                      <div className="mw-muted">{r.email}</div>
                    </Link>
                    <button className="mw-btn mw-btnPrimary" onClick={() => acceptRequest(r.requestId)}>
                      Принять
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mw-cardFlat">
              <div className="mwStrong">Исходящие заявки</div>
              <div className="mw-muted2">Ожидают подтверждения</div>

              <div className="mwFriendsList">
                {outgoing.length === 0 && !loadingFriends ? <div className="mw-muted2">Нет</div> : null}
                {outgoing.map((r) => (
                  <div key={r.requestId} className="mwFriendRow">
                    <Link href={`/users/${r.toUserId}`} className="mwFriendLink">
                      <div className="mwStrong">{r.username}</div>
                      <div className="mw-muted">{r.email}</div>
                    </Link>
                    <button className="mw-btn" onClick={() => removeFriend(r.toUserId)}>
                      Отменить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}