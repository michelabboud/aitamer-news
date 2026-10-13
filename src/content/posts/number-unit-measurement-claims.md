---
title: A Number With a Unit Is Still a Claim
description: Why a measurement is a number and a unit together, and how dropping a required unit turns a claim into noise, worked through a hypothetical constant-power energy calculation.
pubDate: "2026-10-14T11:00:00Z"
section: general
tags:
  - measurement
  - units
  - energy
  - numerical-literacy
  - si
draft: false
heroImage: https://media.aitamer.news/heroes/number-unit-measurement-claims-66ffad53.jpg
heroAlt: A level paper balance holds a large rust-colored block opposite four small teal blocks, with another teal block beside it.
author: mai
wildness:
  rating: 1
  verified: "SI Brochure: quantity = number times unit; W = J/s."
  claimed: The 100 W for 3 h example is a hypothetical derivation, not a measured device.
verdict: Track the unit and the named quantity as carefully as the digits. They carry the dimension and half the claim.
sources:
  - title: SI Brochure (9th edition)
    url: https://www.bipm.org/documents/20126/41483022/SI-Brochure-9-EN.pdf
---

A measurement is not a number. It is a number and a unit together, and the two are inseparable in a way casual arithmetic quietly ignores. The [International System of Units](https://www.bipm.org/documents/20126/41483022/SI-Brochure-9-EN.pdf) states it plainly: a quantity is expressed as the product of a number and a unit. That product is the whole claim. Strip a required unit, and the number stops meaning anything. One exception is worth naming: quantities with the unit one, like a refractive index of 1.51, are written as bare numbers because the unit one is conventionally left unwritten. What still cannot be dropped is the description of which quantity is meant.

Take a deliberately invented example. Suppose a device draws a constant 100 watts for three hours. The number 100 is not the measurement. "100 watts" is, because watt names a rate of energy transfer: one joule per second. The unit is carrying the kind of thing being counted, and dropping it leaves "100" able to mean volts, grams, or a telephone number.

Now the arithmetic. Energy equals power multiplied by elapsed time. At a constant 100 watts for three hours, that is 100 W times 3 h. You cannot just multiply the digits and write 300, because the unit travels with the digits. Power times time gives energy, and the product unit is the watt hour: 100 W for 3 h is 300 W h, or 0.3 kW h, since the prefix kilo means one thousand.

The same quantity in joules follows from the definitions. One watt is one joule per second, and one hour is 3,600 seconds. So 100 joules per second over 10,800 seconds is 1,080,000 joules, or 1.08 megajoules. Both answers name the same quantity. They differ only in unit.

But a unit carries less than people assume. A unit does not by itself pin down what is being measured. Energy and torque share the same dimension, yet they are different kinds of quantity, and the SI Brochure names them with different units: joule for energy, newton metre for torque. The dimension is not the whole meaning. To read a measurement you need the named quantity, the number, and the unit all together, and the named unit helps keep distinct quantities apart.

This example is a derivation from definitions, not a measurement of any actual device. A real measurement would have to state its conditions and its uncertainty; this illustration has no measured device and no uncertainty. What it does have is an assumption: constant power for the whole period, and that assumption is part of the claim too. A number with a unit is still a claim: it asserts that a quantity of a given magnitude and a named kind is being talked about, under stated assumptions. The digits get the attention. The unit does half the asserting.

So when a figure arrives without a required unit, or without any indication of which quantity is meant, treat it as unfinished. When it arrives with one, read the unit and the named quantity as carefully as the digits. They are carrying the same load.
