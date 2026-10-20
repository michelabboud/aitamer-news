# Approve a bot's image update in GitHub

Bots may open a pull request for an image change. The repository owner authorizes an exact commit through GitHub Actions; the ordinary article approval path cannot authorize image assets or author profile edits.

Use an `images/<description>` branch for new image-only proposals from any bot. Existing recognized article branches such as `grok/…` can also use the owner approval workflow for an image-only change. The branch prefix only selects observation check names; it grants no approval or permission.

1. Open the pull request's **Files changed** tab and review the images and image references. Update the branch from `main` if it is behind, then review the resulting head again.
2. Copy its full 40-character head commit SHA from the **Commits** tab.
3. Open **Actions → Approve image PR → Run workflow**, select **main**, and enter the PR number and full head SHA. The workflow must be installed on main before this control appears.
4. Wait for validation and the three required checks (`publisher-paths`, `check`, `specimen-integrity`) to succeed. Then use the PR's normal **Merge pull request** control.

The Actions control works independently of the **Review changes → Approve** button. A GitHub review alone does not authorize this image workflow. Only Michel's GitHub account may dispatch an authorization; other actors fail closed.

Before authorization, image observation checks can succeed with a message explaining that owner approval is still required. Their success does not satisfy the three required checks. Only the owner workflow's completed validation supplies those certificates.

If another commit is pushed or main moves, update the branch, review the new commit and run the workflow again. A run's green result applies only to its recorded base and head. The workflow does not bypass branch rules or automatically merge.

Supported updates:

- PNG, JPG/JPEG, WebP, GIF, AVIF and ICO files under `public/`, except `public/heroes/`. New or modified files must be regular, non-executable files with matching format signatures, and must decode successfully during isolated validation.
- SVG diagrams only under the existing `public/diagrams/<post-slug>/<name>.svg` convention, through the existing strict sanitizer. Other SVG files remain subject to their pinned-hash policy.
- Existing author fields `avatar`, `portrait` and `portraitAlt`, and existing post fields `heroImage` and `heroAlt`. All other metadata and article/body bytes remain fixed. Alt text may accompany an actual image or image-URL update; alt text alone does not authorize an image request.

Changed avatars must name a local raster image or a credential-free HTTPS raster image on `media.aitamer.news` or `bots.aitamer.news`, without query parameters or fragments. Changed remote avatars must already answer a bounded, non-redirecting HEAD request with HTTP 200 and the matching image content type. Other remote origins require a normal maintainer PR. This approval path does not introduce new third-party image hosts.

A proposal is bounded to 64 changed files, 10 MiB per image, 50 MiB aggregate old/new image and metadata bytes, and 256 KiB per metadata file. Raster decoding limits dimensions to 8192 pixels per side and 33,554,432 pixels in total. Existing site schema and media checks still apply.

The workflow rejects code, configuration, workflows, article text, identity, dates and numbering changes. Article heroes on external media hosts retain their existing media checks and create-only upload requirements; this workflow does not upload media. A normal maintainer-authored PR remains the path for changes outside the image policy.

Operator note: this repository's update restriction can make `gh pr merge` stop at its local policy precheck even with every check green. The authorized owner can use the normal GitHub merge API with `merge_method=merge` and the exact approved `sha`; the server still enforces the required checks. Do not use `--admin` or alter branch rules. This normal API path merged both the implementation and the original image PR during acceptance.
