import { useState } from 'react';
import { beep, getVolume, setVolume, unlockAudio } from '@/hooks/useRoutines';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2 } from 'lucide-react';

export function VolumeControl() {
  const [vol, setVol] = useState(getVolume());

  const change = (v: number[]) => {
    setVol(v[0]);
    setVolume(v[0]);
  };

  const test = () => {
    unlockAudio();
    beep(988, 200, 0);
    beep(1319, 350, 0.22);
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <Volume2 size={20} className="shrink-0 text-stone-500" />
      <div className="flex-1">
        <p className="text-xs font-medium text-stone-500">Volume segnali acustici</p>
        <Slider
          value={[vol]}
          onValueChange={change}
          min={0.05}
          max={1}
          step={0.05}
          className="mt-2"
          aria-label="Volume segnali acustici"
        />
      </div>
      <Button variant="outline" onClick={test} className="min-h-11 shrink-0">
        Prova
      </Button>
    </div>
  );
}
