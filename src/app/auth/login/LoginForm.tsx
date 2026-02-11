"use client";

// LoginForm: форма входа без дублей и с корректной разметкой
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import "../../AuthPage.css";

export default function LoginForm() {
  const router = useRouter();

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      // rememberMe пока никуда не передаём (NextAuth сам хранит сессию),
      // но состояние оставляем для UI:
      // rememberMe,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Неверный email или пароль. Проверьте данные и попробуйте снова.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="your.email@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <div className="form-row">
            <label htmlFor="password">Пароль</label>
          </div>

          <div className="password-input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Введите ваш пароль"
              required
              autoComplete="current-password"
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        <div className="form-actions">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Запомнить меня</span>
          </label>

          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Вход...
              </>
            ) : (
              "Войти"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
