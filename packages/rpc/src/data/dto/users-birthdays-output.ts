export const toUserBirthdaysDto = (row: { id: string, name: string, birthDate: Date }) => (
  {
    id: row.id,
    name: row.name,
    birthDate: row.birthDate.toISOString(),
  }
)
