# Architecture Overview

This document provides a high-level overview of the Monash Sim codebase architecture.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│              Main Entry Point                    │
│                 (main.ts)                        │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
    ┌────▼─────┐    ┌─────▼──────┐
    │  Store   │    │   Scene    │
    │  System  │◄───┤ Controller │
    └────┬─────┘    └─────┬──────┘
         │                │
    ┌────▼─────────────────▼──────┐
    │      Game State              │
    │  (MONASH Stats, Resources)   │
    └────┬────────────────┬────────┘
         │                │
    ┌────▼────┐      ┌───▼─────┐
    │ Actions │      │  Scenes │
    │ System  │      │  System │
    └─────────┘      └─────────┘
```

## Core Systems

### 1. State Management (`core/store.ts`)
- **Purpose**: Centralized game state management
- **Pattern**: Zustand-inspired reactive store
- **Validation**: Zod schema validation for type safety
- **Features**:
  - Subscribe to state changes
  - Action dispatching
  - Time-travel debugging support

### 2. Scene Management (`scenes/sceneController.ts`)
- **Purpose**: Handle scene transitions and lifecycle
- **Scenes**:
  - `mainMenu` - Game entry point
  - `characterCreation` - Major selection
  - `bedroom` - Morning/evening home base
  - `morningCommute` - Transport mini-games
  - `campusLTB` - Campus exploration
  - `groupMeeting` - NPC interactions
  - `eveningActivity` - End-of-day choices
  - `recap` - Daily summary

### 3. Action System (`core/actions.ts`)
- **Purpose**: Encapsulate game logic as dispatchable actions
- **Examples**:
  - `advanceTime` - Progress game clock
  - `modifyStats` - Update MONASH stats
  - `updateRapport` - Change NPC relationships
  - `spendMoney` - Handle transactions

### 4. Data Layer (`data/`)
- **Static Game Data**:
  - `majors.ts` - Major definitions and stat distributions
  - `npcs.ts` - NPC personalities and dialogue
  - `campusMap.ts` - Map layout and collision data
  - `phone.ts` - Phone app content

## Key Subsystems

### Sprite System (`sprites/`)
- **Components**:
  - `spriteLoader.ts` - Load and cache sprites
  - `playerRenderer.ts` - Render player character
  - `buildCompositeSprite.ts` - Combine sprite layers
  - `animationFrames.ts` - Animation definitions

### UI System (`ui/`)
- **Components**:
  - `statsBar.ts` - Display MONASH stats
  - `phoneOverlay.ts` - Phone interface
  - `cutscene.ts` - Narrative sequences

### Mini-games (`minigames/`)
- **Games**:
  - `walkMinigame.ts` - Crossy-road style
  - `busMinigame.ts` - Balance mechanics
  - `driveMinigame.ts` - Traffic dodging + parking
  - `assignmentMinigame.ts` - Work simulation

### Utilities (`utils/`)
- **Services**:
  - `audioManager.ts` - Sound and music playback
  - `saveSystem.ts` - LocalStorage persistence
  - `tilesetLoader.ts` - Load tileset images

## Data Flow

```
User Input
    ↓
UI Event Handler
    ↓
Action Dispatched → Store
    ↓
State Updated (with validation)
    ↓
Subscribers Notified
    ↓
UI Re-renders
```

## Rendering Pipeline

```
Scene.render()
    ↓
Clear Canvas
    ↓
Draw Background Layer
    ↓
Draw Tiles
    ↓
Draw Sprites
    ↓
Draw UI Overlays
    ↓
Request Next Frame
```

## State Schema

```typescript
GameState {
  // Player Identity
  major: MajorId
  playerName: string
  
  // MONASH Stats
  mobility: number      // 0-10
  organisation: number  // 0-10
  networking: number    // 0-10
  aura: number         // 0-10
  skills: number       // 0-10
  
  // Resources
  hunger: number       // 0-10
  money: number        // dollars
  currentTime: number  // minutes since 07:00
  
  // Progress
  currentDay: number
  currentScene: SceneId
  
  // Relationships
  npcRapport: Map<NPCId, number>  // -3 to +5
  
  // Flags & Memory
  memoryFlags: Set<string>
  activityLog: Activity[]
}
```

## Scene Lifecycle

Each scene implements:
- `enter()` - Initialize scene state
- `render()` - Draw scene to canvas
- `handleInput(event)` - Process user input
- `update(deltaTime)` - Update game logic
- `exit()` - Clean up before transition

## Best Practices

### Adding a New Scene
1. Create scene file in `src/scenes/`
2. Implement scene interface
3. Register in `sceneController.ts`
4. Add transition logic

### Creating a New Action
1. Define action type in `core/types.ts`
2. Implement action in `core/actions.ts`
3. Add validation logic
4. Update state schema if needed

### Adding Game Data
1. Define data structure
2. Create file in `src/data/`
3. Export data object
4. Import where needed

## Performance Considerations

- **Canvas Rendering**: Only redraw on state changes
- **Sprite Caching**: Load sprites once, reuse
- **Event Debouncing**: Prevent rapid-fire inputs
- **Lazy Loading**: Load scenes on-demand
- **LocalStorage**: Batch save operations

## Testing Strategy

- **Unit Tests**: Core logic (actions, state)
- **Integration Tests**: Scene transitions
- **E2E Tests**: Full gameplay loops
- **Manual Testing**: UI/UX validation

## Future Architecture Goals

- [ ] Implement proper animation timeline system
- [ ] Add WebGL renderer for better performance
- [ ] Create plugin system for mod support
- [ ] Add multiplayer state sync
- [ ] Implement cloud save system
