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
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/packages/rpc/node_modules ./packages/rpc/node_modules
COPY --from=deps /repo/packages/api/node_modules ./packages/api/node_modules
COPY . .
RUN pnpm --filter @repo/api build
RUN pnpm --filter @repo/rpc build

# Create isolated prod deploy dir
FROM base AS deploy-deps
WORKDIR /repo
COPY --from=builder /repo .
RUN pnpm deploy --filter @repo/rpc --prod /deploy/rpc

# Lean runtime image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deploy-deps /deploy/rpc/node_modules ./node_modules
COPY --from=builder /repo/packages/rpc/dist ./dist
CMD ["node", "dist/main.js"]
