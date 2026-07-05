export type TeamListItem = {
  name: string;
};

export function isMensTeam(team: TeamListItem): boolean {
  return team.name.startsWith('Heren ');
}

export function isWomensTeam(team: TeamListItem): boolean {
  return team.name.startsWith('Dames ');
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
