# @niklaserik/effect-mcp Project Guidelines

## Project Purpose

This project is an MCP (Model Context Protocol) server designed to fetch the most current documentation from the Effect ecosystem. Key objectives:

- Provide real-time access to Effect documentation for AI assistants
- Support both stable (`effect`) and unstable/experimental (`@effect/*`) packages
- Detect Effect imports in user code to fetch relevant documentation
- Integrate with VS Code and other MCP clients to answer documentation questions

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
