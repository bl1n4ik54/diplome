"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import SocialButtons from "../components/SocialButtons";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: true,
      callbackUrl: "/",
    });

    // Если redirect=true — обычно сюда не дойдёт при успехе,
    // но при ошибке NextAuth может вернуть res?.error
    if (res?.error) setError("Неверный email или пароль");

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

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
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
            autoComplete="current-password"
            required
            placeholder="••••••••"
            style={input}
          />
        </div>

        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "Входим..." : "Войти"}
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
        <div style={{ opacity: 0.75, fontSize: 12, fontWeight: 900 }}>Или войти через</div>
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