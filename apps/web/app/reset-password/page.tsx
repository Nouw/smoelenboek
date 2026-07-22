'use client';

import { authClient } from '@/lib/auth-client';
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
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordCard description="Resetlink laden..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const linkError = searchParams.get('error');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token || linkError) {
      setError('Deze resetlink is ongeldig of verlopen.');
      return;
    }
    if (password !== confirmation) {
      setError('De wachtwoorden zijn niet gelijk.');
      return;
    }

    setIsSubmitting(true);
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setIsSubmitting(false);

    if (result.error) {
      setError(
        result.error.message ?? 'Het wachtwoord kon niet worden gewijzigd.',
      );
      return;
    }

    await authClient.signOut();
    setComplete(true);
  }

  if (complete) {
    return (
      <ResetPasswordCard description="Je wachtwoord is gewijzigd. Je kunt nu inloggen.">
        <Button asChild className="w-full">
          <Link href="/">Naar inloggen</Link>
        </Button>
      </ResetPasswordCard>
    );
  }

  const invalidLink = !token || Boolean(linkError);
  return (
    <ResetPasswordCard
      description={
        invalidLink
          ? 'Deze resetlink is ongeldig of verlopen.'
          : 'Kies een nieuw wachtwoord van minimaal 8 tekens.'
      }
    >
      {invalidLink ? (
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Terug naar inloggen</Link>
        </Button>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nieuw wachtwoord</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Herhaal wachtwoord</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Wachtwoord wijzigen...' : 'Wachtwoord wijzigen'}
          </Button>
        </form>
      )}
    </ResetPasswordCard>
  );
}

function ResetPasswordCard({
  children,
  description,
}: Readonly<{ children?: React.ReactNode; description: string }>) {
  return (
    <main className="bg-background text-foreground flex min-h-svh items-center justify-center px-5 py-10">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Nieuw wachtwoord</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </main>
  );
}
