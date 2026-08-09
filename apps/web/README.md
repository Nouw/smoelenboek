# Getting Started

## Member profile

An authenticated member profile is available at /profile/:userId. It combines
the selected user projection, association information, and membership history
from the tRPC user router. Team and committee catalogs are fetched in parallel
so membership IDs can be rendered as readable names. One profile dialog lets
owners edit their email, profile picture, contact details, bank account, and
back number together. Administrators use the same dialog for another member's
contact, bank, and back-number fields, without receiving access to that
member's email or profile-picture controls. The server only returns bank-account
data to its owner or an administrator, and the page renders that field only
when it is present in the response.

Administrators use `/teams/admin` to create, edit, archive, and restore teams.
Each team has a season-specific roster workspace with a debounced member picker,
volleyball roles, explicit assignment start dates, and immediate member removal.
Archived teams are hidden from the men/women directories but remain readable by
direct link.

Administrators use `/committees/admin` to create, edit, archive, and restore
committees, update their banner image URL, and manage committee members for any
season. Assignments require an explicit committee role and start date. Removing
a member takes effect immediately. Archived committees are hidden from the
public directory but remain readable by direct link.

The page uses the shared Shadcn components and includes responsive layouts,
loading/error/empty states, direct email and phone actions, Google Maps address
links, and Dutch/English translations.

Use `useCurrentUser` from `hooks/use-current-user.ts` when a client component
needs the signed-in user's role, the `isAdmin` flag, or an `isOwner(userId)`
check. These values control presentation only; API policies remain the source
of truth for authorization.

Run pnpm --filter web test for its gate contract and pnpm --filter web eval for
the scored UX contract.

First, run the development server:

```bash
pnpm dev
# Also works with NPM, YARN, BUN, ...
```

Browse [localhost:3001](http://localhost:3001) to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

## Learn More

Learn more about `Next.js` with the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
