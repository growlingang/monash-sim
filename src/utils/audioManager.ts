/**
 * Audio Manager for Monash Sim
 * Handles background music, sound effects, and audio controls
 */

export interface AudioConfig {
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
}

export class AudioManager {
  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;

  constructor() {
    // Initialize with user preferences if available
    this.loadAudioPreferences();
  }

  /**
   * Load and start playing background music
   * @param src - Path to the audio file (relative to public folder)
   * @param config - Audio configuration options
   */
  async loadBackgroundMusic(src: string, config: AudioConfig = {}): Promise<void> {
    try {
      // Stop current background music if playing
      this.stopBackgroundMusic();

      // Create new audio element
      this.backgroundMusic = new Audio(src);
      
      // Apply configuration
      this.backgroundMusic.loop = config.loop !== false; // Default to true
      this.backgroundMusic.volume = (config.volume ?? this.musicVolume) * this.masterVolume;
      this.backgroundMusic.preload = config.preload || 'auto';

      // Add event listeners
      this.backgroundMusic.addEventListener('error', (e) => {
        console.error('Failed to load background music:', src, e);
      });

      this.backgroundMusic.addEventListener('canplaythrough', () => {
        console.log('✅ Background music loaded and ready:', src);
      });

      // Always try to start playing, but handle autoplay restrictions gracefully
      if (config.autoplay !== false) {
        try {
          await this.backgroundMusic.play();
          console.log('🎵 Background music started:', src);
        } catch (error) {
          console.warn('⚠️ Autoplay blocked by browser. Music ready to play on user interaction.');
          // Set up global click handler to start music on first user interaction
          this.setupUserInteractionHandler();
        }
      }

    } catch (error) {
      console.error('Error loading background music:', error);
    }
  }

  /**
   * Set up a one-time handler to start music on user interaction
   */
  private setupUserInteractionHandler(): void {
    const startMusic = () => {
      if (this.backgroundMusic && this.backgroundMusic.paused) {
        this.backgroundMusic.play().then(() => {
          console.log('🎵 Background music started after user interaction');
        }).catch(error => {
          console.warn('Failed to start music after user interaction:', error);
        });
      }
      // Remove the event listeners after first interaction
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
      document.removeEventListener('touchstart', startMusic);
    };

    // Listen for various types of user interaction
    document.addEventListener('click', startMusic, { once: true });
    document.addEventListener('keydown', startMusic, { once: true });
    document.addEventListener('touchstart', startMusic, { once: true });
  }

  /**
   * Manually start the background music (for user-triggered playback)
   */
  async startBackgroundMusic(): Promise<void> {
    if (this.backgroundMusic && this.backgroundMusic.paused) {
      try {
        await this.backgroundMusic.play();
        console.log('🎵 Background music manually started');
        return;
      } catch (error) {
        console.error('Failed to start background music:', error);
        throw error;
      }
    }
    throw new Error('No background music loaded or already playing');
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic = null;
    }
  }

  /**
   * Pause background music
   */
  pauseBackgroundMusic(): void {
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      this.backgroundMusic.pause();
    }
  }

  /**
   * Resume background music
   */
  resumeBackgroundMusic(): void {
    if (this.backgroundMusic && this.backgroundMusic.paused) {
      this.backgroundMusic.play().catch(error => {
        console.warn('Failed to resume background music:', error);
      });
    }
  }

  /**
   * Load a sound effect for later use
   * @param name - Unique name for the sound effect
   * @param src - Path to the audio file
   */
  async loadSoundEffect(name: string, src: string): Promise<void> {
    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = this.sfxVolume * this.masterVolume;
      
      this.soundEffects.set(name, audio);
      console.log('✅ Sound effect loaded:', name);
    } catch (error) {
      console.error('Failed to load sound effect:', name, error);
    }
  }

  /**
   * Play a sound effect
   * @param name - Name of the sound effect
   * @param volume - Optional volume override (0-1)
   */
  playSoundEffect(name: string, volume?: number): void {
    const audio = this.soundEffects.get(name);
    if (audio) {
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      if (volume !== undefined) {
        audioClone.volume = volume * this.masterVolume;
      }
      audioClone.play().catch(error => {
        console.warn('Failed to play sound effect:', name, error);
      });
    } else {
      console.warn('Sound effect not found:', name);
    }
  }

  /**
   * Set master volume (affects all audio)
   * @param volume - Volume level (0-1)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.saveAudioPreferences();
  }

  /**
   * Set music volume
   * @param volume - Volume level (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateMusicVolume();
    this.saveAudioPreferences();
  }

  /**
   * Set sound effects volume
   * @param volume - Volume level (0-1)
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateSFXVolumes();
    this.saveAudioPreferences();
  }

  /**
   * Toggle mute state
   */
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.updateAllVolumes();
    this.saveAudioPreferences();
    console.log(this.isMuted ? '🔇 Audio muted' : '🔊 Audio unmuted');
  }

  /**
   * Set mute state
   * @param muted - Whether to mute audio
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.updateAllVolumes();
    this.saveAudioPreferences();
  }

  /**
   * Get current audio settings
   */
  getAudioSettings() {
    return {
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      isMuted: this.isMuted,
      isPlaying: this.backgroundMusic ? !this.backgroundMusic.paused : false
    };
  }

  /**
   * Update all audio volumes based on current settings
   */
  private updateAllVolumes(): void {
    this.updateMusicVolume();
    this.updateSFXVolumes();
  }

  /**
   * Update background music volume
   */
  private updateMusicVolume(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.isMuted ? 0 : this.musicVolume * this.masterVolume;
    }
  }

  /**
   * Update sound effects volumes
   */
  private updateSFXVolumes(): void {
    this.soundEffects.forEach(audio => {
      audio.volume = this.isMuted ? 0 : this.sfxVolume * this.masterVolume;
    });
  }

  /**
   * Save audio preferences to localStorage
   */
  private saveAudioPreferences(): void {
    const preferences = {
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      isMuted: this.isMuted
    };
    localStorage.setItem('monash-sim-audio', JSON.stringify(preferences));
  }

  /**
   * Load audio preferences from localStorage
   */
  private loadAudioPreferences(): void {
    try {
      const saved = localStorage.getItem('monash-sim-audio');
      if (saved) {
        const preferences = JSON.parse(saved);
        this.masterVolume = preferences.masterVolume ?? 0.8;
        this.musicVolume = preferences.musicVolume ?? 0.7;
        this.sfxVolume = preferences.sfxVolume ?? 0.8;
        this.isMuted = preferences.isMuted ?? false;
      }
    } catch (error) {
      console.warn('Failed to load audio preferences:', error);
    }
  }
}

// Create a global instance
export const audioManager = new AudioManager();

/**
 * Convenience functions for easy usage throughout the app
 */
export const playBackgroundMusic = (src: string, config?: AudioConfig) => 
  audioManager.loadBackgroundMusic(src, config);

export const stopBackgroundMusic = () => audioManager.stopBackgroundMusic();

export const pauseBackgroundMusic = () => audioManager.pauseBackgroundMusic();

export const resumeBackgroundMusic = () => audioManager.resumeBackgroundMusic();

export const startBackgroundMusic = () => audioManager.startBackgroundMusic();

export const playSound = (name: string, volume?: number) => 
  audioManager.playSoundEffect(name, volume);

export const loadSound = (name: string, src: string) => 
  audioManager.loadSoundEffect(name, src);

export const setVolume = (type: 'master' | 'music' | 'sfx', volume: number) => {
  switch (type) {
    case 'master': audioManager.setMasterVolume(volume); break;
    case 'music': audioManager.setMusicVolume(volume); break;
    case 'sfx': audioManager.setSFXVolume(volume); break;
  }
};

export const toggleMute = () => audioManager.toggleMute();

export const getAudioSettings = () => audioManager.getAudioSettings();
