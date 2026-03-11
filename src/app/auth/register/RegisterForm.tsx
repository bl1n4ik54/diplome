"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import SocialButtons from "../components/SocialButtons";

export default function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim() || null,
        email: email.trim(),
        password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "Ошибка регистрации");
      setLoading(false);
      return;
    }

    setOk("✅ Аккаунт создан. Выполняю вход...");
    // авто-вход после регистрации
    await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: true,
      callbackUrl: "/",
    });

    setLoading(false);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {error && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.22)",
            background: "rgba(239,68,68,0.10)",
            fontWeight: 800,
          }}
        >
          {error}
        </div>
      )}

      {ok && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(34,197,94,0.22)",
            background: "rgba(34,197,94,0.10)",
            fontWeight: 800,
          }}
        >
          {ok}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={{ opacity: 0.75, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Ник (опционально)</div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="nickname"
            placeholder="Например: Egor"
            style={input}
            maxLength={15}
          />
          <div style={{ opacity: 0.65, fontSize: 12, marginTop: 6 }}>
            Можно оставить пустым — позже изменишь в профиле.
          </div>
        </div>

        <div>
          <div style={{ opacity: 0.75, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
            style={input}
          />
        </div>

        <div>
          <div style={{ opacity: 0.75, fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Пароль</div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
            placeholder="минимум 6 символов"
            style={input}
          />
        </div>

        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Создаю..." : "Создать аккаунт"}
        </button>
      </form>

      <div
        style={{
          display: "grid",
          gap: 10,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div style={{ opacity: 0.75, fontSize: 12, fontWeight: 900 }}>Или через</div>
        <SocialButtons />
      </div>
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.18)",
  color: "inherit",
  outline: "none",
  fontWeight: 700,
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.10)",
  color: "inherit",
  fontWeight: 950,
  cursor: "pointer",
};