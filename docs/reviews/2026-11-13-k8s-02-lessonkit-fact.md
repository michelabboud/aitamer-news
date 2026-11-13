# Fact gate: Kubernetes from Zero, Lesson 2 lesson kit (cheat sheet, homework, answer key)

- Gate: Fact Source. Checked 13 Nov 2026, about 22:15–22:30 (Asia/Jerusalem, UTC+2).
- Lesson: https://aitamer.news/posts/k8s-from-zero-02-architecture-tour/ (live, published 13 Nov 2026, 09:00 UTC). Local source is `/workspace/lessonkit/k8s-02/lesson-source.md`. The `/workspace/aitamer-news` clone is stale (HEAD 429d235, 5 Oct) and does not have the post.
- Kit source: `/workspace/lessonkit/handoff/src/lessonkits/k8s-02.json` (identical to `buildroot/`). Template: `handoff/scripts/lessonkit/templates/cheatsheet.html`.
- PDFs: `/workspace/lessonkit/handoff/public/lessonkits/aitamer-k8s-02-{cheatsheet,homework,answer-key}.pdf`.
- **Moving target.** The PDFs and the JSON were rebuilt three times while I was checking (22:08, 22:16 and 22:17). The current build has a **"PREVIEW, NOT FINAL"** stamp on every page. The README says "never commit these". I gated the **content** of the latest build and JSON. Last hashes seen: cheatsheet 0b6e9740…, homework 3fa328c3…, answer-key e5db7d0b…, JSON eef2f2e6….

## Verdict: **FIX** (3 required fixes F1–F3; no HOLD)

Art Desk's flagged spots 1–4 are **CLEAR**. Two items need changes: the add-ons row in the component table (F1) and one command note (F3). The track number on every page also does not match the live series page (F2). The final build must also drop the PREVIEW stamp before anything ships (process note, not a fact fix).

## Rulings on Art Desk's flagged spots

| # | Spot | Ruling | Basis |
|---|---|---|---|
| 1 | Answer 18: "The kubelet starts the scheduler again, the scheduler catches up and binds them, and all four Pods become `Running`." (JSON L358) | **CLEAR as written.** The kit does not say "restarts". It says "starts … again", which is correct. The lesson defines static Pods as files the kubelet reads from the folder (step 3), says moving the file out "makes the kubelet stop it" (step 11), and says "Put the file back and the scheduler catches up". The lesson's run shows all four Pods `Running` afterwards. Upstream: the kubelet "periodically scans the configured directory … and creates/deletes static Pods as YAML/JSON files appear/disappear there." Optional, sharper wording: "The kubelet sees the file again and starts the scheduler's static Pod; the scheduler catches up and binds them, and all four Pods become `Running`." | https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/ (Dynamic addition and removal of static pods) |
| 2 | Answer 12: "…(you also see an `apiserver-...` lease)" (JSON L322) | **CLEAR.** The lesson's step 7 output shows `apiserver-uwnlkcfd6lspuhs4nbdjmcuiy4`, `kube-controller-manager` and `kube-scheduler`. Upstream Leases page: "Starting in Kubernetes v1.26, each kube-apiserver uses the Lease API to publish its identity… with the name apiserver-<sha256-hash>" in kube-system (feature APIServerIdentity, Beta and on by default). "Two components hold a Lease" is right for leader election. The answer's reason matches the lesson word for word. Optional: "(you also see an `apiserver-...` lease: the API server's identity lease)". | https://kubernetes.io/docs/concepts/architecture/leases/ |
| 3 | Answer 8: `containerd://2.3.4` (JSON L302) | **CLEAR.** The live lesson shows exactly `containerd://2.3.4` in the `CONTAINER-RUNTIME` column. The kit already hedges it: "It shows containerd; the lesson's run showed `containerd://2.3.4`." The homework intro also says names and ports will differ. | Lesson step 1 |
| 4 | Cheat sheet kube-proxy: "Usually every node. In kind: a Pod in `kube-system`." (JSON L87) | **CLEAR.** Lesson recap: "Every node runs a kubelet and a container runtime …, and usually kube-proxy". Step 2 output shows `kube-proxy-t6cgl` in kube-system. Upstream components page: "kube-proxy (optional) Maintains network rules on nodes to implement Services". The role cell already says "Some network plugins replace it". Not adding "DaemonSet" is fine, because the lesson hasn't taught the term yet. | https://kubernetes.io/docs/concepts/overview/components/ ; https://kind.sigs.k8s.io/ |
| 5 | Short command notes on the cheat sheet (JSON L126–248) | **CLEAR except one** (see F3 for `api-resources`). All 22 commands match the lesson word for word and are valid syntax. Notes checked: `CONTAINER-RUNTIME` column ✓. Static Pod names end in the node name ✓ (lesson step 2; upstream mirror Pods get the node name as a suffix). The static Pod files ✓. System services on the node ✓. Containers as the runtime sees them ✓. "API server health; also `/livez`" ✓ (lesson cheat sheet). "Who leads the scheduler and controllers" ✓ (lesson's own note). Second terminal, start it first ✓. Each API request and its response code ✓. The jsonpath notes ✓. "kubeadm's default certificate paths" ✓ (lesson step 10). "The kubelet stops it" ✓ (step 11). "New Pods stay `Pending`" ✓ (in the scheduler-off group). "The scheduler catches up" ✓. "Read `Conditions`" ✓. "`-v=8` adds request contents" ✓ (kubectl quick reference). "On a real node, when it turns `NotReady`" ✓. | Lesson; https://kubernetes.io/docs/reference/kubectl/quick-reference/ |
| 6 | Component table spot-check | **CLEAR except the add-ons "where" cell (F1).** The 4+1 control-plane split, the "optional" labels on cloud-controller-manager and kube-proxy, the kubelet, the CRI being gRPC, and the static Pod names in kind all match the lesson and the upstream components page. Upstream: cloud-controller-manager is absent "in a learning environment inside your own PC". | https://kubernetes.io/docs/concepts/overview/components/ ; https://kubernetes.io/docs/concepts/architecture/cri/ |

## What checked out

| Item | Result | Source |
|---|---|---|
| Test line "kind v0.33.0, Kubernetes v1.37.0 node, kubectl v1.37.2, 10 Nov 2026" | Matches the lesson's `wildness.verified` | lesson frontmatter |
| Homework Q1–22 vs answer key 1–22 | Numbering and question text match on every item | PDF text diff |
| Answers 1–7, 9–11, 13–17, 19–22 | Each traces to lesson text or output: 47 s NotReady, `Kubelet stopped posting node status.`, `Node: <none>` with no events, the 404→201 sequence, the event FROM order, `ReplicaSet/web-<hash>`, `/registry/deployments/default/web`, the two connection-refused causes | live lesson |
| "Life of one kubectl apply", steps 1–6 and ownership box | Match the lesson's six steps and events | live lesson |
| Lesson title, still "part 2" | Quoted as published (JSON `$titleNote`) | live lesson |
| Next-lesson teaser | Now timeless ("Next: Lesson 3, your local lab…"), with no "Coming tomorrow". Lesson 3 is not live, so it links to the series page. | https://aitamer.news/series/k8s-from-zero/ |
| Links (text and /URI annotations: post, homepage and series page, each with UTM for cheatsheet, homework and answer-key) | All return HTTP 200 | curl -sIL |
| Upstream doc URLs used | 200 | curl |

## Required fixes

**F1. Cheat sheet p1, component table, "Add-ons" row, WHERE IT RUNS column**
- Current: "Ordinary Pods, in `kube-system`."
- Problem: kind's storage provisioner (`local-path-provisioner`) runs in the **`local-path-storage`** namespace, not kube-system. The kit says "in kube-system" for all three add-ons as if that were always true. The lesson only says add-ons "run as ordinary Pods", and its kube-system listing shows CoreDNS and kindnet but no provisioner.
- Replacement: **"Ordinary Pods. In kind, CoreDNS and kindnet are in `kube-system`."**
- Source: `handoff/src/lessonkits/k8s-02.json` L92 (the `"where"` of the "Add-ons" entry, right after kube-proxy at L85–88).
- Upstream: kind node-image manifest `pkg/build/nodeimage/const_storage.go`, where `Deployment local-path-provisioner` has `namespace: local-path-storage`: https://github.com/kubernetes-sigs/kind/blob/main/pkg/build/nodeimage/const_storage.go

**F2. Every page of all three PDFs (header, cover kicker, footer): track position**
- Current: "KUBERNETES FROM ZERO · FOUNDATIONS **1** OF 12 · LESSON 2" (and "Foundations 1 of 12 · Lesson 2" in the footer).
- Problem: the live series page lists Lesson 1 as "Foundations 1 of 12" and **Lesson 2 as "Foundations 2 of 12"**.
- Replacement: **"KUBERNETES FROM ZERO · FOUNDATIONS 2 OF 12 · LESSON 2"**
- Source: `handoff/src/lessonkits/k8s-02.json` L10, `"track": { "number": 1 }` → `2`. The JSON comment says "Values as given by EIC (2026-11-13)", so **EIC should confirm**. The live site says 2.
- Upstream: https://aitamer.news/series/k8s-from-zero/

**F3. Cheat sheet p2, "Tour the cluster" group: `api-resources` note**
- Current: `kubectl api-resources | head -6` with the note "all resource types, short names, API groups".
- Problem: piping to `head -6` prints the header and only the first **5** resource types, not all of them. The lesson ran 71.
- Replacement (pick one):
  - (a) Keep the command, and change the note to **"first five resource types; drop `| head -6` to see all"**.
  - (b) Use the lesson's cheat-sheet form, command `kubectl api-resources`, with the note **"all resource types, short names, API groups"**. This is verbatim from the lesson cheat sheet (live lesson, cheat-sheet table "All resource types").
- Source: `handoff/src/lessonkits/k8s-02.json` L165–166.
- Upstream: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_api-resources/


## Ship gate (process, not a fact fix)
- Rebuild without `--preview`. The current PDFs say "PREVIEW, NOT FINAL" on every page. Re-send the final build and hashes to Fact for a quick confirm that only F1–F3 changed.

## Soft notes (not blocking)
- S1: Copying the long commands from the PDF breaks them. The `custom-columns=` event watch wraps mid-flag ("custom-" / "columns=…"), and the jsonpath commands wrap inside the quotes. Pasting from the PDF will fail or change the output. Layout is Art's call: consider no-wrap with smaller type, or a "copy from the lesson" pointer.
- S2: The template hint says "Key commands — verbatim from the lesson" (`templates/cheatsheet.html` L22). The commands are verbatim, but the notes are Art's own wording. Fine as is; it could read "commands verbatim from the lesson".
- S3: Answer 18 and Answer 12 have optional sharper wording (above). Not required.
- S4: The kit says "Lesson 1/2/3" while the post body says "part 1/2/3". House labelling per the README, not a fact issue.

## HOLD reasons
None.

---

## Re-check (final build): **CLEAR**

Checked 13 Nov 2026, about 22:25–22:35 (Asia/Jerusalem, UTC+2), read-only. Files: `/workspace/lessonkit/handoff/public/lessonkits/`.

| Check | Result |
|---|---|
| 1. Hashes and pages | cheatsheet `c0e5f8eb9f29…` 2 pp. homework `5d5ee35322c9…` 3 pp. answer-key `81e1d0bf8613…` 3 pp. All three match Art Desk's prefixes, and they did not change during the check. JSON `4fa8a2066b39…`, identical in `handoff/` and `buildroot/`. |
| 1. No PREVIEW | `pdftotext` finds 0 hits for "preview" in all three PDFs. The previews in `k8s-02/out/previews/` (rebuilt 22:22) show no stamp. |
| 2. F1 | Add-ons, WHERE IT RUNS: "Ordinary Pods. In kind, CoreDNS and kindnet are in `kube-system`." ✓ |
| 3. F2 | "FOUNDATIONS 2 OF 12 · LESSON 2" on every header and cover, and "Foundations 2 of 12 · Lesson 2" in every footer: cheatsheet 3+2, homework 4+3, answer key 4+3. No "1 of 12" anywhere. Matches https://aitamer.news/series/k8s-from-zero/ ✓ |
| 4. F3 | Cheat sheet p2: `kubectl api-resources`, with the note "All resource types; shows short names and API groups". ✓ Matches the lesson's cheat-sheet row. |
| 5. Wrapped commands | I extracted all 24 cheat-sheet commands from the PDF text and joined the ` \` continuations. All 24 match the lesson's commands exactly: `lesson-source.md`, the same text as the live post, with the lesson's own etcdctl `\` lines joined. Quote parity is balanced in every command, and no break falls inside a quote: the jsonpath and `custom-columns` arguments each sit whole on one continuation line. |
| 6. Content diff vs cleared build (22:16) | Homework and answer key: word-level diff shows only 1→2 in the track line, the PREVIEW marks removed, re-joined inline code (`k8s-from-zero-control-plane` no longer split), and the footer moved. No wording changes. Cheat sheet: word-multiset diff shows only F1, F3, the hint, track 1→2, the PREVIEW removal, and re-wrapped commands and static-Pod names. The "Follow one apply" group moved to full width at the end. No other wording or fact changed. |
| 6. New hint "commands verbatim from the lesson" | **True.** All 24 commands are verbatim (row 5). The hint now covers only the commands, not Art's notes. |
| 7. Numbering | Homework questions 1–22 and answers 1–22 line up. |
| 7. Links | All 9 unique /URI targets return 200: post, homepage and series page, each × the 3 UTM variants. |

**No remaining fixes.** Soft only: the cheat sheet p2 heading reads "Key commands" followed by the hint "commands verbatim from the lesson", so "commands" appears twice in a row. That is cosmetic and Art's call. Cleared for handoff to Site Platform. Fact does not publish.
