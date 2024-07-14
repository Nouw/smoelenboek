import { Request as RequestE } from 'express';
import { User } from 'src/users/entities/user.entity';

export interface Request extends RequestE {
  user?: User;
}
