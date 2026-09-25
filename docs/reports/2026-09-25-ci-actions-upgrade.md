# CI actions and Node upgrade — vetting (2026-09-25)

Every GitHub Action in `.github/workflows/` moved to its latest stable major, and CI moved from Node 22 to Node 24. Versions were read from each project's GitHub releases (`gh api repos/<repo>/releases/latest`) on 2026-09-25; advisories from `gh api repos/<repo>/security-advisories` (all returned 0).

| Action | Was | Now | Breaking changes read | Effect here |
|---|---|---|---|---|
| `actions/checkout` | v4 | v7 (v7.0.1, 2026-07-20) | v5 moves to the Node 24 runtime (runner ≥ 2.327.1); v6/v7 dependency and doc updates | None; GitHub-hosted runners |
| `actions/setup-node` | v4 | v7 (v7.0.0, 2026-07-14) | v5 turns on npm caching automatically when `package.json` has `packageManager`; v7 adds cache outputs and removes a dummy `NODE_AUTH_TOKEN` | None; no `packageManager` field, no registry auth |
| `actions/cache` | v4 | v6 (v6.1.0, 2026-06-26) | v5 Node 24 runtime; v6 migrates to ESM | None |
| `actions/upload-pages-artifact` | v3 | v5 (v5.0.0, 2026-04-10) | v4 stops uploading dotfiles; v5 adds `include-hidden-files` | None; `dist/` has no dotfiles (checked) |
| `actions/deploy-pages` | v4 | v5 (v5.0.1, 2026-09-01) | Dependency updates | None |
| `cloudflare/wrangler-action` | v3 | v4.1.3 (2026-09-24), **pinned to commit `953926a2e2182532811c01a25e53647d93bf07c0`** | v4 installs Wrangler 4 by default (v3 installed Wrangler 3) | Deploy now runs Wrangler 4, pinned to `wranglerVersion: "4.139.0"` |

## Checks run

- **Wrangler 4 against `main`'s `wrangler.toml`:** `wrangler@4.139.0 pages deploy dist` with a fake token and a throwaway project name prints "Ignoring configuration file for now, and proceeding with project deploy" and stops at authentication. The old `[assets]` file does not block the deploy.
- **Node 22 and 24:** `npm test` passes on Node 22.23.3 and 24.20.0; the build passes on 24.20.0.

## Why pin one action to a commit

`wrangler-action` is the only third-party action, and it receives `CLOUDFLARE_API_TOKEN`. A tag can be moved by whoever controls the repository; a commit cannot. The first-party `actions/*` stay on major tags, which is GitHub's own recommendation for them. To update, resolve the new tag to its commit (`gh api repos/cloudflare/wrangler-action/git/ref/tags/<tag>`, then dereference the annotated tag) and update the comment.

## Alternatives considered

- Pin every action by commit: stronger, but every routine update becomes a manual SHA lookup. Not worth it for GitHub's own actions yet; revisit with Dependabot.
- Stay on Node 22: it still works (`engines` keeps `>=22.12.0`), but Michel asked for Node 24, and it is the current LTS line with type stripping on by default.
