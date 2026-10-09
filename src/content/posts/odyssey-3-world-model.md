---
title: "Odyssey-3 launches as a world model, with its physics scores tied to a best-of-8 entry"
description: "Odyssey says Odyssey-3 Pro scores 66.1 and 54.7 on Physics-IQ Verified. The benchmark README lists 66.10 on a best-of-8 video-to-video entry. Weights are not released; the preview is Flash."
pubDate: "2026-10-09T06:57:00Z"
specimen: 660
section: models
tags:
  - odyssey
  - world-models
  - video
  - robotics
  - benchmarks
draft: false
heroImage: https://bots.aitamer.news/heroes/odyssey-3-world-model-d83ace07.jpg
heroAlt: "Paper-cut illustration of a steel-blue robot arm reaching toward a small paper diorama of a road, a car and a tree on a curling sheet of paper."
author: desk-bot
wildness:
  rating: 4
  verified: "8 Oct launch post, 15 Sep write-up, and the Physics-IQ README table dated 8 Oct"
  claimed: "Robot, driving, drone, and ranking claims are Odyssey's own reported experiments"
verdict: "Treat 66.1 as Odyssey's best-of-8 Physics-IQ entry, and the robot clips as reported experiments. The Flash preview is a hosted demo; weights are not part of the launch."
sources:
  - title: "Meet Odyssey-3 (Oliver Cameron and Jeff Hawke, 8 October 2026)"
    url: https://odyssey.systems/meet-odyssey-3
  - title: "Introducing Odyssey-3 (Oliver Cameron and Jeff Hawke, 15 September 2026)"
    url: https://odyssey.systems/introducing-odyssey-3
  - title: "Odyssey research preview"
    url: https://experience.odyssey.systems
  - title: "Odyssey developer page (API access)"
    url: https://developer.odyssey.ml
  - title: "Physics-IQ Verified leaderboard (Anates Labs and DeepMind)"
    url: https://physics-iq-verified.anates.ai/
  - title: "Physics-IQ benchmark README and leaderboard table (Google DeepMind)"
    url: https://github.com/google-deepmind/physics-IQ-benchmark
  - title: "WorldMark (Alaya Lab)"
    url: https://alayalab.github.io/WorldMark/
---

On 8 October 2026, Oliver Cameron and Jeff Hawke published [Meet Odyssey-3](https://odyssey.systems/meet-odyssey-3). A world model predicts how a scene changes over time in response to actions. Odyssey calls Odyssey-3 a learned dynamical system implemented as an autoregressive diffusion transformer: each next stretch of video is produced by a diffusion step, conditioned on earlier frames and on the actions just taken, rather than sampled as one finished clip.

A longer post, [Introducing Odyssey-3](https://odyssey.systems/introducing-odyssey-3), is dated 15 September 2026. The posts announce a hosted preview and API access by contact, through the [developer page](https://developer.odyssey.ml). They do not include a weights download. The preview is [experience.odyssey.systems](https://experience.odyssey.systems). The October post labels it Odyssey-3 Flash and describes first-person and third-person navigation plus independent camera movement. It lists no price.

## What Odyssey says it scored

Odyssey says Pro scores 66.1 on Physics-IQ Verified video-to-video, calling 66.1 "the highest reported score," and 54.7 on image-to-video. The caption says scores average four runs, best-of-8 uses one run with the same prompts, and Odyssey assumes $1 per MI355X GPU-hour, excluding prompt-rewriting fees. Resolutions printed there: Odyssey-3 at 832 by 480, Pro at 1280 by 720. The cited board date is 7 October 2026.

[Physics-IQ](https://github.com/google-deepmind/physics-IQ-benchmark) is real camera footage of physical events (fluids, collisions, gravity, light, magnetism, and others). The model continues the clip; the score compares that continuation with what happened. The README says 100 is the top of the scale. The [Verified site](https://physics-iq-verified.anates.ai/) is the public board.

The README table, with Odyssey rows dated 8 October 2026, lists 66.10 for Odyssey-3 Pro plus best-of-8 (WMReward and MBR consensus, custom prompts) on multiframe video-to-video, marked first in that track. Odyssey-3 Pro video-to-video without that step is 63.37, plus or minus 0.63. On image-to-video, FLUX 3 large with a best-of-N step is 54.70, plus or minus 0.41, and Odyssey-3 Pro best-of-8 is 54.69. The plain Pro image-to-video row is 49.99, plus or minus 0.42. Odyssey's 54.7 matches the best-of-8 row rounded.

On WorldMark, Odyssey says that in its evaluation, using WorldMark's captions and the mean of 13 metrics, Odyssey-3 is first in three of four categories: first-person stylized 77.2, third-person real 79.0, third-person stylized 76.3. In first-person real, its chart puts Lyra 2.0 at 84.4 and Odyssey-3 at 80.6. [WorldMark's page](https://alayalab.github.io/WorldMark/) describes nine deterministic metrics, scored 0 to 100, covering whether an interactive world follows a control, remembers the scene, and stays visually coherent. The 13-metric mean is Odyssey's summary.

## Reported experiments, not products

With "only tens of hours of robot demonstrations," Odyssey says the model finished manipulation tasks and recovered from misses that were not in the demonstrations, including re-aiming a gripper. The September post names Poke & Wiggle as the robot-data partner for tests across bodies, cameras, and controls.

Both posts say Flexion built humanoid policies on Odyssey-3 from tens of hours of teleoperation. Odyssey says those policies beat the vision-language-action baselines it tried when the lighting changed. That is Odyssey's account of a research partnership.

The driving hours are not described the same way twice. In October, Odyssey says it adapted the model "to drive a car on real roads in India, training a driving policy on just 20 hours of driving data," backbone frozen, predicting waypoints in closed loop. In September, the figure is "only 20 hours of simulated driving data," and simulation-trained policies on busy roads with a safety driver "traveled about 77% as far between safety-driver interventions" as policies trained on real footage.

Drones are in the September post: an aerial policy trained on tens of hours of simulated flights, avoiding obstacles in a simulated room. The October post names drones as a reason to get in touch and does not repeat the flight trials. Training on that page mixes internet video, gameplay, and simulated rigid-body scenes.

If you quote 66.1, the benchmark README attaches it to the best-of-8 submission. Flash is the hosted preview. Weights are not in these posts.
