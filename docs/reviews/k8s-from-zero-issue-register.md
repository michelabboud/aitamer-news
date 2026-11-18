# Kubernetes from Zero issue register

Cumulative register for Kubernetes from Zero. IDs stay stable. Status here is the lesson-review status from [the lesson review standard](../guides/lesson-review.md). **OPEN means the finding is not Fact-cleared and no fix is in the tree.** A row stays OPEN until a later review marks it against a merged fix PR. Nothing in this file has been applied to a lesson.

Seeded 2026-11-18 by static inspection of `main` at `6ae56795e7cc78669195d5f21a27c188857d902a`. Commands in the lessons were not run. Lab reproducibility for this seed is **Not verified**.

The L6 date below is the committed `pubDate`, not a local-time conversion. The site shows that instant in UTC (`src/lib/date-format.ts`).

| ID | Lesson | Priority | Effort | Summary | Status | Source review | Fix PR |
|---|---|---|---|---|---|---|---|
| K8S-L02-001 | 2 | P1 | M | Verdict, the "one rule" paragraph, the recap, and the homework answer say every component talks only to the API server. The same lesson documents the kubelet calling the runtime over CRI, and the API server calls the kubelet for logs, attach, and port-forward. | OPEN | 2026-11-18 seed | none |
| K8S-L02-002 | 2 | P1 | S | The ownership command and the cheat-sheet Pod YAML use `web-69977c9c79-sv68d`. The sample event log in the same lesson names `web-69977c9c79-pwjwm` and `web-69977c9c79-vfjt9`. Pasting the printed command looks up a Pod the sample never created. | OPEN | 2026-11-18 seed | none |
| K8S-L02-003 | 2 | P2 | S | "Every step leaves an event" is contradicted by the scheduler-off lab, where a new Pod has no events. | OPEN | 2026-11-18 seed | none |
| K8S-L02-004 | 2 | P1 | S | The etcd exec and the scheduler-off lab have no safety banner. The scheduler lab stops scheduling by moving the static Pod manifest. The etcd lab execs into etcd with the server key. The command shown is a read (`etcdctl get`). | OPEN | 2026-11-18 seed | none |
| K8S-L01-001 | 1 | P2 | S | The opening promise says the reader watched the cluster replace "a container you killed". The lab runs `kubectl delete pod`, which deletes a Pod. | OPEN | 2026-11-18 seed | none |
| K8S-L01-002 | 1, 2, 3 | P2 | M | Lesson 1 gives the install commands and starts the cluster. Lesson 2 requires that cluster. Lesson 3 is the install lesson. Lesson 1 already calls its steps a short version and points at part 3. | OPEN | 2026-11-18 seed | none |
| K8S-L04-001 | 4, 5 | P2 | S | Lesson 4 says part 5 is "coming tomorrow". Lesson 5's `pubDate` is `2026-11-15T22:00:00Z`, the same UTC day as lesson 4 (`2026-11-15T09:00:00Z`). Found while checking the date seed. | OPEN | 2026-11-18 seed | none |
| K8S-L05-001 | 5, 6 | P2 | S | Lesson 5 says part 6 is "coming tomorrow". Lesson 6's `pubDate` is `2026-11-17T22:00:00Z` (Nov 17, 2026, 22:00 UTC), two days after lesson 5 (`2026-11-15T22:00:00Z`). There is no lesson on 2026-11-16. | OPEN | 2026-11-18 seed | none |
| K8S-L05-002 | 1-8 | P3 | S | Cadence note. Lessons 1-4 are `09:00Z` on consecutive days (12-15 Nov 2026). From lesson 5 the clock is `22:00Z`. Lessons 4 and 5 share 15 Nov. 16 Nov has no lesson. Lessons 6-8 are 17, 18, and 19 Nov at `22:00Z`. | OPEN | 2026-11-18 seed | none |

## Proposed corrections

These are proposals. They are not edits to the lessons or the kits.

### K8S-L02-001

Locations:

- `src/content/posts/k8s-from-zero-02-architecture-tour.md` verdict: "Every Kubernetes component talks to the API server and nothing else."
- Same file, "Nodes are where your containers run": "components never call each other. Each one talks only to the API server."
- Same file, recap: "Every component talks only to the API server, and only the API server talks to etcd."
- `src/lessonkits/k8s-02.json` homework answer: "The other components never call each other: each talks only to the API server, mostly by watching it for changes and then writing back what it did."
- The same lesson already says the kubelet talks to containerd through the CRI.

Official pages opened 2026-11-18:

- [Container Runtime Interface](https://kubernetes.io/docs/concepts/architecture/cri/): the CRI is the protocol between the kubelet and the container runtime, and the kubelet connects as a gRPC client.
- [Communication between Nodes and the Control Plane](https://kubernetes.io/docs/concepts/architecture/control-plane-node-communication/): API usage from nodes terminates at the API server, and the API server also connects to the kubelet to fetch logs, attach to pods, and port-forward.

Proposed replacement for the one-rule paragraph: components watch and update the API server, and only the API server reads and writes etcd. The kubelet also calls the container runtime over the CRI. The API server calls the kubelet for logs, attach, and port-forward. Keep the sentence that only the API server talks to etcd.

Acceptance, when someone makes the change: `npm run preflight -- --files src/content/posts/k8s-from-zero-02-architecture-tour.md`, then `npm run build:lesson-kits -- k8s-02`, and the homework answer matches the revised paragraph.

### K8S-L02-002

Locations:

- Lesson, step 9 command and the cheat-sheet YAML (`name: web-69977c9c79-sv68d`).
- Sample event log in the same lesson: `web-69977c9c79-pwjwm` and `web-69977c9c79-vfjt9`.
- `src/lessonkits/k8s-02.json`, the "Follow one apply" cheat-sheet command, which copies `web-69977c9c79-sv68d`. The JSON note says to use one of the reader's Pod names. The command text itself does not match the sample log.

Proposed replacement: use `web-69977c9c79-pwjwm` (or `vfjt9`) in the command and in the cheat-sheet YAML, so a paste of the printed sample works. Keep the sentence that tells the reader to use their own Pod name.

Acceptance: the sample command's Pod name occurs in the sample event log in the same file; the kit JSON uses that same name; preflight on the post and `npm run build:lesson-kits -- k8s-02`.

### K8S-L02-003

Location: "Life of a kubectl apply", the sentence "every step leaves an **event** you can read." Later, step 11 says `kubectl describe` on a new Pod shows `Node: <none>` and no events at all, and the troubleshooting heading is "Pods stay `Pending` with no events."

Proposed replacement: qualify the earlier sentence so it describes the successful apply. A Pod that nobody scheduled has no scheduling event. The scheduler-off section can stay as the demonstration.

Acceptance: preflight on the post. The two passages no longer contradict each other.

### K8S-L02-004

Locations: step 10 (etcd exec) and step 11 (move `kube-scheduler.yaml` out of the manifests directory), and the matching groups in `src/lessonkits/k8s-02.json` ("Peek into etcd (learning only)", "Switch the scheduler off, then on").

Proposed addition, before those commands: a safety banner. Stopping the scheduler leaves new Pods Pending and leaves running Pods running; the banner shows the command that puts the manifest back. The etcd banner says the shown command is a read, the shell is inside etcd, and the certificates are the server credentials, so the reader types the printed `get` and does not write keys.

Acceptance: the banner is visible before the commands in the lesson and the kit; preflight and `npm run build:lesson-kits -- k8s-02`.

### K8S-L01-001

Location: `src/content/posts/k8s-from-zero-01-what-kubernetes-is.md`, the opening paragraph, "replace a container you killed." The lab step is `kubectl delete pod`.

Proposed replacement: say the reader deletes a Pod and watches a new Pod take its place. Lesson 2 already says "replace a Pod you deleted."

Acceptance: `npm run preflight -- --files src/content/posts/k8s-from-zero-01-what-kubernetes-is.md`.

### K8S-L01-002

Locations:

- Lesson 1, "Try it: your first cluster answers", including the `curl` install and `kind create cluster`. The lesson says part 3 explains every install step and that this is the short version.
- Lesson 2 opens by requiring `kind create cluster --name k8s-from-zero` and closes by sending the reader to part 3 to install kubectl and kind properly.
- Lesson 3 title and description are the install lesson (`2026-11-14T09:00:00Z`).

Proposed direction: keep a first cluster in lesson 1 only if lesson 1, lesson 2, and lesson 3 agree on what is a preview and what is the install. This register does not choose the rewrite.

Acceptance: a reader can say, from the page they are on, whether they are expected to install now or later. Preflight on the three posts. Kit rebuild for any kit whose copy changes (`k8s-01`, `k8s-02`, `k8s-03`).

### K8S-L04-001

Lesson 4 closing line: "part 5, kubectl essentials, coming tomorrow." `pubDate` values: lesson 4 `2026-11-15T09:00:00Z`, lesson 5 `2026-11-15T22:00:00Z`.

Proposed replacement: drop "tomorrow", or name the same UTC day. Do not invent a new `pubDate` in a copy edit.

Acceptance: the closing line matches the next `pubDate` in UTC. Preflight on the post.

### K8S-L05-001

Lesson 5 closing line: "part 6, namespaces, labels and annotations, coming tomorrow." Lesson 6 `pubDate` is `2026-11-17T22:00:00Z`. The byline the site prints is Nov 17, 2026, 22:00 UTC. A seed note that said 18 Nov was adjusted to this `pubDate`.

Proposed replacement: drop "tomorrow", or point at the real UTC date. Lesson 6's own "part 7, coming tomorrow" matches lesson 7 at `2026-11-18T22:00:00Z`, so that line is not a finding.

Acceptance: the closing line matches lesson 6's `pubDate`. Preflight on the post.

### K8S-L05-002

This is a note, P3. No copy change is required for publication. A later cadence decision can record why 09:00Z became 22:00Z and why 2026-11-16 has no part.

`pubDate` values inspected:

| Lesson | `pubDate` |
|---|---|
| 1 | `2026-11-12T09:00:00Z` |
| 2 | `2026-11-13T09:00:00Z` |
| 3 | `2026-11-14T09:00:00Z` |
| 4 | `2026-11-15T09:00:00Z` |
| 5 | `2026-11-15T22:00:00Z` |
| 6 | `2026-11-17T22:00:00Z` |
| 7 | `2026-11-18T22:00:00Z` |
| 8 | `2026-11-19T22:00:00Z` |

Lessons 1-3 say the next part is coming tomorrow, and the next `pubDate` is the next UTC day at 09:00Z. Those three lines match.

## Five-minute challenge

Not proposed. Lesson 2 already has homework in `src/lessonkits/k8s-02.json`. A later review reads that homework before drafting a challenge.

## Verification record

- Date: 2026-11-18.
- Method: static inspection of the files on `main` at `6ae56795e7cc78669195d5f21a27c188857d902a`. Not executed in a cluster.
- Posts read for the seeded claims: `k8s-from-zero-01` through `k8s-from-zero-08` (`pubDate`, closing "Next" lines, and the lesson 1 and 2 passages cited above).
- Kit read: `src/lessonkits/k8s-02.json` (cheat-sheet command, homework answer, etcd group, scheduler group).
- Catalog: `src/data/series.json`, `k8s-from-zero` arcs. The last arc, Certification, starts at lesson 104 and has no `end`.
- Clock: `src/lib/date-format.ts` formats with `timeZone: 'UTC'`.
- Pages opened: the CRI page and the control-plane-to-node page linked on K8S-L02-001. GitHub tag [v1.37.2](https://github.com/kubernetes/kubernetes/releases/tag/v1.37.2) is published `2026-10-28T04:37:53Z`, which matches lesson 1's "28 October 2026" line. `https://kubernetes.io/releases/`, as fetched the same day, still listed 1.37.1 (2026-09-15) as the latest 1.37 patch. That disagreement is a gap, not a filed defect, because the release tag the lesson cites does exist.
- Not done: no `kubectl` run, no lesson-kit rebuild, no QR decode, no PDF text extraction. Those stay unverified.
