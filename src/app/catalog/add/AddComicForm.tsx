"use client";

// UI: форма добавления манги (клиентская)
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddComicForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [releaseYear, setReleaseYear] = useState<string>("");
  const [status, setStatus] = useState<"ongoing" | "completed">("ongoing");
  const [genresText, setGenresText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const genreNames = genresText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch("/api/comics/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        authorName,
        description: description || null,
        coverUrl: coverUrl || null,
        releaseYear: releaseYear ? Number(releaseYear) : null,
        status,
        genreNames,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMsg(data?.message || "Ошибка добавления");
      return;
    }

    setMsg("✅ Добавлено!");
    router.push("/catalog");
    router.refresh();
  }

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Добавить мангу</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input placeholder="Автор" value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />

        <textarea placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />

        <input placeholder="Обложка (URL)" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />

        <input
          placeholder="Год выпуска (например 2020)"
          value={releaseYear}
          onChange={(e) => setReleaseYear(e.target.value)}
          inputMode="numeric"
        />

        <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="ongoing">ongoing</option>
          <option value="completed">completed</option>
        </select>

        <input
          placeholder="Жанры через запятую (Action, Drama, Romance)"
          value={genresText}
          onChange={(e) => setGenresText(e.target.value)}
          required
        />

        <button disabled={loading} type="submit">
          {loading ? "Добавляю..." : "Добавить"}
        </button>

        {msg && <div style={{ opacity: 0.85 }}>{msg}</div>}
      </form>
    </div>
  );
}
