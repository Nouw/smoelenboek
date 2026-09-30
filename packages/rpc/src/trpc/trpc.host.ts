import * as trpcExpress from '@trpc/server/adapters/express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { INestApplication, Injectable, Logger } from '@nestjs/common';
import { getHTTPStatusCodeFromError } from '@trpc/server/http';
import type { collectRoutes, generateDocsHtml } from 'trpc-docs-generator';

import { AuthContextFactory } from '../auth/auth-context.factory';
import { createAppRouter } from '../router';

type TrpcDocsGenerator = {
  collectRoutes: typeof collectRoutes;
  generateDocsHtml: typeof generateDocsHtml;
};

@Injectable()
export class TrpcHost {
  private readonly logger = new Logger(TrpcHost.name);

  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  applyMiddleware(app: INestApplication): void {
    const appRouter = createAppRouter({
      commandBus: this.commandBus,
      queryBus: this.queryBus,
    });

    app
      .getHttpAdapter()
      .getInstance()
      .get('/docs', async (_req, res) => {
        const { collectRoutes, generateDocsHtml } =
          await this.importDocsGenerator();
        const routes = collectRoutes(appRouter);
        const html = generateDocsHtml(routes, {
          title: 'Smoelenboek RPC Documentation',
        });

        res.type('html').send(html);
      });

    app
      .getHttpAdapter()
      .getInstance()
      .use(
        '/trpc',
        trpcExpress.createExpressMiddleware({
          router: appRouter,
          createContext: ({ req }) => this.authContextFactory.create(req),
          onError: ({ error, path, type }) => {
            if (getHTTPStatusCodeFromError(error) < 500) return;

            // Database errors may contain SQL, parameters or credentials. Retain
            // location frames, but never export the original message or cause.
            const failure = new Error(
              `tRPC ${type} ${path ?? '<context>'} failed (${error.code})`,
            );
            failure.name = 'TRPCError';
            const frames = (error.cause?.stack ?? error.stack ?? '')
              .split('\n')
              .filter((line) => /^\s+at\s/.test(line));
            failure.stack = [String(failure), ...frames].join('\n');
            this.logger.error(failure);
          },
        }),
      );
  }

  private importDocsGenerator(): Promise<TrpcDocsGenerator> {
    const dynamicImport = new Function(
      'specifier',
      'return import(specifier)',
    ) as (specifier: string) => Promise<TrpcDocsGenerator>;

    return dynamicImport('trpc-docs-generator');
  }
}
