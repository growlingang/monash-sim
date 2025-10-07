# MONASH Stat System

## Overview
The game uses a **MONASH** stat system where each letter represents a different attribute:

- **M** - Mobility (Physical activity, endurance)
- **O** - Organisation (Planning, time management)
- **N** - Networking (Social connections, relationships)
- **A** - Aura (Charisma, presence, confidence)
- **S** - Skills (Academic/technical abilities)
- **H** - Hunger (Max hunger capacity, fullness level)

## Stat Ranges
- All stats range from **0-10**
- H (Hunger) starts at **10** (completely full)
- H decreases as player gets hungry (lower = more hungry)

## How H (Hunger) Works

### Correct Implementation
- **H stat** = Max hunger capacity (10 by default, can increase with stat boosts)
- **hunger field** = Current fullness level (ranges from 0 to H)
- H is relatively **stable** (only changes via explicit stat deltas like level-ups)
- hunger field **changes frequently** (eating increases it, activity decreases it)

### Example Scenarios

**Scenario 1: Getting Hungry**
- Start: `hunger: 10, stats.H: 10` → Display: `10/10` (completely full)
- After walking: `hunger: 9, stats.H: 10` → Display: `9/10` (slightly hungry)

**Scenario 2: Eating Food**
- Current: `hunger: 8, stats.H: 10` → Display: `8/10`
- Eat snack (+4): `hunger: 12` clamped to H → `hunger: 10, stats.H: 10`
- Result: Display: `10/10` (can't exceed max capacity)

**Scenario 3: Max Hunger Increase**
- Current: `hunger: 8, stats.H: 10` → Display: `8/10`
- Level up H (+2): `hunger: 8, stats.H: 12` → Display: `8/12`
- Now can eat more food to reach: `hunger: 12, stats.H: 12` → Display: `12/12`

**Scenario 4: Combined Changes**
- Start: `hunger: 8, stats.H: 10` → Display: `8/10`
- H increases (+2): `hunger: 8, stats.H: 12` → Display: `8/12`
- Eat food (+4): `hunger: 12, stats.H: 12` → Display: `12/12` ✅

### Display
- UI shows: `🍕 Hunger: 8/10` (format: **current/max**)
- Lower current = more hungry
- Higher current = more full
- Max (denominator) = H stat value

### Game Mechanics
- **Hunger decreases**: Transport, activities (apply negative hungerDelta)
- **Hunger increases**: Eating food (apply positive hungerDelta)
- **Max capacity increases**: Rare stat boosts to H (apply stats.H delta)
- Hunger is clamped to `[0, stats.H]` range

## State Structure
```json
{
  "stats": {
    "M": 6,
    "O": 5,
    "N": 4,
    "A": 4,
    "S": 7,
    "H": 10  // Max hunger capacity (denominator)
  },
  "hunger": 10  // Current fullness (numerator, 0 to stats.H)
}
```

**Important:**
- `stats.H` = Maximum hunger capacity
- `hunger` = Current fullness level (0 to stats.H)
- Display format: `hunger/stats.H` (e.g., "8/10" or "8/12")

## Major Starting Stats

### Engineering
- M: 6, O: 5, N: 4, A: 4, S: 7, **H: 10**

### Medicine  
- M: 5, O: 6, N: 4, A: 5, S: 6, **H: 10**

### Law
- M: 4, O: 6, N: 5, A: 6, S: 5, **H: 10**

### IT
- M: 5, O: 5, N: 5, A: 4, S: 6, **H: 10**

### Science
- M: 5, O: 5, N: 4, A: 5, S: 7, **H: 10**

### Arts
- M: 4, O: 4, N: 6, A: 7, S: 5, **H: 10**

All majors start with **H: 10** (completely full).
