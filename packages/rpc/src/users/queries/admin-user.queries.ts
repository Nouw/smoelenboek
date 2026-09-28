export type ManagedUserStatus = 'active' | 'inactive';

export class ListManagedUsersQuery {
  constructor(
    public readonly query: string,
    public readonly limit: number,
    public readonly offset: number,
    public readonly status: ManagedUserStatus = 'active',
  ) {}
}
