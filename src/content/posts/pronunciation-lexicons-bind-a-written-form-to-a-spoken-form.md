---
title: Pronunciation Lexicons Bind a Written Form to a Spoken Form
description: A PLS lexicon can give a voice application a reusable pronunciation for product names. Learn what graphemes, phonemes, aliases, language and alphabet settings actually control.
pubDate: "2026-10-08T08:30:00Z"
section: dev
tags:
  - voice-applications
  - speech-synthesis
  - pls
  - pronunciation
draft: false
heroImage: https://media.aitamer.news/heroes/pronunciation-lexicons-bind-a-written-form-to-a-spoken-form-3be399c8.jpg
heroAlt: A blue name tag and folded yellow sound wave are joined on the pages of a paper pronunciation book.
author: ari
wildness:
  rating: 1
  verified: PLS maps written forms to phonemes or aliases and requires IPA support in conforming processors.
  claimed: Veyra is illustrative; service support and audible output require testing on the target engine.
verdict: For names a voice misreads, map the written form to an IPA phoneme in a language-specific PLS lexicon, then verify that the target voice service loads and speaks it as intended.
sources:
  - title: W3C Pronunciation Lexicon Specification (PLS) 1.0
    url: https://www.w3.org/TR/pronunciation-lexicon/
---

Suppose an assistant reads a purchase confirmation for a fictional product named Veyra. The interface shows the right spelling, but the voice stresses the wrong syllable. Adding another instruction to the assistant's prompt may change the generated text; the speech engine still needs a pronunciation for the written name.

The [W3C Pronunciation Lexicon Specification](https://www.w3.org/TR/pronunciation-lexicon/) (PLS) defines an XML document that maps written forms to pronunciations for speech synthesis and recognition. Each `lexeme` groups one or more `grapheme` elements with one or more `phoneme` or `alias` elements. Here, `grapheme` contains the written word or short phrase. It does not mean a single Unicode grapheme cluster. A minimal entry for the intended English pronunciation “VAY-ruh” could be:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<lexicon version="1.0"
  xmlns="http://www.w3.org/2005/01/pronunciation-lexicon"
  alphabet="ipa" xml:lang="en-US">
  <lexeme>
    <grapheme>Veyra</grapheme>
    <phoneme>ˈveɪrə</phoneme>
  </lexeme>
</lexicon>
```

An SSML document can reference the PLS file through its `<lexicon uri="..."/>` element. Creating the XML file alone does not make a speech engine load it.

The root's `alphabet` chooses the default phonetic notation, and `xml:lang` identifies one language for that lexicon. PLS requires conforming processors to support `ipa`, the International Phonetic Alphabet. A `phoneme` can override the default with a vendor-defined `x-...` alphabet, but that choice ties the entry to processors that understand it. If an application speaks several languages, separate lexicons can supply language-specific pronunciations.

An `alias` takes a different route: it substitutes another written form, useful for an acronym whose expansion should be spoken. The processor then determines how to pronounce that substitute. Use `phoneme` when the sound itself needs explicit control. Multiple spellings can share a lexeme's pronunciations, and multiple pronunciations can be listed. For speech synthesis, `prefer="true"` selects a preferred one; without it, document order applies unless the processor documents its own selection method. Recognition processors consider the listed alternatives valid.

The specification defines processor behavior. It does not guarantee that a particular voice service loads PLS or produces identical audio. Check the service's lexicon interface, use the locale actually sent to the voice engine, and listen to the resulting name in representative sentences. Keep the spelling and pronunciation together in a maintained lexicon so a product rename or new locale has one clear place to review.
