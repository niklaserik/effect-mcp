# @niklaserik/effect-mcp

A Model Context Protocol (MCP) server dedicated to fetching the most current documentation from the Effect ecosystem.

## Purpose

This MCP server provides real-time access to Effect documentation for AI assistants and tools. It enables VS Code extensions and other MCP clients to retrieve accurate and up-to-date Effect package documentation to assist developers with questions about:

- The core `effect` package
- Ecosystem packages (`@effect/platform`, `@effect/ai`, etc.)
- Both stable and unstable Effect packages

The server intelligently detects imported Effect packages in your code and fetches the most relevant documentation to answer your queries.

## Features

- Real-time documentation access for Effect ecosystem
- Support for both stable and experimental packages
- Context-aware package detection based on imports
- Seamless integration with VS Code and other MCP-compatible clients
- Helps answer API usage questions for Effect developers

## Installation

```bash
pnpm add @niklaserik/effect-mcp
```

## Usage

For usage in VS Code or other MCP clients, refer to the client's documentation for adding custom MCP servers.

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode with auto-reload
pnpm dev
```

## License

MIT
