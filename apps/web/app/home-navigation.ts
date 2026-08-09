import { FileText, Handshake, ShieldCheck, Trophy, UsersRound, Vote } from 'lucide-react';

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
  {
    key: 'polls',
    icon: Vote,
    url: '/polls',
  },
  {
    key: 'sponsorhengel',
    icon: Handshake,
    url: '/sponsorhengel',
  },
] as const;

export type HomeNavigationItem = (typeof homeNavigationItems)[number];
