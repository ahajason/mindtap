# Deep modules

Copy `example/` when adding a package, or delete it once a real package exists.

```text
src/packages/<name>/
├── index.ts        # entry point: the package Interface seam
├── client.ts       # optional additional entry point
├── lib/            # private implementation
└── tests/          # co-located tests and fixtures
```

## Entry-point boundary

A package's root files are its entry points. Code outside the package may import only those files; every subfolder is private.

## Intra-package freedom

Files inside one package may import one another freely, including implementation under `lib/`.

## Tests through entry points

Tests import packages through root entry points, just like callers. They may import fixtures from their own `tests/` folder, but never package internals.

## No cycles

Package dependencies must not form cycles. Run `npm run lint:boundaries` locally; `npm run build` runs the same check after TypeScript succeeds.

Avoid barrel files that re-export a whole subtree. Expose several small root entry points instead when the Interface needs more than one seam.
