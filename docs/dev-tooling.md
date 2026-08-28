# Dev Tooling Conventions (Required)

Single source of truth for the local-only developer tooling subsystem —
the workbenches under `/dev` used to build and test things locally. None of
this ships to GitHub Pages. Applies to humans and AI agents (Claude, Copilot,
Codex).

---

## 1. The `src/dev` boundary

- `src/dev/` is the root of the local-only developer tooling application. Dev
  pages, workbenches, their private helpers, and their local API services
  belong there. Do not place new dev tools under `src/app/pages/`,
  `src/components/`, scene folders, or general runtime modules.
- `src/dev` may import production application, scene, module, asset, or
  scaffold code when a tool needs to inspect or exercise the real runtime
  implementation.
- **Production/runtime code must never import from `src/dev`**, except the
  single development-gated mount in `src/app/App.jsx`
  (`import.meta.env.DEV ? lazy(() => import('@dev/DevApp')) : null`). This is
  enforced by ESLint (`no-restricted-imports` blocks `@dev`, `@dev/*`,
  `**/dev/**` for every `src/**/*` file except `src/dev/**/*` and
  `src/app/App.jsx`) — don't weaken or add exceptions to that override.
- Never move dev-only code into `src/hooks`, `src/utils`, `src/modules`, or
  other production namespaces merely because multiple dev tools use it.
  Shared dev-only code stays under `src/dev`.
- Dev tooling must remain **absent from production bundles**, not merely
  hidden from navigation. Preserve the `import.meta.env.DEV` gate in
  `src/app/App.jsx` and verify production exclusion after changing this
  boundary (see §5's validation checklist).

## 2. Dev tool organization

- Each independent tool lives under `src/dev/tools/<tool>/` (current tools:
  `cataloggr`, `colors`, `gltfjsx`, `iconography`, `loaderPatterns`,
  `rorschach`).
- Every registered tool owns a colocated `todo.md` using the same canonical
  TODO shape as scenes. Cataloggr discovers and edits these files alongside
  scene TODOs so tool features and bugs remain attached to their owner.
- A tool owns its page entry, styles, components, hooks, utilities, and other
  implementation details.
- **Tools must not import another tool's internals.** This is ESLint-enforced
  (see §4) — cross-tool imports fail lint, not just review.
- Code genuinely shared by multiple dev tools belongs under `src/dev/shell`
  when it's application chrome/UI (see `DevLandingPage.jsx`,
  `DevPageHeaderBar.jsx`, `DevPageTitle.jsx`, `DevTooltip.jsx`), or a clearly
  named shared folder under `src/dev` when it's non-shell dev-only behavior.
- Keep a tool's route page at the tool root. Use `components/`, `hooks/`, and
  `utils/` subfolders only when the tool is large enough to benefit from them.
- Do not create barrels unless an actual external consumer benefits from the
  public boundary.

## 3. Dev page registration

- Every routable tool owns a colocated `devPage.config.js`, exporting `slug`,
  `label`, `description`, `order`, and a lazy `Component`. `aliases` is
  optional.
- `src/dev/devPageRegistry.js` discovers every config via
  `import.meta.glob('./tools/*/devPage.config.js', { eager: true })` and
  throws on a missing required field or a duplicate `slug`/alias.
- **Never hand-register individual dev pages** in `src/app/App.jsx`,
  `src/dev/DevApp.jsx`, or `src/dev/shell/DevLandingPage.jsx`. The registry is
  the single source of truth for routing and landing-page navigation.
- Route slugs and aliases must be unique. Do not weaken or bypass the
  registry's collision validation.
- Keep page components lazily imported (`Component: () => import(...)`) so
  adding a tool doesn't eagerly load its workbench dependencies.

## 4. Cross-tool import enforcement

- `.eslintrc.json` has one `no-restricted-imports` override per tool folder
  (`files: ["src/dev/tools/<tool>/**/*.{js,jsx}"]`), each blocking import
  specifiers matching every _other_ tool's folder name (`**/<otherTool>/**`).
  This catches both relative imports (`../gltfjsx/...`) and `@dev`-aliased
  ones (`@dev/tools/gltfjsx/...`).
- **When you add a new tool folder under `src/dev/tools/`, add a matching
  override block to `.eslintrc.json`** (its own block excluding itself, and
  add its name to every existing tool's block). This is the one place dev-tool
  registration is still hand-maintained rather than glob-discovered — the
  registry (§3) doesn't need it, but the lint boundary does.

## 5. Local dev server code

- Local-only Vite middleware and services live under
  `src/dev/server/<tool>/`, beside the dev subsystem rather than under a
  generic production `src/server` namespace.
- Each server-backed tool owns its plugin and service implementation (e.g.
  `src/dev/server/rorschach/plugin.js` + `jobService.js`).
- Register server plugins through `src/dev/server/devServerPlugins.js`
  (`vite.config.js` imports that one function); do not grow an import/plugin
  list directly in `vite.config.js`.
- Dev server plugins must only be installed for Vite serve mode
  (`vite.config.js` does `...(!isBuild ? devServerPlugins() : [])`) and must
  never run in production builds.
- Browser dev tools talk to these services through `/dev-api/*` (e.g.
  `/dev-api/rorschach/jobs`, `/dev-api/gltfjsx/convert`). Keep server-only
  Node imports out of browser-facing dev modules.

## 6. Integration and enforcement

- `src/app/App.jsx` owns exactly one `/dev/*` integration point, guarded by
  `import.meta.env.DEV` and dynamically importing `@dev/DevApp`.
- `vite.config.js`, `jsconfig.json`, and `.eslintrc.json` all share the `@dev`
  alias (`src/dev`) — keep them in sync if it ever moves.
- When changing dev registration or boundaries, validate:
  1. focused ESLint for `src/dev`, `src/app/App.jsx`, and `vite.config.js`;
  2. direct loading of `/dev` and affected tool routes;
  3. affected `/dev-api/*` endpoints;
  4. a production build;
  5. absence of dev-tool-specific strings/chunks from the production output.
- The human owns the dev server. Do not start, stop, or restart it; use the
  existing server for browser validation.
