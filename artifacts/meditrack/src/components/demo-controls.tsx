import { useEffect, useRef, useState } from 'react';
import { BellRing, PhoneCall, Volume2, Wrench, X } from 'lucide-react';

const ALARM_TEXT = '⚠️ ATTENTION: It is 12:00 PM. Time to take your Paracetamol tablets!';
const VOICE_TEXT = 'Mr. Ahmad, it is 12:00 PM. Please take your Paracetamol tablets now.';
const SOS_TEXT = '🚨 CAREGIVER SOS ALERT: Mr. Ahmad has missed his scheduled 12:00 PM Paracetamol dose. An automated SMS alert notification has been dispatched to his designated caregiver (Son: +6012-3456789).';

/** Demo state stays in memory and never changes medication or intake records. */
export function useDemoAlerts() {
  const [active, setActive] = useState<'alarm' | 'sos' | null>(null);
  const [audioStatus, setAudioStatus] = useState('');
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);

  const stopSpeech = () => {
    if (utterance.current) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  };

  useEffect(() => () => {
    if (utterance.current && 'speechSynthesis' in window) {
      utterance.current.onend = null;
      utterance.current.onerror = null;
      utterance.current = null;
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = () => {
    stopSpeech();
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setAudioStatus('Voice alerts are not supported by this browser. The written reminder is shown above.');
      return;
    }
    try {
      const message = new SpeechSynthesisUtterance(VOICE_TEXT);
      message.lang = 'en-US';
      message.rate = 0.9;
      message.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const english = voices.find((voice) => /^en[-_]US$/i.test(voice.lang))
        ?? voices.find((voice) => /^en\b/i.test(voice.lang));
      if (english) message.voice = english;
      utterance.current = message;
      message.onend = () => {
        if (utterance.current === message) {
          utterance.current = null;
          setAudioStatus('Voice reminder finished. You can replay it below.');
        }
      };
      message.onerror = () => {
        if (utterance.current === message) {
          utterance.current = null;
          setAudioStatus('Audio could not play. Allow browser audio and select Play voice reminder to retry.');
        }
      };
      setAudioStatus('Playing English voice reminder. Sound follows your device volume.');
      // Called directly from the user's click, not an effect, for autoplay policies.
      window.speechSynthesis.speak(message);
    } catch {
      stopSpeech();
      setAudioStatus('Audio could not play. Select Play voice reminder to retry.');
    }
  };

  return {
    active,
    audioStatus,
    speak,
    simulateAlarm: () => {
      setActive('alarm');
      window.scrollTo({ top: 0, behavior: 'auto' });
      speak();
    },
    simulateMissedDose: () => {
      stopSpeech();
      setAudioStatus('');
      setActive('sos');
      window.scrollTo({ top: 0, behavior: 'auto' });
    },
    dismiss: () => {
      stopSpeech();
      setAudioStatus('');
      setActive(null);
    },
  };
}

type DemoAlerts = ReturnType<typeof useDemoAlerts>;

export function DemoControls({ alerts, mobile = false }: { alerts: DemoAlerts; mobile?: boolean }) {
  const buttonClass = mobile
    ? 'flex items-center gap-2 rounded-xl border border-primary/20 bg-card px-3 py-3 text-left text-base font-bold text-primary hover:bg-secondary transition-colors'
    : 'flex w-full items-center gap-2 rounded-xl bg-sidebar-accent/60 px-3 py-3 text-left text-sm font-bold hover:bg-sidebar-accent transition-colors';
  return (
    <section aria-label="Demo Controls" className={mobile ? 'mt-3 grid gap-2' : 'my-6 border-t border-sidebar-border pt-5'}>
      {!mobile && <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><Wrench className="size-4" aria-hidden /> Demo Controls</h2>}
      <div className="grid gap-2">
        <button type="button" onClick={alerts.simulateAlarm} className={buttonClass} data-testid={mobile ? 'button-mobile-simulate-alarm' : 'button-simulate-alarm'}>
          <BellRing className="size-4 shrink-0" aria-hidden /> Simulate Alarm
        </button>
        <button type="button" onClick={alerts.simulateMissedDose} className={buttonClass} data-testid={mobile ? 'button-mobile-simulate-missed-dose' : 'button-simulate-missed-dose'}>
          <PhoneCall className="size-4 shrink-0" aria-hidden /> Simulate Missed Dose
        </button>
      </div>
      <p className={`mt-2 text-xs ${mobile ? 'text-muted-foreground' : 'opacity-75'}`}>Demo only. No SMS is sent.</p>
    </section>
  );
}

export function DemoNotification({ alerts }: { alerts: DemoAlerts }) {
  if (!alerts.active) return null;
  const alarm = alerts.active === 'alarm';
  return (
    <div role="alert" className={`mb-6 rounded-2xl border-2 p-4 md:p-5 ${alarm ? 'border-orange-400 bg-orange-100 text-orange-950' : 'border-red-400 bg-red-100 text-red-950'}`}
      data-testid={alarm ? 'banner-demo-alarm' : 'banner-demo-sos'}>
      {!alarm && <p className="mb-2 font-bold">SIMULATION ONLY — mock notification. No SMS or notification has actually been sent.</p>}
      <p className="text-lg font-bold">{alarm ? ALARM_TEXT : SOS_TEXT}</p>
      {alarm && (
        <>
          <p className="mt-2 text-sm">Simulated reminder using example medication information. Follow your prescription, not this demo.</p>
          <p role="status" className="mt-2 text-sm" data-testid="status-demo-audio">{alerts.audioStatus}</p>
          <button type="button" onClick={alerts.speak} className="mt-3 inline-flex items-center gap-2 rounded-full border border-current px-4 py-2 text-base font-bold hover:bg-white/40"
            data-testid="button-replay-demo-audio"><Volume2 className="size-4" aria-hidden /> Play voice reminder</button>
        </>
      )}
      <button type="button" onClick={alerts.dismiss} className="mt-3 flex items-center gap-2 rounded-full border border-current px-4 py-2 text-base font-bold hover:bg-white/40"
        data-testid="button-dismiss-demo"><X className="size-4" aria-hidden /> {alarm ? 'Dismiss Alarm Notification' : 'Dismiss SOS Notification'}</button>
    </div>
  );
}
