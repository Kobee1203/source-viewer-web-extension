# Testing Guidelines & Conventions

This document outlines testing practices, architectural layers, mock lifecycle management, and conventions for unit and integration tests.

---

## 1. Test Architecture & Hierarchy

The test suite is structured into three distinct tiers:

| Tier                  | Directory                              | Runner               | Characteristics                                                                                                                                                                  |
| :-------------------- | :------------------------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit Tests**        | `tests/utils/`<br>`tests/composables/` | Vitest (`happy-dom`) | Isolated testing of pure utilities, composables, search providers, and source strategies. Runs in milliseconds.                                                                  |
| **Integration Tests** | `tests/entrypoints/`                   | Vitest (`happy-dom`) | Tests cross-module orchestration (e.g. background service worker event listeners, message routing, reentrancy guards, tab creation) without spinning up a full browser instance. |
| **E2E Tests**         | `e2e/`                                 | Playwright           | Full end-to-end browser tests running with the built extension unpacked in Chromium.                                                                                             |

---

## 2. Vitest Mock Lifecycle & Hygiene

Global mock resetting is centrally configured in `vitest.config.ts`:

```ts
clearMocks: true,
restoreMocks: true,
unstubGlobals: true,
unstubEnvs: true,
pool: 'vmThreads',
```

- **No manual `vi.clearAllMocks()`**: Because `clearMocks: true` is enabled globally, Vitest automatically clears mock call histories and instances between each test. **Never** manually call `vi.clearAllMocks()` in `beforeEach` or `afterEach` hooks.
- **Mock setup single point of truth**: Shared browser API mocks live in `tests/setup.ts` (`mockBrowser`). When a new WebExtension API or listener is consumed (e.g. `browser.action`, `browser.commands`, `browser.tabs.onUpdated`), add the corresponding mock to `mockBrowser` in `tests/setup.ts` rather than creating ad-hoc local mocks.
- **Virtual module mocks**: WXT virtual modules (such as `#imports` or `#i18n`) are aliased in `vitest.config.ts` (pointing to `tests/helpers/wxtImports.ts` and `.wxt/i18n/index.ts`).

---

## 3. Asynchronous Testing & Floating Promises

- **No floating promises (`void` operator)**: In test files, TypeScript ESLint strictly enforces `@typescript-eslint/no-floating-promises`. When triggering background event handlers that return `void | Promise<void>` in a fire-and-forget manner, explicitly prefix the call with `void` (e.g. `void onActionClick(tab)`).
- **Deterministic polling with `vi.waitFor`**: Avoid brittle `setTimeout` delays when waiting for asynchronous tasks to settle. Always use Vitest's `await vi.waitFor(() => { expect(...); })` to assert on asynchronous side effects (such as `browser.tabs.create` or `browser.tabs.update`).
- **Support multiple message listeners**: WebExtension messaging APIs (`browser.runtime.onMessage`) support multiple simultaneous listeners. When mocking `executeScript` or message dispatch in integration tests, store listeners in an array and notify all relevant listeners (or filter by matching `tab.id`), rather than overwriting a single listener reference.

---

## 4. Red-to-Green Workflow for Bug Fixes & Regressions

When resolving concurrency bugs, race conditions, or logic defects:

1. **Phase 1 (Red - Prove the Defect)**: Write an integration or unit test reproducing the exact failure scenario before touching production code. Run the test and verify that it fails with the expected symptom (e.g., duplicate calls to `tabs.create`).
2. **Phase 2 (Green - Apply the Fix)**: Implement the narrowest responsible fix and verify the test passes.
3. **Phase 3 (Boundary Verification)**: Complement with tests covering boundary conditions (e.g. multi-tab concurrency, expired cooldown windows, error recovery).
