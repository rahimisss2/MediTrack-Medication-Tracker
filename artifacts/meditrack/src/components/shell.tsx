import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { AlertTriangle, CalendarCheck, History, Pill, UserRound, X } from 'lucide-react';
import { useStore } from '@/lib/store';

const NAV = [
  { href: '/', label: 'Today', icon: CalendarCheck },
  { href: '/medications', label: 'Medicines', icon: Pill },
  { href: '/history', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const { storageError, dismissError, profile } = useStore();
  const initials = profile.name.replace(/^(mr|mrs|ms|dr)\.?\s+/i, '').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() || 'M';
  return (
    <div className="min-h-[100dvh] md:flex">
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground p-6 sticky top-0 h-[100dvh]">
        <Link href="/" className="flex items-center gap-3 mb-10" data-testid="link-home-logo">
          <span className="grid place-items-center size-11 rounded-full bg-sidebar-primary text-sidebar-primary-foreground"><Pill className="size-5" /></span>
          <span className="font-display text-2xl leading-none">MediTrack<span className="block text-xs tracking-[0.25em] uppercase opacity-70 mt-1 font-sans">AI</span></span>
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = loc === href;
            return (
              <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase()}`} aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-lg transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold' : 'opacity-80 hover:opacity-100 hover:bg-sidebar-accent/50'}`}>
                <Icon className={`size-5 ${active ? 'text-sidebar-primary' : ''}`} />{label}
              </Link>
            );
          })}
        </nav>
        <Link href="/profile" className="mt-auto flex items-center gap-3 rounded-xl p-3 bg-sidebar-accent/60" data-testid="link-sidebar-profile">
          <span className="grid place-items-center size-10 rounded-full bg-sidebar-foreground/15 font-bold">{initials}</span>
          <span><span className="block font-bold">{profile.name}</span><span className="text-sm opacity-70">Age {profile.age}</span></span>
        </Link>
      </aside>

      <div className="flex-1 min-w-0 pb-28 md:pb-10">
        <header className="md:hidden flex items-center gap-3 px-5 pt-5">
          <span className="grid place-items-center size-10 rounded-full bg-primary text-primary-foreground"><Pill className="size-5" /></span>
          <span className="font-display text-xl text-primary">MediTrack AI</span>
        </header>
        {storageError && (
          <div role="alert" className="mx-5 md:mx-10 mt-5 flex items-start gap-3 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-destructive" data-testid="status-storage-error">
            <AlertTriangle className="size-6 shrink-0 mt-0.5" />
            <p className="flex-1 font-bold">{storageError}</p>
            <button onClick={dismissError} aria-label="Dismiss storage warning" className="p-1 rounded-lg hover:bg-destructive/10" data-testid="button-dismiss-error"><X className="size-5" /></button>
          </div>
        )}
        <main className="px-5 md:px-10 pt-6 md:pt-10 max-w-5xl">{children}</main>
      </div>

      <nav aria-label="Main" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = loc === href;
          return (
            <Link key={href} href={href} data-testid={`link-tab-${label.toLowerCase()}`} aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-3 text-sm ${active ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
              <span className={`px-4 py-1 rounded-full transition-colors ${active ? 'bg-secondary' : ''}`}><Icon className="size-6" /></span>{label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="rise mb-8 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-accent-foreground font-bold">{eyebrow}</p>
        <h1 className="font-display text-4xl md:text-5xl text-foreground mt-1">{title}</h1>
      </div>
      {children}
    </div>
  );
}
