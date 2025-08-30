# Contributing to WAL

Thank you for your interest in contributing!

## Getting started

- Fork and clone the repository
- Install dependencies: `npm ci` or `yarn install`
- Start app: `npm start`
- Generate API client if backend spec changed: `npm run generate:api`

## Branching

- Create feature branches from `dev`
- Open PRs into `dev`
- `staging` is for pre-release; `main` is production

## Checks

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Prettier: `npm run format:check`
- Tests: `npm test`

## Commit and PR guidelines

- Use Conventional Commits in PR titles
- Link issues: `Closes #123`

## Environment

- API base URL is derived from stage in `app.config.js`

## Releases

- Version comes from `app.config.js`
- Android APKs are uploaded to GitHub Releases; AAB to Play Store
