'use client';

import { SidebarIcon } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@repo/ui/components/breadcrumb';
import { Button } from '@repo/ui/components/button';
import { Separator } from '@repo/ui/components/separator';
import { useSidebar } from '@repo/ui/components/sidebar';
import { MemberSearch } from '@/components/member-search';
import { NavUser } from '@/components/nav-user';
import { useI18n } from '@/lib/i18n';

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const { t } = useI18n();

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
                <BreadcrumbPage>{t('common.smoelenboek')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex justify-center px-1">
          <MemberSearch />
        </div>

        <div className="flex min-w-0 justify-end gap-1">
          {/*<LanguageSwitcher />*/}
          <NavUser variant="header" />
        </div>
      </div>
    </header>
  );
}
