---
title: "Building REST APIs with Node.js"
description: "Learn how to build production-ready REST APIs with Node.js and Express — routing, middleware, error handling, and best practices."
date: "2026-02-24"
author: "Luca Berton"
category: "Development"
tags: ["Node.js", "REST API", "Backend Development"]
---

## Why Node.js for APIs?

Node.js is one of the most popular choices for building APIs, and for good reason:

- **JavaScript everywhere** — same language on frontend and backend
- **Non-blocking I/O** — handles thousands of concurrent connections efficiently
- **Massive ecosystem** — npm has packages for virtually everything
- **Fast development** — get from idea to working API in minutes

## Setting Up Your First API

Start with Express, the most popular Node.js web framework:

```bash
mkdir my-api && cd my-api
npm init -y
npm install express
```

Create `server.js`:

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// In-memory data store
let todos = [
  { id: 1, title: 'Learn Node.js', completed: false },
  { id: 2, title: 'Build an API', completed: false },
];

// GET all todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// GET single todo
app.get('/api/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === parseInt(req.params.id));
  if (!todo) return res.status(404).json({ error: 'Not found' });
  res.json(todo);
});

// POST new todo
app.post('/api/todos', (req, res) => {
  const todo = {
    id: todos.length + 1,
    title: req.body.title,
    completed: false,
  };
  todos.push(todo);
  res.status(201).json(todo);
});

// DELETE todo
app.delete('/api/todos/:id', (req, res) => {
  todos = todos.filter(t => t.id !== parseInt(req.params.id));
  res.status(204).send();
});

app.listen(3000, () => console.log('API running on port 3000'));
```

## REST API Best Practices

### Use Proper HTTP Methods

- **GET** — Read data (never modify)
- **POST** — Create new resources
- **PUT/PATCH** — Update existing resources
- **DELETE** — Remove resources

### Use Meaningful Status Codes

- **200** — Success
- **201** — Created
- **204** — No Content (successful delete)
- **400** — Bad Request (client error)
- **404** — Not Found
- **500** — Server Error

### Add Error Handling

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});
```

### Validate Input

Never trust client data. Use a validation library like `zod` or `joi`:

```javascript
const { z } = require('zod');

const todoSchema = z.object({
  title: z.string().min(1).max(200),
  completed: z.boolean().optional(),
});
```

## Beyond the Basics

Once you have the fundamentals, explore:

- **Database integration** — PostgreSQL, MongoDB, or Prisma ORM
- **Authentication** — JWT tokens, OAuth, or session-based auth
- **Rate limiting** — Protect your API from abuse
- **API documentation** — OpenAPI/Swagger for auto-generated docs
- **Testing** — Unit tests with Jest, integration tests with Supertest

## Hands-On Practice

Theory only gets you so far. Our [Node.js REST APIs course](/courses/nodejs-rest-apis) lets you build real APIs in interactive lab environments — no local setup needed.
