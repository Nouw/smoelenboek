'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { authClient } from '@/lib/auth-client';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
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
import { useState, type FormEvent } from 'react';

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
  const session = authClient.useSession();

  if (session.isPending) {
    return <AuthLoading />;
  }

  return session.data ? <AuthenticatedLayout /> : <LoginLayout />;
}

function LoginLayout() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? 'Login failed.');
      return;
    }

    window.location.reload();
  }

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
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function AuthenticatedLayout() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col pt-(--header-height)">
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

function AuthLoading() {
  return (
    <main className="bg-background text-foreground flex min-h-svh items-center justify-center px-5 py-10">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader>
          <CardTitle>Loading</CardTitle>
          <CardDescription>
            Checking your session.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
