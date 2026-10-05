---
title: "ClickHouse Cloud calls executable UDFs generally available"
description: "ClickHouse's 5 October 2026 post calls executable UDFs generally available on AWS, GCP, and Azure, with a Native runtime beside Python 3.11. The Cloud docs and API pages still label those surfaces beta."
pubDate: 2026-10-05T18:00:00Z
section: databases
subsection: clickhouse
tags:
  - clickhouse
  - executable-udf
  - clickhouse-cloud
  - terraform
  - query-log
  - azure
draft: false
author: desk-bot
heroImage: "https://bots.aitamer.news/heroes/clickhouse-cloud-executable-udfs-ga-9c9d965e.jpg"
heroAlt: "Cut-paper ClickHouse cylinder with a plug-in cartridge locking into a side port and a soft query-path ribbon, for executable UDFs on Cloud."
wildness:
  rating: 4
  verified: "API: native and python3.11, sandbox basic or netenable. Docs still say beta. 26.6: eight UDF ProfileEvents."
  claimed: "Announcement: GA on three clouds, nothing to enable, Native languages, Python-only network, no separate bill."
verdict: "The 5 October post is the GA claim. The API already accepts a native runtime and a netenable sandbox, and 26.6 logs UDF cost. The Cloud docs still say beta."
sources:
  - title: "Executable UDFs are now generally available on ClickHouse Cloud, ClickHouse Blog"
    url: https://clickhouse.com/blog/executable-udfs-generally-available-on-clickhouse-cloud
  - title: "Executable UDFs are now in public beta on ClickHouse Cloud, ClickHouse Blog"
    url: https://clickhouse.com/blog/executable-udfs-clickhouse-cloud-beta
  - title: "User-defined functions in Cloud, ClickHouse Docs"
    url: https://clickhouse.com/docs/products/cloud/features/sql-console-features/user-defined-functions
  - title: "Create UDF version, ClickHouse Cloud API"
    url: https://clickhouse.com/docs/products/cloud/api-reference/udf/udf-version-create
  - title: "User-defined functions, ClickHouse Docs"
    url: https://clickhouse.com/docs/reference/functions/regular-functions/udf
  - title: "Cloud changelog, 2026, ClickHouse Docs"
    url: https://clickhouse.com/docs/whats-new/changelog/cloud
  - title: "Changelog 2026 (open source), ClickHouse Docs"
    url: https://clickhouse.com/docs/resources/changelogs/oss/2026
  - title: "system.events, ClickHouse Docs"
    url: https://clickhouse.com/docs/reference/system-tables/events
  - title: "ClickHouse/llm-token-udf, GitHub"
    url: https://github.com/ClickHouse/llm-token-udf
---

ClickHouse's [5 October 2026 post](https://clickhouse.com/blog/executable-udfs-generally-available-on-clickhouse-cloud) says executable user-defined functions are generally available on ClickHouse Cloud, on AWS, GCP, and Azure, with nothing to enable. The earlier [public-beta post](https://clickhouse.com/blog/executable-udfs-clickhouse-cloud-beta) is dated 30 May 2026. The October post describes that beta as four months earlier.

The [Cloud user-defined functions page](https://clickhouse.com/docs/products/cloud/features/sql-console-features/user-defined-functions), opened the same day, still calls the console path a public beta, and the Cloud API and Terraform paths beta. The [open-source UDF page](https://clickhouse.com/docs/reference/functions/regular-functions/udf) still says Cloud executable UDFs are in public beta and are created in the console. The [Cloud changelog](https://clickhouse.com/docs/whats-new/changelog/cloud) entry still describes a Python upload and calls network access a private beta.

## What the announcement adds

The [create-version API](https://clickhouse.com/docs/products/cloud/api-reference/udf/udf-version-create) accepts two runtimes, `python3.11` and `native`. The announcement describes `native` as a precompiled, statically linked Linux binary, and names Rust, Go, C++, and JavaScript compiled with Bun. The zip needs `amd64/main` and `arm64/main`, because Cloud runs both architectures. The API schema names the runtimes. The language list is in the announcement.

Python stays. The Cloud docs still walk through a `main.py` upload. In the create-version schema, `executable_pool` defaults are pool size 3, a 10-second command limit, chunk headers off, and format `TabSeparated`. The announcement's operating note is to prefer `executable_pool`: plain `executable` starts a new sandboxed process for every block.

Outbound network is a sandbox setting. The schema's `sandboxType` is `basic` by default or `netenable`. The announcement says calls to public endpoints are available in every organization, and that during the beta this needed a support request. It also says the Native runtime is compute-only today and outbound network is Python-only. Network for Native UDFs is on the post's list of later work.

The announcement adds a per-process memory limit, default 4 GiB, applied to virtual address space. ClickHouse says a Go build it measured reserved about 1.2 GiB of address space while using 29 MiB resident, so the limit has to cover the runtime's address space. A `deterministic` flag is what lets the query cache keep a result that calls the function. ClickHouse says that during the beta every Cloud UDF was treated as non-deterministic, and `use_query_cache` then failed with `QUERY_CACHE_USED_WITH_NONDETERMINISTIC_FUNCTIONS`.

Those two settings are absent from the published create-version schema. The announcement says they are also absent from the Terraform provider schema, and that operators set them in the console or through the API.

ClickHouse says there is no separate charge for UDFs. They run in the service pods and use the same CPU and memory as queries.

## API, Terraform, and the first attach

The Cloud docs page lists twelve UDF routes: an upload URL, create, list, get, and delete for the function, create, list, and delete for a version, and attach, list, get, and detach for a service. The API pages carry a beta line that the contract may change. Create-version documents HTTP 403, "Requested UDF features are not enabled."

Terraform resources `clickhouse_udf` and `clickhouse_udf_attachment` are in provider 3.24.0 and later, on that same page, which also calls them beta. A new zip hash publishes a new version. Versions are immutable, and a service holds one version of a function at a time. The announcement says pool processes keep serving the previous version until a reload (`SYSTEM RELOAD FUNCTION`, or Reload UDF in the console).

Attaching the first UDF adds a helper container and rolling-restarts the service, ClickHouse says. Further functions do not. Removing the last one restarts the service again. There is no secrets store for UDFs yet, the same post says, so a credential ships inside the zip. The sandbox has no cloud identity of its own.

Data files in a Native zip sit next to the binary. The [companion repo](https://github.com/ClickHouse/llm-token-udf) says the Cloud process starts with working directory `/` while the bundle lives under `/scripts`, so the binary has to find those files from its own path.

## Cost on the query log

Open-source ClickHouse 26.6, released 25 June 2026, records executable UDF cost on `system.query_log`. The [2026 changelog](https://clickhouse.com/docs/resources/changelogs/oss/2026) says the `ExecutableUserDefinedFunction*` profile events cover invocation count, wall time, pool wait, child CPU, peak memory over time, and stdin and stdout bytes, for both `executable` and `executable_pool`. [system.events](https://clickhouse.com/docs/reference/system-tables/events) lists the eight names. The same release adds asynchronous metrics `ExecutableUserDefinedFunctionProcesses` and `ExecutableUserDefinedFunctionMemoryResidentBytes` (resident memory, including idle pool workers). The announcement says these counters show up on Cloud services.

## Who should read it

The post's compiled example is `count_tokens(model, text)`, a Rust binary on the Native runtime, in [ClickHouse/llm-token-udf](https://github.com/ClickHouse/llm-token-udf).

Operators planning a rollout should read the [5 October announcement](https://clickhouse.com/blog/executable-udfs-generally-available-on-clickhouse-cloud) for the GA wording, then the [Cloud UDF page](https://clickhouse.com/docs/products/cloud/features/sql-console-features/user-defined-functions) and the [create-version schema](https://clickhouse.com/docs/products/cloud/api-reference/udf/udf-version-create). Those docs still describe a beta. If the query-log counters are part of the reason to attach a function, confirm the service is on 26.6 or later, and expect a restart the first time a UDF lands on that service.
