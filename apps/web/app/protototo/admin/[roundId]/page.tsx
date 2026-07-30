import { notFound } from 'next/navigation';
import { z } from 'zod';

import { ProtototoAdminContent } from '../protototo-admin-content';

export default async function ProtototoAdminRoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const parsedRoundId = z.uuid().safeParse(roundId);

  if (!parsedRoundId.success) {
    notFound();
  }

  return <ProtototoAdminContent roundId={parsedRoundId.data} />;
}
