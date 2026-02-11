import UserPageClient from "./user-page-client";

export default async function UserPage({ params }: { params: { id: string } }) {
  return <UserPageClient userId={params.id} />;
}
