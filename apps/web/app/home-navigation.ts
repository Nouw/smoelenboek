import { FileText, ShieldCheck, Trophy, UsersRound } from 'lucide-react';

export const homeNavigationItems = [
  {
    key: 'teams',
    icon: UsersRound,
    url: '/teams/men',
  },
  {
    key: 'committees',
    icon: ShieldCheck,
    url: '/committees',
  },
  {
    key: 'documents',
    icon: FileText,
    url: '#',
  },
  {
    key: 'protototo',
    icon: Trophy,
    url: '/protototo',
  },
] as const;

export type HomeNavigationItem = (typeof homeNavigationItems)[number];
