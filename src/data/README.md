# Topic details (`topics.json`)

Optional, maintained by hand. Topic pages (`/topics/<slug>/`, ADR 0046) exist for every tag with at least five stories and work with this file empty. Add an entry to say something checkable about a topic:

```json
{
  "openai": {
    "summary": "One or two plain sentences, at most 400 characters.",
    "sameAs": ["https://en.wikipedia.org/wiki/OpenAI", "https://www.wikidata.org/wiki/Q21708200"]
  }
}
```

- The key is the topic's slug (the last part of its address), not the tag.
- `summary` replaces the page's default description. Plain text, no markup.
- `sameAs` takes Wikipedia or Wikidata https pages only, and only ones a person has opened and confirmed are the same subject. Leave it out rather than guess.
- A malformed entry fails the build and names the slug. An entry for a slug that is not a topic yet is ignored with a warning.
