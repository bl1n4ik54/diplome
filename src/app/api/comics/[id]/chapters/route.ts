import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "../../../../../server/db";
import { chapters } from "../../../../../server/db/schema";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 80;

function readInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function toIso(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const comicId = Number(id);

  if (!Number.isFinite(comicId) || comicId <= 0) {
    return NextResponse.json({ error: "Invalid comic id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const offset = readInt(url.searchParams.get("offset"), 0);
  const limit = Math.min(readInt(url.searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);

  const rows = await db
    .select({
      id: chapters.id,
      title: chapters.title,
      chapterNumber: chapters.chapterNumber,
      createdAt: chapters.createdAt,
    })
    .from(chapters)
    .where(eq(chapters.comicId, comicId))
    .orderBy(asc(chapters.chapterNumber), asc(chapters.id))
    .limit(limit + 1)
    .offset(offset);

  return NextResponse.json({
    items: rows.slice(0, limit).map((row) => ({
      ...row,
      createdAt: toIso(row.createdAt),
    })),
    hasMore: rows.length > limit,
  });
}
