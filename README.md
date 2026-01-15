# graphql-lab

A hands-on GraphQL playground where I experiment with core and advanced GraphQL concepts, focusing on schema design, pagination patterns, and performance optimizations

## Tech Stack

- GraphQL
- TypeScript
- MongoDB
- pnpm — package manager
- Bun — JavaScript runtime
- Docker / Docker Compose — local database setup

## Project Structure
```
.
├── data-loader/        # DataLoader patterns and batching strategies
├── schema/             # GraphQL schemas and type definitions
├── server.ts           # Entry point that spins up the GraphQL server
├── docker-compose.yml  # MongoDB service for local development
```

## Concepts Explored

- Object Types
- Queries & Mutations
- Cursor-based Pagination
- Node Interface (implemented for the Post schema)
- Schema-to-Schema Navigation
- MongoDB integration
- DataLoader usage to prevent N+1 query problems

## Getting Started

Install dependencies
```bash
pnpm install
```

Start MongoDB
```bash
docker-compose up -d
```

Run the GraphQL server
```bash
pnpm dev
```

## GraphQL Playground

After starting the server, GraphQL introspection and the GraphiQL interface are available at:
```bash
http://localhost:3000/graphql
```

## Purpose
This repository serves as a learning lab to explore GraphQL best practices, experiment with different architectural approaches, and validate performance strategies such as cursor-based pagination and DataLoader batching.
