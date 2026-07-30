import type { ContentCollectionKind } from '@repo/api';

export class ListContentCollectionsQuery {
  constructor(
    public readonly seasonKey?: number,
    public readonly kind?: ContentCollectionKind,
  ) {}
}

export class GetContentCollectionQuery {
  constructor(public readonly collectionId: string) {}
}
