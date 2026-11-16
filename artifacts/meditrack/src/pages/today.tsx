import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Check, Info, Pill, RotateCcw } from 'lucide-react';
import { PageTitle } from '@/components/shell';
import { PhotoDemo } from '@/components/photo-demo';
import { formatTime, useStore, type Medication } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

function greeting(h: number) {
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Today() {
  const { medications, logs, today, profile, markTaken, undoTaken } = useStore();
  const { toast } = useToast();
  const [now, setNow] = useState(new Date());
  const [justTaken, setJustTaken] = useState<string | null>(null);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const sorted = [...medications].sort((a, b) => a.time.localeCompare(b.time));
  const takenMap = new Map(logs.filter((l) => l.date === today).map((l) => [l.medicationId, l]));
  const taken = sorted.filter((m) => takenMap.has(m.id)).length;
  const total = sorted.length;
  const pct = total ? taken / total : 0;
  const nowHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const next = sorted.find((m) => !takenMap.has(m.id));
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const onTake = (m: Medication) => {
    if (markTaken(m)) { setJustTaken(m.id); toast({ title: `${m.name} marked as taken`, description: `Recorded at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.` }); }
  };
  const onUndo = (m: Medication) => { if (undoTaken(m.id)) toast({ title: `${m.name} set back to not taken` }); };

  const R = 54, C = 2 * Math.PI * R;
  return (
    <div>
      <PageTitle eyebrow={dateLabel} title={`${greeting(now.getHours())}, ${profile.name}`} />

      <section className="rise grid md:grid-cols-[auto_1fr] gap-6 items-center rounded-3xl bg-primary text-primary-foreground p-6 md:p-8 mb-8 overflow-hidden relative" style={{ animationDelay: '.08s' }} aria-label="Today's progress">
        <div className="relative size-36 mx-auto md:mx-0">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="10" />
            <circle cx="60" cy="60" r={R} fill="none" stroke="hsl(var(--sidebar-primary))" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.2,1)' }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div><span className="font-display text-4xl" data-testid="text-taken-count">{taken}</span><span className="text-xl opacity-70"> / {total}</span>
              <span className="block text-sm opacity-80">taken today</span></div>
          </div>
        </div>
        <div className="text-center md:text-left">
          {total === 0 ? (
            <p className="font-display text-2xl">No medicines on your list yet.</p>
          ) : taken === total ? (
            <><p className="font-display text-3xl">All done for today.</p><p className="text-lg opacity-85 mt-2">Every dose on your list has been confirmed. Rest easy.</p></>
          ) : (
            <><p className="text-lg opacity-85">Next up</p>
              <p className="font-display text-3xl" data-testid="text-next-dose">{next!.name} at {formatTime(next!.time)}</p>
              <p className="text-lg opacity-85 mt-1">{next!.dose} &middot; {next!.appearance}{next!.time < nowHM ? ' · time has passed' : ''}</p></>
          )}
        </div>
      </section>

      <h2 className="font-display text-3xl mb-4">Today’s schedule</h2>
      {total === 0 ? (
        <div className="rounded-3xl border-2 border-dashed p-10 text-center bg-card/60">
          <Pill className="size-12 mx-auto text-primary/60 mb-3" />
          <p className="text-xl font-bold">Your schedule is empty</p>
          <p className="text-muted-foreground mt-1 mb-5">Add the medicines your doctor prescribed to build your daily routine.</p>
          <Link href="/medications" className="inline-block rounded-full bg-primary text-primary-foreground px-6 py-3 text-lg font-bold" data-testid="link-add-first">Add a medicine</Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-4 mb-10">
          {sorted.map((m, i) => {
            const log = takenMap.get(m.id);
            const done = !!log;
            const late = !done && m.time < nowHM;
            return (
              <li key={m.id} className={`rise flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl border p-5 transition-colors duration-500 ${done ? 'bg-secondary border-secondary' : 'bg-card'}`} style={{ animationDelay: `${0.12 + i * 0.06}s` }} data-testid={`card-dose-${m.id}`}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`shrink-0 w-24 text-center rounded-2xl py-2 ${done ? 'bg-card/60' : late ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
                    <span className="block font-display text-2xl leading-tight">{formatTime(m.time).split(' ')[0]}</span>
                    <span className="text-sm font-bold">{formatTime(m.time).split(' ')[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-2xl font-bold transition-opacity ${done ? 'opacity-70' : ''}`}>{m.name}{m.isExample && <span className="ml-2 align-middle text-xs uppercase tracking-wider font-bold rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Example</span>}</p>
                    <p className="text-lg text-muted-foreground">{m.dose} &middot; {m.appearance}</p>
                    <p className="text-base text-muted-foreground">For {m.purpose.toLowerCase()}</p>
                    <p className="text-base mt-1 font-bold" data-testid={`status-dose-${m.id}`}>
                      {done ? <span className="text-primary">Taken at {new Date(log!.takenAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        : late ? <span className="text-accent-foreground">Not yet confirmed</span> : <span className="text-muted-foreground">Coming up</span>}
                    </p>
                  </div>
                </div>
                {done ? (
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className="relative grid place-items-center size-14 rounded-full bg-primary text-primary-foreground">
                      {justTaken === m.id && <span className="ring-burst absolute inset-0 rounded-full bg-primary" aria-hidden />}
                      <Check className={`size-8 ${justTaken === m.id ? 'pop' : ''}`} strokeWidth={3} />
                    </span>
                    <button onClick={() => onUndo(m)} className="inline-flex items-center gap-1.5 text-base underline underline-offset-4 px-2 py-1" data-testid={`button-undo-${m.id}`}>
                      <RotateCcw className="size-4" /> Undo
                    </button>
                  </div>
                ) : (
                  <button onClick={() => onTake(m)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-4 text-xl font-bold shadow-[0_6px_0_hsl(168_42%_18%)] active:translate-y-1 active:shadow-[0_2px_0_hsl(168_42%_18%)] transition-transform" data-testid={`button-take-${m.id}`}>
                    <Check className="size-6" strokeWidth={3} /> I took it
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <PhotoDemo />

      <p className="mt-8 flex gap-2 text-base text-muted-foreground max-w-2xl">
        <Info className="size-5 shrink-0 mt-0.5" /> MediTrack only records what you confirm. It does not recommend or change doses — example medicines are samples, not instructions. Follow your doctor’s and pharmacist’s guidance.
      </p>
    </div>
  );
}
