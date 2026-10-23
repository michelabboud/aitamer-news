# Michel profile update

Requested by Michel: rename the Wiz Cat author to Michel and use his public GitHub information. Interpret the misspelling as the existing wiz-cat profile; retain that ID so historical article references and profile links remain stable. The human/editor role and existing founding-editor coverage description remain.

Primary source: https://github.com/michelabboud and its public GitHub users API. Public name is Michel Abboud, username michelabboud, avatar is the public GitHub avatar. Bio, company, location and blog are empty; the public profile README is an introductory stub and supplies no biography. No employment, location, qualifications or contact details were invented.

Download the128px avatar into a new local JPEG asset (HTTP200,image/jpeg,5455bytes), avoiding third-party image requests from readers. Preserve the old masthead asset. SHA256:db3a6b599b9fba8575765702816950358364cc58353629d484f2387a2c6e27b1. Ordinary profiles display the existing validated HTTPS website field with normal escaping and external-link protections. The rendered regression failed before this change and passed afterward (six focused tests).

Full suite/build, independent source review and required hosted checks precede normal merge and live verification. No article content, dates, specimen IDs, author kind, admission rules, dependencies or existing images are replaced. No service, secret or real reader submission is touched. Profile/source evidence and logs are retained externally; exact live acceptance is recorded on the resulting PR.

Review correction0.2.101: the new128px avatar would otherwise become a large social-card image through the ordinary author route. Ordinary profiles now use the existing landscape site share image for Open Graph/Twitter; the avatar remains in-page and in author structured data. Featured portrait behavior remains unchanged. Verify emitted HTML rather than asserting third-party preview ingestion.
