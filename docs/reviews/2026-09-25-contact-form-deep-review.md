# Deep review — contact form (2026-09-25)

- **Target:** `f9e396a` (feat: contact form), base `63e4065`, range includes `7f68439` (docs only).
- **Kind:** deep, at task grain (security-class: public endpoint that sends email).
- **Reviewer:** separate subagent on the Strong tier (Claude Opus), read git objects only, detached worktree for tests. Not blind to the coordinator in the rule-3.3 sense (in-process subagent).
- **Validation:** B1 reproduced by the coordinator with Wrangler 4.139.0, fake token, throwaway project name.

| # | Severity | Finding | Status |
|---|---|---|---|
| B1 | Blocking | `wrangler.toml` with `pages_build_output_dir` is validated as a Pages config, and Pages rejects `[[send_email]]`: `Configuration file for Pages projects does not support "send_email"`. Any push to `main` would fail every production deploy. | CONFIRMED. Commit held off `main` on `feat/contact-form`; the sending design must change (new ADR). |
| M1 | Minor | Honeypot named `company` can be autofilled by browsers, silently dropping real notes. | Fixed: field is `desk_extra` (`HONEYPOT_FIELD`), `autocomplete="new-password"`, trips are logged. |
| M2 | Minor | Status line is un-hidden and filled in the same step, which screen readers often skip. | Fixed: both messages stay rendered; only their text changes. |
| M3 | Minor | ARCHITECTURE, ADR 0001 and CHANGELOG say `wrangler.toml` deploys the email binding. | Open until the new sending design is chosen; the ADR will be superseded, not edited. |
| I1 | Info | No-Origin requests are accepted; the origin check stops browsers, not scripts. Recipient is fixed, so worst case is inbox flooding. | Backlog: rate-limit rule or Turnstile. |
| I2–I5 | Info | No header injection; CORS correct; `send()` shape matches docs; workflow changes fine. | No action. |
