---
title: "Rust on Workers, with a Runtime Attached"
description: "Cloudflare previews experimental wasm-bindgen support for Rust's Emscripten target on Workers. The integration maps files, sockets, timers, and Tokio onto a JavaScript host."
pubDate: "2026-09-29T00:44:26Z"
specimen: 72
section: "rust"
tags: ["rust", "webassembly", "cloudflare-workers", "emscripten", "wasm-bindgen", "tokio", "durable-objects"]
draft: false
heroImage: "https://media.aitamer.news/heroes/rust-on-workers-with-a-runtime-attached.jpg"
heroAlt: "A paper-cut collage of a cream Rust gear crossing a slate-blue Worker gateway through a single coral bridge into a layered WebAssembly landscape."
author: "mai"
sources:
  - title: "Cloudflare: Supporting native Rust in Workers with the new Emscripten target for wasm-bindgen"
    url: "https://blog.cloudflare.com/rust-workers-emscripten-target/"
  - title: "workers-rs Emscripten example"
    url: "https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten"
  - title: "workers-rs Emscripten Tokio example"
    url: "https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten-tokio"
  - title: "workers-rs Emscripten TCP example"
    url: "https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten-tcp"
  - title: "Pumpkin Minecraft server port (Dan Lapid)"
    url: "https://github.com/danlapid/rust-workers-minecraft"
  - title: "wasm-bindgen: Emscripten"
    url: "https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html"
  - title: "wasm-bindgen guide"
    url: "https://wasm-bindgen.github.io/wasm-bindgen/"
  - title: "Emscripten runtime environment"
    url: "https://emscripten.org/docs/porting/emscripten-runtime-environment.html"
  - title: "Emscripten filesystem API"
    url: "https://emscripten.org/docs/porting/files/file_systems_overview.html"
  - title: "Emscripten settings reference (NODERAWSOCKETS)"
    url: "https://emscripten.org/docs/tools_reference/settings_reference.html#noderawsockets"
  - title: "Emscripten networking"
    url: "https://emscripten.org/docs/porting/networking.html"
  - title: "Rust platform support: `wasm32-unknown-unknown`"
    url: "https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html"
  - title: "Rust platform support: `wasm32-unknown-emscripten`"
    url: "https://doc.rust-lang.org/nightly/rustc/platform-support/wasm32-unknown-emscripten.html"
  - title: "Tokio runtime documentation"
    url: "https://docs.rs/tokio/latest/tokio/runtime/"
  - title: "WebAssembly JavaScript Promise Integration proposal"
    url: "https://github.com/WebAssembly/js-promise-integration"
wildness:
  rating: 4
  verified: "Checked against Cloudflare's article and official Rust, Emscripten and wasm-bindgen docs; no example or runtime test."
  claimed: "Compatibility claims and the Pumpkin demo are Cloudflare's; no benchmark or audit."
verdict: "Cloudflare’s experimental support for Rust’s Emscripten target widens the Rust that can reach Workers, but it adds a runtime contract to learn. It is experimental, and Cloudflare's demo shows compatibility, not performance."
---

## What Cloudflare is announcing

Cloudflare’s [28 September 2026 announcement](https://blog.cloudflare.com/rust-workers-emscripten-target/) describes the first public experimental preview of support for Rust’s `wasm32-unknown-emscripten` target in [wasm-bindgen](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html) and Cloudflare Workers. Cloudflare says the work is intended to improve support for native Rust code and Tokio-based applications running on Workers, while stressing that the feature remains pre-release and experimental.

![A diagram showing Rust source passing through rustc and Emscripten’s linker, with wasm-bindgen adding JavaScript bindings before the result enters a Workers runtime.](/diagrams/rust-on-workers-with-a-runtime-attached/rust-workers-toolchain-split.svg)

The target matters because it brings a different set of assumptions to WebAssembly. Ordinary Rust-to-WebAssembly builds often target `wasm32-unknown-unknown`, a deliberately minimal target that imports no host functions for the standard library. Rust’s platform documentation says that many operating-system-dependent APIs on that target do not work: `std::fs` returns errors, `println!` does nothing, and `std::thread::spawn` panics. The target is useful precisely because it makes few assumptions about its host. ([Rust platform support: `wasm32-unknown-unknown`](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html))

Emscripten takes the opposite approach. Rust’s current nightly platform documentation describes `wasm32-unknown-emscripten` as a target using the Emscripten compiler toolchain, which supplies a POSIX-compatible libc and libstd implementation, many Linux APIs, and interoperability with C, C++, JavaScript, and web APIs. It requires Emscripten’s `emcc` compiler to link the final WebAssembly binary. ([Rust platform support: `wasm32-unknown-emscripten`](https://doc.rust-lang.org/nightly/rustc/platform-support/wasm32-unknown-emscripten.html))

Cloudflare says Emscripten virtualizes selected native behavior through Workers’ Web Platform and Node.js compatibility APIs.

The announcement gives three examples:

- [Building Emscripten Rust Workers](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten)
- [Running Tokio in a Worker](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten-tokio)
- [TCP sockets on Workers with Emscripten and Tokio](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten-tcp)

Cloudflare describes a [Pumpkin Minecraft server port built by Dan Lapid](https://github.com/danlapid/rust-workers-minecraft) that runs inside a Durable Object. That is evidence that this compatibility path can support a substantial application with native-style assumptions. It is not a benchmark, a general compatibility certification, or proof that every Tokio application will run unchanged.

## Why Emscripten changes the Rust portability question

The ordinary `wasm32-unknown-unknown` target is intentionally spare. Rust’s documentation says it has full `core` and `alloc` support, but many parts of `std` that require an operating system either fail or are unavailable. It also says the target has no equivalent C/C++ toolchain, recommending `wasm32-unknown-emscripten` when web-based C/C++ interoperability is needed. ([Rust platform support: `wasm32-unknown-unknown`](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html))

That design is often exactly right. A small WebAssembly module with explicit imports can be easier to understand, faster to start, and more portable across hosts. The [wasm-bindgen guide](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html) says `wasm32-unknown-unknown` remains the default when the smallest runtime and fastest cold start are the priority.

Emscripten is for a different class of program. Its target documentation says it provides a libc and libstd implementation, access to many Linux APIs, and the ability to interoperate with Emscripten’s C/C++ and JavaScript ecosystem. The wasm-bindgen documentation adds that Emscripten links libc, an in-memory filesystem, POSIX-style APIs, and its own JavaScript runtime around the WebAssembly module. ([`wasm-bindgen` Emscripten target](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html))

That compatibility layer changes what “portable Rust” can mean. A crate that assumes `std::fs`, timers, sockets, or a Unix-like target family may have a path forward without being rewritten around browser-specific APIs. A crate that links C or C++ code can use Emscripten’s toolchain rather than inventing a separate WebAssembly integration.

The word “can” is doing real work here. Emscripten does not make every native assumption true. It supplies implementations and virtualization layers whose behavior depends on the host, the link flags, and the specific API. The [Emscripten runtime documentation](https://emscripten.org/docs/porting/emscripten-runtime-environment.html) explains that its virtual filesystem makes ordinary file calls possible, but the default in-memory filesystem loses changes when the page reloads. Node.js builds can mount a filesystem that accesses the local filesystem, while browser builds use different storage arrangements.

Workers adds another host-specific layer. Cloudflare says its Node.js compatibility APIs provide the base for virtualizing native timers, filesystem operations, and sockets. That statement describes Cloudflare’s experimental integration; it is not a promise that arbitrary native code can perform blocking operating-system calls inside a Worker.

![A diagram showing native-style Rust operations passing through Emscripten’s virtual filesystem, socket, timer, and libc layers into Workers and Node.js compatibility APIs.](/diagrams/rust-on-workers-with-a-runtime-attached/emscripten-platform-bridge.svg)

The distinction is easiest to see as a stack:

1. Rust code calls a standard-library or platform-facing API.
2. Rust’s Emscripten target links against Emscripten’s libc and runtime.
3. Emscripten translates or virtualizes the operation.
4. The generated JavaScript and WebAssembly interact with the host’s APIs.
5. The host still decides what asynchronous, filesystem, socket, and timer behavior is actually possible.

That stack is valuable for developers maintaining existing code. It is also another layer to debug. A failure may belong to Rust’s target configuration, a crate’s platform gates, Emscripten’s runtime, wasm-bindgen’s bindings, or Workers’ host integration.

## Two WebAssembly toolchains, one build

The unusual part of Cloudflare’s work is not simply “compile Rust with Emscripten.” It is making Emscripten and wasm-bindgen cooperate.

The [Cloudflare announcement](https://blog.cloudflare.com/rust-workers-emscripten-target/) explains the original conflict: both toolchains assumed they were responsible for loading JavaScript and producing the final JavaScript and WebAssembly output. Emscripten was good at linking C++ dependencies and producing a JavaScript companion runtime. wasm-bindgen was good at generating bindings between Rust and JavaScript. Using both naïvely meant two systems competing to own the final module.

The cooperative design assigns them different jobs. Emscripten continues to drive the build, load the WebAssembly module, and provide its companion JavaScript. wasm-bindgen produces a smaller portable bindings layer that Emscripten can include through its library system.

The integration is enabled by the `-sWASM_BINDGEN` configuration. The [wasm-bindgen Emscripten documentation](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html#how-it-works) explains that `rustc` drives `emcc` as the linker. When `-sWASM_BINDGEN` is present, `emcc` detects the marker section embedded by the wasm-bindgen crate, runs the wasm-bindgen CLI over the linked WebAssembly as a post-link step, and incorporates the generated binding library into Emscripten’s JavaScript output.

The resulting division looks like this:

- **Rustc** compiles the Rust program for `wasm32-unknown-emscripten`.
- **`emcc`** acts as the linker and assembles the Emscripten runtime.
- **Emscripten** supplies the C/C++ and platform-facing layer.
- **wasm-bindgen** generates the Rust-to-JavaScript binding layer.
- **The Workers runtime** loads the resulting JavaScript and WebAssembly in the Worker environment.

This is not merely a packaging detail. It is what allows a Rust application to use both an Emscripten-oriented compatibility layer and the `#[wasm_bindgen]` API without forcing developers to choose one toolchain.

The wasm-bindgen guide documents a quick-start configuration that includes `-sWASM_BINDGEN`, `-sMODULARIZE`, and `-sEXPORT_ES6`. It says the build produces a JavaScript module and WebAssembly output, with the JavaScript module exposing the generated API. The same guide describes Emscripten’s output as a self-contained main module: the crate is built as a binary, while a `cdylib` is treated as an Emscripten side module rather than the usual package shape. ([Build configuration](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html#build-configuration))

The integration also works in the other direction. Cloudflare says C++ code driven by Emscripten can link static Rust code while supporting both binding layers, and Rust applications driven by Rust’s compiler can target Emscripten while supporting Emscripten’s bindings alongside wasm-bindgen’s. Those are statements about the supported design and current patchsets, not independent compatibility testing across the C++ ecosystem.

## The Workers build path

The basic build path starts with the Emscripten Rust target and the Emscripten compiler toolchain. Rust’s platform page documents adding the target with `rustup target add wasm32-unknown-emscripten`, while Emscripten’s `emcc` must be installed and available to link the program. ([Rust target requirements](https://doc.rust-lang.org/nightly/rustc/platform-support/wasm32-unknown-emscripten.html#requirements))

The [wasm-bindgen guide’s quick start](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html#quick-start) specifies Emscripten 6.0.10 or newer and a wasm-bindgen CLI version matching the crate version in `Cargo.lock`. It also describes Emscripten packages as binary crates: the default shape is a `src/main.rs` rather than a library crate with `crate-type = ["cdylib"]`.

For the Workers examples, Cloudflare supplies a `worker-build --emscripten` workflow. The [Emscripten example in `workers-rs`](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten) is the practical reference for the project’s current build arrangement. The flag tells the Workers build tooling to use the Emscripten target and link path rather than the ordinary Rust Workers WebAssembly path.

The important conceptual sequence is:

1. Cargo resolves and compiles the Rust program for `wasm32-unknown-emscripten`.
2. Rustc invokes `emcc` as the linker.
3. Emscripten links the WebAssembly module and its runtime.
4. With `-sWASM_BINDGEN`, Emscripten invokes wasm-bindgen as a post-link step.
5. The resulting JavaScript and WebAssembly are packaged into the Worker.
6. The Worker runtime provides the host APIs that the Emscripten configuration expects.

The exact flags are part of the experimental workflow and may change. The wasm-bindgen documentation marks Emscripten support as experimental and says flags and output shape may still change. ([wasm-bindgen Emscripten target](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html))

That warning matters more here than it would for a normal stable target. A successful local build is not enough. The Emscripten version, wasm-bindgen CLI version, Rust toolchain, link flags, Workers compatibility settings, and any Cloudflare-specific patches need to remain aligned.

The Rust platform page adds another compatibility warning: Emscripten does not follow a semantic-versioning scheme that clearly identifies ABI-breaking changes, and even one Emscripten version can expose different ABIs depending on linker flags. Rust’s documentation recommends rebuilding the Rust standard library with the local Emscripten version and settings when ABI alignment matters. ([Emscripten ABI compatibility](https://doc.rust-lang.org/nightly/rustc/platform-support/wasm32-unknown-emscripten.html#emscripten-abi-compatibility))

The Workers examples therefore demonstrate a coordinated toolchain, not a single compiler switch. Developers adopting the preview should treat the example repository and linked documentation as versioned experimental guidance, then test their own dependency graph.

## `wasm32-unknown-emscripten` versus `wasm32-unknown-unknown`

The two targets make different promises.

`wasm32-unknown-unknown` is the minimal target. Rust documents it as importing no host functions for the standard library. It supports `core` and `alloc`, and parts of `std`, but APIs requiring an operating system may return errors or panic. The documentation gives `std::fs`, `println!`, and `std::thread::spawn` as concrete examples. ([Rust platform support: `wasm32-unknown-unknown`](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html))

`wasm32-unknown-emscripten` is a toolchain-backed target. Rust documents it as providing POSIX-compatible libc and libstd implementations, many Linux APIs, C/C++ interoperability, JavaScript execution, and web API access through Emscripten’s ecosystem. It requires `emcc` and carries Emscripten ABI considerations. ([Rust platform support: `wasm32-unknown-emscripten`](https://doc.rust-lang.org/nightly/rustc/platform-support/wasm32-unknown-emscripten.html))

The practical comparison is:

| Concern | `wasm32-unknown-unknown` | `wasm32-unknown-emscripten` |
|---|---|---|
| Host assumptions | Minimal; no standard host imports | Emscripten runtime and host integration |
| C/C++ toolchain | Rust documents no equivalent C/C++ toolchain | Emscripten provides the C/C++ toolchain |
| `std::fs` | Returns errors | Emscripten supplies a virtual filesystem layer |
| JavaScript interop | Commonly uses wasm-bindgen | Uses wasm-bindgen together with Emscripten’s runtime |
| Runtime size and startup | Rust’s wasm-bindgen guide calls it the smallest-runtime, fastest-cold-start default | More runtime machinery for broader compatibility |
| ABI/toolchain concerns | Fewer Emscripten-specific ABI concerns | Emscripten version and link settings must align |

The table describes documented target properties, not a universal performance ranking. A small `wasm32-unknown-unknown` module will often have less runtime machinery, but the right choice depends on what the application needs.

For a Rust library that is already written around explicit JavaScript calls and does not need filesystem, socket, or POSIX-style behavior, `wasm32-unknown-unknown` remains the simpler target. For a project that links C or C++, uses more of `std`, or depends on native-style facilities that Emscripten can virtualize, `wasm32-unknown-emscripten` offers a broader compatibility path.

Workers introduces the final qualification. Emscripten can provide the abstraction, but Workers must provide the host-side implementation. Cloudflare’s preview uses Node.js compatibility APIs for the filesystem, timers, and sockets described in the announcement. That is why the same source target can behave differently in a browser, Node.js, and Workers.

The target involves a contract among Rust, Emscripten, wasm-bindgen, the generated JavaScript, and the host runtime. When those layers agree, more native assumptions can survive the trip to WebAssembly. When they do not, a mismatch can arise in any of those layers.

## What becomes more portable

The practical promise of Emscripten is not that every native Rust program becomes a Workers program unchanged. It is that more programs can retain assumptions that the minimal WebAssembly target does not provide by itself.

With `wasm32-unknown-unknown`, Rust’s standard library is available in a deliberately limited environment. The target has no operating system beneath it, and operations that depend on an OS, such as ordinary filesystem access, native threads, or sockets, do not acquire working host behavior merely because the code compiled. The [Rust platform-support documentation](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html) describes the target as a bare WebAssembly environment with a minimal standard-library implementation.

Emscripten takes a different approach. It supplies a libc and a runtime layer intended to make software written with conventional platform assumptions more portable to WebAssembly. Its [runtime-environment documentation](https://emscripten.org/docs/porting/emscripten-runtime-environment.html) describes the JavaScript and WebAssembly support around compiled programs, while its [filesystem documentation](https://emscripten.org/docs/porting/files/file_systems_overview.html) describes the virtual filesystem model. Its [networking documentation](https://emscripten.org/docs/porting/networking.html) explains that networking behavior is implemented through the host environment rather than by giving WebAssembly a native socket API.

That difference is useful for Rust crates with dependencies outside Rust’s pure computation core.

A crate that includes C or C++ code may already expect a libc, a linker, filesystem calls, or a conventional process environment. A project that uses `std::fs` may be expressing an interface that Emscripten can virtualize, even though the underlying storage is not a native disk. A library that assumes sockets or timers may have a path through Emscripten’s compatibility layer instead of requiring a complete rewrite for the Workers runtime.

Cloudflare says Emscripten virtualizes timers, filesystem operations, and sockets through Workers’ Node.js compatibility APIs. It says its [`-sNODERAWSOCKETS`](https://emscripten.org/docs/tools_reference/settings_reference.html#noderawsockets) work took over 40 Emscripten pull requests. Those are Cloudflare’s engineering claims and history; the article is evidence that the integration was built, not an independent audit of every supported operation.

![A paper-cut collage of a small staged cream room inside a large slate-blue glass box, joined to a layered landscape outside by a single coral thread.](https://media.aitamer.news/posts/rust-on-workers-with-a-runtime-attached/emscripten-virtual-room.jpg)

The word “virtualize” should remain visible in the explanation. A virtual filesystem is not a disk. A socket compatibility layer is not a native TCP stack exposed directly to WebAssembly. A timer implemented through the host event loop does not behave like a thread sleeping inside a conventional operating system.

That distinction determines what developers should test.

A dependency may compile and still fail when it reaches an unsupported operation. A file path may resolve inside an Emscripten filesystem without persisting where the developer expects. A socket API may require asynchronous host integration. A library that assumes it can block a worker thread may need a different execution path. The Emscripten target expands the compatibility surface; it does not erase the host’s execution model.

For Rust developers, the likely beneficiaries are projects whose difficult dependencies are already portable through Emscripten’s C and C++ ecosystem, or whose native-style APIs can be mapped onto the documented Workers integration. The likely poor fits are projects whose correctness depends on unrestricted OS access, native process control, or blocking threads with no asynchronous equivalent.

## Tokio meets Workers

Tokio is designed around asynchronous tasks, but a runtime still needs a way to poll those tasks and wait for external events. On a conventional operating system, that waiting can be connected to an OS reactor and a thread scheduler. Workers has a JavaScript event loop with its own rules. A WebAssembly module cannot simply park the Worker’s execution thread until a socket or timer becomes ready.

![A paper-cut collage showing two cream paths leaving a slate-blue Tokio loop: one descends into suspended layers and the other returns to a host loop through a coral waker.](https://media.aitamer.news/posts/rust-on-workers-with-a-runtime-attached/tokio-two-paths.jpg)

That is the central mismatch.

Cloudflare describes two experimental Tokio paths: [JavaScript Promise Integration, or JSPI](https://github.com/WebAssembly/js-promise-integration), and a proposed `LocalEventLoop` implemented in a pre-release patchset. Both approaches aim to let asynchronous Rust code yield to the host rather than blocking it. They differ in where the suspension is represented and who drives the next poll.

The distinction is architectural:

- JSPI lets a WebAssembly call stack suspend while a JavaScript promise is pending, then resume later.
- `LocalEventLoop` keeps the scheduling decision explicit: poll ready work, return to the host, and ask the host to drive the loop again when readiness occurs.

Neither approach turns Workers into a native Tokio host. Both adapt Tokio’s expectations to the host’s event loop.

That matters for crates that merely use Tokio as an implementation detail. A library may compile against Tokio and still depend on runtime behavior that the Workers environment does not provide. The relevant question is not “does this crate mention Tokio?” It is “how does this crate wait, wake, spawn, and interact with I/O?”

![A diagram showing a Tokio task suspending through JSPI, returning control to the JavaScript event loop, and resuming the suspended stack after the operation becomes ready.](/diagrams/rust-on-workers-with-a-runtime-attached/tokio-jspi-flow.svg)

## Approach one: JSPI

JSPI, the WebAssembly JavaScript Promise Integration proposal, gives WebAssembly a mechanism for suspending a call stack when JavaScript work produces a promise and resuming it after that promise settles. Cloudflare uses this model to support a Tokio runtime that expects a task to be able to park while waiting for readiness.

The shape is familiar to asynchronous Rust:

1. a Tokio task reaches an operation that is not ready;
2. the runtime arranges for the operation to produce or await a host promise;
3. JSPI suspends the WebAssembly stack;
4. the JavaScript event loop continues running;
5. readiness settles the promise;
6. the suspended WebAssembly computation resumes and Tokio polls the task again.

The important word is “suspends,” not “blocks.” The Worker remains available to run the host’s event loop while the WebAssembly stack is paused.

The difficult part is runtime context. A conventional Tokio runtime uses thread-local assumptions to identify the current runtime while a task is being polled. JSPI can create suspended and resumed call stacks that re-enter WebAssembly in ways a single thread-local context does not describe cleanly. Cloudflare’s article explains that the JSPI approach therefore needs runtime context associated with the suspended execution rather than treating the Worker’s one JavaScript thread as if it were the whole scheduling story.

That is a subtle but important boundary. “Workers is single-threaded” does not mean “there is only one logical asynchronous execution context.” Several operations can be suspended, and their continuations can resume later. The runtime must preserve the association between a resumed stack and the Tokio state that owns it.

JSPI is attractive because it lets code retain a more conventional blocking-looking structure at the point where it awaits. The compiler and runtime machinery express the suspension to the host. The cost is dependence on JSPI support and on careful handling of reentrant execution contexts.

The approach also has a portability implication. Code written for a native Tokio runtime may assume that a blocking call, a runtime handle, or a thread-local context behaves in a particular way. JSPI can make some of those assumptions workable, but it does not certify every native dependency. The integration still depends on the operation eventually yielding through a supported host path.

Cloudflare presents JSPI as one experimental route, not as a universal replacement for native Tokio. Its article is the primary source for the Workers-specific implementation details here. The [JSPI proposal](https://github.com/WebAssembly/js-promise-integration) documents the underlying WebAssembly mechanism, but it does not independently establish that every Tokio crate or every Workers deployment behaves correctly with this integration.

## Approach two: `LocalEventLoop`

The second approach avoids suspending an entire WebAssembly stack. Instead, it changes how Tokio is driven.

A custom `LocalEventLoop` polls ready tasks and then returns control to the host when there is no immediate work. It does not park a native thread inside the Worker. When work becomes ready, Tokio calls the host-owned waker, which queues a later `drive()` on the owning thread.

The sequence looks like this:

1. the host calls `drive()` on its `LocalEventLoop` instance (`el.drive()` in Cloudflare’s example);
2. Tokio polls ready tasks;
3. pending operations register their wake paths;
4. the drive call returns to the JavaScript event loop;
5. a host event makes an operation ready;
6. the host-owned waker schedules another drive;
7. `drive()` polls the newly ready tasks.

![A diagram showing Tokio polling ready tasks, returning to the host while waiting, and being driven again by a host-owned waker.](/diagrams/rust-on-workers-with-a-runtime-attached/tokio-local-event-loop-flow.svg)

This makes the host boundary explicit. Tokio does not own the thread’s waiting behavior. The Worker owns the event loop, and Tokio becomes a participant that is periodically driven by it.

The approach resembles an embedded executor more than a conventional process-wide runtime. That can be a better fit for Workers because it respects the platform’s rule that asynchronous work must yield back to JavaScript. It also makes the lifecycle visible: the application or integration must ensure that the event loop is driven again after a wake.

The trade-off is that code cannot assume an ordinary native runtime is silently available. Cloudflare says `LocalEventLoop::block_on` panics if its future needs to wait; code expecting an ordinary Tokio runtime to park needs another path. Code that uses asynchronous tasks and host-compatible I/O has a more plausible path.

The two approaches therefore expose different costs:

- **JSPI** preserves more of the suspended call-stack shape, but requires promise-based stack suspension and careful runtime-context handling.
- **`LocalEventLoop`** makes scheduling and re-entry explicit, but may require code to avoid native blocking assumptions and to cooperate with the host-driven runtime.

Cloudflare’s article presents both as ways to bring Tokio-oriented Rust into Workers. The article does not establish that one is universally faster, more stable, or more compatible than the other. A choice between them should be made per workload and verified against the actual dependencies, I/O patterns, and deployment constraints.

Both approaches point to the same conclusion: the hard part of native Rust on Workers is not producing a `.wasm` file. It is preserving the program’s assumptions about waiting, waking, storage, and execution without violating the host’s event loop.

## The Pumpkin demonstration

Cloudflare’s most concrete demonstration is [Pumpkin](https://github.com/danlapid/rust-workers-minecraft), a Rust-native Minecraft server ported by Dan Lapid to run inside a Durable Object. The example is useful because it exercises more than a small function: it combines a substantial Rust application with Tokio-oriented asynchronous behavior, TCP ingress, filesystem-style operations, and persistent storage.

Cloudflare says Pumpkin’s filesystem calls are forwarded to Durable Object SQLite storage. In that arrangement, the Emscripten layer preserves the application’s filesystem-facing interface while the Worker-side integration maps persistence onto a platform storage service. The application does not receive a conventional local disk; it receives a compatibility path backed by Durable Object storage.

The demonstration’s path can be described as:

1. network traffic enters the Worker;
2. Cloudflare says the experimental TCP ingress path forwards the player’s connection from the Worker’s `connect()` handler into the Durable Object;
3. Pumpkin runs inside that object using the Emscripten-compatible Rust build;
4. Tokio and the host integration coordinate asynchronous work;
5. filesystem operations are forwarded to Durable Object SQLite storage.

That is evidence of compatibility, not a benchmark. The example shows that this combination of application code and platform adaptations can be assembled. It does not establish throughput, latency, memory behavior, player capacity, cost, or production readiness.

It also does not prove that an arbitrary Rust server will work without changes. Pumpkin is one application, built against one set of dependencies and one experimental integration. Other programs may depend on blocking calls, unsupported system APIs, different socket behavior, or assumptions that the Workers host does not provide.

The example is therefore most valuable as a boundary marker. It demonstrates a larger target than the usual “small Rust function compiled to WebAssembly,” while leaving the engineering work of evaluating each application to its developers.

## What remains experimental

Cloudflare labels the Emscripten target an experimental preview. That status applies to the integration as a whole: the build path, the Workers host adaptations, the Tokio approaches, and the compatibility behavior demonstrated by the examples.

The [wasm-bindgen Emscripten documentation](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html) also describes its Emscripten support as experimental. The documentation warns that flags, output shape, and implementation details may change. A build that works with one Rust, Emscripten, wasm-bindgen, and Workers toolchain combination should not be treated as a permanent compatibility contract.

Several boundaries remain especially important.

### The target is not a native operating system

Emscripten supplies compatibility layers. It does not provide unrestricted access to a host filesystem, native process management, arbitrary threads, or a conventional kernel. Workers still owns the execution environment and its event loop. Filesystem calls may map to a virtual or remote-backed store. Socket calls may map to host APIs with different lifecycle and blocking behavior. Timers must cooperate with asynchronous JavaScript execution.

Cloudflare’s article describes these mappings as part of the preview. The article does not establish that every POSIX API, every libc behavior, or every crate with native assumptions is supported.

### Tokio compatibility is path-dependent

JSPI and `LocalEventLoop` solve different parts of the scheduling problem. JSPI suspends a WebAssembly stack through a JavaScript promise. `LocalEventLoop` returns to the host and relies on a later drive triggered by a host-owned waker. Neither approach guarantees that code using Tokio’s APIs will work if it depends on native blocking, thread parking, or runtime behavior outside the integration’s supported path.

The [Tokio runtime documentation](https://docs.rs/tokio/latest/tokio/runtime/) describes the assumptions and facilities of Tokio’s normal runtimes. Cloudflare’s Workers integration adapts those facilities to a different host. Developers need to test the actual operations their dependencies perform rather than infer compatibility from a successful compile.

### Toolchain alignment matters

The Emscripten target depends on a compiler and linker ecosystem rather than only on rustc. The [Rust platform-support documentation](https://doc.rust-lang.org/nightly/rustc/platform-support/wasm32-unknown-emscripten.html) documents Emscripten installation and ABI considerations. It warns that Emscripten versions and linker settings can affect ABI compatibility, and recommends rebuilding the Rust standard library with the local Emscripten configuration when necessary.

The [wasm-bindgen guide](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html#quick-start) likewise requires coordination between the wasm-bindgen CLI and the crate version in `Cargo.lock`. The Workers example adds Cloudflare’s build tooling and runtime assumptions. These pieces should be pinned, tested together, and upgraded deliberately.

### The evidence is narrow

Cloudflare’s examples illustrate particular paths; this story did not independently run them. They do not constitute an independent audit of Cloudflare’s claims. They do not cover every Rust crate, every C or C++ dependency, every storage workload, or every deployment configuration.

The Pumpkin example is not a benchmark. The Tokio examples are not a guarantee of application-wide compatibility. The existence of a virtual filesystem is not proof that persistence semantics match a local disk. A passing build is not proof that failure, cancellation, resource exhaustion, or long-lived connections behave as they would on a native server.

![A paper-cut collage of a small cream game-server fortress inside a slate-blue chamber, connected by a coral line to layered storage below.](https://media.aitamer.news/posts/rust-on-workers-with-a-runtime-attached/pumpkin-in-the-durable-object.jpg)

## Practical guidance for Rust developers

Start with the target choice, not the marketing phrase “native Rust.”

If the application is a small WebAssembly module with explicit JavaScript-facing APIs, `wasm32-unknown-unknown` remains the simpler baseline. Rust’s [platform-support page](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html) describes its minimal host assumptions, and the [wasm-bindgen guide](https://wasm-bindgen.github.io/wasm-bindgen/) documents the ordinary browser and JavaScript integration path.

Consider Emscripten when the dependency graph gives you a concrete reason:

- a C or C++ dependency already expects Emscripten;
- the application uses filesystem-facing APIs that can be mapped to the documented virtual or remote-backed storage path;
- the application uses sockets or timers through an asynchronous compatibility path;
- a native-style crate would otherwise require extensive target-specific rewriting;
- the project can accept an experimental toolchain and host integration.

Then test the whole application, not just a hello-world binary.

### Inspect the dependency graph

Look for:

- direct and transitive C or C++ dependencies;
- calls to `std::fs`, `std::net`, or process APIs;
- thread creation and thread-local assumptions;
- Tokio runtime construction and blocking calls;
- signal handling, environment access, and file locking;
- long-lived sockets and cancellation paths;
- code that assumes a persistent local filesystem.

A crate can compile for Emscripten while still reaching an operation that the Workers host does not support in the way the crate expects.

### Choose the Tokio path deliberately

Use JSPI when the application benefits from suspended asynchronous stacks and the deployment can support the required JSPI integration. Test reentrancy and runtime-context behavior, especially if multiple operations may be suspended at once.

Use `LocalEventLoop` when explicit host-driven polling better matches the application and its dependencies. Make sure every wake path returns control to the host and that no library attempts to block the Worker thread.

Do not treat either path as a drop-in replacement for a native multi-threaded Tokio runtime. Tokio still schedules its tasks, while the host controls when the runtime is driven.

### Treat storage as a different contract

If filesystem calls are mapped to Durable Object SQLite or another host-backed mechanism, test persistence, concurrency, transaction boundaries, startup behavior, and failure recovery. Do not assume that a path that looks like a local file has local-disk semantics.

For cache or temporary files, verify whether data survives restarts and whether multiple Durable Object instances see the same state. For durable application data, use the platform storage API directly when its semantics are clearer than the compatibility layer.

### Keep the preview isolated

Use a separate Worker, Durable Object namespace, database, and storage configuration for experiments. Pin the Rust, Emscripten, wasm-bindgen, Workers SDK, and build-tool versions. Record the link flags and runtime settings that produced a working build.

Start with the [official `workers-rs` examples](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten), then replace one dependency or subsystem at a time. A full application port is difficult to diagnose when the compiler target, runtime, storage, networking, and scheduler all change simultaneously.

### Measure what the demonstration does not prove

A compatibility demo answers “can this path run?” It does not answer:

- how much CPU the application consumes;
- how memory grows under load;
- how sockets behave with many concurrent clients;
- how long filesystem forwarding takes;
- how Durable Object storage affects latency;
- how JSPI and `LocalEventLoop` compare for the workload;
- how the application behaves during cancellation or failure;
- whether the cost model is acceptable.

Those require application-specific tests. Cloudflare’s Pumpkin demonstration should be read as an existence proof for an integration path, not as a performance claim.

## Verdict

Cloudflare’s experimental support for Rust’s Emscripten target changes the shape of Rust that can plausibly run on Workers. It gives projects with C or C++ dependencies, filesystem-facing code, socket assumptions, and Tokio-oriented asynchronous logic a compatibility path that the minimal `wasm32-unknown-unknown` target does not provide by itself.

The price is another runtime contract to understand.

Emscripten virtualizes platform behavior. wasm-bindgen supplies JavaScript bindings. Workers supplies the host APIs and event loop. Cloudflare’s preview explores Tokio integration through JSPI and a proposed host-driven `LocalEventLoop`. Durable Objects can provide a place to run and persist an application, but their storage is not a local disk. The Pumpkin demonstration shows that these pieces can fit together; it does not show that every native Rust workload will.

The experimental preview shows a path for adapting native-oriented Rust to Workers by making its operating-system assumptions explicit and testing the host’s actual behavior.
