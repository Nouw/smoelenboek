import { notFound } from 'next/navigation';
import { z } from 'zod';

import { TeamDetail } from './team-detail';

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const parsedTeamId = z.uuid().safeParse(teamId);

  if (!parsedTeamId.success) {
    notFound();
  }

  return <TeamDetail teamId={parsedTeamId.data} />;
}
