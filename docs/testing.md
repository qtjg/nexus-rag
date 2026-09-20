# Testing nexus-rag

Run the suite from the repository root. See `package.json` for the exact
script names.

## Layout

The tests cover the RAG pipeline: document ingestion, embedding, retrieval,
and the client SDK.

## Conventions

- Tests that need an embedding model should skip when the model endpoint is
  unreachable rather than fail.
- Integration tests are tagged so they can be excluded from the fast path.
- Test files live under `__tests__/` (the `tests/` directory is gitignored as
  a build-output path).
