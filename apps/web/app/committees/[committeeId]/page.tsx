import { notFound } from 'next/navigation';
import { z } from 'zod';

import { CommitteeDetail } from './committee-detail';

export default async function CommitteePage({
  params,
}: {
  params: Promise<{ committeeId: string }>;
}) {
  const { committeeId } = await params;
  const parsedCommitteeId = z.uuid().safeParse(committeeId);

  if (!parsedCommitteeId.success) {
    notFound();
  }

  return <CommitteeDetail committeeId={parsedCommitteeId.data} />;
}
