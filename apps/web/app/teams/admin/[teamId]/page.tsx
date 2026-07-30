import { notFound } from 'next/navigation';
import { z } from 'zod';

import { TeamAdminDetail } from './team-admin-detail';

export default async function TeamAdminDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { teamId } = await params;
  const parsedTeamId = z.uuid().safeParse(teamId);

  if (!parsedTeamId.success) {
    notFound();
  }

  const seasonText = (await searchParams).season;
  const parsedSeason = z.coerce
    .number()
    .int()
    .min(1900)
    .max(3000)
    .safeParse(seasonText);

  return (
    <TeamAdminDetail
      teamId={parsedTeamId.data}
      initialSeasonKey={parsedSeason.success ? parsedSeason.data : undefined}
    />
  );
}
