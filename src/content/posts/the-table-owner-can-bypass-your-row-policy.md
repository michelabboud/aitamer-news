---
title: The Table Owner Can Bypass Your Row Policy
description: A row policy cannot protect tenant data if the application queries through a role that bypasses it. Check table ownership, privileged roles, and views before relying on row-level security.
pubDate: "2026-10-06T00:00:00Z"
specimen: 289
section: dev
tags:
  - postgresql
  - row-level-security
  - multi-tenancy
  - database-security
draft: false
heroImage: https://media.aitamer.news/heroes/the-table-owner-can-bypass-your-row-policy-b4a6eec0.jpg
heroAlt: A table owner uses a key to pass through a gate that blocks another user from database rows.
author: ari
wildness:
  rating: 2
  verified: PostgreSQL documents owner, superuser, and BYPASSRLS exceptions.
  claimed: A tenant application querying as a table owner may expose other tenants’ rows.
verdict: Before relying on RLS for tenant isolation, verify the query role, table owner, privileged roles, and view path with cross-tenant tests.
sources:
  - title: "PostgreSQL: Row Security Policies"
    url: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
  - title: "PostgreSQL: CREATE ROLE"
    url: https://www.postgresql.org/docs/current/sql-createrole.html
  - title: "PostgreSQL: CREATE VIEW"
    url: https://www.postgresql.org/docs/current/sql-createview.html
  - title: "PostgreSQL: pg_class"
    url: https://www.postgresql.org/docs/current/catalog-pg-class.html
  - title: "PostgreSQL: pg_roles"
    url: https://www.postgresql.org/docs/current/view-pg-roles.html
  - title: "PostgreSQL: pg_policies"
    url: https://www.postgresql.org/docs/current/view-pg-policies.html
---

Row-level security (RLS) lets a PostgreSQL table restrict which rows a user can read or change. Once RLS is enabled, policies govern normal row access. That sounds like a useful boundary for a shared tenant table. The boundary depends on which database role runs the query. PostgreSQL explicitly exempts some roles from the policies. [PostgreSQL’s row-security documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) names the exceptions.

## The owner normally sees every row

A table owner normally bypasses its table’s row policies. Imagine an application that connects as the role that created its `invoices` table. The table has an enabled policy intended to match each invoice to the current tenant. A direct query through that owner role does not get the expected policy filter. The application may therefore read rows belonging to other tenants, even though the policy exists and is enabled. This follows from PostgreSQL’s documented [owner exception](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

A policy is also separate from ordinary table privileges. PostgreSQL checks whether a role can use a table through its privilege system; RLS then restricts rows for roles subject to its policies. Enabling RLS with no policy gives those roles a default denial of row access. None of that makes the owner subject to the policy by default. Seeing an enabled policy in a schema review is therefore insufficient evidence that the application’s queries are filtered. [The RLS rules](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) describe each of these behaviors.

## FORCE changes the owner’s query behavior

PostgreSQL provides `ALTER TABLE ... FORCE ROW LEVEL SECURITY` to make the table owner subject to row policies. For a tenant table, the command is `ALTER TABLE invoices FORCE ROW LEVEL SECURITY;`. RLS must also be enabled on that table. The [row-security documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) describes both settings, and the [`pg_class` catalog](https://www.postgresql.org/docs/current/catalog-pg-class.html) records them separately as `relrowsecurity` and `relforcerowsecurity`.

FORCE helps catch owner queries that would otherwise bypass a policy. It does not make an untrusted owner safe. PostgreSQL reserves enabling and disabling RLS, and adding policies, to the table owner. An owner that can change those settings can remove the restriction it is supposed to obey. The practical design is to keep the role used for routine application queries separate from the role that owns and maintains tenant tables. This recommendation follows from the documented [owner powers and bypass rules](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

## Privileged roles have another route around policies

Superusers and roles with the `BYPASSRLS` attribute always bypass row security when accessing a table. FORCE does not change that exception. PostgreSQL’s [`CREATE ROLE` documentation](https://www.postgresql.org/docs/current/sql-createrole.html) says `NOBYPASSRLS` is the default and describes `BYPASSRLS` as bypassing every RLS policy. A service account with that attribute is a poor choice for routine tenant requests, regardless of how carefully its row policies are written.

An audit should examine the actual roles used by the application, workers, scheduled jobs, and support paths. The [`pg_roles` view](https://www.postgresql.org/docs/current/view-pg-roles.html) exposes `rolsuper` and `rolbypassrls`, so these privileges can be checked directly. A role name that sounds limited is no substitute for its recorded attributes.

## Views can change whose policy applies

A query may reach a tenant table through a view. By default, PostgreSQL checks access to a view’s underlying tables using the view owner’s permissions. When an underlying table has RLS enabled, the view owner’s policies apply by default. If that owner is also the table owner, its normal RLS bypass matters to users querying through the view. PostgreSQL documents these rules under [`CREATE VIEW`](https://www.postgresql.org/docs/current/sql-createview.html).

A view with `security_invoker = true` instead checks the underlying tables using the invoking user’s permissions and policies. That choice also means the caller needs the relevant permissions on the view and its base tables. Review the view owner and this setting together; changing the setting without checking grants can break an intended access path. The [view documentation](https://www.postgresql.org/docs/current/sql-createview.html) states both effects.

## Tests must use the application’s role

A test run as the table owner can produce a misleading result. It may show rows that a limited role cannot see, or hide the fact that the application itself uses the owner role. Run isolation checks through the same database role and view path used for tenant requests. Give the test data at least two distinct tenants. Check reads, updates, deletes, and inserts, including attempts to move a row across the tenant boundary. PostgreSQL distinguishes the rows a policy makes available from the new rows its `WITH CHECK` expression permits. Its [RLS examples](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) show why both sides need attention.

Review policy definitions as well as behavior. [`pg_policies`](https://www.postgresql.org/docs/current/view-pg-policies.html) shows each policy’s roles, command, qualifying expression, and `WITH CHECK` expression. Catalog inspection can reveal missing or overly broad policies. A query through the real application role then establishes whether the intended restriction applies along that access path.

## What to do

1. List every tenant table and identify its owner. Check `relrowsecurity` and `relforcerowsecurity` in [`pg_class`](https://www.postgresql.org/docs/current/catalog-pg-class.html). Treat enabled RLS and forced owner enforcement as separate facts.
2. Identify the database roles used for tenant requests and background work. Check `rolsuper` and `rolbypassrls` in [`pg_roles`](https://www.postgresql.org/docs/current/view-pg-roles.html). Use roles without those bypass privileges for routine tenant access.
3. Keep table ownership with a separate maintenance role. If owner queries should also obey policies, enable RLS and apply `FORCE ROW LEVEL SECURITY`. Keep control over policy changes with trusted operators. These steps follow the documented [owner and privileged-role rules](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
4. Review views that expose tenant tables. Check their owners and whether `security_invoker` fits the intended permission path, including the caller’s base-table grants. [PostgreSQL documents the tradeoff](https://www.postgresql.org/docs/current/sql-createview.html).
5. Test cross-tenant reads and writes through the exact roles and paths the application uses. Repeat those checks when ownership, grants, policies, or views change. The result worth trusting is the behavior of the route that serves the request.
