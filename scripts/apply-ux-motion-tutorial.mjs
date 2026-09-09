import fs from 'node:fs/promises';

async function read(path) { return fs.readFile(path, 'utf8'); }
async function write(path, value) { return fs.writeFile(path, value.replace(/\r\n/g, '\n'), 'utf8'); }
function replaceOnce(text, oldValue, newValue, label) {
  if (!text.includes(oldValue)) throw new Error(`Missing replacement target: ${label}`);
  return text.replace(oldValue, newValue);
}

let js = await read('game.js');

// Extend the existing tutorial copy with explicit goal / move / rationale labels.
js = replaceOnce(js,
  "  let activeLanguage = 'pl';",
  `  const COACH_GUIDE_COPY = {
    pl: {
      goalLabel: 'Cel', moveLabel: 'Zagraj / zrób', whyLabel: 'Dlaczego',
      goal: 'Pozbądź się wszystkich kart przed przeciwnikiem. Ostatni gracz z kartami zostaje Durniem.',
      moveCard: 'Zagraj {card}.', moveTake: 'Kliknij „Biorę”.', movePass: 'Zakończ dorzucanie.', moveWait: 'Obserwuj ruch przeciwnika.', moveEnd: 'Przejdź do następnego rozdania albo zakończ trening.',
      whyAttack: '{card} to najtańsza sensowna karta nieatutowa. Pozbywasz się słabej karty i zachowujesz atuty do obrony.',
      whyDefense: '{card} to najtańsza legalna karta, która przebija atak. Zachowujesz mocniejsze karty na trudniejsze obrony.',
      whyThrowIn: '{card} pasuje rangą do stołu i nie jest atutem, więc zwiększa koszt obrony przeciwnika bez marnowania cennej karty.',
    },
    en: {
      goalLabel: 'Goal', moveLabel: 'Play / do', whyLabel: 'Why',
      goal: 'Get rid of every card before your opponent. The last player still holding cards becomes the Fool.',
      moveCard: 'Play {card}.', moveTake: 'Choose “I take”.', movePass: 'Finish throwing in.', moveWait: 'Watch the opponent’s move.', moveEnd: 'Start the next round or end the practice game.',
      whyAttack: '{card} is the cheapest useful non-trump. You shed a weak card while saving trumps for defence.',
      whyDefense: '{card} is the cheapest legal card that beats the attack. Stronger cards stay available for harder defences.',
      whyThrowIn: '{card} matches a rank already on the table and is not a trump, so it raises the defender’s cost without wasting a valuable card.',
    },
    de: {
      goalLabel: 'Ziel', moveLabel: 'Spiele / mache', whyLabel: 'Warum',
      goal: 'Werde alle Karten vor deinem Gegner los. Wer zuletzt noch Karten hält, wird der Narr.',
      moveCard: 'Spiele {card}.', moveTake: 'Wähle „Ich nehme”.', movePass: 'Beende das Dazulegen.', moveWait: 'Beobachte den Zug des Gegners.', moveEnd: 'Starte die nächste Runde oder beende das Training.',
      whyAttack: '{card} ist die günstigste sinnvolle Nicht-Trumpfkarte. Du wirst eine schwache Karte los und sparst Trumpf für die Verteidigung.',
      whyDefense: '{card} ist die günstigste legale Karte, die den Angriff schlägt. Stärkere Karten bleiben für schwierigere Verteidigungen erhalten.',
      whyThrowIn: '{card} hat einen Rang, der bereits auf dem Tisch liegt, und ist kein Trumpf. So verteuerst du die Verteidigung ohne eine wertvolle Karte zu verschwenden.',
    },
    ru: {
      goalLabel: 'Цель', moveLabel: 'Сыграй / сделай', whyLabel: 'Почему',
      goal: 'Избавься от всех карт раньше соперника. Последний игрок с картами становится дураком.',
      moveCard: 'Сыграй {card}.', moveTake: 'Нажми «Беру».', movePass: 'Закончи подкидывание.', moveWait: 'Наблюдай за ходом соперника.', moveEnd: 'Начни следующий раунд или закончи тренировку.',
      whyAttack: '{card} — самая дешёвая подходящая некозырная карта. Ты избавляешься от слабой карты и сохраняешь козыри для защиты.',
      whyDefense: '{card} — самая дешёвая допустимая карта, которая отбивает атаку. Более сильные карты останутся для сложной защиты.',
      whyThrowIn: '{card} подходит по рангу к картам на столе и не является козырем, поэтому повышает цену защиты без потери ценной карты.',
    },
  };
  Object.entries(COACH_GUIDE_COPY).forEach(([language, copy]) => Object.assign(LANGUAGES[language].tutorial.coach, copy));

  let activeLanguage = 'pl';`,
  'tutorial guide copy');

// Add a stable player locator used by collection animation geometry.
js = replaceOnce(js,
  "      return `<div class=\"${classes.join(' ')}\">\n        <div class=\"nameplate\">",
  "      return `<div class=\"${classes.join(' ')}\" data-player-index=\"${index}\">\n        <div class=\"nameplate\">",
  'opponent data-player-index');

const oldRenderTable = `  function renderTable(state) {
    const root = el('table-cards');
    if (!root) return;
    root.classList.remove('collect-discard', 'collect-take');
    if (state.collecting === 'discard') root.classList.add('collect-discard');
    if (state.collecting === 'take') root.classList.add('collect-take');

    if (!state.table.length) {
      root.innerHTML = state.round > 0 ? \`<span class="table-empty">\${T('common.tableCards')}</span>\` : '';
      return;
    }
    const humanDefends = state.phase === 'defense' && state.defender === 0 && !state.transferMode;
    root.innerHTML = state.table.map((pair, index) => {
      const classes = ['table-pair'];
      if (!pair.defense) classes.push('unbeaten');
      if (humanDefends && !pair.defense && index === state.defenseTarget) classes.push('targeted');
      if (humanDefends && !pair.defense) classes.push('selectable');
      const attack = cardHTML(pair.attack, { static: true, className: \`attack-card\${pair.isNew ? ' table-enter' : ''}\` });
      const defense = pair.defense ? cardHTML(pair.defense, { static: true, className: \`defense-card\${pair.defenseNew ? ' table-enter' : ''}\` }) : '';
      return \`<div class="\${classes.join(' ')}" data-pair-index="\${index}">\${attack}\${defense}</div>\`;
    }).join('');
  }`;

const newRenderTable = `  function collectionTarget(state) {
    if (state.collecting === 'discard') {
      return { element: el('discard-zone')?.querySelector('.discard-stack'), name: 'discard' };
    }
    if (state.collecting === 'take') {
      if (state.defender === 0) return { element: document.querySelector('.human-hand-slot'), name: 'player-0' };
      return {
        element: document.querySelector(\`.bot-seat[data-player-index="\${state.defender}"] .bot-hand\`),
        name: \`player-\${state.defender}\`,
      };
    }
    return null;
  }

  function applyCollectionMotion(state, root) {
    const target = collectionTarget(state);
    if (!target?.element) {
      root.style.removeProperty('--collect-duration');
      return;
    }
    const targetRect = target.element.getBoundingClientRect();
    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    const duration = Math.round(500 * (D.SPEEDS[state.settings.speed] || 1));
    root.style.setProperty('--collect-duration', \`\${duration}ms\`);
    root.querySelectorAll('.table-pair').forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--collect-x', \`\${targetX - (rect.left + rect.width / 2)}px\`);
      node.style.setProperty('--collect-y', \`\${targetY - (rect.top + rect.height / 2)}px\`);
      node.style.setProperty('--collect-rotation', \`\${index % 2 ? -8 : 8}deg\`);
      node.dataset.collectTarget = target.name;
    });
  }

  function renderTable(state) {
    const root = el('table-cards');
    if (!root) return;
    const previousCardIds = new Set(
      Array.from(root.querySelectorAll('.card[data-card-id]'), (node) => node.dataset.cardId),
    );
    root.classList.remove('collect-discard', 'collect-take');
    if (state.collecting === 'discard') root.classList.add('collect-discard');
    if (state.collecting === 'take') root.classList.add('collect-take');

    if (!state.table.length) {
      root.innerHTML = state.round > 0 ? \`<span class="table-empty">\${T('common.tableCards')}</span>\` : '';
      root.style.removeProperty('--collect-duration');
      return;
    }
    const humanDefends = state.phase === 'defense' && state.defender === 0 && !state.transferMode;
    root.innerHTML = state.table.map((pair, index) => {
      const classes = ['table-pair'];
      if (!pair.defense) classes.push('unbeaten');
      if (humanDefends && !pair.defense && index === state.defenseTarget) classes.push('targeted');
      if (humanDefends && !pair.defense) classes.push('selectable');
      const attackEntering = !!pair.isNew && !previousCardIds.has(pair.attack.id);
      const defenseEntering = !!pair.defenseNew && !!pair.defense && !previousCardIds.has(pair.defense.id);
      const attack = cardHTML(pair.attack, { static: true, className: \`attack-card\${attackEntering ? ' table-enter' : ''}\` });
      const defense = pair.defense ? cardHTML(pair.defense, { static: true, className: \`defense-card\${defenseEntering ? ' table-enter' : ''}\` }) : '';
      return \`<div class="\${classes.join(' ')}" data-pair-index="\${index}">\${attack}\${defense}</div>\`;
    }).join('');
    if (state.collecting) applyCollectionMotion(state, root);
    else root.style.removeProperty('--collect-duration');
  }`;
js = replaceOnce(js, oldRenderTable, newRenderTable, 'renderTable motion');

// Give collection animation enough time to reach the actual destination at every speed.
js = replaceOnce(js, '    const delay = state.settings.animations ? pacedDelay(420) : 10;', '    const delay = state.settings.animations ? pacedDelay(520) : 10;', 'collection timer');

const oldRenderCoach = `    root.classList.remove('hidden');
    const coach = tutorial.coach;
    const rule = coach.rule ? \`<div class="coach-rule">\${coach.rule}</div>\` : '';
    root.innerHTML = \`<div class="coach-kicker"><small>\${T('tutorial.guided')}</small><span class="coach-round">\${T('tutorial.practice')} · \${state.round}</span></div>
      <b>\${coach.title}</b><p>\${coach.body}</p>\${rule}
      <div class="coach-actions"><button data-action="tutorial-exit" type="button">\${T('tutorial.exit')}</button></div>\`;
  }`;
const newRenderCoach = `    root.classList.remove('hidden');
    const coach = tutorial.coach;
    root.innerHTML = \`<div class="coach-kicker"><small>\${T('tutorial.guided')}</small><span class="coach-round">\${T('tutorial.practice')} · \${state.round}</span></div>
      <b>\${coach.title}</b>
      <div class="coach-plan">
        <div class="coach-step coach-goal"><small>\${T('tutorial.coach.goalLabel')}</small><p>\${coach.goal}</p></div>
        <div class="coach-step coach-move"><small>\${T('tutorial.coach.moveLabel')}</small><strong>\${coach.move}</strong></div>
        <div class="coach-step coach-why"><small>\${T('tutorial.coach.whyLabel')}</small><p>\${coach.why}</p></div>
      </div>
      <div class="coach-actions"><button data-action="tutorial-exit" type="button">\${T('tutorial.exit')}</button></div>\`;
  }`;
js = replaceOnce(js, oldRenderCoach, newRenderCoach, 'renderCoach structured guidance');

const oldUpdateCoach = `  function updateCoach() {
    if (!state.tutorial.active) {
      state.tutorial.coach = null;
      state.tutorial.hintCardId = null;
      return;
    }
    const hint = coachHint();
    state.tutorial.hintCardId = hint ? hint.id : null;
    const rule = hint ? T('tutorial.coach.hintPrefix', { card: R.cardLabel(hint) }) : '';
    let key = 'wait';
    if (state.phase === 'end') key = 'end';
    else if (state.round === 1 && state.phase === 'attack' && state.attacker === 0 && !state.table.length && !state.log.some((e) => e.key === 'log.attack')) key = 'intro';
    else if (state.phase === 'attack' && state.attacker === 0) key = 'attack';
    else if (state.phase === 'defense' && state.defender === 0) {
      const canTransfer = state.rules.transfer && R.transferOptions(state.hands[0], state.table).length
        && state.nextDefenderCount >= state.table.length + 1;
      key = canTransfer ? 'transfer' : 'defense';
    } else if (state.phase === 'throwin' && state.thrower === 0) {
      key = state.taking ? 'taking' : (state.attacker === 0 ? 'attackAgain' : 'throwIn');
    }
    state.tutorial.coach = {
      title: T(\`tutorial.coach.\${key}Title\`),
      body: T(\`tutorial.coach.\${key}\`),
      rule: key === 'wait' || key === 'end' || key === 'intro' ? '' : rule,
    };
  }`;

const newUpdateCoach = `  function coachMove(key, hint) {
    if (hint) return T('tutorial.coach.moveCard', { card: R.cardLabel(hint) });
    if (key === 'defense') return T('tutorial.coach.moveTake');
    if (['attackAgain', 'throwIn', 'taking'].includes(key)) return T('tutorial.coach.movePass');
    if (key === 'end') return T('tutorial.coach.moveEnd');
    return T('tutorial.coach.moveWait');
  }

  function coachWhy(key, hint, fallback) {
    if (!hint) return fallback;
    const vars = { card: R.cardLabel(hint) };
    if (key === 'defense' || key === 'transfer') return T('tutorial.coach.whyDefense', vars);
    if (['attackAgain', 'throwIn', 'taking'].includes(key)) return T('tutorial.coach.whyThrowIn', vars);
    return T('tutorial.coach.whyAttack', vars);
  }

  function updateCoach() {
    if (!state.tutorial.active) {
      state.tutorial.coach = null;
      state.tutorial.hintCardId = null;
      return;
    }
    const hint = coachHint();
    state.tutorial.hintCardId = hint ? hint.id : null;
    let key = 'wait';
    if (state.phase === 'end') key = 'end';
    else if (state.round === 1 && state.phase === 'attack' && state.attacker === 0 && !state.table.length && !state.log.some((e) => e.key === 'log.attack')) key = 'intro';
    else if (state.phase === 'attack' && state.attacker === 0) key = 'attack';
    else if (state.phase === 'defense' && state.defender === 0) {
      const canTransfer = state.rules.transfer && R.transferOptions(state.hands[0], state.table).length
        && state.nextDefenderCount >= state.table.length + 1;
      key = canTransfer ? 'transfer' : 'defense';
    } else if (state.phase === 'throwin' && state.thrower === 0) {
      key = state.taking ? 'taking' : (state.attacker === 0 ? 'attackAgain' : 'throwIn');
    }
    const body = T(\`tutorial.coach.\${key}\`);
    state.tutorial.coach = {
      title: T(\`tutorial.coach.\${key}Title\`),
      body,
      goal: T('tutorial.coach.goal'),
      move: coachMove(key, hint),
      why: coachWhy(key, hint, body),
    };
  }`;
js = replaceOnce(js, oldUpdateCoach, newUpdateCoach, 'updateCoach explicit goal move why');

await write('game.js', js);

let css = await read('game.css');
css = replaceOnce(css,
  `.coach-rule { margin:10px 0; padding:9px 10px; border-left:3px solid #d7ae52; border-radius:0 7px 7px 0; color:#e9e1c9; background:rgba(218,177,82,.09); font-size:11px; line-height:1.5; }`,
  `.coach-plan { display:grid; gap:7px; margin:10px 0 8px; }
.coach-step { padding:9px 10px; border:1px solid rgba(255,255,255,.08); border-radius:9px; background:rgba(255,255,255,.025); }
.coach-step small { display:block; margin-bottom:4px; }
.coach-step p { margin:0; color:#cbd6cf; font-size:11px; line-height:1.48; }
.coach-step strong { display:block; color:#f3e3ac; font-size:13px; line-height:1.4; }
.coach-move { border-color:rgba(220,181,92,.38); background:rgba(218,177,82,.08); }
.coach-why { border-left:3px solid #d7ae52; }`,
  'coach plan styles');

const oldAnimations = `.deal-card { animation: dealIn .5s cubic-bezier(.16,.78,.26,1) both; animation-delay: calc(var(--card-index, 0) * 55ms); }
.table-enter { animation: cardDrop .28s cubic-bezier(.2,.8,.3,1) both; }
.table-cards.collect-discard .table-pair { animation: collectRight .5s ease-in forwards; }
.table-cards.collect-take .table-pair { animation: collectDown .5s ease-in forwards; }
@keyframes dealIn { from { opacity:0; transform:translateY(-180px) scale(.6) rotate(-9deg); } to { opacity:1; transform:translateY(0) scale(1) rotate(0); } }
@keyframes cardDrop { from { opacity:.15; transform:translateY(-60px) scale(.86) rotate(6deg); } to { opacity:1; transform:translateY(0) scale(1) rotate(0); } }
@keyframes collectRight { to { transform:translate(320px,0) scale(.62) rotate(14deg); opacity:0; } }
@keyframes collectDown { to { transform:translate(0,300px) scale(.62) rotate(-8deg); opacity:0; } }`;
const newAnimations = `.deal-card { animation: dealIn .5s cubic-bezier(.16,.78,.26,1) both; animation-delay: calc(var(--card-index, 0) * 55ms); }
.table-enter { animation: cardDrop .28s cubic-bezier(.2,.8,.3,1) both; }
.table-cards.collect-discard .table-pair,
.table-cards.collect-take .table-pair {
  animation: collectToTarget var(--collect-duration,500ms) cubic-bezier(.32,0,.18,1) forwards;
  will-change: transform, opacity;
}
@keyframes dealIn { from { opacity:0; transform:translateY(-180px) scale(.6) rotate(-9deg); } to { opacity:1; transform:translateY(0) scale(1) rotate(0); } }
@keyframes cardDrop { from { opacity:.15; transform:translateY(-60px) scale(.86) rotate(6deg); } to { opacity:1; transform:translateY(0) scale(1) rotate(0); } }
@keyframes collectToTarget {
  0% { transform:translate(0,0) scale(1) rotate(0); opacity:1; }
  82% { opacity:1; }
  100% { transform:translate(var(--collect-x,0px),var(--collect-y,0px)) scale(.46) rotate(var(--collect-rotation,0deg)); opacity:0; }
}`;
css = replaceOnce(css, oldAnimations, newAnimations, 'collection animations');

css = replaceOnce(css,
  `/* ---------- Responsive ---------- */
@media (max-width: 1400px) {`,
  `/* ---------- Desktop table geometry ---------- */
@media (min-width: 1181px) {
  .human-hand-slot { transform:translateY(-17px); }
  .card { width:102px; height:145px; margin-left:-24px; }
  .table-pair, .table-pair .card { width:102px; height:145px; }
  .table-pair .card.defense-card { transform:translate(21px,22px) rotate(7deg); }
  .table-pair .card .corner b { font-size:18px; }
  .table-pair .card .corner i { font-size:16px; }
  .table-pair .card .pip { font-size:48px; }
  .bot-seat.slot-top { top:34px; }
  .bot-seat.slot-left { left:34px; top:34px; }
  .bot-seat.slot-right { right:34px; top:34px; }
}

/* ---------- Responsive ---------- */
@media (max-width: 1400px) {`,
  'desktop card and nameplate geometry');

await write('game.css', css);
console.log('Duren desktop motion/tutorial UX patch applied.');
