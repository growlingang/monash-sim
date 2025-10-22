# Audio System Guide - Monash Sim

## 🎵 **Complete Audio System Implementation**

Your Monash Sim now has a full-featured audio system that supports background music, sound effects, and comprehensive audio controls!

---

## 📁 **File Structure**

```
public/
  audio/
    music/          # Background music files (MP3, OGG, WAV)
      background.mp3  # Main soundtrack (example)
    sfx/            # Sound effects (MP3, OGG, WAV)
      click.mp3      # Example sound effect

src/
  utils/
    audioManager.ts  # Complete audio management system
```

---

## 🎮 **How to Add Your Soundtrack**

### 1. **Prepare Your Audio File**
- **Format**: MP3, OGG, or WAV (MP3 recommended for compatibility)
- **Quality**: 128kbps - 320kbps (balance quality vs file size)
- **Length**: Any length (will loop automatically)
- **File Size**: Keep under 10MB for web performance

### 2. **Add Your File**
1. Place your MP3 file in `public/audio/music/`
2. Name it `background.mp3` (or update the path in `src/main.ts`)

### 3. **Update the Path (if needed)**
If you want to use a different filename, edit `src/main.ts`:

```typescript
await playBackgroundMusic('/audio/music/your-soundtrack.mp3', {
  loop: true,
  volume: 0.3, // Adjust volume (0.0 to 1.0)
  autoplay: true
});
```

---

## 🎛️ **Audio Controls**

### **In-Game Controls**
- **Press P** to open your phone
- Go to **Settings** app
- Use the **Audio Settings** section:
  - 🔊 **Mute/Unmute** button
  - **Master Volume** slider (0-100%)
  - **Music Volume** slider (0-100%)
  - **SFX Volume** slider (0-100%)

### **Settings Persist**
- Your audio preferences are automatically saved
- Settings will be remembered between game sessions
- Stored in browser's localStorage

---

## 🔧 **For Developers: Advanced Usage**

### **Background Music Functions**
```typescript
import { 
  playBackgroundMusic, 
  stopBackgroundMusic, 
  pauseBackgroundMusic, 
  resumeBackgroundMusic 
} from '../utils/audioManager';

// Start playing music
await playBackgroundMusic('/audio/music/track.mp3', {
  loop: true,        // Loop the track (default: true)
  volume: 0.5,       // Volume level (default: 0.5)
  autoplay: true     // Start playing immediately (default: true)
});

// Control playback
pauseBackgroundMusic();   // Pause current track
resumeBackgroundMusic();  // Resume paused track
stopBackgroundMusic();    // Stop and reset track
```

### **Sound Effects**
```typescript
import { loadSound, playSound } from '../utils/audioManager';

// Load sound effects (do this once, preferably at game start)
await loadSound('click', '/audio/sfx/click.mp3');
await loadSound('notification', '/audio/sfx/notification.mp3');

// Play sound effects
playSound('click');                    // Play at default volume
playSound('notification', 0.8);        // Play at 80% volume
```

### **Volume Control**
```typescript
import { setVolume, toggleMute, getAudioSettings } from '../utils/audioManager';

// Set individual volume levels
setVolume('master', 0.7);   // Master volume to 70%
setVolume('music', 0.5);    // Music volume to 50%
setVolume('sfx', 0.8);      // Sound effects to 80%

// Toggle mute
toggleMute();

// Get current settings
const settings = getAudioSettings();
console.log(settings);
// Output: {
//   masterVolume: 0.7,
//   musicVolume: 0.5,
//   sfxVolume: 0.8,
//   isMuted: false,
//   isPlaying: true
// }
```

---

## 🎵 **Scene-Specific Music**

You can have different music for different scenes:

```typescript
// In bedroom.ts
import { playBackgroundMusic } from '../utils/audioManager';

// When entering bedroom
await playBackgroundMusic('/audio/music/bedroom-ambient.mp3', {
  loop: true,
  volume: 0.2
});

// In morningCommute.ts
// When starting commute
await playBackgroundMusic('/audio/music/commute-music.mp3', {
  loop: true,
  volume: 0.4
});
```

---

## 🎯 **Best Practices**

### **File Organization**
```
public/audio/music/
  background.mp3      # Main menu/general gameplay
  bedroom.mp3         # Bedroom scene
  commute.mp3         # Commute scenes
  campus.mp3          # Campus activities
  evening.mp3         # Evening activities

public/audio/sfx/
  ui-click.mp3        # UI interactions
  notification.mp3    # Phone notifications
  success.mp3         # Positive feedback
  error.mp3           # Error sounds
  ambient-*.mp3       # Environmental sounds
```

### **Performance Tips**
1. **Compress audio files** - Use tools like Audacity to reduce file size
2. **Preload important sounds** - Load frequently used SFX at game start
3. **Use appropriate formats** - MP3 for music, shorter files for SFX
4. **Consider file size** - Keep total audio under 50MB for web deployment

### **Browser Compatibility**
- **MP3**: Works in all modern browsers
- **OGG**: Better compression, supported in Firefox/Chrome
- **WAV**: Uncompressed, largest files, universal support

---

## 🚀 **Example Implementation**

Here's how to add a complete audio experience:

1. **Main Menu Music** (`src/main.ts`):
```typescript
await playBackgroundMusic('/audio/music/main-menu.mp3', {
  loop: true,
  volume: 0.3
});
```

2. **Scene Transitions** (in scene files):
```typescript
// When entering a new scene
await playBackgroundMusic('/audio/music/scene-specific.mp3', {
  loop: true,
  volume: 0.4
});
```

3. **Sound Effects** (in minigames, UI interactions):
```typescript
// Load at game start
await loadSound('success', '/audio/sfx/success.mp3');
await loadSound('click', '/audio/sfx/click.mp3');

// Use in gameplay
playSound('success'); // When completing a task
playSound('click');   // When clicking buttons
```

---

## 🎮 **User Experience**

### **Automatic Features**
- ✅ **Auto-loop** - Music plays continuously
- ✅ **Auto-resume** - Music continues between scenes
- ✅ **Settings persistence** - User preferences saved
- ✅ **Graceful fallbacks** - Works even if audio files missing
- ✅ **Browser autoplay handling** - Respects browser policies

### **User Controls**
- 🔊 **Mute/Unmute** - Quick audio toggle
- 🎚️ **Volume sliders** - Fine-tune audio levels
- 💾 **Auto-save** - Settings remembered between sessions
- 📱 **Mobile-friendly** - Works on all devices

---

## 🎵 **Ready to Use!**

Your audio system is now fully implemented! Just add your MP3 files to `public/audio/music/` and they'll play automatically with full user controls available in the phone settings.

**Next Steps:**
1. Add your soundtrack to `public/audio/music/background.mp3`
2. Test the audio controls in the phone settings (Press P → Settings)
3. Optionally add sound effects to `public/audio/sfx/`
4. Customize volume levels in `src/main.ts` if needed

**Enjoy your fully-featured audio experience! 🎵**
