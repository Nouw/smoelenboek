# Smoelenboek Monorepo

Smoelenboek is a TypeScript monorepo for USV Protos, dedicated to managing files, users, and teams. This repository brings together the frontend, backend, and shared types for a comprehensive, type-safe solution.

## Requirements

- Node.js: Version 18 or higher
- MySQL: Version 8

## Packages

### smoelenboek-frontend
A React-based website that utilizes:

- Vite for faster and leaner development.
- Redux Toolkit for efficient state management.
- Redux Query for managing and automating network request state in your Redux store.

### smoelenboek-backend
A custom-modified Express framework that features:

- TypeORM for a powerful ORM tailored for TypeScript.
- Decorators to enhance and simplify the development experience.

### smoelenboek-types
This package houses entities used in both the frontend and backend. It ensures type safety across the board, solidifying the integrity of data interactions between different parts of the application.

### Git Workflow Rules

- **Features**: When working on a new feature, please create a new branch using the format feature/{name}.
- **Bugs**: If you're addressing a bug, use the branch naming format bug/{name}.
- **Pull Requests**: Once your work is ready for review, please create a pull request. Your changes will be reviewed before merging.

## Lead & Contact

For any queries, suggestions, or contributions, please reach out to the project lead:

Fabio Dijkshoorn<nouw@nouw.net>

