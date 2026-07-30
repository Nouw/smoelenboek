"use client"

import * as React from "react"
import { FileText, ShieldCheck, Trophy, UsersRound } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { useI18n } from "@/lib/i18n"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@repo/ui/components/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useI18n()
  const navMain = [
    {
      title: t("nav.teams"),
      url: "/teams/men",
      icon: UsersRound,
      isActive: true,
      items: [
        {
          title: t("nav.men"),
          url: "/teams/men",
        },
        {
          title: t("nav.women"),
          url: "/teams/women",
        },
      ],
    },
    {
      title: t("nav.committees"),
      url: "/committees",
      icon: ShieldCheck,
    },
    {
      title: t("nav.documents"),
      url: "#",
      icon: FileText,
    },
    {
      title: t("nav.protototo"),
      url: "#",
      icon: Trophy,
    },
  ]

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  )
}
