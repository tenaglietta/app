import type { Routine } from '@/types/workout';
import { formatTime } from '@/types/workout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pencil, Plus, Timer, Repeat, RotateCw } from 'lucide-react';
import { ShareRoutine } from '@/sections/ShareRoutine';
import { VolumeControl } from '@/sections/VolumeControl';
import { unlockAudio } from '@/hooks/useRoutines';

interface Props {
  routines: Routine[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onPlay: (id: string) => void;
}

function estimate(r: Routine): number {
  if (r.style === 'circuit') {
    const round = r.exercises.reduce((acc, e) => {
      const work = e.mode === 'time' ? e.durationSec : e.reps * 3; // ~3s per ripetizione
      return acc + work + e.restSec;
    }, 0);
    return round * r.rounds + r.roundRestSec * Math.max(0, r.rounds - 1);
  }
  return r.exercises.reduce((acc, e) => {
    const work = e.mode === 'time' ? e.durationSec : e.reps * 3;
    return acc + (work + e.restSec) * e.sets;
  }, 0);
}

export function RoutineList({ routines, onCreate, onEdit, onPlay }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-4">
        <Button onClick={onCreate} className="min-h-11 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-1" size={18} /> Nuova routine
        </Button>
      </div>

      {routines.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-stone-500">Nessuna routine ancora. Creane una per iniziare!</p>
            <Button onClick={onCreate} className="min-h-11 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-1" size={18} /> Crea la prima routine
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {routines.map((r) => (
            <Card key={r.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="truncate">{r.name}</span>
                  {r.style === 'circuit' && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                      <RotateCw size={11} /> Circuito
                    </span>
                  )}
                </CardTitle>
                <p className="text-sm text-stone-500">
                  {r.exercises.length} esercizi{r.style === 'circuit' ? ` × ${r.rounds} giri` : ''} · ~{formatTime(estimate(r))} min
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-end gap-3">
                <ul className="space-y-1 text-sm text-stone-600">
                  {r.exercises.slice(0, 4).map((e) => (
                    <li key={e.id} className="flex items-center gap-2">
                      {e.mode === 'time' ? (
                        <Timer size={14} className="shrink-0 text-emerald-600" />
                      ) : (
                        <Repeat size={14} className="shrink-0 text-sky-600" />
                      )}
                      <span className="truncate">{e.name}</span>
                      <span className="ml-auto shrink-0 text-xs text-stone-400">
                        {e.sets}×{e.mode === 'time' ? `${e.durationSec}s` : e.reps}
                      </span>
                    </li>
                  ))}
                  {r.exercises.length > 4 && (
                    <li className="text-xs text-stone-400">+{r.exercises.length - 4} altri…</li>
                  )}
                </ul>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => { unlockAudio(); onPlay(r.id); }}
                    disabled={r.exercises.length === 0}
                    className="min-h-11 flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Play className="mr-1" size={18} /> Avvia
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onEdit(r.id)}
                    className="min-h-11 flex-1"
                  >
                    <Pencil className="mr-1" size={16} /> Modifica
                  </Button>
                  <ShareRoutine routine={r} compact />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VolumeControl />
    </div>
  );
}
