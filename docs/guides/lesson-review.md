# AI Tamer Universal Lesson Review Template

**Version 1.1.** This is the only lesson review standard for every technical series: Kubernetes from Zero, Containers from Zero, and any series that follows. A review uses this template. It does not invent a second rubric, a 100-point score, a pass threshold on a combined score, or a cheaper second pass.

Version 1.0 is the review Michel specified: inputs, reviewer stance, technical audit, educational audit, the severity table, the per-lesson report, the publication checklist, and the reuse policy. Version 1.1 folds in the amendments at the end of this page. Reviewers use 1.1 as a single standard.

This review feeds the desk gates that already exist, in this order: Beat, then Fact and Legal, then Writer, then Art, then SEO, then IT. It replaces none of them. A finished review is evidence for those gates. It does not admit a post, schedule a `pubDate`, allocate a specimen, or merge a pull request.

## 1. Review inputs

Record these before reading the lesson:

| Input | What to write down |
|---|---|
| Course | Series title and slug, for example Kubernetes from Zero, `k8s-from-zero`. |
| Lessons and URLs | Each lesson title, `series_order`, repository path, and public URL. |
| Series index | The row in `src/data/series.json`, including arcs. |
| Audience | Beginners through professional. Name who this lesson is for inside that range. |
| Learning environment | Tools, OS, cluster or engine, and the pinned versions below. |
| Review mode | Technical+Educational. Both audits are required. |
| Neighbours | Previous lesson and next lesson, with their `pubDate` values. |
| Pinned versions | The versions the series claims. Check commands and docs against those versions. |
| Lesson kit | JSON path, PDF paths, and whether a lab zip exists. |
| Date of the review | The real calendar date. Dated claims are checked against this date. |

Kubernetes from Zero pins, until a later lesson changes them in the source: Kubernetes v1.37.0, kubectl v1.37.2, kind v0.33.0. Compare behaviour with the Kubernetes documentation for that release, the kubectl documentation at v1.37, and the kind documentation for v0.33.0. If the live docs have moved on, say which version the page was showing. A newer page is not proof that a pinned command works.

A Containers from Zero review pins Docker Engine and Compose in the inputs when those lessons name versions. This page does not invent those pins.

## 2. Reviewer instructions

Review as a senior cloud architect, a DevOps engineer, a technical editor, and an instructor. The review is independent and critical. Fixes are surgical and evidence-based. Preserve the author's voice.

Read the whole lesson. That includes prose, code, command output, diagrams, exercises, troubleshooting, downloads, and the lesson kit (cheat sheet, homework, answer key, and any lab zip).

Compare technical claims with the official documentation for the pinned version. Open the page. Quote the part you relied on and record the URL.

Never claim a command ran unless it ran in this review. Mark every check as one of:

- **Static inspection:** read from the file, the kit source, or a page you opened.
- **Executed:** you ran the command and recorded the result.
- **Unverified:** you could not check it. Say why.

Name a source you could not open as a gap. A gap stays in the report. It is not a pass.

Licensing and attribution are out of this review's judgment. Send these to Legal & Rights, with the lesson location and the exact text: a Kubernetes documentation credit under CC BY 4.0, the Linux Foundation trademark line, and any quotation. Do not score them, and do not rewrite them as a technical fix.

## 3. Technical audit

Cover each of these. A clean area still gets one line so a later reader can see it was checked.

- Accuracy against the official docs for the pinned version.
- Version compatibility: commands, APIs, flags, and defaults match the pins.
- Command reproducibility: a reader who pastes a command gets the outcome the lesson describes. Sample names in a command match the sample output the lesson just showed, or the lesson tells the reader to substitute a name from their own output and the sample itself is consistent.
- Configuration quality.
- Operational realism.
- Safety: destructive commands, privileged commands, credentials, and cost. A disruptive or privileged lab has a safety banner before the commands. The banner says what breaks, what keeps running, and how to undo it.
- Troubleshooting: the failure the reader is likely to hit, and a next step that matches the lesson.

### Date audit

Every review includes a date audit. A report without it is incomplete.

- Compare `pubDate` values with series order and with the cadence the series promised (Kubernetes from Zero's catalog text is one part a day).
- Compare every "tomorrow", "next lesson", or other schedule promise with the next lesson's actual `pubDate`.
- Check release versions, end-of-life dates, and other dated claims against the official page and against the real date of the review.
- The site prints dates in UTC. `formatDate`, `formatDateTime`, `formatClock`, and `formatShortDate` in `src/lib/date-format.ts` all set `timeZone: 'UTC'`. Judge a promise against the UTC stamp a reader sees, and record the `pubDate` string from the file.

### Lesson kits

When the lesson has a kit:

- The cheat sheet, the homework, and the answer key must match the lesson text. The source is `src/lessonkits/<id>.json` (Kubernetes lessons use `k8s-NN.json`). The PDFs are `public/lessonkits/aitamer-<id>-cheatsheet.pdf`, `aitamer-<id>-homework.pdf`, and `aitamer-<id>-answer-key.pdf`.
- Each QR code must decode. The builder encodes the lesson URL with the kit UTM parameters (`scripts/lessonkit/build.mjs`). The decoded URL must be that lesson link.
- A fix that changes kit copy is accepted only after `npm run build:lesson-kits -- <id>` (the builder needs `CHROME_PATH`, as `docs/guides/lesson-kits.md` says) and a fresh check that the PDFs match the JSON and the lesson.

### Defect record

Each defect records:

- Location: file, heading, and a short excerpt.
- Explanation: why it is wrong or why a reader gets stuck.
- Verified correction: the docs or the run that supports the fix.
- Copy-ready replacement: words or a command a writer can paste. The report labels it as proposed. A suggestion is not an implemented change.

## 4. Educational audit

Cover each of these:

- Objectives, and whether the lesson demonstrates them.
- Prerequisites, including the learning environment.
- Concept progression inside the lesson and from the previous lesson.
- Beginner clarity, without talking down to a professional reader in the same audience.
- Pacing.
- Hands-on work.
- Feedback and expected outputs.
- Continuity with the previous and next lessons.
- Diagrams a reader can follow if they cannot see the figure (the alt text and the surrounding prose).
- Engagement, including one exercise a reader can finish in about five minutes.

State three times separately: reading time, lab time, and optional advanced time. An optional lab is its own section, separated from the reading. A disruptive lab keeps the safety banner from the technical audit.

Before proposing a new five-minute challenge, read the homework that already ships in the lesson kit. If that homework already practices the objective, say so and do not add a second exercise.

## 5. Severity

Use this table only. Effort is S (a local wording or sample fix), M (a section, or the lesson and its kit together), or L (the lab or the lesson structure).

| Priority | Name | What it is | When it is fixed |
|---|---|---|---|
| P0 | Critical | An incorrect or unsafe instruction with serious consequences. | Before publication. |
| P1 | High | A broken lab, a major misconception, or a significant learning obstacle. | Before publication. |
| P2 | Medium | Clarity, sequencing, usability, or maintainability. | In the normal editorial pass. |
| P3 | Optional | Enrichment or polish. | When the writer chooses. |

A favorable overall assessment must not hide a P0. If a P0 is open, the verdict is HOLD, and the P0 appears in the top findings. Scores do not average it away.

There is no second severity scale.

## 6. Report, one per lesson

A batch still writes one report per lesson, then a continuity note for issues that cross lessons. File cross-lesson issues on the earliest lesson, and name the other lessons in the finding.

Suggested text is proposed. Never describe a suggestion as implemented.

### A. Executive verdict

- Verdict: READY, READY WITH FIXES, or HOLD.
  - HOLD when any P0 is open, when a P1 has no verified correction, or when the lab is unverified and the lesson depends on it.
  - READY WITH FIXES when every P0 and P1 has a verified, copy-ready correction and the lesson stays unpublished until those fixes are in the files. Open P2 items are listed.
  - READY when no P0 or P1 is open and the publication checklist is complete. Open P2 and P3 items stay listed.
- Technical score, 1 to 5.
- Educational score, 1 to 5.
- Lab reproducibility, 1 to 5, or **Not verified**.
- Top 3 findings.
- Strengths.
- Date audit result (required): cadence, "tomorrow" promises against UTC `pubDate`, and dated claims. Write "none" only after the check.

The three scores stay separate. Do not add them up. Do not apply a 100-point threshold.

### B. Detailed findings

For each finding:

| Field | Content |
|---|---|
| ID | Stable id, `K8S-L07-003` for Kubernetes from Zero lesson 7, third finding. Other series use a short prefix and the same shape. |
| Priority and effort | From the table in section 5. |
| Location | Section heading plus a short excerpt. |
| Explanation | What a reader hits. |
| Correction | Proposed wording or command, labeled proposed. |
| Official doc | URL and the version of the page, or "gap" if it did not open. |
| Acceptance | How a later editor shows the fix worked. |

### C. Teaching improvements

P2 and P3 changes that help a reader learn. Each one is proposed.

### D. Five-minute challenge

Include this block only when the existing homework does not already cover it. Fields: objective, prerequisites, instructions, expected result, validation, solution, cleanup.

If the kit homework already covers the objective, write "existing homework covers this" and the path of the JSON. Do not draft a second challenge.

### E. Continuity

Previous lesson, this lesson, next lesson. For a batch, list cross-lesson issues and their IDs.

### F. Implementation task list

One row per change someone would make later:

| Target | Change | Reason | Priority | Acceptance test |
|---|---|---|---|---|
| Repository path | The edit, described as work still to do | The finding ID | P0 to P3 | A check that can fail |

Name real repository files. When the target is a post, acceptance includes `npm run preflight -- --files <files>`. When the target is a lesson kit, acceptance includes that preflight for the lesson post and `npm run build:lesson-kits -- <id>`, then a check that the PDFs match the lesson and that each QR code decodes.

### G. Verification record

Date, reviewer, git revision, and for each command or claim: static inspection, executed, or unverified. List sources opened and sources that did not open. List commands only when they ran.

## 7. Publication quality gate

A lesson is ready for the desk gates when every line below is true. This checklist is the lesson review's gate. It is not Beat, Fact, Legal, Writer, Art, SEO, or IT.

- [ ] No open P0 or P1.
- [ ] Claims checked against a source the reviewer opened, at the pinned version.
- [ ] Commands inspected. Any command reported as run was actually run.
- [ ] Destructive and privileged exercises are labeled, and the lesson shows how to reverse them.
- [ ] Prerequisites and the learning environment are documented, including pinned versions.
- [ ] The stated objectives are demonstrated.
- [ ] The lesson includes one short exercise, or the existing homework is that exercise.
- [ ] Expected results and troubleshooting are present.
- [ ] Terminology matches the official docs and the rest of the series.
- [ ] Section F tasks name real files, and each acceptance test is something a later editor can run.
- [ ] Unverified items are disclosed. A hidden gap is a failed gate.
- [ ] The date audit is present.
- [ ] Licensing notes, if any, are routed to Legal & Rights and are not scored here.

## 8. Reuse

This standard applies to every lesson, including drafts.

Finding IDs stay stable. Closing an item does not renumber the rest. The next finding for that lesson takes the next free number.

Severity means the same thing in every series.

Each series keeps one cumulative issue register. Kubernetes from Zero uses `docs/reviews/k8s-from-zero-issue-register.md`. A register row records ID, lesson, priority, effort, summary, status, source review, and fix PR. New findings go into that register. A review does not start a second list.

## Lesson shape worth keeping

Writers and reviewers keep these shapes:

- The optional lab is clearly separated from the reading.
- Reading time, lab time, and optional advanced time are stated separately.
- A disruptive or privileged lab carries a safety banner before the commands.

## What 1.1 adds

1. Pinned versions in the inputs, and a check against the docs for that version. Kubernetes from Zero: Kubernetes v1.37.0, kubectl v1.37.2, kind v0.33.0.
2. Lesson kits are in the review: cheat sheet, homework, and answer key match the lesson; QR codes decode; source, PDFs, and the kit rebuild are named above.
3. Section F names real repository files. Acceptance includes `npm run preflight -- --files` and, for a kit, the kit rebuild.
4. Licensing and attribution go to Legal & Rights. The reviewer does not judge them.
5. The date audit is mandatory, in UTC, using `src/lib/date-format.ts`.
6. Read the existing homework before proposing a five-minute challenge.
7. This review feeds Beat, Fact and Legal, Writer, Art, SEO, and IT, and replaces none of them.
8. No 100-point score, no pass mark on a combined score, no second severity scale, and no cheap second pass. A follow-up after edits is a new pass of this same template against the changed files.
