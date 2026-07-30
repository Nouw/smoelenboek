import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  toContentCollectionDetailOutput,
  toContentCollectionOutput,
} from '../dto/document-output';
import { DocumentsRepository } from '../repositories/documents.repository';
import {
  GetContentCollectionQuery,
  ListContentCollectionsQuery,
} from './document.queries';

@QueryHandler(ListContentCollectionsQuery)
export class ListContentCollectionsHandler
  implements IQueryHandler<ListContentCollectionsQuery>
{
  constructor(private readonly repository: DocumentsRepository) {}

  async execute(query: ListContentCollectionsQuery) {
    return (
      await this.repository.listCollections({
        seasonKey: query.seasonKey,
        kind: query.kind,
      })
    ).map(toContentCollectionOutput);
  }
}

@QueryHandler(GetContentCollectionQuery)
export class GetContentCollectionHandler
  implements IQueryHandler<GetContentCollectionQuery>
{
  constructor(private readonly repository: DocumentsRepository) {}

  async execute(query: GetContentCollectionQuery) {
    const collection = await this.repository.findCollection(query.collectionId);
    if (!collection) throw new NotFoundException('Collection not found.');
    return toContentCollectionDetailOutput(collection);
  }
}
