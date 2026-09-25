# Deep review — contact form, REST API version (2026-09-25)

- **Target:** `5ad9850` (feat/contact-form), base `7c29216` (main). Kind: deep, task grain (public endpoint handling a secret).
- **Reviewer:** separate subagent on the Strong tier (Claude Opus), read git objects only, detached worktree for `npm test`, `build`, `check:dist`, `pages functions build`, and a local workerd check. Not blind to the coordinator (in-process subagent).
- **Outcome:** no blocking findings. The design was then replaced at Michel's word by the Worker (ADR 0003), because a Pages Function cannot rate-limit; the findings below were carried into the Worker where they still applied.

| Finding | Severity | Disposition in the Worker (0.1.5) |
|---|---|---|
| Secrets cannot reach `dist/`; `check:dist` effective; workflow order correct | Info | Kept. Markers narrowed to secret names so a news story quoting an API hostname cannot block a deploy. |
| `formData()` read unbounded bodies (20 MB reproduced) | Minor | Fixed: `Content-Length` checked first, 411/413, 32 KB cap. |
| NUL and other control characters reached the subject; lax email pattern | Minor | Fixed: `\p{Cc}` and U+2028/2029 stripped; addresses with quotes, brackets or separators refused. Tests added. |
| Honeypot `autocomplete="new-password"` may invite password managers | Minor | Open question; kept for now (autofill of `off` is ignored by Chrome). See BACKLOG. |
| Night theme contrast on the Publish node and success text | Minor | Not user-visible: the night theme is not shipped (`data-theme="big-top"` is fixed). Logged in BACKLOG. |
| `list-style: none` drops list semantics in Safari | Info | Fixed: `role="list"` on the pipeline. |
| No rate limit | Info | Fixed: Workers rate-limit bindings, per IP and site-wide, fail closed. |
| `reply_to` REST spelling unverified | Info | Moot: the Worker uses the binding (`replyTo`). |
