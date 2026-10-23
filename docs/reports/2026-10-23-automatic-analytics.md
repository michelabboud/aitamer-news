# Automatic readership analytics revision

Dev mode: production. Scope: follow-up to PR314, which merged as217e2f9996f1ee41030229212dfae02696738c58 and deployed successfully in run39882481394.

## Requested behavior

Michel requested restoring automatic analytics after comparing Cloudflare network statistics with Google Analytics. The earlier interaction-only trigger omitted passive readers. Restore automatic initialization after window load, immediately for an already-complete document, or after a five-second fallback when resources delay load. First trigger wins and cancels unused work. Retain the exact production-host guard, provider URL, measurement ID, scheduling guard and deferred comment verification. This does not recover missing historical visits or bypass blockers.

## Verification record

Before this revision, all995 published URLs in the live sitemap contained the same Google Analytics measurement ID, the deferred loader and config call; no exceptions. A browser probe confirmed initialization on keyboard input. Cloudflare's24-hour network statistics and Google'sseven-day user statistics have different periods and definitions and cannot be directly compared. The revision addresses the interaction requirement, without attributing the historical discrepancy to it.

The coordinator retains command logs and all-post inspection evidence outside the public repository. Focused timing tests, full repository tests, production build and generated-policy checks will be recorded in the pull request before merge. Independent source reviews and hosted acceptance are separate gates. No improved performance claim is made.

## Assumptions and hygiene

Five seconds is a bounded fallback from loader registration, not a guaranteed telemetry delivery deadline. Browser timer throttling and analytics blocking remain possible. No new dependency, account, workflow, article, author, image or specimen changes are required. No cleanup deletion or new long-running process is authorized by this revision; existing SEO experiment evidence and local Pages server are retained for the ongoing plan. Host load and available memory are green;22GiB disk headroom is below the configured percentage floor but comfortably exceeds this bounded71MiB build's footprint.
