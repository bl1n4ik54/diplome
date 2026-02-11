"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const form = e.currentTarget as HTMLFormElement;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка при создании аккаунта. Попробуйте снова.");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Ошибка при входе после регистрации");
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      setError("Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div>
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Имя пользователя</label>
          <input
            name="username"
            type="text"
            placeholder="Введите ваше имя"
            required
            minLength={3}
            maxLength={50}
          />
        </div>

        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div>
          <div>
            <label>Пароль</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Скрыть" : "Показать"}
            </button>
          </div>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Придумайте надежный пароль"
            required
            minLength={6}
          />
          <p>Минимум 6 символов</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>
    </>
  );
}