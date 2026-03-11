import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../api/auth/[...nextauth]/route";

import LoginForm from "./LoginForm";

const BG =
  "radial-gradient(700px 350px at 20% 0%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(700px 350px at 80% 0%, rgba(236,72,153,0.16), transparent 60%), #0A0A0F";

const CARD_MIN_H = 440; // ✅ одинаковая высота для входа/регистрации

const cardBase: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.02)",
  borderRadius: 22,
  padding: 18,
  minHeight: CARD_MIN_H,
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) redirect("/profile");

  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        background: BG,
        padding: "28px 16px 42px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14 }}>
        <Link
          href="/"
          style={{
            width: "fit-content",
            textDecoration: "none",
            color: "inherit",
            opacity: 0.85,
            fontWeight: 900,
          }}
        >
          ← MangaWorld
        </Link>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 14,
            alignItems: "stretch",
          }}
        >
          {/* Left hero */}
          <div
            style={{
              ...cardBase,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: 8,
                alignItems: "center",
                width: "fit-content",
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                fontSize: 12,
                fontWeight: 900,
                opacity: 0.95,
              }}
            >
              🔐 Вход в аккаунт
            </div>

            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: -0.6, fontWeight: 950 }}>
              С возвращением в MangaWorld
            </h1>

            <div style={{ opacity: 0.78, lineHeight: 1.55, maxWidth: 520 }}>
              Веди списки чтения, сохраняй прогресс в читалке и собирай любимые тайтлы.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <Link
                href="/catalog"
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: 900,
                }}
              >
                Каталог →
              </Link>
              <Link
                href="/auth/register"
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.10)",
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: 950,
                }}
              >
                Регистрация
              </Link>
            </div>

            <div style={{ marginTop: "auto", opacity: 0.65, fontSize: 12 }}>
              Совет: в читалке можно кликнуть на счётчик страниц и прыгнуть на нужную главу.
            </div>
          </div>

          {/* Right card */}
          <div
            style={{
              ...cardBase,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: 950, fontSize: 18 }}>Войти</div>
              <div style={{ opacity: 0.75, marginTop: 4 }}>Email + пароль или социальный вход.</div>
            </div>

            <div style={{ marginTop: 2 }}>
              <LoginForm />
            </div>

            {/* ✅ всегда прижато вниз */}
            <div style={{ marginTop: "auto", opacity: 0.75, fontSize: 13 }}>
              Нет аккаунта?{" "}
              <Link href="/register" style={{ color: "inherit", fontWeight: 900 }}>
                Зарегистрироваться →
              </Link>
            </div>
          </div>
        </div>

        {/* mobile fix */}
        <style>{`
          @media (max-width: 900px) {
            .__grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}