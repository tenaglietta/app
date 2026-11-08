import { useMemo, useState } from 'react';
import { useRoutines } from '@/hooks/useRoutines';
import type { Routine } from '@/types/workout';
import { uid } from '@/types/workout';
import { RoutineList } from '@/sections/RoutineList';
import { RoutineEditor } from '@/sections/RoutineEditor';
import { WorkoutPlayer } from '@/sections/WorkoutPlayer';
import { Dumbbell } from 'lucide-react';

type View =
  | { kind: 'list' }
  | { kind: 'edit'; routineId: string }
  | { kind: 'play'; routineId: string };

export default function App() {
  const { routines, setRoutines } = useRoutines();
  const [view, setView] = useState<View>({ kind: 'list' });

  const current = useMemo(
    () =>
      view.kind !== 'list'
        ? routines.find((r) => r.id === view.routineId) ?? null
        : null,
    [view, routines],
  );

  const createRoutine = () => {
    const r: Routine = {
      id: uid(),
      name: 'Nuova routine',
      style: 'classic',
      rounds: 3,
      roundRestSec: 60,
      exercises: [],
      createdAt: Date.now(),
    };
    setRoutines((prev) => [r, ...prev]);
    setView({ kind: 'edit', routineId: r.id });
  };

  const saveRoutine = (updated: Routine) =>
    setRoutines((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const deleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    setView({ kind: 'list' });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Dumbbell size={18} />
          </div>
          <span className="text-lg font-semibold tracking-tight">FittApp</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24">
        {view.kind === 'list' && (
          <RoutineList
            routines={routines}
            onCreate={createRoutine}
            onEdit={(id) => setView({ kind: 'edit', routineId: id })}
            onPlay={(id) => setView({ kind: 'play', routineId: id })}
          />
        )}
        {view.kind === 'edit' && current && (
          <RoutineEditor
            routine={current}
            onSave={saveRoutine}
            onDelete={deleteRoutine}
            onBack={() => setView({ kind: 'list' })}
            onPlay={(id) => setView({ kind: 'play', routineId: id })}
          />
        )}
        {view.kind === 'play' && current && (
          <WorkoutPlayer routine={current} onExit={() => setView({ kind: 'list' })} />
        )}
      </main>
    </div>
  );
}
