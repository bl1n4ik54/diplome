import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// USERS
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: text("password_hash"),
  provider: varchar("provider", { length: 20 }).notNull().default("local"),
  providerId: varchar("provider_id", { length: 255 }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AUTHORS 
export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  country: varchar("country", { length: 50 }),
});

// GENRES
export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});


// COMICS
export const comics = pgTable("comics", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  authorId: integer("author_id").references(() => authors.id).notNull(),
  releaseYear: integer("release_year"),
  status: varchar("status", { length: 20 }).default("ongoing"),
  rating: real("rating").default(0),

  // nullable по умолчанию (просто НЕ ставим notNull)
  coverUrl: text("cover_url"),

  createdAt: timestamp("created_at").defaultNow(),
});




// COMIC GENRES (M2M)
export const comicGenres = pgTable("comic_genres", {
  comicId: integer("comic_id")
    .references(() => comics.id)
    .notNull(),
  genreId: integer("genre_id")
    .references(() => genres.id)
    .notNull(),
});


// CHAPTERS
export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  comicId: integer("comic_id")
    .references(() => comics.id)
    .notNull(),  // Здесь должна быть запятая, если это не последний элемент
  title: varchar("title", { length: 255 }),
  chapterNumber: integer("chapter_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


// COVERS
export const covers = pgTable("covers", {
  id: serial("id").primaryKey(),
  comicId: integer("comic_id")
    .references(() => comics.id)
    .notNull(),
  imageUrl: text("image_url").notNull(),
  isMain: boolean("is_main").default(false),
});


// RATINGS
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  comicId: integer("comic_id")
    .references(() => comics.id)
    .notNull(),
  value: integer("value").notNull(), // 1–10
});

// FAVORITES
export const favorites = pgTable("favorites", {
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  comicId: integer("comic_id")
    .references(() => comics.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


// USER COMIC LISTS
export const userComicLists = pgTable(
  "user_comic_lists",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),

    comicId: integer("comic_id")
      .references(() => comics.id)
      .notNull(),

    // reading | planned | completed | on_hold | dropped
    status: varchar("status", { length: 20 }).notNull().default("planned"),

    // прогресс по главам (или что решишь)
    progress: integer("progress").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    // один и тот же комикс один раз в списках у юзера
    uniqUserComic: uniqueIndex("ucl_user_comic_unique").on(t.userId, t.comicId),
  })
);


// FRIEND REQUESTS
export const friendRequests = pgTable(
  "friend_requests",
  {
    id: serial("id").primaryKey(),

    fromUserId: integer("from_user_id")
      .references(() => users.id)
      .notNull(),

    toUserId: integer("to_user_id")
      .references(() => users.id)
      .notNull(),

    // pending | accepted | declined
    status: varchar("status", { length: 20 }).notNull().default("pending"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    // запрет дублей "я → ты" (обратную пару проверяем в логике API)
    uniqPair: uniqueIndex("fr_from_to_unique").on(t.fromUserId, t.toUserId),
  })
);

// READING PROGRESS (где остановился читать)
export const readingProgress = pgTable(
  "reading_progress",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),

    comicId: integer("comic_id")
      .references(() => comics.id)
      .notNull(),

    chapterId: integer("chapter_id")
      .references(() => chapters.id)
      .notNull(),

    // если нужно: страница в главе (опционально)
    page: integer("page").default(1),

    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    uniqUserComic: uniqueIndex("rp_user_comic_unique").on(t.userId, t.comicId),
  })
);
