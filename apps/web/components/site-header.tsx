"use client"

import { Search, SidebarIcon } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@repo/ui/components/breadcrumb"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Separator } from "@repo/ui/components/separator"
import { useSidebar } from "@repo/ui/components/sidebar"
import { NavUser } from "@/components/nav-user"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex w-full items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="grid h-(--header-height) w-full grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 px-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <SidebarIcon />
          </Button>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <Breadcrumb className="hidden min-w-0 lg:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Smoelenboek</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex justify-center px-1">
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="h-9 rounded-full bg-muted/40 pl-9 shadow-none"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="flex min-w-0 justify-end">
          <NavUser variant="header" />
        </div>
      </div>
    </header>
  )
}
