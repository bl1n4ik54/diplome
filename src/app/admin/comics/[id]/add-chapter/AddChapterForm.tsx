"use client";

import { useMemo, useState } from "react";

export default function AddChapterForm({
  comicId,
  suggestedNumber,
}: {
  comicId: number;
  suggestedNumber: number;
}) {
  const [chapterNumber, setChapterNumber] = useState<number>(suggestedNumber);
  const [title, setTitle] = useState("");
  const [pagesText, setPagesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const pages = useMemo(() => {
    return pagesText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [pagesText]);

  async function submit() {
    setMsg("");
    if (!chapterNumber || chapterNumber < 1) {
      setMsg("Укажи номер главы (>= 1)");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/chapters/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comicId,
        chapterNumber,
        title: title.trim() || null,
        pages,
      }),
    });

    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.error ?? "Ошибка добавления");
      return;
    }

    setMsg(`✅ Глава добавлена (ID: ${data?.chapterId}).`);
    setTitle("");
    setPagesText("");
    setChapterNumber((n) => n + 1);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {msg && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {msg}
        </div>
      )}

      <div className="row">
        <div style={{ minWidth: 180 }}>
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 6 }}>Номер главы</div>
          <input
            className="input"
            type="number"
            min={1}
            value={chapterNumber}
            onChange={(e) => setChapterNumber(Number(e.target.value))}
          />
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 6 }}>Название (опционально)</div>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Начало"
          />
        </div>
      </div>

      <div>
        <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 6 }}>
          Страницы (URL, по одной на строку) — сейчас: <b>{pages.length}</b>
        </div>
        <textarea
          className="input"
          style={{ minHeight: 220, resize: "vertical", width: "100%" }}
          value={pagesText}
          onChange={(e) => setPagesText(e.target.value)}
          placeholder={"https://site.com/1.jpg\nhttps://site.com/2.jpg\nhttps://site.com/3.jpg"}
        />
        <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>
          Можно добавить главу и без страниц — потом дополнишь.
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <a className="admin-link" href={`/comics/${comicId}`} style={{ opacity: 0.9 }}>
          Открыть мангу →
        </a>

        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? "Добавляю..." : "Добавить главу"}
        </button>
      </div>
    </div>
  );
}
