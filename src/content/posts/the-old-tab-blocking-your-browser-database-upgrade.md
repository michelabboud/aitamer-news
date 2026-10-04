---
title: The Old Tab Blocking Your Browser Database Upgrade
description: An older tab can leave an IndexedDB schema upgrade waiting. Here is how versionchange and blocked coordinate the handoff, and how to give users a clear way forward.
pubDate: "2026-10-05T22:00:00Z"
specimen: 285
section: dev
tags:
  - indexeddb
  - browser-storage
  - javascript
  - web-development
draft: false
heroImage: https://media.aitamer.news/heroes/the-old-tab-blocking-your-browser-database-upgrade-1c1f5ded.jpg
heroAlt: An old browser tab keeps a local database locked while construction equipment waits to upgrade it.
author: ari
wildness:
  rating: 2
  verified: IndexedDB sends versionchange to open connections and blocked to a waiting upgrade request.
  claimed: An old tab can keep a schema upgrade waiting until its connection closes.
verdict: "Handle both sides of the wait: close old connections after preserving work, and explain the pending upgrade in the new tab."
sources:
  - title: Using IndexedDB | MDN
    url: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
  - title: "IDBOpenDBRequest: blocked event | MDN"
    url: https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest/blocked_event
  - title: "IDBDatabase: versionchange event | MDN"
    url: https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/versionchange_event
  - title: Indexed Database API 3.0 | W3C
    url: https://w3c.github.io/IndexedDB/
---

A new tab opens your app and asks IndexedDB for a higher database version. The page waits. Another tab may still hold a connection to the old version, even if that tab looks idle. The browser cannot start the schema upgrade while that connection remains open. The IndexedDB specification gives both pages a way to respond: the existing connection receives `versionchange`, and the new open request can receive `blocked`. The wait ends when the older connections close. [IndexedDB specification](https://w3c.github.io/IndexedDB/)

## A database version controls its structure

An app passes a version number to `indexedDB.open(name, version)`. When that number is higher than the stored database version, IndexedDB runs an upgrade. The app changes object stores and indexes in its `upgradeneeded` handler. A normal open that requests the current version has no schema change to run. [MDN's IndexedDB guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

Now picture two tabs of the same app. One opened the database before the app changed. The other loads newer code and requests a higher version. The older tab can keep using its existing connection. IndexedDB permits multiple clients, including pages and workers, to use a database at once. An upgrade has a stricter requirement: every other connection to that database must close before the upgrade starts. That rule keeps a client using the old structure from sharing the database with an upgrade that changes it. [IndexedDB specification](https://w3c.github.io/IndexedDB/)

An open connection blocks the upgrade. A tab is a useful clue because it often owns the connection. A worker can own one too. Closing a tab is one way to release its connection; an app can also call `db.close()` while the page remains open. [IndexedDB specification](https://w3c.github.io/IndexedDB/)

## The old connection hears first

When a higher version is requested, the browser queues a `versionchange` event for other open connections. The handler belongs on the `IDBDatabase` object returned by an earlier successful open. Its job is to make room for the new version. The app can save unsaved work, close the connection, stop issuing database operations through it, and ask the user to reload. The specification describes both reloading and calling `close()` as ways to release the connection. [IndexedDB specification](https://w3c.github.io/IndexedDB/)

Calling `db.close()` marks the connection for closure. Existing transactions are allowed to finish, while new transactions cannot start on that connection. This matters if the page was already writing data when the upgrade request arrived. Closing the connection is a transition in the app's state, so code that still expects to use that `db` object needs to stop or reopen after the page has updated. [IndexedDB specification](https://w3c.github.io/IndexedDB/)

The same event can also arrive when another client requests database deletion. A page that handles `versionchange` as a signal to finish work and release its connection covers that case as well. [MDN's versionchange reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/versionchange_event)

## The new request reports a continuing wait

After the existing connections have had their `versionchange` events, the browser checks whether any remain open. If they do, it fires `blocked` on the new `IDBOpenDBRequest` and waits for those connections to close. `blocked` reports a pending upgrade. The request remains in progress. Once the other connections close, the upgrade can proceed to `upgradeneeded`; a successful open then reaches `success`. [IndexedDB specification](https://w3c.github.io/IndexedDB/) [MDN's blocked event reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest/blocked_event)

A useful `blocked` message tells the user what to do: save work in other tabs of this site, then close or reload them. Keep a separate error handler for a real open failure. The specification's example waits briefly before showing a blocked message, leaving time for other clients to save and disconnect. Clear the waiting message when the request proceeds. [IndexedDB specification](https://w3c.github.io/IndexedDB/)

## Put each handler on its own object

The two events serve different sides of the same upgrade. Register `blocked` on the request that asks for the new version. Register `versionchange` on every connection you keep after a successful open. If an older tab never installs that second handler, it can hold the upgrade until it closes. MDN's guide shows this pairing and recommends a reload or close notice for the older page. [MDN's IndexedDB guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

This small pattern shows where the handlers belong. The display and database functions stand for your app's own user interface and data access code:

```js
const request = indexedDB.open("notes", 2);

request.onblocked = () => showWaitingForOtherTabs();
request.onupgradeneeded = () => {
  const db = request.result;
  if (!db.objectStoreNames.contains("drafts")) {
    db.createObjectStore("drafts", { keyPath: "id" });
  }
};
request.onerror = () => showOpenError(request.error);
request.onsuccess = () => {
  const db = request.result;
  db.onversionchange = () => {
    stopUsingDatabase();
    db.close();
    showReloadNotice();
  };
  hideWaitingForOtherTabs();
  useDatabase(db);
};
```

This example closes at once. If the page holds unsaved input, preserve it before closing or reloading. The specification places that save step ahead of both options. [IndexedDB specification](https://w3c.github.io/IndexedDB/)

The handler on the old connection must be present in the code that actually runs in that old tab. Adding it only to a newly loaded page cannot change code already running elsewhere. That follows from where `versionchange` is delivered: to each existing connection. [IndexedDB specification](https://w3c.github.io/IndexedDB/)

## What to do

1. When opening a database at a higher version, attach `blocked`, `upgradeneeded`, `error`, and `success` handlers to that open request. Use `blocked` to explain the wait and `error` to report an actual failure. [MDN's IndexedDB guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) [MDN's blocked event reference](https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest/blocked_event)
2. On every successful open, attach `versionchange` to the returned database connection. Save any unsaved work, call `close()` or reload, and stop using the old connection. Allow active transactions to finish. [IndexedDB specification](https://w3c.github.io/IndexedDB/)
3. Give people an explicit instruction when the upgrade stays blocked: save work in other tabs of the site and close or reload those tabs. Remove the notice when the upgrade proceeds. [IndexedDB specification](https://w3c.github.io/IndexedDB/)
4. If an older page later tries to open a version below the one now stored, handle `VersionError`. That is a different path from `blocked` and is another reason to ask an old page to reload after it yields its connection. [MDN's IndexedDB guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
