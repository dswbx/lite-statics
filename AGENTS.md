Always add tests for behavior changes. Depending on the logic, decide whether to add an unit, integration or e2e test.

Verify changes always by running all tests (`bun run test` and `bun run test:e2e`). E2E uses isolated storage at `.wrangler-e2e/state` and does not wipe dev data in `.wrangler/state`.