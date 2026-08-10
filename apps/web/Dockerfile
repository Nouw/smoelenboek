FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Install dependencies (layer-cached until lockfile changes)
FROM base AS deps
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/api/package.json packages/api/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/jest-config/package.json packages/jest-config/
COPY packages/rpc/package.json packages/rpc/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /repo
ARG NEXT_PUBLIC_AUTH_URL
ARG NEXT_PUBLIC_TRPC_URL
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}
ENV NEXT_PUBLIC_TRPC_URL=${NEXT_PUBLIC_TRPC_URL}
RUN test -n "$NEXT_PUBLIC_AUTH_URL" && test -n "$NEXT_PUBLIC_TRPC_URL"
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /repo/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /repo/packages/rpc/node_modules ./packages/rpc/node_modules
COPY --from=deps /repo/packages/ui/node_modules ./packages/ui/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @repo/api build
RUN pnpm --filter web build

# Lean runtime image using Next.js standalone output
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public
CMD ["node", "apps/web/server.js"]
