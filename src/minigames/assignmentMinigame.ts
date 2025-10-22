import type { MinigameResult, MinigameConfig } from './types';
import { Tileset } from '../utils/tilesetLoader';
import { drawSubSprite } from '../utils/spriteLoader';
import { ANIMATION_FRAMES } from '../sprites/animationFrames';
import { buildCompositeSprite } from '../sprites/playerSpriteOptimizer';
import { DEFAULT_PLAYER } from '../sprites/playerSprite';

// Task definitions for PTV/Monash travel assignment
interface Task {
    id: string;
    name: string;
    x: number;
    y: number;
    completed: boolean;
    type: 'quiz' | 'puzzle' | 'interactive';
    description: string;
}

interface AssignmentState {
    playerX: number;
    playerY: number;
    tasks: Task[];
    activeTask: Task | null;
    completedCount: number;
}

// Quiz questions about PTV and Monash travel
const QUIZ_QUESTIONS = {
    zone_quiz: [
        {
            question: "What fare zone is Monash Clayton campus located in?",
            options: ["Zone 1", "Zone 2", "Zone 3", "Zone 1+2"],
            correct: 1, // Zone 2
            explanation: "Monash Clayton is in Zone 2, making it accessible with a Zone 1+2 myki."
        }
    ],
    route_quiz: [
        {
            question: "Which bus route number goes directly to Monash Clayton from Huntingdale station?",
            options: ["Bus 601", "Bus 630", "Bus 900", "Bus 703"],
            correct: 2, // Bus 900
            explanation: "The 900 SmartBus is a major route connecting Huntingdale Station to Monash Clayton."
        }
    ],
    timetable_quiz: [
        {
            question: "During peak hour, how frequently do trains run on the Cranbourne/Pakenham line?",
            options: ["Every 5 minutes", "Every 10 minutes", "Every 15 minutes", "Every 20 minutes"],
            correct: 1, // Every 10 minutes
            explanation: "Peak services on major lines run approximately every 10 minutes to handle high demand."
        }
    ],
    myki_quiz: [
        {
            question: "What is the maximum amount of money you can have on a myki card?",
            options: ["$100", "$200", "$250", "$300"],
            correct: 2, // $250
            explanation: "A myki card can hold up to $250 in myki money for travel on PTV services."
        }
    ],
    concession_quiz: [
        {
            question: "What do Monash students need to access concession fares on PTV?",
            options: ["Student ID only", "Concession myki card", "Nothing, it's automatic", "Confirmation letter"],
            correct: 1, // Concession myki card
            explanation: "Students need to apply for a concession myki card through PTV to access discounted fares."
        }
    ]
};

// Journey planning puzzle
const JOURNEY_PUZZLES = {
    morning_commute: {
        scenario: "You need to get from Caulfield to Monash Clayton by 9am. Plan your journey:",
        steps: [
            { id: 'train', text: 'Take train to Huntingdale', order: 1 },
            { id: 'bus', text: 'Catch 900 SmartBus', order: 2 },
            { id: 'arrive', text: 'Arrive at Monash Clayton', order: 3 }
        ]
    },
    evening_trip: {
        scenario: "You're at Monash and need to get to Melbourne CBD after 5pm:",
        steps: [
            { id: 'walk', text: 'Walk to bus stop', order: 1 },
            { id: 'bus', text: 'Take 900 to Huntingdale', order: 2 },
            { id: 'train', text: 'Catch Cranbourne line train', order: 3 },
            { id: 'arrive', text: 'Arrive at Flinders Street', order: 4 }
        ]
    }
};

// Map matching puzzle (for future expansion)
// const MAP_PUZZLES = {
//     campus_stations: {
//         description: "Match the Monash campus to its nearest train station:",
//         pairs: [
//             { campus: "Clayton", station: "Huntingdale", matched: false },
//             { campus: "Caulfield", station: "Caulfield", matched: false },
//             { campus: "Parkville", station: "Melbourne Central", matched: false }
//         ]
//     }
// };

export const createAssignmentMinigame = (): {
    mount: (container: HTMLElement, config: MinigameConfig) => Promise<MinigameResult>;
} => {
    return {
        mount: async (container: HTMLElement, _config: MinigameConfig): Promise<MinigameResult> => {
            return new Promise(async (resolve) => {
                container.innerHTML = '';

                // Load road tileset for floor
                let roadTileset: Tileset;
                try {
                    roadTileset = new Tileset({
                        imagePath: '/sprites/cargame/road.png',
                        tileWidth: 32,
                        tileHeight: 32,
                        columns: 1,
                        rows: 1,
                    });
                    await roadTileset.load();
                } catch (error) {
                    console.error('Failed to load road tileset:', error);
                    resolve({ success: false, completed: false });
                    return;
                }

                // Load paper sprite for tasks
                let paperSprite: HTMLImageElement | null = null;
                try {
                    paperSprite = new Image();
                    paperSprite.src = '/sprites/paper.png';
                    await new Promise<void>((res, rej) => {
                        paperSprite!.onload = () => res();
                        paperSprite!.onerror = () => rej();
                    });
                } catch (error) {
                    console.warn('Failed to load paper sprite, using fallback:', error);
                }

                // Get player sprite from config and build composite sprite (64x64 for larger size)
                const playerData = (_config as any).playerSprite || DEFAULT_PLAYER;
                try {
                    await buildCompositeSprite(playerData, 64, 64);
                } catch (error) {
                    console.warn('Failed to build player sprite:', error);
                }

                // Add styles matching the group meeting scene
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 0.6; }
                        50% { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    .assignment__wrap {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        padding: 20px;
                        max-width: 1100px;
                        margin: 0 auto;
                        animation: fadeIn 0.4s ease-out;
                    }
                    .assignment__header {
                        text-align: center;
                    }
                    .assignment__header h2 {
                        margin: 0 0 6px;
                        color: #f8fafc;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                    .assignment__header p {
                        margin: 0;
                        color: #cbd5e1;
                    }
                    .assignment__progress {
                        background: rgba(30, 41, 59, 0.8);
                        border: 2px solid #334155;
                        border-radius: 12px;
                        padding: 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .assignment__progress-text {
                        color: #f1f5f9;
                        font-weight: 600;
                        font-size: 16px;
                    }
                    .assignment__progress-bar {
                        flex: 1;
                        margin: 0 20px;
                        height: 24px;
                        background: rgba(15, 23, 42, 0.6);
                        border-radius: 12px;
                        border: 2px solid #475569;
                        overflow: hidden;
                        position: relative;
                    }
                    .assignment__progress-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #10b981 0%, #6ee7b7 100%);
                        transition: width 0.5s ease;
                        box-shadow: 0 0 10px rgba(110, 231, 183, 0.5);
                    }
                    .assignment__canvas-wrap {
                        position: relative;
                        width: 100%;
                        aspect-ratio: 16 / 9;
                        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        border: 2px solid #334155;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
                    }
                    .assignment__canvas {
                        display: block;
                        width: 100%;
                        height: 100%;
                        image-rendering: pixelated;
                    }
                    .assignment__status {
                        position: absolute;
                        top: 16px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%);
                        border: 2px solid rgba(100,116,139,0.6);
                        border-radius: 10px;
                        padding: 8px 16px;
                        color: #f1f5f9;
                        font-size: 14px;
                        white-space: nowrap;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                        backdrop-filter: blur(8px);
                        font-weight: 600;
                        animation: pulse 2s ease-in-out infinite;
                        z-index: 10;
                    }
                    .assignment__task-modal {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
                        border: 2px solid rgba(100, 116, 139, 0.5);
                        border-radius: 12px;
                        padding: 24px;
                        max-width: 600px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1) inset;
                        z-index: 1000;
                        backdrop-filter: blur(8px);
                        animation: slideUp 0.3s ease-out;
                    }
                    .assignment__task-title {
                        display: block;
                        font-weight: 800;
                        color: #6ee7b7;
                        margin-bottom: 6px;
                        letter-spacing: 0.5px;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                        font-size: 13px;
                        text-transform: uppercase;
                    }
                    .assignment__task-description {
                        color: #cbd5e1;
                        margin: 0 0 16px;
                        font-size: 15px;
                    }
                    .assignment__quiz-question {
                        color: #f1f5f9;
                        font-size: 15px;
                        font-weight: 600;
                        margin: 0 0 12px;
                    }
                    .assignment__quiz-options {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-top: 8px;
                    }
                    .assignment__quiz-option {
                        padding: 12px 14px;
                        border: 2px solid #475569;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        color: #e2e8f0;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: left;
                        font-size: 14px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        position: relative;
                        overflow: hidden;
                    }
                    .assignment__quiz-option::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                        transition: left 0.5s;
                    }
                    .assignment__quiz-option:hover::before {
                        left: 100%;
                    }
                    .assignment__quiz-option:hover {
                        background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
                        border-color: #64748b;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    }
                    .assignment__quiz-option:active {
                        transform: translateY(0);
                    }
                    .assignment__quiz-option.correct {
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%);
                        border-color: #10b981;
                    }
                    .assignment__quiz-option.incorrect {
                        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%);
                        border-color: #ef4444;
                    }
                    .assignment__explanation {
                        margin-top: 16px;
                        padding: 12px;
                        background: rgba(110, 231, 183, 0.1);
                        border-left: 4px solid #6ee7b7;
                        border-radius: 4px;
                        color: #cbd5e1;
                        font-size: 14px;
                    }
                    .assignment__puzzle-items {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin: 16px 0;
                    }
                    .assignment__puzzle-item {
                        padding: 10px 14px;
                        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                        border: 2px solid #475569;
                        border-radius: 8px;
                        color: #e2e8f0;
                        cursor: grab;
                        transition: all 0.2s ease;
                        user-select: none;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                    .assignment__puzzle-item:hover {
                        border-color: #64748b;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    }
                    .assignment__puzzle-item:active {
                        cursor: grabbing;
                        transform: scale(0.98);
                    }
                    .assignment__puzzle-item.placed {
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%);
                        border-color: #10b981;
                        cursor: default;
                    }
                    .assignment__button {
                        width: 100%;
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%);
                        border: 2px solid #6ee7b7;
                        border-radius: 10px;
                        color: #0f172a;
                        font-weight: 700;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        margin-top: 16px;
                        box-shadow: 0 4px 12px rgba(110, 231, 183, 0.3);
                    }
                    .assignment__button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 16px rgba(110, 231, 183, 0.5);
                    }
                    .assignment__button:active {
                        transform: translateY(0);
                    }
                    .assignment__button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                        transform: none;
                    }
                    .assignment__controls {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: 12px;
                        margin-top: 8px;
                        padding: 0 4px;
                    }
                    .assignment__hint {
                        color: #94a3b8;
                        font-size: 14px;
                        font-weight: 500;
                    }
                `;
                document.head.appendChild(style);

                // Initialize state
                const state: AssignmentState = {
                    playerX: 400,
                    playerY: 300,
                    tasks: [
                        {
                            id: 'zone_quiz',
                            name: 'Fare Zones',
                            x: 150,
                            y: 150,
                            completed: false,
                            type: 'quiz',
                            description: 'Learn about PTV fare zones'
                        },
                        {
                            id: 'route_quiz',
                            name: 'Bus Routes',
                            x: 650,
                            y: 150,
                            completed: false,
                            type: 'quiz',
                            description: 'Test your knowledge of bus routes'
                        },
                        {
                            id: 'timetable_quiz',
                            name: 'Timetables',
                            x: 150,
                            y: 450,
                            completed: false,
                            type: 'quiz',
                            description: 'Understand train timetables'
                        },
                        {
                            id: 'myki_quiz',
                            name: 'Myki Card',
                            x: 650,
                            y: 450,
                            completed: false,
                            type: 'quiz',
                            description: 'Learn about myki cards'
                        },
                        {
                            id: 'journey_puzzle',
                            name: 'Journey Planning',
                            x: 400,
                            y: 300,
                            completed: false,
                            type: 'puzzle',
                            description: 'Plan a journey to Monash'
                        }
                    ],
                    activeTask: null,
                    completedCount: 0
                };

                // Create UI
                const wrapper = document.createElement('div');
                wrapper.className = 'assignment__wrap';

                const header = document.createElement('div');
                header.className = 'assignment__header';
                header.innerHTML = `
                    <h2>📚 Group Assignment: Melbourne PTV & Travel</h2>
                    <p>Complete all tasks to learn about traveling to Monash University</p>
                `;

                const progress = document.createElement('div');
                progress.className = 'assignment__progress';
                const progressText = document.createElement('div');
                progressText.className = 'assignment__progress-text';
                progressText.textContent = `Tasks: 0/${state.tasks.length}`;
                const progressBar = document.createElement('div');
                progressBar.className = 'assignment__progress-bar';
                const progressFill = document.createElement('div');
                progressFill.className = 'assignment__progress-fill';
                progressFill.style.width = '0%';
                progressBar.appendChild(progressFill);
                progress.appendChild(progressText);
                progress.appendChild(progressBar);

                const canvasWrap = document.createElement('div');
                canvasWrap.className = 'assignment__canvas-wrap';

                const canvas = document.createElement('canvas');
                canvas.className = 'assignment__canvas';
                canvas.width = 800;
                canvas.height = 600;
                const ctx = canvas.getContext('2d')!;

                const status = document.createElement('div');
                status.className = 'assignment__status';
                status.textContent = 'Move with WASD • Press E to interact';

                canvasWrap.appendChild(canvas);
                canvasWrap.appendChild(status);

                const controls = document.createElement('div');
                controls.className = 'assignment__controls';
                const hint = document.createElement('div');
                hint.className = 'assignment__hint';
                hint.textContent = 'Walk around and complete all assignment tasks';
                controls.appendChild(hint);

                wrapper.appendChild(header);
                wrapper.appendChild(progress);
                wrapper.appendChild(canvasWrap);
                wrapper.appendChild(controls);
                container.appendChild(wrapper);

                // Input handling
                const keys = new Set<string>();
                const handleKeyDown = (e: KeyboardEvent) => {
                    keys.add(e.key.toLowerCase());
                    if (e.key.toLowerCase() === 'e' && !state.activeTask) {
                        tryInteract();
                    }
                };
                const handleKeyUp = (e: KeyboardEvent) => {
                    keys.delete(e.key.toLowerCase());
                };

                document.addEventListener('keydown', handleKeyDown);
                document.addEventListener('keyup', handleKeyUp);

                // Player animation state
                let frameIndex = 0;
                let currentAnimation: keyof typeof ANIMATION_FRAMES = 'idle_forward';
                let playerFrames = ANIMATION_FRAMES[currentAnimation];
                let lastDirection: 'forward' | 'backward' | 'left' | 'right' = 'forward';
                let frameTimer = 0;
                const FRAME_DURATION = 0.15; // seconds per frame
                let lastTime = performance.now();

                // Helper functions
                const updateProgress = () => {
                    const percent = (state.completedCount / state.tasks.length) * 100;
                    progressFill.style.width = `${percent}%`;
                    progressText.textContent = `Tasks: ${state.completedCount}/${state.tasks.length}`;
                };

                const tryInteract = () => {
                    for (const task of state.tasks) {
                        if (task.completed) continue;
                        const dx = state.playerX - task.x;
                        const dy = state.playerY - task.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 60) {
                            openTask(task);
                            return;
                        }
                    }
                };

                const openTask = (task: Task) => {
                    state.activeTask = task;

                    if (task.type === 'quiz') {
                        showQuiz(task);
                    } else if (task.type === 'puzzle') {
                        showPuzzle(task);
                    }
                };

                const showQuiz = (task: Task) => {
                    const quizData = QUIZ_QUESTIONS[task.id as keyof typeof QUIZ_QUESTIONS];
                    if (!quizData || quizData.length === 0) return;

                    const question = quizData[0];

                    const modal = document.createElement('div');
                    modal.className = 'assignment__task-modal';

                    const title = document.createElement('h3');
                    title.className = 'assignment__task-title';
                    title.textContent = task.name;

                    const description = document.createElement('p');
                    description.className = 'assignment__task-description';
                    description.textContent = task.description;

                    const questionText = document.createElement('div');
                    questionText.className = 'assignment__quiz-question';
                    questionText.textContent = question.question;

                    const options = document.createElement('div');
                    options.className = 'assignment__quiz-options';

                    question.options.forEach((opt, idx) => {
                        const button = document.createElement('button');
                        button.className = 'assignment__quiz-option';
                        button.textContent = opt;
                        button.onclick = () => handleQuizAnswer(idx, question.correct, button, options, modal, task, question.explanation);
                        options.appendChild(button);
                    });

                    modal.appendChild(title);
                    modal.appendChild(description);
                    modal.appendChild(questionText);
                    modal.appendChild(options);

                    canvasWrap.appendChild(modal);
                };

                const handleQuizAnswer = (
                    selected: number,
                    correct: number,
                    button: HTMLButtonElement,
                    optionsContainer: HTMLElement,
                    modal: HTMLElement,
                    task: Task,
                    explanation: string
                ) => {
                    const allButtons = optionsContainer.querySelectorAll('.assignment__quiz-option');
                    allButtons.forEach(btn => {
                        (btn as HTMLButtonElement).disabled = true;
                        btn.classList.remove('assignment__quiz-option');
                    });

                    if (selected === correct) {
                        button.classList.add('correct');

                        const explainDiv = document.createElement('div');
                        explainDiv.className = 'assignment__explanation';
                        explainDiv.innerHTML = `✓ Correct! ${explanation}`;
                        modal.appendChild(explainDiv);

                        const continueBtn = document.createElement('button');
                        continueBtn.className = 'assignment__button';
                        continueBtn.textContent = 'Continue';
                        continueBtn.onclick = () => {
                            completeTask(task);
                            modal.remove();
                        };
                        modal.appendChild(continueBtn);
                    } else {
                        button.classList.add('incorrect');
                        allButtons[correct].classList.add('correct');

                        const explainDiv = document.createElement('div');
                        explainDiv.className = 'assignment__explanation';
                        explainDiv.innerHTML = `✗ Incorrect. ${explanation}`;
                        modal.appendChild(explainDiv);

                        const retryBtn = document.createElement('button');
                        retryBtn.className = 'assignment__button';
                        retryBtn.textContent = 'Try Again';
                        retryBtn.onclick = () => {
                            modal.remove();
                            state.activeTask = null;
                            setTimeout(() => openTask(task), 100);
                        };
                        modal.appendChild(retryBtn);
                    }
                };

                const showPuzzle = (task: Task) => {
                    const puzzleData = JOURNEY_PUZZLES.morning_commute;

                    const modal = document.createElement('div');
                    modal.className = 'assignment__task-modal';

                    const title = document.createElement('h3');
                    title.className = 'assignment__task-title';
                    title.textContent = task.name;

                    const description = document.createElement('p');
                    description.className = 'assignment__task-description';
                    description.textContent = puzzleData.scenario;

                    const instruction = document.createElement('div');
                    instruction.className = 'assignment__quiz-question';
                    instruction.textContent = 'Arrange the steps in the correct order:';

                    const itemsContainer = document.createElement('div');
                    itemsContainer.className = 'assignment__puzzle-items';

                    // Shuffle steps
                    const shuffled = [...puzzleData.steps].sort(() => Math.random() - 0.5);

                    shuffled.forEach(step => {
                        const item = document.createElement('div');
                        item.className = 'assignment__puzzle-item';
                        item.textContent = step.text;
                        item.draggable = true;
                        item.dataset.order = step.order.toString();

                        item.addEventListener('dragstart', (e) => {
                            e.dataTransfer!.effectAllowed = 'move';
                            e.dataTransfer!.setData('text/html', item.innerHTML);
                            item.style.opacity = '0.5';
                        });

                        item.addEventListener('dragend', () => {
                            item.style.opacity = '1';
                        });

                        item.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            e.dataTransfer!.dropEffect = 'move';
                        });

                        item.addEventListener('drop', (e) => {
                            e.preventDefault();
                            const dragged = document.querySelector('.assignment__puzzle-item[style*="opacity: 0.5"]') as HTMLElement;
                            if (dragged && dragged !== item) {
                                const items = Array.from(itemsContainer.children);
                                const draggedIndex = items.indexOf(dragged);
                                const targetIndex = items.indexOf(item);

                                if (draggedIndex < targetIndex) {
                                    itemsContainer.insertBefore(dragged, item.nextSibling);
                                } else {
                                    itemsContainer.insertBefore(dragged, item);
                                }
                            }
                        });

                        itemsContainer.appendChild(item);
                    });

                    const checkBtn = document.createElement('button');
                    checkBtn.className = 'assignment__button';
                    checkBtn.textContent = 'Check Order';
                    checkBtn.onclick = () => {
                        const items = Array.from(itemsContainer.children) as HTMLElement[];
                        const order = items.map(item => parseInt(item.dataset.order || '0'));
                        const isCorrect = order.every((val, idx) => val === idx + 1);

                        if (isCorrect) {
                            items.forEach(item => item.classList.add('placed'));
                            const explainDiv = document.createElement('div');
                            explainDiv.className = 'assignment__explanation';
                            explainDiv.innerHTML = `✓ Perfect! You've planned the journey correctly.`;
                            modal.appendChild(explainDiv);

                            checkBtn.textContent = 'Continue';
                            checkBtn.onclick = () => {
                                completeTask(task);
                                modal.remove();
                            };
                        } else {
                            const explainDiv = document.createElement('div');
                            explainDiv.className = 'assignment__explanation';
                            explainDiv.innerHTML = `✗ Not quite right. Think about the logical order of travel steps.`;
                            if (modal.querySelector('.assignment__explanation')) {
                                modal.querySelector('.assignment__explanation')!.remove();
                            }
                            modal.insertBefore(explainDiv, checkBtn);
                        }
                    };

                    modal.appendChild(title);
                    modal.appendChild(description);
                    modal.appendChild(instruction);
                    modal.appendChild(itemsContainer);
                    modal.appendChild(checkBtn);

                    canvasWrap.appendChild(modal);
                };

                const completeTask = (task: Task) => {
                    task.completed = true;
                    state.completedCount++;
                    state.activeTask = null;
                    updateProgress();

                    if (state.completedCount >= state.tasks.length) {
                        setTimeout(() => {
                            finishAssignment();
                        }, 500);
                    }
                };

                const finishAssignment = () => {
                    const modal = document.createElement('div');
                    modal.className = 'assignment__task-modal';
                    modal.innerHTML = `
                        <h3 class="assignment__task-title">🎉 Assignment Complete!</h3>
                        <p class="assignment__task-description">
                            Great work! You've learned the essentials of traveling to Monash using PTV.
                            Your group is now ready to submit the assignment.
                        </p>
                        <div class="assignment__explanation">
                            <strong>Skills Gained:</strong><br>
                            • Understanding of Melbourne's public transport system<br>
                            • Knowledge of fare zones and routes<br>
                            • Journey planning abilities
                        </div>
                    `;

                    const finishBtn = document.createElement('button');
                    finishBtn.className = 'assignment__button';
                    finishBtn.textContent = 'Finish Assignment';
                    finishBtn.onclick = () => {
                        cleanup();
                        resolve({
                            success: true,
                            completed: true
                        });
                    };

                    modal.appendChild(finishBtn);
                    canvasWrap.appendChild(modal);
                };

                // Game loop
                let animFrame: number;
                const loop = (currentTime: number) => {
                    const deltaTime = (currentTime - lastTime) / 1000;
                    lastTime = currentTime;

                    if (!state.activeTask) {
                        const speed = 3;
                        let dx = 0, dy = 0;
                        let moving = false;
                        
                        if (keys.has('w') || keys.has('arrowup')) { dy -= speed; moving = true; lastDirection = 'backward'; }
                        if (keys.has('s') || keys.has('arrowdown')) { dy += speed; moving = true; lastDirection = 'forward'; }
                        if (keys.has('a') || keys.has('arrowleft')) { dx -= speed; moving = true; lastDirection = 'left'; }
                        if (keys.has('d') || keys.has('arrowright')) { dx += speed; moving = true; lastDirection = 'right'; }

                        const newX = Math.max(30, Math.min(770, state.playerX + dx));
                        const newY = Math.max(30, Math.min(570, state.playerY + dy));
                        state.playerX = newX;
                        state.playerY = newY;

                        // Update player animation
                        if (moving) {
                            const animKey = `walk_${lastDirection}` as keyof typeof ANIMATION_FRAMES;
                            if (currentAnimation !== animKey) {
                                currentAnimation = animKey;
                                playerFrames = ANIMATION_FRAMES[currentAnimation];
                                frameIndex = 0;
                                frameTimer = 0;
                            }
                            frameTimer += deltaTime;
                            if (frameTimer >= FRAME_DURATION) {
                                frameIndex = (frameIndex + 1) % playerFrames.length;
                                frameTimer = 0;
                            }
                        } else {
                            const animKey = `idle_${lastDirection}` as keyof typeof ANIMATION_FRAMES;
                            if (currentAnimation !== animKey) {
                                currentAnimation = animKey;
                                playerFrames = ANIMATION_FRAMES[currentAnimation];
                                frameIndex = 0;
                                frameTimer = 0;
                            }
                        }

                        // Update status
                        let nearestTask: Task | null = null;
                        let nearestDist = 60;
                        for (const task of state.tasks) {
                            if (task.completed) continue;
                            const dx = state.playerX - task.x;
                            const dy = state.playerY - task.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < nearestDist) {
                                nearestDist = dist;
                                nearestTask = task;
                            }
                        }

                        if (nearestTask) {
                            status.textContent = `Press E to start: ${nearestTask.name}`;
                        } else {
                            status.textContent = 'Move with WASD • Press E to interact';
                        }
                    }

                    // Render
                    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                    bgGradient.addColorStop(0, '#1e293b');
                    bgGradient.addColorStop(1, '#0f172a');
                    ctx.fillStyle = bgGradient;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw floor with road tiles
                    const tileSize = 40; // Tile size for rendering
                    for (let y = 0; y <= canvas.height; y += tileSize) {
                        for (let x = 0; x <= canvas.width; x += tileSize) {
                            roadTileset.drawTile(ctx, 0, x, y, tileSize / 32);
                        }
                    }

                    // Draw tasks with paper sprite
                    state.tasks.forEach(task => {
                        ctx.save();

                        if (paperSprite && paperSprite.complete) {
                            // Draw paper sprite
                            const paperSize = task.completed ? 50 : 60;
                            const paperX = task.x - paperSize / 2;
                            const paperY = task.y - paperSize / 2;
                            
                            // Glow for incomplete tasks
                            if (!task.completed) {
                                ctx.shadowColor = 'rgba(110, 231, 183, 0.6)';
                                ctx.shadowBlur = 20;
                            }
                            
                            // Draw paper
                            ctx.drawImage(paperSprite, paperX, paperY, paperSize, paperSize);
                            ctx.shadowBlur = 0;
                            
                            // Draw checkmark on completed tasks
                            if (task.completed) {
                                ctx.fillStyle = '#10b981';
                                ctx.font = 'bold 24px sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillText('✓', task.x, task.y);
                            }
                        } else {
                            // Fallback to circles if paper sprite fails
                            if (!task.completed) {
                                ctx.shadowColor = 'rgba(110, 231, 183, 0.6)';
                                ctx.shadowBlur = 20;
                            }

                            const gradient = ctx.createRadialGradient(task.x, task.y, 10, task.x, task.y, 40);
                            if (task.completed) {
                                gradient.addColorStop(0, '#10b981');
                                gradient.addColorStop(1, '#064e3b');
                            } else {
                                gradient.addColorStop(0, '#6ee7b7');
                                gradient.addColorStop(1, '#0d9488');
                            }
                            ctx.fillStyle = gradient;
                            ctx.beginPath();
                            ctx.arc(task.x, task.y, 35, 0, Math.PI * 2);
                            ctx.fill();

                            ctx.shadowBlur = 0;
                            ctx.strokeStyle = task.completed ? '#10b981' : '#6ee7b7';
                            ctx.lineWidth = 3;
                            ctx.stroke();

                            ctx.fillStyle = '#0f172a';
                            ctx.font = 'bold 24px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(task.completed ? '✓' : '?', task.x, task.y);
                        }

                        // Label
                        ctx.fillStyle = task.completed ? '#94a3b8' : '#f1f5f9';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(task.name, task.x, task.y + 50);

                        ctx.restore();
                    });

                    // Draw player with custom sprite
                    ctx.save();
                    if (playerData.compositedImage) {
                        const frame = playerFrames[frameIndex];
                        drawSubSprite(ctx, playerData.compositedImage, {
                            sourceX: (frame.col - 1) * 32,
                            sourceY: (frame.row - 1) * 32,
                            sourceWidth: 32,
                            sourceHeight: 32,
                            x: state.playerX - 16,
                            y: state.playerY - 16,
                            width: 32,
                            height: 32,
                        });
                    } else {
                        // Fallback to circle
                        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
                        ctx.shadowBlur = 15;

                        const playerGradient = ctx.createRadialGradient(
                            state.playerX, state.playerY - 2, 5,
                            state.playerX, state.playerY, 16
                        );
                        playerGradient.addColorStop(0, '#fbbf24');
                        playerGradient.addColorStop(1, '#f59e0b');
                        ctx.fillStyle = playerGradient;
                        ctx.beginPath();
                        ctx.arc(state.playerX, state.playerY, 16, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.shadowBlur = 0;
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 3;
                        ctx.stroke();

                        ctx.fillStyle = '#1e293b';
                        ctx.font = 'bold 11px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('YOU', state.playerX, state.playerY);
                    }

                    ctx.restore();

                    animFrame = requestAnimationFrame(loop);
                };

                loop(performance.now());

                const cleanup = () => {
                    if (animFrame) cancelAnimationFrame(animFrame);
                    document.removeEventListener('keydown', handleKeyDown);
                    document.removeEventListener('keyup', handleKeyUp);
                    style.remove();
                };
            });
        }
    };
};
