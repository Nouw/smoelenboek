const REQUIRED_FRAGMENTS = [
  'new_release_published=true',
  'new_release_published=false',
  'new_release_version=${after#v}',
  'image_owner=${GITHUB_REPOSITORY_OWNER,,}',
  '>> "$GITHUB_OUTPUT"',
  'ghcr.io/${{ needs.release.outputs.image_owner }}/smoelenboek-${{ matrix.name }}',
  'docker compose -f docker-compose.prod.yml up -d --wait db',
  'docker compose -f docker-compose.prod.yml run --rm --no-deps rpc node dist/migrate.js',
];

export function validateReleaseWorkflow(workflow) {
  const missing = REQUIRED_FRAGMENTS.filter(
    (fragment) => !workflow.includes(fragment),
  );
  const forbidden = [
    workflow.includes('docker run --rm') ? 'docker run --rm' : null,
    workflow.includes('ghcr.io/${{ github.repository_owner }}')
      ? 'ghcr.io/${{ github.repository_owner }}'
      : null,
  ].filter(Boolean);

  const databaseStart = workflow.indexOf(
    'docker compose -f docker-compose.prod.yml up -d --wait db',
  );
  const migration = workflow.indexOf(
    'docker compose -f docker-compose.prod.yml run --rm --no-deps rpc node dist/migrate.js',
  );
  const stackStart = workflow.lastIndexOf(
    'docker compose -f docker-compose.prod.yml up -d',
  );
  const ordered =
    databaseStart >= 0 && migration > databaseStart && stackStart > migration;

  return {
    checks: REQUIRED_FRAGMENTS.length + 2,
    missing,
    forbidden,
    ordered,
    valid: missing.length === 0 && forbidden.length === 0 && ordered,
  };
}
