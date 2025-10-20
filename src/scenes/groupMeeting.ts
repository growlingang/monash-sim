import type { GameStore } from '../core/store';
import { createStatsBar } from '../ui/statsBar';
import { NPC_DEFINITIONS } from '../data/npcs';
import type { MajorId, NpcId } from '../core/types';
import { applyDeltas, logActivity, transitionScene } from '../core/gameState';

type ChoiceKey = 'friendly' | 'dismissive' | 'major';

const npcOrder: NpcId[] = ['bonsen', 'zahir', 'jiun', 'anika', 'jiawen'];

const matchesMajor = (playerMajor: MajorId, npcId: NpcId) => {
    const def = NPC_DEFINITIONS[npcId];
    return def.majorAffinity === playerMajor;
};

export const renderGroupMeeting = async (root: HTMLElement, store: GameStore) => {
    root.innerHTML = '';

    const container = document.createElement('div');
    container.style.cssText = 'display:flex; flex-direction:column; gap:12px; padding:16px; max-width:900px; margin:0 auto;';

    const header = document.createElement('div');
    header.innerHTML = `
    <h2>LTB Group Room</h2>
    <p>Meet your teammates. Pick your response to set the tone.</p>
  `;

    const statsBar = createStatsBar(store.getState());

    const stage = document.createElement('div');
    stage.style.cssText = 'background:#1a1a1a; color:#eee; border:1px solid #333; border-radius:8px; padding:16px; min-height:220px;';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Continue';
    nextBtn.style.cssText = 'align-self:flex-end; padding:10px 16px; border:none; border-radius:6px; background:#4ac94a; color:#000; font-weight:bold; cursor:pointer;';
    nextBtn.disabled = true;

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(stage);
    container.appendChild(nextBtn);
    root.appendChild(container);

    // Restore transient meeting state across store-driven re-mounts
    const saved = (window as any).__gm_state as { idx: number; pending?: any; finished?: boolean } | undefined;
    let idx = saved?.idx ?? 0;
    let pending: null | {
        npcId: NpcId;
        key: ChoiceKey;
        isMatch: boolean;
        deltas: any;
        flavor: string;
    } = saved?.pending ?? null;
    let finished = saved?.finished ?? false;

    const renderNpc = () => {
        const npcId = npcOrder[idx];
        const npc = NPC_DEFINITIONS[npcId];
        const state = store.getState();

        stage.innerHTML = '';
        nextBtn.disabled = true;

        const title = document.createElement('h3');
        title.textContent = npc.name;

        const greeting = document.createElement('p');
        greeting.style.cssText = 'font-style: italic; color:#cbd5e1;';
        greeting.textContent = `"${npc.greeting}"`;

        // If we have a pending choice for this NPC, show the result and enable Continue
        if (pending && pending.npcId === npcId) {
            const result = document.createElement('div');
            result.style.cssText = 'margin-top:12px; padding:12px; border:1px solid #2f4f2f; background:#0f2f0f; color:#c7f9cc; border-radius:8px;';
            result.textContent = pending.flavor || 'Your response is noted.';
            stage.appendChild(title);
            stage.appendChild(greeting);
            stage.appendChild(result);
            nextBtn.disabled = false;
            return;
        }

        const options = document.createElement('div');
        options.style.cssText = 'display:grid; gap:12px; margin-top:12px;';

        const buildButton = (key: ChoiceKey, label: string, color: string) => {
            const btn = document.createElement('button');
            btn.style.cssText = `padding:12px; text-align:left; border:1px solid #333; border-radius:8px; background:${color}; color:#fff; cursor:pointer;`;
            btn.textContent = label;
            btn.onclick = () => handleChoice(npcId, key);
            return btn;
        };

        const rFriendly = npc.replies.find(r => r.label === 'friendly');
        const rDismissive = npc.replies.find(r => r.label === 'dismissive');
        const rMajor = npc.replies.find(r => r.label === 'major');

        if (rFriendly) options.appendChild(buildButton('friendly', rFriendly.line, '#334155'));
        if (rDismissive) options.appendChild(buildButton('dismissive', rDismissive.line, '#3f1d1d'));
        if (rMajor) {
            const line = rMajor.line.replace('[player major]', state.major.charAt(0).toUpperCase() + state.major.slice(1));
            const btn = buildButton('major', line, '#3b3a22');
            options.appendChild(btn);
        }

        stage.appendChild(title);
        stage.appendChild(greeting);
        stage.appendChild(options);
    };

    const handleChoice = (npcId: NpcId, key: ChoiceKey) => {
        const npc = NPC_DEFINITIONS[npcId];
        const reply = npc.replies.find(r => r.label === key)!;
        const isMatch = key === 'major' && matchesMajor(store.getState().major, npcId);

        // Build deltas according to Day 1 brief semantics
        const deltas: any = { rapport: { [npcId]: reply.rapportDelta }, stats: {}, flagsGained: [], time: 12 }; // ~60 mins across 5 NPCs

        if ((reply as any).networkingDelta) deltas.stats.N = ((reply as any).networkingDelta);
        if ((reply as any).auraDelta) deltas.stats.A = ((reply as any).auraDelta);
        if ((reply as any).organisationDelta) deltas.stats.O = ((reply as any).organisationDelta);
        if ((reply as any).skillsDelta) deltas.stats.S = ((reply as any).skillsDelta);
        if (reply.flag) deltas.flagsGained.push(reply.flag);

        if (isMatch && reply.onMatch) {
            deltas.rapport[npcId] += reply.onMatch.rapportDelta ?? 0;
            if (reply.onMatch.networkingDelta) deltas.stats.N = (deltas.stats.N ?? 0) + reply.onMatch.networkingDelta;
            if (reply.onMatch.auraDelta) deltas.stats.A = (deltas.stats.A ?? 0) + reply.onMatch.auraDelta;
            if (reply.onMatch.organisationDelta) deltas.stats.O = (deltas.stats.O ?? 0) + reply.onMatch.organisationDelta;
            if (reply.onMatch.skillsDelta) deltas.stats.S = (deltas.stats.S ?? 0) + reply.onMatch.skillsDelta;
        }

        // Do not update store yet (to avoid scene remount resetting idx).
        // Show result and enable Continue; persist pending state.
        pending = { npcId, key, isMatch, deltas, flavor: reply.flavor || 'You chat briefly.' };
        (window as any).__gm_state = { idx, pending, finished };
        renderNpc();
    };

    // If we already finished (e.g., remount), show reveal and enable Continue to move on
    const renderReveal = () => {
        stage.innerHTML = `
                <h3>Assignment Reveal</h3>
                <p>Topic: <strong>Digital Privacy vs. Convenience — Okta Verify Debate</strong></p>
                <p>Notes updated. You'll get a phone tutorial next in the evening flow.</p>
            `;
        nextBtn.disabled = false;
    };

    nextBtn.onclick = () => {
        // If a choice is pending, commit its deltas now
        if (pending) {
            const npc = NPC_DEFINITIONS[pending.npcId];
            const state = store.getState();
            let next = applyDeltas(state, pending.deltas);
            next = logActivity(next, {
                segment: 'group-meeting',
                choiceId: `${pending.npcId}-${pending.key}${pending.isMatch ? '-match' : ''}`,
                summary: `${npc.name}: ${pending.flavor}`,
                deltas: pending.deltas,
            });

            // Clear pending and progress
            pending = null;

            // If more NPCs remain, advance index and persist; then update store (will remount)
            if (idx < npcOrder.length - 1) {
                idx += 1;
                (window as any).__gm_state = { idx, pending: null, finished };
                store.setState(next);
                return;
            }

            // Final NPC: show reveal, mark finished, but apply deltas before showing
            finished = true;
            (window as any).__gm_state = { idx: idx + 1, pending: null, finished };
            // Update store to reflect stat changes, but keep scene; then show reveal
            store.setState(next);
            renderReveal();
            return;
        }

        // If finished, proceed to next scene
        if (finished) {
            delete (window as any).__gm_state;
            store.setState((prev) => transitionScene(prev, 'evening-commute'));
            return;
        }
    };

    if (finished) {
        renderReveal();
    } else {
        renderNpc();
    }
};
