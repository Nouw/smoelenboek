export type TeamListItem = {
  name: string;
  category: 'men' | 'women';
  archivedAt: string | null;
};

export function isMensTeam(team: TeamListItem): boolean {
  return team.category === 'men' && team.archivedAt === null;
}

export function isWomensTeam(team: TeamListItem): boolean {
  return team.category === 'women' && team.archivedAt === null;
}

export function sortTeamsByNameNumber<T extends TeamListItem>(teams: T[]): T[] {
  return [...teams].sort((left, right) => {
    const leftNumber = teamNameNumber(left.name);
    const rightNumber = teamNameNumber(right.name);

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    return left.name.localeCompare(right.name, 'nl', {
      numeric: true,
      sensitivity: 'base',
    });
  });
}

function teamNameNumber(name: string): number {
  const match = /\b(\d+)\b/.exec(name);

  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}
