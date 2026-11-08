import { useState } from 'react';
import type { Routine } from '@/types/workout';
import { routineToText } from '@/types/workout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Share2, Download, ClipboardCopy, Send, Check } from 'lucide-react';

interface Props {
  routine: Routine;
  /** aspetto compatto per la lista routine */
  compact?: boolean;
}

export function ShareRoutine({ routine, compact }: Props) {
  const [copied, setCopied] = useState(false);

  const text = () => routineToText(routine);
  const fileName = () => `${routine.name.trim().replace(/\s+/g, '-').toLowerCase() || 'scheda'}.txt`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copia la scheda manualmente:', text());
    }
  };

  const download = () => {
    const blob = new Blob([text()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName();
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Scheda: ${routine.name}`, text: text() });
        return;
      } catch {
        /* annullato o non riuscito: ripiego sulla copia */
      }
    }
    await copy();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Condividi scheda">
            <Share2 size={17} />
          </Button>
        ) : (
          <Button variant="outline" className="min-h-12">
            <Share2 className="mr-1" size={16} /> Condividi
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={share} className="min-h-11 cursor-pointer">
          <Send className="mr-2" size={16} /> Condividi con…
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copy} className="min-h-11 cursor-pointer">
          {copied ? <Check className="mr-2 text-emerald-600" size={16} /> : <ClipboardCopy className="mr-2" size={16} />}
          {copied ? 'Copiata!' : 'Copia come testo'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={download} className="min-h-11 cursor-pointer">
          <Download className="mr-2" size={16} /> Scarica come .txt
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
