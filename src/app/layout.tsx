import type { Metadata } from "next";
import "./globals.css";
import "./mw-theme.css";
import "./HomePage.css";

import Header from "./components/Header";

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
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
