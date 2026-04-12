---
title: "TypeScript Express Tutorial 2026"
slug: "typescript-express-tutorial"
date: "2026-04-11"
category: "Development"
tags: ["TypeScript", "Express", "Node.js", "REST API", "Backend"]
excerpt: "Build a production REST API with TypeScript and Express from scratch. Complete tutorial covering setup, routing, middleware, and deployment."
description: "Build a production REST API with TypeScript and Express. Complete tutorial covering project setup, routing, middleware, and deployment."
---

TypeScript and Express is the most popular combination for building Node.js backend APIs. This tutorial takes you from zero to a production-ready REST API.

## Why TypeScript with Express?

Plain JavaScript Express apps break silently. TypeScript catches errors at compile time:

- **Type safety**: Catch bugs before they reach production
- **Better IDE support**: Autocomplete for routes, middleware, and request/response objects
- **Self-documenting**: Types serve as living documentation
- **Refactor confidently**: Rename a field and TypeScript shows every place that needs updating

## Project Setup

Initialize your project:

```bash
mkdir my-api && cd my-api
npm init -y
npm install express
npm install -D typescript @types/express @types/node ts-node nodemon
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Basic Express Server

Create `src/index.ts`:

```typescript
import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

Run the dev server:

```bash
npm run dev
```

## Typed Route Handlers

Define your data types:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const users: User[] = [];
```

Create typed CRUD routes:

```typescript
// GET all users
app.get("/api/users", (req: Request, res: Response) => {
  res.json(users);
});

// GET user by ID
app.get("/api/users/:id", (req: Request, res: Response) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

// POST create user
app.post("/api/users", (req: Request, res: Response) => {
  const { name, email } = req.body as { name: string; email: string };
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date(),
  };
  users.push(user);
  res.status(201).json(user);
});
```

## Middleware

Error handling middleware with proper types:

```typescript
import { NextFunction } from "express";

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development" ? err.message : undefined,
  });
}

app.use(errorHandler);
```

Request validation middleware:

```typescript
function validateBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = requiredFields.filter(
      (field) => !(field in req.body)
    );
    if (missing.length > 0) {
      res
        .status(400)
        .json({ error: `Missing fields: ${missing.join(", ")}` });
      return;
    }
    next();
  };
}

app.post("/api/users", validateBody(["name", "email"]), createUser);
```

## Project Structure

Organize larger projects into modules:

```
src/
  index.ts          # App entry point
  routes/
    users.ts        # User routes
    products.ts     # Product routes
  middleware/
    auth.ts         # Authentication
    validation.ts   # Request validation
  types/
    index.ts        # Shared type definitions
  services/
    user.service.ts # Business logic
```

## Router Modules

Separate routes into files with `express.Router()`:

```typescript
// src/routes/users.ts
import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ users: [] });
});

router.post("/", (req: Request, res: Response) => {
  // Create user logic
  res.status(201).json({ message: "Created" });
});

export default router;
```

Mount in your main app:

```typescript
import userRoutes from "./routes/users";
app.use("/api/users", userRoutes);
```

## Build and Deploy

```bash
npm run build    # Compiles to dist/
npm start        # Runs compiled JS
```

For Docker:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## What's Next?

Our **Node.js REST APIs** course goes deeper — database integration with Prisma, JWT authentication, testing, and production deployment patterns. The first lesson is free.
