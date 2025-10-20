import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { NPC_DEFINITIONS } from '../data/npcs';
import type { MajorId, NpcId } from '../core/types';
import { applyDeltas, logActivity, transitionScene } from '../core/gameState';

type ChoiceKey = 'friendly' | 'dismissive' | 'major';

// Image cache for NPC sprites
const imageCache = new Map<NpcId, HTMLImageElement>();

// Preload NPC sprites
const preloadNpcSprites = () => {
    const npcIds: NpcId[] = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'];
    npcIds.forEach(id => {
        const img = new Image();
        img.src = `/sprites/npcs/${id}.png`;
        img.onerror = () => console.warn(`Failed to load sprite for ${id}, using fallback`);
        imageCache.set(id, img);
    });
};

const matchesMajor = (playerMajor: MajorId, npcId: NpcId) => {
    const def = NPC_DEFINITIONS[npcId];
    return def.majorAffinity === playerMajor;
};

interface NpcState {
    npcId: NpcId;
    x: number;
    y: number;
    talked: boolean;
}

interface MeetingState {
    playerX: number;
    playerY: number;
    npcs: NpcState[];
    activeDialogue: null | {
        npcId: NpcId;
        stage: 'greeting' | 'choosing' | 'reacting';
        choiceKey?: ChoiceKey;
        deltas?: any;
        flavor?: string;
    };
    finished: boolean;
    talkedCount: number;
}

const typewriterEffect = (element: HTMLElement, text: string, speed = 30): Promise<void> => {
    return new Promise((resolve) => {
        let i = 0;
        element.textContent = '';
        const interval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text[i];
                i++;
            } else {
                clearInterval(interval);
                resolve();
            }
        }, speed);
    });
};

export const renderGroupMeeting = async (root: HTMLElement, store: GameStore) => {
    root.innerHTML = '';

    // Preload sprites
    preloadNpcSprites();

    // Prevent multiple instances - cleanup any existing state
    if ((window as any).__gm_cleanup) {
        (window as any).__gm_cleanup();
        delete (window as any).__gm_cleanup;
    }

    // Enhanced styling with animations and polish
    if (!document.head.querySelector('style[data-meeting-room]')) {
        const style = document.createElement('style');
        style.setAttribute('data-meeting-room', 'true');
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
            
            .meeting__wrap { 
                display:flex; 
                flex-direction:column; 
                gap:16px; 
                padding:20px; 
                max-width:1100px; 
                margin:0 auto;
                animation: fadeIn 0.4s ease-out;
            }
            .meeting__header h2 { 
                margin: 0 0 6px; 
                color: #f8fafc;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .meeting__header p {
                color: #cbd5e1;
                margin: 0;
            }
            .meeting__canvasWrap { 
                position:relative; 
                width:100%; 
                aspect-ratio: 16 / 9; 
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 2px solid #334155; 
                border-radius:12px; 
                overflow:hidden;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
            }
            .meeting__canvas { 
                display:block; 
                width:100%; 
                height:100%; 
                image-rendering: pixelated;
            }
            .meeting__dialogue { 
                position:absolute; 
                left:50%; 
                bottom:16px; 
                transform:translateX(-50%); 
                width:94%; 
                max-width:900px; 
                display:flex; 
                flex-direction:column; 
                gap:10px; 
                pointer-events:none;
                z-index: 10;
            }
            .meeting__bubble { 
                position:relative; 
                padding:14px 16px; 
                background: linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%);
                border:2px solid rgba(100,116,139,0.5); 
                border-radius:12px; 
                color:#f1f5f9; 
                box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1) inset;
                font-size:15px; 
                pointer-events:auto;
                animation: slideUp 0.3s ease-out;
                backdrop-filter: blur(8px);
            }
            .meeting__bubble .speaker { 
                display:block; 
                font-weight:800; 
                color:#6ee7b7; 
                margin-bottom:6px; 
                letter-spacing:0.5px;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                font-size: 13px;
                text-transform: uppercase;
            }
            .meeting__options { 
                display:grid; 
                gap:10px; 
                grid-template-columns: repeat(3, minmax(0, 1fr)); 
                margin-top:8px;
            }
            .meeting__optionBtn { 
                padding:12px 14px; 
                border:2px solid #475569; 
                border-radius:10px; 
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color:#e2e8f0; 
                cursor:pointer; 
                transition: all 0.2s ease;
                text-align:left;
                font-size: 14px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                position: relative;
                overflow: hidden;
            }
            .meeting__optionBtn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                transition: left 0.5s;
            }
            .meeting__optionBtn:hover::before {
                left: 100%;
            }
            .meeting__optionBtn:hover { 
                background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
                border-color:#64748b; 
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            }
            .meeting__optionBtn:active {
                transform: translateY(0);
            }
            .meeting__status { 
                position:absolute; 
                top:16px; 
                left:50%; 
                transform:translateX(-50%); 
                background: linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%);
                border:2px solid rgba(100,116,139,0.6); 
                border-radius:10px; 
                padding:8px 16px; 
                color:#f1f5f9; 
                font-size:14px; 
                white-space:nowrap;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                backdrop-filter: blur(8px);
                font-weight: 600;
                animation: pulse 2s ease-in-out infinite;
            }
            .meeting__controls { 
                display:flex; 
                justify-content:space-between; 
                align-items: center;
                gap:12px; 
                margin-top:8px;
                padding: 0 4px;
            }
            .meeting__hint { 
                color:#94a3b8; 
                font-size:14px;
                font-weight: 500;
            }
            .meeting__next { 
                padding:12px 24px; 
                border:none; 
                border-radius:10px; 
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color:#052e16; 
                font-weight:800; 
                cursor:pointer; 
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(34,197,94,0.3);
                font-size: 15px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .meeting__next:hover:not([disabled]) {
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(34,197,94,0.4);
            }
            .meeting__next:active:not([disabled]) {
                transform: translateY(0);
            }
            .meeting__next[disabled] { 
                opacity:0.4; 
                cursor:not-allowed;
                background: linear-gradient(135deg, #64748b 0%, #475569 100%);
                box-shadow: none;
            }
        `;
        document.head.appendChild(style);
    }

    const container = document.createElement('div');
    container.className = 'meeting__wrap';

    const header = document.createElement('div');
    header.className = 'meeting__header';
    header.innerHTML = `
        <h2>Learning & Teaching Building — Group Room</h2>
        <p>Walk around (WASD) and press E to talk to NPCs.</p>
    `;

    const statsBar = createStatsBar(store.getState());

    // Canvas wrapper
    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'meeting__canvasWrap';

    const canvas = document.createElement('canvas');
    canvas.className = 'meeting__canvas';
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d')!;

    const status = document.createElement('div');
    status.className = 'meeting__status';
    status.textContent = 'Explore the room';

    const dialogueLayer = document.createElement('div');
    dialogueLayer.className = 'meeting__dialogue';

    canvasWrap.appendChild(canvas);
    canvasWrap.appendChild(status);
    canvasWrap.appendChild(dialogueLayer);

    // Controls row
    const controls = document.createElement('div');
    controls.className = 'meeting__controls';
    const hint = document.createElement('div');
    hint.className = 'meeting__hint';
    hint.textContent = 'Talk to all 5 teammates to continue';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'meeting__next';
    nextBtn.textContent = 'Continue';
    nextBtn.disabled = true;
    controls.appendChild(hint);
    controls.appendChild(nextBtn);

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(canvasWrap);
    container.appendChild(controls);
    root.appendChild(container);

    // Restore or initialize state
    let meetingState: MeetingState = (window as any).__gm_state || {
        playerX: 320,
        playerY: 280,
        npcs: [
            { npcId: 'bonsen' as NpcId, x: 180, y: 120, talked: false },
            { npcId: 'zahir' as NpcId, x: 320, y: 100, talked: false },
            { npcId: 'jiun' as NpcId, x: 460, y: 120, talked: false },
            { npcId: 'anika' as NpcId, x: 460, y: 240, talked: false },
            { npcId: 'jiawen' as NpcId, x: 180, y: 240, talked: false },
        ],
        activeDialogue: null,
        finished: false,
        talkedCount: 0,
    };

    const persistState = () => {
        (window as any).__gm_state = meetingState;
    };

    // Input handling
    const keys = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => {
        keys.add(e.key.toLowerCase());
        if (e.key.toLowerCase() === 'e' && !meetingState.activeDialogue) {
            tryInteract();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keys.delete(e.key.toLowerCase());
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Collision/bounds
    const isWalkable = (x: number, y: number): boolean => {
        // Keep player in bounds
        if (x < 20 || x > 620 || y < 20 || y > 340) return false;
        // Table area (central rectangle)
        if (x > 200 && x < 440 && y > 140 && y < 220) return false;
        return true;
    };

    const tryInteract = () => {
        if (meetingState.activeDialogue) return;
        // Check distance to each NPC
        for (const npc of meetingState.npcs) {
            const dx = meetingState.playerX - npc.x;
            const dy = meetingState.playerY - npc.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 50) {
                startDialogue(npc.npcId);
                return;
            }
        }
    };

    const clearDialogue = () => {
        dialogueLayer.innerHTML = '';
    };

    const startDialogue = async (npcId: NpcId) => {
        const npc = NPC_DEFINITIONS[npcId];
        const npcState = meetingState.npcs.find(n => n.npcId === npcId)!;

        if (npcState.talked) {
            status.textContent = `${npc.name} is done chatting.`;
            return;
        }

        meetingState.activeDialogue = { npcId, stage: 'greeting' };
        persistState();

        clearDialogue();
        const bubble = document.createElement('div');
        bubble.className = 'meeting__bubble';
        bubble.style.display = 'flex';
        bubble.style.gap = '12px';
        bubble.style.alignItems = 'flex-start';

        // Add portrait if sprite is loaded
        const img = imageCache.get(npcId);
        if (img && img.complete && img.naturalWidth > 0) {
            const portrait = document.createElement('img');
            portrait.src = img.src;
            portrait.style.cssText = `
                width: 64px;
                height: 64px;
                border-radius: 8px;
                object-fit: cover;
                border: 2px solid #6ee7b7;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            bubble.appendChild(portrait);
        }

        // Text content wrapper
        const textWrap = document.createElement('div');
        textWrap.style.flex = '1';
        textWrap.style.minWidth = '0';

        const speakerSpan = document.createElement('span');
        speakerSpan.className = 'speaker';
        speakerSpan.textContent = npc.name;
        const textSpan = document.createElement('span');

        textWrap.appendChild(speakerSpan);
        textWrap.appendChild(textSpan);
        bubble.appendChild(textWrap);
        dialogueLayer.appendChild(bubble);

        // Typewriter greeting
        await typewriterEffect(textSpan, npc.greeting, 25);

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 400));

        // Show choices
        showChoices(npcId, bubble);
    };

    const showChoices = (npcId: NpcId, greetingBubble: HTMLElement) => {
        const npc = NPC_DEFINITIONS[npcId];
        const state = store.getState();

        meetingState.activeDialogue = { npcId, stage: 'choosing' };
        persistState();

        const optionsWrap = document.createElement('div');
        optionsWrap.className = 'meeting__bubble';
        const chooseLabel = document.createElement('span');
        chooseLabel.className = 'speaker';
        chooseLabel.textContent = 'Choose your reply';
        const options = document.createElement('div');
        options.className = 'meeting__options';

        const buildButton = (key: ChoiceKey, label: string) => {
            const btn = document.createElement('button');
            btn.className = 'meeting__optionBtn';
            btn.textContent = label;
            btn.onclick = () => handleChoice(npcId, key, greetingBubble, optionsWrap);
            return btn;
        };

        const rFriendly = npc.replies.find((r: any) => r.label === 'friendly');
        const rDismissive = npc.replies.find((r: any) => r.label === 'dismissive');
        const rMajor = npc.replies.find((r: any) => r.label === 'major');

        if (rFriendly) options.appendChild(buildButton('friendly', rFriendly.line));
        if (rDismissive) options.appendChild(buildButton('dismissive', rDismissive.line));
        if (rMajor) {
            const line = rMajor.line.replace('[player major]', state.major.charAt(0).toUpperCase() + state.major.slice(1));
            options.appendChild(buildButton('major', line));
        }

        optionsWrap.appendChild(chooseLabel);
        optionsWrap.appendChild(options);
        dialogueLayer.appendChild(optionsWrap);
    };

    const handleChoice = async (npcId: NpcId, key: ChoiceKey, _greetingBubble: HTMLElement, optionsWrap: HTMLElement) => {
        const npc = NPC_DEFINITIONS[npcId];
        const reply = npc.replies.find((r: any) => r.label === key)!;
        const isMatch = key === 'major' && matchesMajor(store.getState().major, npcId);
        const state = store.getState();

        // Build deltas
        const deltas: any = { rapport: { [npcId]: reply.rapportDelta }, stats: {}, flagsGained: [], time: 12 };
        if ((reply as any).networkingDelta) deltas.stats.N = (reply as any).networkingDelta;
        if ((reply as any).auraDelta) deltas.stats.A = (reply as any).auraDelta;
        if ((reply as any).organisationDelta) deltas.stats.O = (reply as any).organisationDelta;
        if ((reply as any).skillsDelta) deltas.stats.S = (reply as any).skillsDelta;
        if (reply.flag) deltas.flagsGained.push(reply.flag);

        if (isMatch && reply.onMatch) {
            deltas.rapport[npcId] += reply.onMatch.rapportDelta ?? 0;
            if (reply.onMatch.networkingDelta) deltas.stats.N = (deltas.stats.N ?? 0) + reply.onMatch.networkingDelta;
            if (reply.onMatch.auraDelta) deltas.stats.A = (deltas.stats.A ?? 0) + reply.onMatch.auraDelta;
            if (reply.onMatch.organisationDelta) deltas.stats.O = (deltas.stats.O ?? 0) + reply.onMatch.organisationDelta;
            if (reply.onMatch.skillsDelta) deltas.stats.S = (deltas.stats.S ?? 0) + reply.onMatch.skillsDelta;
        }

        meetingState.activeDialogue = { npcId, stage: 'reacting', choiceKey: key, deltas, flavor: reply.flavor };
        persistState();

        // Show player's reply
        const playerBubble = document.createElement('div');
        playerBubble.className = 'meeting__bubble';
        const youLabel = document.createElement('span');
        youLabel.className = 'speaker';
        youLabel.textContent = 'You';
        const playerText = document.createElement('span');
        const playerLine = key === 'major' ? reply.line.replace('[player major]', state.major.charAt(0).toUpperCase() + state.major.slice(1)) : reply.line;
        playerBubble.appendChild(youLabel);
        playerBubble.appendChild(playerText);

        // Remove options, add player bubble
        dialogueLayer.removeChild(optionsWrap);
        dialogueLayer.appendChild(playerBubble);

        await typewriterEffect(playerText, playerLine, 25);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Show NPC reaction
        const reactionBubble = document.createElement('div');
        reactionBubble.className = 'meeting__bubble';
        reactionBubble.style.display = 'flex';
        reactionBubble.style.gap = '12px';
        reactionBubble.style.alignItems = 'flex-start';

        // Add portrait if sprite is loaded
        const img = imageCache.get(npcId);
        if (img && img.complete && img.naturalWidth > 0) {
            const portrait = document.createElement('img');
            portrait.src = img.src;
            portrait.style.cssText = `
                width: 64px;
                height: 64px;
                border-radius: 8px;
                object-fit: cover;
                border: 2px solid #6ee7b7;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            reactionBubble.appendChild(portrait);
        }

        // Text content wrapper
        const textWrap = document.createElement('div');
        textWrap.style.flex = '1';
        textWrap.style.minWidth = '0';

        const npcLabel = document.createElement('span');
        npcLabel.className = 'speaker';
        npcLabel.textContent = npc.name;
        const reactionText = document.createElement('span');

        textWrap.appendChild(npcLabel);
        textWrap.appendChild(reactionText);
        reactionBubble.appendChild(textWrap);
        dialogueLayer.appendChild(reactionBubble);

        await typewriterEffect(reactionText, reply.flavor || 'You chat briefly.', 25);

        // Apply deltas
        let next = applyDeltas(state, deltas);
        next = logActivity(next, {
            segment: 'group-meeting',
            choiceId: `${npcId}-${key}${isMatch ? '-match' : ''}`,
            summary: `${npc.name}: ${reply.flavor}`,
            deltas,
        });

        // Mark NPC as talked BEFORE updating store (to avoid re-render issues)
        const npcState = meetingState.npcs.find(n => n.npcId === npcId)!;
        npcState.talked = true;
        meetingState.talkedCount++;
        meetingState.activeDialogue = null;

        // Check if finished and set BEFORE store update to ensure re-render sees it
        if (meetingState.talkedCount >= 5) {
            meetingState.finished = true;
        }
        persistState();

        // Now update store (this may trigger re-render but state is already saved)
        store.setState(next);

        // Clear after a moment
        await new Promise(resolve => setTimeout(resolve, 1500));
        clearDialogue();

        // Show reveal if all done
        if (meetingState.talkedCount >= 5) {
            showReveal();
        } else {
            status.textContent = `Talked to ${meetingState.talkedCount}/5 teammates`;
        }
    };

    const showReveal = () => {
        clearDialogue();
        const reveal = document.createElement('div');
        reveal.className = 'meeting__bubble';
        reveal.innerHTML = `<span class="speaker">Facilitator</span>Assignment Topic: <em>Digital Privacy vs. Convenience — Okta Verify Debate</em>. Notes updated. You'll explore your phone later this evening.`;
        dialogueLayer.appendChild(reveal);
        nextBtn.disabled = false;
        hint.textContent = 'All teammates met!';
        status.textContent = 'Assignment revealed';
    };

    nextBtn.onclick = () => {
        if (meetingState.finished) {
            // Cleanup before transitioning
            if (animFrame) cancelAnimationFrame(animFrame);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            delete (window as any).__gm_state;
            delete (window as any).__gm_cleanup;
            store.setState((prev) => transitionScene(prev, 'evening-commute'));
        }
    };

    // Game loop
    let animFrame: number;
    const loop = () => {
        // Update player position
        if (!meetingState.activeDialogue) {
            const speed = 2;
            let dx = 0, dy = 0;
            if (keys.has('w') || keys.has('arrowup')) dy -= speed;
            if (keys.has('s') || keys.has('arrowdown')) dy += speed;
            if (keys.has('a') || keys.has('arrowleft')) dx -= speed;
            if (keys.has('d') || keys.has('arrowright')) dx += speed;

            const newX = meetingState.playerX + dx;
            const newY = meetingState.playerY + dy;
            if (isWalkable(newX, newY)) {
                meetingState.playerX = newX;
                meetingState.playerY = newY;
                persistState();
            }

            // Update status with nearest NPC
            let nearestNpc: NpcState | null = null;
            let nearestDist = 50;
            for (const npc of meetingState.npcs) {
                if (npc.talked) continue;
                const dx = meetingState.playerX - npc.x;
                const dy = meetingState.playerY - npc.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestNpc = npc;
                }
            }
            if (nearestNpc) {
                status.textContent = `Near ${NPC_DEFINITIONS[nearestNpc.npcId].name} — Press E to talk`;
            } else if (meetingState.talkedCount < 5) {
                status.textContent = `Talked to ${meetingState.talkedCount}/5 teammates`;
            }
        }

        // Render with enhanced visuals
        // Background gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#1e293b');
        bgGradient.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Floor pattern with depth
        for (let x = 0; x < canvas.width; x += 16) {
            for (let y = 0; y < canvas.height; y += 16) {
                if ((x / 16 + y / 16) % 2 === 0) {
                    ctx.fillStyle = '#2a3347';
                } else {
                    ctx.fillStyle = '#1e293b';
                }
                ctx.fillRect(x, y, 16, 16);
            }
        }

        // Add floor grid lines for depth
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Whiteboard at top with shadow and 3D effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Whiteboard frame
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(155, 15, 330, 60);

        // Whiteboard surface
        const boardGradient = ctx.createLinearGradient(160, 20, 160, 70);
        boardGradient.addColorStop(0, '#f8fafc');
        boardGradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = boardGradient;
        ctx.fillRect(160, 20, 320, 50);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.strokeRect(160, 20, 320, 50);

        if (meetingState.finished) {
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Assignment: Digital Privacy vs Convenience', 320, 47);
            ctx.font = '10px sans-serif';
            ctx.fillStyle = '#475569';
            ctx.fillText('Due: Day 7, 11:59 PM', 320, 60);
        }

        // Table with 3D shadow and wood texture
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;

        // Table top gradient
        const tableGradient = ctx.createLinearGradient(200, 140, 200, 220);
        tableGradient.addColorStop(0, '#6b4423');
        tableGradient.addColorStop(0.5, '#5f4b32');
        tableGradient.addColorStop(1, '#4a3824');
        ctx.fillStyle = tableGradient;
        ctx.fillRect(200, 140, 240, 80);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Table border/edge
        ctx.strokeStyle = '#3a2817';
        ctx.lineWidth = 5;
        ctx.strokeRect(200, 140, 240, 80);

        // Wood grain lines
        ctx.strokeStyle = 'rgba(58, 40, 23, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(210 + i * 55, 145);
            ctx.lineTo(210 + i * 55, 215);
            ctx.stroke();
        }

        // NPCs with sprites or fallback to circles
        meetingState.npcs.forEach(npc => {
            const talked = npc.talked;
            const img = imageCache.get(npc.npcId);
            const maxSpriteSize = 48; // Maximum display size for sprites

            if (img && img.complete && img.naturalWidth > 0) {
                // RENDER SPRITE with original aspect ratio
                ctx.save();

                // Calculate dimensions maintaining aspect ratio
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                let drawWidth, drawHeight;

                if (aspectRatio > 1) {
                    // Wider than tall
                    drawWidth = maxSpriteSize;
                    drawHeight = maxSpriteSize / aspectRatio;
                } else {
                    // Taller than wide or square
                    drawHeight = maxSpriteSize;
                    drawWidth = maxSpriteSize * aspectRatio;
                }

                // Shadow
                ctx.shadowColor = talked ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = talked ? 8 : 15;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 4;

                // Glow for active NPCs
                if (!talked) {
                    ctx.shadowColor = 'rgba(14, 165, 233, 0.8)';
                    ctx.shadowBlur = 20;
                }

                // Draw sprite centered on NPC position with correct aspect ratio
                ctx.drawImage(img, npc.x - drawWidth / 2, npc.y - drawHeight / 2, drawWidth, drawHeight);

                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;

                // Gray overlay if already talked (maintains aspect ratio)
                if (talked) {
                    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
                    ctx.fillRect(npc.x - drawWidth / 2, npc.y - drawHeight / 2, drawWidth, drawHeight);
                }

                ctx.restore();
            } else {
                // FALLBACK: Render circle if sprite not loaded
                // Shadow
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 4;

                // Glow for active NPCs
                if (!talked) {
                    ctx.shadowColor = 'rgba(14, 165, 233, 0.6)';
                    ctx.shadowBlur = 15;
                }

                // Avatar gradient
                const avatarGradient = ctx.createRadialGradient(npc.x, npc.y - 2, 4, npc.x, npc.y, 16);
                if (talked) {
                    avatarGradient.addColorStop(0, '#94a3b8');
                    avatarGradient.addColorStop(1, '#64748b');
                } else {
                    avatarGradient.addColorStop(0, '#38bdf8');
                    avatarGradient.addColorStop(1, '#0284c7');
                }
                ctx.fillStyle = avatarGradient;
                ctx.beginPath();
                ctx.arc(npc.x, npc.y, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;

                // Border
                ctx.strokeStyle = talked ? '#e2e8f0' : '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Inner highlight
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(npc.x, npc.y - 3, 12, Math.PI * 1.2, Math.PI * 1.8);
                ctx.stroke();
            }

            // Label with shadow (for both sprite and circle)
            const def = NPC_DEFINITIONS[npc.npcId];
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 1;
            ctx.fillStyle = talked ? '#cbd5e1' : '#f1f5f9';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            const labelY = img && img.complete && img.naturalWidth > 0 ? npc.y + maxSpriteSize / 2 + 16 : npc.y + 32;
            ctx.fillText(def.name.split(' ')[0], npc.x, labelY);
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
        });

        // Player with glow and shadow
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Player gradient
        const playerGradient = ctx.createRadialGradient(
            meetingState.playerX,
            meetingState.playerY - 2,
            4,
            meetingState.playerX,
            meetingState.playerY,
            14
        );
        playerGradient.addColorStop(0, '#fbbf24');
        playerGradient.addColorStop(1, '#f59e0b');
        ctx.fillStyle = playerGradient;
        ctx.beginPath();
        ctx.arc(meetingState.playerX, meetingState.playerY, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(meetingState.playerX, meetingState.playerY - 3, 10, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();

        // YOU label with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', meetingState.playerX, meetingState.playerY + 4);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        animFrame = requestAnimationFrame(loop);
    };

    // Start or restore state
    if (meetingState.finished) {
        showReveal();
    }

    loop();

    // Store cleanup function globally so it can be called on re-render
    const cleanup = () => {
        if (animFrame) cancelAnimationFrame(animFrame);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
    };
    (window as any).__gm_cleanup = cleanup;
};
