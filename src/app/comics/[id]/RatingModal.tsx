"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const RATING_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type RatingValue = (typeof RATING_VALUES)[number];

function isRatingValue(value: number): value is RatingValue {
  return Number.isInteger(value) && value >= 1 && value <= 10;
}

function formatRating(avg: number | null, count: number) {
  if (!avg || count <= 0) return "Нет оценок";
  return `${avg.toFixed(1)} из 10 (${count})`;
}

export default function RatingModal({
  comicId,
  isAuthed,
  initialRatingAvg,
  initialRatingCount,
  initialMyRating,
}: {
  comicId: number;
  isAuthed: boolean;
  initialRatingAvg: number | null;
  initialRatingCount: number;
  initialMyRating?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [ratingAvg, setRatingAvg] = useState<number | null>(initialRatingAvg);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [myRating, setMyRating] = useState<number | null>(initialMyRating ?? null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function openModal() {
    if (!isAuthed) {
      window.location.href = "/auth/login";
      return;
    }

    setOpen(true);
    setMessage("");
    setError("");
  }

  async function submitRating(value: RatingValue) {
    const previousRating = myRating;
    setMyRating(value);
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comicId, value }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Не удалось сохранить оценку");
      }

      setMyRating(Number(data?.myRating) || value);
      setRatingAvg(typeof data?.ratingAvg === "number" ? data.ratingAvg : null);
      setRatingCount(Number.isFinite(Number(data?.ratingCount)) ? Number(data.ratingCount) : ratingCount);
      setMessage("Оценка сохранена");
    } catch (err) {
      setMyRating(previousRating);
      setError(err instanceof Error ? err.message : "Не удалось сохранить оценку");
    } finally {
      setSaving(false);
    }
  }

  const activeRating = hoveredRating ?? myRating ?? 0;

  return (
    <>
      <button className="mw-btn mw-ratingTrigger" type="button" onClick={openModal}>
        <Star size={16} fill="currentColor" strokeWidth={2.2} aria-hidden />
        {myRating ? `Моя оценка: ${myRating}/10` : "Оценить тайтл"}
      </button>

      {open ? (
        <div
          className="mw-modalBackdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="mw-ratingModal" role="dialog" aria-modal="true" aria-labelledby="rating-modal-title">
            <div className="mw-ratingModalHead">
              <div>
                <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
                  ОЦЕНКА ТАЙТЛА
                </div>
                <div id="rating-modal-title" className="mw-ratingModalTitle">
                  Поставь оценку
                </div>
              </div>
              <button className="mw-ratingClose" type="button" aria-label="Закрыть" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <div className="mw-ratingSummary">
              <span>Средняя: {formatRating(ratingAvg, ratingCount)}</span>
              {myRating ? <span>Твоя: {myRating}/10</span> : null}
            </div>

            <div className="mw-ratingStars" role="radiogroup" aria-label="Оценка от 1 до 10">
              {RATING_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={value <= activeRating ? "mw-starButton mw-starButtonActive" : "mw-starButton"}
                  role="radio"
                  aria-checked={myRating === value}
                  aria-label={`${value} из 10`}
                  disabled={saving}
                  onClick={() => {
                    if (isRatingValue(value)) void submitRating(value);
                  }}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(null)}
                  onFocus={() => setHoveredRating(value)}
                  onBlur={() => setHoveredRating(null)}
                >
                  <Star size={22} fill="currentColor" strokeWidth={2.2} aria-hidden />
                </button>
              ))}
            </div>

            <div className="mw-ratingScale">
              <span>1</span>
              <span>10</span>
            </div>

            <div className="mw-muted2" aria-live="polite">
              {saving ? "Сохраняю..." : error || message || "Нажми на звезду, чтобы сохранить оценку."}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
