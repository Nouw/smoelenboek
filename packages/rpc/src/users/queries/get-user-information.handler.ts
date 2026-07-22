import type { UserInformationDto } from '@repo/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { toUserInformationDto } from '../dto/user-information-output';
import { UserInformationRepository } from '../repositories/user-information.repository';
import { canViewBankAccountNumber } from '../user-information-policy';
import { GetUserInformationQuery } from './get-user-information.query';

@QueryHandler(GetUserInformationQuery)
export class GetUserInformationHandler
  implements IQueryHandler<GetUserInformationQuery, UserInformationDto | null>
{
  constructor(
    private readonly userInformationRepository: UserInformationRepository,
  ) {}

  async execute(
    query: GetUserInformationQuery,
  ): Promise<UserInformationDto | null> {
    const information = await this.userInformationRepository.findByUserId(
      query.targetUserId,
    );

    return information
      ? toUserInformationDto(
          information,
          canViewBankAccountNumber(
            query.actorUserId,
            query.actorRole,
            query.targetUserId,
          ),
        )
      : null;
  }
}
