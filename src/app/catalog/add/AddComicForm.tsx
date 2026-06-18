"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import styles from "./add.module.css";

type ComicStatus = "ongoing" | "completed";
type FeedbackTone = "success" | "error";

type FeedbackState = {
  tone: FeedbackTone;
  text: string;
} | null;

export default function AddComicForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [status, setStatus] = useState<ComicStatus>("ongoing");
  const [genresText, setGenresText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const parsedGenres = useMemo(
    () =>
      Array.from(
        new Set(
          genresText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ),
    [genresText],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const normalizedYear = releaseYear.trim();
    if (normalizedYear && !/^\d{4}$/.test(normalizedYear)) {
      setFeedback({ tone: "error", text: "Год выпуска должен быть в формате YYYY, например 2024." });
      return;
    }

    if (parsedGenres.length === 0) {
      setFeedback({ tone: "error", text: "Добавь хотя бы один жанр через запятую." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comics/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          authorName: authorName.trim(),
          description: description.trim() || null,
          coverUrl: coverUrl.trim() || null,
          releaseYear: normalizedYear ? Number(normalizedYear) : null,
          status,
          genreNames: parsedGenres,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setFeedback({ tone: "error", text: data.message ?? "Не удалось добавить мангу. Попробуй ещё раз." });
        return;
      }

      setFeedback({ tone: "success", text: "Манга добавлена. Возвращаемся в каталог..." });
      router.push("/catalog");
      router.refresh();
    } catch {
      setFeedback({ tone: "error", text: "Ошибка сети. Проверь подключение и повтори попытку." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mw-page">
      <section className="mw-hero">
        <div className="mw-container">
          <div className="mw-heroTop">
            <div className={styles.heroCopy}>
              <span className="mw-pill">Admin</span>
              <h1 className="mw-h1">
                Добавить мангу
              </h1>
              <p className="mw-subtitle">
                Заполни карточку тайтла, добавь автора и жанры. После сохранения манга сразу появится в каталоге.
              </p>
            </div>

            <div className={styles.heroActions}>
              <Link className="mw-btn" href="/admin/comics">
                В админку
              </Link>
              <Link className="mw-btn" href="/catalog">
                В каталог
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mw-container mw-main">
        <section className={styles.contentGrid}>
          <div className={`mw-card ${styles.formCard}`}>
            <div className={styles.formTop}>
              <div className="mw-title" style={{ fontSize: 24 }}>
                Данные манги
              </div>
              <div className="mw-muted2">Поля со звёздочкой обязательны для публикации.</div>
            </div>

            {feedback ? (
              <div
                className={`${styles.feedback} ${
                  feedback.tone === "error" ? styles.feedbackError : styles.feedbackSuccess
                }`}
              >
                {feedback.text}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="title">
                  Название *
                </label>
                <input
                  id="title"
                  className="mw-input"
                  placeholder="Например: Solo Leveling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="author">
                  Автор *
                </label>
                <input
                  id="author"
                  className="mw-input"
                  placeholder="Например: Chugong"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                />
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="description">
                  Описание
                </label>
                <textarea
                  id="description"
                  className={`mw-input ${styles.textarea}`}
                  placeholder="Коротко о сюжете и мире тайтла..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="cover">
                  Обложка (URL)
                </label>
                <input
                  id="cover"
                  className="mw-input"
                  type="url"
                  placeholder="https://..."
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="year">
                  Год выпуска
                </label>
                <input
                  id="year"
                  className="mw-input"
                  placeholder="2024"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(e.target.value)}
                  inputMode="numeric"
                />
                <div className={styles.hint}>Формат: YYYY.</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="status">
                  Статус
                </label>
                <select
                  id="status"
                  className={`mw-input ${styles.select}`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ComicStatus)}
                >
                  <option value="ongoing">Выходит</option>
                  <option value="completed">Завершена</option>
                </select>
              </div>

              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label} htmlFor="genres">
                  Жанры *
                </label>
                <input
                  id="genres"
                  className="mw-input"
                  placeholder="Action, Drama, Romance"
                  value={genresText}
                  onChange={(e) => setGenresText(e.target.value)}
                  required
                />
                <div className={styles.hint}>
                  Вводи жанры через запятую. Дубликаты удаляются автоматически.
                </div>
              </div>

              <div className={`${styles.actions} ${styles.fieldFull}`}>
                <button className={`mw-btn mw-btnPrimary ${styles.submitBtn}`} disabled={loading} type="submit">
                  {loading ? "Сохраняю..." : "Добавить мангу"}
                </button>
                <Link className="mw-btn" href="/catalog">
                  Отмена
                </Link>
              </div>
            </form>
          </div>

          <aside className={`mw-cardFlat ${styles.previewCard}`}>
            <div className={styles.coverFrame} aria-hidden>
              {coverUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl.trim()} alt="" className={styles.coverImage} />
              ) : (
                <span className={styles.coverStub}>Предпросмотр обложки</span>
              )}
            </div>

            <div>
              <h2 className={styles.previewTitle}>{title.trim() || "Название манги"}</h2>
              <div className={styles.previewAuthor}>{authorName.trim() || "Имя автора"}</div>
            </div>

            <div className={styles.previewRow}>
              <span className="mw-badge">{status === "ongoing" ? "Выходит" : "Завершена"}</span>
              {releaseYear.trim() ? <span className="mw-badge">{releaseYear.trim()}</span> : null}
              <span className="mw-badge">Жанров: {parsedGenres.length}</span>
            </div>

            <div className={styles.hint}>
              Карточка помогает проверить, как данные будут выглядеть в каталоге после публикации.
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
