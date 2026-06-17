import { notFound, redirect } from "next/navigation";

export default async function AdminComicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comicId = Number(id);

  if (!Number.isInteger(comicId) || comicId <= 0) {
    notFound();
  }

  redirect(`/admin/comics/${comicId}/add-chapter`);
}
