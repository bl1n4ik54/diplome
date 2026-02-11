// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Расширяем DefaultSession: добавляем id в session.user
   */
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * При желании можно расширить User (если вы используете `user` где-то)
   */
  interface User {
    id: string;
    // добавьте другие поля, если нужно
  }
}

declare module "next-auth/jwt" {
  /**
   * Расширяем JWT-пayload, чтобы token.id был известен TS
   */
  interface JWT {
    id?: string;
    email?: string | null;
    // другие поля при необходимости
  }
}
