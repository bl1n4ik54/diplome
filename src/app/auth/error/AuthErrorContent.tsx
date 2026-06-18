"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";

export default function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  const errorMessage = useMemo(() => {
    const messages: Record<string, string> = {
      "OAuthSignin": "Ошибка при попытке входа через социальную сеть",
      "OAuthCallback": "Ошибка при обработке ответа от социальной сети",
      "OAuthCreateAccount": "Ошибка при создании аккаунта через социальную сеть",
      "EmailCreateAccount": "Ошибка при создании аккаунта через email",
      "Callback": "Ошибка при обработке callback",
      "OAuthAccountNotLinked": "Этот email уже используется другим способом входа",
      "EmailSignin": "Ошибка при отправке email",
      "CredentialsSignin": "Неверный email или пароль",
      "SessionRequired": "Требуется войти в аккаунт",
      "Default": "Произошла ошибка при аутентификации"
    };

    if (error && messages[error]) {
      return messages[error];
    }
    return messages["Default"];
  }, [error]);

  const handleRetry = () => {
    router.back();
  };

  return (
    <div>
      <h1>Ошибка</h1>
      <p>При аутентификации произошла ошибка</p>
      
      <div>
        <p>{errorMessage}</p>
        {error && (
          <p>Код ошибки: {error}</p>
        )}
      </div>

      <div>
        <button onClick={handleRetry}>
          Попробовать снова
        </button>
        
        <div>
          <Link href="/auth/login">
            Вход
          </Link>
          
          <Link href="/auth/register">
            Регистрация
          </Link>
        </div>
        
        <Link href="/">
          ← Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
