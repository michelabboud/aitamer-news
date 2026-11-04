---
title: Tell Password Managers Which Password You Mean
description: Autocomplete tokens distinguish an existing password from one a person is creating.
pubDate: "2026-11-11T12:30:00Z"
section: dev
tags:
  - html
  - forms
  - passwords
  - accessibility
  - security
draft: false
heroImage: https://media.aitamer.news/heroes/password-autocomplete-purpose-becac9a8.jpg
heroAlt: A hand lowers a coral paper key into an empty recess beside a cream key in a teal organizer.
author: mai
wildness:
  rating: 1
  verified: Username, current-password, and new-password identify different autofill purposes.
  claimed: No additional unverified claims.
verdict: Mark existing and new passwords according to their purpose, then test real flows without relying on a specific manager.
sources:
  - title: "WHATWG HTML Standard: Form control infrastructure and autofill"
    url: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html
  - title: "MDN: Autocomplete attribute"
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
  - title: "MDN: Password authentication"
    url: https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Passwords
---

A password field does not always ask the same question. On a sign-in page, it asks for an existing secret. On a registration page, it asks the person to create one. HTML provides autocomplete tokens to express that difference to browsers and password managers.

The username token identifies the account name. The current-password token identifies the existing password for that account. The new-password token identifies a password being created or changed. These are hints about the purpose of a field, not instructions that force every manager to behave identically.

For a site that uses email addresses as account names, a sign-in form might look like this:

```html
<form action="/sign-in" method="post">
  <label for="email">Email address</label>
  <input id="email" name="email" type="email"
         autocomplete="username" required>

  <label for="password">Password</label>
  <input id="password" name="password" type="password"
         autocomplete="current-password" required>

  <button type="submit">Sign in</button>
</form>
```

The email input describes the expected input format, while the autocomplete token tells a manager that this value is the account identifier. The password input obscures the entered value in the interface, and its token identifies it as the existing password. Use a regular text input instead of an email input if the site accepts account names that are not email addresses.

On a registration form, use the same username purpose for the account identifier but mark the chosen password as new. A password manager may then offer to generate a password instead of filling an existing one. If the form asks for confirmation, the confirmation field can also use the new-password token. The server still needs to check that both submitted values match.

A password-change form can contain both kinds: the existing password field uses current-password, while the replacement and its confirmation use new-password. That distinction gives tools a better description of the job each field performs. It does not by itself verify the existing password or authorize the change.

Keep labels visible and associated with their controls, allow paste, and test the actual sign-in and change flows with the browsers and password managers your audience uses. Tools differ, saved credentials may not exist, and users must still be able to enter values manually. Some browsers or managers can also offer to save or fill login credentials despite an autocomplete-off hint.

Finally, these attributes do not secure the connection or safely store a password. Serve and submit the form over HTTPS, validate on the server, and use an established password-storage implementation. The markup helps the person and their tools supply the right value; authentication remains the application's responsibility.
