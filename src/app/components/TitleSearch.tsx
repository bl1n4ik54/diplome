"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

type SearchItem = {
  id: number;
  title: string;
};

function normalizeItems(value: unknown): SearchItem[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is SearchItem => {
    if (!item || typeof item !== "object") return false;

    const candidate = item as Partial<SearchItem>;
    return typeof candidate.id === "number" && typeof candidate.title === "string";
  });
}

export default function TitleSearch() {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/comics/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          setItems([]);
          setIsOpen(false);
          return;
        }

        const data = (await response.json()) as { items?: unknown };
        const nextItems = normalizeItems(data.items).slice(0, 10);

        setItems(nextItems);
        setIsOpen(nextItems.length > 0);
        setActiveIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setItems([]);
        setIsOpen(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  function goToCatalog() {
    const trimmedQuery = query.trim();

    setIsOpen(false);
    setActiveIndex(-1);
    router.push(trimmedQuery ? `/catalog?q=${encodeURIComponent(trimmedQuery)}` : "/catalog");
  }

  function openTitle(item: SearchItem) {
    setQuery(item.title);
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(`/comics/${item.id}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToCatalog();
  }

  function handleQueryChange(event: ChangeEvent<HTMLInputElement>) {
    const nextQuery = event.target.value;

    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      setItems([]);
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && items.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, items.length - 1));
      return;
    }

    if (event.key === "ArrowUp" && items.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0 && items[activeIndex]) {
      event.preventDefault();
      openTitle(items[activeIndex]);
    }
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }, 0);
  }

  return (
    <form ref={rootRef} action="/catalog" method="GET" className="home-search home-titleSearch" onSubmit={handleSubmit}>
      <div className="home-titleSearchField">
        <input
          name="q"
          value={query}
          onBlur={handleBlur}
          onChange={handleQueryChange}
          onFocus={() => setIsOpen(query.trim().length > 0 && items.length > 0)}
          onKeyDown={handleKeyDown}
          className="home-searchInput"
          placeholder="Поиск по названию или автору..."
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${items[activeIndex]?.id}` : undefined}
        />

        {isOpen ? (
          <div id={listId} className="home-titleSearchDropdown" role="listbox">
            {items.map((item, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={item.id}
                  id={`${listId}-${item.id}`}
                  type="button"
                  className="home-titleSearchOption"
                  data-active={isActive ? "true" : undefined}
                  onClick={() => openTitle(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  aria-selected={isActive}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <button type="submit" className="home-titleSearchButton">
        Найти
      </button>
    </form>
  );
}
