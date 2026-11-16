import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Medication = { id: string; name: string; purpose: string; time: string; dose: string; appearance: string; isExample?: boolean };
export type DoseLog = { id: string; medicationId: string; medicationName: string; dose: string; scheduledTime: string; date: string; takenAt: string; source?: 'manual' | 'photo-demo' };
export type Profile = { name: string; age: number };

const KEYS = { meds: 'meditrack.medications.v1', logs: 'meditrack.logs.v1', profile: 'meditrack.profile.v1' };

const SEED_MEDS: Medication[] = [
  { id: 'example-metformin', name: 'Metformin', purpose: 'Diabetes', time: '08:00', dose: '1 tablet', appearance: 'White round', isExample: true },
  { id: 'example-paracetamol', name: 'Paracetamol', purpose: 'Pain relief', time: '12:00', dose: '2 tablets', appearance: 'White oblong', isExample: true },
  { id: 'example-amlodipine', name: 'Amlodipine', purpose: 'High blood pressure', time: '20:00', dose: 'half tablet', appearance: 'Yellow rectangular', isExample: true },
];
const SEED_PROFILE: Profile = { name: 'Mr. Ahmad', age: 67 };

export function localDateKey(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function uid() {
  return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`;
}

function read<T>(key: string, fallback: T): { value: T; error?: string } {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { value: fallback };
    return { value: JSON.parse(raw) as T };
  } catch {
    return { value: fallback, error: 'Saved data could not be read. Showing defaults; your changes may not be kept.' };
  }
}

type Ctx = {
  medications: Medication[];
  logs: DoseLog[];
  profile: Profile;
  today: string;
  storageError: string | null;
  dismissError: () => void;
  saveMedication: (m: Omit<Medication, 'id'> & { id?: string }) => boolean;
  deleteMedication: (id: string) => boolean;
  markTaken: (m: Medication, source?: DoseLog['source']) => boolean;
  undoTaken: (medicationId: string) => boolean;
  deleteLog: (id: string) => boolean;
  saveProfile: (p: Profile) => boolean;
};
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => {
    const m = read<Medication[]>(KEYS.meds, SEED_MEDS);
    const l = read<DoseLog[]>(KEYS.logs, []);
    const p = read<Profile>(KEYS.profile, SEED_PROFILE);
    return { m, l, p, error: m.error || l.error || p.error || null };
  }, []);
  const [medications, setMeds] = useState(initial.m.value);
  const [logs, setLogs] = useState(initial.l.value);
  const [profile, setProfile] = useState(initial.p.value);
  const [storageError, setStorageError] = useState<string | null>(initial.error);
  const [today, setToday] = useState(localDateKey());

  useEffect(() => {
    const t = setInterval(() => setToday(localDateKey()), 30000);
    const onVis = () => setToday(localDateKey());
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const write = useCallback((key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      setStorageError('Could not save to this browser’s storage (it may be full or disabled). Your last change was not kept.');
      return false;
    }
  }, []);

  const saveMedication: Ctx['saveMedication'] = (m) => {
    const next = m.id
      ? medications.map((x) => (x.id === m.id ? { ...x, ...m, id: x.id, isExample: false } : x))
      : [...medications, { ...m, id: uid(), isExample: false }];
    if (!write(KEYS.meds, next)) return false;
    setMeds(next as Medication[]);
    return true;
  };
  const deleteMedication = (id: string) => {
    const next = medications.filter((x) => x.id !== id);
    if (!write(KEYS.meds, next)) return false;
    setMeds(next);
    return true;
  };
  const markTaken: Ctx['markTaken'] = (m, source = 'manual') => {
    if (logs.some((l) => l.medicationId === m.id && l.date === today)) return true;
    const next = [...logs, { id: uid(), medicationId: m.id, medicationName: m.name, dose: m.dose, scheduledTime: m.time, date: today, takenAt: new Date().toISOString(), source }];
    if (!write(KEYS.logs, next)) return false;
    setLogs(next);
    return true;
  };
  const undoTaken = (medicationId: string) => {
    const next = logs.filter((l) => !(l.medicationId === medicationId && l.date === today));
    if (!write(KEYS.logs, next)) return false;
    setLogs(next);
    return true;
  };
  const deleteLog = (id: string) => {
    const next = logs.filter((l) => l.id !== id);
    if (!write(KEYS.logs, next)) return false;
    setLogs(next);
    return true;
  };
  const saveProfile = (p: Profile) => {
    if (!write(KEYS.profile, p)) return false;
    setProfile(p);
    return true;
  };

  return (
    <StoreCtx.Provider value={{ medications, logs, profile, today, storageError, dismissError: () => setStorageError(null), saveMedication, deleteMedication, markTaken, undoTaken, deleteLog, saveProfile }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside provider');
  return c;
}
