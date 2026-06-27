import { TRPCError, initTRPC } from '@trpc/server';

import type { TrpcContext } from './context';

export const trpc = initTRPC.context<TrpcContext>().create();

export const router = trpc.router;
export const publicProcedure = trpc.procedure;

export const protectedProcedure = trpc.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});
