import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { applyDeltas, logActivity, transitionScene } from '../core/gameState';

/**
 * Assignment Tasks Scene - Among Us style task completion
 * After group meeting, players complete 3 mini-tasks before heading to bus bay
 */

interface TaskDefinition {
    id: string;
    name: string;
    location: string;
    description: string;
    icon: string;
    completed: boolean;
}

const ASSIGNMENT_TASKS: TaskDefinition[] = [
    {
        id: 'research',
        name: 'Research Privacy Laws',
        location: 'Library Computer',
        description: 'Find relevant privacy legislation for the debate',
        icon: '📚',
        completed: false,
    },
    {
        id: 'outline',
        name: 'Draft Outline',
        location: 'Study Desk',
        description: 'Create a structured outline for the presentation',
        icon: '📝',
        completed: false,
    },
    {
        id: 'slides',
        name: 'Format Slides',
        location: 'Computer Lab',
        description: 'Set up the presentation template',
        icon: '💻',
        completed: false,
    },
];

interface TaskSceneState {
    playerX: number;
    playerY: number;
    tasks: TaskDefinition[];
    activeTask: string | null;
    completedCount: number;
}

// Research minigame - Click matching privacy terms
const playResearchTask = (container: HTMLElement): Promise<boolean> => {
    return new Promise((resolve) => {
        container.innerHTML = '';

        const taskWrap = document.createElement('div');
        taskWrap.style.cssText = `
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 2px solid #334155;
            border-radius: 12px;
            padding: 20px;
            max-width: 500px;
            margin: 20px auto;
        `;

        const title = document.createElement('h3');
        title.textContent = '📚 Research Privacy Laws';
        title.style.cssText = 'color: #f8fafc; margin-top: 0;';

        const instruction = document.createElement('p');
        instruction.textContent = 'Click all privacy-related terms (3 correct answers):';
        instruction.style.color = '#cbd5e1';

        const termsGrid = document.createElement('div');
        termsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0;';

        const terms = [
            { text: 'GDPR', correct: true },
            { text: 'Blockchain', correct: false },
            { text: 'Data Protection', correct: true },
            { text: 'NFT', correct: false },
            { text: 'Consent', correct: true },
            { text: 'Cryptocurrency', correct: false },
        ];

        let correctClicked = 0;

        terms.forEach(term => {
            const btn = document.createElement('button');
            btn.textContent = term.text;
            btn.style.cssText = `
                padding: 15px;
                border: 2px solid #475569;
                border-radius: 8px;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: #e2e8f0;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            `;

            btn.onmouseover = () => {
                if (!btn.disabled) {
                    btn.style.background = 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
                    btn.style.borderColor = '#64748b';
                }
            };

            btn.onmouseout = () => {
                if (!btn.disabled) {
                    btn.style.background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
                    btn.style.borderColor = '#475569';
                }
            };

            btn.onclick = () => {
                if (term.correct) {
                    btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                    btn.style.borderColor = '#16a34a';
                    btn.disabled = true;
                    correctClicked++;

                    if (correctClicked === 3) {
                        setTimeout(() => {
                            resolve(true);
                        }, 500);
                    }
                } else {
                    btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                    btn.style.borderColor = '#dc2626';
                    setTimeout(() => {
                        resolve(false);
                    }, 500);
                }
            };

            termsGrid.appendChild(btn);
        });

        taskWrap.appendChild(title);
        taskWrap.appendChild(instruction);
        taskWrap.appendChild(termsGrid);
        container.appendChild(taskWrap);
    });
};

// Outline minigame - Drag items into correct order
const playOutlineTask = (container: HTMLElement): Promise<boolean> => {
    return new Promise((resolve) => {
        container.innerHTML = '';

        const taskWrap = document.createElement('div');
        taskWrap.style.cssText = `
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 2px solid #334155;
            border-radius: 12px;
            padding: 20px;
            max-width: 500px;
            margin: 20px auto;
        `;

        const title = document.createElement('h3');
        title.textContent = '📝 Draft Outline';
        title.style.cssText = 'color: #f8fafc; margin-top: 0;';

        const instruction = document.createElement('p');
        instruction.textContent = 'Click sections in the correct order:';
        instruction.style.color = '#cbd5e1';

        const sections = [
            { text: '1. Introduction', order: 1 },
            { text: '2. Arguments For', order: 2 },
            { text: '3. Arguments Against', order: 3 },
            { text: '4. Conclusion', order: 4 },
        ];

        // Shuffle for display
        const shuffled = [...sections].sort(() => Math.random() - 0.5);

        const sectionsGrid = document.createElement('div');
        sectionsGrid.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin: 20px 0;';

        let currentOrder = 1;

        shuffled.forEach(section => {
            const btn = document.createElement('button');
            btn.textContent = section.text;
            btn.style.cssText = `
                padding: 15px;
                border: 2px solid #475569;
                border-radius: 8px;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: #e2e8f0;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
                text-align: left;
            `;

            btn.onmouseover = () => {
                if (!btn.disabled) {
                    btn.style.background = 'linear-gradient(135deg, #334155 0%, #1e293b 100%)';
                }
            };

            btn.onmouseout = () => {
                if (!btn.disabled) {
                    btn.style.background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
                }
            };

            btn.onclick = () => {
                if (section.order === currentOrder) {
                    btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                    btn.style.borderColor = '#16a34a';
                    btn.disabled = true;
                    currentOrder++;

                    if (currentOrder > 4) {
                        setTimeout(() => {
                            resolve(true);
                        }, 500);
                    }
                } else {
                    btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                    btn.style.borderColor = '#dc2626';
                    setTimeout(() => {
                        resolve(false);
                    }, 500);
                }
            };

            sectionsGrid.appendChild(btn);
        });

        taskWrap.appendChild(title);
        taskWrap.appendChild(instruction);
        taskWrap.appendChild(sectionsGrid);
        container.appendChild(taskWrap);
    });
};

// Slides minigame - Quick time button press sequence
const playSlidesTask = (container: HTMLElement): Promise<boolean> => {
    return new Promise((resolve) => {
        container.innerHTML = '';

        const taskWrap = document.createElement('div');
        taskWrap.style.cssText = `
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 2px solid #334155;
            border-radius: 12px;
            padding: 20px;
            max-width: 500px;
            margin: 20px auto;
        `;

        const title = document.createElement('h3');
        title.textContent = '💻 Format Slides';
        title.style.cssText = 'color: #f8fafc; margin-top: 0;';

        const instruction = document.createElement('p');
        instruction.textContent = 'Press the spacebar when the bar is in the green zone!';
        instruction.style.color = '#cbd5e1';

        const barContainer = document.createElement('div');
        barContainer.style.cssText = `
            width: 100%;
            height: 40px;
            background: #334155;
            border-radius: 8px;
            position: relative;
            margin: 20px 0;
            overflow: hidden;
        `;

        const greenZone = document.createElement('div');
        greenZone.style.cssText = `
            position: absolute;
            left: 35%;
            width: 30%;
            height: 100%;
            background: rgba(34, 197, 94, 0.3);
            border-left: 2px solid #22c55e;
            border-right: 2px solid #22c55e;
        `;

        const slider = document.createElement('div');
        slider.style.cssText = `
            position: absolute;
            width: 4px;
            height: 100%;
            background: #60a5fa;
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.8);
        `;

        barContainer.appendChild(greenZone);
        barContainer.appendChild(slider);

        let position = 0;
        let direction = 1;
        const speed = 2;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                document.removeEventListener('keydown', handleKeyPress);
                clearInterval(interval);

                const barWidth = barContainer.offsetWidth;
                const greenStart = 0.35 * barWidth;
                const greenEnd = 0.65 * barWidth;

                if (position >= greenStart && position <= greenEnd) {
                    slider.style.background = '#22c55e';
                    setTimeout(() => resolve(true), 300);
                } else {
                    slider.style.background = '#ef4444';
                    setTimeout(() => resolve(false), 300);
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        const interval = setInterval(() => {
            position += direction * speed;

            const maxPos = barContainer.offsetWidth - 4;
            if (position >= maxPos || position <= 0) {
                direction *= -1;
            }

            slider.style.left = `${position}px`;
        }, 16);

        taskWrap.appendChild(title);
        taskWrap.appendChild(instruction);
        taskWrap.appendChild(barContainer);
        container.appendChild(taskWrap);
    });
};

export const renderAssignmentTasks = async (root: HTMLElement, store: GameStore) => {
    root.innerHTML = '';

    // Prevent multiple instances
    if ((window as any).__at_cleanup) {
        (window as any).__at_cleanup();
        delete (window as any).__at_cleanup;
    }

    // Styling
    if (!document.head.querySelector('style[data-assignment-tasks]')) {
        const style = document.createElement('style');
        style.setAttribute('data-assignment-tasks', 'true');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
            }
            .assignment-tasks__wrap {
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding: 20px;
                max-width: 1100px;
                margin: 0 auto;
                animation: fadeIn 0.4s ease-out;
            }
            .assignment-tasks__header h2 {
                margin: 0 0 6px;
                color: #f8fafc;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .assignment-tasks__header p {
                color: #cbd5e1;
                margin: 0;
            }
            .assignment-tasks__canvas-wrap {
                position: relative;
                width: 100%;
                aspect-ratio: 16 / 9;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 2px solid #334155;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            .assignment-tasks__canvas {
                display: block;
                width: 100%;
                height: 100%;
                image-rendering: pixelated;
            }
            .assignment-tasks__task-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
            }
            .assignment-tasks__controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                margin-top: 8px;
            }
            .assignment-tasks__hint {
                color: #94a3b8;
                font-size: 14px;
                font-weight: 500;
            }
            .assignment-tasks__next {
                padding: 12px 24px;
                border: none;
                border-radius: 10px;
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: #052e16;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(34,197,94,0.3);
                font-size: 15px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .assignment-tasks__next:hover:not([disabled]) {
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(34,197,94,0.4);
            }
            .assignment-tasks__next[disabled] {
                opacity: 0.4;
                cursor: not-allowed;
                background: linear-gradient(135deg, #64748b 0%, #475569 100%);
            }
        `;
        document.head.appendChild(style);
    }

    const container = document.createElement('div');
    container.className = 'assignment-tasks__wrap';

    const header = document.createElement('div');
    header.className = 'assignment-tasks__header';
    header.innerHTML = `
        <h2>Learning & Teaching Building — Assignment Work</h2>
        <p>Complete 3 tasks before heading to the bus bay. Walk around (WASD) and press E to interact.</p>
    `;

    const statsBar = createStatsBar(store.getState());

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'assignment-tasks__canvas-wrap';

    const canvas = document.createElement('canvas');
    canvas.className = 'assignment-tasks__canvas';
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d')!;

    canvasWrap.appendChild(canvas);

    const controls = document.createElement('div');
    controls.className = 'assignment-tasks__controls';
    const hint = document.createElement('div');
    hint.className = 'assignment-tasks__hint';
    hint.textContent = 'Complete all 3 tasks to continue';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'assignment-tasks__next';
    nextBtn.textContent = 'Head to Bus Bay';
    nextBtn.disabled = true;
    controls.appendChild(hint);
    controls.appendChild(nextBtn);

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(canvasWrap);
    container.appendChild(controls);
    root.appendChild(container);

    // Restore or initialize state
    let taskState: TaskSceneState = (window as any).__at_state || {
        playerX: 320,
        playerY: 280,
        tasks: ASSIGNMENT_TASKS.map(t => ({ ...t })),
        activeTask: null,
        completedCount: 0,
    };

    const persistState = () => {
        (window as any).__at_state = taskState;
    };

    // Task positions in the room
    const taskPositions = [
        { id: 'research', x: 180, y: 120 },
        { id: 'outline', x: 460, y: 120 },
        { id: 'slides', x: 320, y: 180 },
    ];

    // Input handling
    const keys = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => {
        keys.add(e.key.toLowerCase());
        if (e.key.toLowerCase() === 'e' && !taskState.activeTask) {
            tryInteract();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keys.delete(e.key.toLowerCase());
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const isWalkable = (x: number, y: number): boolean => {
        if (x < 20 || x > 620 || y < 20 || y > 340) return false;
        return true;
    };

    const tryInteract = () => {
        for (const taskPos of taskPositions) {
            const task = taskState.tasks.find(t => t.id === taskPos.id);
            if (!task || task.completed) continue;

            const dx = taskState.playerX - taskPos.x;
            const dy = taskState.playerY - taskPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 60) {
                startTask(task);
                return;
            }
        }
    };

    const startTask = async (task: TaskDefinition) => {
        taskState.activeTask = task.id;
        persistState();

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'assignment-tasks__task-overlay';
        const taskContainer = document.createElement('div');
        overlay.appendChild(taskContainer);
        canvasWrap.appendChild(overlay);

        let success = false;

        try {
            switch (task.id) {
                case 'research':
                    success = await playResearchTask(taskContainer);
                    break;
                case 'outline':
                    success = await playOutlineTask(taskContainer);
                    break;
                case 'slides':
                    success = await playSlidesTask(taskContainer);
                    break;
            }
        } catch (error) {
            console.error('Task error:', error);
            success = false;
        }

        // Remove overlay
        overlay.remove();

        if (success) {
            task.completed = true;
            taskState.completedCount++;

            // Apply stat gains
            const deltas: any = {
                stats: { S: 1 },
                time: 15,
                rapport: {},
                flagsGained: [],
            };

            let next = applyDeltas(store.getState(), deltas);
            next = logActivity(next, {
                segment: 'campus-ltb',
                choiceId: `task-${task.id}`,
                summary: `Completed: ${task.name}`,
                deltas,
            });

            store.setState(next);

            if (taskState.completedCount >= 3) {
                nextBtn.disabled = false;
                hint.textContent = 'All tasks complete! Ready to go home.';
            } else {
                hint.textContent = `Completed ${taskState.completedCount}/3 tasks`;
            }
        } else {
            hint.textContent = `Task failed! Try another task or retry.`;
        }

        taskState.activeTask = null;
        persistState();
    };

    nextBtn.onclick = () => {
        if (taskState.completedCount >= 3) {
            if (animFrame) cancelAnimationFrame(animFrame);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            delete (window as any).__at_state;
            delete (window as any).__at_cleanup;
            store.setState((prev) => transitionScene(prev, 'evening-commute'));
        }
    };

    // Game loop
    let animFrame: number;
    const loop = () => {
        if (!taskState.activeTask) {
            const speed = 2;
            let dx = 0, dy = 0;
            if (keys.has('w') || keys.has('arrowup')) dy -= speed;
            if (keys.has('s') || keys.has('arrowdown')) dy += speed;
            if (keys.has('a') || keys.has('arrowleft')) dx -= speed;
            if (keys.has('d') || keys.has('arrowright')) dx += speed;

            const newX = taskState.playerX + dx;
            const newY = taskState.playerY + dy;
            if (isWalkable(newX, newY)) {
                taskState.playerX = newX;
                taskState.playerY = newY;
                persistState();
            }
        }

        // Render
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#1e293b');
        bgGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Floor
        for (let x = 0; x < canvas.width; x += 16) {
            for (let y = 0; y < canvas.height; y += 16) {
                ctx.fillStyle = (x / 16 + y / 16) % 2 === 0 ? '#2a3347' : '#1e293b';
                ctx.fillRect(x, y, 16, 16);
            }
        }

        // Task stations
        taskPositions.forEach(taskPos => {
            const task = taskState.tasks.find(t => t.id === taskPos.id)!;

            ctx.save();
            ctx.shadowColor = task.completed ? 'rgba(34, 197, 94, 0.6)' : 'rgba(96, 165, 250, 0.6)';
            ctx.shadowBlur = 15;

            ctx.fillStyle = task.completed ? '#22c55e' : '#60a5fa';
            ctx.fillRect(taskPos.x - 20, taskPos.y - 20, 40, 40);

            ctx.shadowBlur = 0;
            ctx.restore();

            // Icon
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(task.icon, taskPos.x, taskPos.y + 8);

            // Label
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = task.completed ? '#cbd5e1' : '#f1f5f9';
            ctx.fillText(task.name.split(' ')[0], taskPos.x, taskPos.y + 35);
        });

        // Player
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 20;
        const playerGradient = ctx.createRadialGradient(
            taskState.playerX, taskState.playerY - 2, 4,
            taskState.playerX, taskState.playerY, 14
        );
        playerGradient.addColorStop(0, '#fbbf24');
        playerGradient.addColorStop(1, '#f59e0b');
        ctx.fillStyle = playerGradient;
        ctx.beginPath();
        ctx.arc(taskState.playerX, taskState.playerY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', taskState.playerX, taskState.playerY + 4);

        animFrame = requestAnimationFrame(loop);
    };

    if (taskState.completedCount >= 3) {
        nextBtn.disabled = false;
        hint.textContent = 'All tasks complete! Ready to go home.';
    }

    loop();

    const cleanup = () => {
        if (animFrame) cancelAnimationFrame(animFrame);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
    };
    (window as any).__at_cleanup = cleanup;
};
