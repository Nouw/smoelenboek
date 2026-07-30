import type { ContentCollectionKind } from '@repo/api';

export class CreateContentCollectionCommand {
  constructor(
    public readonly actorId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly kind: ContentCollectionKind,
    public readonly seasonKey: number,
  ) {}
}

export class UpdateContentCollectionCommand {
  constructor(
    public readonly actorId: string,
    public readonly collectionId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly seasonKey: number,
  ) {}
}

export class ReorderContentCollectionsCommand {
  constructor(
    public readonly actorId: string,
    public readonly seasonKey: number,
    public readonly kind: ContentCollectionKind,
    public readonly collectionIds: string[],
  ) {}
}

export class DeleteContentCollectionCommand {
  constructor(
    public readonly actorId: string,
    public readonly collectionId: string,
  ) {}
}

/** Internal command used by authenticated media uploads after OCI persistence. */
export class AddContentAssetCommand {
  constructor(
    public readonly actorId: string,
    public readonly collectionId: string,
    public readonly objectName: string,
    public readonly thumbnailObjectName: string | null,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly byteSize: number,
    public readonly title: string | null = null,
    public readonly caption: string | null = null,
  ) {}
}

export class UpdateContentAssetCommand {
  constructor(
    public readonly actorId: string,
    public readonly assetId: string,
    public readonly title: string | null | undefined,
    public readonly caption: string | null | undefined,
  ) {}
}

export class ReorderContentAssetsCommand {
  constructor(
    public readonly actorId: string,
    public readonly collectionId: string,
    public readonly assetIds: string[],
  ) {}
}

export class SetContentCollectionCoverCommand {
  constructor(
    public readonly actorId: string,
    public readonly collectionId: string,
    public readonly assetId: string | null,
  ) {}
}

export class DeleteContentAssetCommand {
  constructor(
    public readonly actorId: string,
    public readonly assetId: string,
  ) {}
}
