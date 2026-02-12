import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import YandexProvider from "next-auth/providers/yandex";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { db } from "../../../../server/db";
import { users } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  // ✅ под твою структуру страниц (/login, /register, /auth/error)
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/auth/error",
    signOut: "/",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        // ✅ возвращаем минимальный user, остальное доберём в jwt() из БД
        return {
          id: String(user.id),
          email: user.email,
          name: user.username,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // OAuth: если юзера ещё нет — создаём
      if (account?.provider !== "credentials") {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        if (!existingUser) {
          await db.insert(users).values({
            email: user.email,
            username: user.name ?? "fox",
            provider: account?.provider || "oauth",
            providerId: account?.providerAccountId,
            // role по умолчанию в схеме = "user"
          });
        }
      }
      return true;
    },

    // ✅ кладём id/role в JWT (важно для админки)
    async jwt({ token, user }) {
      const email = (user?.email ?? token.email) as string | undefined;
      if (!email) return token;

      token.email = email;

      // чтобы не дёргать БД каждый раз
      if (!token.role || !token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (dbUser) {
          token.id = String(dbUser.id);
          token.name = dbUser.username ?? token.name;
          token.role = dbUser.role;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.email = String(token.email ?? "");
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
