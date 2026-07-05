import type { ImageUploadFile } from '../media.service';

export class UploadProfileImageCommand {
  constructor(
    public readonly userId: string,
    public readonly file: ImageUploadFile,
  ) {}
}

export class DeleteProfileImageCommand {
  constructor(public readonly userId: string) {}
}
