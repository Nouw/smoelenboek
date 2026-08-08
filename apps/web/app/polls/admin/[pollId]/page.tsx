import { PollAdminDetail } from './poll-admin-detail';

export default async function PollAdminDetailPage({
  params,
}: {
  params: Promise<{ pollId: string }>;
}) {
  const { pollId } = await params;
  return <PollAdminDetail pollId={pollId} />;
}
