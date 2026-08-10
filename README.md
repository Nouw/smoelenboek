# Turborepo starter

This is a community-maintained example. If you experience a problem, please submit a pull request with a fix. GitHub Issues will be closed.

## Using this example

Run the following command:

```bash
npx create-turbo@latest -e with-nestjs
```

## What's inside?

This Turborepo includes the following packages & apps:

### Apps and Packages

```shell
.
├── apps
│   ├── api                       # NestJS app (https://nestjs.com).
│   └── web                       # Next.js app (https://nextjs.org).
└── packages
    ├── @repo/api                 # Shared `NestJS` resources.
    ├── @repo/eslint-config       # `eslint` configurations (includes `prettier`)
    ├── @repo/jest-config         # `jest` configurations
    ├── @repo/rpc                 # tRPC, CQRS, Better Auth, and database service.
    ├── @repo/typescript-config   # `tsconfig.json`s used throughout the monorepo
    └── @repo/ui                  # Shareable stub React component library.
```

Each package and application are mostly written in [TypeScript](https://www.typescriptlang.org/).

### Team directory

Authenticated users can open a team from the men or women overview at
`/teams/[teamId]`. The detail page shows the Europe/Amsterdam current season,
active coaches, and active players. Roster cards link to the existing member
profile pages. The page loads through the single protected
`teams.currentRoster` tRPC query.

Administrators manage the team catalog and season rosters at `/teams/admin`.
The workspace supports men/women classification, optional image URLs,
archiving and restoring, arbitrary association seasons, searchable member
assignment, volleyball roles, and immediate roster removal. Team
mutations and the user picker are enforced by admin-only tRPC procedures.

### Committee directory

Authenticated users can browse all committees at `/committees` and open a
committee at `/committees/[committeeId]`. The detail page shows the
Europe/Amsterdam current season and active committee members, including their
role and profile link. It loads the roster through the single protected
`committees.currentRoster` tRPC query.

### Protototo

`/protototo` is public. Anonymous participants enter a first name and email,
open the round's Tikkie URL, confirm their payment claim, and submit one
prediction for every active match. Signed-in members use their account and
never receive Tikkie or payment fields. Both participant types can replace
their entry until the round deadline.

Members can open a closed round's standings from `/protototo/standings`.
Admins use `/protototo/admin` to create, publish, reopen, or archive rounds,
browse Protos teams and matches from Nevobo, change the lineup, synchronize
results, inspect entries, and download the CSV export. Times are stored in UTC
and rendered in `Europe/Amsterdam`.

The RPC service polls started, incomplete matches every 15 minutes by default.
Configure the integration in `packages/rpc/.env.local`:

```sh
NEVOBO_BASE_URL=https://api.nevobo.nl
NEVOBO_ASSOCIATION_ID=ckl9y0t
PROTOTOTO_SYNC_INTERVAL_MS=900000
```

Run the database migration before starting the feature. Targeted verification
is available through:

```sh
pnpm --filter @repo/rpc test -- --runInBand
pnpm --filter @repo/rpc eval:protototo
pnpm --filter web test
pnpm --filter web eval
```

### Utilities

This `Turborepo` has some additional tools already set for you:

- [TypeScript](https://www.typescriptlang.org/) for static type-safety
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Jest](https://prettier.io) & [Playwright](https://playwright.dev/) for testing

### Commands

This `Turborepo` already configured useful commands for all your apps and packages.

#### Build

```bash
# Will build all the app & packages with the supported `build` script.
pnpm run build

# ℹ️ If you plan to only build apps individually,
# Please make sure you've built the packages first.
```

#### Develop

```bash
# Runs all persistent dev tasks through Turbo's TUI.
pnpm run dev
```

#### test

```bash
# Will launch a test suites for all the app & packages with the supported `test` script.
pnpm run test

# You can launch e2e testes with `test:e2e`
pnpm run test:e2e

# See `@repo/jest-config` to customize the behavior.
```

#### Lint

```bash
# Will lint all the app & packages with the supported `lint` script.
# See `@repo/eslint-config` to customize the behavior.
pnpm run lint
```

#### Format

```bash
# Will format all the supported `.ts,.js,json,.tsx,.jsx` files.
# See `@repo/eslint-config/prettier-base.js` to customize the behavior.
pnpm format
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```bash
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```bash
npx turbo link
```

## Useful Links

This example take some inspiration the [with-nextjs](https://github.com/vercel/turborepo/tree/main/examples/with-nextjs) `Turbo` example and [01-cats-app](https://github.com/nestjs/nest/tree/master/sample/01-cats-app) `NestJs` sample.

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)

# TODO's

## Most important

- [x] User management
  - [x] fix the form
  - [ ] fix the list of users containing every user (not really needed can use search)
- [x] User search
- [x] Sending emails
- [x] Polls
- [x] Sponsorhengel
- [ ] Data page (seeing who is longest member) & Birthdays
- [ ] Sentry / Posthog
- [ ] Versioning
- [ ] Write documentation (docusaurus?)
- [ ] Auto deployment with github actions

## Nice to have

- [ ] Protototo automatic payments
