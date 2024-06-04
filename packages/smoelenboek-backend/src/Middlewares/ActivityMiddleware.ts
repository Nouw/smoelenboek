import { attachMiddleware } from "@decorators/express";

/**
 * Should be called on an info endpoint such that anonymous users cannot acces the endpoint
 */
export function PublicAllowed() {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    attachMiddleware(target, propertyKey, (req: RequestE, res, next) => {
    

    });
  };
}

