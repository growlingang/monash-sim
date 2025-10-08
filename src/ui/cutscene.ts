export interface CutsceneFrame {
  background: string; // CSS background property
  text: string;
  subtext?: string;
  emoji?: string;
  duration?: number; // Auto-advance after this many ms (optional)
}

export interface CutsceneOptions {
  frames: CutsceneFrame[];
  onComplete: () => void;
  canSkip?: boolean;
}

export const createCutscene = (root: HTMLElement, options: CutsceneOptions) => {
  let currentFrameIndex = 0;
  let autoAdvanceTimeout: number | null = null;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'cutscene-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.5s ease;
  `;

  // Create cutscene container
  const container = document.createElement('div');
  container.className = 'cutscene-container';
  container.style.cssText = `
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `;

  // Background layer
  const backgroundLayer = document.createElement('div');
  backgroundLayer.className = 'cutscene-background';
  backgroundLayer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: all 0.8s ease;
    opacity: 0;
  `;

  // Content layer
  const contentLayer = document.createElement('div');
  contentLayer.className = 'cutscene-content';
  contentLayer.style.cssText = `
    position: relative;
    z-index: 10;
    max-width: 800px;
    padding: 40px;
    text-align: center;
  `;

  // Emoji element
  const emojiElement = document.createElement('div');
  emojiElement.className = 'cutscene-emoji';
  emojiElement.style.cssText = `
    font-size: 120px;
    margin-bottom: 30px;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  `;

  // Text element
  const textElement = document.createElement('div');
  textElement.className = 'cutscene-text';
  textElement.style.cssText = `
    font-size: 32px;
    color: white;
    font-weight: bold;
    margin-bottom: 20px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
    line-height: 1.4;
  `;

  // Subtext element
  const subtextElement = document.createElement('div');
  subtextElement.className = 'cutscene-subtext';
  subtextElement.style.cssText = `
    font-size: 18px;
    color: #bbb;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease 0.2s;
    text-shadow: 0 1px 5px rgba(0, 0, 0, 0.8);
    line-height: 1.6;
  `;

  // Continue prompt
  const continuePrompt = document.createElement('div');
  continuePrompt.className = 'cutscene-continue';
  continuePrompt.style.cssText = `
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    animation: pulse 2s ease-in-out infinite;
  `;
  continuePrompt.textContent = 'Click or press any key to continue';

  // Skip button
  const skipButton = document.createElement('button');
  skipButton.className = 'cutscene-skip';
  skipButton.textContent = 'Skip';
  skipButton.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: ${options.canSkip !== false ? 'block' : 'none'};
  `;

  skipButton.addEventListener('mouseenter', () => {
    skipButton.style.background = 'rgba(255, 255, 255, 0.2)';
  });

  skipButton.addEventListener('mouseleave', () => {
    skipButton.style.background = 'rgba(255, 255, 255, 0.1)';
  });

  skipButton.addEventListener('click', (e) => {
    e.stopPropagation();
    cleanup();
    options.onComplete();
  });

  contentLayer.appendChild(emojiElement);
  contentLayer.appendChild(textElement);
  contentLayer.appendChild(subtextElement);
  container.appendChild(backgroundLayer);
  container.appendChild(contentLayer);
  container.appendChild(continuePrompt);
  container.appendChild(skipButton);
  overlay.appendChild(container);

  const showFrame = (index: number) => {
    if (index >= options.frames.length) {
      cleanup();
      options.onComplete();
      return;
    }

    const frame = options.frames[index];

    // Fade out current content
    emojiElement.style.opacity = '0';
    emojiElement.style.transform = 'scale(0.5)';
    textElement.style.opacity = '0';
    textElement.style.transform = 'translateY(20px)';
    subtextElement.style.opacity = '0';
    subtextElement.style.transform = 'translateY(20px)';

    setTimeout(() => {
      // Update background
      backgroundLayer.style.background = frame.background;
      backgroundLayer.style.opacity = '1';

      // Update content
      if (frame.emoji) {
        emojiElement.textContent = frame.emoji;
        emojiElement.style.display = 'block';
      } else {
        emojiElement.style.display = 'none';
      }

      textElement.textContent = frame.text;
      
      if (frame.subtext) {
        subtextElement.textContent = frame.subtext;
        subtextElement.style.display = 'block';
      } else {
        subtextElement.style.display = 'none';
      }

      // Fade in new content
      setTimeout(() => {
        if (frame.emoji) {
          emojiElement.style.opacity = '1';
          emojiElement.style.transform = 'scale(1)';
        }
        textElement.style.opacity = '1';
        textElement.style.transform = 'translateY(0)';
        if (frame.subtext) {
          subtextElement.style.opacity = '1';
          subtextElement.style.transform = 'translateY(0)';
        }
      }, 50);

      // Auto-advance if duration is set
      if (frame.duration) {
        autoAdvanceTimeout = window.setTimeout(() => {
          advance();
        }, frame.duration);
      }
    }, 300);
  };

  const advance = () => {
    if (autoAdvanceTimeout !== null) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    currentFrameIndex++;
    showFrame(currentFrameIndex);
  };

  const handleInteraction = (e: Event) => {
    e.preventDefault();
    advance();
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && options.canSkip !== false) {
      cleanup();
      options.onComplete();
    } else {
      handleInteraction(e);
    }
  };

  overlay.addEventListener('click', handleInteraction);
  document.addEventListener('keydown', handleKeyPress);

  const cleanup = () => {
    if (autoAdvanceTimeout !== null) {
      clearTimeout(autoAdvanceTimeout);
    }
    overlay.removeEventListener('click', handleInteraction);
    document.removeEventListener('keydown', handleKeyPress);
    
    // Fade out animation
    overlay.style.animation = 'fadeOut 0.5s ease';
    setTimeout(() => {
      if (root.contains(overlay)) {
        root.removeChild(overlay);
      }
    }, 500);
  };

  root.appendChild(overlay);
  
  // Start with first frame
  setTimeout(() => showFrame(0), 100);
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
`;
if (!document.head.querySelector('style[data-cutscene]')) {
  style.setAttribute('data-cutscene', 'true');
  document.head.appendChild(style);
}

