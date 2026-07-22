import { notFound } from 'next/navigation';
import { z } from 'zod';

import { ProfileContent } from '../profile-content';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const parsedUserId = z.uuid().safeParse(userId);

  if (!parsedUserId.success) {
    notFound();
  }

  return <ProfileContent userId={parsedUserId.data} />;
}
