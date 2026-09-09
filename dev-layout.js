(() => {
  const STORAGE_KEY = 'duren.dev.layout.v1';
  const VERSION = 1;
  const root = document.documentElement;

  const groups = [
    {
      title: 'Układ',
      items: [
        ['sidebarW', 'Szerokość panelu bocznego', '--dev-sidebar-w', 260, 520, 1, 350],
        ['topbarH', 'Wysokość topbara', '--dev-topbar-h', 68, 150, 1, 92],
      ],
    },
    {
      title: 'Nasza ręka',
      items: [
        ['handCardW', 'Szerokość karty', '--dev-hand-card-w', 60, 180, 1, 102],
        ['handCardH', 'Wysokość karty', '--dev-hand-card-h', 85, 250, 1, 145],
        ['handY', 'Pozycja Y ręki', '--dev-hand-y', -120, 80, 1, -17],
        ['handOverlap', 'Nakładanie kart', '--dev-hand-overlap', -80, 24, 1, -24],
        ['handSlotH', 'Wysokość strefy ręki', '--dev-hand-slot-h', 100, 300, 1, 190],
      ],
    },
    {
      title: 'Karty na stole',
      items: [
        ['tableCardW', 'Szerokość karty', '--dev-table-card-w', 60, 180, 1, 102],
        ['tableCardH', 'Wysokość karty', '--dev-table-card-h', 85, 250, 1, 145],
        ['tableX', 'Pozycja X całej lewy', '--dev-table-x', -320, 320, 1, 0],
        ['tableY', 'Pozycja Y całej lewy', '--dev-table-y', -260, 260, 1, 0],
        ['tableZoneW', 'Szerokość obszaru kart', '--dev-table-zone-w', 300, 1200, 5, 760],
        ['tableGapX', 'Odstęp poziomy', '--dev-table-gap-x', 0, 80, 1, 20],
        ['tableGapY', 'Odstęp pionowy', '--dev-table-gap-y', 0, 80, 1, 16],
        ['defenseX', 'Przesunięcie karty broniącej X', '--dev-defense-x', -20, 80, 1, 21],
        ['defenseY', 'Przesunięcie karty broniącej Y', '--dev-defense-y', -20, 100, 1, 22],
      ],
    },
    {
      title: 'Przeciwnicy',
      items: [
        ['seatTopY', 'Górna plakietka — Y', '--dev-seat-top-y', 0, 180, 1, 34],
        ['seatSideY', 'Boczne plakietki — Y', '--dev-seat-side-y', 0, 220, 1, 34],
        ['seatSideX', 'Boczne plakietki — odsunięcie X', '--dev-seat-side-x', 0, 220, 1, 34],
        ['seatW', 'Szerokość plakietki', '--dev-seat-w', 150, 360, 1, 246],
        ['botBackW', 'Rewers — szerokość', '--dev-bot-back-w', 24, 110, 1, 50],
        ['botBackH', 'Rewers — wysokość', '--dev-bot-back-h', 34, 160, 1, 72],
        ['botBackOverlap', 'Nakładanie rewersów', '--dev-bot-back-overlap', -80, 20, 1, -27],
      ],
    },
    {
      title: 'Talon i odrzut',
      items: [
        ['stackCardW', 'Karta stosu — szerokość', '--dev-stack-card-w', 32, 130, 1, 74],
        ['stackCardH', 'Karta stosu — wysokość', '--dev-stack-card-h', 45, 185, 1, 104],
        ['talonX', 'Talon — X od lewej', '--dev-talon-x', 0, 300, 1, 30],
        ['talonY', 'Talon — Y od dołu', '--dev-talon-y', 0, 180, 1, 14],
        ['discardX', 'Odrzut — X od prawej', '--dev-discard-x', 0, 300, 1, 30],
        ['discardY', 'Odrzut — Y od dołu', '--dev-discard-y', 0, 180, 1, 14],
      ],
    },
    {
      title: 'Panel akcji i środek stołu',
      items: [
        ['actionW', 'Panel akcji — szerokość', '--dev-action-w', 360, 1100, 5, 680],
        ['actionMinH', 'Panel akcji — min. wysokość', '--dev-action-min-h', 70, 260, 1, 108],
        ['actionSpaceH', 'Rezerwowane miejsce panelu', '--dev-action-space-h', 100, 320, 1, 200],
        ['actionX', 'Panel akcji — X', '--dev-action-x', -300, 300, 1, 0],
        ['actionY', 'Panel akcji — Y', '--dev-action-y', -180, 180, 1, 0],
        ['brandSize', 'Napis DURAK — rozmiar', '--dev-brand-size', 20, 120, 1, 62],
        ['brandX', 'Napis DURAK — X', '--dev-brand-x', -300, 300, 1, 0],
        ['brandY', 'Napis DURAK — Y', '--dev-brand-y', -220, 220, 1, 0],
      ],
    },
  ];

  const descriptors = new Map();
  for (const group of groups) {
    for (const [key, label, cssVar, min, max, step, defaultValue] of group.items) {
      descriptors.set(key, { key, label, cssVar, min, max, step, defaultValue });
    }
  }

  const defaults = Object.fromEntries([...descriptors.values()].map((item) => [item.key, item.defaultValue]));
  let values = { ...defaults };
  let section = null;
  let textarea = null;
  let statusNode = null;

  function clampValue(descriptor, raw) {
    const number = Number(raw);
    if (!Number.isFinite(number)) return descriptor.defaultValue;
    return Math.min(descriptor.max, Math.max(descriptor.min, number));
  }

  function normalize(input) {
    const source = input && typeof input === 'object' && input.values && typeof input.values === 'object'
      ? input.values
      : input;
    const next = { ...defaults };
    if (!source || typeof source !== 'object') return next;
    for (const descriptor of descriptors.values()) {
      if (Object.prototype.hasOwnProperty.call(source, descriptor.key)) {
        next[descriptor.key] = clampValue(descriptor, source[descriptor.key]);
      }
    }
    return next;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaults };
      return normalize(JSON.parse(raw));
    } catch {
      return { ...defaults };
    }
  }

  function serialize() {
    return JSON.stringify({ version: VERSION, profile: 'desktop', values }, null, 2);
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, profile: 'desktop', values }));
    } catch {}
  }

  function apply() {
    for (const descriptor of descriptors.values()) {
      root.style.setProperty(descriptor.cssVar, `${values[descriptor.key]}px`);
    }
  }

  function setStatus(text, kind = 'ok') {
    if (!statusNode) return;
    statusNode.textContent = text;
    statusNode.dataset.kind = kind;
  }

  function syncTextarea() {
    if (textarea && document.activeElement !== textarea) textarea.value = serialize();
  }

  function syncControls() {
    if (!section) return;
    for (const descriptor of descriptors.values()) {
      section.querySelectorAll(`[data-dev-key="${descriptor.key}"]`).forEach((input) => {
        if (document.activeElement !== input) input.value = String(values[descriptor.key]);
      });
    }
    syncTextarea();
  }

  function setValue(key, raw, { save = true, sync = true } = {}) {
    const descriptor = descriptors.get(key);
    if (!descriptor) return false;
    values[key] = clampValue(descriptor, raw);
    apply();
    if (save) persist();
    if (sync) syncControls();
    return true;
  }

  function importJSON(raw) {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      values = normalize(parsed);
      apply();
      persist();
      syncControls();
      setStatus('JSON zastosowany i zapisany lokalnie.');
      return true;
    } catch (error) {
      setStatus(`Nieprawidłowy JSON: ${error.message}`, 'error');
      return false;
    }
  }

  function reset() {
    values = { ...defaults };
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    apply();
    syncControls();
    setStatus('Przywrócono wartości domyślne DEV.');
  }

  async function copyJSON() {
    const text = serialize();
    if (textarea) textarea.value = text;
    try {
      await navigator.clipboard.writeText(text);
      setStatus('JSON skopiowany do schowka.');
      return true;
    } catch {
      if (textarea) {
        textarea.focus();
        textarea.select();
        try { document.execCommand('copy'); } catch {}
      }
      setStatus('JSON jest zaznaczony — skopiuj go ręcznie, jeśli schowek został zablokowany.');
      return false;
    }
  }

  function controlHTML(item) {
    return `<div class="dev-layout-control">
      <label for="dev-number-${item.key}">${item.label}</label>
      <input type="range" data-dev-key="${item.key}" min="${item.min}" max="${item.max}" step="${item.step}" value="${values[item.key]}" aria-label="${item.label}">
      <input id="dev-number-${item.key}" type="number" data-dev-key="${item.key}" min="${item.min}" max="${item.max}" step="${item.step}" value="${values[item.key]}" aria-label="${item.label} wartość">
    </div>`;
  }

  function mount() {
    if (document.getElementById('dev-layout-section')) return;
    const settingsGrid = document.querySelector('#settings-modal .settings-grid');
    if (!settingsGrid) return;

    section = document.createElement('section');
    section.id = 'dev-layout-section';
    section.className = 'dev-layout-section';
    section.innerHTML = `<details class="dev-layout-details" open>
      <summary><span>DEV · Układ desktop</span><span>live</span></summary>
      <p class="dev-layout-note">Sterowanie działa tylko dla desktopu ≥1181 px. Zmiany są podglądane natychmiast i zapisywane w tej przeglądarce. Po ustawieniu wyglądu skopiuj JSON i podeślij go — wartości zamienimy potem na nowe defaulty.</p>
      <div class="dev-layout-groups">
        ${groups.map((group) => `<div class="dev-layout-group"><h4>${group.title}</h4>${group.items.map((raw) => controlHTML(descriptors.get(raw[0]))).join('')}</div>`).join('')}
      </div>
      <textarea id="dev-layout-json" class="dev-layout-json" spellcheck="false" aria-label="DEV layout JSON"></textarea>
      <div class="dev-layout-actions">
        <button type="button" class="dev-primary" data-dev-action="copy">Kopiuj JSON</button>
        <button type="button" data-dev-action="apply-json">Zastosuj JSON</button>
        <button type="button" data-dev-action="refresh-json">Odśwież JSON</button>
        <button type="button" class="dev-danger" data-dev-action="reset">Reset DEV</button>
      </div>
      <small class="dev-layout-status" id="dev-layout-status" aria-live="polite"></small>
    </details>`;
    settingsGrid.appendChild(section);
    textarea = section.querySelector('#dev-layout-json');
    statusNode = section.querySelector('#dev-layout-status');
    syncControls();

    section.addEventListener('input', (event) => {
      const input = event.target.closest('[data-dev-key]');
      if (!input) return;
      const key = input.dataset.devKey;
      setValue(key, input.value, { save: true, sync: false });
      section.querySelectorAll(`[data-dev-key="${key}"]`).forEach((peer) => {
        if (peer !== input) peer.value = String(values[key]);
      });
      syncTextarea();
      setStatus('Zmieniono — zapisano lokalnie.');
    });

    section.addEventListener('change', (event) => {
      const input = event.target.closest('[data-dev-key]');
      if (!input) return;
      setValue(input.dataset.devKey, input.value);
    });

    section.addEventListener('click', (event) => {
      const button = event.target.closest('[data-dev-action]');
      if (!button) return;
      const action = button.dataset.devAction;
      if (action === 'copy') copyJSON();
      if (action === 'apply-json') importJSON(textarea.value);
      if (action === 'refresh-json') { textarea.value = serialize(); setStatus('JSON odświeżony z bieżących wartości.'); }
      if (action === 'reset') reset();
    });
  }

  values = load();
  apply();
  mount();

  window.DurakDevLayout = {
    storageKey: STORAGE_KEY,
    version: VERSION,
    defaults: { ...defaults },
    get values() { return { ...values }; },
    set: setValue,
    apply,
    reset,
    exportJSON: serialize,
    importJSON,
  };
})();
