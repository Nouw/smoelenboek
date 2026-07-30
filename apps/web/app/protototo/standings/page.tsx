import { Suspense } from 'react';

import { StandingsContent } from './standings-content';

export default function ProtototoStandingsPage() {
  return (
    <Suspense fallback={null}>
      <StandingsContent />
    </Suspense>
  );
}
