import { useState } from 'react';
import type { Exercise, Routine } from '@/types/workout';
import { uid } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowDown, ArrowUp, Play, Plus, Timer, Repeat, Trash2 } from 'lucide-react';
import { ShareRoutine } from '@/sections/ShareRoutine';
import { unlockAudio } from '@/hooks/useRoutines';

interface Props {
  routine: Routine;
  onSave: (r: Routine) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onPlay: (id: string) => void;
}

function newExercise(): Exercise {
  return { id: uid(), name: '', mode: 'time', durationSec: 30, reps: 10, sets: 3, restSec: 30 };
}

export function RoutineEditor({ routine, onSave, onDelete, onBack, onPlay }: Props) {
  const [r, setR] = useState<Routine>(routine);

  const update = (patch: Partial<Routine>) => {
    const next = { ...r, ...patch };
    setR(next);
    onSave(next);
  };

  const updateExercise = (id: string, patch: Partial<Exercise>) =>
    update({ exercises: r.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  const move = (index: number, dir: -1 | 1) => {
    const arr = [...r.exercises];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    update({ exercises: arr });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="min-h-11 min-w-11" aria-label="Indietro">
          <ArrowLeft size={20} />
        </Button>
        <Input
          value={r.name}
          onChange={(e) => update({ name: e.target.value })}
          className="h-11 border-transparent bg-transparent text-xl font-bold hover:border-stone-200 focus:bg-white"
          placeholder="Nome della routine"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Struttura</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={r.style === 'classic' ? 'default' : 'outline'}
            onClick={() => update({ style: 'classic' })}
            className={`min-h-11 ${r.style === 'classic' ? 'bg-stone-800 hover:bg-stone-900' : ''}`}
          >
            Serie a stazioni
          </Button>
          <Button
            variant={r.style === 'circuit' ? 'default' : 'outline'}
            onClick={() => update({ style: 'circuit' })}
            className={`min-h-11 ${r.style === 'circuit' ? 'bg-stone-800 hover:bg-stone-900' : ''}`}
          >
            Circuito
          </Button>
        </div>
        <p className="text-xs text-stone-500">
          {r.style === 'classic'
            ? 'Completa tutte le serie di un esercizio, poi passa al successivo (A-A-A, B-B-B…).'
            : 'Esegui gli esercizi in sequenza e ripeti il giro più volte (A-B-C, A-B-C…).'}
        </p>
      </div>

      <div className="space-y-3">
        {r.exercises.map((e, i) => (
          <Card key={e.id}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-500">
                  {i + 1}
                </span>
                <Input
                  value={e.name}
                  onChange={(ev) => updateExercise(e.id, { name: ev.target.value })}
                  placeholder="Nome esercizio (es. Piegamenti)"
                  className="h-11 font-medium"
                />
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} className="min-h-11 min-w-11" aria-label="Sposta su">
                    <ArrowUp size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === r.exercises.length - 1} className="min-h-11 min-w-11" aria-label="Sposta giù">
                    <ArrowDown size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => update({ exercises: r.exercises.filter((x) => x.id !== e.id) })}
                    className="min-h-11 min-w-11 text-red-500 hover:text-red-600"
                    aria-label="Elimina esercizio"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={e.mode === 'time' ? 'default' : 'outline'}
                  onClick={() => updateExercise(e.id, { mode: 'time' })}
                  className={`min-h-11 ${e.mode === 'time' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                >
                  <Timer className="mr-1" size={16} /> A tempo
                </Button>
                <Button
                  variant={e.mode === 'reps' ? 'default' : 'outline'}
                  onClick={() => updateExercise(e.id, { mode: 'reps' })}
                  className={`min-h-11 ${e.mode === 'reps' ? 'bg-sky-600 hover:bg-sky-700' : ''}`}
                >
                  <Repeat className="mr-1" size={16} /> A ripetizioni
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {e.mode === 'time' ? (
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-500">Durata (sec)</Label>
                    <Input
                      type="number" min={5} inputMode="numeric"
                      value={e.durationSec}
                      onChange={(ev) => updateExercise(e.id, { durationSec: Math.max(5, Number(ev.target.value) || 5) })}
                      className="h-11"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-500">Ripetizioni</Label>
                    <Input
                      type="number" min={1} inputMode="numeric"
                      value={e.reps}
                      onChange={(ev) => updateExercise(e.id, { reps: Math.max(1, Number(ev.target.value) || 1) })}
                      className="h-11"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs text-stone-500">
                    {r.style === 'circuit' ? 'Serie/giri' : 'Serie'}
                  </Label>
                  <Input
                    type="number" min={1} inputMode="numeric"
                    value={r.style === 'circuit' ? r.rounds : e.sets}
                    onChange={(ev) => {
                      const v = Math.max(1, Number(ev.target.value) || 1);
                      if (r.style === 'circuit') update({ rounds: v });
                      else updateExercise(e.id, { sets: v });
                    }}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-500">Pausa (sec)</Label>
                  <Input
                    type="number" min={0} inputMode="numeric"
                    value={e.restSec}
                    onChange={(ev) => updateExercise(e.id, { restSec: Math.max(0, Number(ev.target.value) || 0) })}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => update({ exercises: [...r.exercises, newExercise()] })}
        className="min-h-12 w-full border-dashed"
      >
        <Plus className="mr-1" size={18} /> Aggiungi esercizio
      </Button>

      {r.style === 'circuit' && (
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-stone-100 p-4">
          <div className="space-y-1">
            <Label className="text-xs text-stone-500">Numero di giri</Label>
            <Input
              type="number" min={1} inputMode="numeric"
              value={r.rounds}
              onChange={(ev) => update({ rounds: Math.max(1, Number(ev.target.value) || 1) })}
              className="h-11 bg-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-stone-500">Pausa tra i giri (sec)</Label>
            <Input
              type="number" min={0} inputMode="numeric"
              value={r.roundRestSec}
              onChange={(ev) => update({ roundRestSec: Math.max(0, Number(ev.target.value) || 0) })}
              className="h-11 bg-white"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          onClick={() => { unlockAudio(); onPlay(r.id); }}
          disabled={r.exercises.length === 0}
          className="min-h-12 flex-1 bg-emerald-600 text-base hover:bg-emerald-700"
        >
          <Play className="mr-2" size={18} /> Avvia allenamento
        </Button>
        <ShareRoutine routine={r} />
        <Button
          variant="outline"
          onClick={() => onDelete(r.id)}
          className="min-h-12 text-red-500 hover:text-red-600"
          aria-label="Elimina routine"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}
