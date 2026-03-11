"use client";

export default function MangaActions({ comicId, isAuthed }: { comicId: number; isAuthed: boolean }) {
  async function add(status: "reading" | "planned") {
    if (!isAuthed) {
      window.location.href = "/login";
      return;
    }
    await fetch("/api/profile/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comicId, status }),
    });
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
        БЫСТРЫЕ ДЕЙСТВИЯ
      </div>

      <div className="mw-row">
        <button className="mw-btn" onClick={() => add("planned")}>
          🗓️ В планах
        </button>
        <button className="mw-btn mw-btnPrimary" onClick={() => add("reading")}>
          📖 Читаю
        </button>
      </div>

      <div className="mw-muted2">
        Статусы и списки можно посмотреть и менять в профиле.
      </div>
    </div>
  );
}