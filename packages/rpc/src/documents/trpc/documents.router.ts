import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  contentAssetSchema,
  contentCollectionDetailSchema,
  contentCollectionKindSchema,
  contentCollectionSchema,
  createContentCollectionInputSchema,
  updateContentCollectionInputSchema,
} from '@repo/api';
import { z } from 'zod';

import {
  adminProcedure,
  protectedProcedure,
  router,
} from '../../trpc/init';
import {
  CreateContentCollectionCommand,
  DeleteContentAssetCommand,
  DeleteContentCollectionCommand,
  ReorderContentAssetsCommand,
  ReorderContentCollectionsCommand,
  SetContentCollectionCoverCommand,
  UpdateContentAssetCommand,
  UpdateContentCollectionCommand,
} from '../commands/document.commands';
import { toContentAssetOutput } from '../dto/document-output';
import {
  GetContentCollectionQuery,
  ListContentCollectionsQuery,
} from '../queries/document.queries';

type Dependencies = { commandBus: CommandBus; queryBus: QueryBus };

export function createDocumentsRouter(dependencies: Dependencies) {
  const getCollection = (collectionId: string) =>
    dependencies.queryBus.execute(new GetContentCollectionQuery(collectionId));

  return router({
    listCollections: protectedProcedure
      .meta({
        name: 'List Document Collections',
        docs: {
          description: 'List photo albums and document libraries by season.',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(
        z
          .object({
            seasonKey: z.number().int().min(1900).max(3000).optional(),
            kind: contentCollectionKindSchema.optional(),
          })
          .optional(),
      )
      .output(z.array(contentCollectionSchema))
      .query(({ input }) =>
        dependencies.queryBus.execute(
          new ListContentCollectionsQuery(input?.seasonKey, input?.kind),
        ),
      ),
    getCollection: protectedProcedure
      .meta({
        name: 'Get Document Collection',
        docs: {
          description: 'Get one collection and its ordered assets.',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(z.object({ collectionId: z.uuid() }))
      .output(contentCollectionDetailSchema)
      .query(({ input }) => getCollection(input.collectionId)),
    createCollection: adminProcedure
      .meta({
        name: 'Create Document Collection',
        docs: {
          description: 'Create a new document collection',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(createContentCollectionInputSchema)
      .output(contentCollectionSchema)
      .mutation(async ({ ctx, input }) => {
        const saved = await dependencies.commandBus.execute<
          CreateContentCollectionCommand,
          { id: string }
        >(
          new CreateContentCollectionCommand(
            ctx.userId,
            input.name,
            input.description ?? null,
            input.kind,
            input.seasonKey,
          ),
        );
        return getCollection(saved.id);
      }),
    updateCollection: adminProcedure
      .meta({
        name: 'Update Document Collection',
        docs: {
          description: 'Update a document collection',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(updateContentCollectionInputSchema)
      .output(contentCollectionSchema)
      .mutation(async ({ ctx, input }) => {
        await dependencies.commandBus.execute(
          new UpdateContentCollectionCommand(
            ctx.userId,
            input.collectionId,
            input.name,
            input.description ?? null,
            input.seasonKey,
          ),
        );
        return getCollection(input.collectionId);
      }),
    reorderCollections: adminProcedure
      .meta({
        name: 'Reorder Document Collection',
        docs: {
          description: 'Change the order of a document collection',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(
        z.object({
          seasonKey: z.number().int().min(1900).max(3000),
          kind: contentCollectionKindSchema,
          collectionIds: z.array(z.uuid()),
        }),
      )
      .output(z.array(contentCollectionSchema))
      .mutation(async ({ ctx, input }) => {
        await dependencies.commandBus.execute(
          new ReorderContentCollectionsCommand(
            ctx.userId,
            input.seasonKey,
            input.kind,
            input.collectionIds,
          ),
        );
        return dependencies.queryBus.execute(
          new ListContentCollectionsQuery(input.seasonKey, input.kind),
        );
      }),
    deleteCollection: adminProcedure
      .meta({
        name: 'Delete Document Collection',
        docs: {
          description: 'Delete a document collection',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(z.object({ collectionId: z.uuid() }))
      .output(z.object({ collectionId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        await dependencies.commandBus.execute(
          new DeleteContentCollectionCommand(ctx.userId, input.collectionId),
        );
        return { collectionId: input.collectionId };
      }),
    updateAsset: adminProcedure
      .meta({
        name: 'Update Document Collection Asset',
        docs: {
          description: 'Update an asset in a document collection',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(
        z
          .object({
            assetId: z.uuid(),
            title: z.string().trim().max(240).nullable().optional(),
            caption: z.string().trim().max(2_000).nullable().optional(),
          })
          .refine(
            ({ title, caption }) =>
              title !== undefined || caption !== undefined,
            'At least one field must be supplied.',
          ),
      )
      .output(contentAssetSchema)
      .mutation(async ({ ctx, input }) => {
        const asset = await dependencies.commandBus.execute<
          UpdateContentAssetCommand,
          Parameters<typeof toContentAssetOutput>[0]
        >(
          new UpdateContentAssetCommand(
            ctx.userId,
            input.assetId,
            input.title,
            input.caption,
          ),
        );
        return toContentAssetOutput(asset);
      }),
    reorderAssets: adminProcedure
      .meta({
        name: 'Reorder Document Collection Assets',
        docs: {
          description: 'Update the order of assets in a document collection',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(
        z.object({
          collectionId: z.uuid(),
          assetIds: z.array(z.uuid()),
        }),
      )
      .output(z.array(contentAssetSchema))
      .mutation(async ({ ctx, input }) => {
        const assets = await dependencies.commandBus.execute<
          ReorderContentAssetsCommand,
          Array<Parameters<typeof toContentAssetOutput>[0]>
        >(
          new ReorderContentAssetsCommand(
            ctx.userId,
            input.collectionId,
            input.assetIds,
          ),
        );
        return assets.map(toContentAssetOutput);
      }),
    setCoverAsset: adminProcedure
      .meta({
        name: 'Set Cover of Asset',
        docs: {
          description: 'Set the cover of an Asset',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(z.object({ collectionId: z.uuid(), assetId: z.uuid().nullable() }))
      .output(contentCollectionSchema)
      .mutation(async ({ ctx, input }) => {
        await dependencies.commandBus.execute(
          new SetContentCollectionCoverCommand(
            ctx.userId,
            input.collectionId,
            input.assetId,
          ),
        );
        return getCollection(input.collectionId);
      }),
    deleteAsset: adminProcedure
      .meta({
        name: 'Delete Asset',
        docs: {
          description: 'Delete an asset from a document collection',
          tags: ['Documents'],
          auth: true,
        },
      })
      .input(z.object({ assetId: z.uuid() }))
      .output(z.object({ assetId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
        await dependencies.commandBus.execute(
          new DeleteContentAssetCommand(ctx.userId, input.assetId),
        );
        return { assetId: input.assetId };
      }),
  });
}
