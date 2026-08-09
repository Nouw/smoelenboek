import { notFound } from 'next/navigation';
import { z } from 'zod';

import { CommitteeAdminDetail } from './committee-admin-detail';

export default async function CommitteeAdminDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ committeeId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { committeeId } = await params;
  const parsedCommitteeId = z.uuid().safeParse(committeeId);
  if (!parsedCommitteeId.success) notFound();

  const parsedSeason = z.coerce
    .number()
    .int()
    .min(1900)
    .max(3000)
    .safeParse((await searchParams).season);

  return (
    <CommitteeAdminDetail
      committeeId={parsedCommitteeId.data}
      initialSeasonKey={parsedSeason.success ? parsedSeason.data : undefined}
    />
  );
}
