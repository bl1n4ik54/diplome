import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";

import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "../../../../server/db";
import { users, authors, comics, covers, genres, comicGenres } from "../../../../server/db/schema";

type Body = {
  title: string;
  description?: string | null;
  authorName: string;
  genreNames: string[];
  coverUrl?: string | null;
  releaseYear?: number | null;
  status?: "ongoing" | "completed";
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // проверка роли
  const me = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ message: "Невалидный JSON" }, { status: 400 });

  const title = (body.title ?? "").trim();
  const authorName = (body.authorName ?? "").trim();
  const description = body.description ?? null;
  const coverUrl = body.coverUrl?.trim() || null;
  const releaseYear = body.releaseYear ?? null;
  const status = body.status ?? "ongoing";

  const normalizedGenres = Array.from(
    new Set((body.genreNames ?? []).map((g) => String(g).trim()).filter(Boolean))
  );

  if (!title || !authorName || normalizedGenres.length === 0) {
    return NextResponse.json(
      { message: "Нужны: title, authorName и хотя бы один genreNames[]" },
      { status: 400 }
    );
  }

  try {
    const comicId = await db.transaction(async (tx) => {
      // author find/create
      let author = await tx.query.authors.findFirst({ where: eq(authors.name, authorName) });

      if (!author) {
        const [createdAuthor] = await tx
          .insert(authors)
          .values({ name: authorName, country: null })
          .returning({ id: authors.id });
        author = createdAuthor as any;
      }
      if (!author) throw new Error("AUTHOR_CREATE_FAILED");

      const [createdComic] = await tx
        .insert(comics)
        .values({
          title,
          description,
          authorId: author.id,
          releaseYear,
          status,
        })
        .returning({ id: comics.id });

      if (!createdComic) throw new Error("COMIC_CREATE_FAILED");

      if (coverUrl) {
        await tx.insert(covers).values({
          comicId: createdComic.id,
          imageUrl: coverUrl,
          isMain: true,
        });
      }

      for (const gName of normalizedGenres) {
        let genre = await tx.query.genres.findFirst({ where: eq(genres.name, gName) });

        if (!genre) {
          const [createdGenre] = await tx
            .insert(genres)
            .values({ name: gName })
            .returning({ id: genres.id });
          genre = createdGenre as any;
        }

        if (genre) {
          await tx.insert(comicGenres).values({
            comicId: createdComic.id,
            genreId: genre.id,
          });
        }
      }

      return createdComic.id;
    });

    return NextResponse.json({ comicId }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ message: "Failed to add comic", error: String(e) }, { status: 500 });
  }
}
