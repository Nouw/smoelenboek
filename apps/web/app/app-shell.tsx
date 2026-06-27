'use client';

import {
  SignInButton,
  SignedIn,
  SignedOut,
} from '@clerk/nextjs';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  SidebarInset,
  SidebarProvider,
} from '@repo/ui/components/sidebar';
import {
  FileText,
  ShieldCheck,
  Trophy,
  UsersRound,
} from 'lucide-react';

const navigationItems = [
  {
    label: 'Teams',
    description: 'Team membership, roles, and contact context.',
    icon: UsersRound,
    active: true,
  },
  {
    label: 'Committees',
    description: 'Working groups and committee responsibilities.',
    icon: ShieldCheck,
    active: false,
  },
  {
    label: 'Documents',
    description: 'Shared documents and internal references.',
    icon: FileText,
    active: false,
  },
  {
    label: 'Protototo',
    description: 'Competition overview and participation area.',
    icon: Trophy,
    active: false,
  },
];

export function AppShell() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <AuthUnavailable />;
  }

  return (
    <>
      <SignedOut>
        <SignedOutLayout />
      </SignedOut>
      <SignedIn>
        <SignedInLayout />
      </SignedIn>
    </>
  );
}

function SignedOutLayout() {
  return (
    <main className="bg-background text-foreground flex min-h-svh items-center justify-center px-5 py-10">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Smoelenboek</CardTitle>
          <CardDescription>
            Log in with your existing account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInButton mode="modal">
            <Button type="button" className="w-full">
              Log in
            </Button>
          </SignInButton>
        </CardContent>
      </Card>
    </main>
  );
}

function SignedInLayout() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <section className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-normal">
                  Teams
                </h1>
                <p className="text-muted-foreground text-sm">
                  Layout shell for authenticated member areas.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {navigationItems.map((item) => (
                  <SectionPlaceholder key={item.label} item={item} />
                ))}
              </div>
            </section>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

function SectionPlaceholder({
  item,
}: {
  item: (typeof navigationItems)[number];
}) {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-md">
            <item.icon className="size-5" />
          </div>
          <div>
            <CardTitle>{item.label}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function AuthUnavailable() {
  return (
    <main className="bg-background text-foreground flex min-h-svh items-center justify-center px-5 py-10">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader>
          <CardTitle>Authentication unavailable</CardTitle>
          <CardDescription>
            Add the Clerk publishable key to enable login.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
