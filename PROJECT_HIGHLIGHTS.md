# Monash Sim - Project Highlights

> **Quick reference for recruiters and technical reviewers**

## 🎯 Project Overview

**Monash Sim** is a full-featured university life simulation game demonstrating proficiency in modern web game development, TypeScript, and software architecture.

**Live Demo**: [\[Try it out!\]  ](https://monashsim.netlify.app/)
**Repository**: https://github.com/growlingang/monash-sim

---

## 💡 Key Technical Achievements

### 1. **Custom Game Engine (Built from Scratch)**
- ✅ No external game framework dependencies
- ✅ Canvas-based 2D rendering pipeline
- ✅ Scene management system with lifecycle hooks
- ✅ Event-driven architecture
- ✅ State management with reactive subscriptions

### 2. **Type-Safe Architecture**
- ✅ 100% TypeScript with strict mode
- ✅ Zod schema validation for runtime type safety
- ✅ Comprehensive type definitions
- ✅ No `any` types in production code

### 3. **Game Systems Design**
- ✅ Complex state machine for game progression
- ✅ Resource management (time, money, hunger)
- ✅ Multi-dimensional stat system (MONASH)
- ✅ Relationship tracking with 5 NPCs
- ✅ Memory flag system for branching narratives

### 4. **Performance Optimization**
- ✅ Sprite caching system
- ✅ Efficient canvas rendering (only redraw on change)
- ✅ Lazy scene loading
- ✅ Optimized collision detection
- ✅ Debounced input handling

### 5. **Modern Web Standards**
- ✅ Progressive Web App (PWA) capabilities
- ✅ Service Worker for offline play
- ✅ LocalStorage persistence
- ✅ Web Audio API integration
- ✅ Responsive design

---

## 🏗️ Architecture Highlights

### Design Patterns Used
- **State Pattern**: Scene management and transitions
- **Observer Pattern**: Reactive state updates
- **Factory Pattern**: Scene and mini-game creation
- **Strategy Pattern**: Different mini-game implementations
- **Command Pattern**: Action dispatching system

### Code Organization
```
Modular Architecture
├── Core Systems (state, actions, schemas)
├── Scene Controllers (10+ scenes)
├── Mini-games (3 interactive games)
├── Data Layer (NPCs, majors, maps)
├── UI Components (phone, stats, cutscenes)
└── Utilities (audio, save, loaders)
```

### Key Technologies
- **TypeScript** - Primary language
- **Vite** - Build tool & dev server
- **Canvas API** - Rendering
- **Web Audio API** - Sound system
- **Zod** - Runtime validation
- **LocalStorage API** - Persistence

---

## 📊 Project Metrics

| Metric | Value |
|--------|-------|
| **Lines of Code** | ~10,000+ TypeScript |
| **Number of Scenes** | 12+ interactive scenes |
| **Game Systems** | 8+ interconnected systems |
| **NPCs** | 5 with unique dialogue trees |
| **Mini-games** | 3 playable mini-games |
| **Type Coverage** | 100% TypeScript |
| **Documentation** | 15+ markdown files |

---

## 🎮 Feature Showcase

### Implemented Systems
1. **Character Creation** - 6 majors with unique stat distributions
2. **Commute Mini-games** - Walk, Bus, Drive with varying difficulties
3. **Campus Exploration** - Tile-based map with collision detection
4. **NPC Interaction** - Dialogue choices affecting relationships
5. **Phone System** - Multi-app interface (texts, map, notes, social)
6. **Time Management** - Real-time clock with consequences
7. **Save/Load System** - Auto-save and manual save functionality
8. **Audio System** - Background music and SFX support
9. **Recap Screen** - End-of-day summary with analytics
10. **Memory Flags** - Story progression tracking

### Gameplay Mechanics
- **MONASH Stats**: 5-dimensional character attributes
- **Resource Management**: Hunger (0-10), Money ($), Time (07:00-22:00)
- **Rapport System**: -3 to +5 relationship scale per NPC
- **Branching Dialogue**: Choices with stat/relationship consequences
- **Dynamic Difficulty**: Stats affect mini-game difficulty

---

## 🔧 Technical Deep Dives

### 1. State Management
Custom Zustand-inspired store with:
- Immutable state updates
- Subscribe/unsubscribe pattern
- Action dispatching with validation
- Time-travel debugging support

### 2. Canvas Rendering Pipeline
```
Scene Lifecycle → Canvas Clear → Layers (background, tiles, sprites, UI)
                                   ↓
                              Request Animation Frame
```

### 3. Save System
- Auto-save on scene transitions
- Manual save via phone menu
- Data serialization with schema validation
- Corruption detection and recovery

### 4. Audio Manager
- Lazy loading of audio files
- Volume control and fading
- Background music looping
- SFX layering and mixing

---

## 📈 Development Practices

### Code Quality
- ✅ Consistent code style
- ✅ JSDoc comments on public APIs
- ✅ Error handling and validation
- ✅ No runtime type errors
- ✅ Clean, readable code structure

### Documentation
- ✅ Comprehensive README
- ✅ Architecture documentation
- ✅ Contributing guidelines
- ✅ API documentation
- ✅ Design specifications

### Version Control
- ✅ Meaningful commit messages
- ✅ Feature branches
- ✅ Issue/PR templates
- ✅ Changelog maintenance

### Deployment
- ✅ Vercel deployment configured
- ✅ Production build optimization
- ✅ Environment configuration
- ✅ CI/CD ready

---

## 🎓 Skills Demonstrated

### Programming
- Advanced TypeScript
- Object-oriented design
- Functional programming
- Async/await patterns
- Event-driven architecture

### Game Development
- Game loop implementation
- Physics and collision
- Animation systems
- Save/load systems
- UI/UX design

### Web Technologies
- Canvas API mastery
- Web Audio API
- LocalStorage/PWA
- Modern ES6+ features
- Build tools (Vite)

### Software Engineering
- Design patterns
- Clean architecture
- Documentation
- Testing mindset
- Performance optimization

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Days 2-7 with escalating complexity
- [ ] Assignment collaboration mechanics
- [ ] More mini-games and challenges
- [ ] Achievement system
- [ ] Cloud save functionality
- [ ] Multiplayer leaderboards

### Technical Improvements
- [ ] WebGL renderer for performance
- [ ] Automated testing suite
- [ ] Animation timeline system
- [ ] Plugin/mod support
- [ ] Accessibility improvements

---

## 📞 Contact & Links

- **GitHub**: [your-username]
- **Portfolio**: [your-website]
- **LinkedIn**: [your-linkedin]
- **Email**: [your-email]

---

## 🏆 Why This Project Stands Out

1. **No Framework Dependency**: Built from scratch, demonstrating deep understanding
2. **Production Quality**: Professional code structure and documentation
3. **Complex Systems**: Multiple interconnected gameplay systems
4. **Type Safety**: Full TypeScript with runtime validation
5. **Scalable Architecture**: Designed for expansion and maintenance
6. **Complete Package**: From concept to deployment

---

**This project showcases the ability to:**
- Design and implement complex systems
- Write clean, maintainable code
- Create engaging user experiences
- Work with modern web technologies
- Document and communicate technical decisions
- Ship production-ready software

---

*Last Updated: January 2025*
