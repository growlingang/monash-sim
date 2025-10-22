# Contributing to Monash Sim

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/monash-sim.git
   cd monash-sim
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running the Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your changes in real-time.

### Type Checking

Before committing, ensure your TypeScript code has no errors:

```bash
npm run type-check
```

### Building for Production

Test your changes with a production build:

```bash
npm run build
npm run preview
```

## Code Style Guidelines

### TypeScript
- Use **strict mode** TypeScript
- Prefer **interfaces** for object shapes
- Use **type** for unions and primitives
- Add **JSDoc comments** for public APIs
- Avoid `any` - use proper types

### Naming Conventions
- **Files**: camelCase (e.g., `playerRenderer.ts`)
- **Classes**: PascalCase (e.g., `GameStore`)
- **Functions**: camelCase (e.g., `advanceTime`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_MAJOR`)
- **Interfaces**: PascalCase with descriptive names (e.g., `GameState`)

### Code Organization
- Keep files **under 500 lines**
- One **primary export** per file
- Group related functionality in **folders**
- Use **barrel exports** (index.ts) for public APIs

### Example Code Style

```typescript
/**
 * Updates the player's hunger level
 * @param amount - Amount to change hunger by (can be negative)
 * @returns The new hunger value (clamped 0-10)
 */
export function updateHunger(amount: number): number {
  const newHunger = Math.max(0, Math.min(10, currentHunger + amount));
  store.setState({ hunger: newHunger });
  return newHunger;
}
```

## Project Structure

```
src/
├── core/          # Core game systems (DO NOT break interfaces)
├── scenes/        # Game scenes (add new scenes here)
├── minigames/     # Mini-games (self-contained)
├── data/          # Static game data (JSON-like exports)
├── sprites/       # Sprite rendering logic
├── ui/            # UI components
└── utils/         # Shared utilities
```

## What to Contribute

### 🐛 Bug Fixes
- Fix reported issues
- Add regression tests
- Update documentation if behavior changes

### ✨ New Features
- Discuss in an issue first
- Follow existing patterns
- Add documentation
- Consider backward compatibility

### 📚 Documentation
- Fix typos
- Improve clarity
- Add examples
- Update guides

### 🎨 Art & Assets
- Use appropriate file formats (PNG for sprites, MP3 for audio)
- Keep file sizes reasonable
- Credit original artists if applicable

## Commit Guidelines

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat(minigames): add cycling commute mini-game

- Add cycling as fourth transport option
- Implement stamina-based mechanics
- Add cycling sprites and audio

Closes #42
```

```
fix(store): prevent negative money values

Money could go below zero when purchasing items
while a transaction was pending.

Fixes #38
```

## Pull Request Process

1. **Update documentation** if you've changed APIs
2. **Add tests** if applicable
3. **Run type checking**: `npm run type-check`
4. **Test the build**: `npm run build && npm run preview`
5. **Write a clear PR description**:
   - What does this PR do?
   - Why is this change needed?
   - How has it been tested?
   - Screenshots/GIFs for UI changes

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How was this tested?

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Type checking passes
- [ ] Build succeeds
```

## Adding New Game Content

### Adding a New NPC
1. Define NPC data in `src/data/npcs.ts`
2. Add dialogue in scene files
3. Update rapport system if needed
4. Add sprites to `public/sprites/npcs/`

### Adding a New Scene
1. Create file in `src/scenes/`
2. Implement scene interface
3. Register in `sceneController.ts`
4. Add transition logic
5. Test thoroughly

### Adding a New Mini-game
1. Create file in `src/minigames/`
2. Export mini-game factory function
3. Return standardized result object
4. Add to mini-game index
5. Document controls and mechanics

## Need Help?

- **Questions**: Open a discussion on GitHub
- **Bug Reports**: Open an issue with reproduction steps
- **Feature Ideas**: Open an issue to discuss first

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Monash Sim! 🎓🎮
