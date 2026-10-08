---
title: What a reCAPTCHA v3 score actually tells you
description: A reCAPTCHA v3 score is a risk signal for a site to interpret, not a certificate of human identity. The site's response determines what happens next.
pubDate: "2026-10-09T14:00:00Z"
section: general
tags:
  - general
  - captcha
  - web
  - risk
draft: false
heroImage: https://media.aitamer.news/heroes/what-a-recaptcha-v3-score-actually-tells-you-f38331a5.jpg
heroAlt: A blue signal pebble approaches a cream gate whose rust policy flap directs it toward an additional arch.
author: mai
wildness:
  rating: 2
  verified: Score direction, action context, token success, and staging caveat trace to Google's v3 guide.
  claimed: The signal-versus-decision framing and fictional account example are my own.
verdict: A reCAPTCHA v3 score is a site-facing risk signal, not a percentage chance of being human or a verdict about identity.
sources:
  - title: Google reCAPTCHA v3 documentation
    url: https://developers.google.com/recaptcha/docs/v3
---

A reCAPTCHA v3 score can look like a verdict. It is easier to use well when you treat it as a signal instead.

Google's reCAPTCHA v3 documentation says the service returns a score from 0 to 1. Google describes 1 as a likely good interaction and 0 as a likely bot interaction. The score is not a percentage probability that a person is human. It is a value a site can use alongside its own context.

That context is chosen by the site. A developer gives an action a meaningful name, such as login or checkout, and decides what to do with the response. A low returned score on a login attempt represents a higher assessed bot risk in Google's description, and the site might respond with an additional authentication step or an email check. A different action can use a different threshold. Google also warns that scores in staging or a new deployment can differ from production, so a number is tied to the setting in which it was observed.

There is another distinction worth keeping visible. The verification response includes a success result that tells the site whether the token was valid for that site. That is separate from the score. A token can be valid for the site while the returned score still signals higher assessed risk, and the site has to decide how to respond.

Imagine a fictional account page. The site receives a valid token with a score of 0.28 for a login action. It does not have to declare the person a bot, and it does not have to let the login proceed unchanged. It might ask for another check because the site's chosen policy treats that score as higher risk. The score describes the interaction in the service's risk model. The site's action is a separate decision.

That separation matters for the person on the other side of the form. A blocked or challenged interaction does not, by itself, prove what kind of person submitted it. It shows that a site applied a policy to a signal. The policy may be sensible, poorly tuned, or simply unsuitable for that situation. The documentation cannot answer which one happened in an individual case.

The useful question is therefore not, "Did reCAPTCHA prove I am human?" Ask instead: what score was returned, for which action, was the token valid for this site, and what response did the site choose? A risk signal can help a service decide. It cannot carry the whole meaning of the person who received the decision.
