import LoginForm from "./LoginForm";
import SocialButtons from "../components/SocialButtons";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div>
      <div>
        <div>
          <h1>Вход</h1>
          <p>Войдите в свой аккаунт</p>
        </div>

        <LoginForm />

        <div>
          <span>или</span>
        </div>

        <SocialButtons isLogin={true} />

        <div>
          <p>
            Нет аккаунта?{" "}
            <Link href="/auth/register">
              Зарегистрироваться
            </Link>
          </p>
          <Link href="/">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}