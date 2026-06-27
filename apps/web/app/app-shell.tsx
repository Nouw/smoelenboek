'use client';

import {
  SignInButton,
  SignedIn,
  SignedOut,
  useClerk,
  useUser,
} from '@clerk/nextjs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { cn } from '@repo/ui/lib/utils';
import {
  CircleUserRound,
  FileText,
  LogOut,
  Settings,
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
    <div className="bg-background text-foreground min-h-svh">
      <div className="flex min-h-svh">
        <aside className="border-border bg-card hidden w-72 shrink-0 border-r lg:flex lg:flex-col">
          <div className="border-border flex h-16 items-center px-6">
            <div>
              <div className="text-base font-semibold">Smoelenboek</div>
              <div className="text-muted-foreground text-xs">Member portal</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
            {navigationItems.map((item) => (
              <NavigationButton key={item.label} item={item} />
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-border bg-background/95 sticky top-0 z-20 border-b backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0 lg:hidden">
                <div className="text-sm font-semibold">Smoelenboek</div>
                <div className="text-muted-foreground text-xs">Member portal</div>
              </div>
              <nav
                className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex"
                aria-label="Current section"
              >
                {navigationItems.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-md px-3 text-sm',
                      item.active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </div>
                ))}
              </nav>
              <AccountMenu />
            </div>
            <nav
              className="border-border flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden"
              aria-label="Main"
            >
              {navigationItems.map((item) => (
                <MobileNavigationButton key={item.label} item={item} />
              ))}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
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
          </main>
        </div>
      </div>
    </div>
  );
}

function AccountMenu() {
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((part) => part?.slice(0, 1).toUpperCase())
    .join('');
  const displayName = user?.fullName ?? user?.primaryEmailAddress?.emailAddress;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 max-w-52 justify-start gap-2 px-2"
          aria-label="Open account menu"
        >
          <Avatar className="size-8">
            <AvatarImage src={user?.imageUrl} alt="" />
            <AvatarFallback className="text-xs">{initials || 'U'}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
            <span className="max-w-32 truncate text-sm font-medium">
              {displayName ?? 'User'}
            </span>
            <span className="text-muted-foreground text-xs">Account</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">
          {displayName ?? 'Account'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openUserProfile()}>
          <CircleUserRound className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => openUserProfile()}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            void signOut();
          }}
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavigationButton({
  item,
}: {
  item: (typeof navigationItems)[number];
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
        item.active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
      aria-current={item.active ? 'page' : undefined}
    >
      <item.icon className="size-4" />
      <span>{item.label}</span>
    </button>
  );
}

function MobileNavigationButton({
  item,
}: {
  item: (typeof navigationItems)[number];
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors',
        item.active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
      aria-current={item.active ? 'page' : undefined}
    >
      <item.icon className="size-4" />
      {item.label}
    </button>
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
