'use client';

import * as React from 'react';
import { FileText, Handshake, ShieldCheck, Trophy, UserCog, UsersRound, Vote } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { NavMain } from '@/components/nav-main';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useI18n } from '@/lib/i18n';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@repo/ui/components/sidebar';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { isAdmin } = useCurrentUser();
  const navMain = [
    {
      title: t('nav.teams'),
      url: '/teams/men',
      icon: UsersRound,
      isActive: pathname.startsWith('/teams'),
      items: [
        {
          title: t('nav.men'),
          url: '/teams/men',
        },
        {
          title: t('nav.women'),
          url: '/teams/women',
        },
        ...(isAdmin
          ? [
              {
                title: t('nav.manageTeams'),
                url: '/teams/admin',
              },
            ]
          : []),
      ],
    },
    {
      title: t('nav.committees'),
      url: "/committees",
      icon: ShieldCheck,
      isActive: pathname.startsWith('/committees'),
      items: isAdmin
        ? [
            { title: t('nav.committees'), url: '/committees' },
            {
              title: t('nav.manageCommittees'),
              url: '/committees/admin',
            },
          ]
        : undefined,
    },
    {
      title: t('nav.documents'),
      url: '/documents',
      icon: FileText,
      isActive: pathname.startsWith('/documents'),
    },
    {
      title: t('nav.polls'),
      url: '/polls',
      icon: Vote,
      isActive: pathname.startsWith('/polls'),
      items: isAdmin
        ? [
            { title: t('nav.votePolls'), url: '/polls' },
            { title: t('nav.managePolls'), url: '/polls/admin' },
          ]
        : undefined,
    },
    {
      title: t('nav.protototo'),
      url: "/protototo",
      icon: Trophy,
      isActive: pathname.startsWith('/protototo'),
      items: isAdmin
        ? [
            { title: t('nav.playProtototo'), url: "/protototo" },
            { title: t('nav.manageProtototo'), url: "/protototo/admin" },
          ]
        : undefined,
    },
    {
      title: t('nav.sponsorhengel'),
      url: '/sponsorhengel',
      icon: Handshake,
      isActive: pathname.startsWith('/sponsorhengel'),
    },
    ...(isAdmin ? [{ title: t('nav.manageUsers'), url: '/users/admin', icon: UserCog, isActive: pathname.startsWith('/users/admin') }] : []),
  ];

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}
