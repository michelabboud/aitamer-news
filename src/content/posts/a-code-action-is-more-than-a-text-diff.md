---
title: A Code Action Is More Than a Text Diff
description: A Language Server Protocol code action can coordinate text edits with file operations. The order, document versions, and client failure policy shape what happens when it runs.
pubDate: "2026-10-07T14:00:00Z"
specimen: 363
section: tools
tags:
  - language-server-protocol
  - code-actions
  - workspace-edits
  - editor-tools
draft: false
heroImage: https://media.aitamer.news/heroes/a-code-action-is-more-than-a-text-diff-577a0168.jpg
heroAlt: A paper machine coordinates document edits and file actions above ordered steps and a safety shield.
author: ari
wildness:
  rating: 2
  verified: LSP 3.17 defines versioned text edits, ordered file operations, and failure strategies.
  claimed: The rename example illustrates a possible combination of defined operations.
verdict: A workspace edit can make one code action affect documents and files in a defined order. Check client capabilities and failure handling before treating the action as atomic.
sources:
  - title: LSP 3.17 Code Action
    url: https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/language/codeAction.md
  - title: LSP 3.17 WorkspaceEdit
    url: https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/workspaceEdit.md
  - title: LSP 3.17 TextDocumentEdit
    url: https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/textDocumentEdit.md
  - title: LSP 3.17 VersionedTextDocumentIdentifier
    url: https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/versionedTextDocumentIdentifier.md
  - title: LSP 3.17 File Resource Changes
    url: https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/resourceChanges.md
  - title: LSP 3.17 Apply a WorkspaceEdit
    url: https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/workspace/applyEdit.md
  - title: LSP 3.17 TextEdit and AnnotatedTextEdit
    url: https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/textEdit.md
---

A quick fix can look like one small change in an editor. The underlying action may touch several documents and the file tree. The Language Server Protocol (LSP) gives a code action a `WorkspaceEdit` field for that work. A code action can also carry a command. When it carries both, the client applies the edit before running the command. That order matters if the command expects the new files or text to exist. [The code action definition](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/language/codeAction.md) makes the sequence explicit.

## A workspace edit has two shapes

The [workspace edit definition](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/workspaceEdit.md) describes changes across resources in a workspace. Its simpler `changes` field maps document URIs to arrays of text edits. Its `documentChanges` field can hold edits tied to document versions. With the relevant client support, that array can also include create, rename, and delete operations for files or folders.

Those fields serve different needs. The specification says an edit should provide either `changes` or `documentChanges`. When a client can handle versioned document edits and `documentChanges` is present, it is preferred. A producer cannot assume every editor accepts the richer shape. The client advertises support for versioned document changes and for each kind of resource operation in its [workspace edit capabilities](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/workspaceEdit.md). If it supports neither, the specification limits the exchange to plain text edits through `changes`.

## Versions identify the document state

A `TextDocumentEdit` names one document and provides text changes for it. Its identifier includes a version value, which lets the client check the document version before applying an edit. This matters when a suggestion was computed against an earlier state and the person has since typed more code. [The text document edit definition](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/textDocumentEdit.md) says its edits describe one version of the document and must not overlap. They need no internal sorting.

The [versioned identifier definition](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/versionedTextDocumentIdentifier.md) also permits a `null` version in a specific case: a server can send it for a file that is not open in the editor when the disk content is the master. The version value gives the client information about the state the edit addresses. It does not describe a way to merge an edit with changes made later.

## File operations make sequence visible

Consider a code action that creates `config.ts` and then inserts starter text into it. The [workspace edit specification](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/workspaceEdit.md) gives this same create then edit pattern as a valid example. Clients must execute resource operations in the order supplied. If the edit instead deletes a file and then tries to insert text into that file, the specification says the sequence fails.

A larger action might rename a file and update references in other documents. That example combines operations defined by the protocol; the result still depends on the client. The [resource change types](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/resourceChanges.md) identify the old and new URIs of a rename. They also define options for an existing destination. For a create or rename, `overwrite` takes precedence over `ignoreIfExists`. A delete can request recursive removal for a folder or ignore a missing target. These choices affect the result even when the changed lines look harmless.

Order applies between entries in `documentChanges`. Edits within one `TextDocumentEdit` work differently: they describe changes against the same document version and cannot overlap. A preview should therefore show the file operations alongside the changed lines.

## Failure handling changes the result

A coordinated edit is not automatically atomic. The [workspace edit client capabilities](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/workspaceEdit.md) define several failure strategies. With `abort`, earlier operations remain after a later one fails. With `transactional`, either all operations succeed or none are applied. With `textOnlyTransactional`, text-only changes are transactional, while an edit containing file operations follows abort behavior. With `undo`, the client tries to reverse completed operations, but success is not guaranteed.

The advertised strategy changes what a failed action leaves behind. The protocol also defines a [`workspace/applyEdit` response](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/workspace/applyEdit.md) with an `applied` flag and an optional failure reason. A failed-change index can be returned when the client has signaled a failure strategy. These fields let an implementation report a failure without assuming that earlier changes were rolled back.

## Labels can explain changes

The protocol allows change annotations on text edits and file operations when the client supports them. An annotation can provide a visible label, a description, and a flag requesting user confirmation. The [annotation definition](https://github.com/microsoft/language-server-protocol/blob/gh-pages/_specifications/lsp/3.17/types/textEdit.md) also allows several changes to refer to the same annotation so a client can group them. This helps explain an action that creates a file, renames another, and updates text in several places. Whether those annotations appear to the user depends on the client's advertised support.

## What to do

When you build a code action, list the intended text edits and file operations in the order they must happen. Use `documentChanges` when the client advertises support for versioned edits and the resource operations you need. Give each text document edit the version of the document state used to compute it, and keep its edits nonoverlapping. Choose create and rename options deliberately, especially when a destination already exists. Check the client's failure strategy before promising an all-or-nothing result. If the client supports annotations, label changes that deserve review or confirmation. When you use `workspace/applyEdit`, read its result and surface a failure reason. Describe the whole operation in the preview, including the files it creates, renames, or deletes.
