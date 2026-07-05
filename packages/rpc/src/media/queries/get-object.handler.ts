import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { MediaService, type StoredObject } from '../media.service';
import { GetObjectQuery } from './get-object.query';

@QueryHandler(GetObjectQuery)
export class GetObjectHandler
  implements IQueryHandler<GetObjectQuery, StoredObject>
{
  constructor(private readonly mediaService: MediaService) {}

  execute(query: GetObjectQuery): Promise<StoredObject> {
    return this.mediaService.getObjectByName(query.objectName);
  }
}
