export type TeamListItem = {
  name: string;
};

export function isMensTeam(team: TeamListItem): boolean {
  return team.name.startsWith('Heren ');
}

export function isWomensTeam(team: TeamListItem): boolean {
  return team.name.startsWith('Dames ');
}
