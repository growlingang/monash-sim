# Minigame Updates - Added Features

## 🎲 Random Bus Delay (10% chance)
- When taking the bus, there's a 10% chance it arrives 2-5 minutes late
- This is **not the player's fault** - it's displayed as a notification
- The extra delay time is added to the total commute time
- Shows up in the activity log as additional context

## 🎯 No More Retries - Failures Progress the Story
**Major gameplay change**: Minigame failures now always take you to campus with penalties instead of forcing retries!

- ✅ **Success**: You reach campus quickly with stat bonuses
- ⚠️ **Failure**: You still reach campus, but late/injured with penalties (time, stats, hunger)
- 🚶 **Auto (no money)**: Forced to walk to campus if you can't afford paid transport

This makes the game feel more like a **life simulation** where setbacks happen but you keep moving forward.

## 📝 Improved Failure Narratives
All minigame failures now result in the player **still reaching campus** but with penalties and better storytelling:

### Walk Minigame
- **Old**: "A near miss slows you down—late and winded."
- **New**: "You got hit by a car but survived with minor injuries—the delay cost you time."
- Still progresses the story, just with time and stat penalties

### Bus Minigame
- **Old**: "You stumble—other passengers chuckle."
- **New**: "You fell on the bus and bumped your head—cleaning up the injury made you late."
- Emphasizes you still made it, just injured and delayed

### Drive Minigame - Collision
- **Old**: "Parking woes waste time and shake your confidence."
- **New**: "You scraped the bumper and had to deal with the damage—arrived flustered."
- Better explains what happened during the failure

### Drive Minigame - Auto-complete
- **Old**: "Sensors save your bumper—you still park late."
- **New**: "After multiple parking attempts, you finally squeeze in—embarrassed but safe."
- More human, less tech-dependent narrative

### Walk Auto-complete
- **Old**: "You eventually stumble to campus, exhausted."
- **New**: "After several close calls, you stumble onto campus exhausted and shaken."
- Adds more dramatic context to the struggle

## 🎮 Technical Implementation
- Added `extraTimePenalty` and `penaltyReason` fields to `MinigameResult` type
- Bus minigame tracks delay and passes it through the promise resolution
- Morning commute scene applies the extra time penalty to total time cost
- Activity log includes the penalty reason in the summary

## 🎯 Game Design Impact
These changes make failures feel more like **narrative setbacks** rather than dead ends:
- Players always progress to campus
- Failures have meaningful consequences (time, stats, hunger)
- Stories are more immersive and realistic
- Random events add unpredictability without punishing player skill
