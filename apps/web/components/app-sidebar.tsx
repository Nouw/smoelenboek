'use client';

import * as React from 'react';
import { FileText, ShieldCheck, Trophy, UsersRound } from 'lucide-react';
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
      ],
    },
    {
      title: t('nav.committees'),
      url: "/committees",
      icon: ShieldCheck,
    },
    {
      title: t('nav.documents'),
      url: '#',
      icon: FileText,
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
