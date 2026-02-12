// Drizzle relations: связи между таблицами
import { relations } from "drizzle-orm";
import {
  users,
  comics,
  authors,
  genres,
  chapters,
  ratings,
  favorites,
  comicGenres,
  covers,
  userComicLists,
  friendRequests,
  readingProgress,
  chapterPages,
} from "./schema";

/**
 * USERS
 */
export const userRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
  favorites: many(favorites),
  readingProgress: many(readingProgress),
  comicLists: many(userComicLists),

  // заявки в друзья (две связи к users, поэтому relationName обязателен)
  sentFriendRequests: many(friendRequests, { relationName: "friend_from" }),
  receivedFriendRequests: many(friendRequests, { relationName: "friend_to" }),
}));

/**
 * AUTHORS
 */
export const authorRelations = relations(authors, ({ many }) => ({
  comics: many(comics),
}));

/**
 * COMICS
 */
export const comicRelations = relations(comics, ({ many, one }) => ({
  author: one(authors, {
    fields: [comics.authorId],
    references: [authors.id],
  }),

  chapters: many(chapters),
  ratings: many(ratings),
  favorites: many(favorites),

  // M2M жанры через таблицу comicGenres
  genres: many(comicGenres),

  covers: many(covers),
  readingProgress: many(readingProgress),
  userComicLists: many(userComicLists),
}));

/**
 * GENRES
 */
export const genreRelations = relations(genres, ({ many }) => ({
  comics: many(comicGenres),
}));

/**
 * COMIC_GENRES (связующая таблица)
 */
export const comicGenresRelations = relations(comicGenres, ({ one }) => ({
  comic: one(comics, {
    fields: [comicGenres.comicId],
    references: [comics.id],
  }),
  genre: one(genres, {
    fields: [comicGenres.genreId],
    references: [genres.id],
  }),
}));

/**
 * CHAPTERS
 */
export const chapterRelations = relations(chapters, ({ one, many }) => ({
  comic: one(comics, {
    fields: [chapters.comicId],
    references: [comics.id],
  }),

  readingProgress: many(readingProgress),

  // ✅ страницы главы
  pages: many(chapterPages),
}));

/**
 * CHAPTER_PAGES
 */
export const chapterPagesRelations = relations(chapterPages, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterPages.chapterId],
    references: [chapters.id],
  }),
}));

/**
 * COVERS
 */
export const coversRelations = relations(covers, ({ one }) => ({
  comic: one(comics, {
    fields: [covers.comicId],
    references: [comics.id],
  }),
}));

/**
 * RATINGS
 */
export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  comic: one(comics, {
    fields: [ratings.comicId],
    references: [comics.id],
  }),
}));

/**
 * FAVORITES
 */
export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  comic: one(comics, {
    fields: [favorites.comicId],
    references: [comics.id],
  }),
}));

/**
 * USER_COMIC_LISTS
 */
export const userComicListsRelations = relations(userComicLists, ({ one }) => ({
  user: one(users, {
    fields: [userComicLists.userId],
    references: [users.id],
  }),
  comic: one(comics, {
    fields: [userComicLists.comicId],
    references: [comics.id],
  }),
}));

/**
 * FRIEND_REQUESTS
 */
export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  fromUser: one(users, {
    fields: [friendRequests.fromUserId],
    references: [users.id],
    relationName: "friend_from",
  }),
  toUser: one(users, {
    fields: [friendRequests.toUserId],
    references: [users.id],
    relationName: "friend_to",
  }),
}));

/**
 * READING_PROGRESS
 */
export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  user: one(users, {
    fields: [readingProgress.userId],
    references: [users.id],
  }),
  comic: one(comics, {
    fields: [readingProgress.comicId],
    references: [comics.id],
  }),
  chapter: one(chapters, {
    fields: [readingProgress.chapterId],
    references: [chapters.id],
  }),
}));
