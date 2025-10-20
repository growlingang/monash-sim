import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { NPC_DEFINITIONS } from '../data/npcs';
import type { MajorId, NpcId } from '../core/types';
import { applyDeltas, logActivity, transitionScene } from '../core/gameState';

type ChoiceKey = 'friendly' | 'dismissive' | 'major';

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

    // Prevent multiple instances - cleanup any existing state
    if ((window as any).__gm_cleanup) {
        (window as any).__gm_cleanup();
        delete (window as any).__gm_cleanup;
    }

    // Lightweight styling
    if (!document.head.querySelector('style[data-meeting-room]')) {
        const style = document.createElement('style');
        style.setAttribute('data-meeting-room', 'true');
        style.textContent = `
            .meeting__wrap { display:flex; flex-direction:column; gap:12px; padding:16px; max-width:980px; margin:0 auto; }
            .meeting__header h2 { margin: 0 0 4px; }
            .meeting__canvasWrap { position:relative; width:100%; aspect-ratio: 16 / 9; background: #1a1a1a; border:1px solid #334155; border-radius:10px; overflow:hidden; }
            .meeting__canvas { display:block; width:100%; height:100%; image-rendering: pixelated; }
            .meeting__dialogue { position:absolute; left:50%; bottom:12px; transform:translateX(-50%); width:92%; max-width:860px; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
            .meeting__bubble { position:relative; padding:12px 14px; background: rgba(17,24,39,0.95); border:1px solid #334155; border-radius:10px; color:#e5e7eb; box-shadow:0 6px 18px rgba(0,0,0,0.4); font-size:14px; pointer-events:auto; }
            .meeting__bubble .speaker { display:block; font-weight:800; color:#a7f3d0; margin-bottom:4px; letter-spacing:0.3px; }
            .meeting__options { display:grid; gap:10px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top:4px; }
            .meeting__optionBtn { padding:10px 12px; border:1px solid #334155; border-radius:8px; background:#0b1220; color:#e2e8f0; cursor:pointer; transition: transform 0.04s ease, background 0.2s ease, border-color 0.2s ease; text-align:left; }
            .meeting__optionBtn:hover { background:#101a30; border-color:#475569; transform: translateY(-1px); }
            .meeting__status { position:absolute; top:12px; left:50%; transform:translateX(-50%); background: rgba(17,24,39,0.9); border:1px solid #334155; border-radius:8px; padding:6px 12px; color:#cbd5e1; font-size:13px; white-space:nowrap; }
            .meeting__controls { display:flex; justify-content:space-between; gap:8px; margin-top:12px; }
            .meeting__hint { color:#94a3b8; font-size:13px; }
            .meeting__next { padding:10px 16px; border:none; border-radius:8px; background:#22c55e; color:#052e16; font-weight:800; cursor:pointer; opacity:1; }
            .meeting__next[disabled] { opacity:0.5; cursor:default; }
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
        const speakerSpan = document.createElement('span');
        speakerSpan.className = 'speaker';
        speakerSpan.textContent = npc.name;
        const textSpan = document.createElement('span');
        bubble.appendChild(speakerSpan);
        bubble.appendChild(textSpan);
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
        const npcLabel = document.createElement('span');
        npcLabel.className = 'speaker';
        npcLabel.textContent = npc.name;
        const reactionText = document.createElement('span');
        reactionBubble.appendChild(npcLabel);
        reactionBubble.appendChild(reactionText);
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

        // Render
        ctx.fillStyle = '#1a2233';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Floor pattern
        ctx.fillStyle = '#2a3347';
        for (let x = 0; x < canvas.width; x += 16) {
            for (let y = 0; y < canvas.height; y += 16) {
                if ((x / 16 + y / 16) % 2 === 0) {
                    ctx.fillRect(x, y, 16, 16);
                }
            }
        }

        // Whiteboard at top
        ctx.fillStyle = '#e5eef6';
        ctx.fillRect(160, 20, 320, 50);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.strokeRect(160, 20, 320, 50);
        if (meetingState.finished) {
            ctx.fillStyle = '#0f172a';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Assignment: Digital Privacy vs Convenience', 320, 50);
        }

        // Table (central rectangle)
        ctx.fillStyle = '#5f4b32';
        ctx.fillRect(200, 140, 240, 80);
        ctx.strokeStyle = '#312417';
        ctx.lineWidth = 4;
        ctx.strokeRect(200, 140, 240, 80);

        // NPCs
        meetingState.npcs.forEach(npc => {
            ctx.fillStyle = npc.talked ? '#6b7280' : '#0ea5e9';
            ctx.beginPath();
            ctx.arc(npc.x, npc.y, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            const def = NPC_DEFINITIONS[npc.npcId];
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(def.name.split(' ')[0], npc.x, npc.y + 30);
        });

        // Player
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(meetingState.playerX, meetingState.playerY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', meetingState.playerX, meetingState.playerY + 4);

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
