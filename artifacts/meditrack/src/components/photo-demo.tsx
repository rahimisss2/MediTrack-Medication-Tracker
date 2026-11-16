import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FlaskConical, ImageOff, LoaderCircle } from 'lucide-react';
import { useStore } from '@/lib/store';

export function PhotoDemo() {
  const { medications, logs, today, profile, markTaken } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'analyzing' | 'ready'>('idle');
  const [error, setError] = useState('');
  const medication = medications.find((m) => /^paracetamol\b/i.test(m.name));
  const logged = !!medication && logs.some((l) => l.medicationId === medication.id && l.date === today);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => {
    if (!url) return;
    const timer = window.setTimeout(() => setPhase('ready'), 2000);
    return () => window.clearTimeout(timer);
  }, [url]);

  const clearPhoto = () => {
    setUrl(null);
    setPhase('idle');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section aria-labelledby="photo-title" className="rise rounded-3xl border-2 border-dashed border-accent-foreground/30 bg-accent/50 p-6" style={{ animationDelay: '.25s' }}>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-foreground text-accent px-3 py-1 text-sm font-bold uppercase tracking-wider" data-testid="badge-demo-only">
          <FlaskConical className="size-4" /> Demo only
        </span>
        <h2 id="photo-title" className="font-display text-2xl">Pill photo</h2>
      </div>
      <p className="text-base text-accent-foreground mb-4 max-w-2xl">
        This simulates a Paracetamol photo check; it cannot identify a medicine or confirm its dosage or safety. A photo does not record a dose — only “Complete &amp; Log Intake” does.
        Always compare with your prescription label and ask your pharmacist if unsure. Photos stay on this screen only and are not saved.
      </p>
      <label htmlFor="photo-input" className="sr-only">Take or choose a photo of a pill</label>
      <input id="photo-input" ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" data-testid="input-photo"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!f.type.startsWith('image/')) {
            clearPhoto();
            setError('Please choose an image file.');
            return;
          }
          try {
            setUrl(URL.createObjectURL(f));
            setPhase('analyzing');
            setError('');
          } catch {
            clearPhoto();
            setError('This photo could not be opened. Please try another image.');
          }
        }} />
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="size-40 shrink-0 rounded-2xl bg-card border overflow-hidden grid place-items-center">
          {url ? <img src={url} alt="Your photo preview" className="size-full object-cover" data-testid="img-photo-preview"
            onError={() => { clearPhoto(); setError('This photo could not be displayed. Please choose another image.'); }} /> : <ImageOff className="size-10 text-muted-foreground" aria-hidden />}
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-lg font-bold hover:opacity-90 transition" data-testid="button-take-photo">
            <Camera className="size-5" /> {url ? 'Take another photo' : 'Take or choose photo'}
          </button>
          {url && (
            <button onClick={clearPhoto} className="self-start underline text-base" data-testid="button-clear-photo">Clear photo</button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-4 text-base font-bold text-destructive">{error}</p>}
      {url && phase === 'analyzing' && (
        <div role="status" aria-live="polite" className="mt-5 flex items-center gap-3 text-primary font-bold" data-testid="status-photo-analyzing">
          <LoaderCircle className="size-5 animate-spin" aria-hidden /> AI is analyzing pill features (shape, size, markings)...
        </div>
      )}
      {url && phase === 'ready' && (
        <div className="mt-5" aria-live="polite">
          <div role="status" className="rounded-2xl border border-primary/25 bg-secondary p-4 text-primary" data-testid="status-photo-success">
            <p className="flex items-center gap-2 font-bold text-lg"><CheckCircle2 className="size-5 shrink-0" aria-hidden /> AI verification simulation complete for {profile.name}.</p>
            <p className="mt-1 text-base">Paracetamol demo only — medicine identity and dosage have not been verified. No AI service was called.</p>
          </div>
          {!medication ? (
            <p className="mt-3 text-base" role="status">Add Paracetamol to your Medications list before logging its intake.</p>
          ) : logged ? (
            <p className="mt-3 font-bold text-primary" role="status" data-testid="status-photo-logged">Paracetamol intake is logged for today. View the timestamp in History.</p>
          ) : (
            <>
              <p className="mt-3 text-base">Only confirm if you have actually taken your prescribed {medication.name} dose. This demo is not a recommendation to take medication.</p>
              <button className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-lg font-bold hover:opacity-90 transition"
                data-testid="button-complete-photo" onClick={() => {
                  if (markTaken(medication, 'photo-demo')) setError('');
                  else setError('Intake could not be saved. Please retry; no dose has been recorded.');
                }}>
                <CheckCircle2 className="size-5" aria-hidden /> Complete &amp; Log Intake
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
