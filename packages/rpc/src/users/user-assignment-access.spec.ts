import { ConflictException, NotFoundException } from '@nestjs/common';
import { assertActiveUserForAssignment } from './user-assignment-access';

describe('assertActiveUserForAssignment', () => {
  const userId = 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0';

  it('accepts active users without a user_information row and locks the account', async () => {
    const query = jest.fn().mockResolvedValue([{ id: userId, banned: false, leaveDate: null }]);
    await expect(assertActiveUserForAssignment({ query } as never, userId)).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE OF u'), [userId]);
  });

  it.each([
    [{ id: userId, banned: false, leaveDate: '2026-09-24' }],
    [{ id: userId, banned: true, leaveDate: null }],
  ])('rejects inactive accounts', async (row) => {
    const query = jest.fn().mockResolvedValue([row]);
    await expect(assertActiveUserForAssignment({ query } as never, userId)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects missing accounts', async () => {
    const query = jest.fn().mockResolvedValue([]);
    await expect(assertActiveUserForAssignment({ query } as never, userId)).rejects.toBeInstanceOf(NotFoundException);
  });
});
