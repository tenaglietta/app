export interface Exercise {
  id: string;
  name: string;
  /** 'time' = a tempo (secondi), 'reps' = a ripetizioni */
  mode: 'time' | 'reps';
  durationSec: number; // usato se mode === 'time'
  reps: number;        // usato se mode === 'reps'
  sets: number;
  restSec: number;     // pausa dopo ogni serie
}

export interface Routine {
  id: string;
  name: string;
  /** 'classic' = serie a stazioni (A-A-A, B-B-B), 'circuit' = circuito per giri (A-B-C ripetuto) */
  style: 'classic' | 'circuit';
  /** numero di giri (usato solo se style === 'circuit') */
  rounds: number;
  /** pausa tra un giro e l'altro (usato solo se style === 'circuit') */
  roundRestSec: number;
  exercises: Exercise[];
  createdAt: number;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Genera una scheda testuale leggibile (e interpretabile da un chatbot LLM) */
export function routineToText(r: Routine): string {
  const lines: string[] = [];
  lines.push(`SCHEDA DI ALLENAMENTO: ${r.name}`);
  lines.push('');
  if (r.style === 'circuit') {
    lines.push(`Struttura: CIRCUITO — esegui tutti gli esercizi in sequenza, poi ricomincia dal primo.`);
    lines.push(`Giri totali: ${r.rounds} | Pausa tra i giri: ${r.roundRestSec} secondi | Pausa tra gli esercizi: quella indicata per ciascun esercizio.`);
  } else {
    lines.push(`Struttura: SERIE A STAZIONI — completa tutte le serie di un esercizio prima di passare al successivo.`);
  }
  lines.push('');
  lines.push('ESERCIZI:');
  r.exercises.forEach((e, i) => {
    const dose = e.mode === 'time' ? `${e.durationSec} secondi` : `${e.reps} ripetizioni`;
    const sets = r.style === 'circuit' ? `1 serie per giro (x${r.rounds} giri)` : `${e.sets} serie`;
    lines.push(`${i + 1}. ${e.name} — ${dose} | ${sets} | Pausa dopo: ${e.restSec} sec`);
  });
  lines.push('');
  lines.push('NOTE: "Pausa dopo" indica i secondi di recupero dopo ogni serie (o dopo ogni passaggio nel circuito). Riscaldati prima di iniziare e termina con defaticamento/stretching.');
  return lines.join('\n');
}
