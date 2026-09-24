# REALITY DEBUGGER
## Master Product Contract, Engineering Brief, Autonomy Charter, UX Specification, Data Model, First Mission, QA Plan, and Definition of Done

You are taking full ownership of designing, researching, engineering, testing, visually inspecting, debugging, and polishing a portfolio-quality product called:

# REALITY DEBUGGER

Reality Debugger is being built on top of Bilawal Sidhu's open-source God's Eye View project.

You are not an assistant producing suggestions for a developer.

YOU ARE THE LEAD ENGINEER AND PRODUCT IMPLEMENTER.

The human product owner does not want to:

- manually create files
- manually clone or fork repositories
- install dependencies
- write code
- create schemas
- research APIs
- gather public data
- manually test routine behavior
- tell you what file to edit
- answer ordinary engineering questions
- relay prompts between agents
- repeatedly approve implementation details

Handle those tasks yourself using the repository, terminal, browser/research capabilities, test tooling, and any other tools available to you.

Only escalate when one of the explicit escalation conditions in this document is met.

---

# 0. MOST IMPORTANT WARNING

A previous attempt at this product failed.

It produced something that was essentially:

A GLOBE
+
A CYBERSECURITY DASHBOARD
+
PANELS
+
CARDS
+
STATIC INFORMATION

THAT IS A FAILED PRODUCT.

Do not iterate on that concept.

Do not "improve the dashboard."

Do not build another SOC interface.

Do not put a globe in the middle of an otherwise conventional application.

Do not optimize for information density.

Do not create permanent sidebars full of:

- metrics
- cards
- incident lists
- severity scores
- KPIs
- tables
- feeds
- charts
- evidence categories

The fundamental correction is:

# THE WORLD IS THE INTERFACE.

The user's primary interaction is with a spatial and temporal world model.

Information should appear IN THE WORLD when possible.

The AI should manipulate the world as part of its answer.

The camera is part of the explanation.

Time is part of the explanation.

Spatial relationships are part of the explanation.

Annotations are part of the explanation.

Layer visibility is part of the explanation.

Evidence state is part of the explanation.

If the result feels like a dashboard with a globe behind it, consider the product FAILED.

---

# 1. PRODUCT THESIS

Reality Debugger lets a user investigate disruptions in the real world by traversing:

PHYSICAL EVENTS

↓

PHYSICAL INFRASTRUCTURE

↓

DIGITAL INFRASTRUCTURE

↓

NETWORK EFFECTS

↓

REAL-WORLD CONSEQUENCES

across:

SPACE

TIME

EVIDENCE

DEPENDENCIES

UNCERTAINTY

Instead of answering primarily with prose, the agent should manipulate the spatial scene.

A user should be able to say:

"Show me what happened."

"What broke?"

"Take me there."

"Follow the dependency."

"What changed first?"

"Rewind."

"Replay the failure."

"Show me only what was directly observed."

"Now show me the strongest explanation."

"Why do we think these things are connected?"

"How do we know that?"

"Remove everything that is inferred."

"Show me what we don't know."

"Compare before and after."

"Walk me through the event."

and the WORLD should respond.

---

# 2. CORE DIFFERENCE FROM GOD'S EYE VIEW

God's Eye View primarily helps answer:

WHAT IS HAPPENING IN THE WORLD?

Reality Debugger extends it toward:

WHY DID THIS HAPPEN?

WHAT CHANGED?

WHAT DEPENDED ON WHAT?

WHAT EVIDENCE SUPPORTS THAT CONNECTION?

WHAT PART IS FACT VERSUS INFERENCE?

WHAT WOULD I INVESTIGATE NEXT?

We should preserve the parts of God's Eye View that already make spatial exploration compelling and add a new situation/evidence/dependency layer.

---

# 3. DO NOT REBUILD GOD'S EYE VIEW

Before significant implementation, inspect the CURRENT repository.

Treat current source code and `docs/CURRENT-STATE.md` as authoritative over old planning documents.

Specifically find and understand existing implementations for:

- Cesium world rendering
- layer management
- camera navigation
- current-view / scene context
- entity selection
- tracking
- annotations
- world whiteboard
- connector arrows
- route drawing
- route flying
- voice tools
- text/action dispatch if present
- `gevActions`
- global context
- tracked object context
- scene director
- cinematic camera movement
- timeline or scrubber behavior
- shareable scene state
- styles / GLSL effects
- data source provenance
- provider proxying
- security controls
- tests
- QA harnesses

Reuse these primitives wherever appropriate.

Reality Debugger should feel like a NATIVE MODE OF GOD'S EYE VIEW.

It should not feel like a second application embedded around it.

---

# 4. FIRST MISSION

The first complete demonstration will be:

# HUNGA TONGA–HUNGA HAʻAPAI
## 2022 ERUPTION → SUBMARINE CABLE DAMAGE → CONNECTIVITY COLLAPSE → RECOVERY

Do not build Kyivstar.

Do not build anything involving Russia/Ukraine.

Do not start with CrowdStrike.

Do not start with Colonial Pipeline.

Do not add multiple incidents.

Make this ONE mission excellent.

Why this case:

It contains a clear physical event.

It contains real infrastructure.

It contains a documented digital consequence.

It contains meaningful geography.

It contains time.

It contains measurable network observations.

It contains an undersea cable that can be followed through the world.

It contains uncertainty about exact failure geometry.

It contains emergency fallback connectivity.

It contains a repair process.

It contains a clear recovery event.

It allows the user to move from:

VOLCANO

↓

TSUNAMI / PHYSICAL DISTURBANCE

↓

SUBSEA CABLE

↓

TONGA

↓

NETWORK CONNECTIVITY

↓

SATELLITE / EMERGENCY FALLBACK

↓

CABLE REPAIR

↓

CONNECTIVITY RESTORATION

This is exactly the type of spatial causal story the underlying technology is suited for.

---

# 5. IMPORTANT FACTUAL DISCIPLINE

Do not trust factual details in this prompt merely because they are written here.

Independently verify the event using authoritative sources before encoding data.

Prioritize primary or highly authoritative sources such as:

1. Tonga Cable / telecommunications operators where available
2. International Telecommunication Union
3. Cloudflare's historical network measurement analysis
4. official disaster/emergency telecommunications records
5. NASA / NOAA or other authoritative satellite/environmental sources
6. recognized scientific or government volcanic/earthquake sources
7. authoritative cable infrastructure datasets already used by God's Eye View
8. reputable technical secondary sources only where primary evidence is unavailable

Build a source registry.

Every important event-time fact must point to evidence.

---

# 6. FACTS THAT SHOULD BE VERIFIED DURING RESEARCH

The following are useful research leads, NOT permission to hard-code them without verification:

- the eruption occurred in January 2022
- major Internet connectivity loss followed
- Tonga was heavily dependent on an international submarine cable
- both international and domestic cable infrastructure reportedly suffered damage
- public network measurements showed severe traffic loss
- BGP behavior also changed around the outage
- limited satellite connectivity provided some fallback
- the international connection remained substantially impaired for weeks
- cable repair eventually restored primary connectivity
- public reporting describes roughly a 38-day major outage period

Verify timing and wording from source material before implementation.

---

# 7. FIRST DEMO EXPERIENCE

The finished experience should support a compelling approximately 60–120 second demonstration.

A target narrative:

## Scene 1 — Normal world

Begin with a clean Pacific-region view.

Minimal UI.

No dashboard.

Time is before the major disruption.

Submarine cable infrastructure can be revealed but need not dominate the view.

The user says or chooses:

"Show me the Tonga outage."

or launches the Tonga mission.

The agent takes control of the scene.

---

## Scene 2 — Take me there

Camera performs a deliberate cinematic move toward Tonga.

Do not teleport abruptly unless necessary.

Use God's Eye View's existing scene/camera primitives.

Context establishes:

WHERE WE ARE

WHAT DATE/TIME WE ARE VIEWING

WHAT INFRASTRUCTURE MATTERS

Avoid filling the screen with explanatory cards.

Use world-space labels and restrained HUD text.

---

## Scene 3 — Physical event

Reveal the eruption location.

If authoritative satellite imagery can be integrated legally and reasonably, consider displaying it contextually.

If not, use a clearly labeled reconstructed event marker and environmental context.

Never fake satellite imagery.

Never create fake observed imagery.

The agent can say approximately:

"This is the initiating physical event."

World annotation should identify the event.

---

## Scene 4 — Follow the infrastructure

User asks:

"Show me what connected Tonga to the rest of the Internet."

Reveal the relevant submarine cable.

The camera should physically FOLLOW the cable.

This is important.

Do not answer merely by highlighting a line and showing a card.

Use a camera traversal that helps the viewer understand geography.

Move from Tonga toward Fiji / external connectivity as supported by the data.

Relevant landing points may appear.

Other unrelated global cables should fade unless needed for context.

---

## Scene 5 — Show the failure

Move time into the outage.

Visualize the failure using defensible evidence.

For example:

- connectivity measurement falls
- network reachability changes
- the cable relationship visually changes
- affected Tonga geography changes state
- network observation annotations appear

Do not render a precise cable break coordinate unless authoritative evidence provides one.

If sources only establish that damage occurred some distance from a reference location:

visualize a POSSIBLE / REPORTED FAULT REGION

not a fake exact break point.

This is an important showcase for epistemic spatial design.

---

## Scene 6 — Ask why

User:

"Why did Tonga go dark?"

The agent should manipulate the world and explain the causal chain using the available evidence.

Example conceptual response:

physical event

→ reported cable damage

→ loss of primary international connectivity

→ observed traffic collapse

But every link must retain its evidence status.

Do not let the language model invent missing causal links.

---

## Scene 7 — Evidence lens

User:

"Show me only what we directly observed."

The scene should materially change.

Anything that is merely reported, inferred, contextual, current-reference, or reconstructed should disappear or become strongly de-emphasized.

The remaining world should show things such as:

- actual network measurements
- directly measured traffic behavior
- authoritative sensor observations

depending on what the gathered sources support.

Then user:

"Now show reported infrastructure damage."

Relevant reported information appears in a visually different style.

Then:

"Show the full reconstruction."

Derived / reconstructed context returns.

This interaction is a CORE PRODUCT FEATURE.

---

## Scene 8 — What don't we know?

User:

"What don't we know?"

Do not show a generic text disclaimer.

Make uncertainty spatial where possible.

Examples:

- uncertain break segment represented as a range
- unavailable event-time topology omitted
- unsupported causal relationships absent
- current cable reference visibly labeled CURRENT REFERENCE
- repair-vessel route omitted unless historical data exists
- approximate area uses an uncertainty envelope rather than a pin

A concise contextual explanation can accompany the scene.

---

## Scene 9 — Recovery

Advance time toward restoration.

Show recovery in the world.

If public network measurements support it, the network state returns.

Cable state changes to restored/repaired.

If documented satellite fallback existed, represent it only to the level supported by evidence.

Do not imply a precise satellite path or provider relationship unless documented.

The user should understand:

WHAT BROKE

WHY IT MATTERED

HOW THE EFFECT WAS MEASURED

WHAT TEMPORARY ALTERNATIVES EXISTED

HOW SERVICE RETURNED

without having read a report.

---

# 8. THE PRODUCT IS BUILT AROUND VERBS

Implement the product around these interaction verbs.

These are more important than panels.

## GO

Navigate to:

- event
- infrastructure
- geography
- evidence
- moment in time

Examples:

"Take me to Tonga."

"Go to the cable landing point."

"Show me where the eruption occurred."

---

## REVEAL

Expose relevant layers or objects.

Examples:

"Show submarine infrastructure."

"Show network evidence."

"Show satellite fallback."

"Show only observations."

---

## FOLLOW

Travel spatially along something.

Examples:

"Follow this cable."

"Follow the dependency."

"Trace the connection out of Tonga."

Camera motion is part of the answer.

---

## TRACE

Reveal relationships between things.

Examples:

"How is Tonga connected to the wider Internet?"

"What infrastructure sits between these two things?"

"Trace the failure chain."

---

## REPLAY

Move through time.

Examples:

"Replay the outage."

"Start ten minutes before connectivity drops."

"Show me the recovery."

---

## COMPARE

Compare world states.

Examples:

"Before versus after."

"Observed versus reconstructed."

"Normal connectivity versus outage."

---

## INTERROGATE

Ask questions about what is visible.

Examples:

"What am I looking at?"

"Why is this cable relevant?"

"How do we know this?"

"What's the source for this?"

"Is this actually observed?"

---

## FILTER BY EVIDENCE

Examples:

"Observed only."

"Hide inference."

"Show reported claims."

"Show reconstructed context."

"Show current reference infrastructure."

This must manipulate scene visibility/style.

---

## ANNOTATE

Place meaningful explanation in world-space.

Examples:

- fault region
- source-backed marker
- observation label
- connection
- boundary
- time-linked note

Prefer annotations attached to world objects over detached cards.

---

# 9. EVIDENCE LENSES

Create a concept called an EVIDENCE LENS.

At minimum support:

## OBSERVED

Directly measured or directly sensed.

Examples may include:

- traffic measurements
- BGP observations
- authoritative physical sensor output
- time-stamped instrument observations

Style should be the strongest / clearest.

---

## REPORTED

A primary or authoritative source explicitly says something happened.

Examples:

- operator reports cable damage
- official agency reports restoration

Visually distinct from observed.

---

## DERIVED

A deterministic transformation from authoritative underlying data.

Example:

a line created from known cable geometry.

---

## RECONSTRUCTED

A temporal/spatial representation built from multiple known facts.

Must be explicitly labeled.

Never present reconstruction as raw observation.

---

## INFERRED

Plausible but not established.

Use sparingly.

Dashed / uncertain style.

---

## CURRENT REFERENCE

Current topology shown to help understand a historical event.

This is not event-time evidence.

Visually subdued.

Explicitly labeled.

---

## UNKNOWN

Not an ordinary visible layer.

Unknown should manifest as:

- omitted relationship
- uncertainty region
- unanswered question
- unavailable topology
- explicit lack of evidence

Do not make up a connection just to complete the story.

---

# 10. NO FAKE CONFIDENCE SCORES

Do not invent percentages like:

"83% confidence"

unless there is a documented algorithm producing them and the meaning is defensible.

Use categorical epistemic state instead.

If a source itself publishes probability/confidence, preserve the source's value and attribution.

---

# 11. CORE DATA MODEL

Design the implementation around a canonical Situation model.

Exact filenames and structure should fit the current repository after inspection.

Conceptually support:

## Situation

- id
- title
- subtitle
- time range
- geographic focus
- entities
- events
- observations
- claims
- relationships
- evidence
- scenes
- timeline
- source registry

---

## Entity

Possible types:

- geographic location
- volcano
- cable
- cable landing point
- ISP/network
- ASN
- satellite service
- repair vessel
- facility
- country/region
- sensor/source

Fields should include where appropriate:

- id
- name
- type
- geometry
- geometry basis
- valid time
- provenance
- display metadata

---

## Event

Examples:

- eruption
- connectivity degradation
- cable fault report
- outage
- emergency connectivity activation
- repair start
- restoration

Fields:

- time
- duration
- involved entities
- geometry if defensible
- evidence references
- epistemic state

---

## Observation

Direct measurement.

Fields:

- metric
- value / normalized value
- timestamp
- measurement source
- geographic/network scope
- provenance

---

## Claim

A source's explicit statement.

Fields:

- text or structured assertion
- source
- publication time
- subject
- predicate
- object/value
- status

---

## Relationship

Examples:

CABLE CONNECTS LOCATION

NETWORK SERVES REGION

EVENT DAMAGES INFRASTRUCTURE

INFRASTRUCTURE SUPPORTS CONNECTIVITY

OBSERVATION MEASURES NETWORK

REPAIR RESTORES INFRASTRUCTURE

Fields:

- from
- to
- relationship type
- valid time
- evidence
- epistemic state

---

## Evidence

Fields:

- source name
- publisher
- source type
- publication date
- retrieval date
- relevant excerpt or structured fact
- URL/reference
- license / terms notes
- associated observations/claims/relationships

Keep copyrighted excerpts minimal.

Prefer structured paraphrase.

---

# 12. SITUATION RUNTIME

Create a reusable Situation Runtime rather than hard-coding every visual into the Tonga mission.

The Situation Runtime should be responsible for:

- loading a situation
- loading entities
- loading relationships
- controlling event time
- applying evidence lenses
- selecting/focusing entities
- revealing/hiding layers
- staging annotations
- tracing relationships
- exposing situation context to the AI agent
- coordinating camera actions
- coordinating scene director actions
- producing contextual evidence
- resetting/clearing a mission
- preserving shareable state if practical

The Tonga mission should be implemented using this generic machinery.

Do not create Tonga-specific application logic unless unavoidable.

---

# 13. AGENT TOOL EXTENSIONS

Inspect the existing God's Eye View voice/action architecture first.

If appropriate within current conventions, extend the agent with a small set of high-value Reality Debugger tools.

Potential conceptual tools:

`load_situation`

`get_situation_context`

`set_situation_time`

`play_situation`

`pause_situation`

`set_evidence_lens`

`focus_situation_entity`

`trace_relationship`

`follow_relationship`

`compare_situation_states`

`get_evidence_for_entity`

`get_evidence_for_relationship`

`explain_visible_situation`

`clear_situation`

Do NOT expose dozens of redundant tools if existing camera/annotation/layer tools already solve the problem.

Compose existing primitives where possible.

Tool results must be honest.

The model may only say an action occurred if the client reports success.

---

# 14. TEXT INPUT MUST WORK

Voice is impressive but should not be a hard prerequisite.

If the existing application only exposes voice for certain agent actions, add a compact text-command surface that routes through the same action/agent architecture where practical.

The demo should be usable with:

TEXT

and optionally:

VOICE

Do not require the product owner to obtain a paid key merely to see the primary deterministic mission.

AI-powered free-form reasoning may require a key.

The core mission playback and evidence lenses should not.

---

# 15. DEFAULT SCREEN DESIGN

The default view should be mostly world.

Target philosophy:

80–95% OF ATTENTION = WORLD

MINIMAL CHROME

A reasonable layout:

Top-left:

small mission identity / current time

Top-right:

compact evidence lens control

Bottom-center:

compact command bar

Bottom:

thin temporal scrubber when a situation is loaded

Contextual evidence:

appears temporarily near selected entity or as a compact overlay

No permanent giant investigation panel.

No left navigation rail unless absolutely necessary.

No permanent metric dashboard.

No wall of cards.

No grid of charts.

No generic "admin app" layout.

---

# 16. CONTEXTUAL EVIDENCE

Evidence should appear when requested or relevant.

Click/select an object:

small contextual element can show:

WHAT

STATUS

SOURCE

TIME

WHY IT IS VISIBLE

Example:

TONGA–FIJI CABLE

CURRENT REFERENCE

Source: [provider]

Relevance: principal international connectivity path associated with this situation.

or:

CONNECTIVITY COLLAPSE

OBSERVED

Source: Cloudflare measurement

Time: [verified timestamp]

A user can expand evidence if needed.

But evidence UI should not permanently consume a third of the screen.

---

# 17. TEMPORAL MODEL

Time is not decoration.

A mission must have an explicit temporal state.

At minimum support:

- mission start
- event onset
- degradation
- outage
- interim state
- repair/recovery
- restoration

The world should change as the scrubber moves.

Entities/relationships/annotations that do not belong at the selected time should not appear as if they are contemporaneous.

If current-reference infrastructure remains visible, style it clearly as reference context.

---

# 18. CAMERA IS SEMANTIC

Camera movement should communicate meaning.

Examples:

WORLD → PACIFIC

communicates geographic scale.

TONGA → CABLE ROUTE

communicates dependency.

CABLE ROUTE → FIJI

communicates external connection.

ERUPTION → FAULT REGION → TONGA

communicates causal sequence.

Do not use cinematic movement merely for decoration.

Avoid motion sickness.

Use eased deliberate camera transitions.

Provide skip/interrupt behavior.

Respect existing God's Eye View camera ownership/navigation transaction logic.

---

# 19. FIRST-MISSION DATA GATHERING

Research and store only the data necessary for the Tonga mission.

Potential requirements:

## Geography

- Tonga / Tongatapu
- Hunga Tonga–Hunga Haʻapai
- Fiji endpoint/context
- cable landing geography where authoritative data exists

## Cable

- relevant international cable geometry
- domestic cable only if useful
- cable metadata
- provenance
- licensing

Prefer existing God's Eye View bundled cable data if appropriate and legally usable for this noncommercial portfolio prototype.

Respect its existing provenance and data terms.

## Network observations

Gather historical evidence supporting:

- traffic decline
- outage onset
- BGP/reachability changes if available
- recovery timing

Cloudflare historical reporting is a useful candidate.

If raw historical API data cannot be obtained, create a small static normalized dataset from published measurements sufficient to reproduce the documented event.

Do not scrape or reproduce copyrighted charts wholesale.

## Physical event

Gather authoritative:

- event location
- event time
- event classification
- relevant satellite/environmental context if reusable under appropriate terms

## Cable damage

Represent only what public evidence establishes.

If evidence states a fault occurred some distance from a location but gives no exact coordinate:

create an uncertainty segment/region.

DO NOT INVENT A BREAK POINT.

## Fallback connectivity

Include satellite/emergency connectivity only to the level supported by reliable sources.

## Repair

Include repair vessel/location/route only if historical evidence is obtainable.

If exact historical vessel movement cannot be sourced:

do not invent it.

A reported repair event can still appear.

## Recovery

Use authoritative measurement to show connectivity restoration.

---

# 20. SOURCE AND LICENSE REGISTRY

Create a machine-readable and human-readable source registry.

For each provider/source record:

- owner
- title
- source type
- retrieval method
- license
- attribution requirements
- commercial restrictions
- whether data is vendored
- whether data is transformed
- historical/current
- which situation objects use it

Keep provider-specific data behind adapters when appropriate.

We want this prototype to be "commercially cleanable" later.

A restricted/noncommercial source is acceptable for the portfolio prototype if terms permit it, but architecture must allow replacement.

---

# 21. DATA QUALITY RULES

Never infer from absence alone.

Never treat current infrastructure as historical state unless documented.

Never geocode an organization's headquarters and claim an incident occurred there.

Never treat proximity as causation.

Never claim cable damage at an exact coordinate without evidence.

Never present a reconstructed route as observed.

Never turn a press report into an observation.

Never use a vulnerability's vendor location as vulnerability geography.

Never fill a missing relationship because the visualization looks incomplete.

Unknown is a valid answer.

---

# 22. VISUAL GRAMMAR

Create a consistent spatial language.

The exact styling should fit God's Eye View's aesthetic.

Conceptually:

OBSERVED
strong solid state

REPORTED
solid but visually differentiated annotation

DERIVED
clean contextual geometry

RECONSTRUCTED
clearly labeled reconstructed styling

INFERRED
dashed / translucent / uncertain

CURRENT REFERENCE
subdued / ghosted

UNKNOWN RANGE
soft envelope / range / uncertainty region

SELECTED
clear focus

IRRELEVANT CONTEXT
fade dramatically

Do not make everything glow red.

Avoid videogame threat clichés.

The product should look sophisticated.

---

# 23. NOT A THREAT MAP

Reality Debugger is not:

- a global threat heatmap
- a SOC dashboard
- a vulnerability browser
- a SIEM
- a threat actor map
- a generic OSINT dashboard
- a "cyber attack animation" toy
- a geopolitical tracker

The first mission happens to involve Internet infrastructure.

The deeper product is:

A SPATIAL SYSTEMS INVESTIGATOR.

---

# 24. DO NOT BUILD AI FIRST

First build the deterministic Situation Runtime and Tonga mission.

The following must work without an LLM reasoning step:

- mission loading
- world staging
- timeline
- cable reveal
- evidence lenses
- relationship tracing
- cinematic walkthrough
- source inspection
- before/after comparison

Only after this works should free-form agent reasoning be added.

The AI agent should operate ON a trustworthy world model.

It should not create the world model ad hoc.

---

# 25. AGENT REASONING RULES

When AI reasoning is added:

Provide the agent structured situation context.

Do not dump arbitrary raw web results into its prompt.

The agent should have access to:

- current time
- visible entities
- selected entity
- visible relationships
- evidence states
- source references
- current evidence lens
- camera/geographic context

The agent can explain:

- what is visible
- why it is relevant
- what changed
- which evidence supports a relationship
- what is unknown
- what to investigate next

It may NOT silently create unsupported causal facts.

---

# 26. PROJECT SETUP AUTONOMY

Handle project setup yourself.

If the current directory is not already a God's Eye View checkout:

1. obtain the public upstream repository
2. initialize a clean local working state
3. preserve upstream remote
4. create a working branch
5. install correct Node version/dependencies where tooling permits
6. run setup doctor
7. run the unmodified application
8. verify baseline behavior

If GitHub CLI is authenticated, creating a fork is fine.

If it is not authenticated:

DO NOT STOP.

Continue locally.

Publishing to GitHub can happen later.

---

# 27. BASELINE SAFETY CHECK

Before application changes:

Record:

- upstream commit SHA
- Node version
- dependency install result
- baseline build result
- baseline test result
- baseline tracking-test result if applicable
- baseline screenshots

This gives us a known-good state.

---

# 28. PROJECT DOCUMENTATION

Create concise useful documents such as:

`docs/REALITY-DEBUGGER.md`

Product thesis and interaction principles.

`docs/SITUATION-MODEL.md`

Canonical data model.

`docs/TONGA-MISSION.md`

Verified scenario timeline and source-backed facts.

`docs/SOURCES.md`

Source/license registry.

`docs/ARCHITECTURE.md`

How Reality Debugger extends God's Eye View.

`docs/DESIGN-SYSTEM.md`

Spatial evidence language.

`docs/DECISIONS.md`

Only meaningful architecture/product decisions.

`docs/QA.md`

Acceptance tests and demo script.

Do not create documentation merely to look busy.

---

# 29. IMPLEMENTATION PHASES

Proceed through these phases autonomously.

Do not stop after producing the plan.

---

## PHASE A — UNDERSTAND UPSTREAM

Inspect real current architecture.

Run it.

Test it.

Identify reusable primitives.

Document the minimal extension plan.

Then KEEP GOING.

---

## PHASE B — SITUATION DATA MODEL

Implement:

Situation

Entity

Event

Observation

Claim

Relationship

Evidence

Source

Temporal state

Epistemic state

Geometry metadata

Validate the data.

Write tests.

---

## PHASE C — TONGA STATIC DATASET

Gather/verify public evidence.

Create a deterministic static scenario.

Do not integrate live APIs yet.

Validate chronology.

Validate source references.

Validate coordinates.

Validate spatial basis.

---

## PHASE D — SITUATION RUNTIME

Load scenario.

Manage time.

Manage evidence lenses.

Manage relevant entities.

Expose state to UI/actions.

Write tests.

---

## PHASE E — WORLD-FIRST RENDERING

Render only the essential scene.

Add:

- event location
- cable
- affected geography
- observations
- fault uncertainty representation
- restoration state

No dashboard.

---

## PHASE F — CAMERA / FOLLOW EXPERIENCE

Implement:

"Take me there."

"Follow the cable."

"Show the failure."

"Show recovery."

Prefer existing scene/camera functions.

---

## PHASE G — TIMELINE / REPLAY

Implement temporal scrubber.

Implement deterministic playback.

Synchronize:

camera

world state

annotations

evidence

Make replay interruptible.

---

## PHASE H — EVIDENCE LENSES

Implement filters:

OBSERVED

REPORTED

RECONSTRUCTED / DERIVED

INFERRED

CURRENT REFERENCE

ALL

Scene must visibly change.

---

## PHASE I — INTERROGATION

Object selection should expose contextual provenance.

"How do we know?"

should resolve to actual source-backed evidence.

If AI isn't configured, deterministic evidence inspection should still work.

---

## PHASE J — TEXT + OPTIONAL VOICE AGENT

Reuse existing voice/action architecture.

Add text access to the same conceptual actions.

Enable natural commands.

Do not duplicate business logic separately for voice and text.

---

## PHASE K — VISUAL POLISH

Now make it beautiful.

Cinematic camera easing.

World-space typography.

Subtle evidence styling.

Transitions.

Mission title.

Time display.

Minimal chrome.

Source interactions.

Loading states.

Reset/restart.

---

# 30. VISUAL QA IS MANDATORY

Do not consider a feature done because:

- code compiles
- tests pass
- DOM element exists

You must LOOK AT THE PRODUCT.

Use browser automation/screenshots where available.

Capture evidence at key states:

1. default mission start
2. Tonga regional approach
3. cable-follow view
4. outage state
5. OBSERVED-only evidence lens
6. full reconstruction
7. uncertainty/fault range
8. recovery state
9. contextual source interaction

Inspect those screenshots.

Fix:

- clutter
- unreadable text
- awkward camera framing
- overlapping labels
- huge UI panels
- poor contrast
- meaningless geometry
- confusing evidence styles
- bad timing
- dead space
- visually weak transitions

Repeat until polished.

---

# 31. ANTI-DASHBOARD QA GATE

Before calling the UI finished, answer these honestly:

### Test 1

If the globe were replaced by a static map screenshot, would most of the product still work?

If YES:

FAIL.

We built a dashboard.

### Test 2

Does understanding the event require meaningful camera movement?

If NO:

FAIL.

### Test 3

Does moving the time slider materially change the world?

If NO:

FAIL.

### Test 4

Can the user physically follow an infrastructure relationship?

If NO:

FAIL.

### Test 5

Can the user remove unsupported/inferred information from the scene?

If NO:

FAIL.

### Test 6

Does asking "how do we know?" produce source-specific evidence?

If NO:

FAIL.

### Test 7

Can a user understand the broad failure story without reading a long panel?

If NO:

FAIL.

### Test 8

Does the product still feel recognizably like God's Eye View?

If NO:

FAIL.

### Test 9

Does Reality Debugger add a capability that God's Eye View did not previously provide?

If NO:

FAIL.

### Test 10

Does the demo produce at least one moment that makes a technically sophisticated viewer say:

"Oh — that's a much better way of understanding this."

If NO:

KEEP ITERATING.

---

# 32. ENGINEERING QA

Do not regress upstream.

Run the repository's required checks.

At minimum inspect/use current equivalents of:

- setup doctor
- build
- unit tests
- tracking invariants
- formatting checks where appropriate
- existing headless QA harnesses
- new Reality Debugger tests

Add focused tests for:

- situation schema
- evidence states
- time filtering
- lens filtering
- relationship visibility
- invalid geometry
- current-reference labeling
- missing evidence
- unsupported inference
- mission loading
- action success/failure semantics

---

# 33. PERFORMANCE

Do not load the entire world's new dataset at once.

The Tonga mission is intentionally bounded.

Avoid destroying God's Eye View startup/runtime performance.

Lazy-load mission-specific assets if useful.

Clean up Cesium entities and listeners when a mission exits.

Do not leak scene primitives between reloads.

---

# 34. ERROR BEHAVIOR

If an optional data provider is unavailable:

degrade gracefully.

If AI key is absent:

mission remains usable.

If historical data is unavailable:

do not fake it.

If a route cannot be established:

say so.

If a source is ambiguous:

mark it.

If imagery fails:

use a defensible fallback.

The product should fail HONESTLY.

---

# 35. SECURITY

Follow existing God's Eye View security practices.

Do not:

- expose server-side secrets
- allow arbitrary proxy URLs
- bypass SSRF protections
- add unbounded fetches
- execute untrusted source text
- weaken local-only defaults

Treat source-fed text as untrusted.

Keep tool surfaces narrow.

---

# 36. ATTRIBUTION

Preserve prominent upstream credit.

Reality Debugger is built on God's Eye View.

Do not obscure Bilawal Sidhu's contribution.

Document clearly:

UPSTREAM FOUNDATION

versus

REALITY DEBUGGER ORIGINAL WORK

Original contributions should include things like:

- Situation Runtime
- evidence lens
- temporal/epistemic situation model
- dependency traversal
- situation actions/tools
- mission reconstruction framework
- Tonga mission dataset
- context-aware evidence interrogation
- related visual grammar

---

# 37. DO NOT OVERBUILD

For v1, do NOT add:

- user accounts
- database
- enterprise login
- billing
- SIEM integrations
- SOC workflow
- alert queues
- incident management
- huge threat feeds
- vulnerability scanning
- private telemetry
- multi-user collaboration
- Kubernetes
- cloud deployment architecture
- generalized simulation engine
- dozens of missions

ONE EXCELLENT MISSION.

ONE REUSABLE RUNTIME.

---

# 38. AUTONOMY RULES

Do not ask the product owner:

"Which folder should I use?"

"Should I create this component?"

"Would you like me to continue?"

"Should I add tests?"

"Should I research this?"

"Which library should I choose?"

"Can I refactor this small module?"

Make ordinary engineering decisions yourself.

Document meaningful decisions.

Proceed.

---

# 39. ESCALATION CONDITIONS

Ask the product owner only when:

## 1. AUTHORIZATION

A credential/account purchase/paid service or external authorization is truly required and no reasonable fallback exists.

## 2. MAJOR PRODUCT FORK

Two significantly different user experiences are both viable and choosing one would substantially alter the product thesis.

## 3. IRREVERSIBLE ARCHITECTURE

A major architectural commitment would be expensive to reverse.

## 4. EVIDENCE DEAD END

The mission's central story cannot be represented honestly with obtainable public evidence.

Do not escalate routine problems.

---

# 40. WHEN BLOCKED

Before claiming blocker:

1. investigate the codebase
2. inspect docs
3. search upstream issues
4. inspect related modules
5. research alternatives
6. attempt a reasonable fallback
7. document what failed

Then escalate only if actually necessary.

---

# 41. KEEP A LIVE BUILD JOURNAL

Maintain a concise project progress file.

For each meaningful milestone record:

DONE

CURRENT

NEXT

BLOCKERS

KEY DECISIONS

Do not dump enormous logs.

This allows project continuity across Codex sessions.

---

# 42. SELF-REVIEW AFTER EACH MAJOR PHASE

Before proceeding, review your own diff as a senior engineer.

Look for:

- unnecessary duplication
- upstream primitives not reused
- coupling
- stale listeners
- brittle hard-coded IDs
- fake precision
- accidental unsupported claims
- poor naming
- missing tests
- unnecessary UI
- styling inconsistent with upstream
- source/license issues

Fix obvious issues before continuing.

---

# 43. DEMO COMMANDS — DEFINITION OF DONE

The finished first mission should support equivalents of these interactions.

Exact phrasing need not be hard-coded.

### Command

"Show me the Tonga outage."

Expected:

mission loads and world moves to appropriate region/time.

### Command

"Show me what connected Tonga to the Internet."

Expected:

relevant cable/infrastructure appears.

### Command

"Follow the cable."

Expected:

camera meaningfully traverses cable geometry.

### Command

"What broke?"

Expected:

world stages the documented fault/damage information with appropriate uncertainty.

### Command

"Show me the outage."

Expected:

temporal network observation becomes spatially understandable.

### Command

"Show me only what was observed."

Expected:

reported/reconstructed/inferred/reference context disappears or is strongly suppressed.

### Command

"Show me the reconstruction."

Expected:

context returns with clear visual distinction.

### Command

"How do we know this?"

Expected:

source-backed evidence is surfaced for the selected statement/object.

### Command

"What don't we know?"

Expected:

system communicates meaningful uncertainty rather than generating speculation.

### Command

"Replay it."

Expected:

time and world state animate coherently.

### Command

"Show me recovery."

Expected:

mission advances to service restoration and visually communicates it.

---

# 44. PORTFOLIO QUALITY BAR

This is being built as evidence of senior-level:

AI product thinking

security/infrastructure understanding

agent design

human-AI interaction design

systems thinking

data provenance discipline

spatial intelligence

technical product execution

AI-assisted software engineering

A hiring manager should NOT conclude:

"She cloned God's Eye View and added data."

They SHOULD conclude:

"She identified an underused spatial-computing primitive, designed a new interaction model around causal/evidence-based investigation, extended the agent and scene runtime, created a trustworthy temporal world model, and shipped a compelling working experience."

---

# 45. THE FINAL EXPERIENCE SHOULD FEEL LIKE THIS

Not:

READ ABOUT THE INCIDENT.

But:

ENTER THE INCIDENT.

Not:

SEE AN OUTAGE METRIC.

But:

WATCH CONNECTIVITY DISAPPEAR.

Not:

READ THAT A CABLE MATTERED.

But:

FOLLOW THE CABLE THROUGH THE OCEAN.

Not:

READ A SOURCE LIST.

But:

ASK THE WORLD HOW IT KNOWS.

Not:

VIEW A HYPOTHESIS.

But:

TURN INFERENCE ON AND OFF.

Not:

SEE A TIMELINE CHART.

But:

MOVE THROUGH TIME.

Not:

CHAT ABOUT THE WORLD.

But:

USE THE AGENT TO OPERATE THE WORLD.

---

# 46. PRIMARY DESIGN MANTRA

When making implementation decisions, continually ask:

# CAN THIS ANSWER BE SHOWN THROUGH THE WORLD ITSELF?

If yes:

prefer that.

If no:

use minimal contextual UI.

---

# 47. FIRST ACTIONS

Begin immediately.

Do not respond with only a plan.

Perform the work.

Your first sequence should be:

1. inspect working directory
2. acquire/open God's Eye View if necessary
3. establish baseline
4. run it
5. inspect current architecture and existing primitives
6. create concise Reality Debugger project docs
7. research and source the Tonga mission
8. create the canonical Situation model
9. build the static mission dataset
10. implement situation runtime
11. implement first world-state rendering
12. implement timeline/replay
13. implement evidence lenses
14. implement cable follow/traversal
15. implement contextual evidence interrogation
16. connect text commands
17. connect existing AI/voice system where appropriate
18. visually QA the actual experience
19. correct dashboard-like drift
20. run full tests
21. polish the 60–120 second demo path

Do not stop after architecture analysis.

Do not stop after creating documentation.

Do not stop after loading the first marker.

Do not stop when something is merely functional.

Continue until the first mission satisfies the acceptance criteria in this contract or a genuine escalation condition is reached.

---

# 48. FINAL ACCEPTANCE CHECK

Do not declare the milestone complete until ALL are true:

[ ] God's Eye View baseline still works.

[ ] Tonga mission is data-backed and source-documented.

[ ] The world, not a dashboard, is the primary interface.

[ ] Time materially changes the scene.

[ ] The user can follow real infrastructure spatially.

[ ] Evidence states materially change the scene.

[ ] Exact versus approximate geography is visually distinguishable.

[ ] Historical versus current-reference data is distinguishable.

[ ] "How do we know?" resolves to actual provenance.

[ ] Unknowns are preserved.

[ ] No fake causal links are present.

[ ] No invented exact cable break coordinates are present.

[ ] A text-driven demo works.

[ ] Voice can enhance it when configured.

[ ] Major actions reuse God's Eye View primitives where reasonable.

[ ] Automated tests pass.

[ ] Existing upstream QA does not regress.

[ ] Key demo states have been visually inspected via screenshots/browser.

[ ] UI is polished.

[ ] UI does not resemble an admin dashboard.

[ ] The 60–120 second demo is compelling.

[ ] Upstream credit is clear.

[ ] Reality Debugger's original contribution is clear.

If any item fails:

KEEP WORKING.

# BEGIN.
