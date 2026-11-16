// State and Web Speech contract checks without a browser or external services.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '..');
const { transformSync } = createRequire(path.join(root, 'artifacts/api-server/package.json'))('esbuild');
const source = fs.readFileSync(path.join(root, 'artifacts/meditrack/src/components/demo-controls.tsx'), 'utf8');
const { code } = transformSync(source, { loader: 'tsx', format: 'cjs' });

function harness(supported = true) {
  const slots = [];
  const effects = [];
  const spoken = [];
  let index = 0;
  let cancels = 0;
  const react = {
    useState(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = initial;
      return [slots[slot], (next) => { slots[slot] = next; }];
    },
    useRef(initial) {
      const slot = index++;
      if (!(slot in slots)) slots[slot] = { current: initial };
      return slots[slot];
    },
    useEffect(callback) {
      const slot = index++;
      if (!(slot in slots)) {
        slots[slot] = true;
        effects.push(callback());
      }
    },
  };
  function Utterance(text) { this.text = text; }
  const window = { scrollTo() {} };
  if (supported) {
    window.SpeechSynthesisUtterance = Utterance;
    window.speechSynthesis = {
      getVoices: () => [{ lang: 'fr-FR' }, { lang: 'en-US' }],
      speak: (message) => spoken.push(message),
      cancel: () => { cancels++; },
    };
  }
  const module = { exports: {} };
  vm.runInNewContext(code, {
    exports: module.exports, module, window, SpeechSynthesisUtterance: Utterance,
    require: (name) => {
      if (name === 'react') return react;
      if (name === 'lucide-react') return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const render = () => { index = 0; return module.exports.useDemoAlerts(); };
  return { render, spoken, window, effects, get cancels() { return cancels; } };
}

test('alarm speaks the exact English message once per click', () => {
  const h = harness();
  h.render().simulateAlarm();
  assert.equal(h.render().active, 'alarm');
  assert.equal(h.spoken.length, 1);
  assert.equal(h.spoken[0].text, 'Mr. Ahmad, it is 12:00 PM. Please take your Paracetamol tablets now.');
  assert.equal(h.spoken[0].lang, 'en-US');
  assert.equal(h.spoken[0].rate, 0.9);
  assert.equal(h.spoken[0].volume, 1);
  h.render();
  assert.equal(h.spoken.length, 1, 'rerender must not repeat speech');
});

test('missed-dose simulation replaces alarm and stops speech', () => {
  const h = harness();
  h.render().simulateAlarm();
  h.render().simulateMissedDose();
  assert.equal(h.render().active, 'sos');
  assert.equal(h.render().audioStatus, '');
  assert.equal(h.cancels, 1);
  assert.equal(h.spoken.length, 1, 'SOS must not speak another medication instruction');
});

test('dismiss removes either notification and cancels audio', () => {
  const h = harness();
  h.render().simulateAlarm();
  h.render().dismiss();
  assert.equal(h.render().active, null);
  assert.equal(h.cancels, 1);
  h.render().simulateMissedDose();
  h.render().dismiss();
  assert.equal(h.render().active, null);
});

test('replay works and audio errors show a recovery message', () => {
  const h = harness();
  h.render().simulateAlarm();
  h.render().speak();
  assert.equal(h.spoken.length, 2);
  assert.equal(h.cancels, 1);
  h.spoken[1].onerror();
  assert.match(h.render().audioStatus, /Allow browser audio/);
});

test('unsupported speech keeps the visual alert and offers an explanation', () => {
  const h = harness(false);
  h.render().simulateAlarm();
  assert.equal(h.render().active, 'alarm');
  assert.match(h.render().audioStatus, /not supported/);
});

test('unmount cancels the current voice reminder', () => {
  const h = harness();
  h.render().simulateAlarm();
  for (const cleanup of h.effects) cleanup?.();
  assert.equal(h.cancels, 1);
  assert.equal(h.spoken[0].onend, null);
  assert.equal(h.spoken[0].onerror, null);
});
