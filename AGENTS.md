# AGENTS.md

## Commands
- **Build**: `block release` - Builds and releases the extension to Airtable servers.
- **Lint**: `npm run lint` - Runs ESLint on frontend code.
- **Test**: No test framework configured.
- **Run single test**: N/A (no tests present).
- **Dev server**: `block run` - Starts development server for local testing.
- **Init**: `block init` - Initializes the extension project.

## Code Style Guidelines
- **Components**: Use React function components with hooks; wrap class components if needed.
- **Imports**: Order: @airtable/blocks/ui first, then React, then local files.
- **Naming**: PascalCase for component names, camelCase for variables/functions.
- **JSX**: Use JSX for rendering, avoid prop-types (disabled in ESLint).
- **Error Handling**: Use try-catch for async operations; check permissions before writes.
- **Formatting**: Follow ESLint rules (extends eslint:recommended, react/recommended).
- **Hooks**: Enforce rules-of-hooks, warn on exhaustive-deps; don't call conditionally.
- **Data Loading**: Use useLoadable for async data; use IfExists variants to handle deletions.
- **Async Operations**: Use async/await; batch updates with limits (50 records max).
- **CSS**: Support dark mode with prefers-color-scheme media query.
- **Types**: No TypeScript; use plain JavaScript.
- **Comments**: Do not add comments unless explicitly requested.

No Cursor or Copilot rules found in .cursor/rules/ or .github/copilot-instructions.md.