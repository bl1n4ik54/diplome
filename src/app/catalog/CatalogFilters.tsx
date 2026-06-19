"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Minus, Plus, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";

type CatalogSort = "newest" | "rating" | "year";
type CatalogSortDir = "asc" | "desc";
type GenreOption = { id: number; name: string };

function toggleNumber(list: number[], id: number) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export default function CatalogFilters({
  genres,
  query,
  sort,
  sortDir,
  includedGenreIds,
  excludedGenreIds,
}: {
  genres: GenreOption[];
  query: string;
  sort: CatalogSort;
  sortDir: CatalogSortDir;
  includedGenreIds: number[];
  excludedGenreIds: number[];
}) {
  const [open, setOpen] = useState(false);
  const [included, setIncluded] = useState(includedGenreIds);
  const [excluded, setExcluded] = useState(excludedGenreIds);
  const activeFilters =
    included.length +
    excluded.length +
    (query.trim() ? 1 : 0) +
    (sort !== "newest" ? 1 : 0) +
    (sortDir !== "desc" ? 1 : 0);

  function setGenreMode(id: number, mode: "include" | "exclude" | "neutral") {
    if (mode === "include") {
      setIncluded((current) => toggleNumber(current, id));
      setExcluded((current) => current.filter((item) => item !== id));
      return;
    }

    if (mode === "exclude") {
      setExcluded((current) => toggleNumber(current, id));
      setIncluded((current) => current.filter((item) => item !== id));
      return;
    }

    setIncluded((current) => current.filter((item) => item !== id));
    setExcluded((current) => current.filter((item) => item !== id));
  }

  function cycleGenreMode(id: number) {
    if (included.includes(id)) {
      setGenreMode(id, "exclude");
      return;
    }

    if (excluded.includes(id)) {
      setGenreMode(id, "neutral");
      return;
    }

    setGenreMode(id, "include");
  }

  return (
    <form action="/catalog" method="GET" style={{ display: "grid", gap: 12 }}>
      {included.map((id) => (
        <input key={`include-${id}`} type="hidden" name="genre" value={id} />
      ))}
      {excluded.map((id) => (
        <input key={`exclude-${id}`} type="hidden" name="excludeGenre" value={id} />
      ))}

      <div className="mw-row">
        <div style={{ flex: 1, minWidth: "min(240px, 100%)" }}>
          <div className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
            ПОИСК
          </div>
          <input
            name="q"
            defaultValue={query}
            placeholder="Название или автор..."
            className="mw-input"
          />
        </div>

        <button
          type="button"
          className="mw-btn"
          aria-expanded={open}
          aria-controls="catalog-filter-panel"
          onClick={() => setOpen((value) => !value)}
          style={{ marginTop: 18 }}
        >
          {open ? <X size={17} strokeWidth={2.3} /> : <Menu size={17} strokeWidth={2.3} />}
          Фильтры{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </button>

        <button type="submit" className="mw-btn mw-btnPrimary" style={{ marginTop: 18 }}>
          <Search size={17} strokeWidth={2.3} />
          Найти
        </button>

        {activeFilters > 0 ? (
          <Link className="mw-btn" href="/catalog" style={{ marginTop: 18 }}>
            <RotateCcw size={17} strokeWidth={2.3} />
            Сбросить
          </Link>
        ) : null}
      </div>

      <div
        id="catalog-filter-panel"
        className="mw-cardFlat"
        style={{
          display: open ? "grid" : "none",
          gap: 16,
          background: "rgba(255,255,255,0.025)",
        }}
      >
        <div className="mw-sectionHead">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 950, fontSize: 16 }}>
            <SlidersHorizontal size={18} strokeWidth={2.3} />
            Сортировка
          </div>
          <div className="mw-muted2">Все параметры применяются после кнопки «Найти».</div>
        </div>

        <div className="catalogFiltersLayout">
          <div className="mw-cardFlat catalogSortPanel">
            <label style={{ display: "grid", gap: 6 }}>
              <span className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
                СОРТИРОВАТЬ ПО
              </span>
              <select name="sort" defaultValue={sort} className="mw-input mw-select">
                <option value="newest">Дата добавления</option>
                <option value="rating">Рейтинг</option>
                <option value="year">Год выпуска</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="mw-muted" style={{ fontWeight: 950, letterSpacing: 1.2 }}>
                ПОРЯДОК
              </span>
              <select name="dir" defaultValue={sortDir} className="mw-input mw-select">
                <option value="desc">По убыванию</option>
                <option value="asc">По возрастанию</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
            <div className="mw-sectionHead">
              <div style={{ fontWeight: 950, fontSize: 16 }}>Жанры</div>
              <div className="mw-muted2">Клик: любой → добавить → избегать.</div>
            </div>

            <ul
              className="catalogGenreList"
              style={{
                display: "grid",
                gap: 8,
                overflow: "auto",
                padding: "0 4px 0 0",
                margin: 0,
                listStyle: "none",
              }}
            >
              {genres.length === 0 ? (
                <li className="mw-muted2">Жанры пока не добавлены.</li>
              ) : (
              genres.map((genre) => {
                const isIncluded = included.includes(genre.id);
                const isExcluded = excluded.includes(genre.id);
                const mode = isIncluded ? "include" : isExcluded ? "exclude" : "neutral";
                const genreName = genre.name.trim() || `Жанр #${genre.id}`;

                return (
                  <li
                    key={genre.id}
                    className="catalogGenreItem"
                  >
                    <button
                      type="button"
                      className="catalogGenreRow"
                      data-mode={mode}
                      onClick={() => cycleGenreMode(genre.id)}
                      aria-pressed={mode !== "neutral"}
                      title={genreName}
                    >
                      <span className="catalogGenreName">{genreName}</span>
                        <span className="catalogGenreState">
                          {isIncluded ? (
                            <>
                              <Plus size={15} strokeWidth={2.5} />
                              Добавить
                            </>
                          ) : isExcluded ? (
                            <>
                              <Minus size={15} strokeWidth={2.5} />
                              Избегать
                            </>
                          ) : (
                            "Любой"
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
