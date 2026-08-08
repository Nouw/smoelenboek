export interface UserInformationDto {
  userId: string;
  streetName: string | null;
  houseNumber: string | null;
  postcode: string | null;
  city: string | null;
  phoneNumber: string | null;
  bankAccountNumber?: string | null;
  birthDate: string | null;
  bondNumber: string | null;
  leaveDate: string | null;
  backNumber: number | null;
  refereeLicense: string | null;
  createdAt: string;
  updatedAt: string;
}
