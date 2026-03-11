import UserPageClient from "./user-page-client";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserPageClient userId={id} />;
}