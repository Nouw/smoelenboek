"use client"

import { useClerk, useUser } from "@clerk/nextjs"
import { BadgeCheck, ChevronsUpDown, LogOut, Settings } from "lucide-react"

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

export function NavUser({ variant = "sidebar" }: { variant?: "sidebar" | "header" }) {
  const { openUserProfile, signOut } = useClerk()
  const { user } = useUser()
  const { isMobile } = useSidebar()
  const displayName = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "User"
  const email = user?.primaryEmailAddress?.emailAddress ?? "Account"
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((part) => part?.slice(0, 1).toUpperCase())
    .join("")
  const isHeader = variant === "header"
  const trigger = isHeader ? (
    <button
      type="button"
      className="inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md px-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      aria-label="Open account menu"
    >
      <Settings className="size-4 sm:hidden" />
      <Avatar className="hidden h-8 w-8 rounded-lg sm:flex">
        <AvatarImage src={user?.imageUrl} alt="" />
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
        <AvatarImage src={user?.imageUrl} alt="" />
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
                  <AvatarImage src={user?.imageUrl} alt="" />
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
              <DropdownMenuItem onSelect={() => openUserProfile()}>
                <BadgeCheck />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openUserProfile()}>
                <Settings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                void signOut()
              }}
            >
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
