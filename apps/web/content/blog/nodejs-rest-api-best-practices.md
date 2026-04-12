---
title: "Node.js REST API Best Practices"
slug: "nodejs-rest-api-best-practices"
date: "2026-03-23"
category: "Development"
tags: ["Node.js", "REST API", "Express", "TypeScript", "Backend"]
excerpt: "Build production-grade Node.js REST APIs. Error handling, validation, authentication, rate limiting, and project structure that scales."
description: "Build production-grade Node.js REST APIs. Error handling, validation, auth, rate limiting, and scalable project structure."
---

Building a REST API that works in development is easy. Building one that survives production traffic, handles errors gracefully, and remains maintainable as it grows — that takes discipline.

## Project Structure

```
src/
  routes/
    users.ts
    courses.ts
    auth.ts
  middleware/
    auth.ts
    error-handler.ts
    rate-limiter.ts
    validator.ts
  services/
    user-service.ts
    course-service.ts
  models/
    user.ts
    course.ts
  utils/
    logger.ts
    errors.ts
  app.ts
  server.ts
```

Separate routes (HTTP layer) from services (business logic) from models (data layer). Each layer can be tested independently.

## Error Handling

The single most important thing in a production API:

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super(401, 'Authentication required');
  }
}
```

Global error handler middleware:

```typescript
// middleware/error-handler.ts
import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Unexpected errors
  logger.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Internal server error',
  });
};
```

## Input Validation

Never trust client input. Use Zod for type-safe validation:

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
});

const updateUserSchema = createUserSchema.partial();

// Middleware factory
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

// Usage
app.post('/api/users', validate(createUserSchema), createUser);
```

## Rate Limiting

Protect your API from abuse:

```typescript
import rateLimit from 'express-rate-limit';

// General rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests' },
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
```

## Authentication Pattern

JWT with refresh tokens:

```typescript
import jwt from 'jsonwebtoken';

function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

// Auth middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.userId = (payload as any).userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## Pagination

Never return unbounded lists:

```typescript
app.get('/api/courses', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
  const offset = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    db.course.findMany({ skip: offset, take: limit }),
    db.course.count(),
  ]);

  res.json({
    data: courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
```

## Health Check Endpoint

Every production API needs one:

```typescript
app.get('/health', async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`; // Check DB connection
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'unhealthy' });
  }
});
```

## Logging

Structured logging for production:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
});
```

## Checklist

- [ ] Global error handler catches all exceptions
- [ ] Input validation on every endpoint
- [ ] Rate limiting on public endpoints
- [ ] Authentication middleware
- [ ] Pagination on list endpoints
- [ ] Health check endpoint
- [ ] Structured logging
- [ ] CORS configured for your frontend
- [ ] Helmet.js for security headers
- [ ] Graceful shutdown handling

## What's Next?

Our **Node.js REST APIs** course walks through building a complete production API from scratch — authentication, database integration, testing, and deployment. The first lesson is free.
