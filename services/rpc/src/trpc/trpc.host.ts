import * as trpcExpress from '@trpc/server/adapters/express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { INestApplication, Injectable } from '@nestjs/common';

import { AuthContextFactory } from '../auth/auth-context.factory';
import { createAppRouter } from '../router';

@Injectable()
export class TrpcHost {
  constructor(
    private readonly authContextFactory: AuthContextFactory,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  applyMiddleware(app: INestApplication): void {
    app.getHttpAdapter().getInstance().use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: createAppRouter({
          commandBus: this.commandBus,
          queryBus: this.queryBus,
        }),
        createContext: ({ req }) => this.authContextFactory.create(req),
      }),
    );
  }
}
