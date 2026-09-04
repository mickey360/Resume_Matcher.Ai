# Architecture

## Request flow

```text
Next.js
  |
  | POST /api/analyze
  v
FastAPI
  |
  +--> file validation
  |
  +--> PDF/DOCX extraction
  |
  +--> skill detection
  |
  +--> keyword overlap
  |
  +--> experience/education signals
  |
  +--> Sentence Transformer embeddings
  |       |
  |       +--> TF-IDF fallback
  |
  v
JSON result
  |
  v
Dashboard
```

## Why no database?

This portfolio version intentionally uses browser localStorage for history. It avoids credentials, schema setup, and database hosting while keeping the application deployable for free.

If the project later becomes a multi-user SaaS, add PostgreSQL and authentication as a separate phase.

