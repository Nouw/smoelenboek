import * as trpcExpress from '@trpc/server/adapters/express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { INestApplication, Injectable } from '@nestjs/common';
import type { collectRoutes, generateDocsHtml } from 'trpc-docs-generator';

import { AuthContextFactory } from '../auth/auth-context.factory';
import { createAppRouter } from '../router';

type TrpcDocsGenerator = {
  collectRoutes: typeof collectRoutes;
  generateDocsHtml: typeof generateDocsHtml;
};

@Injectable()
export class TrpcHost {
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

    app.getHttpAdapter().getInstance().get('/docs', async (_req, res) => {
      const { collectRoutes, generateDocsHtml } =
        await this.importDocsGenerator();
      const routes = collectRoutes(appRouter);
      const html = generateDocsHtml(routes, {
        title: 'Smoelenboek RPC Documentation',
      });

      res.type('html').send(html);
    });

    app.getHttpAdapter().getInstance().use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext: ({ req }) => this.authContextFactory.create(req),
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
