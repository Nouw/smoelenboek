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
import { useState, type FormEvent } from 'react';

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);

    if (result.error) {
      setError(
        result.error.message ?? 'De resetlink kon niet worden aangevraagd.',
      );
      return;
    }

    setComplete(true);
  }

  return (
    <main className="bg-background text-foreground flex min-h-svh items-center justify-center px-5 py-10">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Wachtwoord opnieuw instellen
          </CardTitle>
          <CardDescription>
            {complete
              ? 'Als dit e-mailadres bestaat, is er een resetlink verstuurd.'
              : 'Vul het e-mailadres van je account in.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {complete ? (
            <Button asChild className="w-full">
              <Link href="/">Terug naar inloggen</Link>
            </Button>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-mailadres</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              {error ? (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Resetlink aanvragen...'
                  : 'Resetlink aanvragen'}
              </Button>
              <Button asChild type="button" variant="ghost" className="w-full">
                <Link href="/">Annuleren</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
