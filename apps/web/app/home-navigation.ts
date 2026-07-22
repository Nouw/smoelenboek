import { FileText, ShieldCheck, Trophy, UsersRound } from 'lucide-react';

export const homeNavigationItems = [
  {
    key: 'teams',
    icon: UsersRound,
  },
  {
    key: 'committees',
    icon: ShieldCheck,
  },
  {
    key: 'documents',
    icon: FileText,
  },
  {
    key: 'protototo',
    icon: Trophy,
  },
] as const;

export type HomeNavigationItem = (typeof homeNavigationItems)[number];
