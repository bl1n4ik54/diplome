"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ContinueItem = {
  comicId: number;
  comicTitle: string;
  authorName: string | null;
  coverUrl: string | null;
  chapterId: number;
  chapterNumber: number;
  page: number | null;
  totalPages: number;
};

type ComicCard = {
  id: number;
  title: string;
  authorName: string | null;
  coverUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  favCount: number;
  releaseYear: number | null;
  status: string | null;
};

type LatestChapter = {
  comicId: number;
  comicTitle: string;
  authorName: string | null;
  coverUrl: string | null;
  chapterId: number;
  chapterNumber: number;
  createdAt: string | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function pct(page: number, total: number) {
  if (!total || total <= 0) return 0;
  return clamp(Math.round((page / total) * 100), 0, 100);
}
function fmtRating(avg: number | null, count: number) {
  if (!avg || count <= 0) return "—";
  return `${avg.toFixed(1)} (${count})`;
}

// Японский стикер (замена Pill)
function JapaneseBadge({ children, variant = "default" }: { children: React.ReactNode; variant?: "red" | "default" }) {
  const baseStyle: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 30,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.03em",
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
    border: variant === "red" ? "none" : "1px solid rgba(255,255,255,0.2)",
    background: variant === "red" ? "#D32F2F" : "rgba(20,20,25,0.8)",
    color: variant === "red" ? "white" : "rgba(255,255,255,0.9)",
    boxShadow: variant === "red" ? "0 2px 10px rgba(211,47,47,0.3)" : "none",
  };
  return <span style={baseStyle}>{children}</span>;
}

function ButtonLink({
  href,
  children,
  variant = "primary",
  icon,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline";
  icon?: string;
}) {
  const base: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 40,
    border: "none",
    textDecoration: "none",
    color: "inherit",
    fontWeight: 700,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "all 0.2s",
    cursor: "pointer",
  };

  let variantStyle: React.CSSProperties = {};
  if (variant === "primary") {
    variantStyle = {
      background: "#D32F2F",
      color: "white",
      boxShadow: "0 4px 14px rgba(211,47,47,0.35)",
    };
  } else if (variant === "ghost") {
    variantStyle = {
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.15)",
      backdropFilter: "blur(4px)",
    };
  } else if (variant === "outline") {
    variantStyle = {
      background: "transparent",
      border: "1px solid rgba(211,47,47,0.5)",
      color: "#D32F2F",
    };
  }

  return (
    <Link href={href} style={{ ...base, ...variantStyle }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      {children}
    </Link>
  );
}

function GlassCard({
  title,
  icon,
  hint,
  children,
  footer,
}: {
  title: string;
  icon?: string;
  hint?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(18, 18, 24, 0.7)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 28,
        padding: 18,
        display: "grid",
        gap: 14,
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: "rgba(211,47,47,0.2)",
              border: "1px solid rgba(211,47,47,0.3)",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
            }}
          >
            {icon ?? "📖"}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            {hint && <div style={{ opacity: 0.6, fontSize: 12, marginTop: 2 }}>{hint}</div>}
          </div>
        </div>
        <JapaneseBadge>⚡ быстрый доступ</JapaneseBadge>
      </div>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
      {footer && <div style={{ marginTop: 4 }}>{footer}</div>}
    </div>
  );
}

function FeatureRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        borderRadius: 20,
        padding: "14px 16px",
        border: "1px solid rgba(255,255,255,0.05)",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 22, filter: "drop-shadow(0 2px 4px rgba(211,47,47,0.3))" }}>{icon}</span>
        <span style={{ fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ opacity: 0.7, fontSize: 13, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function PosterCard({
  href,
  coverUrl,
  title,
  subtitle,
  tags,
}: {
  href: string;
  coverUrl: string | null;
  title: string;
  subtitle?: string;
  tags?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#14141a",
        minHeight: 200,
        position: "relative",
        display: "grid",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 20px 30px rgba(211,47,47,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.7) contrast(1.2)",
        }}
        aria-hidden
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(0deg, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0.4) 70%, transparent 100%)",
        }}
        aria-hidden
      />
      <div style={{ position: "relative", padding: 18, display: "grid", gap: 8, alignContent: "end" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{tags}</div>
        <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ opacity: 0.7, fontSize: 12 }}>{subtitle}</div>}
      </div>
    </Link>
  );
}

function SmallListCard({
  href,
  coverUrl,
  title,
  meta,
  right,
}: {
  href: string;
  coverUrl: string | null;
  title: string;
  meta?: string;
  right?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "inherit",
        background: "rgba(20,20,26,0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 20,
        padding: 12,
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,30,38,0.9)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(20,20,26,0.8)")}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
        <div
          style={{
            width: 56,
            height: 80,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#1e1e24",
            flexShrink: 0,
          }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 24 }}>📘</div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </div>
          {meta && (
            <div
              style={{
                opacity: 0.6,
                fontSize: 12,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 4,
              }}
            >
              {meta}
            </div>
          )}
        </div>
      </div>
      {right && <div style={{ display: "grid", gap: 6, justifyItems: "end", flexShrink: 0 }}>{right}</div>}
    </Link>
  );
}

// Компонент для свежей главы (компактный)
function ChapterItem({ chapter, href }: { chapter: LatestChapter; href: string }) {
  const date = chapter.createdAt ? new Date(chapter.createdAt).toLocaleDateString("ru-RU") : "";
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          width: 40,
          height: 56,
          borderRadius: 8,
          overflow: "hidden",
          background: "#1e1e24",
          flexShrink: 0,
        }}
      >
        {chapter.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={chapter.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {chapter.comicTitle}
        </div>
        <div style={{ display: "flex", gap: 8, fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          <span>Гл. {chapter.chapterNumber}</span>
          {date && <span>• {date}</span>}
        </div>
      </div>
      <JapaneseBadge variant="red">new</JapaneseBadge>
    </Link>
  );
}

export default function HomeClient({
  brand,
  isAuthed,
  role,
  kpis,
  stats,
  continueItems,
  trending,
  newItems,
  latestChapters,
}: {
  brand: string;
  isAuthed: boolean;
  role: string;
  kpis: { comics: number; genres: number; users: number };
  stats: { fav: number; list: number; friends: number } | null;
  continueItems: ContinueItem[];
  trending: ComicCard[];
  newItems: ComicCard[];
  latestChapters: LatestChapter[];
}) {
  const router = useRouter();
  const maxWidth = 1400;
  const [quickQ, setQuickQ] = useState("");

  function goSearch() {
    const q = quickQ.trim();
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog");
  }

  function randomPick() {
    const pool = [...trending, ...newItems];
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/comics/${pick.id}`);
  }

  const top3 = trending.slice(0, 3);
  const fresh6 = newItems.slice(0, 6);
  const cont3 = continueItems.slice(0, 3);
  const latest6 = latestChapters.slice(0, 6);

  const chips = useMemo(
    () => [
      { label: "🏆 Популярное", onClick: () => router.push("/catalog?sort=rating") },
      { label: "🆕 Новинки", onClick: () => router.push("/catalog?sort=new") },
      { label: "✅ Завершённые", onClick: () => router.push("/catalog?status=completed") },
      { label: "📅 По годам", onClick: () => router.push("/catalog?sort=year") },
    ],
    [router]
  );

  return (
    <div style={{ background: "#0C0C10", minHeight: "calc(100vh - 72px)" }}>
      {/* Фон с японским скринтоном (едва заметные точки) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* HERO */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          padding: "40px 16px 24px",
          background: "radial-gradient(800px 500px at 20% 0%, rgba(211,47,47,0.2), transparent 70%), #0C0C10",
          borderBottom: "1px solid rgba(211,47,47,0.2)",
        }}
      >
        <div style={{ maxWidth, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, alignItems: "start" }}>
            {/* Левый блок */}
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>🗾</span>
                <JapaneseBadge variant="red">MANGA WORLD</JapaneseBadge>
                <JapaneseBadge>since 2025</JapaneseBadge>
              </div>

              <h1 style={{ margin: 0, fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                {brand} — <span style={{ color: "#D32F2F", borderBottom: "4px solid #D32F2F" }}>твой личный</span>
                <br />
                свиток с мангой
              </h1>

              <div style={{ opacity: 0.8, fontSize: 16, lineHeight: 1.7, maxWidth: 620 }}>
                Каталог, закладки, прогресс и друзья. Всё, чтобы читать мангу с удовольствием.
              </div>

              {/* Кнопки */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {!isAuthed ? (
                  <>
                    <ButtonLink href="/register" variant="primary" icon="⚡">
                      Начать читать
                    </ButtonLink>
                    <ButtonLink href="/login" variant="ghost" icon="🔐">
                      Войти
                    </ButtonLink>
                  </>
                ) : (
                  <>
                    <ButtonLink href="/profile" variant="primary" icon="👤">
                      Мой профиль
                    </ButtonLink>
                    <ButtonLink href="/catalog" variant="ghost" icon="📚">
                      Каталог
                    </ButtonLink>
                    {role === "admin" && (
                      <ButtonLink href="/admin" variant="ghost" icon="🛠️">
                        Админка
                      </ButtonLink>
                    )}
                  </>
                )}
                <button
                  onClick={randomPick}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 40,
                    border: "1px solid rgba(211,47,47,0.3)",
                    background: "transparent",
                    color: "#D32F2F",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  🎲 Случайный тайтл
                </button>
              </div>

              {/* Чипсы */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {chips.map((c) => (
                  <button
                    key={c.label}
                    onClick={c.onClick}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 40,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(20,20,26,0.7)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* KPI */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 8 }}>
                {[
                  { v: `${kpis.comics}+`, t: "Тайтлов" },
                  { v: `${kpis.genres}+`, t: "Жанров" },
                  { v: `${kpis.users}+`, t: "Читателей" },
                ].map((x) => (
                  <div
                    key={x.t}
                    style={{
                      background: "rgba(20,20,26,0.5)",
                      backdropFilter: "blur(4px)",
                      borderRadius: 24,
                      padding: 16,
                      textAlign: "center",
                      border: "1px solid rgba(211,47,47,0.2)",
                    }}
                  >
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#D32F2F" }}>{x.v}</div>
                    <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>{x.t}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Правый блок — быстрый старт + продолжить */}
            <div style={{ display: "grid", gap: 16 }}>
              <GlassCard title="Быстрый старт" icon="⚡" hint="найди мангу за секунду">
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={quickQ}
                    onChange={(e) => setQuickQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goSearch()}
                    placeholder="Название, автор..."
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 40,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(0,0,0,0.3)",
                      color: "white",
                      outline: "none",
                      fontSize: 14,
                    }}
                  />
                  <button
                    onClick={goSearch}
                    style={{
                      padding: "12px 24px",
                      borderRadius: 40,
                      border: "none",
                      background: "#D32F2F",
                      color: "white",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Искать
                  </button>
                </div>
                <FeatureRow icon="📖" title="Прогресс чтения" text="Мы запоминаем главу и страницу — продолжай с того места, где остановился." />
                <FeatureRow icon="⭐" title="Избранное и оценки" text="Ставь оценки, добавляй в любимое. Рейтинги формируются автоматически." />
                <FeatureRow icon="👥" title="Друзья" text="Следи за активностью друзей и открывай их коллекции." />
              </GlassCard>

              {isAuthed && cont3.length > 0 && (
                <GlassCard title="Продолжить чтение" icon="⏩" hint="последние главы">
                  {cont3.map((it) => {
                    const cur = it.page ?? 1;
                    const total = it.totalPages ?? 0;
                    const percent = pct(cur, total);
                    return (
                      <SmallListCard
                        key={`${it.comicId}-${it.chapterId}`}
                        href={`/comics/${it.comicId}/chapters/${it.chapterId}?page=${cur}`}
                        coverUrl={it.coverUrl}
                        title={it.comicTitle}
                        meta={`${it.authorName ?? ""} • Гл. ${it.chapterNumber} • ${cur}/${total} стр.`}
                        right={<JapaneseBadge variant="red">{percent}%</JapaneseBadge>}
                      />
                    );
                  })}
                </GlassCard>
              )}

              {isAuthed && stats && (
                <div
                  style={{
                    background: "rgba(211,47,47,0.1)",
                    borderRadius: 24,
                    padding: 14,
                    border: "1px solid rgba(211,47,47,0.3)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    ❤ {stats.fav} избр. · 📋 {stats.list} списков · 👥 {stats.friends} друзей
                  </div>
                  <Link href="/profile" style={{ color: "#D32F2F", fontWeight: 700, textDecoration: "none" }}>
                    Мой профиль →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Основной контент */}
      <main style={{ maxWidth, margin: "0 auto", padding: "32px 16px 60px", display: "grid", gap: 40, position: "relative", zIndex: 1 }}>
        {/* Блок свежих глав (новый) */}
        {latest6.length > 0 && (
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, letterSpacing: 1 }}>СВЕЖИЕ ГЛАВЫ</div>
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0" }}>Новые поступления</h2>
              </div>
              <Link href="/updates" style={{ color: "#D32F2F", fontWeight: 600, textDecoration: "none" }}>
                Все обновления →
              </Link>
            </div>
            <div
              style={{
                background: "rgba(20,20,26,0.5)",
                backdropFilter: "blur(8px)",
                borderRadius: 28,
                padding: 20,
                border: "1px solid rgba(211,47,47,0.2)",
              }}
            >
              {latest6.map((ch) => (
                <ChapterItem key={ch.chapterId} chapter={ch} href={`/comics/${ch.comicId}/chapters/${ch.chapterId}`} />
              ))}
            </div>
          </section>
        )}

        {/* Популярное */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, letterSpacing: 1 }}>ПОПУЛЯРНОЕ</div>
              <h2 style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0" }}>Лучшее в библиотеке</h2>
            </div>
            <Link href="/catalog?sort=rating" style={{ color: "#D32F2F", fontWeight: 600, textDecoration: "none" }}>
              Весь топ →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {top3.map((c) => (
              <PosterCard
                key={c.id}
                href={`/comics/${c.id}`}
                coverUrl={c.coverUrl}
                title={c.title}
                subtitle={`${c.authorName ?? "Автор"}${c.releaseYear ? ` • ${c.releaseYear}` : ""}${c.status ? ` • ${c.status}` : ""}`}
                tags={
                  <>
                    <JapaneseBadge>★ {fmtRating(c.ratingAvg, c.ratingCount)}</JapaneseBadge>
                    <JapaneseBadge>❤ {c.favCount}</JapaneseBadge>
                  </>
                }
              />
            ))}
          </div>
        </section>

        {/* Новинки */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, letterSpacing: 1 }}>НОВИНКИ</div>
              <h2 style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0" }}>Недавно добавленные</h2>
            </div>
            <Link href="/catalog?sort=new" style={{ color: "#D32F2F", fontWeight: 600, textDecoration: "none" }}>
              Все новинки →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            {fresh6.map((c) => (
              <SmallListCard
                key={c.id}
                href={`/comics/${c.id}`}
                coverUrl={c.coverUrl}
                title={c.title}
                meta={`${c.authorName ?? "Автор"}${c.releaseYear ? ` • ${c.releaseYear}` : ""}${c.status ? ` • ${c.status}` : ""}`}
                right={<JapaneseBadge>★ {fmtRating(c.ratingAvg, c.ratingCount)}</JapaneseBadge>}
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            background: "linear-gradient(145deg, rgba(211,47,47,0.15) 0%, rgba(20,20,26,0.9) 100%)",
            borderRadius: 32,
            padding: 32,
            border: "1px solid rgba(211,47,47,0.3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ maxWidth: 600 }}>
            <JapaneseBadge variant="red">манга ждёт</JapaneseBadge>
            <h3 style={{ fontSize: 32, fontWeight: 700, margin: "16px 0 8px" }}>Готов окунуться в мир манги?</h3>
            <p style={{ opacity: 0.8, fontSize: 16, lineHeight: 1.6 }}>
              Открывай каталог, добавляй в избранное, читай и делись впечатлениями с друзьями.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <ButtonLink href="/catalog" variant="primary" icon="📚">
              В каталог
            </ButtonLink>
            {!isAuthed && (
              <ButtonLink href="/register" variant="outline" icon="✨">
                Регистрация
              </ButtonLink>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}