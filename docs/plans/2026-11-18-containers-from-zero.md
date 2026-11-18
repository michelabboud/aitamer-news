# Containers from Zero: a ten-lesson foundation

Plan only. 2026-11-18. Michel asked for a foundation a writer can build, and for the longer map to wait.

This file does not add a series row, a post, a diagram, or a lesson kit. It does not pin Docker or Compose versions. It does not allocate specimens or set `pubDate` values. When the lessons are written, they use [the lesson review standard](../guides/lesson-review.md), and they still go through Beat, Fact and Legal, Writer, Art, SEO, and IT.

## The cut

Ten lessons, from Docker and Compose basics through one small multi-container app. A longer 72-lesson advanced map stays unwritten until this foundation is published and a lesson review says the shape holds. That map is not drafted here.

Audience: beginners through professional, same range as the lesson review. The foundation is for a reader who can finish one small app on their own machine. The learning environment is a local container engine and Compose. The first lesson, when it is written, records the engine and Compose versions in the review inputs and checks the official docs for those versions.

Each lesson, when it is written, separates the optional lab from the reading, states reading time, lab time, and optional advanced time separately, and puts a safety banner on any lab that deletes data, binds a privileged port, or publishes a port the reader might already be using.

## The ten lessons

| # | Working title | What the reader can do at the end |
|---|---|---|
| 1 | What a container is | Explain a container as a process with its own filesystem view, and say how that differs from a virtual machine, from the Docker documentation the writer opened. |
| 2 | Images and a Dockerfile | Build an image, tag it, and point at the layer the Dockerfile added. |
| 3 | Run one container | Publish a port, set an environment variable, read the logs, and stop and remove the container. |
| 4 | Files that outlive the container | Use a named volume and a bind mount, and say which one the lab is using. |
| 5 | Two containers, one network | Reach one container from the other by name. |
| 6 | Compose for that pair | Replace the manual `docker run` commands with one Compose file that starts the same pair. |
| 7 | A small multi-container app | Start a web process and a database with Compose. The app is small enough to finish in the lesson. |
| 8 | Configuration and the database file | Change configuration without rebuilding the image, and keep the database data across a restart. |
| 9 | When something fails | Read a health check, a restart policy, and the logs of both services, and match them to a failure the lesson causes on purpose. |
| 10 | Clean up, and the edge of one machine | Remove the app. Say what Compose does on one machine. Point at Kubernetes from Zero for a cluster. This lesson does not teach Kubernetes. |

Lesson 7 is the proof the foundation is aiming at: one app, more than one container, started from one Compose file. Lessons 1-6 build the pieces that file uses. Lessons 8-10 cover change, failure, and cleanup.

## What a later publishing change would add

A series row in `src/data/series.json`, posts under `src/content/posts/`, diagrams, and lesson kits, each through its own lane. The catalog description can say the series is a ten-lesson foundation. Arcs can wait until the ten titles are stable. Version pins belong in the lesson files and in the review inputs, not in this plan.

## Deferred

The 72-lesson advanced map (registries, build cache, rootless mode, Compose profiles, more than one host, image and supply-chain hygiene, CI, and the rest of a long operations course) is deferred. Write it after the ten lessons are live and the issue register for this series shows the foundation holds. Until then, this plan is the whole map.
