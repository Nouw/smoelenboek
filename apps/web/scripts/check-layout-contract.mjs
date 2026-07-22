import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [layout, shell, sidebar, header, navigation, globals, config] =
  await Promise.all([
    readFile(new URL('app/layout.tsx', root), 'utf8'),
    readFile(new URL('app/app-shell.tsx', root), 'utf8'),
    readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
    readFile(new URL('components/site-header.tsx', root), 'utf8'),
    readFile(new URL('components/nav-user.tsx', root), 'utf8'),
    readFile(new URL('app/globals.css', root), 'utf8'),
    readFile(new URL('components.json', root), 'utf8'),
  ]);
const layoutSurface = [layout, shell, sidebar, header, navigation].join('\n');

for (const term of [
  'authClient.useSession',
  'authClient.signIn.email',
  'authClient.signOut',
  'SidebarProvider',
  'SidebarInset',
  'type="search"',
  'variant="header"',
  "'/profile/' + profileUserId",
]) {
  assert.ok(layoutSurface.includes(term), 'Layout contract missing: ' + term);
}
assert.doesNotMatch(layoutSurface, /Clerk|@clerk\/nextjs/);
assert.doesNotMatch(layoutSurface, /SignUp|sign up|register|registration/i);
assert.match(layout, /suppressHydrationWarning/);
for (const term of [
  '@theme inline',
  '--color-card',
  '--color-sidebar',
  '@layer base',
  '@source "./**/*.{ts,tsx}"',
]) {
  assert.ok(globals.includes(term), 'Web globals missing: ' + term);
}
assert.match(config, /"css": "app\/globals\.css"/);

console.log('Web layout contract passed.');
