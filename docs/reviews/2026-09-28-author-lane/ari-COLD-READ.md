# Cold read — aitamer-news PR #46

Target `49236a32a0df`, base `1e5f4e93d57b`. Read the diff and ADR 0018 before running tests or probes.

The workflow appears to keep the privileged checkout on the base revision and installs only for a matching pull-request author id; the script then requires both author and sender ids, a narrow action and branch, one changed regular Markdown file, and frontmatter honesty at the merge base/head. The likely security boundaries to verify are: whether any PR-controlled bytes reach npm or executable paths; whether Git's name-status/mode/object handling can mistake a rename, symlink, or multiple changes for one plain file; whether js-yaml/frontmatter and Astro agree on a file's effective `kind` and name; and whether identity fallbacks or non-authors events accidentally open the lane. Also compare unchanged publisher, maintainer, and deploy behavior with the base.

These are hypotheses, not findings. No tests or probes have run yet.
