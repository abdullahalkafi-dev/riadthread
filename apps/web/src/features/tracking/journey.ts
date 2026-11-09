import { LIMITS } from '@riad/shared';

/**
 * The visitor's path through the site, kept in memory for this tab only and
 * recorded only while they have accepted tracking. The enquiry form attaches a
 * snapshot so the owner can see what a lead looked at before writing in.
 */
export interface JourneyStep {
  /** Short label, e.g. "Home" or a product name. */
  t: string;
  /** Detail, e.g. "2m 10s, watched video". */
  m: string;
  k?: 'start' | 'end';
  at: number;
}

let enabled = false;
let steps: JourneyStep[] = [];
let enteredAt = 0;
const notes: string[] = [];

export function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/** Joins the time spent with any notes made while on the step, e.g. "2m 10s, watched video". */
function detail(ms: number, extra: string[]): string {
  return [formatDuration(ms), ...extra].join(', ').slice(0, 160);
}

function closeCurrent(now: number) {
  const last = steps[steps.length - 1];
  if (!last) return;
  last.m = detail(now - enteredAt, notes);
  notes.length = 0;
}

export const journey = {
  /** Turning it off also forgets everything recorded so far. */
  setEnabled(value: boolean) {
    enabled = value;
    if (!value) {
      steps = [];
      notes.length = 0;
    }
  },

  /** Starts a new step, finishing the previous one with the time spent on it. */
  enter(label: string) {
    if (!enabled) return;
    const now = Date.now();
    closeCurrent(now);
    steps.push({ t: label.slice(0, 120), m: '', at: now, ...(steps.length === 0 ? { k: 'start' as const } : {}) });
    enteredAt = now;
  },

  /** Renames the current step, used once a page knows its real title (e.g. a product name). */
  relabel(label: string) {
    const last = steps[steps.length - 1];
    if (enabled && last) last.t = label.slice(0, 120);
  },

  /** Adds a short remark to the current step, e.g. "watched video". */
  note(text: string) {
    if (enabled && !notes.includes(text)) notes.push(text);
  },

  /** A copy that is safe to send: at most 30 steps, the last one closed with its time so far. */
  snapshot(): JourneyStep[] {
    if (!enabled || steps.length === 0) return [];
    const now = Date.now();
    const copy = steps.map((s) => ({ ...s }));
    const last = copy[copy.length - 1]!;
    last.m = detail(now - enteredAt, notes);
    last.k = 'end';
    const max = LIMITS.journeySteps;
    // Keep where the visit started and the most recent steps.
    return copy.length <= max ? copy : [copy[0]!, ...copy.slice(-(max - 1))];
  },
};
