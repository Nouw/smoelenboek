"use client"

import { BadgeCheck, ChevronsUpDown, LogOut, Settings } from "lucide-react"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar"

import { ProfileEditDialog } from "./profile-edit-dialog"

export function NavUser({ variant = "sidebar" }: { variant?: "sidebar" | "header" }) {
  const session = authClient.useSession()
  const user = session.data?.user
  const { isMobile } = useSidebar()
  const [profileOpen, setProfileOpen] = useState(false)
  const displayName = user?.name ?? user?.email ?? "User"
  const email = user?.email ?? "Account"
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("")
  const imageUrl = user?.image ?? undefined
  const isHeader = variant === "header"
  const trigger = isHeader ? (
    <button
      type="button"
      className="inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      aria-label="Open account menu"
    >
      <Settings className="size-4 sm:hidden" />
      <Avatar className="hidden h-8 w-8 rounded-lg sm:flex">
        <AvatarImage src={imageUrl} alt="" />
        <AvatarFallback className="rounded-lg">{initials || "U"}</AvatarFallback>
      </Avatar>
      <div className="hidden max-w-36 text-left text-sm leading-tight lg:grid">
        <span className="truncate font-medium">{displayName}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      </div>
      <ChevronsUpDown className="hidden size-4 text-muted-foreground sm:block" />
    </button>
  ) : (
    <SidebarMenuButton
      size="lg"
      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={imageUrl} alt="" />
        <AvatarFallback className="rounded-lg">{initials || "U"}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{displayName}</span>
        <span className="truncate text-xs">{email}</span>
      </div>
      <ChevronsUpDown className="ml-auto size-4" />
    </SidebarMenuButton>
  )

  return (
    <SidebarMenu className={isHeader ? "w-auto" : undefined}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {trigger}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg sm:w-(--radix-dropdown-menu-trigger-width)"
            side={isMobile || isHeader ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={imageUrl} alt="" />
                  <AvatarFallback className="rounded-lg">{initials || "U"}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
                <BadgeCheck />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                void authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.reload()
                    },
                  },
                })
              }}
            >
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <ProfileEditDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </SidebarMenu>
  )
}
