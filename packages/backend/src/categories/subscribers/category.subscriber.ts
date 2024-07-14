import {
  EntitySubscriberInterface,
  InsertEvent,
  EventSubscriber,
} from 'typeorm';
import { Category } from '../entities/category.entity';

@EventSubscriber()
export class CategorySubscriber implements EntitySubscriberInterface<Category> {
  listenTo(): typeof Category {
    return Category;
  }

  async afterInsert(event: InsertEvent<Category>): Promise<void> {
    const { entity, manager } = event;
    entity.key = entity.id;
    await manager.getRepository(Category).save(entity);
    return;
  }
}
