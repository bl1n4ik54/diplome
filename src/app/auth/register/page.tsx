import RegisterForm from "./RegisterForm";
import SocialButtons from "../components/SocialButtons";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div>
      <div>
        <div>
          <h1>Регистрация</h1>
          <p>Создайте свой аккаунт</p>
        </div>

        <RegisterForm />

        <div>
          <span>или</span>
        </div>

        <SocialButtons isLogin={false} />

        <div>
          <p>
            Уже есть аккаунт?{" "}
            <Link href="/auth/login">
              Войти
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