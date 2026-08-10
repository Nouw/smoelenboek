'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { authClient } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarInset, SidebarProvider } from '@repo/ui/components/sidebar';
import { useState, type FormEvent } from 'react';

export function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const session = authClient.useSession();
  const isPublicProtototo = pathname === '/protototo';

  if (
    pathname === '/reset-password' ||
    pathname === '/request-password-reset'
  ) {
    return children;
  }

  if (session.isPending) {
    return <AuthLoading />;
  }

  if (session.data) {
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  return isPublicProtototo ? (
    <PublicProtototoLayout>{children}</PublicProtototoLayout>
  ) : (
    <LoginLayout />
  );
}

function PublicProtototoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { t } = useI18n();
  return (
    <div className="min-h-svh bg-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/protototo" className="font-semibold tracking-tight">
            {t('common.smoelenboek')} · {t('nav.protototo')}
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <Button asChild size="sm" variant="outline">
              <Link href="/">{t('auth.login')}</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

function LoginLayout() {
  const { t } = useI18n();
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
      setError(result.error.message ?? t('auth.loginFailed'));
      return;
    }

    window.location.reload();
  }

  return (
    <main className="bg-background text-foreground flex min-h-svh items-center justify-center px-5 py-10">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Smoelenboek</CardTitle>
          <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
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
              <Label htmlFor="password">{t('auth.password')}</Label>
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
              {isSubmitting ? t('auth.loggingIn') : t('auth.login')}
            </Button>
            <Button asChild type="button" variant="ghost" className="w-full">
              <Link href="/request-password-reset">Wachtwoord vergeten?</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col pt-(--header-height)">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <section className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
              {children}
            </section>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

function AuthLoading() {
  const { t } = useI18n();

  return (
    <main className="bg-background text-foreground flex min-h-svh items-center justify-center px-5 py-10">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader>
          <CardTitle>{t('common.loading')}</CardTitle>
          <CardDescription>{t('auth.checkingSession')}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
