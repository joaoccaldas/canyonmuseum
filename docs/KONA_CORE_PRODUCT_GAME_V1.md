# KONA Core Product + Room Totem Game V1

Status: **proposal / architecture only**  
Runtime impact in this PR: **none**  
Target: post-launch progression layer  
Dependency: designed to consume the canonical progression / Finds contracts after the launch candidate lands.

## Product in one sentence

**KONA is a playable race-week world where places, heritage, gear, athletes and brands become things you can discover, unlock, understand, collect and share.**

It is not a museum with gamification bolted on.  
It is not a training app with a game hiding inside it.

The game is the connective tissue between the real event, the world, the stories and the products.

```
ARRIVE
  ↓
NOTICE SOMETHING
  ↓
GUESS / DISCOVER / EARN A TOTEM
  ↓
UNLOCK A ROOM
  ↓
EXPLORE + LEARN + FIND
  ↓
COLLECT
  ↓
COMPARE / TRADE / SHARE
  ↓
COME BACK FOR THE NEXT DOOR
```

---

# 1. The season object: 100 KONA Finds

A KONA season has one canonical collection of **100 Finds**.

Most items should teach the player something about:

- Kona race week;
- triathlon heritage;
- swim / bike / run culture;
- race-course details;
- athlete rituals;
- transition and check-in;
- engineering;
- iconic machines;
- community and volunteers;
- the practical reality of racing or supporting someone racing.

A smaller number may simply be strange or funny. Delight is part of the product.

The ideal outcome is that someone finishes the collection and realizes they accidentally learned how Kona works.

## Three canonical acquisition methods

### Hidden Find
Discovered in:
- a 3D room;
- the world;
- Home;
- Discover;
- Garage;
- Progress;
- another explicitly eligible surface.

### Trade
Received from another verified user.

Trade transfers a canonical collectible identity. It must not create a second inventory model.

### Special Event
Awarded by a verified event:
- race-week moment;
- challenge;
- room reveal;
- athlete drop;
- brand activation;
- scheduled event.

**The core 100-item collection must never require a purchase.**

---

# 2. Totems are the room-access model

A room should not open because a UI check says `level >= 6`.

A room opens because the user possesses a **Totem** that grants access.

A Totem is itself an inventory object with meaning inside the room's story.

Examples:

| Room | Totem idea |
| --- | --- |
| Wind tunnel | Smoke wand / pressure key |
| Kona Champions | Champion bib fragment |
| Lava Night | Obsidian key |
| Secret Collection | Torn map fragment |
| Running Lab | Numbered lace tag |
| Historical Archive | Stamped archive pass |
| Prototype Vault | Prototype tag |
| Athlete Room | Race-band token |
| Brand Room | Engineering sample / design token |

Canonical flow:

```
Totem
  ↓
RoomAccessGrant
  ↓
Door becomes enterable
  ↓
Room becomes reachable by map, deep link and 3D navigation
```

Every surface consumes the same grant. There are no route-specific room permissions.

## Admin

Admin keeps the existing centralized bypass:
- all current rooms visible;
- every current door enterable;
- Totems inspectable;
- content tools available.

Admin does **not** need fake personal ownership of every Totem. Visibility and personal progression remain separate concepts.

---

# 3. Doors create curiosity

Locked content should not turn KONA into a corridor of padlocks.

Every room declares one door-presentation mode.

## Visible
The door is physically obvious.

The player may see:
- the door;
- Totem socket;
- required key silhouette;
- theme cues;
- clues.

Use for important progression rooms.

## Hinted
The room is implied:
- light under a wall;
- strange seam;
- sound;
- disabled lift button;
- symbol;
- map anomaly;
- shadow.

Use when curiosity is more valuable than clarity.

## Secret
No explicit door is shown.

Discovery comes through:
- a clue;
- Find;
- map fragment;
- another user;
- special event;
- unexpected interaction.

Doors are presentation data. They never own progression logic.

---

# 4. The recurring Door Guess

Default cadence: **one eligible challenge roughly every three days**.

The cadence is configuration and can vary by season. It is never a UI timer hardcoded into a component.

Prompt:

> Something is behind this door.  
> What do you think it is?

Clues may use:
- silhouette;
- sound;
- cropped product detail;
- historical year;
- athlete quote;
- engineering measurement;
- material;
- route coordinate;
- race split;
- room colour;
- brand detail.

## Competitive answer format

Leaderboard scoring must be deterministic.

Use structured dimensions:
- theme;
- era;
- discipline;
- object/category;
- brand/product family when appropriate.

Optional free text is encouraged for fun but does **not** decide competitive score.

## Reveal sequence

1. challenge closes;
2. room is revealed;
3. canonical answer is published;
4. guesses receive accuracy;
5. early-access Totems are issued;
6. normal unlock path opens later.

---

# 5. Early access without making the season unfair

The closest guesses should receive the Totem before everybody else.

That is part of the magic.

Recommended awards:
- top accuracy band → early-access Totem;
- exact guess → exact-guess badge;
- fastest exact guess → **First Read** distinction;
- ties on accuracy → submission timestamp.

Requirements:
- minimum challenge-open window;
- predictable closing rule;
- no hidden paid advantage;
- main collection remains completable later by everyone.

Early access gets:
- first entry;
- first discovery opportunities;
- bounded leaderboard bonus;
- social distinction.

It must **not** make the season mathematically unwinnable for someone who joined later.

---

# 6. Ranking

Do not show global ranking until a real server-authoritative population exists.

Before then:

**Unranked**

## Season Rank dimensions

### Collection
- Finds / 100;
- room sets;
- rarity profile;
- completed collections.

### Discovery
- hidden Finds;
- room discoveries;
- secret rooms;
- verified first-find events.

### Door skill
- guess accuracy;
- exact guesses;
- early Totems.

### Speed
- access → room completion;
- season completion;
- verified global firsts.

## Score principle

Only canonical, verifiable events may affect rank.

Never reward ranking points for:
- affiliate clicks;
- purchases;
- repeated Share taps;
- advertisements;
- arbitrary button farming.

Example formula:

```
season_score =
  find_points
+ collection_completion
+ guess_accuracy
+ bounded_early_access
+ bounded_first_discovery
+ room_completion
```

All weights belong in versioned data.

## Two different leaderboards

### Season Rank
Fair, bounded score.

### Global Firsts
Separate prestige for:
- first Find;
- first room entry;
- first full set;
- first exact door guess;
- first 100/100 completion.

This lets speed matter without making the main ranking purely timezone-dependent.

---

# 7. Rooms are mini collections

Rooms organize Finds into stories.

Example sets:

### Queen K
- asphalt chip;
- windsock thread;
- course marker;
- nutrition card;
- historic bike detail.

### Swim
- buoy token;
- goggle strap;
- swim cap;
- salt-line Find;
- swim-history artifact.

### Transition
- rack number;
- timing chip;
- transition band;
- bike-check tag.

### Engineering
- carbon tile;
- pressure dot;
- ceramic bearing;
- smoke wand;
- prototype tag.

### Finish
- bib fragment;
- finish-tape thread;
- midnight light;
- split card.

Completing a room collection may award:
- XP;
- Kona Credits;
- badge;
- cosmetic;
- Totem;
- next-room clue.

---

# 8. Return loop

KONA should not show a popup every time somebody opens it.

Return moments are selected from a configurable event pool:

- a door appeared;
- a door vanished;
- a new clue arrived;
- something moved in a room;
- an unexpected Find appeared;
- a Totem has changed;
- a community guess is closing;
- someone traded an item;
- a new athlete drop exists;
- a special-event room opened;
- a brand room has a new object/story;
- the Intern has written something inexplicably excellent.

One significant surprise per session maximum unless the user explicitly enters a challenge flow.

---

# 9. What the core product is for each participant

## For the ordinary user

KONA is a reason to come back to a world that keeps changing.

Value:
- discover Kona;
- understand the race;
- collect memorable details;
- learn triathlon heritage;
- inspect beautiful bikes and gear;
- prepare for a future race;
- dream about racing;
- follow athletes;
- compare setups;
- trade;
- share discoveries.

The game gives structure to curiosity.

## For an athlete

KONA is a richer athlete/fan layer than a conventional profile.

Athlete opportunities:
- athlete room;
- race-week diary;
- training / setup story;
- personal gear graph;
- historical context;
- athlete-created clues;
- limited athlete drops;
- fan challenges;
- Q&A or story moments;
- verified race result memories.

The athlete is a storyteller and participant, not a banner ad.

## For a brand

KONA is contextual product storytelling inside the moment when users care.

Brand value:
- authored room;
- product history;
- engineering stories;
- high-quality 3D inspection;
- compatible setup;
- maintenance knowledge;
- athlete connection;
- challenge sponsorship;
- Totems and event drops;
- optional commerce when relevant.

### Brand boundary

A partner may fund or author:
- a room;
- a story;
- a challenge;
- a cosmetic;
- an event collectible;
- an engineering experience.

A partner may **not**:
- buy leaderboard rank;
- make the core 100 collection purchase-gated;
- receive hidden preference in editorial ranking;
- turn a safety/race fact into promotional copy.

Commerce is downstream of interest, never the gate to discovery.

---

# 10. Product flywheel

```
REAL EVENT
  ↓
ROOM / STORY / CLUE
  ↓
TOTEM
  ↓
ACCESS
  ↓
FIND
  ↓
KNOWLEDGE + OWNERSHIP
  ↓
SHARE / TRADE
  ↓
ATHLETE + BRAND + COMMUNITY
  ↓
NEW EVENT / ROOM / CLUE
```

This is the core product.

The 3D museum is one renderer for it.
The feed is one discovery surface for it.
Garage is one ownership surface for it.
Progress is one measurement surface for it.
Brands and athletes are content participants inside it.

---

# 11. Safety, fairness and integrity

- Core race and safety information is never progression-locked.
- Purchases never create ranking advantage.
- No paid randomness.
- Random discovery is deterministic/auditable server-side when competitive.
- Trading requires server authority before it affects global rank.
- Duplicate/self-trading must not farm points.
- Door-guess scoring is deterministic.
- Free-text creative answers never determine competitive placement.
- Protected natural/cultural objects must not encourage real-world removal.
- Sacred or culturally restricted Hawaiian objects are not gamified without appropriate authority and partnership.
- Youth/community features require appropriate safety/privacy design before launch.

---

# 12. Architecture

Required canonical objects:

```
Season
Find
Totem
Room
DoorPresentation
RoomAccessGrant
DoorChallenge
ChallengeSubmission
ChallengeResult
Trade
SpecialEventGrant
SeasonScoreEvent
LeaderboardSnapshot
```

Principles:
- IDs, not UI labels, are authority;
- presentation consumes state;
- server owns competitive state;
- local-first may remain for noncompetitive personal exploration;
- version every scoring rule;
- preserve source/provenance;
- no brand-specific runtime branches.

---

# 13. Rollout

## V1
- Totems as room access;
- visible/hinted/secret doors;
- one three-day Door Guess;
- early-access Totems;
- 100-Find seasonal score;
- server-authoritative leaderboard;
- room mini-collections.

## V1.1
- athlete drops;
- trade between verified users;
- Firsts leaderboard;
- richer clue types.

## V1.2
- partner/brand authored challenges;
- branded engineering Totems;
- contextual commerce;
- cross-event seasonal collections.

## Not part of launch PR

This proposal must not block the current KONA launch candidate.
