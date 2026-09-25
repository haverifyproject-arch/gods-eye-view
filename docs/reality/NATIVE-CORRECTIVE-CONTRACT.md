# REALITY DEBUGGER — FINAL CORRECTIVE IMPLEMENTATION PROMPT

You are taking over an EXISTING implementation that has already gone through two unsuccessful product directions.

Do NOT start over from scratch unless a specific module is unusable.

Your job is to perform ONE CONTROLLED ARCHITECTURAL RESET and produce a workable, portfolio-quality result.

The existing project may contain useful work such as:

- evidence/provenance models
- source adapters
- normalized data
- schemas
- tests
- network/infrastructure logic
- utility code
- existing upstream integration work

Preserve reusable pieces.

Discard or disable only the parts that caused the product to drift away from God's Eye View.

---

# 1. UNDERSTAND THE TWO PREVIOUS FAILURES

The first implementation failed because it became:

GLOBE
+
DASHBOARD
+
PANELS
+
CARDS
+
CYBER DATA

The second implementation failed because it became:

GLOBE
+
SCRIPTED WALKTHROUGH
+
CAMERA TOUR
+
PREDETERMINED STORY

Both are wrong.

Do not make a prettier dashboard.

Do not make a better walkthrough.

Do not build a mission player.

Do not build a slide deck rendered on a globe.

Do not build another application around God's Eye View.

---

# 2. THE PRODUCT PRINCIPLE

# GOD'S EYE VIEW MUST REMAIN THE PRODUCT.

Reality Debugger is a NATIVE EXTENSION of God's Eye View.

The user should still feel like they are operating Bilawal Sidhu's interactive world.

Reality Debugger adds:

1. live digital/internet state as first-class world entities
2. cross-layer investigation
3. evidence-aware relationship reasoning
4. the ability to "debug" whatever the user is currently looking at

The user should be able to freely:

- rotate the globe
- zoom anywhere
- enable/disable layers
- select arbitrary entities
- track objects
- inspect locations
- ask questions about the current scene
- combine existing God's Eye View layers
- abandon an investigation
- start another investigation somewhere else
- interact in any order

There must be NO required sequence.

There must be NO Scene 1 → Scene 2 → Scene 3 structure.

There must be NO mandatory mission mode.

If the core product depends on a predetermined order, the implementation has failed.

---

# 3. CORE PRODUCT IDEA

Reality Debugger adds a LIVE INTERNET / DIGITAL INFRASTRUCTURE understanding layer to God's Eye View.

God's Eye View already represents physical-world systems such as:

- aircraft
- ships
- satellites
- earthquakes
- fires
- weather
- CCTV
- infrastructure
- submarine cables
- geography

Reality Debugger adds digital-world signals such as:

- Internet outages
- degraded connectivity
- ASNs / networks
- Internet exchange points
- network facilities
- routing/connectivity observations
- network measurements
- network-to-facility relationships
- network-to-IXP relationships
- digital infrastructure dependencies

Then Reality Debugger connects digital and physical layers.

The fundamental question is:

# "WHAT RELATIONSHIPS EXIST BETWEEN WHAT I AM SEEING ACROSS LAYERS?"

---

# 4. THE KILLER CAPABILITY

Implement a capability conceptually called:

# DEBUG THIS

The user selects:

- an outage
- network
- cable
- facility
- location
- region
- earthquake
- storm
- ship
- infrastructure object
- or other supported world entity

Then invokes:

"Debug this."

Reality Debugger should inspect the selected entity, current camera region, active layers, nearby relevant objects, available digital/network measurements, and evidence.

It should then reveal potentially relevant relationships IN THE WORLD.

Example:

User selects an Internet outage.

"Debug this."

The system may:

1. identify affected geography
2. identify affected ASN/network entities
3. reveal relevant network facilities
4. reveal nearby cable infrastructure
5. reveal landing points
6. inspect recent earthquakes
7. inspect severe weather
8. inspect fires
9. inspect ships if relevant
10. inspect other meaningful physical signals
11. identify source-backed relationships
12. distinguish observation from inference
13. annotate relevant relationships spatially
14. tell the user what is established
15. tell the user what is merely possible
16. tell the user what evidence would be needed to confirm hypotheses

The system must NOT automatically claim causation.

---

# 5. FIRST IMPLEMENTATION TARGET

Do NOT build another historical incident.

Do NOT build Tonga.

Do NOT build CrowdStrike.

Do NOT build Kyivstar.

Do NOT build Colonial Pipeline.

Do NOT build any scripted historical reconstruction.

The first working capability is:

# INTERNET HEALTH

This must be implemented as a NATIVE GOD'S EYE VIEW LAYER.

It should behave like the existing live layers in the application.

It should be:

- independently switchable
- spatial
- selectable
- visible in current scene context
- queryable by the existing agent architecture
- compatible with existing map/camera interactions
- updated from current/recent public data when feasible
- able to coexist with ships, earthquakes, cables, weather, etc.

---

# 6. INTERNET HEALTH LAYER

The layer should represent significant current/recent Internet connectivity disruptions.

Research the best practical public source.

Candidate sources may include:

- Cloudflare Radar
- Georgia Tech IODA
- other authoritative Internet measurement sources

Do not assume a source is usable.

Verify:

- access method
- current API availability
- authentication
- licensing
- rate limits
- geography
- historical/current coverage
- terms of use

Prefer a source that supports a useful portfolio prototype without requiring expensive credentials.

If live access is impractical, a regularly refreshable public source is acceptable.

But do NOT fall back to a static historical "mission."

The layer should conceptually contain entities like:

InternetDisruption

Fields may include:

- id
- geography
- affected ASN/network where known
- start time
- end time
- status
- measurement/source
- severity only if source provides defensible metric
- provenance
- observation type

Do not invent numeric severity scores.

---

# 7. INTERNET OUTAGES ARE FIRST-CLASS WORLD OBJECTS

An Internet disruption should behave conceptually like a plane or ship behaves in God's Eye View.

The user should be able to:

- see it
- click it
- select it
- ask about it
- ask when it started
- ask which networks are involved
- ask "debug this"
- ask for nearby infrastructure
- ask for relevant physical-world signals
- hide/show it through layer controls
- filter by recency/geography if useful

Do NOT represent outages as rows in a table.

Do NOT make the user enter a dashboard to investigate them.

---

# 8. SPATIAL REPRESENTATION

Represent outages only to the spatial precision supported by evidence.

Possible representations:

COUNTRY
→ country/region polygon

REGION
→ regional area

CITY
→ localized region

ASN
→ service geography only if actually known

Do not place an outage at an arbitrary corporate headquarters.

Do not invent precise coordinates.

If spatial scope is broad, show broad scope.

If only country-level data exists, show country-level data.

Spatial honesty is more important than visual precision.

---

# 9. SECOND CAPABILITY — NETWORK CONTEXT

After Internet Health works natively, add contextual digital infrastructure.

Potential sources:

PeeringDB
RIPE Atlas
existing God's Eye View submarine cable data
other public network infrastructure data

Possible entities:

ASN / network

IXP

facility

cable landing point

network facility presence

network exchange presence

measurement probe

network path

Do not load all possible infrastructure globally by default.

Reveal it contextually.

Example:

User clicks outage.

"Show me network infrastructure around this."

Only relevant infrastructure appears.

---

# 10. THIRD CAPABILITY — CROSS-LAYER INVESTIGATION

Reality Debugger should connect:

DIGITAL SIGNAL

to

PHYSICAL WORLD

Examples:

Internet outage
↔ cable infrastructure

Internet outage
↔ network facilities

facility
↔ nearby fire

cable route
↔ nearby earthquake

cable segment
↔ vessel proximity

network degradation
↔ weather event

Do not assume correlation means causation.

Relationships must have epistemic states.

---

# 11. EPISTEMIC STATES

Every important relationship should have one of these statuses:

## OBSERVED

Directly measured.

Examples:

- outage measurement
- earthquake measurement
- ship AIS position
- Internet traffic drop

## REPORTED

An authoritative source explicitly states a relationship/event.

Example:

operator says a cable was damaged.

## DERIVED

A deterministic transformation of reliable data.

Example:

distance between an earthquake epicenter and a cable route.

## INFERRED

Plausible relationship not established as fact.

Example:

outage and earthquake are temporally/spatially correlated.

## CURRENT REFERENCE

Current infrastructure topology used for context.

Not proof of historical/event-time topology.

## UNKNOWN

Evidence insufficient.

No fake confidence percentages.

---

# 12. SPATIAL RELATIONSHIP VISUALIZATION

Relationships should be drawn directly in the world.

Potential visual language:

OBSERVED
solid / strongest

REPORTED
solid but distinct

DERIVED
clean contextual

INFERRED
dashed / translucent

CURRENT REFERENCE
subdued / ghosted

UNKNOWN
not drawn as a relationship

Never represent UNKNOWN as a speculative line.

---

# 13. USER COMMAND MODEL

The user must be able to interact in ANY order.

Examples:

"Show Internet health."

"Take me to the biggest outage right now."

"What's happening here?"

"Which network is affected?"

"Show nearby cables."

"Show network facilities."

"Show earthquakes from the last 24 hours."

"Show ships near this cable."

"Debug this."

"Why might these be related?"

"What do we actually know?"

"Remove everything inferred."

"Show only observations."

"How do we know this?"

"Follow this cable."

"Show me another outage."

"Clear this investigation."

"Go back to normal world."

There should be no mandatory scripted path.

---

# 14. DEBUG SESSION

A debug session is NOT a mission.

It is a temporary collection of:

- selected entity
- relevant nearby entities
- revealed layers
- annotations
- relationships
- evidence
- hypotheses

The user can start a debug session from any supported entity.

The user can:

- add/remove layers
- follow objects
- change geography
- change filters
- inspect sources
- clear the session
- start another one

A session should feel like manipulating an investigation workspace directly on Earth.

---

# 15. DEBUG THIS LOGIC

Implement a generic debug pipeline.

Given selected object X:

1. identify object type
2. retrieve its spatial bounds/location
3. retrieve time information
4. retrieve known relationships
5. retrieve relevant digital entities
6. retrieve relevant physical entities
7. retrieve active/recent events nearby
8. compute defensible spatial/temporal relationships
9. classify each relationship epistemically
10. stage relevant objects
11. annotate world
12. expose evidence
13. provide concise explanation

This logic must be extensible.

Do not hard-code it only for outages.

Eventually it should work for:

cable

facility

earthquake

ship

network

outage

region

other infrastructure

But MVP may focus first on Internet outage + cable/network context.

---

# 16. USE BILAWAL'S ACTUAL PRIMITIVES

Before implementation, inspect current upstream code and identify actual implementations for:

- layer registration
- data sources
- Cesium entities
- layer lifecycle
- selection
- tracking
- scene context
- camera control
- voice actions
- `gevActions`
- annotation / whiteboard
- route connectors
- world-space labels
- scene state
- shareable state
- context store
- agent tools
- query-current-scene behavior
- text/voice input if available

Use these.

Do not duplicate existing capabilities.

Reality Debugger should plug into God's Eye View.

It should not create parallel systems for:

selection

camera movement

layer visibility

entity tracking

annotations

agent context

---

# 17. REMOVE / DISABLE PREVIOUS WALKTHROUGH UI

Inspect current project modifications.

Identify code introduced specifically for:

- Tonga mission
- historical mission loader
- fixed sequence
- guided walkthrough
- scripted camera states
- next/previous steps
- historical story playback
- giant investigation panel
- dashboard widgets

Do NOT delete blindly.

First categorize:

KEEP
reusable architecture/data/evidence code

REWORK
potentially useful code coupled to mission UX

REMOVE/DISABLE
walkthrough/dashboard-only code

Document this briefly.

Then perform the surgical reset.

---

# 18. UI REQUIREMENT

The normal God's Eye View experience should remain visually dominant.

Avoid introducing a new shell.

Allow only minimal Reality Debugger UI.

Acceptable examples:

small INTERNET HEALTH layer toggle

small evidence filter

compact "Debug this" action

contextual source popover

temporary investigation annotations

small selected-object controls

Possibly a lightweight debug-session status indicator.

Not acceptable:

large sidebar

large investigation pane

mission chooser occupying major space

multi-card dashboard

full-height panel

chart grid

timeline walkthrough

story player

---

# 19. EVIDENCE FILTERING

Allow the user to say or choose:

Observed only

Observed + reported

Include inferred

Show current reference

Hide current reference

Clear inference

This should change the WORLD.

Not merely filter a textual panel.

---

# 20. HOW DO WE KNOW?

Every visible debug relationship should be inspectable.

User:

"How do we know this?"

System should return the exact relevant provenance.

Example:

NETWORK PRESENT AT FACILITY

Source: PeeringDB

State: CURRENT REFERENCE

Retrieved: [date]

Historical relevance: not established

Or:

OUTAGE OBSERVATION

Source: IODA

State: OBSERVED

Time: [timestamp]

Signal: [signal description]

Avoid long reports.

Evidence should be contextual.

---

# 21. FIRST REAL SUCCESS CASE

A valid first MVP flow:

1. Open God's Eye View.

2. Turn on Internet Health.

3. Several current/recent Internet disruptions appear.

4. User freely rotates Earth.

5. Click one disruption.

6. Ask:
   "Debug this."

7. Reality Debugger reveals:
   - affected network info if available
   - nearby/relevant cable infrastructure
   - network facilities/IXPs if available
   - recent earthquakes/fire/weather/ships if relevant

8. Relationships appear with appropriate epistemic styling.

9. User asks:
   "Show me only observations."

10. Inferred/contextual objects disappear.

11. User asks:
   "Show possible explanations."

12. Defensible inferred relationships return.

13. User clicks a relationship:
   "How do we know this?"

14. Provenance appears.

15. User says:
   "Follow this cable."

16. Existing God's Eye View camera/route behavior follows it.

17. User clears session.

18. User selects a different outage.

No restart.

No mission loading.

No fixed sequence.

That is the product.

---

# 22. MVP LIMITS

Do NOT implement:

historical incident library

Tonga reconstruction

CrowdStrike reconstruction

Kyivstar reconstruction

Colonial reconstruction

mission framework

story mode

presentation mode

large database

auth

enterprise tenancy

SIEM integration

Defender/Sentinel integration

full causal simulation engine

huge infrastructure ingestion

generic cyber dashboard

Do one native world extension extremely well.

---

# 23. DATA SOURCES

Research before using.

Potentially useful:

## IODA

For Internet outage detection.

Research:

API

current status

latency

entity types

time resolution

terms

## Cloudflare Radar

Potential outage/network observations.

Research licensing carefully.

## PeeringDB

ASN/network/facility/IXP context.

Treat topology as current reference unless timestamp evidence supports otherwise.

## RIPE Atlas

Optional network measurements/path context.

Do not make it a blocker.

## Existing God's Eye View cable data

Reuse if licensing permits current project use.

Do not duplicate cable datasets unnecessarily.

## Existing God's Eye View physical layers

Use:

earthquakes

ships

weather

fires

other appropriate layers

rather than reimplementing them.

---

# 24. PRODUCT DIFFERENTIATOR

Do NOT describe the project as:

"Cybersecurity on a globe."

Describe it conceptually as:

# A CROSS-LAYER SPATIAL DEBUGGER FOR THE REAL WORLD.

The user selects something anomalous.

The system uses spatial, temporal, physical, digital, and evidentiary context to investigate what might matter.

The agent operates the world rather than returning a dashboard.

---

# 25. ENGINEERING APPROACH

Work in small increments.

First:

restore native GEV feel

Then:

Internet Health layer

Then:

selectable outage

Then:

agent/context integration

Then:

Debug this

Then:

network context

Then:

cross-layer correlation

Then:

epistemic filtering

Then:

polish

Do not attempt everything simultaneously.

---

# 26. VISUAL QA REQUIRED

After every meaningful UI milestone:

run application

open browser

inspect actual scene

capture screenshots

evaluate visual hierarchy

fix issues

Do not trust component existence.

Specifically verify:

- does it still look like God's Eye View?
- are new layers native-looking?
- is UI minimal?
- can existing layers still be used?
- does a selected outage feel like a native entity?
- are annotations world-space?
- do relationships clutter scene?
- does evidence filtering visibly change scene?
- does the product remain explorable?

---

# 27. FINAL ANTI-FAIL TESTS

Do not call MVP complete unless all are true.

## TEST A

Can the user ignore Reality Debugger and still use God's Eye View normally?

YES required.

## TEST B

Can the user enable Internet Health like another normal layer?

YES required.

## TEST C

Can the user select an arbitrary outage?

YES required.

## TEST D

Can the user investigate it without entering mission mode?

YES required.

## TEST E

Can the user change direction mid-investigation?

YES required.

Example:

investigating outage
→ click earthquake
→ ask about earthquake
→ return to outage

YES required.

## TEST F

Can existing GEV layers participate?

YES required.

## TEST G

Can "Debug this" operate on current scene/context rather than a pre-written scenario?

YES required.

## TEST H

Can inferred relationships be removed from the world?

YES required.

## TEST I

Can source provenance be inspected?

YES required.

## TEST J

Can the user clear the investigation and immediately start another?

YES required.

## TEST K

Is there no mandatory story order?

YES required.

## TEST L

Is there no large dashboard?

YES required.

## TEST M

Is there no scripted walkthrough?

YES required.

## TEST N

Does the world itself carry most of the explanation?

YES required.

If any fail, continue iterating.

---

# 28. PORTFOLIO DEFINITION OF DONE

The MVP is DONE when we can record a compelling 60–90 second unscripted demo where:

- God's Eye View opens normally
- Internet Health turns on
- user picks a live/recent outage
- user asks "Debug this"
- cross-layer context appears
- user freely explores
- user asks "What do we actually know?"
- inference disappears
- user asks for possible relationships
- contextual relationships return
- user inspects provenance
- user follows an infrastructure object
- user clears the investigation
- user selects another object

The viewer should think:

"This AI is investigating the world."

Not:

"This is a dashboard."

Not:

"This is a guided demo."

Not:

"This is a map with an assistant."

---

# 29. AUTONOMY

Do not ask the product owner routine questions.

You own:

repo inspection

architecture

code changes

dependency choices

source research

provider evaluation

testing

debugging

visual QA

small refactors

cleanup

documentation

Only escalate for:

credentials that cannot be avoided

paid access

major irreversible product choices

genuine inability to source viable live outage data

---

# 30. REQUIRED FIRST ACTION

DO NOT RESPOND WITH A DESIGN PLAN ONLY.

Start working.

First:

1. inspect current diff versus upstream
2. identify dashboard/walkthrough-specific additions
3. classify KEEP / REWORK / REMOVE
4. restore the native God's Eye View interaction model
5. verify upstream behavior still works
6. inspect actual layer/context/action architecture
7. research a viable Internet outage source
8. implement Internet Health as a native layer
9. make outage entities selectable
10. expose them to existing scene context
11. implement the smallest possible Debug This workflow
12. visually inspect it
13. iterate
14. continue until the MVP definition of done is satisfied

Do not build another historical case.

Do not build another walkthrough.

Do not build another dashboard.

# EXTEND THE WORLD.