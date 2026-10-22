# Deferred reader provider scripts

Dev mode: production. Status: implementation and local validation; independent production review and hosted checks pending. Authorized by Michel as the first script experiment from the SEO fix plan, after backups and template refresh. Tasks run back to back.

Threat sketch: protect typed reader input, mandatory comment tokens, article DOM IDs and fixed provider origins. Public article bodies must not clobber comment controls or analytics globals. SDK requests cross provider boundaries; test callbacks/submissions are mocked. No secret, service configuration, real comment or image object is modified.

1. Transfer the reviewed bounded component/layout/test patch from the synchronized test template; preserve current main and all content.
2. Integrate protected DOM names using the existing fail-closed article-body gate; run focused regressions, full tests, production build and media/output checks.
3. Independent production source review against a frozen commit. Validate findings and fix blockers before any deployment.
4. Open the upstream PR, satisfy required current-head checks and merge normally only after the production review gate; verify deployed HTML and non-interaction behavior separately.

Owner: Codex coordinator; scoped implementation/security lanes and independent reviewers report exact commits and evidence. Local validation is not hosted acceptance. No release tag or service setting change is part of this task.
