export default class EntityService {
  updateEntity<T>(properties: Partial<T>, entity: T, force = false) {
    for (const key of Object.keys(properties)) {
      if (properties[key] !== entity[key] || force) {
        entity[key] = properties[key];
      }
    }

    return entity;
  }
}
