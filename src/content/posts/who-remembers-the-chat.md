---
title: Who Remembers the Chat?
description: A chat can carry its own history or ask the API to keep the thread. The choice changes what your application stores, sends, and checks on every turn.
pubDate: "2026-10-06T10:00:00Z"
specimen: 308
section: dev
tags:
  - openai-api
  - conversation-state
  - responses-api
  - application-design
draft: false
heroImage: https://media.aitamer.news/heroes/who-remembers-the-chat-181c6e63.jpg
heroAlt: Chat messages flow from a laptop drawer toward a cloud server.
author: ari
wildness:
  rating: 2
  verified: OpenAI documents manual replay, response chains, persistent Conversations, billing, and retention.
  claimed: The application must manage its own history or keep the right API state identifier.
verdict: Choose who keeps each chat’s history, then check the resulting input, identifiers, retention, instructions, and token use.
sources:
  - title: Conversation state | OpenAI API
    url: https://developers.openai.com/api/docs/guides/conversation-state
  - title: Text generation | OpenAI API
    url: https://developers.openai.com/api/docs/guides/text
---

A user says, “Make the second paragraph shorter.” That instruction only makes sense if the next request has access to the first paragraph. A chat interface may make this feel automatic, but an application has to choose how the earlier turns reach the model.

[OpenAI’s conversation-state guide](https://developers.openai.com/api/docs/guides/conversation-state) describes three routes: send prior items with each request, chain Responses with `previous_response_id`, or use a persistent Conversation with the Responses API. Each route can preserve context. Each gives the application a different job.

## When your app sends the history

With manual state, the application builds the next input from earlier turns. It sends the relevant user messages and assistant output along with the new request. Chat Completions uses this approach. The Responses API can use it too. OpenAI’s examples show an application appending a response’s output to its history before adding the next user message. [Source: conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

This gives the application direct control over the input. It can inspect what will be sent, leave out irrelevant turns, or prepare a shorter account of an older exchange. Those choices also become its responsibility. If it drops the paragraph the user wants edited, the next request lacks the needed text. If it stores only displayed prose, it may lose other output items that matter to a later turn.

That last detail matters for reasoning models. OpenAI says a stateless request should preserve every item in the response’s `output` array. Replaying the complete output retains reasoning items and assistant `phase` values. A manual history should therefore be treated as structured API data, rather than a transcript copied from the screen. [Source: conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

Manual state is a reasonable choice when the application needs to control exactly which earlier items enter each request. It also means the application must decide where to keep those items between requests, how to put them in order, and what to do when the history grows. Those are design consequences of building and sending the input yourself.

## When the API keeps the thread

The Responses API offers two ways to continue without resending the prior items yourself. With `previous_response_id`, a new response points to the earlier response. With the Conversations API, the application creates a conversation object and passes its identifier to later Responses requests. A Conversation can be used across sessions, devices, or jobs. Its items can include messages, tool calls, tool outputs, and other data. [Source: conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

The application still has work to do. It must keep the correct identifier for the chat the user is continuing. A misplaced identifier can attach a new turn to the wrong thread. The interface also needs a clear rule for starting a fresh chat. These are application responsibilities even when OpenAI manages the earlier context.

The two identifiers serve different purposes. A previous response ID follows a chain of responses. A Conversation ID names a persistent conversation object. Choose the one that matches how the product resumes a chat. The [conversation-state guide](https://developers.openai.com/api/docs/guides/conversation-state) shows both patterns.

## The earlier turns still count

Sending fewer bytes from your application does not erase the earlier context from the model’s work. OpenAI says that, even with `previous_response_id`, all previous input tokens in the response chain are billed as input tokens. The model’s context window also has a limit that covers input and output, and may include reasoning tokens. Long exchanges therefore need a plan for context as well as a plan for identifiers. [Source: conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

For manual state, the application can decide which items to include in its next input. For API-managed state, it should still watch the size and relevance of the continuing conversation. A short request such as “continue” may draw on a long thread. The guide points to compaction options for conversations that need context management. [Source: conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

## Retention needs its own decision

State management and data retention are related, but choosing a history strategy does not settle retention by itself. OpenAI says Response objects are saved for 30 days by default and that `store: false` disables that behavior. Conversation objects and their items do not have that 30-day time-to-live; items attached to a Conversation persist without it. [Source: conversation state](https://developers.openai.com/api/docs/guides/conversation-state).

Write down the intended retention behavior before choosing a route. A manual history in your application needs its own storage policy. A persistent Conversation calls for a deliberate decision about whether that persistence fits the product. Check the actual API settings as part of that decision. The word “manual” alone does not describe what the API stores.

Instructions deserve a separate check. OpenAI’s [text-generation guide](https://developers.openai.com/api/docs/guides/text) says the `instructions` parameter applies to the current response request. When a request uses `previous_response_id`, instructions from the earlier response are not carried into the next one. An application that relies on those instructions should supply them on each relevant request.

## What to do

1. Pick a state route for each kind of chat: manual history, a response chain, or a persistent Conversation. Record why that route fits how users resume the chat. [OpenAI’s guide](https://developers.openai.com/api/docs/guides/conversation-state) shows the three patterns.
2. Keep the data the route needs. For manual state, retain replayable output items as well as user input. For API-managed state, retain the correct response or Conversation ID for each chat.
3. Test a follow-up that depends on an earlier detail, then test a fresh chat. Check the input you assembled or the identifier you passed.
4. Set retention and current-turn instructions deliberately. Review `store` where it applies, and resend `instructions` when using `previous_response_id`. [Sources: conversation state](https://developers.openai.com/api/docs/guides/conversation-state) and [text generation](https://developers.openai.com/api/docs/guides/text).
5. Watch token use as chats grow. Decide when to shorten or compact context before an older thread becomes too large to serve well. [Source: conversation state](https://developers.openai.com/api/docs/guides/conversation-state).
