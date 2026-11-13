# Code rails

A highlighted code block can carry a copy button and a narrow left rail of buttons. The rail is defined in the post, next to the fence it belongs to.

## Syntax

Name the rail on the fence, then give it a sidecar whose language is `rail`:

````markdown
```bash rail=get-nodes
kubectl get nodes -o wide
```

```rail
id: get-nodes
items:
  - kind: explain
    label: Explain this command
    lines:
      - token: kubectl
        text: The Kubernetes command-line client.
      - token: get
        text: Display one or many resources.
```
````

- `rail=<id>` is one token in the fence info string. The id is a lowercase slug, unique in the post.
- The `rail` fence is YAML. It is removed before the page is rendered, so readers never see it.
- Every `rail=` id needs a sidecar, and every sidecar needs a fence. A mismatch fails the build.
- Text is plain: no HTML, no line breaks inside a value. Quote values that contain `:` or `#`.

The copy button is on every rail block. It copies the highlighted code. With JavaScript off, the code is still there to select.

## Kinds

The registry is `RAIL_REGISTRY` in `src/lib/code-rail.ts`.

| Kind | Status | What the rail does |
|---|---|---|
| `explain` | active | A button. It opens a dialog with the fenced command and one line per token: the token, then the explanation. The same text is also in a `details` element, so it can be read with JavaScript off. |
| `link` | active | An anchor. `href` is an `https://` URL or a site path that starts with `/`. |
| `calc` | stub | Reserved for a later calculator. `calc` is a lowercase slug. The button opens a dialog that names the id and says the calculator is not available yet. A future renderer can replace that dialog without a new authoring syntax. |

An `explain` item:

```yaml
- kind: explain
  label: Explain this command
  lines:
    - token: "-o"
      text: Short form of --output. It selects the output format.
```

A `link` item:

```yaml
- kind: link
  label: kubectl get reference
  href: https://kubernetes.io/docs/reference/kubectl/generated/kubectl_get/
```

A `calc` stub:

```yaml
- kind: calc
  label: Open the replica calculator
  calc: replica-count
```

## Accessibility

- Rail controls and the copy control are real buttons, or a real link for `link`. Each has an accessible name.
- The dialog uses `aria-labelledby` on its heading and `aria-modal="true"`.
- Opening the dialog moves focus to Close. Esc, Close, and a click on the backdrop close it and return focus to the button that opened it.
- Targets are at least 44px. The dialog stays within the viewport on a narrow screen.
- With JavaScript off, the explanation stays in the `details` element under the code.

## Where it is drawn

`src/lib/code-rail-plugin.ts` strips the sidecar and the `rail=` token before highlighting, so a bot post's rendered HTML stays an ordinary code block for the rendered-body gate. `src/pages/posts/[slug].astro` reads the source, parses the sidecars, and wraps those blocks. The client behaviour is `src/scripts/code-box.ts`.
