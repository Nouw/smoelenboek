import { describe, expect, it, jest } from '@jest/globals';
import { UserProvisioningService } from './user-provisioning.service';

describe('UserProvisioningService', () => {
  it('removes the Better Auth account when the transactional projection fails', async () => {
    const accounts = {
      create: jest.fn().mockResolvedValue({ id: 'be2afbe2-344b-48bb-8d0d-c6badea2da3b', email: 'member@example.com', name: 'Member' }),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    const dataSource = { transaction: jest.fn().mockRejectedValue(new Error('projection failed')) };
    const service = new UserProvisioningService(dataSource as never, {} as never, accounts);
    await expect(service.create({ email: 'member@example.com', name: 'Member', preferredLocale: 'nl', bondNumber: null }, 'admin-id')).rejects.toThrow('projection failed');
    expect(accounts.remove).toHaveBeenCalledWith('be2afbe2-344b-48bb-8d0d-c6badea2da3b');
  });

  it('does not attempt compensation when account creation itself fails', async () => {
    const accounts = { create: jest.fn().mockRejectedValue(new Error('already exists')), remove: jest.fn() };
    const service = new UserProvisioningService({} as never, {} as never, accounts);
    await expect(service.create({ email: 'member@example.com', name: 'Member', preferredLocale: 'nl', bondNumber: null }, 'admin-id')).rejects.toThrow('already exists');
    expect(accounts.remove).not.toHaveBeenCalled();
  });
});
