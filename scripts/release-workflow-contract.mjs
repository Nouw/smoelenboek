const REQUIRED_FRAGMENTS = [
  'new_release_published=true',
  'new_release_published=false',
  'new_release_version=${after#v}',
  'image_owner=${GITHUB_REPOSITORY_OWNER,,}',
  '>> "$GITHUB_OUTPUT"',
  'ghcr.io/${{ needs.release.outputs.image_owner }}/smoelenboek-${{ matrix.name }}',
  'docker compose -f docker-compose.prod.yml up -d --wait db',
  'docker compose -f docker-compose.prod.yml run --rm --no-deps rpc node dist/migrate.js',
  'build-args: ${{ matrix.build_args }}',
  'NEXT_PUBLIC_AUTH_URL=https://api.smoelenboek.usvprotos.nl',
  'NEXT_PUBLIC_TRPC_URL=https://api.smoelenboek.usvprotos.nl/trpc',
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

const REQUIRED_WEB_DEPENDENCY_LINKS = [
  'COPY --from=deps /repo/packages/rpc/node_modules ./packages/rpc/node_modules',
  'COPY --from=deps /repo/packages/ui/node_modules ./packages/ui/node_modules',
];

const REQUIRED_WEB_PUBLIC_ENV_BUILD_FRAGMENTS = [
  'ARG NEXT_PUBLIC_AUTH_URL',
  'ARG NEXT_PUBLIC_TRPC_URL',
  'ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}',
  'ENV NEXT_PUBLIC_TRPC_URL=${NEXT_PUBLIC_TRPC_URL}',
  'RUN test -n "$NEXT_PUBLIC_AUTH_URL" && test -n "$NEXT_PUBLIC_TRPC_URL"',
];

export function validateWebDockerfile(dockerfile) {
  const required = [
    ...REQUIRED_WEB_DEPENDENCY_LINKS,
    ...REQUIRED_WEB_PUBLIC_ENV_BUILD_FRAGMENTS,
  ];
  const missing = required.filter(
    (fragment) => !dockerfile.includes(fragment),
  );

  const validation = dockerfile.indexOf(
    'RUN test -n "$NEXT_PUBLIC_AUTH_URL" && test -n "$NEXT_PUBLIC_TRPC_URL"',
  );
  const webBuild = dockerfile.indexOf('RUN pnpm --filter web build');
  const validatesBeforeBuild = validation >= 0 && webBuild > validation;

  return {
    checks: required.length + 1,
    missing,
    validatesBeforeBuild,
    valid: missing.length === 0 && validatesBeforeBuild,
  };
}

export function validateNextConfig(config) {
  const hasTracingRoot = config.includes('outputFileTracingRoot:');
  const usesLegacyPlacement =
    /experimental\s*:\s*\{\s*outputFileTracingRoot:/m.test(config);

  return {
    checks: 2,
    hasTracingRoot,
    usesLegacyPlacement,
    valid: hasTracingRoot && !usesLegacyPlacement,
  };
}
