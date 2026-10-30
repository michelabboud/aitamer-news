---
title: Go's per-iteration loop variables follow the go line in go.mod
description: Go 1.22 gives variables declared by a loop fresh instances on each iteration. The module's go line sets the default, and a per-file build constraint can override it.
pubDate: "2026-10-31T10:00:00Z"
section: dev
tags:
  - go
  - golang
  - closures
  - goroutines
  - go-modules
draft: false
heroImage: https://media.aitamer.news/heroes/go-loop-variables-go-mod-b029f51e.jpg
heroAlt: A paper hand peels a fresh tag from a pad inside a circular arrow while two separate tags lie outside the loop.
author: quill
wildness:
  rating: 1
  verified: "Go docs: the module's go line sets the default loop semantics; a per-file build constraint can select 1.22."
  claimed: Go's wiki says only loops that capture or take the address of the variable compile differently.
verdict: Check the go line before trusting loop closures. Raise it deliberately, list changed loops with -d=loopvar=2, and keep bisect ready for any test that fails.
sources:
  - title: Go 1.22 Release Notes
    url: https://go.dev/doc/go1.22
  - title: Fixing For Loops in Go 1.22 (The Go Blog)
    url: https://go.dev/blog/loopvar-preview
  - title: "Go wiki: LoopvarExperiment"
    url: https://go.dev/wiki/LoopvarExperiment
  - title: "The Go Programming Language Specification: For statements with range clause"
    url: https://go.dev/ref/spec#For_range
  - title: "Go compiler source: cmd/compile/internal/noder/writer.go"
    url: https://go.dev/src/cmd/compile/internal/noder/writer.go#L1650
---

Go 1.22 changed what a `for` loop variable is. The [Go 1.22 release notes](https://go.dev/doc/go1.22) explain that loops used to create their variables once and update them on each iteration. From Go 1.22, each iteration gets new variables.

## The sharing bug

Under the old rule, closures that captured a variable declared by the loop shared it across iterations. The [Go blog post on the change](https://go.dev/blog/loopvar-preview) shows goroutines that all print one shared `v`:

```go
for _, v := range []string{"a", "b", "c"} {
    go func() {
        fmt.Println(v)
    }()
}
```

The usual workaround was a copy, `v := v`, at the top of the body. The [loopvar wiki page](https://go.dev/wiki/LoopvarExperiment) says the copy is unnecessary once a module targets Go 1.22 or later.

## Which variables the rule covers

In the [Go specification](https://go.dev/ref/spec#For_range), a range clause that declares its variables with `:=` gets new variables on each iteration. A range clause can instead assign to existing variables with `=`, and such a loop keeps using those variables.

## The go line sets the default

On a current toolchain, the rule follows the `go` line in `go.mod`. The blog says the new semantics apply only in modules that declare Go 1.22 or later, and that `//go:build` lines can decide file by file.

There are two exceptions. The blog notes that very old, unsupported Go versions could still compile such code with a shared variable. The Go 1.21 preview, `GOEXPERIMENT=loopvar`, applied the new semantics to every loop and ignored the `go` line.

A module whose `go.mod` says `go 1.21` therefore shares the variable by default, unless a file's build constraint selects Go 1.22 or later. Code copied in from a newer module can then change behavior while its text stays identical.

## What changes when you raise the line

Raising the `go` line switches every affected loop in the module at once. Per the wiki, the loops that compile differently are the ones whose variable is captured by a closure or has its address taken. Building with `-gcflags=all=-d=loopvar=2` prints a line for each such loop.

The [compiler source](https://go.dev/src/cmd/compile/internal/noder/writer.go#L1650) shows that this setting also turns on the new semantics in files below Go 1.22. The wiki notes that `all=` makes it report on every package in the build, so older dependencies get the new semantics too, including ones your own `go` line does not govern. Treat it as a broader check than a raise of that line.

If a test fails after the switch, the wiki's `bisect` tool enables the change on subsets of the program to find the loop that causes the failure:

```sh
go install golang.org/x/tools/cmd/bisect@latest
bisect -compile=loopvar go test
```

It needs a failing test command.

## What to do

1. Read the `go` line in each `go.mod`, and look for per-file build constraints that select Go 1.22 or later.
2. List the affected loops with `-gcflags=all=-d=loopvar=2`, and run the full test suite with the same flag. The flag applies the new semantics to older dependencies too, so that run is a broader check than the raise.
3. Run `bisect -compile=loopvar go test` on any test that fails.
4. Copies that only guard a variable declared with `:=` can go. Review copies in loops that assign with `=` before removing them. Our advice: make the removal a separate commit, so reviewers see the semantic switch and the cleanup apart.
