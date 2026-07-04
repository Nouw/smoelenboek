export interface UserDto {
  id: string;
  authUserId: string | null;
  email: string | null;
  emailVerified: boolean;
  name: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
