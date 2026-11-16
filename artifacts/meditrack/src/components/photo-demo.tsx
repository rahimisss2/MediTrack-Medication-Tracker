import { useEffect, useRef, useState } from 'react';
import { Camera, FlaskConical, ImageOff } from 'lucide-react';

export function PhotoDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState('');

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  return (
    <section aria-labelledby="photo-title" className="rise rounded-3xl border-2 border-dashed border-accent-foreground/30 bg-accent/50 p-6" style={{ animationDelay: '.25s' }}>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-foreground text-accent px-3 py-1 text-sm font-bold uppercase tracking-wider" data-testid="badge-demo-only">
          <FlaskConical className="size-4" /> Demo only
        </span>
        <h2 id="photo-title" className="font-display text-2xl">Pill photo</h2>
      </div>
      <p className="text-base text-accent-foreground mb-4 max-w-2xl">
        This cannot identify a medicine or confirm that it is safe to take. A photo does not record a dose — you still tap “I took it” yourself.
        Always compare with your prescription label and ask your pharmacist if unsure. Photos stay on this screen only and are not saved.
      </p>
      <label htmlFor="photo-input" className="sr-only">Take or choose a photo of a pill</label>
      <input id="photo-input" ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" data-testid="input-photo"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setUrl(URL.createObjectURL(f));
          setName(f.name);
        }} />
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="size-40 shrink-0 rounded-2xl bg-card border overflow-hidden grid place-items-center">
          {url ? <img src={url} alt="Your photo preview" className="size-full object-cover" data-testid="img-photo-preview" /> : <ImageOff className="size-10 text-muted-foreground" aria-hidden />}
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-lg font-bold hover:opacity-90 transition" data-testid="button-take-photo">
            <Camera className="size-5" /> {url ? 'Take another photo' : 'Take or choose photo'}
          </button>
          {url && (
            <>
              <p className="text-sm text-muted-foreground" data-testid="text-photo-name">Preview: {name}. No identification performed.</p>
              <button onClick={() => { setUrl(null); setName(''); if (inputRef.current) inputRef.current.value = ''; }} className="self-start underline text-base" data-testid="button-clear-photo">Clear photo</button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
