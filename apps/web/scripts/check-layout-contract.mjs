import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const appShell = readFileSync(join('app', 'app-shell.tsx'), 'utf8');
const componentsConfig = readFileSync('components.json', 'utf8');
const globals = readFileSync(join('app', 'globals.css'), 'utf8');
const packageJson = readFileSync('package.json', 'utf8');
const layout = readFileSync(join('app', 'layout.tsx'), 'utf8');
const page = readFileSync(join('app', 'page.tsx'), 'utf8');

const requiredTerms = [
  'SignedOut',
  'SignedIn',
  'SignInButton',
  'useClerk',
  'openUserProfile',
  'signOut',
  'Teams',
  'Committees',
  'Documents',
  'Protototo',
  'Profile',
  'Settings',
  'Logout',
];

const missingTerms = requiredTerms.filter((term) => !appShell.includes(term));

if (!page.includes('<AppShell />')) {
  throw new Error('Homepage must render the authenticated app shell.');
}

if (missingTerms.length > 0) {
  throw new Error(`Layout contract missing: ${missingTerms.join(', ')}`);
}

if (/SignUp|sign up|register|registration/i.test(appShell)) {
  throw new Error('Layout must not expose registration UI.');
}

if (!layout.includes('suppressHydrationWarning')) {
  throw new Error('Root html must suppress extension-injected attributes.');
}

if (/--background:\s*#|--foreground:\s*#|\*\s*{[^}]*padding:\s*0/s.test(globals)) {
  throw new Error('App globals must not override Shadcn theme/reset output.');
}

if (globals.includes('@import "@repo/ui/globals.css"')) {
  throw new Error('Web app must own Shadcn globals for Turbopack dev CSS.');
}

for (const term of ['@theme inline', '--color-card', '@layer base', '@source "./**/*.{ts,tsx}"']) {
  if (!globals.includes(term)) {
    throw new Error(`Web globals missing required Tailwind/Shadcn term: ${term}`);
  }
}

if (!componentsConfig.includes('"css": "app/globals.css"')) {
  throw new Error('Web Shadcn config must point at app/globals.css.');
}

if (packageJson.includes('--turbopack')) {
  throw new Error('Web dev must use webpack until Turbopack emits Tailwind utilities correctly.');
}

console.log('Web layout contract passed.');
