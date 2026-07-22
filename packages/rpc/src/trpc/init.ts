import type { RouteMeta } from 'trpc-docs-generator';
import { TRPCError, initTRPC } from '@trpc/server';

import type { TrpcContext } from './context';

export const trpc = initTRPC.context<TrpcContext>().meta<RouteMeta>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;

export const protectedProcedure = trpc.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    });
  }

  if (ctx.passwordMigrationRequired) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'A password reset is required before using the application.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
