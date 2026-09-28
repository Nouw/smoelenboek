export const toUsersJoinedDto = (row: {id: string, name: string, createdAt: Date }) => ({
  id: row.id,
  name: row.name,
  joined: row.createdAt.toISOString()
})
