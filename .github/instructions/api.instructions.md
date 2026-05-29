---
description: "OpenAPI client generation rules: do not manually edit generated files, run openapi-ts after spec changes, use generated SDK for all API calls. Use when working on API integration, the OpenAPI spec, or the generated client files."
applyTo: "src/api/**, api/**"
---

# OpenAPI Specification

The OpenAPI specification for the backend API is located in `api/openapi/api/spec.yaml`. This specification defines the available endpoints, request and response formats, authentication methods, and other relevant details for interacting with the backend server.

## Generated Client — DO NOT MANUALLY EDIT

The TypeScript client is generated from the OpenAPI specification:
- `src/api/types.gen.ts` — Generated types
- `src/api/sdk.gen.ts` — Generated SDK functions
- `src/api/index.ts` — Re-exports all SDK

**Do not manually edit any `*.gen.ts` file.** All changes must go through the OpenAPI spec.

## Regenerating the Client

Run after any changes to `api/openapi/api/spec.yaml`:

```bash
npm run openapi-ts
```

## Usage

All API interactions in the frontend **must** use the generated TypeScript client to ensure type safety and consistency with the backend API specification. This catches potential issues at compile time and provides a clear contract for frontend–backend communication.

```typescript
// Correct: use generated SDK
import { getAgents } from './api/index.js';
const agents = await getAgents();

// Wrong: raw fetch
const agents = await fetch('/v1/agents').then(r => r.json());
```
