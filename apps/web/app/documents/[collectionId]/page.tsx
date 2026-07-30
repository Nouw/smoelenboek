import { notFound } from 'next/navigation';
import { z } from 'zod';

import { DocumentCollectionDetail } from './document-collection-detail';

export default async function DocumentCollectionPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = await params;
  const parsed = z.uuid().safeParse(collectionId);

  if (!parsed.success) notFound();

  return <DocumentCollectionDetail collectionId={parsed.data} />;
}
