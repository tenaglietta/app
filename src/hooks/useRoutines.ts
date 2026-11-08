import { useEffect, useState } from 'react';
import type { Routine } from '@/types/workout';
import { uid } from '@/types/workout';

const KEY = 'fitroutine.routines.v1';

const SAMPLE: Routine[] = [
  {
    id: uid(),
    name: 'Total Body 20 min',
    style: 'classic',
    rounds: 3,
    roundRestSec: 60,
    createdAt: Date.now(),
    exercises: [
      { id: uid(), name: 'Jumping jack', mode: 'time', durationSec: 40, reps: 0, sets: 3, restSec: 20 },
      { id: uid(), name: 'Squat', mode: 'reps', durationSec: 0, reps: 15, sets: 3, restSec: 30 },
      { id: uid(), name: 'Plank', mode: 'time', durationSec: 45, reps: 0, sets: 3, restSec: 30 },
    ],
  },
];

function load(): Routine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Array<Partial<Routine>>;
      // migrazione: routine salvate prima dell'introduzione di style/rounds
      return parsed.map((r) => ({
        style: 'classic',
        rounds: 3,
        roundRestSec: 60,
        ...r,
      })) as Routine[];
    }
  } catch {
    /* ignore */
  }
  return SAMPLE;
}

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(routines));
  }, [routines]);

  return { routines, setRoutines };
}

let sharedCtx: AudioContext | null = null;

const VOL_KEY = 'fitroutine.volume.v1';

export function getVolume(): number {
  const v = Number(localStorage.getItem(VOL_KEY));
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.9;
}

export function setVolume(v: number) {
  localStorage.setItem(VOL_KEY, String(Math.min(1, Math.max(0, v))));
}

function getCtx(): AudioContext | null {
  try {
    if (!sharedCtx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      sharedCtx = new Ctx();
    }
    if (sharedCtx.state === 'suspended') void sharedCtx.resume();
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Da chiamare su un gesto dell'utente per sbloccare l'audio (autoplay policy) */
export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.02);
}

/** Bip sonoro via WebAudio (nessun file esterno) */
export function beep(freq = 880, durationMs = 180, delay = 0) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const vol = Math.max(0.001, getVolume() * 0.9);
    osc.frequency.value = freq;
    osc.type = 'square'; // timbro più udibile sui piccoli altoparlanti
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + durationMs / 1000 + 0.05);
  } catch {
    /* audio non disponibile */
  }
}

/** Sequenza ben udibile per la fine di un esercizio/pausa */
export function endSound() {
  beep(988, 200, 0);
  beep(988, 200, 0.25);
  beep(1319, 450, 0.5);
}
