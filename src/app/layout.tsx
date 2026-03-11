import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./mw-theme.css";

import Header from "./components/Header";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MangaWorld - Веб-библиотека манги",
  description: "Платформа для чтения и коллекционирования манги",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}