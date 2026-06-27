"use client"

import * as React from "react"
import { FileText, ShieldCheck, Trophy, UsersRound } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@repo/ui/components/sidebar"

const data = {
  navMain: [
    {
      title: "Teams",
      url: "#",
      icon: UsersRound,
      isActive: true,
    },
    {
      title: "Committees",
      url: "#",
      icon: ShieldCheck,
    },
    {
      title: "Documents",
      url: "#",
      icon: FileText,
    },
    {
      title: "Protototo",
      url: "#",
      icon: Trophy,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  )
}
