import { z } from 'zod';

export const contentCollectionKindSchema = z.enum([
  'photo_album',
  'document_library',
]);

export const contentAssetSchema = z.object({
  id: z.uuid(),
  collectionId: z.uuid(),
  originalName: z.string(),
  mimeType: z.string(),
  byteSize: z.number().int().nonnegative(),
  title: z.string().nullable(),
  caption: z.string().nullable(),
  position: z.number().int().nonnegative(),
  hasThumbnail: z.boolean(),
  uploadedBy: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const contentCollectionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  kind: contentCollectionKindSchema,
  seasonKey: z.number().int().min(1900).max(3000),
  position: z.number().int().nonnegative(),
  coverAssetId: z.uuid().nullable(),
  assetCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const contentCollectionDetailSchema = contentCollectionSchema.extend({
  assets: z.array(contentAssetSchema),
});

export const createContentCollectionInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2_000).nullable().optional(),
  kind: contentCollectionKindSchema,
  seasonKey: z.number().int().min(1900).max(3000),
});

export const updateContentCollectionInputSchema = z.object({
  collectionId: z.uuid(),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2_000).nullable().optional(),
  seasonKey: z.number().int().min(1900).max(3000),
});

export type ContentCollectionKind = z.infer<
  typeof contentCollectionKindSchema
>;
export type ContentAssetDto = z.infer<typeof contentAssetSchema>;
export type ContentCollectionDto = z.infer<typeof contentCollectionSchema>;
export type ContentCollectionDetailDto = z.infer<
  typeof contentCollectionDetailSchema
>;
