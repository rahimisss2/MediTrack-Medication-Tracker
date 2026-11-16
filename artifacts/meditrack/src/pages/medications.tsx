import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Pencil, Pill, Plus, Trash2 } from 'lucide-react';
import { PageTitle } from '@/components/shell';
import { formatTime, useStore, type Medication } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z.object({
  name: z.string().trim().min(1, 'Please enter the medicine name').max(60),
  purpose: z.string().trim().min(1, 'Please enter what it is for').max(80),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Please choose a time'),
  dose: z.string().trim().min(1, 'Please enter the dose from your prescription').max(40),
  appearance: z.string().trim().min(1, 'Please describe how it looks').max(60),
});
type FormValues = z.infer<typeof schema>;
const EMPTY: FormValues = { name: '', purpose: '', time: '08:00', dose: '', appearance: '' };

function MedForm({ initial, onDone }: { initial: Medication | null; onDone: () => void }) {
  const { saveMedication } = useStore();
  const { toast } = useToast();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial ? { name: initial.name, purpose: initial.purpose, time: initial.time, dose: initial.dose, appearance: initial.appearance } : EMPTY });
  const fields: { name: keyof FormValues; label: string; placeholder: string; type?: string }[] = [
    { name: 'name', label: 'Medicine name', placeholder: 'e.g. Lisinopril' },
    { name: 'purpose', label: 'What it is for', placeholder: 'e.g. Blood pressure' },
    { name: 'time', label: 'Time to take', placeholder: '', type: 'time' },
    { name: 'dose', label: 'Dose (as written on your prescription)', placeholder: 'e.g. 1 tablet' },
    { name: 'appearance', label: 'How it looks', placeholder: 'e.g. Small white round' },
  ];
  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit((v) => {
        if (saveMedication({ ...v, id: initial?.id })) { toast({ title: initial ? `${v.name} updated` : `${v.name} added to your list` }); onDone(); }
      })}>
        {fields.map((f) => (
          <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-bold">{f.label}</FormLabel>
              <FormControl><Input {...field} type={f.type ?? 'text'} placeholder={f.placeholder} className="h-12 text-lg rounded-xl bg-background" data-testid={`input-${f.name}`} /></FormControl>
              <FormMessage className="text-base" />
            </FormItem>
          )} />
        ))}
        <DialogFooter className="gap-3 pt-2">
          <button type="button" onClick={onDone} className="rounded-full border-2 px-6 py-3 text-lg font-bold" data-testid="button-cancel-med">Cancel</button>
          <button type="submit" className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-lg font-bold" data-testid="button-save-med">{initial ? 'Save changes' : 'Add medicine'}</button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Medications() {
  const { medications, deleteMedication } = useStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Medication | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Medication | null>(null);
  const sorted = [...medications].sort((a, b) => a.time.localeCompare(b.time));
  const openNew = () => { setEditing(null); setOpen(true); };

  return (
    <div>
      <PageTitle eyebrow={`${medications.length} on your list`} title="Your medicines">
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-lg font-bold self-start" data-testid="button-add-med"><Plus className="size-5" /> Add medicine</button>
      </PageTitle>

      {medications.some((m) => m.isExample) && (
        <p className="rise mb-6 rounded-2xl bg-accent text-accent-foreground p-4 text-base" data-testid="text-example-note">
          Items marked <strong>Example</strong> are samples to show how the app works — not dosing instructions. Edit them to match your own prescription, or delete them.
        </p>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed p-10 text-center bg-card/60">
          <Pill className="size-12 mx-auto text-primary/60 mb-3" />
          <p className="text-xl font-bold">No medicines yet</p>
          <p className="text-muted-foreground mt-1 mb-5">Copy the details from your prescription label.</p>
          <button onClick={openNew} className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-lg font-bold" data-testid="button-add-first-med">Add your first medicine</button>
        </div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-4">
          {sorted.map((m, i) => (
            <li key={m.id} className="rise rounded-3xl bg-card border p-6 flex flex-col gap-3" style={{ animationDelay: `${i * 0.05}s` }} data-testid={`card-med-${m.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl">{m.name}</p>
                  <p className="text-muted-foreground text-lg">{m.purpose}</p>
                </div>
                {m.isExample && <span className="text-xs uppercase tracking-wider font-bold rounded-full bg-muted px-2.5 py-1 text-muted-foreground">Example</span>}
              </div>
              <dl className="grid grid-cols-3 gap-2 text-base">
                <div className="rounded-xl bg-muted p-3"><dt className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="size-3.5" />Time</dt><dd className="font-bold">{formatTime(m.time)}</dd></div>
                <div className="rounded-xl bg-muted p-3"><dt className="text-sm text-muted-foreground">Dose</dt><dd className="font-bold">{m.dose}</dd></div>
                <div className="rounded-xl bg-muted p-3"><dt className="text-sm text-muted-foreground">Looks like</dt><dd className="font-bold">{m.appearance}</dd></div>
              </dl>
              <div className="flex gap-3 mt-1">
                <button onClick={() => { setEditing(m); setOpen(true); }} className="inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 font-bold hover:bg-muted transition-colors" data-testid={`button-edit-${m.id}`}><Pencil className="size-4" /> Edit</button>
                <button onClick={() => setToDelete(m)} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-destructive hover:bg-destructive/10 transition-colors" data-testid={`button-delete-${m.id}`}><Trash2 className="size-4" /> Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl">{editing ? `Edit ${editing.name}` : 'Add a medicine'}</DialogTitle>
            <DialogDescription className="text-base">Enter details exactly as shown on your prescription label. MediTrack does not suggest doses.</DialogDescription>
          </DialogHeader>
          {open && <MedForm key={editing?.id ?? 'new'} initial={editing} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl">Remove {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">It will no longer appear on your daily schedule. Past history entries are kept.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-base h-12 px-6" data-testid="button-cancel-delete">Keep it</AlertDialogCancel>
            <AlertDialogAction className="rounded-full text-base h-12 px-6 bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete"
              onClick={() => { if (toDelete && deleteMedication(toDelete.id)) toast({ title: `${toDelete.name} removed` }); setToDelete(null); }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
