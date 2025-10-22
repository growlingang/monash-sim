# Monash Uni Life Sim — Day 1 Design Brief

## Day 1 Goal
Introduce the player to every core system in a single playable day while setting narrative stakes for the group assignment. The player should finish Day 1 with:
- Familiarity with the MONASH stat suite, hunger, time, and money economies.
- Rapport baseline with all five NPC teammates and at least one DM exchanged via phone.
- Awareness of the assignment topic without starting any actual progress.
- A complete activity log that reinforces cause-and-effect for every choice made.

Day 1 ends at the recap screen; Day 2 (and assignment work) unlocks afterward.

## Core Stats & Resources
- **M (Mobility):** Impacts movement challenges and commuting minigames (walk/drive success windows).
- **O (Organisation):** Governs time management checks; fuels recap bonuses from well-planned routes.
- **N (Networking):** Influences rapport gains and DM availability.
- **A (Aura):** Represents confidence/charisma; shifts dialogue outcomes and social feed effects.
- **S (Skills):** Academic/technical capability needed for future assignment checks; Day 1 mostly referenced in flavor.
- **H (Hunger):** Integer 0–10. Starts at 10. Drops 1 point per major time block (>60 min) and when minigame failures occur. If <5, fatigue penalties apply.
- **Money:** Starts at $60. Used for transport and food; cannot fall below $0.
- **Time:** Start clock at 07:00. Track in 15-minute increments. Hard cap 22:00 (recap autopops). Time costs listed per action; overflow forces warnings and trims evening options.

## Majors & Starting Loadout
| Major       | Special Item       | Stat Spread (M/O/N/A/S/H) |
|-------------|--------------------|----------------------------|
| Engineering | Pocket toolbox     | 6 / 5 / 4 / 4 / 7 / 10     |
| Medicine    | Stethoscope        | 5 / 6 / 4 / 5 / 6 / 10     |
| Law         | Case compendium    | 4 / 6 / 5 / 6 / 5 / 10     |
| IT          | Custom laptop      | 5 / 5 / 5 / 4 / 6 / 10     |
| Science     | Lab kit            | 5 / 5 / 4 / 5 / 7 / 10     |
| Arts        | Sketch journal     | 4 / 4 / 6 / 7 / 5 / 10     |

Special item is cosmetic for Day 1 but logged in inventory and may unlock flavor line with NPC of same major focus.

## NPC Roster (Group Members)
- **Bonsen (IT):** Chill problem-solver. Loves tech chatter.
- **Zahir (Medicine):** Nervous but diligent. Responds well to organised or empathetic replies.
- **Jiun (Science):** Curious, data-driven. Values analytical responses.
- **Anika (Law):** Direct, competitive. Appreciates confident Aura-boost replies.
- **Jia Wen (Arts):** Creative, upbeat. Responds to expressive or collaborative vibes.

Each NPC tracks rapport from -3 to +5 on Day 1. Default start at 0.

### NPC Dialogue References
- **Friendly option baseline:** `+2 rapport`, `+1 Aura` (Anika, Jia Wen), `+1 Networking` (Bonsen, Zahir, Jiun) depending on their focus.
- **Dismissive option baseline:** `-1 rapport`, `-1 Aura`. If rapport hits -2, NPC flags cooled tone for future segments.
- **Major-linked option:** Grants `+2 rapport` if player major aligns with interest (Medicine↔Zahir, IT↔Bonsen, Science↔Jiun, Law↔Anika, Arts↔Jia Wen). Otherwise still `+1 rapport`. Often yields a stat bump tied to NPC discipline (+1 Skills for Zahir/Jiun, +1 Organisation for Anika, +1 Networking for Bonsen, +1 Aura for Jia Wen).

### NPC Greeting & Reply Script
- **Bonsen greeting:** “Hey! I’m Bonsen. If something breaks, hand it to me.”
   - Friendly reply: “Great to meet you, Bonsen—can’t wait to see your setup in action!” → `+2 rapport`, `+1 Networking`, flavor: “Bonsen grins and lifts his laptop.”
   - Dismissive reply: “Cool. Let’s just do our parts.” → `-1 rapport`, `-1 Aura`, flavor: “He shrugs but steps back.”
   - Major-linked reply: “I’m into tech too—maybe we can compare builds later?” → If player major IT: `+2 rapport`, `+1 Networking`, unlock flag `bonsen-custom-kit`. Else: `+1 rapport`, `+1 Networking`.
- **Zahir greeting:** “Hi, I’m Zahir. First-day butterflies, but I’m ready to help.”
   - Friendly reply: “We’ll have each other’s backs, Zahir. You’ve got this.” → `+2 rapport`, `+1 Networking`, flavor: “Zahir exhales and smiles.”
   - Dismissive reply: “Just tell me what you need from me later.” → `-1 rapport`, `-1 Aura`, flavor: “He fidgets with his stethoscope.”
   - Major-linked reply: “I’m [player major]; maybe we can swap study tips over coffee?” → If player major Medicine: `+2 rapport`, `+1 Skills`, unlock flag `zahir-family-motivation`. Otherwise `+1 rapport`, `+1 Networking`.
- **Jiun greeting:** “Hello! I’m Jiun. I like making sense of data—I hope that’s useful.”
   - Friendly reply: “Data is our friend—let’s chart our way to a win.” → `+2 rapport`, `+1 Networking`, flavor: “Jiun adds you to a spreadsheet on their tablet.”
   - Dismissive reply: “We’ll see if we need charts later.” → `-1 rapport`, `-1 Aura`, flavor: “Their enthusiasm dims.”
   - Major-linked reply: “Science brains unite; maybe you can show me your lab notes?” → Science major: `+2 rapport`, `+1 Skills`, flag `jiun-lab-habit`. Others: `+1 rapport`, `+1 Organisation`.
- **Anika greeting:** “I’m Anika. Let’s keep things sharp and on schedule.”
   - Friendly reply: “Love the energy—structure will save us all!” → `+2 rapport`, `+1 Aura`, flavor: “Anika nods approvingly.”
   - Dismissive reply: “Schedules stress me out—let’s not overdo it.” → `-1 rapport`, `-1 Aura`, flavor: “She raises an eyebrow.”
   - Major-linked reply: “From one legal mind to another, let’s brief this like pros.” → Law major: `+2 rapport`, `+1 Organisation`, flag `anika-moot-team`. Others: `+1 rapport`, `+1 Aura`.
- **Jia Wen greeting:** “Hi! I’m Jia Wen. I love turning wild ideas into something beautiful.”
   - Friendly reply: “Your energy is contagious—let’s make this project sing.” → `+2 rapport`, `+1 Aura`, flavor: “She twirls her sketch journal.”
   - Dismissive reply: “Let’s keep it practical, okay?” → `-1 rapport`, `-1 Aura`, flavor: “Her smile wavers.”
   - Major-linked reply: “I sketch too—maybe we can storyboard our pitch later?” → Arts major: `+2 rapport`, `+1 Aura`, flag `jiawen-sketch-collab`. Others: `+1 rapport`, `+1 Networking`.

## Required Segments
1. **Character Creation**
   - Prompt major selection.
   - Display starting stats, item, money.
   - Log selection to activity history.
2. **Morning Commute**
   - Options: Walk (free, hard), Bus/Tram ($5, medium), Drive ($12, easy + parking micro challenge).
   - Each option triggers a minigame result payload `{ success: boolean, timeCost, statDelta, hungerDelta, moneyCost, recapNote }`.
   - If unaffordable, surface blocker message and re-prompt. If both paid options blocked, auto-assign Walk with warning.
3. **Campus Exploration**
   - Player moves avatar across a simple campus map with hotspots: Cafeteria, Library, Lecture Theatre.
   - Cafeteria: optional food purchase ($8) raising hunger to 10.
   - If hunger <5 after exploration and no food purchased, show fatigue warning.
4. **Afternoon Group Meeting**
   - Sequentially present each NPC greeting.
   - Offer three replies (Friendly, Dismissive, Major-Linked).
   - Each reply defines rapport delta, stat change (if any), and flavor response.
   - Log outcomes and any new flags (e.g., memory about family).
5. **Assignment Reveal**
   - Present the topic text.
   - Update notes with “Assignment due Day 7, 11:59 PM.”
6. **Phone Tutorial**
   - Force opening of apps: Texts, Map, Notes, Social Feed, Inventory.
   - Random NPC DM with two reply options; apply rapport/stat outcomes.
   - Doomscroll option (+1 Aura, -30 min) only usable once.
7. **Evening Segment**
   - Commute home with morning transport options (validate affordability).
   - Evening activity choice: Eat, Rest, Text NPC, Doomscroll (if unused). Validate hunger/money/time before resolving.
8. **End-of-Day Recap**
   - Summarize MONASH stats, hunger, money, rapport per NPC.
   - Show ordered activity log entries with time/money/stat outcomes.
   - Close with reminder message about Day 2 assignment work.

## Minigame Hooks
- **Walk (Crossy-style lane dodger):** 9 traffic lanes, tile size 32 px, player sprite 32×32. Vehicles spawn every 1.2 s baseline; Mobility ≥6 slows spawns to 1.5 s, Mobility ≤4 speeds to 0.9 s. Success (reach campus within 60 s real time) consumes 45 in-game minutes (07:00→07:45) and grants `+1 Mobility` if current M ≥6. Failure (collision or timeout) adds +15 minutes, `-1 Mobility`, `-1 Hunger`, and restarts. After two failures, auto-complete with message “You stumble onto campus, exhausted.”
- **Bus/Tram (Balance mini):** Side-view balance bar 120 px wide with wobble frequency driven by Aura. Player sprite 32×48. Aura ≥6 expands safe zone by 15 px; Mobility ≤4 shrinks by 20 px. Success (stay balanced 25 s) costs 35 minutes, $5, `-1 Hunger`, and grants `+1 Networking` if N <7. Failure keeps $5 spent, adds +20 minutes, `-1 Aura`, `-1 Hunger`; bus auto-retries with shortened 15 s phase.
- **Drive (Traffic dodger + parking micro):** Top-down 3-lane road (32 px lanes) followed by 10 s parking timing bar. Car sprite 32×64. Organisation or Aura ≥6 slows traffic speed by 10%; Mobility ≤4 speeds up 10%. Success keeps commute at 30 minutes, costs $12, `-1 Hunger`, yields `+1 Organisation`. Collision failure adds +15 minutes and `-1 Mobility` before a retry. Parking failure adds +10 minutes and `-1 Aura`; second parking miss auto-finishes with warning “Parking sensors saved you.”

Each minigame returns standardized data so the narrative layer can provide explicit feedback to the player.

## Timing, Hunger, and Economy Rules
- **Time Pool:** Track `currentTime` in minutes since 07:00. Core segments consume: Commute (30–60), Exploration (max 45), Meeting (60), Phone (30 mandatory), Evening commute (same costs), Evening activity (30). If `currentTime` ≥ 21:30 after evening activity, transition to recap instantly.
- **Hunger Drain:** Reduce hunger by 1 for every full 60 minutes elapsed plus extra penalties listed in minigame failures. Cafeteria meal sets hunger to 10. Rest adds `+2 Hunger` capped at 10. Doomscrolling does not change hunger.
- **Money Flow:** All costs immediately deducted. If player cannot afford food ($8) during cafeteria or evening Eat action, warn and keep hunger unchanged. If money <5 before evening commute, only Walk is available (with flavor note).
- **Stat Caps:** MONAS stats clamped 0–10. No stat drops below 0.
- **Rapport Bounds:** Clamp between -3 and +5. Display warnings when hitting bounds.

## Phone Tutorial Logic
- Player must open apps in this order: Texts → Map → Notes → Social Feed → Inventory.
- **Texts:** Shows group chat entry (“Assignment due Day 7, 11:59 PM.”). DM sender randomly picked among NPCs with rapport ≥0 (weighted equally). Friendly reply: `+1 rapport`, `+1 Networking`, no time cost. Rude reply: `-1 rapport`, `-1 Aura`, adds a “strained DM” flag. If all rapport <0, display “No new messages today.”
- **Map:** Static panel listing travel costs, times, hunger impacts (for transparency). No stat change.
- **Notes:** Displays assignment details plus today’s logged events so far. No stat change.
- **Social Feed:** Mandatory first visit offers Doomscroll prompt. Accept once per day: `+1 Aura`, `-30 minutes`, no hunger change. Declining keeps option for evening activity.
- **Inventory:** Shows money remainder, hunger level, stat snapshot, special item description, and any memory flags unlocked.

### Phone Content Draft
- **Group chat transcript:**
   - Jia Wen: “Let’s crush ‘Digital Privacy vs Convenience’! 💬”
   - Anika: “Meeting notes tomorrow morning. Don’t sleep in.”
   - System: “Assignment due Day 7, 11:59 PM.”
- **DM message pool:**
   - Bonsen → “Yo, if the campus wifi drops I’ve got a hotspot ready.”
   - Zahir → “Looking forward to collaborating. Hope today wasn’t too hectic.”
   - Jiun → “I’m logging all the notes in a spreadsheet tonight.”
   - Anika → “We should outline roles tomorrow—efficiency matters.”
   - Jia Wen → “Got any cool ideas brewing? I’m sketching concepts already!”
- **DM reply outcomes:** Friendly response lines reinforce the sender’s theme (`+1 rapport`, `+1 Networking`). Rude responses dismiss the concern (`-1 rapport`, `-1 Aura`) and set `strained-dm-[npc]` flag.
- **Map panel copy:** Table header “Transport Overview”. Rows display `(Walk: 45 min, $0, Hunger -1 on fail)`, `(Bus/Tram: 35 min, $5, Hunger -1)`, `(Drive: 30 min, $12, Hunger -1)`. Footer note “Evening travel mirrors costs; insufficient funds auto-select Walk.”
- **Notes panel copy:**
   - “Met the team in Lecture Theatre 3.”
   - “Assignment: Digital Privacy vs. Convenience — Okta Verify Debate.”
   - “Phone tutorial completed; apps unlocked.”
- **Inventory layout:** Money remaining, hunger meter `H/10`, MONASH stat table, special item name with one-line description, memory flags list with short blurbs.

## Campus Exploration Details
- Overworld map with three hotspots. Each interaction consumes 5 minutes (walking between nodes) plus choice-specific time.
   - **Cafeteria:** On entry, check hunger. If <9, offer meal purchase ($8, 20 minutes, hunger→10, `+1 Aura` for feeling refreshed). Decline logs “Skipped meal.” If hunger still <5 after leaving, trigger fatigue warning.
   - **Library:** Flavor text (“You see students, but nothing to do here yet.”) consumes 10 minutes, `+1 Organisation` if first visit.
   - **Lecture Theatre:** Entering locks exploration and progresses time by remaining budget (auto-snap to next segment). Prevents re-entering other hotspots.

### Campus Map Layout
- Tile grid 20×12 using 32 px tiles (canvas 640×384). Player spawn tile `(3, 9)` inside campus gate.
- **Hotspot triggers:**
   - Cafeteria entry tile `(7, 5)`; zone spans tiles `(6–8,4–6)` for background art.
   - Library entry tile `(12, 4)`; interior blocked by collision layer `library_wall`.
   - Lecture Theatre entry tile `(16, 6)`; triggers meeting cutscene and disables player control.
- **Collision map:** Outer boundaries and building footprints flagged in JSON `collisionTiles`, allowing quick path edits.
- **Ambient props:** Benches at `(5,8)` and `(13,7)`; trees at `(4,6)` and `(10,3)` for visual depth. No interactive NPCs during Day 1.

## Evening Activity Rules
- Evening travel reuses morning costs with identical success/failure tables. Fallback to Walk if insufficient funds.
- Evening choices consume 30 minutes.
   - **Eat:** Requires `money ≥ 8` and `hunger < 10`. Sets hunger→10, costs $8, grants `+1 Aura`. If blocked, show warning and keep menu open.
   - **Rest:** Usable if `hunger ≤ 8`. Grants `+2 Hunger`, `+1 Aura`. If hunger already 9–10, warn and block.
   - **Text Someone:** Choose NPC (cannot target same DM sender twice). Grants `+1 rapport` (or `+2` if NPC rapport ≤0 and message is supportive), costs no money, consumes 30 minutes, `+1 Networking`. If rapport already +5, shows “They feel content — no change.”
   - **Doomscroll:** Only available if Social Feed Doomscroll not already taken. Grants `+1 Aura`, consumes 30 minutes, sets flag preventing future uses today.
- If player runs out of time (<30 min remaining) after commute, auto-force Rest (if allowed) or skip to recap with fatigue warning.

## Logging & Recap Requirements
- Store every action as `{ timeStamp: 'HH:MM', segment, choiceId, resultText, deltas }` using current clock snapshot post-action.
- Recap screen sections: Stats (MONASH, Hunger, Money), Rapport table, Activity log (chronological bullet list), Warnings (low hunger, strained DM, forced walk, etc.), Tomorrow reminder.
- Auto-highlight significant flags: low hunger (<5), negative rapport, strained DM, repeated minigame failures.

## Memory Flag Catalogue
- `bonsen-custom-kit`: Bonsen mentions modding his laptop for campus dead zones.
- `zahir-family-motivation`: Zahir shares he’s juggling family expectations.
- `jiun-lab-habit`: Jiun reveals late-night lab access privileges.
- `anika-moot-team`: Anika references past moot court victories.
- `jiawen-sketch-collab`: Jia Wen offers to storyboard future pitches.
- `strained-dm-[npc]`: Records a tense DM exchange; recap warns “Conversation with [NPC] feels strained.”
- Future discoveries should follow kebab-case naming and include a one-line summary in the inventory panel.

## Deliverables for Day 1 Implementation
1. Data files defining majors, NPCs, and segment scripts.
2. Game state manager with validation, logging, and recap generator.
3. UI components (overworld scene, dialogue/choice panels, phone overlay, recap screen).
4. Minigame stubs returning deterministic outcomes (can be upgraded later).
5. Playable loop from title screen through recap with all rules enforced.
