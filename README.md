# MangaWorld

> Веб-приложение на Next.js для каталога и чтения манги: карточки тайтлов, главы, сохранение прогресса, личные списки, друзья и административная панель.

## Что умеет проект

| Для читателя | Для администратора |
| --- | --- |
| Главная страница с блоками «Продолжить чтение», «В тренде», «Новинки» | Dashboard со сводкой по пользователям, тайтлам, главам, оценкам и избранному |
| Каталог и поиск по тайтлам | Добавление и удаление манги |
| Карточка манги с описанием, жанрами и списком глав | Добавление глав и страниц |
| Читалка с переходом между главами и сохранением текущей страницы | Управление ролями `user` / `admin` |
| Избранное, рейтинги и персональные списки чтения | Защита `/admin` и `/api/admin` через middleware |
| Профиль, друзья и просмотр списков друзей | |

## Технологии

| Слой | Используется |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | CSS Modules и глобальные CSS-файлы |
| Авторизация | NextAuth, Credentials, Google OAuth, Yandex OAuth |
| Backend | Route Handlers, server components, middleware |
| База данных | PostgreSQL, Drizzle ORM, Drizzle Kit |
| Утилиты | Zod, bcrypt / bcryptjs, axios, lucide-react |

## Роли и доступ

| Роль | Доступ |
| --- | --- |
| `guest` | Главная, каталог, карточки манги и читалка |
| `user` | Всё выше, а также профиль, списки чтения, избранное, прогресс и друзья |
| `admin` | Всё выше, а также `/admin`, `/api/admin`, управление пользователями и контентом |

## Структура проекта

```text
src/
  app/
    admin/                  административный интерфейс
    api/                    route handlers
    auth/                   страницы входа и регистрации
    catalog/                каталог и добавление тайтлов
    comics/[id]/            карточка манги и читалка
    profile/                профиль, списки, друзья
    users/[id]/             страница пользователя
  server/
    db/
      schema.ts             схема таблиц
      relations.ts          связи Drizzle
      index.ts              подключение к PostgreSQL
drizzle/                    готовые SQL-миграции
types/                      расширения типов NextAuth
```

## Быстрый старт

### Требования

- Node.js `>= 20.9.0`
- PostgreSQL
- npm

### Установка

1. Установи зависимости:

   ```bash
   npm install
   ```

2. Создай файл `.env` в корне проекта:

   ```env
   DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/manga_catalog
   NEXTAUTH_SECRET=change-me
   NEXTAUTH_URL=http://localhost:3000

   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...

   YANDEX_CLIENT_ID=...
   YANDEX_CLIENT_SECRET=...
   ```

3. Создай базу данных и примени SQL-миграции из папки `drizzle/` в порядке номеров: от `0000_...sql` до `0005_...sql`.

4. Запусти проект:

   ```bash
   npm run dev
   ```

5. Открой `http://localhost:3000`.

## Первичная настройка

- Новые пользователи создаются с ролью `user`.
- Первый доступ в админ-панель нужно выдать вручную через PostgreSQL:

  ```sql
  update users
  set role = 'admin'
  where email = 'you@example.com';
  ```

- После этого каталог можно наполнять из интерфейса администратора.
- Если OAuth не нужен, убери Google и Yandex providers из [src/app/api/auth/[...nextauth]/route.ts](./src/app/api/auth/[...nextauth]/route.ts) и оставь только вход по email и паролю.

## Основные маршруты

| Маршрут | Назначение | Доступ |
| --- | --- | --- |
| `/` | Главная страница и подборки | `guest` |
| `/auth/login` | Вход | `guest` |
| `/auth/register` | Регистрация | `guest` |
| `/catalog` | Каталог манги | `guest` |
| `/comics/[id]` | Карточка тайтла | `guest` |
| `/comics/[id]/chapters/[chapterId]` | Читалка главы | `guest` |
| `/profile` | Профиль, списки и друзья | `user` |
| `/users/[id]` | Страница пользователя, списки видны только друзьям или самому владельцу | `guest` |
| `/admin` | Админ-дашборд | `admin` |

## Модель данных

Проект уже содержит схему и relations для следующих сущностей:

`users`, `authors`, `genres`, `comics`, `comic_genres`, `chapters`, `chapter_pages`, `covers`, `ratings`, `favorites`, `user_comic_lists`, `friend_requests`, `reading_progress`.

Ключевые файлы:

- [src/server/db/schema.ts](./src/server/db/schema.ts)
- [src/server/db/relations.ts](./src/server/db/relations.ts)

## NPM-скрипты

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Запускает локальный dev-сервер |
| `npm run build` | Собирает production-версию |
| `npm run start` | Запускает production-сборку |
| `npm run lint` | Проверяет код через ESLint |
