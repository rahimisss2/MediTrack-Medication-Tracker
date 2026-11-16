import { useState } from 'react';
import { Check, History as HistoryIcon, Trash2 } from 'lucide-react';
import { PageTitle } from '@/components/shell';
import { formatTime, useStore, type DoseLog } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

function dayLabel(key: string, today: string) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const t = new Date(); t.setDate(t.getDate() - 1);
  const yKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  const base = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  return key === today ? `Today · ${base}` : key === yKey ? `Yesterday · ${base}` : base;
}

export default function History() {
  const { logs, today, deleteLog } = useStore();
  const { toast } = useToast();
  const [toDelete, setToDelete] = useState<DoseLog | null>(null);
  const groups = new Map<string, DoseLog[]>();
  [...logs].sort((a, b) => b.date.localeCompare(a.date) || a.scheduledTime.localeCompare(b.scheduledTime)).forEach((l) => {
    if (!groups.has(l.date)) groups.set(l.date, []);
    groups.get(l.date)!.push(l);
  });

  return (
    <div>
      <PageTitle eyebrow={`${logs.length} confirmed ${logs.length === 1 ? 'dose' : 'doses'}`} title="History" />
      {logs.length === 0 ? (
        <div className="rise rounded-3xl border-2 border-dashed p-10 text-center bg-card/60" data-testid="status-history-empty">
          <HistoryIcon className="size-12 mx-auto text-primary/60 mb-3" />
          <p className="text-xl font-bold">Nothing recorded yet</p>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">When you tap “I took it” on the Today page, the dose will appear here with the exact time you confirmed it.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {[...groups.entries()].map(([date, items], gi) => (
            <section key={date} className="rise" style={{ animationDelay: `${gi * 0.06}s` }}>
              <h2 className="font-display text-2xl mb-3">{dayLabel(date, today)}</h2>
              <ul className="rounded-3xl bg-card border divide-y overflow-hidden">
                {items.map((l) => (
                  <li key={l.id} className="flex items-center gap-4 p-4 md:p-5" data-testid={`row-log-${l.id}`}>
                    <span className="grid place-items-center size-11 rounded-full bg-secondary text-primary shrink-0"><Check className="size-6" strokeWidth={3} /></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold">{l.medicationName} <span className="font-normal text-muted-foreground">· {l.dose}</span></p>
                      <p className="text-base text-muted-foreground">Scheduled {formatTime(l.scheduledTime)} · taken {new Date(l.takenAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <button onClick={() => setToDelete(l)} aria-label={`Delete entry for ${l.medicationName}`} className="p-3 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" data-testid={`button-delete-log-${l.id}`}><Trash2 className="size-5" /></button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">Use this only if the dose was recorded by mistake. {toDelete?.date === today ? 'It will show as not taken on Today.' : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-base h-12 px-6">Keep it</AlertDialogCancel>
            <AlertDialogAction className="rounded-full text-base h-12 px-6 bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-log"
              onClick={() => { if (toDelete && deleteLog(toDelete.id)) toast({ title: 'Entry deleted' }); setToDelete(null); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
