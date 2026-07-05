import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UpdateUserProfileCommand } from '../../users/commands/update-user-profile.command';
import { UsersRepository } from '../../users/repositories/users.repository';
import { MediaService } from '../media.service';
import {
  DeleteProfileImageCommand,
  UploadProfileImageCommand,
} from './profile-image.commands';

type ProfileImageResponse = {
  imageUrl: string | null;
};

@CommandHandler(UploadProfileImageCommand)
export class UploadProfileImageHandler
  implements ICommandHandler<UploadProfileImageCommand, ProfileImageResponse>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mediaService: MediaService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(command: UploadProfileImageCommand): Promise<ProfileImageResponse> {
    const currentUser = await this.usersRepository.findById(command.userId);
    const previousImageUrl = currentUser?.imageUrl ?? null;
    const uploadedObject = await this.mediaService.uploadImage(
      'profile-images',
      command.userId,
      command.file,
    );

    try {
      await this.commandBus.execute(
        new UpdateUserProfileCommand(command.userId, {
          imageUrl: uploadedObject.imageUrl,
        }),
      );
    } catch (error) {
      await this.mediaService.deleteObjectByUrl(uploadedObject.imageUrl);
      throw error;
    }

    await this.deletePreviousObject(previousImageUrl);

    return { imageUrl: uploadedObject.imageUrl };
  }

  private async deletePreviousObject(objectUrl: string | null): Promise<void> {
    try {
      await this.mediaService.deleteObjectByUrl(objectUrl);
    } catch (error) {
      console.warn(
        `[media] Failed to delete previous profile object: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

@CommandHandler(DeleteProfileImageCommand)
export class DeleteProfileImageHandler
  implements ICommandHandler<DeleteProfileImageCommand, ProfileImageResponse>
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mediaService: MediaService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(command: DeleteProfileImageCommand): Promise<ProfileImageResponse> {
    const currentUser = await this.usersRepository.findById(command.userId);
    const previousImageUrl = currentUser?.imageUrl ?? null;

    await this.commandBus.execute(
      new UpdateUserProfileCommand(command.userId, { imageUrl: null }),
    );
    await this.deletePreviousObject(previousImageUrl);

    return { imageUrl: null };
  }

  private async deletePreviousObject(objectUrl: string | null): Promise<void> {
    try {
      await this.mediaService.deleteObjectByUrl(objectUrl);
    } catch (error) {
      console.warn(
        `[media] Failed to delete previous profile object: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
