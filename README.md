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

## What this server exposes

- Resources (preferred)
  - Dynamic template: `effect-docs://{libId}`
  - Completions on `{libId}` and resource listing are supported
  - Static aliases for discovery: `effect-docs://effect`, `effect-docs://@effect-platform`, etc.
  - Supported libraries (as of now):
    - `effect`
    - `@effect/platform`
    - `@effect/sql`
    - `@effect/vitest`
    - `@effect/ai`
    - `@effect/cli`
    - `@effect/cluster`
    - `@effect/rpc`
    - `@effect/typeclass`
- Tools (for compatibility)
  - `effect-documentation`: fetch docs for selected libraries and return concatenated markdown
  - `effect-doc-links`: return plain URIs to the resources above so clients can follow them

Caching & Retry

- In-memory TTL cache (~10 minutes) to avoid refetching unchanged docs.
- Lightweight retry with small backoff on transient fetch errors.

## Installation

```bash
pnpm add @niklaserik/effect-mcp
```

## Usage

For usage in VS Code or other MCP clients, refer to the client's documentation for adding custom MCP servers.

Quick test locally:

```bash
pnpm install
pnpm build
node dist/index.js # stdio transport
```

Then connect with an MCP client (e.g., MCP Inspector) over stdio and try:

- List resources and read `effect-docs://effect`
- Call tool `effect-doc-links` with `{ "libraries": ["effect", "@effect/platform"] }`

Initialization instructions

- The server publishes short usage instructions via MCP initialize for clients that display them.

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode with auto-reload
pnpm dev
```

Notes:

- Built with `@modelcontextprotocol/sdk@^1.17.4` using the modern `registerResource`/`registerTool` APIs.
- Transport: stdio by default; can be adapted to Streamable HTTP if needed.

## License

MIT
