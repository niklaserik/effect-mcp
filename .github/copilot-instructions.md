# Effect-MCP Project Guidelines

## Package Management

- Always use pnpm for package management in this project. Do not use npm or yarn.
- Use `pnpm add <package>` to add dependencies
- Use `pnpm add -D <package>` to add dev dependencies
- Use `pnpm install` to install all dependencies
- Use `pnpm run <script>` to run scripts

## Code Style

- Follow the ESLint rules configured for this project
- Use TypeScript for all new code
- Use Effect.js style patterns and practices

## Project Structure

- Place source files in the `/src` directory
- Tests should follow the naming convention `*.test.ts`

## Building & Running

- Use `pnpm build` to build the project
- Use `pnpm dev` for development with watch mode
