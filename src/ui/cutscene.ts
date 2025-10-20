export interface CutsceneFrame {
  background: string; // CSS background property
  text: string;
  subtext?: string;
  emoji?: string;
  image?: string; // Image URL to display instead of emoji
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

  // Visual element (can be emoji or image)
  const visualElement = document.createElement('div');
  visualElement.className = 'cutscene-visual';
  visualElement.style.cssText = `
    font-size: 120px;
    margin-bottom: 30px;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Text element
  const textElement = document.createElement('div');
  textElement.className = 'cutscene-text';
  textElement.style.cssText = `
    font-size: 24px;
    color: #fbe9cf;
    font-weight: bold;
    margin-bottom: 20px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease;
    text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.8);
    line-height: 1.6;
    font-family: 'Press Start 2P', 'Courier New', monospace;
  `;

  // Subtext element
  const subtextElement = document.createElement('div');
  subtextElement.className = 'cutscene-subtext';
  subtextElement.style.cssText = `
    font-size: 14px;
    color: #d4a574;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.6s ease 0.2s;
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
    line-height: 1.8;
    font-family: 'Press Start 2P', 'Courier New', monospace;
  `;

  // Continue prompt
  const continuePrompt = document.createElement('div');
  continuePrompt.className = 'cutscene-continue';
  continuePrompt.style.cssText = `
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    color: #d4a574;
    font-size: 10px;
    animation: pulse 2s ease-in-out infinite;
    font-family: 'Press Start 2P', 'Courier New', monospace;
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
    background: #8b6f47;
    border: 3px solid #5a4a35;
    border-radius: 0;
    color: #fbe9cf;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.1s;
    display: ${options.canSkip !== false ? 'block' : 'none'};
    font-family: 'Press Start 2P', 'Courier New', monospace;
    box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  `;

  skipButton.addEventListener('mouseenter', () => {
    skipButton.style.background = '#a08560';
    skipButton.style.transform = 'translate(-1px, -1px)';
    skipButton.style.boxShadow = '5px 5px 0 rgba(0, 0, 0, 0.5)';
  });

  skipButton.addEventListener('mouseleave', () => {
    skipButton.style.background = '#8b6f47';
    skipButton.style.transform = 'translate(0, 0)';
    skipButton.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.5)';
  });

  skipButton.addEventListener('click', (e) => {
    e.stopPropagation();
    cleanup();
    options.onComplete();
  });

  contentLayer.appendChild(visualElement);
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
    visualElement.style.opacity = '0';
    visualElement.style.transform = 'scale(0.5)';
    textElement.style.opacity = '0';
    textElement.style.transform = 'translateY(20px)';
    subtextElement.style.opacity = '0';
    subtextElement.style.transform = 'translateY(20px)';

    setTimeout(() => {
      // Update background
      backgroundLayer.style.background = frame.background;
      backgroundLayer.style.opacity = '1';

      // Update visual content (video, image or emoji)
      if (frame.image) {
        // Check if it's a video file
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(frame.image);
        
        if (isVideo) {
          // Display video
          visualElement.innerHTML = `<video src="${frame.image}" autoplay loop playsinline style="max-width: 600px; max-height: 600px; object-fit: contain; border-radius: 12px;"></video>`;
        } else {
          // Display image
          visualElement.innerHTML = `<img src="${frame.image}" alt="" style="max-width: 300px; max-height: 300px; object-fit: contain; border-radius: 12px;" />`;
        }
        visualElement.style.display = 'flex';
      } else if (frame.emoji) {
        // Display emoji
        visualElement.textContent = frame.emoji;
        visualElement.style.display = 'block';
      } else {
        visualElement.style.display = 'none';
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
        if (frame.image || frame.emoji) {
          visualElement.style.opacity = '1';
          visualElement.style.transform = 'scale(1)';
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

