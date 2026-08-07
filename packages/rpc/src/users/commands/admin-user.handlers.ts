import type { ManagedUserDto } from '@repo/api';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { UserProvisioningService } from '../services/user-provisioning.service';
import { CreateManagedUserCommand, ResendUserInvitationCommand } from './admin-user.commands';

@CommandHandler(CreateManagedUserCommand)
export class CreateManagedUserHandler implements ICommandHandler<CreateManagedUserCommand, ManagedUserDto> {
  constructor(private readonly provisioning: UserProvisioningService) {}
  execute(command: CreateManagedUserCommand): Promise<ManagedUserDto> { return this.provisioning.create(command.input, command.actorUserId); }
}
@CommandHandler(ResendUserInvitationCommand)
export class ResendUserInvitationHandler implements ICommandHandler<ResendUserInvitationCommand, { queued: true }> {
  constructor(private readonly provisioning: UserProvisioningService) {}
  execute(command: ResendUserInvitationCommand): Promise<{ queued: true }> { return this.provisioning.resend(command.userId); }
}
