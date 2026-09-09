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
        ['handY', 'Pozycja Y ręki', '--dev-hand-y', -120, 80, 1, -29],
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
  let popup = null;
  let textarea = null;
  let statusNode = null;
  let dragState = null;

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
    if (!popup) return;
    for (const descriptor of descriptors.values()) {
      popup.querySelectorAll(`[data-dev-key="${descriptor.key}"]`).forEach((input) => {
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

  function resetValue(key) {
    const descriptor = descriptors.get(key);
    if (!descriptor) return false;
    setValue(key, descriptor.defaultValue);
    setStatus(`${descriptor.label}: przywrócono standard (${descriptor.defaultValue}).`);
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
    setStatus('Przywrócono wszystkie standardowe wartości DEV.');
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
      <button type="button" class="dev-layout-reset-one" data-dev-reset-key="${item.key}" title="Przywróć standard: ${item.defaultValue}" aria-label="Reset ${item.label} do ${item.defaultValue}">↺</button>
    </div>`;
  }

  function openPopup() {
    if (!popup) return;
    popup.classList.remove('hidden');
    document.getElementById('dev-layout-button')?.setAttribute('aria-expanded', 'true');
    syncControls();
  }

  function closePopup() {
    if (!popup) return;
    popup.classList.add('hidden');
    document.getElementById('dev-layout-button')?.setAttribute('aria-expanded', 'false');
  }

  function togglePopup() {
    if (!popup) return;
    if (popup.classList.contains('hidden')) openPopup();
    else closePopup();
  }

  function clampPopupPosition(left, top) {
    if (!popup) return { left, top };
    const rect = popup.getBoundingClientRect();
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - 54);
    return {
      left: Math.min(maxLeft, Math.max(margin, left)),
      top: Math.min(maxTop, Math.max(margin, top)),
    };
  }

  function resetPopupPosition() {
    if (!popup) return false;
    popup.style.left = '';
    popup.style.right = '';
    popup.style.top = '';
    popup.style.bottom = '';
    setStatus('Panel DEV wrócił do standardowej pozycji.');
    return true;
  }

  function startDrag(event) {
    if (!popup || event.button !== 0 || event.target.closest('button, input, textarea, select')) return;
    const rect = popup.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    popup.style.right = 'auto';
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.top}px`;
    popup.classList.add('is-dragging');
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event) {
    if (!popup || !dragState || event.pointerId !== dragState.pointerId) return;
    const next = clampPopupPosition(event.clientX - dragState.offsetX, event.clientY - dragState.offsetY);
    popup.style.left = `${next.left}px`;
    popup.style.top = `${next.top}px`;
  }

  function stopDrag(event) {
    if (!popup || !dragState || event.pointerId !== dragState.pointerId) return;
    dragState = null;
    popup.classList.remove('is-dragging');
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  function keepPopupOnScreen() {
    if (!popup || popup.classList.contains('hidden') || !popup.style.left) return;
    const rect = popup.getBoundingClientRect();
    const next = clampPopupPosition(rect.left, rect.top);
    popup.style.left = `${next.left}px`;
    popup.style.top = `${next.top}px`;
  }

  function mount() {
    if (document.getElementById('dev-layout-popup')) return;
    const topActions = document.querySelector('.top-actions');
    if (!topActions) return;

    const trigger = document.createElement('button');
    trigger.id = 'dev-layout-button';
    trigger.className = 'ghost-button dev-layout-button';
    trigger.type = 'button';
    trigger.textContent = 'DEV';
    trigger.setAttribute('aria-controls', 'dev-layout-popup');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.title = 'DEV · strojenie układu desktop';
    const settingsButton = topActions.querySelector('[data-action="open-settings"]');
    if (settingsButton) topActions.insertBefore(trigger, settingsButton);
    else topActions.appendChild(trigger);

    popup = document.createElement('aside');
    popup.id = 'dev-layout-popup';
    popup.className = 'dev-layout-popup hidden';
    popup.setAttribute('aria-label', 'DEV · Układ desktop');
    popup.innerHTML = `<header id="dev-layout-drag-handle" class="dev-layout-popup-head">
      <div><strong>DEV · Układ desktop</strong><small>LIVE · przeciągnij panel</small></div>
      <button id="dev-layout-close" type="button" aria-label="Zamknij DEV">×</button>
    </header>
    <div class="dev-layout-popup-body">
      <p class="dev-layout-note">Sterowanie działa dla desktopu ≥1181 px. Każde ↺ przywraca standard tylko dla danego parametru. Gra pozostaje aktywna, a ustawienia zapisują się lokalnie.</p>
      <div class="dev-layout-groups">
        ${groups.map((group) => `<section class="dev-layout-group"><h4>${group.title}</h4>${group.items.map((raw) => controlHTML(descriptors.get(raw[0]))).join('')}</section>`).join('')}
      </div>
      <textarea id="dev-layout-json" class="dev-layout-json" spellcheck="false" aria-label="DEV layout JSON"></textarea>
      <div class="dev-layout-actions">
        <button type="button" class="dev-primary" data-dev-action="copy">Kopiuj JSON</button>
        <button type="button" data-dev-action="apply-json">Zastosuj JSON</button>
        <button type="button" data-dev-action="refresh-json">Odśwież JSON</button>
        <button type="button" data-dev-action="reset-position">Reset pozycji panelu</button>
        <button type="button" class="dev-danger" data-dev-action="reset">Reset wszystko do standardu</button>
      </div>
      <small class="dev-layout-status" id="dev-layout-status" aria-live="polite"></small>
    </div>`;
    document.body.appendChild(popup);

    textarea = popup.querySelector('#dev-layout-json');
    statusNode = popup.querySelector('#dev-layout-status');
    syncControls();

    trigger.addEventListener('click', togglePopup);
    popup.querySelector('#dev-layout-close').addEventListener('click', closePopup);

    popup.addEventListener('input', (event) => {
      const input = event.target.closest('[data-dev-key]');
      if (!input) return;
      const key = input.dataset.devKey;
      setValue(key, input.value, { save: true, sync: false });
      popup.querySelectorAll(`[data-dev-key="${key}"]`).forEach((peer) => {
        if (peer !== input) peer.value = String(values[key]);
      });
      syncTextarea();
      setStatus('Zmieniono — zapisano lokalnie.');
    });

    popup.addEventListener('change', (event) => {
      const input = event.target.closest('[data-dev-key]');
      if (!input) return;
      setValue(input.dataset.devKey, input.value);
    });

    popup.addEventListener('click', (event) => {
      const resetOne = event.target.closest('[data-dev-reset-key]');
      if (resetOne) {
        resetValue(resetOne.dataset.devResetKey);
        return;
      }
      const button = event.target.closest('[data-dev-action]');
      if (!button) return;
      const action = button.dataset.devAction;
      if (action === 'copy') copyJSON();
      if (action === 'apply-json') importJSON(textarea.value);
      if (action === 'refresh-json') { textarea.value = serialize(); setStatus('JSON odświeżony z bieżących wartości.'); }
      if (action === 'reset-position') resetPopupPosition();
      if (action === 'reset') reset();
    });

    const handle = popup.querySelector('#dev-layout-drag-handle');
    handle.addEventListener('pointerdown', startDrag);
    handle.addEventListener('pointermove', moveDrag);
    handle.addEventListener('pointerup', stopDrag);
    handle.addEventListener('pointercancel', stopDrag);
    window.addEventListener('resize', keepPopupOnScreen);
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
    resetValue,
    resetPosition: resetPopupPosition,
    open: openPopup,
    close: closePopup,
    toggle: togglePopup,
    exportJSON: serialize,
    importJSON,
  };
})();