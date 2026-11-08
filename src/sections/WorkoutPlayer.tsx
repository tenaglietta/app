import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise, Routine } from '@/types/workout';
import { formatTime } from '@/types/workout';
import { beep, endSound, unlockAudio } from '@/hooks/useRoutines';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pause, Play, SkipForward, X, CheckCircle2, Coffee, ChevronLeft, ChevronRight, PartyPopper, RotateCcw } from 'lucide-react';
import { VolumeControl } from '@/sections/VolumeControl';

interface Props {
  routine: Routine;
  onExit: () => void;
}

type Step =
  | { phase: 'work'; exercise: Exercise; set: number; setLabel: string }
  | { phase: 'rest'; after: Exercise; set: number; setLabel: string; duration: number; nextName: string };

function buildSteps(r: Routine): Step[] {
  const steps: Step[] = [];
  if (r.style === 'circuit') {
    for (let round = 1; round <= r.rounds; round++) {
      r.exercises.forEach((e, ei) => {
        steps.push({ phase: 'work', exercise: e, set: round, setLabel: `Giro ${round} di ${r.rounds}` });
        const isLastExercise = ei === r.exercises.length - 1;
        const isLastRound = round === r.rounds;
        if (!isLastExercise && e.restSec > 0) {
          steps.push({ phase: 'rest', after: e, set: round, setLabel: `Giro ${round} di ${r.rounds}`, duration: e.restSec, nextName: r.exercises[ei + 1].name });
        }
        if (isLastExercise && !isLastRound && r.roundRestSec > 0) {
          steps.push({ phase: 'rest', after: e, set: round, setLabel: `Fine giro ${round} di ${r.rounds}`, duration: r.roundRestSec, nextName: `${r.exercises[0].name} (giro ${round + 1})` });
        }
      });
    }
  } else {
    r.exercises.forEach((e, ei) => {
      for (let s = 1; s <= e.sets; s++) {
        steps.push({ phase: 'work', exercise: e, set: s, setLabel: `Serie ${s} di ${e.sets}` });
        const isLast = ei === r.exercises.length - 1 && s === e.sets;
        if (!isLast && e.restSec > 0) {
          const nextName = s < e.sets ? `${e.name} (serie ${s + 1})` : r.exercises[ei + 1].name;
          steps.push({ phase: 'rest', after: e, set: s, setLabel: `Dopo serie ${s} di ${e.sets}`, duration: e.restSec, nextName });
        }
      }
    });
  }
  return steps;
}

export function WorkoutPlayer({ routine, onExit }: Props) {
  const steps = useMemo(() => buildSteps(routine), [routine]);
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const step = steps[idx];
  
  function exerciseOf(s: Step): Exercise {
    return s.phase === 'work' ? s.exercise : s.after;
  }
  
  const isTimed = step.phase === 'rest' || exerciseOf(step).mode === 'time';
  const stepDuration = step.phase === 'rest' ? step.duration : step.exercise.durationSec;
  const [secondsLeft, setSecondsLeft] = useState(stepDuration);
  const prevSecRef = useRef(secondsLeft);

  // reset timer quando cambia step
  useEffect(() => {
    const s = steps[idx];
    setSecondsLeft(s.phase === 'rest' ? s.duration : s.exercise.durationSec);
    setRunning(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // countdown
  useEffect(() => {
    if (!running || done || !started || !isTimed) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [running, done, started, isTimed, idx]);

  // bip negli ultimi 3 secondi + suono di fine + avanzamento
  useEffect(() => {
    if (secondsLeft !== prevSecRef.current) {
      prevSecRef.current = secondsLeft;
      if (secondsLeft > 0 && secondsLeft <= 3) beep(660, 130);
    }
    if (isTimed && secondsLeft === 0 && !done && started) {
      endSound();
      next();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const next = () => {
    if (idx >= steps.length - 1) {
      setDone(true);
      endSound();
    } else {
      setIdx((i) => i + 1);
    }
  };

  const prev = () => {
    if (idx > 0) setIdx((i) => i - 1);
  };

  const start = () => {
    unlockAudio();
    beep(880, 150);
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Play size={44} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{routine.name}</h1>
          <p className="mt-2 text-stone-500">
            {routine.style === 'circuit'
              ? `Circuito: ${routine.exercises.length} esercizi × ${routine.rounds} giri`
              : `${routine.exercises.length} esercizi a serie`}
            {' · '}{steps.filter((s) => s.phase === 'work').length} blocchi di lavoro
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button onClick={start} className="min-h-12 bg-emerald-600 text-base hover:bg-emerald-700">
            <Play className="mr-2" size={18} /> Inizia (attiva l'audio)
          </Button>
          <Button variant="outline" onClick={onExit} className="min-h-12">Torna alle routine</Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <PartyPopper size={44} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Allenamento completato!</h1>
          <p className="mt-2 text-stone-500">Ottimo lavoro: hai finito «{routine.name}».</p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Button onClick={() => { setIdx(0); setDone(false); }} className="min-h-12 bg-emerald-600 hover:bg-emerald-700">
            <RotateCcw className="mr-2" size={18} /> Ricomincia
          </Button>
          <Button variant="outline" onClick={onExit} className="min-h-12">Torna alle routine</Button>
        </div>
      </div>
    );
  }

  const ex = exerciseOf(step);
  const progress = (idx / steps.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onExit} className="min-h-11 min-w-11" aria-label="Esci">
          <X size={20} />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-500">
            {routine.name}
            {routine.style === 'circuit' && ' · circuito'}
          </p>
          <Progress value={progress} className="mt-1 h-2" />
        </div>
        <span className="shrink-0 text-xs text-stone-400">{idx + 1}/{steps.length}</span>
      </div>

      <div className="flex flex-col items-center gap-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        {step.phase === 'rest' ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-700">
            <Coffee size={16} /> Pausa
          </span>
        ) : (
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
            ex.mode === 'time' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
          }`}>
            {ex.mode === 'time' ? 'A tempo' : 'A ripetizioni'}
          </span>
        )}

        <h2 className="text-center text-3xl font-bold tracking-tight">
          {step.phase === 'rest' ? 'Recupera' : ex.name}
        </h2>
        <p className="text-center text-3xl font-bold tracking-tight">
          {step.phase === 'rest' ? `Prossimo: ${step.nextName}` : step.setLabel}
        </p>

        {isTimed ? (
          <div className="relative flex h-52 w-52 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" strokeWidth="6" className="stroke-stone-200" />
              <circle
                cx="50" cy="50" r="46" fill="none" strokeWidth="6" strokeLinecap="round"
                className={step.phase === 'rest' ? 'stroke-amber-500' : 'stroke-emerald-600'}
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - (stepDuration > 0 ? secondsLeft / stepDuration : 0))}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="text-6xl font-bold tabular-nums">{formatTime(secondsLeft)}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="text-7xl font-bold tabular-nums text-sky-600">{ex.reps}</span>
            <span className="text-stone-500">ripetizioni</span>
          </div>
        )}

        <div className="flex w-full gap-2">
          <Button variant="outline" onClick={prev} disabled={idx === 0} className="min-h-14 flex-1" aria-label="Precedente">
            <ChevronLeft size={20} />
          </Button>
          {isTimed ? (
            <Button
              onClick={() => setRunning((r) => !r)}
              className="min-h-14 flex-[2] bg-emerald-600 text-lg hover:bg-emerald-700"
            >
              {running ? <><Pause className="mr-2" size={20} /> Pausa</> : <><Play className="mr-2" size={20} /> Riprendi</>}
            </Button>
          ) : (
            <Button onClick={next} className="min-h-14 flex-[2] bg-sky-600 text-lg hover:bg-sky-700">
              <CheckCircle2 className="mr-2" size={20} /> Serie fatta
            </Button>
          )}
          <Button variant="outline" onClick={next} className="min-h-14 flex-1" aria-label="Salta">
            {idx === steps.length - 1 ? <SkipForward size={20} /> : <ChevronRight size={20} />}
          </Button>
        </div>
      </div>
      <VolumeControl />
    </div>
  );
}
