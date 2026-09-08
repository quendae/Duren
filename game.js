/* ============================================================
   DUREŃ — moduł 1: stałe i internacjonalizacja (i18n)
   ============================================================ */
(function () {
  const D = (window.Durak = window.Durak || {});

  D.SUITS = [
    { id: 'C', symbol: '♣' },
    { id: 'S', symbol: '♠' },
    { id: 'H', symbol: '♥' },
    { id: 'D', symbol: '♦' },
  ];
  D.RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  D.RANK_INDEX = D.RANKS.reduce((acc, rank, index) => { acc[rank] = index; return acc; }, {});
  D.BOT_NAMES = ['Basia', 'Marek', 'Zofia'];
  D.SPEEDS = { slow: 1.9, normal: 1, fast: 0.55 };

  const PL = {
    common: {
      you: 'Ty', close: 'Zamknij', cancel: 'Anuluj', done: 'Gotowe', back: 'Wstecz', next: 'Dalej',
      eyebrow: 'OFFLINE · KARTY · DURZEŃ', yourCards: 'Twoje karty', tableCards: 'Karty na stole',
      handHistory: 'Historia rozdania', roundSummary: 'PODSUMOWANIE ROZDANIA',
      cards: 'kart', deck: 'Talon', discard: 'Odbite', empty: 'pusty', none: '—',
      bot: 'Bot', player: 'Gracz', trumpSuit: 'Atut: {suit}',
    },
    menu: {
      eyebrow: 'OFFLINE · KARTY · DURZEŃ',
      subtitle: 'Klasyczny Durak · jeden gracz i do trzech botów',
      continue: 'Kontynuuj grę', continueOnline: 'Kontynuuj grę online', newGame: 'Nowa gra', online: 'Gra online', howToPlay: 'Jak grać', language: 'Język',
      saved: 'Zapisana partia: rozdanie {round} · {phase}', noSave: 'Brak zapisanej partii.',
    },
    top: {
      round: 'Rozdanie', deckLeft: 'Talon', trump: 'Atut', attacker: 'Atakuje', defender: 'Broni: {name}',
      speed: 'Tempo botów', options: 'Opcje', menu: 'Menu',
    },
    phase: {
      idle: 'Start', deal: 'Rozdanie kart', attack: 'Atak', defense: 'Obrona',
      throwin: 'Dorzucanie', taking: 'Zabieranie kart', refill: 'Dobieranie', end: 'Koniec rozdania',
    },
    helper: { eyebrow: 'PANEL STOŁU', title: 'Pomocnik', players: 'Gracze', log: 'Dziennik', rules: 'Zasady', phase: 'Aktualna faza' },
    seat: { attacker: 'Atakujący', defender: 'Obrońca', waiting: 'Czeka', out: 'Wyszedł z gry', thrower: 'Dorzuca', durak: 'Durzeń' },
    badge: { attack: 'ATAK', defend: 'OBRONA', out: 'WYSZEDŁ' },
    actions: {
      take: 'Biorę', bito: 'Bito — kończę atak', pass: 'Pas — nie dorzucam', transfer: 'Przerzucam',
      cancelTransfer: 'Anuluj przerzut', finishTake: 'Gotowe — oddaj karty', nextRound: 'Następne rozdanie',
      backToMenu: 'Wróć do menu', continue: 'Dalej', endTutorial: 'Zakończ samouczek', newGame: 'Nowa gra',
    },
    status: {
      yourAttack: 'Twój atak — zagraj dowolną kartę.',
      yourAttackAgain: 'Możesz dorzucić kartę o randze leżącej już na stole albo zakończyć atak.',
      yourDefense: 'Broń się — przebij kartę {card} albo kliknij „Biorę”.',
      yourDefenseMulti: 'Wybierz na stole kartę do przebicia, potem zagraj kartę z ręki.',
      yourThrowIn: 'Możesz dorzucić kartę o randze leżącej na stole albo spasować.',
      yourThrowInTake: '{name} bierze karty — możesz dorzucić jeszcze pasujące karty.',
      transferMode: 'Przerzucanie: zagraj kartę o randze {rank}, aby przekazać atak dalej.',
      waitBot: 'Ruch wykonuje {name}…',
      dealt: 'Rozdano po 6 kart. Atut: {suit}.',
      firstAttacker: '{name} ma najniższy atut i zaczyna atak.',
      roundOver: 'Rozdanie zakończone.',
    },
    tip: {
      attack: 'Atakujesz. Zwykle najlepiej zaczynać od najniższej karty bez atutu — atuty przydadzą się w obronie.',
      defense: 'Bijesz kartą wyższą w tym samym kolorze albo dowolnym atutem. Atut przebijesz tylko wyższym atutem.',
      throwin: 'Dorzucać można tylko karty o randze, która już leży na stole — z ataku lub z obrony.',
      taking: 'Gdy weźmiesz karty, w kolejnej turze nie atakujesz — atakuje gracz za Tobą.',
      transfer: 'Przerzut jest możliwy tylko wtedy, gdy jeszcze nic nie przebiłeś, a wszystkie karty ataku mają tę samą rangę.',
    },
    log: {
      newRound: '— Rozdanie {round}. Atut: {suit}. —',
      firstAttacker: '{name} zaczyna (najniższy atut).',
      attack: '{name} atakuje kartą {card}.',
      throwIn: '{name} dorzuca {card}.',
      beat: '{name} bije {attack} kartą {card}.',
      take: '{name} bierze karty ze stołu ({count}).',
      bito: 'Bito — {count} kart idzie na stos odrzuconych.',
      transfer: '{name} przerzuca atak kartą {card} na gracza {target}.',
      pass: '{name} pasuje.',
      draw: '{name} dobiera {count} kart z talonu.',
      deckEmpty: 'Talon jest pusty — dobieranie zakończone.',
      out: '{name} pozbywa się kart i wychodzi z gry.',
      durak: '{name} zostaje Durniem!',
      drawGame: 'Remis — nikt nie został Durniem.',
    },
    result: {
      durakTitleYou: 'Zostałeś Durniem', durakTitleBot: '{name} jest Durniem',
      durakBodyYou: 'Wszyscy inni pozbyli się kart wcześniej. W kolejnym rozdaniu spróbuj oszczędniej gospodarować atutami.',
      durakBodyBot: 'Pozbyłeś się kart przed {name}. Rozdanie należy do Ciebie.',
      drawTitle: 'Remis', drawBody: 'Wszyscy skończyli bez kart w tej samej turze — nikt nie zostaje Durniem.',
      score: 'Bilans: {wins} wygranych · {losses} przegranych · {draws} remisów',
      place: 'Kolejność wyjścia z gry: {order}',
    },
    settings: {
      eyebrow: 'USTAWIENIA GRY', title: 'Opcje', rules: 'Zasady', learning: 'Nauka i tempo',
      appearance: 'Wygląd', session: 'Sesja',
      throwInAll: 'Dorzucają wszyscy', throwInAllDesc: 'Gdy wyłączone, dorzuca tylko atakujący.',
      throwInAllLongDesc: 'Gdy wyłączone, dorzucać może wyłącznie gracz, który zaczął atak.',
      transfer: 'Przerzucanie (perewod)', transferDesc: 'Obrońca może przerzucić atak kartą tej samej rangi.',
      transferLongDesc: 'Obrońca, który jeszcze niczego nie przebił, może przerzucić atak dalej kartą tej samej rangi.',
      limitSix: 'Limit sześciu kart', limitSixDesc: 'Bez limitu atak trwa do wyczerpania ręki obrońcy.',
      limitSixLongDesc: 'Bez limitu atak może trwać aż do wyczerpania ręki obrońcy.',
      beginner: 'Tryb początkującego', beginnerDesc: 'Podpowiedzi w pasku akcji i podświetlanie legalnych kart.',
      speed: 'Tempo botów', speedDesc: 'Jak szybko boty wykonują swoje ruchy.',
      animations: 'Animacje kart', animationsDesc: 'Rozdawanie, kładzenie kart i zbieranie stołu.',
      sounds: 'Dźwięki stołu', soundsDesc: 'Subtelny odgłos zagrania i zebrania kart.',
      language: 'Język', languageDesc: 'Interfejs i podpowiedzi samouczka.',
      autoSave: 'Zapis rozgrywki', autoSaveDesc: 'Pozwala wrócić do przerwanej partii z menu głównego.',
      savedLocally: 'Ustawienia zapisują się lokalnie w przeglądarce.',
    },
    newGame: {
      eyebrow: 'NOWA SESJA', title: 'Ustaw nową grę',
      lead: 'Wybierz liczbę botów, ustaw każdemu z nich osobny poziom trudności i zdecyduj o zasadach dodatkowych.',
      table: 'Stół', botCount: 'Liczba botów', botCountDesc: 'Od jednego do trzech przeciwników komputerowych.',
      bots: 'Boty i poziomy trudności', rules: 'Zasady dodatkowe', start: 'Rozpocznij grę',
      botLabel: 'Bot {index}', botHint: 'Poziom wpływa na liczenie kart i ryzyko.',
    },
    difficulty: { easy: 'Łatwy', normal: 'Normalny', hard: 'Trudny', expert: 'Ekspert' },
    speed: { slow: 'Wolno', normal: 'Normalnie', fast: 'Szybko' },
    suits: { C: 'Trefl', S: 'Pik', H: 'Kier', D: 'Karo' },
    rulesText: {
      goalTitle: 'Cel gry',
      goal: 'Pozbądź się wszystkich kart. Gracz, który jako ostatni zostaje z kartami w ręce, zostaje Durniem i przegrywa rozdanie.',
      dealTitle: 'Talia i rozdanie',
      deal: 'Talia 36 kart (6–A). Każdy dostaje 6 kart. Pod talonem leży odkryta karta w poprzek — jej kolor jest atutem, a ona sama jest dobierana z talonu jako ostatnia.',
      attackTitle: 'Atak i obrona',
      attack: 'Atakujący kładzie kartę, a obrońca musi ją przebić kartą wyższą w tym samym kolorze albo dowolnym atutem. Kartę atutową bije tylko wyższy atut.',
      throwTitle: 'Dorzucanie',
      throw: 'Po pierwszej karcie ataku można dorzucać karty o randze, która już leży na stole. Liczba kart ataku nie przekracza sześciu ani liczby kart, jakie obrońca miał na początku tury.',
      takeTitle: 'Branie kart',
      take: 'Obrońca, który nie chce lub nie może bić, bierze wszystkie karty ze stołu. Wtedy w kolejnej turze atakuje gracz za nim. Przy udanej obronie karty idą na stos odrzuconych, a obrońca sam zostaje atakującym.',
      refillTitle: 'Dobieranie',
      refill: 'Po każdej turze wszyscy uzupełniają rękę do sześciu kart — najpierw atakujący, potem kolejni gracze, obrońca na końcu. Gdy talon jest pusty, gra toczy się kartami z rąk.',
      optionsTitle: 'Zasady dodatkowe',
      options: 'W opcjach można włączyć przerzucanie (perewod), ograniczyć dorzucanie tylko do atakującego oraz zdjąć limit sześciu kart w ataku.',
    },
    tutorial: {
      eyebrow: 'SAMOUCZEK KROK PO KROKU', back: 'Wstecz', next: 'Dalej', start: 'Rozpocznij rozgrywkę próbną',
      exit: 'Zakończ samouczek', close: 'Zamknij', step: 'Krok {step} z {total}', guided: 'ROZGRYWKA PRÓBNA',
      practice: 'Trening', title: 'Jak grać w Durniów',
      steps: [
        { icon: '♠', title: 'Cel gry', body: 'Dureń (Durak) to gra na wyścigi: nie zbiera się punktów, tylko pozbywa kart. Kto zostanie na końcu z kartami w ręce, gdy wszyscy inni już wyszli, zostaje Durniem i przegrywa rozdanie.' },
        { icon: '36', title: 'Talia i atut', body: 'Gramy talią 36 kart od szóstki do asa. Każdy dostaje 6 kart, reszta tworzy talon. Pod talonem leży odkryta karta w poprzek — jej kolor jest atutem na całe rozdanie, a ona sama jest dobierana z talonu jako ostatnia.' },
        { icon: '⚔', title: 'Kto zaczyna i jak atakuje', body: 'Rozdanie zaczyna gracz z najniższym atutem w ręce. Atakujący kładzie na stół dowolną kartę, a broni się gracz siedzący zaraz za nim.' },
        { icon: '⛨', title: 'Obrona', body: 'Kartę bije się kartą wyższą w tym samym kolorze albo dowolnym atutem. Kartę atutową można przebić wyłącznie wyższym atutem. Każda karta ataku wymaga osobnej karty obrony.' },
        { icon: '+', title: 'Dorzucanie', body: 'Gdy pierwsza karta ataku już leży, można dorzucać kolejne — ale tylko o randze, która jest już na stole (z ataku albo z obrony). Kart ataku nie może być więcej niż sześć ani więcej niż obrońca miał kart na początku tury.' },
        { icon: '✋', title: 'Biorę', body: 'Obrońca, który nie chce lub nie może bić, mówi „Biorę” i zabiera wszystkie karty ze stołu do ręki. Pozostali mogą wtedy dorzucić mu jeszcze pasujące karty. Kto wziął, w kolejnej turze nie atakuje — atakuje gracz za nim.' },
        { icon: '↺', title: 'Dobieranie i koniec', body: 'Po każdej turze wszyscy uzupełniają rękę do sześciu kart: najpierw atakujący, potem kolejni gracze, obrońca na końcu. Gdy talon się skończy, gra się tym, co zostało. Kto pozbędzie się kart, wychodzi z gry i jest bezpieczny.' },
        { icon: '▶', title: 'Rozgrywka próbna', body: 'Uruchomimy teraz spokojną partię jeden na jednego z przygotowanym rozdaniem. Dymek trenera powie, co zrobić w danej chwili, a proponowana karta zostanie podświetlona. Możesz jednak zagrać dowolny legalny ruch.' },
      ],
      coach: {
        introTitle: 'Rozgrywka próbna',
        intro: 'Grasz jeden na jednego z Basią. Atut tego rozdania widzisz w pasku u góry — karty w tym kolorze biją wszystko inne.',
        attackTitle: 'Twój atak',
        attack: 'Połóż kartę na stole. Podświetlona jest propozycja trenera: niska karta bez atutu, żeby zachować atuty na obronę.',
        attackAgainTitle: 'Możesz dorzucić',
        attackAgain: 'Na stole leży już karta o określonej randze. Możesz dorzucić kartę o tej samej randze albo zakończyć atak przyciskiem „Bito”.',
        defenseTitle: 'Twoja obrona',
        defense: 'Przebij kartę wyższą w tym samym kolorze albo atutem. Jeżeli to zbyt drogie, kliknij „Biorę” i zabierz karty ze stołu.',
        transferTitle: 'Możesz przerzucić',
        transfer: 'Masz kartę o tej samej randze co atak i jeszcze nic nie przebiłeś — możesz przerzucić atak na przeciwnika zamiast się bronić.',
        throwInTitle: 'Dorzucanie',
        throwIn: 'Możesz dorzucić kartę o randze leżącej na stole, żeby zmusić obrońcę do zużycia kolejnych kart. Albo spasuj.',
        takingTitle: 'Przeciwnik bierze',
        taking: 'Obrońca bierze karty. To dobra chwila, żeby dorzucić mu wszystko, co pasuje rangą i czego sam nie chcesz trzymać.',
        waitTitle: 'Obserwuj',
        wait: 'Teraz ruch przeciwnika. Popatrz, jakimi kartami się broni — to informacja o tym, co mu jeszcze zostało.',
        endTitle: 'Koniec rozdania',
        end: 'Rozdanie rozstrzygnięte. Możesz zagrać kolejne albo zakończyć samouczek i przejść do zwykłej gry.',
        hintPrefix: 'Propozycja trenera: {card}',
      },
    },
  };

  const EN = {
    common: {
      you: 'You', close: 'Close', cancel: 'Cancel', done: 'Done', back: 'Back', next: 'Next',
      eyebrow: 'OFFLINE · CARDS · THE FOOL', yourCards: 'Your cards', tableCards: 'Cards on the table',
      handHistory: 'Round history', roundSummary: 'ROUND SUMMARY',
      cards: 'cards', deck: 'Talon', discard: 'Discard', empty: 'empty', none: '—',
      bot: 'Bot', player: 'Player', trumpSuit: 'Trump: {suit}',
    },
    menu: {
      eyebrow: 'OFFLINE · CARDS · THE FOOL',
      subtitle: 'Classic Durak · one player and up to three bots',
      continue: 'Continue game', continueOnline: 'Continue online game', newGame: 'New game', online: 'Online game', howToPlay: 'How to play', language: 'Language',
      saved: 'Saved game: round {round} · {phase}', noSave: 'No saved game.',
    },
    top: {
      round: 'Round', deckLeft: 'Talon', trump: 'Trump', attacker: 'Attacking', defender: 'Defending: {name}',
      speed: 'Bot speed', options: 'Options', menu: 'Menu',
    },
    phase: {
      idle: 'Start', deal: 'Dealing', attack: 'Attack', defense: 'Defence',
      throwin: 'Throwing in', taking: 'Taking cards', refill: 'Drawing', end: 'Round over',
    },
    helper: { eyebrow: 'TABLE PANEL', title: 'Assistant', players: 'Players', log: 'Log', rules: 'Rules', phase: 'Current phase' },
    seat: { attacker: 'Attacker', defender: 'Defender', waiting: 'Waiting', out: 'Out of the game', thrower: 'Throwing in', durak: 'The Fool' },
    badge: { attack: 'ATTACK', defend: 'DEFENCE', out: 'OUT' },
    actions: {
      take: 'I take', bito: 'Done — end the attack', pass: 'Pass — no more cards', transfer: 'Pass it on',
      cancelTransfer: 'Cancel transfer', finishTake: 'Done — hand the cards over', nextRound: 'Next round',
      backToMenu: 'Back to menu', continue: 'Continue', endTutorial: 'End tutorial', newGame: 'New game',
    },
    status: {
      yourAttack: 'Your attack — play any card.',
      yourAttackAgain: 'You may add a card of a rank already on the table, or end the attack.',
      yourDefense: 'Defend — beat {card} or click “I take”.',
      yourDefenseMulti: 'Pick the card on the table you want to beat, then play a card from your hand.',
      yourThrowIn: 'You may add a card of a rank already on the table, or pass.',
      yourThrowInTake: '{name} is taking the cards — you may still add matching cards.',
      transferMode: 'Transfer: play a card of rank {rank} to pass the attack on.',
      waitBot: '{name} is thinking…',
      dealt: 'Six cards each. Trump: {suit}.',
      firstAttacker: '{name} holds the lowest trump and attacks first.',
      roundOver: 'The round is over.',
    },
    tip: {
      attack: 'You are attacking. Opening with a low non-trump usually pays off — keep trumps for defence.',
      defense: 'Beat with a higher card of the same suit or with any trump. A trump can only be beaten by a higher trump.',
      throwin: 'Only ranks already on the table may be added — from an attack card or from a defence card.',
      taking: 'After taking cards you do not attack next turn — the player after you does.',
      transfer: 'A transfer is only possible while you have beaten nothing yet and all attack cards share one rank.',
    },
    log: {
      newRound: '— Round {round}. Trump: {suit}. —',
      firstAttacker: '{name} starts (lowest trump).',
      attack: '{name} attacks with {card}.',
      throwIn: '{name} adds {card}.',
      beat: '{name} beats {attack} with {card}.',
      take: '{name} takes the cards from the table ({count}).',
      bito: 'Beaten — {count} cards go to the discard pile.',
      transfer: '{name} passes the attack on with {card} to {target}.',
      pass: '{name} passes.',
      draw: '{name} draws {count} cards from the talon.',
      deckEmpty: 'The talon is empty — no more drawing.',
      out: '{name} runs out of cards and leaves the game.',
      durak: '{name} is the Fool!',
      drawGame: 'A draw — nobody is the Fool.',
    },
    result: {
      durakTitleYou: 'You are the Fool', durakTitleBot: '{name} is the Fool',
      durakBodyYou: 'Everyone else ran out of cards first. Next round, try to spend your trumps more carefully.',
      durakBodyBot: 'You got rid of your cards before {name}. The round is yours.',
      drawTitle: 'Draw', drawBody: 'Everyone finished without cards in the same turn — nobody is the Fool.',
      score: 'Record: {wins} won · {losses} lost · {draws} drawn',
      place: 'Order of leaving the game: {order}',
    },
    settings: {
      eyebrow: 'GAME SETTINGS', title: 'Options', rules: 'Rules', learning: 'Learning and pace',
      appearance: 'Appearance', session: 'Session',
      throwInAll: 'Everyone may add cards', throwInAllDesc: 'When off, only the attacker may add cards.',
      throwInAllLongDesc: 'When off, only the player who opened the attack may add more cards.',
      transfer: 'Transfer (perevodnoy)', transferDesc: 'The defender may pass the attack on with a card of the same rank.',
      transferLongDesc: 'A defender who has not beaten anything yet may pass the attack on with a card of the same rank.',
      limitSix: 'Six-card limit', limitSixDesc: 'Without the limit the attack runs until the defender is out of cards.',
      limitSixLongDesc: 'Without the limit the attack may run until the defender has no cards left.',
      beginner: 'Beginner mode', beginnerDesc: 'Hints in the action bar and highlighted legal cards.',
      speed: 'Bot speed', speedDesc: 'How quickly the bots make their moves.',
      animations: 'Card animations', animationsDesc: 'Dealing, placing cards and clearing the table.',
      sounds: 'Table sounds', soundsDesc: 'A subtle click when cards are played and collected.',
      language: 'Language', languageDesc: 'Interface and tutorial hints.',
      autoSave: 'Save the game', autoSaveDesc: 'Lets you return to an interrupted game from the main menu.',
      savedLocally: 'Settings are stored locally in your browser.',
    },
    newGame: {
      eyebrow: 'NEW SESSION', title: 'Set up a new game',
      lead: 'Choose how many bots play, give each of them its own difficulty, and pick the optional rules.',
      table: 'Table', botCount: 'Number of bots', botCountDesc: 'From one to three computer opponents.',
      bots: 'Bots and difficulty levels', rules: 'Optional rules', start: 'Start the game',
      botLabel: 'Bot {index}', botHint: 'The level affects card counting and risk taking.',
    },
    difficulty: { easy: 'Easy', normal: 'Normal', hard: 'Hard', expert: 'Expert' },
    speed: { slow: 'Slow', normal: 'Normal', fast: 'Fast' },
    suits: { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' },
    rulesText: {
      goalTitle: 'Goal of the game',
      goal: 'Get rid of all your cards. The player left holding cards when everyone else is out becomes the Fool and loses the round.',
      dealTitle: 'Deck and deal',
      deal: 'A 36-card deck (6–A). Everyone gets six cards. One card lies face up crosswise under the talon — its suit is trump for the whole round and it is the last card drawn from the talon.',
      attackTitle: 'Attack and defence',
      attack: 'The attacker plays a card and the defender must beat it with a higher card of the same suit or with any trump. A trump card can only be beaten by a higher trump.',
      throwTitle: 'Throwing in',
      throw: 'Once the first attack card is down, cards of a rank already on the table may be added. The attack never exceeds six cards, nor the number of cards the defender held at the start of the turn.',
      takeTitle: 'Taking cards',
      take: 'A defender who will not or cannot beat takes every card from the table. The next attacker is then the player after them. After a successful defence the cards are discarded and the defender becomes the next attacker.',
      refillTitle: 'Drawing',
      refill: 'After every turn hands are refilled to six cards — the attacker first, then the others in order, the defender last. Once the talon is empty, play continues with the cards in hand.',
      optionsTitle: 'Optional rules',
      options: 'The options screen can enable transfers (perevodnoy), restrict adding cards to the attacker only, and remove the six-card limit on an attack.',
    },
    tutorial: {
      eyebrow: 'STEP-BY-STEP TUTORIAL', back: 'Back', next: 'Next', start: 'Start the practice game',
      exit: 'End tutorial', close: 'Close', step: 'Step {step} of {total}', guided: 'PRACTICE GAME',
      practice: 'Practice', title: 'How to play Durak',
      steps: [
        { icon: '♠', title: 'Goal of the game', body: 'Durak is a race, not a point-scoring game: you get rid of cards instead of collecting them. Whoever is left holding cards when everyone else is out becomes the Fool and loses the round.' },
        { icon: '36', title: 'Deck and trump', body: 'The game uses 36 cards from six to ace. Everyone receives six cards and the rest forms the talon. One card lies face up crosswise under the talon — its suit is trump for the whole round and it is the last card drawn.' },
        { icon: '⚔', title: 'Who starts and how to attack', body: 'The player holding the lowest trump starts the round. The attacker puts any card on the table and the player sitting right after them defends.' },
        { icon: '⛨', title: 'Defence', body: 'You beat a card with a higher card of the same suit or with any trump. A trump card can only be beaten by a higher trump. Every attack card needs its own defence card.' },
        { icon: '+', title: 'Throwing in', body: 'Once the first attack card is down, more cards may be added — but only of a rank already on the table, from an attack card or a defence card. The attack never exceeds six cards, nor the defender’s hand size at the start of the turn.' },
        { icon: '✋', title: 'Taking', body: 'A defender who will not or cannot beat says “I take” and picks up every card from the table. The others may add more matching cards first. Whoever takes does not attack next turn — the player after them does.' },
        { icon: '↺', title: 'Drawing and finishing', body: 'After every turn hands are refilled to six: the attacker first, then the others in order, the defender last. Once the talon is empty you play with what is left. A player who runs out of cards leaves the game and is safe.' },
        { icon: '▶', title: 'Practice game', body: 'We will now start a calm one-on-one game with a prepared deal. The coach bubble tells you what to do at each moment and highlights a suggested card — but any legal move is allowed.' },
      ],
      coach: {
        introTitle: 'Practice game',
        intro: 'You are playing one on one against Basia. The trump suit for this round is shown in the top bar — cards of that suit beat everything else.',
        attackTitle: 'Your attack',
        attack: 'Put a card on the table. The highlighted card is the coach’s suggestion: a low non-trump, so your trumps stay for defence.',
        attackAgainTitle: 'You may add a card',
        attackAgain: 'A rank is already on the table. You can add another card of the same rank or end the attack with “Done”.',
        defenseTitle: 'Your defence',
        defense: 'Beat with a higher card of the same suit or with a trump. If that is too expensive, click “I take” and pick the cards up.',
        transferTitle: 'You may pass it on',
        transfer: 'You hold a card of the same rank as the attack and have beaten nothing yet — you can pass the attack to your opponent instead of defending.',
        throwInTitle: 'Throwing in',
        throwIn: 'You may add a card of a rank on the table to force the defender to spend more cards. Or simply pass.',
        takingTitle: 'The opponent takes',
        taking: 'The defender is taking the cards. This is a good moment to hand over everything that matches a rank and that you do not want to keep.',
        waitTitle: 'Watch',
        wait: 'It is the opponent’s move. Watch which cards they defend with — that tells you what they still hold.',
        endTitle: 'Round over',
        end: 'The round has been decided. You can play another one or end the tutorial and switch to a normal game.',
        hintPrefix: 'Coach suggests: {card}',
      },
    },
  };

  const LANGUAGES = {
    pl: PL,
    en: EN,
    de: {
      common: {
        you: 'Du', close: 'Schließen', cancel: 'Abbrechen', done: 'Fertig', back: 'Zurück', next: 'Weiter',
        eyebrow: 'OFFLINE · KARTEN · DER NARR', yourCards: 'Deine Karten', tableCards: 'Karten auf dem Tisch',
        handHistory: 'Rundenhistorie', roundSummary: 'RUNDENÜBERSICHT',
        cards: 'Karten', deck: 'Talon', discard: 'Ablage', empty: 'leer', none: '—',
        bot: 'Bot', player: 'Spieler', trumpSuit: 'Trumpf: {suit}',
      },
      menu: {
        eyebrow: 'OFFLINE · KARTEN · DER NARR',
        subtitle: 'Klassisches Durak · ein Spieler und bis zu drei Bots',
        continue: 'Spiel fortsetzen', continueOnline: 'Online-Spiel fortsetzen', newGame: 'Neues Spiel', online: 'Online spielen', howToPlay: 'Spielanleitung', language: 'Sprache',
        saved: 'Gespeichertes Spiel: Runde {round} · {phase}', noSave: 'Kein gespeichertes Spiel.',
      },
      top: {
        round: 'Runde', deckLeft: 'Talon', trump: 'Trumpf', attacker: 'Angreift', defender: 'Verteidigt: {name}',
        speed: 'Bot-Tempo', options: 'Optionen', menu: 'Menü',
      },
      phase: {
        idle: 'Start', deal: 'Geben', attack: 'Angriff', defense: 'Verteidigung',
        throwin: 'Dazulegen', taking: 'Karten nehmen', refill: 'Nachziehen', end: 'Runde beendet',
      },
      helper: { eyebrow: 'TISCHPANEL', title: 'Assistent', players: 'Spieler', log: 'Log', rules: 'Regeln', phase: 'Aktuelle Phase' },
      seat: { attacker: 'Angreifer', defender: 'Verteidiger', waiting: 'Wartet', out: 'Aus dem Spiel', thrower: 'Legt dazu', durak: 'Der Narr' },
      badge: { attack: 'ANGRIFF', defend: 'VERTEIDIGUNG', out: 'AUS' },
      actions: {
        take: 'Ich nehme', bito: 'Fertig — Angriff beenden', pass: 'Passe — keine Karten mehr', transfer: 'Übergeben',
        cancelTransfer: 'Übergabe abbrechen', finishTake: 'Fertig — Karten übergeben', nextRound: 'Nächste Runde',
        backToMenu: 'Zurück zum Menü', continue: 'Fortsetzen', endTutorial: 'Anleitung beenden', newGame: 'Neues Spiel',
      },
      status: {
        yourAttack: 'Dein Angriff — spiele eine beliebige Karte.',
        yourAttackAgain: 'Du kannst eine Karte des gleichen Ranges wie auf dem Tisch hinzufügen oder den Angriff beenden.',
        yourDefense: 'Verteidge — schlage {card} oder klicke „Ich nehme”.',
        yourDefenseMulti: 'Wähle die Karte auf dem Tisch, die du schlagen möchtest, dann spiele eine Karte aus deiner Hand.',
        yourThrowIn: 'Du kannst eine Karte des gleichen Ranges wie auf dem Tisch hinzufügen oder passen.',
        yourThrowInTake: '{name} nimmt die Karten — du kannst noch passende Karten hinzufügen.',
        transferMode: 'Übergabe: Spiele eine Karte des Ranges {rank}, um den Angriff zu übergeben.',
        waitBot: '{name} überlegt…',
        dealt: 'Je sechs Karten. Trumpf: {suit}.',
        firstAttacker: '{name} hat den niedrigsten Trumpf und greift zuerst an.',
        roundOver: 'Die Runde ist beendet.',
      },
      tip: {
        attack: 'Du greifst an. Mit einer niedrigen Karte ohne Trumpf zu eröffnen zahlt sich meist aus — bewahre Trumpfe für die Verteidigung auf.',
        defense: 'Schlag mit einer höheren Karte derselben Farbe oder mit einem beliebigen Trumpf. Ein Trumpf kann nur durch einen höheren Trumpf geschlagen werden.',
        throwin: 'Nur Ränge, die bereits auf dem Tisch liegen, können hinzugefügt werden — von einer Angriffskarte oder einer Verteidigungskarte.',
        taking: 'Nach dem Kartennehmen greifst du nächste Runde nicht an — der Spieler nach dir.',
        transfer: 'Eine Übergabe ist nur möglich, wenn du noch nichts geschlagen hast und alle Angriffskarten einen Rang haben.',
      },
      log: {
        newRound: '— Runde {round}. Trumpf: {suit}. —',
        firstAttacker: '{name} beginnt (niedrigster Trumpf).',
        attack: '{name} greift mit {card} an.',
        throwIn: '{name} legt {card} dazu.',
        beat: '{name} schlägt {attack} mit {card}.',
        take: '{name} nimmt die Karten vom Tisch ({count}).',
        bito: 'Geschlagen — {count} Karten gehen auf den Ablagestapel.',
        transfer: '{name} übergibt den Angriff mit {card} an {target}.',
        pass: '{name} passt.',
        draw: '{name} zieht {count} Karten aus dem Talon.',
        deckEmpty: 'Der Talon ist leer — nicht mehr ziehen.',
        out: '{name} geht die Karten aus und verlässt das Spiel.',
        durak: '{name} ist der Narr!',
        drawGame: 'Unentschieden — niemand ist der Narr.',
      },
      result: {
        durakTitleYou: 'Du bist der Narr', durakTitleBot: '{name} ist der Narr',
        durakBodyYou: 'Alle anderen sind zuerst ohne Karten weggegangen. Versuche nächste Runde, deine Trumpfe vorsichtiger einzusetzen.',
        durakBodyBot: 'Du hast deine Karten vor {name} weggebracht. Diese Runde ist deine.',
        drawTitle: 'Unentschieden', drawBody: 'Alle sind in derselben Runde ohne Karten fertig geworden — niemand ist der Narr.',
        score: 'Bilanz: {wins} gewonnen · {losses} verloren · {draws} unentschieden',
        place: 'Reihenfolge beim Ausscheiden: {order}',
      },
      settings: {
        eyebrow: 'SPIELEINSTELLUNGEN', title: 'Optionen', rules: 'Regeln', learning: 'Lernen und Tempo',
        appearance: 'Erscheinungsbild', session: 'Sitzung',
        throwInAll: 'Alle dürfen Karten hinzufügen', throwInAllDesc: 'Wenn aus, darf nur der Angreifer Karten hinzufügen.',
        throwInAllLongDesc: 'Wenn aus, darf nur der Spieler, der den Angriff eröffnet hat, weitere Karten hinzufügen.',
        transfer: 'Übergabe (Perevodnoy)', transferDesc: 'Der Verteidiger darf den Angriff mit einer Karte des gleichen Ranges weitergeben.',
        transferLongDesc: 'Ein Verteidiger, der noch nichts geschlagen hat, darf den Angriff mit einer Karte des gleichen Ranges weitergeben.',
        limitSix: 'Sechser-Limit', limitSixDesc: 'Ohne das Limit läuft der Angriff, bis der Verteidiger keine Karten mehr hat.',
        limitSixLongDesc: 'Ohne das Limit kann der Angriff laufen, bis der Verteidiger keine Karten mehr hat.',
        beginner: 'Anfängermodus', beginnerDesc: 'Hinweise in der Aktionsleiste und hervorgehobene legale Karten.',
        speed: 'Bot-Tempo', speedDesc: 'Wie schnell die Bots ihre Züge machen.',
        animations: 'Kartenbewegungen', animationsDesc: 'Austeilen, Kartenlegen und Tisch leeren.',
        sounds: 'Tischgeräusche', soundsDesc: 'Ein subtiles Klicken, wenn Karten gespielt und gesammelt werden.',
        language: 'Sprache', languageDesc: 'Benutzeroberfläche und Anleitungshinweise.',
        autoSave: 'Spiel speichern', autoSaveDesc: 'Ermöglicht dir, zu einem unterbrochenen Spiel aus dem Hauptmenü zurückzukehren.',
        savedLocally: 'Einstellungen werden lokal in deinem Browser gespeichert.',
      },
      newGame: {
        eyebrow: 'NEUE SITZUNG', title: 'Richte ein neues Spiel ein',
        lead: 'Wähle, wie viele Bots spielen, gib jedem seine eigene Schwierigkeit und wähle die optionalen Regeln.',
        table: 'Tisch', botCount: 'Anzahl der Bots', botCountDesc: 'Von einem bis zu drei Computerantagonisten.',
        bots: 'Bots und Schwierigkeitsstufen', rules: 'Optionale Regeln', start: 'Spiel starten',
        botLabel: 'Bot {index}', botHint: 'Die Stufe beeinflusst Kartenrechnung und Risikobereitschaft.',
      },
      difficulty: { easy: 'Leicht', normal: 'Normal', hard: 'Schwer', expert: 'Experte' },
      speed: { slow: 'Langsam', normal: 'Normal', fast: 'Schnell' },
      suits: { C: 'Trefl', S: 'Pik', H: 'Herz', D: 'Karo' },
      rulesText: {
        goalTitle: 'Ziel des Spiels',
        goal: 'Werde dich all deiner Karten entledigt. Der Spieler, der mit Karten in der Hand übrigbleibt, wenn alle anderen weg sind, wird der Narr und verliert die Runde.',
        dealTitle: 'Talon und Ausgabe',
        deal: 'Ein 36er-Blatt (6–A). Jeder Spieler bekommt sechs Karten. Eine Karte liegt offen quer unter dem Talon — ihre Farbe ist der Trumpf für die ganze Runde und es ist die letzte Karte, die aus dem Talon gezogen wird.',
        attackTitle: 'Angriff und Verteidigung',
        attack: 'Der Angreifer spielt eine Karte und der Verteidiger muss sie mit einer höheren Karte derselben Farbe oder mit einem beliebigen Trumpf schlagen. Ein Trumpf kann nur durch einen höheren Trumpf geschlagen werden.',
        throwTitle: 'Dazulegen',
        throw: 'Sobald die erste Angriffskarte liegt, können Karten des gleichen Ranges hinzugefügt werden. Der Angriff überschreitet niemals sechs Karten und nicht die Anzahl der Karten, die der Verteidiger zu Beginn des Zuges hatte.',
        takeTitle: 'Kartennehmen',
        take: 'Ein Verteidiger, der nicht oder nicht kann schlagen, nimmt alle Karten vom Tisch. Der nächste Angreifer ist dann der Spieler nach ihm. Nach erfolgreicher Verteidigung werden die Karten verworfen und der Verteidiger wird der nächste Angreifer.',
        refillTitle: 'Nachziehen',
        refill: 'Nach jedem Zug werden alle Hände auf sechs Karten aufgefüllt — erst der Angreifer, dann die anderen der Reihe nach, der Verteidiger zuletzt. Wenn der Talon leer ist, wird mit den verbleibenden Karten weitergespielt.',
        optionsTitle: 'Optionale Regeln',
        options: 'Im Optionsmenü können Übergaben (Perevodnoy) aktiviert, das Dazulegen auf nur den Angreifer beschränkt und die Sechser-Grenze für einen Angriff entfernt werden.',
      },
      tutorial: {
        eyebrow: 'SCHRITT-FÜR-SCHRITT-ANLEITUNG', back: 'Zurück', next: 'Weiter', start: 'Beginne das Übungsspiel',
        exit: 'Anleitung beenden', close: 'Schließen', step: 'Schritt {step} von {total}', guided: 'ÜBUNGSSPIEL',
        practice: 'Üben', title: 'Wie man Durak spielt',
        steps: [
          { icon: '♠', title: 'Ziel des Spiels', body: 'Durak ist ein Wettrennen, keine Punktespiel: Du wirst deine Karten los statt sie zu sammeln. Wer mit Karten in der Hand übrigbleibt, wenn alle anderen weg sind, wird der Narr und verliert die Runde.' },
          { icon: '36', title: 'Talon und Trumpf', body: 'Das Spiel verwendet 36 Karten von Sechs bis Ass. Jeder Spieler bekommt sechs Karten und der Rest bildet den Talon. Eine Karte liegt offen quer unter dem Talon — ihre Farbe ist Trumpf für die ganze Runde und es ist die letzte gezogene Karte.' },
          { icon: '⚔', title: 'Wer beginnt und wie man angreift', body: 'Der Spieler mit dem niedrigsten Trumpf beginnt die Runde. Der Angreifer legt eine beliebige Karte auf den Tisch und der Spieler direkt danach verteidigt.' },
          { icon: '⛨', title: 'Verteidigung', body: 'Du schlägst eine Karte mit einer höheren Karte derselben Farbe oder mit einem beliebigen Trumpf. Ein Trumpf kann nur durch einen höheren Trumpf geschlagen werden. Jede Angriffskarte braucht ihre eigene Verteidigungskarte.' },
          { icon: '+', title: 'Dazulegen', body: 'Sobald die erste Angriffskarte liegt, können mehr Karten hinzugefügt werden — aber nur Ränge, die bereits auf dem Tisch liegen, von einer Angriffskarte oder einer Verteidigungskarte. Der Angriff übersteigt niemals sechs Karten und nicht die Handgröße des Verteidigers zu Beginn des Zuges.' },
          { icon: '✋', title: 'Nehmen', body: 'Ein Verteidiger, der nicht oder nicht kann schlagen, sagt „Ich nehme” und nimmt alle Karten vom Tisch auf. Die anderen dürfen zuerst noch passende Karten hinzufügen. Wer nimmt, greift in der nächsten Runde nicht an — der Spieler nach ihm.' },
          { icon: '↺', title: 'Nachziehen und beenden', body: 'Nach jedem Zug werden alle Hände auf sechs aufgefüllt: erst der Angreifer, dann die anderen der Reihe nach, der Verteidiger zuletzt. Wenn der Talon leer ist, spielst du mit den verbleibenden Karten. Ein Spieler, der keine Karten mehr hat, verlässt das Spiel und ist sicher.' },
          { icon: '▶', title: 'Übungsspiel', body: 'Wir werden jetzt ein ruhiges Spiel eins gegen eins mit vorbereitetem Deal starten. Die Coach-Blase sagt dir in jedem Moment, was du tun musst, und hebt eine vorgeschlagene Karte hervor — aber jeder legale Zug ist erlaubt.' },
        ],
        coach: {
          introTitle: 'Übungsspiel',
          intro: 'Du spielst eins gegen eins gegen Basia. Die Trumpffarbe für diese Runde wird in der oberen Leiste angezeigt — Karten dieser Farbe schlagen alles andere.',
          attackTitle: 'Dein Angriff',
          attack: 'Lege eine Karte auf den Tisch. Die hervorgehobene Karte ist der Vorschlag des Trainers: eine niedrige Karte ohne Trumpf, damit deine Trumpfe zur Verteidigung bleiben.',
          attackAgainTitle: 'Du kannst eine Karte hinzufügen',
          attackAgain: 'Ein Rang liegt bereits auf dem Tisch. Du kannst eine weitere Karte dieses Ranges hinzufügen oder den Angriff mit „Fertig” beenden.',
          defenseTitle: 'Deine Verteidigung',
          defense: 'Schlag mit einer höheren Karte derselben Farbe oder mit einem Trumpf. Wenn das zu teuer ist, klicke „Ich nehme” und nimm die Karten auf.',
          transferTitle: 'Du kannst übertragen',
          transfer: 'Du hältst eine Karte des gleichen Ranges wie der Angriff und hast noch nichts geschlagen — du kannst den Angriff an deinen Gegner übergeben statt dich zu verteidigen.',
          throwInTitle: 'Dazulegen',
          throwIn: 'Du kannst eine Karte des Ranges auf dem Tisch hinzufügen, um den Verteidiger zu zwingen, mehr Karten auszugeben. Oder einfach passen.',
          takingTitle: 'Der Gegner nimmt',
          taking: 'Der Verteidiger nimmt die Karten. Das ist eine gute Gelegenheit, alles zu übergeben, das einen Rang passt und das du nicht behalten möchtest.',
          waitTitle: 'Beobachten',
          wait: 'Es ist der Zug deines Gegners. Beobachte, mit welchen Karten er sich verteidigt — das sagt dir, was er noch hält.',
          endTitle: 'Runde beendet',
          end: 'Die Runde ist entschieden. Du kannst eine weitere spielen oder die Anleitung beenden und zu einem normalen Spiel wechseln.',
          hintPrefix: 'Trainer schlägt vor: {card}',
        },
      },
    },
    ru: {
      common: {
        you: 'Ты', close: 'Закрыть', cancel: 'Отмена', done: 'Готово', back: 'Назад', next: 'Дальше',
        eyebrow: 'ОФЛАЙН · КАРТЫ · ДУРАК', yourCards: 'Твои карты', tableCards: 'Карты на столе',
        handHistory: 'История раунда', roundSummary: 'ИТОГ РАУНДА',
        cards: 'карт', deck: 'Колода', discard: 'Сброс', empty: 'пусто', none: '—',
        bot: 'Бот', player: 'Игрок', trumpSuit: 'Козырь: {suit}',
      },
      menu: {
        eyebrow: 'ОФЛАЙН · КАРТЫ · ДУРАК',
        subtitle: 'Классический Дурак · один игрок и до трёх ботов',
        continue: 'Продолжить игру', continueOnline: 'Продолжить онлайн-игру', newGame: 'Новая игра', online: 'Игра онлайн', howToPlay: 'Как играть', language: 'Язык',
        saved: 'Сохранённая игра: раунд {round} · {phase}', noSave: 'Нет сохранённых игр.',
      },
      top: {
        round: 'Раунд', deckLeft: 'Колода', trump: 'Козырь', attacker: 'Бьёт', defender: 'Кроет: {name}',
        speed: 'Скорость ботов', options: 'Параметры', menu: 'Меню',
      },
      phase: {
        idle: 'Старт', deal: 'Раздача', attack: 'Удар', defense: 'Кроется',
        throwin: 'Подкидывание', taking: 'Берёшь карты', refill: 'Добор', end: 'Раунд окончен',
      },
      helper: { eyebrow: 'ПАНЕЛЬ СТОЛА', title: 'Помощник', players: 'Игроки', log: 'Лог', rules: 'Правила', phase: 'Текущий этап' },
      seat: { attacker: 'Бьющий', defender: 'Крующий', waiting: 'Ждёт', out: 'Вышел из игры', thrower: 'Подкидывает', durak: 'Дурак' },
      badge: { attack: 'БЬЮ', defend: 'КРОЮ', out: 'ВЫШЕЛ' },
      actions: {
        take: 'Беру', bito: 'Бито — закончить удар', pass: 'Пас — больше нет карт', transfer: 'Переводной',
        cancelTransfer: 'Отменить переводной', finishTake: 'Беру — отдать карты', nextRound: 'Следующий раунд',
        backToMenu: 'В главное меню', continue: 'Продолжить', endTutorial: 'Закончить обучение', newGame: 'Новая игра',
      },
      status: {
        yourAttack: 'Твой удар — играй любую карту.',
        yourAttackAgain: 'Ты можешь подкинуть карту того же ранга, который на столе, или закончить удар.',
        yourDefense: 'Крой — отбей {card} или нажми «Беру».',
        yourDefenseMulti: 'Выбери карту на столе, которую ты хочешь отбить, потом играй карту из своей руки.',
        yourThrowIn: 'Ты можешь подкинуть карту того же ранга, который на столе, или пасовать.',
        yourThrowInTake: '{name} берёт карты — ты можешь подкинуть ещё подходящих карт.',
        transferMode: 'Переводной: сыграй карту ранга {rank}, чтобы перевести удар.',
        waitBot: '{name} думает…',
        dealt: 'По шесть карт. Козырь: {suit}.',
        firstAttacker: '{name} держит самый низкий козырь и ходит первым.',
        roundOver: 'Раунд окончен.',
      },
      tip: {
        attack: 'Ты ходишь. Начинать с малой не козыря — хороший ход, берегите козыри для защиты.',
        defense: 'Отбивай старшей картой той же масти или козырём. Козырь бьётся только старшим козырём.',
        throwin: 'Подкидывать можно только карты тех рангов, которые уже на столе — от удара или от защиты.',
        taking: 'После того, как ты берёшь, в следующем раунде ты не ходишь — ходит следующий игрок.',
        transfer: 'Переводной возможен только если ты ещё ничего не отбил и все бьющие карты одного ранга.',
      },
      log: {
        newRound: '— Раунд {round}. Козырь: {suit}. —',
        firstAttacker: '{name} ходит первым (самый низкий козырь).',
        attack: '{name} бьёт {card}.',
        throwIn: '{name} подкидывает {card}.',
        beat: '{name} отбивает {attack} картой {card}.',
        take: '{name} берёт карты со стола ({count}).',
        bito: 'Бито — {count} карт идут в сброс.',
        transfer: '{name} переводит удар {card} на {target}.',
        pass: '{name} пасует.',
        draw: '{name} добирает {count} карт из колоды.',
        deckEmpty: 'Колода кончилась — не могу добрать.',
        out: '{name} кончаются карты, он вышел из игры.',
        durak: '{name} — дурак!',
        drawGame: 'Ничья — дурака нет.',
      },
      result: {
        durakTitleYou: 'Ты дурак', durakTitleBot: '{name} — дурак',
        durakBodyYou: 'Все закончились раньше тебя. В следующий раз береги козыри.',
        durakBodyBot: 'Ты кончился раньше {name}. Раунд твой.',
        drawTitle: 'Ничья', drawBody: 'Все кончились одновременно — дурака нет.',
        score: 'Счёт: {wins} побед · {losses} поражений · {draws} ничьих',
        place: 'Порядок выхода: {order}',
      },
      settings: {
        eyebrow: 'ПАРАМЕТРЫ ИГРЫ', title: 'Опции', rules: 'Правила', learning: 'Обучение и темп',
        appearance: 'Внешний вид', session: 'Сессия',
        throwInAll: 'Все могут подкидывать', throwInAllDesc: 'Если выключено, подкидывать может только бьющий.',
        throwInAllLongDesc: 'Если выключено, подкидывать может только игрок, открывший удар.',
        transfer: 'Переводной', transferDesc: 'Крующий может перевести удар картой того же ранга.',
        transferLongDesc: 'Крующий, который ещё ничего не отбил, может перевести удар картой того же ранга.',
        limitSix: 'Лимит в 6 карт', limitSixDesc: 'Без лимита удар может идти, пока крующий не кончится.',
        limitSixLongDesc: 'Без лимита удар может идти, пока крующий не кончится картами.',
        beginner: 'Режим новичка', beginnerDesc: 'Подсказки в полосе действий и выделение доступных карт.',
        speed: 'Скорость ботов', speedDesc: 'Как быстро ботов ходят.',
        animations: 'Анимация карт', animationsDesc: 'Раздача, выкладывание карт и очистка стола.',
        sounds: 'Звуки стола', soundsDesc: 'Тихий клик при выкладывании и сборе карт.',
        language: 'Язык', languageDesc: 'Интерфейс и подсказки обучения.',
        autoSave: 'Сохранять игру', autoSaveDesc: 'Позволяет вернуться к прерванной игре из главного меню.',
        savedLocally: 'Параметры хранятся локально в браузере.',
      },
      newGame: {
        eyebrow: 'НОВАЯ СЕССИЯ', title: 'Создать новую игру',
        lead: 'Выбери количество ботов, установи каждому сложность и выбери дополнительные правила.',
        table: 'Стол', botCount: 'Количество ботов', botCountDesc: 'От одного до трёх компьютерных противников.',
        bots: 'Боты и сложность', rules: 'Дополнительные правила', start: 'Начать игру',
        botLabel: 'Бот {index}', botHint: 'Сложность влияет на подсчёт карт и рискованность.',
      },
      difficulty: { easy: 'Легко', normal: 'Нормально', hard: 'Сложно', expert: 'Эксперт' },
      speed: { slow: 'Медленно', normal: 'Нормально', fast: 'Быстро' },
      suits: { C: 'Трефы', S: 'Пики', H: 'Черви', D: 'Бубны' },
      rulesText: {
        goalTitle: 'Цель игры',
        goal: 'Избавься от всех карт. Игрок, который остаётся с картами, когда все остальные вышли, становится дураком и проигрывает раунд.',
        dealTitle: 'Колода и раздача',
        deal: 'Колода 36 карт (от 6 до туза). Каждому игроку раздаётся по 6 карт. Одна карта лежит открытой поперёк под колодой — её масть является козырем на весь раунд и это последняя карта, которую можно добрать.',
        attackTitle: 'Бой и оборона',
        attack: 'Бьющий кладёт карту, крующий должен её отбить старшей картой того же достоинства или козырём. Козырь отбивается только старшим козырём.',
        throwTitle: 'Подкидывание',
        throw: 'После первой бьющей карты можно подкидывать карты тех же рангов, что уже на столе. Удар не превышает 6 карт и не превышает количество карт, которое было у крующего в начале хода.',
        takeTitle: 'Взятие карт',
        take: 'Крующий, который не может или не хочет отбивать, берёт все карты со стола. Следующий ходит игрок после него. При удачной защите карты идят в сброс и крующий становится бьющим.',
        refillTitle: 'Добор',
        refill: 'После каждого хода рука доводится до 6 карт: сначала бьющий, потом остальные по очереди, крующий последним. Когда колода кончится, играют тем, что осталось.',
        optionsTitle: 'Дополнительные правила',
        options: 'В опциях можно включить переводной, запретить подкидывание всем кроме бьющего и убрать лимит в 6 карт.',
      },
      tutorial: {
        eyebrow: 'ПОШАГОВОЕ ОБУЧЕНИЕ', back: 'Назад', next: 'Дальше', start: 'Начать тренировочную игру',
        exit: 'Закончить обучение', close: 'Закрыть', step: 'Шаг {step} из {total}', guided: 'ТРЕНИРОВКА',
        practice: 'Тренировка', title: 'Как играть в Дурака',
        steps: [
          { icon: '♠', title: 'Цель игры', body: 'Дурак — это гонка, а не игра на очки: ты избавляешься от карт, а не собираешь их. Кто остаётся с картами, когда все остальные вышли, становится дураком и проигрывает раунд.' },
          { icon: '36', title: 'Колода и козырь', body: 'В игре 36 карт от шестёрки до туза. Каждый получает по 6 карт, остаток — это колода. Одна карта лежит открытой поперёк под колодой — её масть козырь на весь раунд и это последняя карта, которую можно добрать.' },
          { icon: '⚔', title: 'Кто ходит и как бить', body: 'Раунд начинает игрок с самым низким козырём. Бьющий кладёт любую карту на стол, а игрок после него кроет.' },
          { icon: '⛨', title: 'Оборона', body: 'Ты отбиваешь карту старшей картой того же достоинства или козырём. Козырь отбивается только старшим козырём. Каждой бьющей карте нужна своя отбивающая.' },
          { icon: '+', title: 'Подкидывание', body: 'После первой бьющей карты можно подкидывать — но только карты рангов, что уже на столе, от удара или защиты. Удар не превышает 6 карт и не больше карт, что было у крующего в начале хода.' },
          { icon: '✋', title: 'Взятие', body: 'Крующий, что не может или не хочет отбивать, говорит «Беру» и берёт все карты со стола. Остальные могут ещё подкинуть подходящих карт. Кто берёт, в следующем раунде не ходит — ходит следующий игрок.' },
          { icon: '↺', title: 'Добор и конец', body: 'После каждого хода рука доводится до 6: сначала бьющий, потом остальные по очереди, крующий последним. Когда колода кончится, играют оставшимися картами. Кто кончается, выходит из игры и уже в безопасности.' },
          { icon: '▶', title: 'Тренировка', body: 'Сейчас мы начнём спокойную игру один на один с готовым раскладом. Тренер подскажет, что делать, и подсветит карту — но можно играть любой доступный ход.' },
        ],
        coach: {
          introTitle: 'Тренировочная игра',
          intro: 'Ты играешь один на один с Басей. Козырь этого раунда показан в верхней панели — карты этой масти всё бьют.',
          attackTitle: 'Твой ход',
          attack: 'Положи карту на стол. Подсвеченная карта — совет тренера: малая не-козырь, чтобы козыри остались на защиту.',
          attackAgainTitle: 'Ты можешь подкинуть',
          attackAgain: 'На столе уже есть карта какого-то ранга. Ты можешь подкинуть ещё одну того же ранга или закончить ход с помощью «Готово».',
          defenseTitle: 'Твоя защита',
          defense: 'Отбей старшей картой той же масти или козырём. Если слишком дорого, нажми «Беру» и возьми карты.',
          transferTitle: 'Ты можешь перевести',
          transfer: 'У тебя есть карта того же ранга, что удар, и ты ещё ничего не отбил — можешь перевести удар противнику вместо защиты.',
          throwInTitle: 'Подкидывание',
          throwIn: 'Ты можешь подкинуть карту того ранга, что на столе, чтобы крующий потратил больше. Или просто пасовать.',
          takingTitle: 'Противник берёт',
          taking: 'Крующий берёт карты. Хороший момент отдать ему всё подходящее, что ты не хочешь держать.',
          waitTitle: 'Смотри',
          wait: 'Ход противника. Смотри, какими картами он крует — это подскажет, что у него осталось.',
          endTitle: 'Раунд окончен',
          end: 'Раунд решён. Можешь сыграть ещё или закончить обучение и перейти на обычную игру.',
          hintPrefix: 'Тренер советует: {card}',
        },
      },
    },
  };

  let activeLanguage = 'pl';

  function lookup(language, key) {
    const direct = key.split('.').reduce((value, part) => (value == null ? value : value[part]), LANGUAGES[language]);
    if (direct !== undefined && direct !== null) return direct;
    return key.split('.').reduce((value, part) => (value == null ? value : value[part]), LANGUAGES.pl);
  }

  function translate(key, vars) {
    const value = lookup(activeLanguage, key);
    if (typeof value !== 'string') return value === undefined || value === null ? key : value;
    if (!vars) return value;
    return value.replace(/\{(\w+)\}/g, (_, name) => (vars[name] !== undefined ? vars[name] : `{${name}}`));
  }

  D.i18n = {
    languages: LANGUAGES,
    get language() { return activeLanguage; },
    setLanguage(language) { activeLanguage = LANGUAGES[language] ? language : 'pl'; },
    t: translate,
    get: (key) => lookup(activeLanguage, key),
  };
})();

/* ============================================================
   DUREŃ — moduł 2: zasady gry (talia, bicie, legalne ruchy)
   ============================================================ */
(function () {
  const D = (window.Durak = window.Durak || {});
  const RI = D.RANK_INDEX;

  function suitMeta(id) {
    return D.SUITS.find((s) => s.id === id) || { id, symbol: '?' };
  }

  function createDeck() {
    const deck = [];
    for (const suit of D.SUITS) {
      for (const rank of D.RANKS) {
        deck.push({ id: `${suit.id}-${rank}`, suit: suit.id, rank });
      }
    }
    return deck;
  }

  function shuffle(deck, rng) {
    const random = rng || Math.random;
    const copy = deck.map((c) => ({ ...c }));
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /* Karta `defense` bije kartę `attack`? */
  function beats(attack, defense, trump) {
    if (!attack || !defense) return false;
    if (defense.suit === attack.suit) return RI[defense.rank] > RI[attack.rank];
    return defense.suit === trump && attack.suit !== trump;
  }

  function isTrump(card, trump) {
    return !!card && card.suit === trump;
  }

  function cardLabel(card) {
    return card ? `${card.rank}${suitMeta(card.suit).symbol}` : '—';
  }

  /* Heurystyczna „wartość” karty: 0–8 dla nieatutów, 10–18 dla atutów. */
  function cardCost(card, trump) {
    return RI[card.rank] + (isTrump(card, trump) ? 10 : 0);
  }

  function sortHand(cards, trump) {
    const suitOrder = { C: 0, S: 1, H: 2, D: 3 };
    return cards.slice().sort((a, b) => {
      const at = isTrump(a, trump);
      const bt = isTrump(b, trump);
      if (at !== bt) return at ? 1 : -1;
      if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
      return RI[a.rank] - RI[b.rank];
    });
  }

  function tableCards(table) {
    const cards = [];
    table.forEach((pair) => {
      if (pair.attack) cards.push(pair.attack);
      if (pair.defense) cards.push(pair.defense);
    });
    return cards;
  }

  function tableRanks(table) {
    return new Set(tableCards(table).map((c) => c.rank));
  }

  function unbeatenPairs(table) {
    return table.filter((pair) => !pair.defense);
  }

  function legalThrowIns(hand, table) {
    if (!table.length) return hand.slice();
    const ranks = tableRanks(table);
    return hand.filter((card) => ranks.has(card.rank));
  }

  function beatOptions(hand, attackCard, trump) {
    return hand.filter((card) => beats(attackCard, card, trump));
  }

  /* Czy obrońca może przerzucić atak dalej? */
  function transferOptions(hand, table) {
    if (!table.length) return [];
    if (table.some((pair) => pair.defense)) return [];
    const ranks = new Set(table.map((pair) => pair.attack.rank));
    if (ranks.size !== 1) return [];
    const rank = [...ranks][0];
    return hand.filter((card) => card.rank === rank);
  }

  /* Kto zaczyna rozdanie: najniższy atut. Zwraca -1, gdy nikt nie ma atutu. */
  function lowestTrumpHolder(hands, trump) {
    let best = -1;
    let bestRank = Infinity;
    hands.forEach((hand, player) => {
      hand.forEach((card) => {
        if (card.suit === trump && RI[card.rank] < bestRank) {
          bestRank = RI[card.rank];
          best = player;
        }
      });
    });
    return best;
  }

  /* Przypisanie najtańszych kart obrony do wszystkich nieprzebitych ataków.
     Zwraca null, gdy pełna obrona jest niemożliwa. */
  function planDefense(hand, pairs, trump) {
    const targets = pairs.map((pair, index) => ({
      index,
      pair,
      options: beatOptions(hand, pair.attack, trump).sort((a, b) => cardCost(a, trump) - cardCost(b, trump)),
    })).sort((a, b) => a.options.length - b.options.length);
    const used = new Set();
    const plan = [];
    for (const target of targets) {
      const pick = target.options.find((card) => !used.has(card.id));
      if (!pick) return null;
      used.add(pick.id);
      plan.push({ pair: target.pair, card: pick });
    }
    /* Kolejność zgodna z układem stołu ułatwia czytanie ruchów bota. */
    plan.sort((a, b) => pairs.indexOf(a.pair) - pairs.indexOf(b.pair));
    return plan;
  }

  D.rules = {
    suitMeta, createDeck, shuffle, beats, isTrump, cardLabel, cardCost, sortHand,
    tableCards, tableRanks, unbeatenPairs, legalThrowIns, beatOptions, transferOptions,
    lowestTrumpHolder, planDefense,
  };
})();

/* ============================================================
   DUREŃ — moduł 3: boty (easy / normal / hard / expert)
   ============================================================ */
(function () {
  const D = (window.Durak = window.Durak || {});
  const R = D.rules;
  const RI = D.RANK_INDEX;

  /* Skala 0–3 używana do skalowania wszystkich heurystyk. */
  function level(difficulty) {
    const map = { easy: 0, normal: 1, hard: 2, expert: 3 };
    return map[difficulty] === undefined ? 1 : map[difficulty];
  }

  function pick(list, rng) {
    return list[Math.floor((rng || Math.random)() * list.length)];
  }

  function byCost(trump) {
    return (a, b) => R.cardCost(a, trump) - R.cardCost(b, trump);
  }

  /* Karty, których bot na pewno nie widzi (talon + ręce innych graczy). */
  function unknownPool(ctx) {
    const known = new Set(ctx.known || []);
    return R.createDeck().filter((card) => !known.has(card.id));
  }

  /* Szacowana szansa, że obrońca ma czym przebić daną kartę. */
  function beatRisk(card, ctx) {
    const pool = unknownPool(ctx);
    if (!pool.length || !ctx.defenderCount) return 0.5;
    const beaters = pool.filter((c) => R.beats(card, c, ctx.trump)).length;
    if (!beaters) return 0;
    const share = beaters / pool.length;
    return 1 - Math.pow(1 - share, Math.min(ctx.defenderCount, pool.length));
  }

  function duplicatesOfRank(hand, rank) {
    return hand.filter((card) => card.rank === rank).length;
  }

  /* Ile „boli” oddanie danej karty na obronę. */
  function cardRegret(card, trump) {
    const rank = RI[card.rank];
    return R.isTrump(card, trump) ? 3 + rank * 0.55 : 0.5 + rank * 0.28;
  }

  /* Ile kosztuje wzięcie kart ze stołu: liczba kart + utrata tempa. */
  function takeCost(ctx) {
    const cards = R.tableCards(ctx.table);
    let cost = cards.length * 2.2 + 1.6;
    cards.forEach((card) => { if (R.isTrump(card, ctx.trump)) cost -= 0.8; });
    if (ctx.deckCount === 0) cost *= 1.7;
    return cost;
  }

  /* --------------------------------------------------------
     ATAK — pierwsza karta tury
     -------------------------------------------------------- */
  function chooseAttack(ctx) {
    const lvl = level(ctx.difficulty);
    const hand = ctx.hand;
    if (!hand.length) return null;
    const nonTrump = hand.filter((c) => !R.isTrump(c, ctx.trump)).sort(byCost(ctx.trump));
    const trumps = hand.filter((c) => R.isTrump(c, ctx.trump)).sort(byCost(ctx.trump));

    if (lvl === 0) return pick(hand, ctx.rng);

    if (lvl === 1) return nonTrump[0] || trumps[0];

    if (lvl === 2) {
      /* Trudny: wybiera niską kartę, ale preferuje rangę, której ma kilka sztuk,
         żeby móc dorzucać i wymuszać zużycie atutów obrońcy. */
      const pool = nonTrump.length ? nonTrump : trumps;
      let best = pool[0];
      let bestScore = -Infinity;
      pool.slice(0, 5).forEach((card) => {
        const copies = duplicatesOfRank(hand, card.rank);
        /* Lekkie liczenie kart: bierzemy pod uwagę, ile bijących kart już zeszło. */
        const risk = beatRisk(card, ctx);
        let score = (8 - RI[card.rank]) * 1.2 + (copies - 1) * 3.2 + (1 - risk) * 2.6;
        if (R.isTrump(card, ctx.trump)) score -= ctx.deckCount > 0 ? 9 : 3;
        if (score > bestScore) { bestScore = score; best = card; }
      });
      return best;
    }

    /* Ekspert: liczy karty, ocenia ryzyko przebicia i planuje opróżnienie ręki. */
    const endgame = ctx.deckCount === 0;
    const pool = nonTrump.length ? nonTrump : trumps;
    let best = pool[0];
    let bestScore = -Infinity;
    pool.slice(0, 6).forEach((card) => {
      const copies = duplicatesOfRank(hand, card.rank);
      const risk = beatRisk(card, ctx);
      let score = (8 - RI[card.rank]) * 1.2 + (copies - 1) * 3.6 + (1 - risk) * 4;
      if (R.isTrump(card, ctx.trump)) score -= endgame ? 3 : 9;
      /* W końcówce liczy się tempo: jeśli obrońca ma mało kart, atakujemy tym,
         czego on prawdopodobnie nie przebije. */
      if (endgame && ctx.defenderCount <= 2) score += (1 - risk) * 4;
      if (score > bestScore) { bestScore = score; best = card; }
    });
    return best;
  }

  /* --------------------------------------------------------
     DORZUCANIE — zwraca kartę albo null (pas)
     -------------------------------------------------------- */
  function chooseThrowIn(ctx) {
    const lvl = level(ctx.difficulty);
    const legal = R.legalThrowIns(ctx.hand, ctx.table);
    if (!legal.length) return null;
    const rng = ctx.rng || Math.random;
    const nonTrump = legal.filter((c) => !R.isTrump(c, ctx.trump)).sort(byCost(ctx.trump));
    const trumps = legal.filter((c) => R.isTrump(c, ctx.trump)).sort(byCost(ctx.trump));

    if (lvl === 0) return rng() < 0.45 ? pick(legal, rng) : null;

    if (lvl === 1) {
      if (ctx.taking) return nonTrump[0] || (rng() < 0.25 ? trumps[0] : null);
      if (!nonTrump.length) return null;
      return RI[nonTrump[0].rank] <= 4 ? nonTrump[0] : (rng() < 0.4 ? nonTrump[0] : null);
    }

    if (lvl === 2) {
      /* Trudny: przy braniu wypycha wszystko, co tanie. Przy pełnym talonie
         dorzuca drobne karty, ale przestaje, gdy talon jest już cienki —
         inaczej sam dobrałby jego resztki. */
      if (ctx.taking) return nonTrump[0] || trumps[0] || null;
      if (ctx.deckCount === 0) return nonTrump[0] || null;
      if (ctx.deckCount <= 5) return null;
      if (!nonTrump.length) return null;
      return RI[nonTrump[0].rank] <= 5 ? nonTrump[0] : null;
    }

    /* Ekspert: pełna ocena — dokłada, gdy widzi przewagę albo gdy obrońca bierze. */
    if (ctx.taking) {
      const dump = nonTrump.length ? nonTrump : trumps;
      return dump[0] || null;
    }
    if (ctx.deckCount === 0) {
      /* Bez talonu każda oddana karta to czysty zysk. */
      return nonTrump[0] || trumps[0] || null;
    }
    if (ctx.deckCount <= 5) {
      /* Cienki talon: dorzucanie oznaczałoby dobranie jego resztek. */
      return null;
    }
    /* Przy pełnym talonie dorzucamy tylko drobne karty i wybieramy tę,
       którą obrońca ma najmniejszą szansę przebić. */
    const cheap = nonTrump.filter((card) => RI[card.rank] <= 5);
    if (!cheap.length) return null;
    return cheap.slice().sort((a, b) => beatRisk(a, ctx) - beatRisk(b, ctx))[0];
  }

  /* --------------------------------------------------------
     OBRONA — bicie, branie albo przerzut
     -------------------------------------------------------- */
  function chooseDefense(ctx) {
    const lvl = level(ctx.difficulty);
    const rng = ctx.rng || Math.random;
    const pairs = R.unbeatenPairs(ctx.table);
    if (!pairs.length) return { type: 'pass' };

    /* Przerzut rozważamy tylko wtedy, gdy zasada jest włączona i jest legalny. */
    if (ctx.canTransfer) {
      const options = R.transferOptions(ctx.hand, ctx.table).sort(byCost(ctx.trump));
      const nonTrumpOption = options.find((c) => !R.isTrump(c, ctx.trump));
      if (options.length) {
        if (lvl === 0 && rng() < 0.25) return { type: 'transfer', card: pick(options, rng) };
        if (lvl === 1 && nonTrumpOption && rng() < 0.55) return { type: 'transfer', card: nonTrumpOption };
        if (lvl >= 2 && nonTrumpOption) {
          const plan = R.planDefense(ctx.hand, pairs, ctx.trump);
          const cost = plan ? plan.reduce((sum, step) => sum + R.cardCost(step.card, ctx.trump), 0) : 99;
          if (!plan || cost >= 9 || ctx.nextDefenderCount > ctx.hand.length) {
            return { type: 'transfer', card: nonTrumpOption };
          }
        }
      }
    }

    const plan = R.planDefense(ctx.hand, pairs, ctx.trump);
    if (!plan) return { type: 'take' };

    const defenseCost = plan.reduce((sum, step) => sum + cardRegret(step.card, ctx.trump), 0);
    const trumpsSpent = plan.filter((step) => R.isTrump(step.card, ctx.trump)).length;

    if (lvl === 0) {
      if (rng() < 0.22) return { type: 'take' };
      const target = pairs[0];
      const options = R.beatOptions(ctx.hand, target.attack, ctx.trump);
      return { type: 'beat', pair: target, card: pick(options, rng) };
    }

    if (lvl === 1) {
      return { type: 'beat', pair: plan[0].pair, card: plan[0].card };
    }

    if (lvl === 2) {
      /* Trudny: broni się prawie zawsze, ale nie rozmienia wysokich atutów
         za drobne karty, dopóki talon jest jeszcze gruby. */
      if (ctx.deckCount > 6 && defenseCost > takeCost(ctx) + 4.5) return { type: 'take' };
      return { type: 'beat', pair: plan[0].pair, card: plan[0].card };
    }

    /* Ekspert: porównuje koszt obrony z realnym kosztem wzięcia kart. */
    let cost = defenseCost;
    const handAfterDefense = ctx.hand.length - plan.length;
    if (ctx.deckCount === 0) {
      /* W końcówce liczy się opróżnienie ręki, nie oszczędzanie atutów. */
      cost -= 3;
      if (handAfterDefense === 0) cost -= 12;
    } else if (trumpsSpent >= 3) {
      cost += 2.5;
    }
    if (cost > takeCost(ctx) + 2) return { type: 'take' };
    return { type: 'beat', pair: plan[0].pair, card: plan[0].card };
  }

  D.bot = { level, chooseAttack, chooseThrowIn, chooseDefense, beatRisk };
})();

/* ============================================================
   DUREŃ — moduł 4: renderowanie interfejsu
   ============================================================ */
(function () {
  const D = (window.Durak = window.Durak || {});
  const R = D.rules;
  const T = (key, vars) => D.i18n.t(key, vars);
  const el = (id) => document.getElementById(id);

  const SEAT_SLOTS = { 1: ['top'], 2: ['left', 'right'], 3: ['left', 'top', 'right'] };

  function playerName(state, index) {
    return index === 0 ? T('common.you') : state.players[index].name;
  }

  function initials(name) {
    return name.slice(0, 2).toUpperCase();
  }

  function textOf(entry) {
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    return T(entry.key, entry.vars);
  }

  /* ---------- karty ---------- */
  function cardHTML(card, opts) {
    const options = opts || {};
    const suit = R.suitMeta(card.suit);
    const classes = ['card', `suit-${card.suit}`];
    if (options.playable) classes.push('playable');
    if (options.selected) classes.push('selected');
    if (options.dimmed) classes.push('dimmed');
    if (options.deal) classes.push('deal-card');
    if (options.entering) classes.push('table-enter');
    if (options.trumpMark) classes.push('trump-mark');
    if (options.className) classes.push(...String(options.className).split(/\s+/).filter(Boolean));
    const styleVars = [];
    if (Number.isInteger(options.index)) styleVars.push(`--card-index:${options.index}`);
    if (Number.isFinite(options.fanAngle)) styleVars.push(`--fan-angle:${options.fanAngle}deg`);
    if (Number.isFinite(options.fanY)) styleVars.push(`--fan-y:${options.fanY}px`);
    const style = styleVars.length ? ` style="${styleVars.join(';')}"` : '';
    const tag = options.static ? 'div' : 'button';
    const extra = options.static ? '' : `${options.disabled ? ' disabled' : ''} type="button"`;
    return `<${tag} class="${classes.join(' ')}" data-card-id="${card.id}"${style}${extra} aria-label="${card.rank} ${T(`suits.${card.suit}`)}">
        <span class="corner top"><b>${card.rank}</b><i>${suit.symbol}</i></span>
        <span class="pip">${suit.symbol}</span>
        <span class="corner bottom"><b>${card.rank}</b><i>${suit.symbol}</i></span>
      </${tag}>`;
  }

  function fanMetrics(index, count) {
    const mid = (Math.max(1, count) - 1) / 2;
    const offset = index - mid;
    return { angle: offset * 2.1, y: Math.abs(offset) * 1.1 };
  }

  function backHTML(count, opts) {
    const options = opts || {};
    return Array.from({ length: count }, (_, index) => {
      const fan = options.fan ? fanMetrics(index, count) : { angle: 0, y: 0 };
      const cls = `card-back${options.deal ? ' deal-card' : ''}`;
      return `<div class="${cls}" style="--card-index:${index};--fan-angle:${fan.angle}deg;--fan-y:${fan.y}px" aria-hidden="true"><span>DURAK</span></div>`;
    }).join('');
  }

  /* ---------- topbar ---------- */
  function renderHeader(state) {
    el('stat-round').textContent = state.round > 0 ? String(state.round) : '—';
    el('stat-deck').textContent = state.round > 0 ? `${state.deck.length} ${T('common.cards')}` : '—';

    const trumpBox = el('stat-trump-box');
    const trumpValue = el('stat-trump');
    if (state.trump) {
      const meta = R.suitMeta(state.trump);
      trumpValue.innerHTML = `<span class="trump-icon suit-${state.trump}">${meta.symbol}</span><span>${T(`suits.${state.trump}`)}</span>`;
      trumpBox.classList.add('hot');
    } else {
      trumpValue.textContent = '—';
      trumpBox.classList.remove('hot');
    }

    el('stat-attacker').textContent = state.attacker == null ? '—' : playerName(state, state.attacker);
    el('stat-defender').textContent = state.defender == null ? '—' : T('top.defender', { name: playerName(state, state.defender) });

    const phase = T(`phase.${state.phase}`);
    el('phase-chip').textContent = typeof phase === 'string' ? phase : '—';
    el('helper-phase').textContent = typeof phase === 'string' ? phase : '—';
    el('helper-status').textContent = textOf(state.status) || '—';
  }

  /* ---------- gracze ---------- */
  function roleFor(state, index) {
    if (state.out[index]) return T('seat.out');
    if (state.defender === index) return T('seat.defender');
    if (state.attacker === index) return T('seat.attacker');
    if (state.phase === 'throwin' && state.thrower === index) return T('seat.thrower');
    return T('seat.waiting');
  }

  function badgeFor(state, index) {
    if (state.out[index]) return `<span class="seat-badge out">${T('badge.out')}</span>`;
    if (state.defender === index) return `<span class="seat-badge defend">${T('badge.defend')}</span>`;
    if (state.attacker === index) return `<span class="seat-badge attack">${T('badge.attack')}</span>`;
    return '';
  }

  function isActive(state, index) {
    if (state.phase === 'attack') return state.attacker === index;
    if (state.phase === 'defense') return state.defender === index;
    if (state.phase === 'throwin') return state.thrower === index;
    return false;
  }

  function renderScoreList(state) {
    const root = el('score-list');
    if (!root) return;
    if (!state.players.length) { root.innerHTML = ''; return; }
    root.innerHTML = state.players.map((player, index) => {
      const classes = ['player-panel'];
      if (isActive(state, index)) classes.push('active');
      if (state.attacker === index) classes.push('is-attacker');
      if (state.defender === index) classes.push('is-defender');
      if (state.out[index]) classes.push('is-out');
      const name = playerName(state, index);
      const sub = index === 0 ? roleFor(state, index) : `${T(`difficulty.${player.difficulty}`)} · ${roleFor(state, index)}`;
      return `<div class="${classes.join(' ')}">
        <div class="avatar">${initials(name)}</div>
        <div><b class="player-name">${name}${badgeFor(state, index)}</b><span class="player-role">${sub}</span></div>
        <strong class="player-count">${state.hands[index].length}</strong>
      </div>`;
    }).join('');
  }

  function renderSeats(state) {
    const root = el('seats');
    if (!root) return;
    const botCount = state.players.length - 1;
    if (botCount < 1) { root.innerHTML = ''; return; }
    const slots = SEAT_SLOTS[botCount] || SEAT_SLOTS[3];
    root.innerHTML = state.players.slice(1).map((player, offset) => {
      const index = offset + 1;
      const classes = ['bot-seat', `slot-${slots[offset]}`];
      if (isActive(state, index)) classes.push('active');
      if (state.defender === index) classes.push('is-defender');
      if (state.out[index]) classes.push('is-out');
      const bubble = textOf(state.bubbles[index]);
      return `<div class="${classes.join(' ')}">
        <div class="nameplate">
          <div class="avatar">${initials(player.name)}</div>
          <div><b class="player-name">${player.name}${badgeFor(state, index)}</b><span class="player-role">${roleFor(state, index)}</span></div>
          <strong class="player-count">${state.hands[index].length}</strong>
          ${bubble ? `<span class="seat-bubble">${bubble}</span>` : ''}
        </div>
        <div class="bot-hand">${backHTML(Math.min(state.hands[index].length, 12), { fan: true, deal: state.dealAnimation })}</div>
      </div>`;
    }).join('');
  }

  /* ---------- talon i stos odrzuconych ---------- */
  function renderTalon(state) {
    const talon = el('talon-zone');
    const discard = el('discard-zone');
    if (!talon || !discard) return;

    if (!state.trumpCard) {
      talon.innerHTML = '';
      discard.innerHTML = '';
      return;
    }

    const left = state.deck.length;
    if (left > 0) {
      talon.innerHTML = `<span class="zone-label">${T('common.deck')}</span>
        <div class="talon-stack">
          <div class="trump-card">${cardHTML(state.trumpCard, { static: true })}</div>
          ${left > 1 ? `<div class="talon-back">${backHTML(1)}</div>` : ''}
        </div>
        <span class="talon-count">${left}</span>`;
    } else {
      talon.innerHTML = `<span class="zone-label">${T('common.deck')}</span>
        <div class="talon-empty">${T('common.empty').toUpperCase()}</div>
        <span class="talon-count">0</span>`;
    }

    const count = state.discardCount;
    const stack = Math.min(count, 3);
    discard.innerHTML = `<span class="zone-label">${T('common.discard')}</span>
      <div class="discard-stack">${count === 0
        ? `<div class="talon-empty">${T('common.empty').toUpperCase()}</div>`
        : Array.from({ length: stack }, (_, i) => `<div class="card-back" style="transform:translate(-50%,-50%) rotate(${(i - 1) * 6}deg)" aria-hidden="true"><span>DURAK</span></div>`).join('')}</div>
      <span class="talon-count">${count}</span>`;
  }

  /* ---------- stół ---------- */
  function renderTable(state) {
    const root = el('table-cards');
    if (!root) return;
    root.classList.remove('collect-discard', 'collect-take');
    if (state.collecting === 'discard') root.classList.add('collect-discard');
    if (state.collecting === 'take') root.classList.add('collect-take');

    if (!state.table.length) {
      root.innerHTML = state.round > 0 ? `<span class="table-empty">${T('common.tableCards')}</span>` : '';
      return;
    }
    const humanDefends = state.phase === 'defense' && state.defender === 0 && !state.transferMode;
    root.innerHTML = state.table.map((pair, index) => {
      const classes = ['table-pair'];
      if (!pair.defense) classes.push('unbeaten');
      if (humanDefends && !pair.defense && index === state.defenseTarget) classes.push('targeted');
      if (humanDefends && !pair.defense) classes.push('selectable');
      const attack = cardHTML(pair.attack, { static: true, className: `attack-card${pair.isNew ? ' table-enter' : ''}` });
      const defense = pair.defense ? cardHTML(pair.defense, { static: true, className: `defense-card${pair.defenseNew ? ' table-enter' : ''}` }) : '';
      return `<div class="${classes.join(' ')}" data-pair-index="${index}">${attack}${defense}</div>`;
    }).join('');
  }

  /* ---------- ręka gracza ---------- */
  function playableIds(state) {
    const hand = state.hands[0] || [];
    if (!hand.length || state.phase === 'end' || state.phase === 'idle') return new Set();
    if (state.phase === 'attack' && state.attacker === 0) {
      return new Set(hand.map((c) => c.id));
    }
    if (state.phase === 'defense' && state.defender === 0) {
      if (state.transferMode) return new Set(R.transferOptions(hand, state.table).map((c) => c.id));
      const pair = state.table[state.defenseTarget];
      if (!pair || pair.defense) return new Set();
      return new Set(R.beatOptions(hand, pair.attack, state.trump).map((c) => c.id));
    }
    if (state.phase === 'throwin' && state.thrower === 0) {
      if (state.table.length >= state.maxAttacks) return new Set();
      return new Set(R.legalThrowIns(hand, state.table).map((c) => c.id));
    }
    return new Set();
  }

  function renderHumanHand(state) {
    const root = el('human-hand');
    if (!root) return;
    const cards = R.sortHand(state.hands[0] || [], state.trump);
    const legal = playableIds(state);
    const hint = state.tutorial && state.tutorial.active ? state.tutorial.hintCardId : null;
    root.innerHTML = cards.map((card, index) => {
      const fan = fanMetrics(index, cards.length);
      const playable = legal.has(card.id);
      return cardHTML(card, {
        playable,
        disabled: !playable,
        dimmed: legal.size > 0 && !playable && !!state.settings.beginnerMode,
        trumpMark: R.isTrump(card, state.trump),
        className: hint && hint === card.id && playable ? 'coach-target' : '',
        index,
        deal: state.dealAnimation,
        fanAngle: fan.angle,
        fanY: fan.y,
      });
    }).join('');
  }

  /* ---------- pasek akcji ---------- */
  function actionButton(label, action, cls) {
    return `<button class="action ${cls || ''}" data-action="${action}" type="button">${label}</button>`;
  }

  function renderControls(state) {
    const root = el('controls');
    const status = el('status-text');
    const tip = el('beginner-tip');
    if (!root) return;

    status.textContent = textOf(state.status);

    const buttons = [];
    if (state.phase === 'defense' && state.defender === 0) {
      buttons.push(actionButton(T('actions.take'), 'human-take', 'danger'));
      const canTransfer = state.rules.transfer && R.transferOptions(state.hands[0], state.table).length
        && state.nextDefenderCount >= state.table.length + 1;
      if (canTransfer) {
        buttons.push(state.transferMode
          ? actionButton(T('actions.cancelTransfer'), 'cancel-transfer', 'secondary')
          : actionButton(T('actions.transfer'), 'start-transfer', 'info'));
      }
    } else if (state.phase === 'throwin' && state.thrower === 0) {
      buttons.push(actionButton(state.taking ? T('actions.finishTake') : T('actions.bito'), 'human-pass', 'primary'));
    }
    if (state.phase === 'end' && !state.result) {
      buttons.push(actionButton(T('actions.nextRound'), 'next-round', 'primary'));
    }
    root.innerHTML = buttons.join('');

    let tipKey = '';
    if (state.phase === 'attack' && state.attacker === 0) tipKey = 'tip.attack';
    else if (state.phase === 'defense' && state.defender === 0) tipKey = state.transferMode ? 'tip.transfer' : 'tip.defense';
    else if (state.phase === 'throwin' && state.thrower === 0) tipKey = state.taking ? 'tip.taking' : 'tip.throwin';
    if (state.settings.beginnerMode && tipKey) {
      tip.textContent = T(tipKey);
      tip.classList.remove('hidden');
    } else {
      tip.classList.add('hidden');
    }
  }

  /* ---------- dziennik, zasady, ustawienia ---------- */
  function renderLog(state) {
    const root = el('log');
    if (!root) return;
    root.innerHTML = state.log.slice(-70).reverse()
      .map((entry) => `<div>${textOf(entry)}</div>`).join('');
  }

  function renderRuleBadges(state) {
    const root = el('rule-badges');
    if (!root) return;
    const badges = [
      { on: state.rules.throwInAll, label: T('settings.throwInAll') },
      { on: state.rules.transfer, label: T('settings.transfer') },
      { on: state.rules.limitSix, label: T('settings.limitSix') },
    ];
    root.innerHTML = badges.map((b) => `<span class="rule-badge${b.on ? ' on' : ''}">${b.on ? '✓' : '✕'} ${b.label}</span>`).join('');
  }

  function renderRulesSummary() {
    const root = el('rules-summary');
    if (!root) return;
    const keys = ['goal', 'deal', 'attack', 'throw', 'take', 'refill', 'options'];
    root.innerHTML = keys.map((key) => `<h4>${T(`rulesText.${key}Title`)}</h4><p>${T(`rulesText.${key}`)}</p>`).join('');
  }

  function renderSettings(state) {
    document.querySelectorAll('[data-setting]').forEach((node) => {
      const key = node.dataset.setting;
      const value = key in state.rules ? state.rules[key] : state.settings[key];
      if (node.type === 'checkbox') node.checked = !!value;
      else node.value = value;
    });
    const speed = el('speed-select');
    if (speed) speed.value = state.settings.speed;
    document.body.classList.toggle('no-animations', !state.settings.animations);
  }

  /* ---------- trener samouczka ---------- */
  function renderCoach(state) {
    const root = el('tutorial-coach');
    if (!root) return;
    const tutorial = state.tutorial;
    if (!tutorial || !tutorial.active || !tutorial.coach) {
      root.classList.add('hidden');
      root.innerHTML = '';
      return;
    }
    root.classList.remove('hidden');
    const coach = tutorial.coach;
    const rule = coach.rule ? `<div class="coach-rule">${coach.rule}</div>` : '';
    root.innerHTML = `<div class="coach-kicker"><small>${T('tutorial.guided')}</small><span class="coach-round">${T('tutorial.practice')} · ${state.round}</span></div>
      <b>${coach.title}</b><p>${coach.body}</p>${rule}
      <div class="coach-actions"><button data-action="tutorial-exit" type="button">${T('tutorial.exit')}</button></div>`;
  }

  /* ---------- modal wyniku ---------- */
  function renderResult(state) {
    const modal = el('result-modal');
    if (!modal) return;
    if (!state.result) { modal.classList.add('hidden'); return; }
    modal.classList.remove('hidden');
    el('result-title').textContent = state.result.title;
    el('result-body').innerHTML = state.result.body;
    const mark = el('result-mark');
    mark.textContent = state.result.bad ? '✖' : '★';
    mark.classList.toggle('bad', !!state.result.bad);
  }

  function render(state) {
    if (!state.players.length) {
      renderCoach(state);
      renderSettings(state);
      renderRulesSummary();
      return;
    }
    renderHeader(state);
    renderScoreList(state);
    renderSeats(state);
    renderTalon(state);
    renderTable(state);
    renderHumanHand(state);
    renderControls(state);
    renderLog(state);
    renderRuleBadges(state);
    renderRulesSummary();
    renderSettings(state);
    renderCoach(state);
    renderResult(state);
  }

  D.ui = { render, cardHTML, backHTML, playableIds, playerName, textOf };
})();

/* ============================================================
   DUREŃ — moduł 5: sterowanie rozgrywką, menu, samouczek
   ============================================================ */
(function () {
  const D = (window.Durak = window.Durak || {});
  const R = D.rules;
  const B = D.bot;
  const U = D.ui;
  const T = (key, vars) => D.i18n.t(key, vars);
  const el = (id) => document.getElementById(id);

  const META_KEY = 'durniowie-meta-v1';
  const SESSION_KEY = 'durniowie-session-v1';

  const DEFAULT_SETTINGS = {
    language: 'pl', speed: 'normal', beginnerMode: true,
    animations: true, sounds: true, autoSave: true,
  };
  const DEFAULT_RULES = { throwInAll: true, transfer: false, limitSix: true };
  const DEFAULT_BOTS = ['normal', 'hard', 'easy'];

  const state = {
    round: 0,
    players: [],
    hands: [],
    deck: [],
    trump: null,
    trumpCard: null,
    discard: [],
    discardCount: 0,
    table: [],
    attacker: null,
    defender: null,
    phase: 'idle',
    taking: false,
    passed: [],
    thrower: null,
    defenseTarget: 0,
    transferMode: false,
    boutDefenderStart: 6,
    maxAttacks: 6,
    nextDefenderCount: 0,
    out: [],
    outOrder: [],
    durak: null,
    log: [],
    status: null,
    bubbles: [],
    collecting: null,
    dealAnimation: false,
    result: null,
    helperTab: 'players',
    tutorial: { active: false, coach: null, hintCardId: null },
    stats: { wins: 0, losses: 0, draws: 0 },
    settings: { ...DEFAULT_SETTINGS },
    rules: { ...DEFAULT_RULES },
    botConfig: DEFAULT_BOTS.slice(),
    botCount: 2,
  };

  let botTimer = null;
  let collectTimer = null;
  let dealTimer = null;
  let menuOpen = true;
  let tutorialStep = 0;
  let pendingNewGame = null;
  let audioContext = null;

  /* ---------------- narzędzia ---------------- */
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function random() {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function name(index) {
    return U.playerName(state, index);
  }

  function activePlayers() {
    return state.players.map((_, i) => i).filter((i) => !state.out[i]);
  }

  function nextActive(from) {
    const total = state.players.length;
    for (let step = 1; step <= total; step += 1) {
      const index = (from + step) % total;
      if (!state.out[index]) return index;
    }
    return from;
  }

  function addLog(key, vars) {
    state.log.push({ key, vars: vars || null });
    if (state.log.length > 120) state.log.shift();
  }

  function setStatus(key, vars) {
    state.status = { key, vars: vars || null };
  }

  function clearBubbles() {
    state.bubbles = state.players.map(() => null);
  }

  function setBubble(player, text) {
    clearBubbles();
    state.bubbles[player] = text;
  }

  function clearFresh() {
    state.table.forEach((pair) => { pair.isNew = false; pair.defenseNew = false; });
  }

  function clearTimers() {
    if (botTimer) { window.clearTimeout(botTimer); botTimer = null; }
  }

  function pacedDelay(base) {
    return Math.round(base * (D.SPEEDS[state.settings.speed] || 1));
  }

  function playSound(kind) {
    if (!state.settings.sounds) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioContext = audioContext || new Ctx();
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const freq = kind === 'take' ? 180 : kind === 'bito' ? 420 : 320;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (_) { /* dźwięk jest opcjonalny */ }
  }

  /* ---------------- zapis stanu ---------------- */
  function saveMeta() {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({
        settings: state.settings,
        rules: state.rules,
        botConfig: state.botConfig,
        botCount: state.botCount,
        stats: state.stats,
      }));
    } catch (_) { /* brak localStorage nie może zatrzymać gry */ }
  }

  function loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.settings) Object.keys(DEFAULT_SETTINGS).forEach((key) => {
        if (key in data.settings) state.settings[key] = data.settings[key];
      });
      if (data.rules) Object.keys(DEFAULT_RULES).forEach((key) => {
        if (key in data.rules) state.rules[key] = data.rules[key];
      });
      if (Array.isArray(data.botConfig)) state.botConfig = data.botConfig.slice(0, 3);
      if (Number.isInteger(data.botCount)) state.botCount = Math.min(3, Math.max(1, data.botCount));
      if (data.stats) state.stats = { wins: 0, losses: 0, draws: 0, ...data.stats };
    } catch (_) { /* uszkodzony zapis jest ignorowany */ }
  }

  function persistSession() {
    if (!state.settings.autoSave || state.tutorial.active) return;
    if (state.round < 1 || state.phase === 'idle' || state.phase === 'end') return;
    if (state.collecting) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        round: state.round, players: state.players, hands: state.hands, deck: state.deck,
        trump: state.trump, trumpCard: state.trumpCard, discard: state.discard,
        discardCount: state.discardCount, table: state.table, attacker: state.attacker,
        defender: state.defender, phase: state.phase, taking: state.taking, passed: state.passed,
        thrower: state.thrower, defenseTarget: state.defenseTarget, boutDefenderStart: state.boutDefenderStart,
        maxAttacks: state.maxAttacks, out: state.out, outOrder: state.outOrder, log: state.log,
        status: state.status, rules: state.rules, botConfig: state.botConfig, botCount: state.botCount,
        stats: state.stats,
      }));
    } catch (_) { /* zapełniony localStorage nie może przerwać gry */ }
  }

  function readSavedSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.hands) || !data.players || data.round < 1) return null;
      return data;
    } catch (_) { return null; }
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) { /* ignorujemy */ }
  }

  /* ---------------- render ---------------- */
  function draw() {
    state.nextDefenderCount = state.defender == null ? 0 : (state.hands[nextActive(state.defender)] || []).length;
    updateCoach();
    U.render(state);
    persistSession();
    scheduleBot();
  }

  /* ---------------- rozdanie ---------------- */
  function buildPlayers(botCount, difficulties) {
    const players = [{ name: T('common.you'), isBot: false, difficulty: 'normal' }];
    for (let i = 0; i < botCount; i += 1) {
      players.push({ name: D.BOT_NAMES[i], isBot: true, difficulty: difficulties[i] || 'normal' });
    }
    return players;
  }

  function startRound(preset) {
    clearTimers();
    state.round += 1;
    state.result = null;
    state.log = [];
    state.table = [];
    state.discard = [];
    state.discardCount = 0;
    state.outOrder = [];
    state.durak = null;
    state.taking = false;
    state.passed = [];
    state.thrower = null;
    state.transferMode = false;
    state.defenseTarget = 0;
    state.collecting = null;
    state.out = state.players.map(() => false);
    clearBubbles();

    let deck;
    let hands;
    if (preset) {
      hands = preset.hands.map((list) => list.slice());
      deck = preset.deck.slice();
    } else {
      deck = R.shuffle(R.createDeck());
      hands = state.players.map(() => []);
      for (let round = 0; round < 6; round += 1) {
        state.players.forEach((_, index) => { hands[index].push(deck.shift()); });
      }
    }
    state.hands = hands;
    state.deck = deck;
    state.trumpCard = deck.length ? deck[deck.length - 1] : null;
    state.trump = state.trumpCard ? state.trumpCard.suit : 'H';

    addLog('log.newRound', { round: state.round, suit: T(`suits.${state.trump}`) });

    let first = R.lowestTrumpHolder(state.hands, state.trump);
    if (first < 0) first = Math.floor(Math.random() * state.players.length);
    addLog('log.firstAttacker', { name: name(first) });

    state.dealAnimation = !!state.settings.animations;
    startBoutFrom(first);
    if (dealTimer) window.clearTimeout(dealTimer);
    if (state.dealAnimation) {
      dealTimer = window.setTimeout(() => { state.dealAnimation = false; draw(); }, 900);
    }
  }

  function attackLimit() {
    return state.rules.limitSix ? 6 : 36;
  }

  function startBoutFrom(player) {
    const active = activePlayers();
    if (active.length <= 1) { finishRound(); return; }
    const attacker = state.out[player] ? nextActive(player) : player;
    state.attacker = attacker;
    state.defender = nextActive(attacker);
    state.table = [];
    state.taking = false;
    state.passed = [];
    state.thrower = null;
    state.transferMode = false;
    state.defenseTarget = 0;
    state.collecting = null;
    state.boutDefenderStart = state.hands[state.defender].length;
    state.maxAttacks = Math.min(attackLimit(), state.boutDefenderStart);
    state.phase = 'attack';
    clearBubbles();
    if (state.attacker === 0) setStatus('status.yourAttack');
    else setStatus('status.waitBot', { name: name(state.attacker) });
    draw();
  }

  function firstUnbeatenIndex() {
    return state.table.findIndex((pair) => !pair.defense);
  }

  /* ---------------- ruchy ---------------- */
  function playAttack(player, card) {
    const hand = state.hands[player];
    const index = hand.findIndex((c) => c.id === card.id);
    if (index < 0) return;
    clearFresh();
    hand.splice(index, 1);
    state.table.push({ attack: card, defense: null, isNew: true });
    playSound('play');
    const opening = state.table.length === 1;
    addLog(opening ? 'log.attack' : 'log.throwIn', { name: name(player), card: R.cardLabel(card) });
    setBubble(player, R.cardLabel(card));

    if (state.taking) {
      state.passed = [];
      state.thrower = null;
      advanceThrowIn();
    } else {
      state.passed = [];
      state.thrower = null;
      state.phase = 'defense';
      state.defenseTarget = Math.max(0, firstUnbeatenIndex());
      if (state.defender === 0) setStatusForDefense();
      else setStatus('status.waitBot', { name: name(state.defender) });
    }
    draw();
  }

  function setStatusForDefense() {
    const unbeaten = R.unbeatenPairs(state.table);
    if (state.transferMode) {
      setStatus('status.transferMode', { rank: state.table[0].attack.rank });
    } else if (unbeaten.length > 1) {
      setStatus('status.yourDefenseMulti');
    } else if (unbeaten.length === 1) {
      setStatus('status.yourDefense', { card: R.cardLabel(unbeaten[0].attack) });
    }
  }

  function playDefense(player, pairIndex, card) {
    const pair = state.table[pairIndex];
    if (!pair || pair.defense) return;
    const hand = state.hands[player];
    const index = hand.findIndex((c) => c.id === card.id);
    if (index < 0) return;
    clearFresh();
    hand.splice(index, 1);
    pair.defense = card;
    pair.defenseNew = true;
    playSound('play');
    addLog('log.beat', { name: name(player), attack: R.cardLabel(pair.attack), card: R.cardLabel(card) });
    setBubble(player, R.cardLabel(card));

    if (firstUnbeatenIndex() < 0) {
      openThrowIn(false);
    } else {
      state.defenseTarget = firstUnbeatenIndex();
      if (state.defender === 0) setStatusForDefense();
      else setStatus('status.waitBot', { name: name(state.defender) });
      draw();
    }
  }

  function doTake(player) {
    state.taking = true;
    state.transferMode = false;
    playSound('take');
    addLog('log.take', { name: name(player), count: R.tableCards(state.table).length });
    setBubble(player, T('actions.take'));
    openThrowIn(true);
  }

  function doTransfer(player, card) {
    const hand = state.hands[player];
    const index = hand.findIndex((c) => c.id === card.id);
    if (index < 0) return;
    const newDefender = nextActive(state.defender);
    if (newDefender === state.defender) return;
    clearFresh();
    hand.splice(index, 1);
    state.table.push({ attack: card, defense: null, isNew: true });
    playSound('play');
    addLog('log.transfer', { name: name(player), card: R.cardLabel(card), target: name(newDefender) });
    setBubble(player, T('actions.transfer'));

    state.attacker = state.defender;
    state.defender = newDefender;
    state.transferMode = false;
    state.passed = [];
    state.thrower = null;
    // After a transfer the attack limit is based on the NEW defender's hand
    // at the moment they become defender. Cards already on the table are part
    // of that same limit; they must not be added to the hand size.
    state.boutDefenderStart = state.hands[newDefender].length;
    state.maxAttacks = Math.min(attackLimit(), state.boutDefenderStart);
    state.phase = 'defense';
    state.defenseTarget = Math.max(0, firstUnbeatenIndex());
    if (state.defender === 0) setStatusForDefense();
    else setStatus('status.waitBot', { name: name(state.defender) });
    draw();
  }

  /* ---------------- dorzucanie ---------------- */
  function throwInOrder() {
    const total = state.players.length;
    const list = [];
    for (let step = 0; step < total; step += 1) {
      const index = (state.attacker + step) % total;
      if (index === state.defender || state.out[index]) continue;
      list.push(index);
    }
    if (!state.rules.throwInAll) return list.filter((index) => index === state.attacker);
    return list;
  }

  function openThrowIn(taking) {
    state.taking = taking;
    state.passed = [];
    state.thrower = null;
    state.phase = 'throwin';
    advanceThrowIn();
    draw();
  }

  function advanceThrowIn() {
    if (state.table.length >= state.maxAttacks) { resolveBout(); return; }
    const order = throwInOrder();
    for (const player of order) {
      if (state.passed.indexOf(player) >= 0) continue;
      if (!R.legalThrowIns(state.hands[player], state.table).length) {
        state.passed.push(player);
        continue;
      }
      state.thrower = player;
      state.phase = 'throwin';
      if (player === 0) {
        setStatus(state.taking ? 'status.yourThrowInTake' : 'status.yourThrowIn', { name: name(state.defender) });
      } else {
        setStatus('status.waitBot', { name: name(player) });
      }
      return;
    }
    resolveBout();
  }

  function passThrowIn(player) {
    if (state.passed.indexOf(player) < 0) state.passed.push(player);
    state.thrower = null;
    if (player !== 0) setBubble(player, T('actions.pass'));
    addLog('log.pass', { name: name(player) });
    advanceThrowIn();
    draw();
  }

  /* ---------------- koniec tury ---------------- */
  function resolveBout() {
    clearTimers();
    state.thrower = null;
    const cards = R.tableCards(state.table);
    const taking = state.taking;
    const defender = state.defender;

    if (taking) {
      state.hands[defender].push(...cards);
    } else {
      state.discard.push(...cards);
      state.discardCount += cards.length;
      addLog('log.bito', { count: cards.length });
      playSound('bito');
    }

    const nextAttacker = taking ? nextActive(defender) : defender;
    state.collecting = taking ? 'take' : 'discard';
    state.phase = 'refill';
    setStatus(taking ? 'status.waitBot' : 'status.waitBot', { name: name(nextAttacker) });
    U.render(state);

    if (collectTimer) window.clearTimeout(collectTimer);
    const delay = state.settings.animations ? pacedDelay(420) : 10;
    collectTimer = window.setTimeout(() => {
      state.table = [];
      state.collecting = null;
      refillHands();
      checkOuts();
      const active = activePlayers();
      if (active.length <= 1) { finishRound(); return; }
      startBoutFrom(nextAttacker);
    }, delay);
  }

  function refillOrder() {
    const total = state.players.length;
    const list = [];
    for (let step = 0; step < total; step += 1) {
      const index = (state.attacker + step) % total;
      if (index === state.defender) continue;
      list.push(index);
    }
    list.push(state.defender);
    return list.filter((index) => index != null && !state.out[index]);
  }

  function refillHands() {
    if (!state.deck.length) return;
    refillOrder().forEach((player) => {
      let drawn = 0;
      while (state.hands[player].length < 6 && state.deck.length) {
        state.hands[player].push(state.deck.shift());
        drawn += 1;
      }
      if (drawn) addLog('log.draw', { name: name(player), count: drawn });
    });
    if (!state.deck.length) addLog('log.deckEmpty');
  }

  function checkOuts() {
    state.players.forEach((_, index) => {
      if (!state.out[index] && state.hands[index].length === 0 && state.deck.length === 0) {
        state.out[index] = true;
        state.outOrder.push(index);
        addLog('log.out', { name: name(index) });
      }
    });
  }

  function finishRound() {
    clearTimers();
    if (collectTimer) window.clearTimeout(collectTimer);
    state.collecting = null;
    state.table = [];
    state.phase = 'end';
    state.thrower = null;
    clearBubbles();
    const active = activePlayers();
    state.durak = active.length === 1 ? active[0] : null;

    let title;
    let body;
    let bad = false;
    if (state.durak == null) {
      state.stats.draws += 1;
      addLog('log.drawGame');
      title = T('result.drawTitle');
      body = `<p>${T('result.drawBody')}</p>`;
    } else if (state.durak === 0) {
      state.stats.losses += 1;
      bad = true;
      addLog('log.durak', { name: name(0) });
      title = T('result.durakTitleYou');
      body = `<p>${T('result.durakBodyYou')}</p>`;
    } else {
      state.stats.wins += 1;
      addLog('log.durak', { name: name(state.durak) });
      title = T('result.durakTitleBot', { name: name(state.durak) });
      body = `<p>${T('result.durakBodyBot', { name: name(state.durak) })}</p>`;
    }
    const order = state.outOrder.map((index) => name(index)).join(' → ');
    if (order) body += `<p>${T('result.place', { order })}</p>`;
    body += `<p>${T('result.score', state.stats)}</p>`;
    state.result = { title, body, bad };
    setStatus('status.roundOver');
    saveMeta();
    clearSession();
    draw();
  }

  /* ---------------- boty ---------------- */
  function knownIds(player) {
    const ids = [];
    state.hands[player].forEach((card) => ids.push(card.id));
    state.discard.forEach((card) => ids.push(card.id));
    R.tableCards(state.table).forEach((card) => ids.push(card.id));
    if (state.trumpCard && state.deck.length) ids.push(state.trumpCard.id);
    return ids;
  }

  function botContext(player) {
    const nextDef = state.defender == null ? player : nextActive(state.defender);
    const canTransfer = state.rules.transfer
      && player === state.defender
      && R.transferOptions(state.hands[player], state.table).length > 0
      && nextDef !== state.defender
      && state.hands[nextDef].length >= state.table.length + 1;
    return {
      hand: state.hands[player],
      table: state.table,
      trump: state.trump,
      deckCount: state.deck.length,
      defenderCount: state.defender == null ? 0 : state.hands[state.defender].length,
      nextDefenderCount: state.hands[nextDef].length,
      difficulty: state.players[player].difficulty,
      taking: state.taking,
      canTransfer,
      known: knownIds(player),
      rng: Math.random,
    };
  }

  function scheduleBot() {
    clearTimers();
    if (menuOpen || state.phase === 'end' || state.phase === 'idle' || state.phase === 'refill') return;
    let actor = null;
    if (state.phase === 'attack') actor = state.attacker;
    else if (state.phase === 'defense') actor = state.defender;
    else if (state.phase === 'throwin') actor = state.thrower;
    if (actor == null || !state.players[actor] || !state.players[actor].isBot) return;
    botTimer = window.setTimeout(() => { botTimer = null; runBot(actor); }, pacedDelay(620));
  }

  function runBot(player) {
    if (menuOpen) return;
    if (state.phase === 'attack' && state.attacker === player) {
      const card = B.chooseAttack(botContext(player)) || state.hands[player][0];
      if (card) playAttack(player, card);
      return;
    }
    if (state.phase === 'defense' && state.defender === player) {
      const decision = B.chooseDefense(botContext(player));
      if (decision.type === 'take') { doTake(player); return; }
      if (decision.type === 'transfer') { doTransfer(player, decision.card); return; }
      if (decision.type === 'beat') {
        const index = state.table.indexOf(decision.pair);
        playDefense(player, index >= 0 ? index : firstUnbeatenIndex(), decision.card);
        return;
      }
      doTake(player);
      return;
    }
    if (state.phase === 'throwin' && state.thrower === player) {
      const card = B.chooseThrowIn(botContext(player));
      if (card) playAttack(player, card);
      else passThrowIn(player);
    }
  }

  /* ---------------- ruchy gracza ---------------- */
  function humanCardClick(cardId) {
    const legal = U.playableIds(state);
    if (!legal.has(cardId)) return;
    const card = state.hands[0].find((c) => c.id === cardId);
    if (!card) return;
    if (state.phase === 'attack' && state.attacker === 0) { playAttack(0, card); return; }
    if (state.phase === 'defense' && state.defender === 0) {
      if (state.transferMode) doTransfer(0, card);
      else playDefense(0, state.defenseTarget, card);
      return;
    }
    if (state.phase === 'throwin' && state.thrower === 0) playAttack(0, card);
  }

  function humanPairClick(index) {
    if (state.phase !== 'defense' || state.defender !== 0 || state.transferMode) return;
    const pair = state.table[index];
    if (!pair || pair.defense) return;
    state.defenseTarget = index;
    setStatusForDefense();
    draw();
  }

  /* ---------------- samouczek ---------------- */
  function tutorialSteps() {
    return D.i18n.get('tutorial.steps') || [];
  }

  function tutorialVisual(step, index) {
    const cards = [
      '', '',
      '<div class="mini-cards"><div class="mini-card suit-S">9</div><div class="mini-card suit-C">7</div><div class="mini-card back"></div></div>',
      '<div class="mini-cards"><div class="mini-card suit-S">9</div><div class="mini-card suit-S">K</div></div>',
      '<div class="mini-cards"><div class="mini-card suit-S">9</div><div class="mini-card suit-D">9</div><div class="mini-card suit-H">9</div></div>',
      '', '', '',
    ];
    return `<div>${step.icon}</div>${cards[index] || ''}`;
  }

  function renderTutorialModal() {
    const steps = tutorialSteps();
    const step = steps[tutorialStep] || steps[0];
    if (!step) return;
    el('tutorial-title').textContent = T('tutorial.title');
    el('tutorial-visual').innerHTML = tutorialVisual(step, tutorialStep);
    el('tutorial-step-title').textContent = step.title;
    el('tutorial-step-body').textContent = step.body;
    el('tutorial-progress').innerHTML = steps.map((_, index) => `<i class="${index <= tutorialStep ? 'done' : ''}"></i>`).join('');
    const prev = el('tutorial-prev');
    const next = el('tutorial-next');
    prev.textContent = T('tutorial.back');
    prev.classList.toggle('disabled', tutorialStep === 0);
    prev.disabled = tutorialStep === 0;
    next.textContent = tutorialStep >= steps.length - 1 ? T('tutorial.start') : T('tutorial.next');
  }

  function openTutorial() {
    tutorialStep = 0;
    el('tutorial-modal').classList.remove('hidden');
    renderTutorialModal();
  }

  function closeTutorialModal() {
    el('tutorial-modal').classList.add('hidden');
  }

  /* Przygotowane rozdanie treningowe — powtarzalne dzięki ziarnu RNG. */
  function practicePreset() {
    const humanIds = ['S-6', 'C-7', 'D-8', 'S-10', 'H-7', 'C-A'];
    const botIds = ['D-7', 'C-9', 'S-J', 'H-10', 'D-Q', 'C-K'];
    const byId = new Map(R.createDeck().map((card) => [card.id, card]));
    const used = new Set(humanIds.concat(botIds, ['H-6']));
    const rest = R.shuffle(R.createDeck().filter((card) => !used.has(card.id)), seededRandom(20260826));
    rest.push(byId.get('H-6'));
    return {
      hands: [humanIds.map((id) => byId.get(id)), botIds.map((id) => byId.get(id))],
      deck: rest,
    };
  }

  let beforePractice = null;

  function startPractice() {
    closeTutorialModal();
    hideMainMenu();
    clearSession();
    /* Trening nie może nadpisać ustawień i bilansu zwykłej gry. */
    beforePractice = {
      rules: { ...state.rules },
      botCount: state.botCount,
      botConfig: state.botConfig.slice(),
      beginnerMode: state.settings.beginnerMode,
      stats: { ...state.stats },
      round: state.round,
    };
    state.tutorial = { active: true, coach: null, hintCardId: null };
    state.players = buildPlayers(1, ['normal']);
    state.botCount = 1;
    state.rules = { throwInAll: true, transfer: true, limitSix: true };
    state.settings.beginnerMode = true;
    state.stats = { wins: 0, losses: 0, draws: 0 };
    state.round = 0;
    state.helperTab = 'players';
    setHelperTab('players');
    startRound(practicePreset());
  }

  function exitTutorial() {
    state.tutorial = { active: false, coach: null, hintCardId: null };
    clearTimers();
    if (beforePractice) {
      state.rules = { ...beforePractice.rules };
      state.botCount = beforePractice.botCount;
      state.botConfig = beforePractice.botConfig.slice();
      state.settings.beginnerMode = beforePractice.beginnerMode;
      state.stats = { ...beforePractice.stats };
      state.round = beforePractice.round;
      beforePractice = null;
    }
    state.phase = 'idle';
    state.result = null;
    state.players = [];
    state.hands = [];
    state.table = [];
    state.out = [];
    state.bubbles = [];
    state.attacker = null;
    state.defender = null;
    showMainMenu();
    draw();
  }

  function coachHint() {
    const hand = state.hands[0] || [];
    if (state.phase === 'attack' && state.attacker === 0) {
      const nonTrump = hand.filter((c) => !R.isTrump(c, state.trump)).sort((a, b) => R.cardCost(a, state.trump) - R.cardCost(b, state.trump));
      return (nonTrump[0] || hand[0] || null);
    }
    if (state.phase === 'defense' && state.defender === 0 && !state.transferMode) {
      const pair = state.table[state.defenseTarget];
      if (!pair || pair.defense) return null;
      const options = R.beatOptions(hand, pair.attack, state.trump)
        .sort((a, b) => R.cardCost(a, state.trump) - R.cardCost(b, state.trump));
      return options[0] || null;
    }
    if (state.phase === 'throwin' && state.thrower === 0) {
      const legal = R.legalThrowIns(hand, state.table)
        .filter((c) => !R.isTrump(c, state.trump))
        .sort((a, b) => R.cardCost(a, state.trump) - R.cardCost(b, state.trump));
      return legal[0] || null;
    }
    return null;
  }

  function updateCoach() {
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
      title: T(`tutorial.coach.${key}Title`),
      body: T(`tutorial.coach.${key}`),
      rule: key === 'wait' || key === 'end' || key === 'intro' ? '' : rule,
    };
  }

  /* ---------------- menu i modale ---------------- */
  function refreshMainMenu() {
    const button = el('menu-continue');
    const label = button?.querySelector('[data-menu-continue-label]');
    const detail = el('menu-continue-detail');
    const info = el('menu-session-info');
    const online = window.DurakMP?.getResumeCandidate?.();
    if (online?.type === 'online') {
      button?.classList.remove('hidden');
      if (button) button.dataset.resumeType = 'online';
      if (label) label.textContent = T('menu.continueOnline');
      if (detail) detail.textContent = online.roomId ? online.roomId : '';
      if (info) info.textContent = online.roomId ? T('menu.continueOnline') + ' · ' + online.roomId : T('menu.continueOnline');
      return;
    }
    const saved = readSavedSession();
    if (saved) {
      button?.classList.remove('hidden');
      if (button) button.dataset.resumeType = 'offline';
      if (label) label.textContent = T('menu.continue');
      const phase = D.i18n.t(`phase.${saved.phase}`);
      const summary = T('menu.saved', { round: saved.round, phase: typeof phase === 'string' ? phase : saved.phase });
      if (detail) detail.textContent = summary;
      if (info) info.textContent = summary;
    } else {
      button?.classList.add('hidden');
      if (button) delete button.dataset.resumeType;
      if (detail) detail.textContent = '';
      if (info) info.textContent = T('menu.noSave');
    }
  }

  function showMainMenu() {
    menuOpen = true;
    clearTimers();
    el('main-menu').classList.remove('hidden');
    el('result-modal').classList.add('hidden');
    refreshMainMenu();
  }

  function hideMainMenu() {
    menuOpen = false;
    el('main-menu').classList.add('hidden');
  }

  function continueSaved() {
    const data = readSavedSession();
    if (!data) { refreshMainMenu(); return; }
    Object.assign(state, data);
    state.tutorial = { active: false, coach: null, hintCardId: null };
    state.result = null;
    state.collecting = null;
    state.transferMode = false;
    state.dealAnimation = false;
    clearBubbles();
    hideMainMenu();
    draw();
  }

  function difficultyOptions(selected) {
    return ['easy', 'normal', 'hard', 'expert']
      .map((key) => `<option value="${key}"${key === selected ? ' selected' : ''}>${T(`difficulty.${key}`)}</option>`)
      .join('');
  }

  function renderNewGameSetup() {
    if (!pendingNewGame) return;
    const rows = el('bot-rows');
    rows.innerHTML = Array.from({ length: pendingNewGame.botCount }, (_, index) => {
      const botName = D.BOT_NAMES[index];
      return `<div class="bot-row">
        <div class="avatar">${botName.slice(0, 2).toUpperCase()}</div>
        <div><b>${botName}</b><small>${T('newGame.botLabel', { index: index + 1 })} · ${T('newGame.botHint')}</small></div>
        <select data-bot-index="${index}" aria-label="${botName}">${difficultyOptions(pendingNewGame.bots[index])}</select>
      </div>`;
    }).join('');
    const countSelect = document.querySelector('[data-new-setting="botCount"]');
    if (countSelect) countSelect.value = String(pendingNewGame.botCount);
    document.querySelectorAll('[data-new-rule]').forEach((node) => {
      node.checked = !!pendingNewGame.rules[node.dataset.newRule];
    });
  }

  function openNewGameSetup() {
    pendingNewGame = {
      botCount: state.botCount,
      bots: state.botConfig.slice(0, 3),
      rules: { ...state.rules },
    };
    while (pendingNewGame.bots.length < 3) pendingNewGame.bots.push('normal');
    el('new-game-modal').classList.remove('hidden');
    renderNewGameSetup();
  }

  function closeNewGameSetup() {
    el('new-game-modal').classList.add('hidden');
    pendingNewGame = null;
  }

  function confirmNewGameSetup() {
    if (!pendingNewGame) return;
    state.botCount = pendingNewGame.botCount;
    state.botConfig = pendingNewGame.bots.slice();
    state.rules = { ...pendingNewGame.rules };
    closeNewGameSetup();
    startNewGame();
  }

  function startNewGame() {
    clearSession();
    hideMainMenu();
    state.tutorial = { active: false, coach: null, hintCardId: null };
    state.players = buildPlayers(state.botCount, state.botConfig);
    state.round = 0;
    state.result = null;
    saveMeta();
    startRound(null);
  }

  function setHelperTab(tab) {
    state.helperTab = tab;
    document.querySelectorAll('[data-helper-tab]').forEach((node) => {
      node.classList.toggle('active', node.dataset.helperTab === tab);
    });
    document.querySelectorAll('[data-helper-pane]').forEach((node) => {
      node.classList.toggle('hidden', node.dataset.helperPane !== tab);
    });
  }

  function setSetting(key, value) {
    if (key in state.rules) state.rules[key] = value;
    else state.settings[key] = value;
    saveMeta();
    draw();
  }

  function setLanguage(language) {
    if (!D.i18n.languages[language]) return;
    state.settings.language = language;
    D.i18n.setLanguage(language);
    if (state.players.length) state.players[0].name = T('common.you');
    saveMeta();
    applyLanguageToDOM();
    renderTutorialModal();
    refreshMainMenu();
    if (pendingNewGame) renderNewGameSetup();
    draw();
  }

  function applyLanguageToDOM() {
    const language = D.i18n.languages[state.settings.language] ? state.settings.language : 'pl';
    D.i18n.setLanguage(language);
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const value = D.i18n.t(node.dataset.i18n);
      if (typeof value === 'string') node.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
      const value = D.i18n.t(node.dataset.i18nAria);
      if (typeof value === 'string') node.setAttribute('aria-label', value);
    });
    document.querySelectorAll('[data-language-select]').forEach((select) => { select.value = language; });
    ['slow', 'normal', 'fast'].forEach((speed) => {
      document.querySelectorAll(`#speed-select option[value="${speed}"], [data-setting="speed"] option[value="${speed}"]`)
        .forEach((option) => { option.textContent = D.i18n.t(`speed.${speed}`); });
    });
  }

  /* ---------------- zdarzenia ---------------- */
  function handleClick(event) {
    const actionEl = event.target.closest('[data-action]');
    if (actionEl && !actionEl.disabled && !actionEl.classList.contains('disabled')) {
      const action = actionEl.dataset.action;
      switch (action) {
        case 'human-take': if (state.phase === 'defense' && state.defender === 0) doTake(0); break;
        case 'human-pass': if (state.phase === 'throwin' && state.thrower === 0) passThrowIn(0); break;
        case 'start-transfer': state.transferMode = true; setStatusForDefense(); draw(); break;
        case 'cancel-transfer': state.transferMode = false; setStatusForDefense(); draw(); break;
        case 'next-round': state.result = null; startRound(state.tutorial.active ? practicePreset() : null); break;
        case 'open-settings': el('settings-modal').classList.remove('hidden'); break;
        case 'close-settings': el('settings-modal').classList.add('hidden'); break;
        case 'open-main-menu': showMainMenu(); break;
        case 'menu-continue': if (window.DurakMP?.continuePreferred) window.DurakMP.continuePreferred(); else continueSaved(); break;
        case 'menu-new-game': openNewGameSetup(); break;
        case 'menu-online': window.DurakMP?.openOverlay?.(); break;
        case 'close-new-game': closeNewGameSetup(); break;
        case 'confirm-new-game': confirmNewGameSetup(); break;
        case 'menu-tutorial': openTutorial(); break;
        case 'tutorial-close': closeTutorialModal(); break;
        case 'tutorial-prev': tutorialStep = Math.max(0, tutorialStep - 1); renderTutorialModal(); break;
        case 'tutorial-next': {
          const steps = tutorialSteps();
          if (tutorialStep >= steps.length - 1) startPractice();
          else { tutorialStep += 1; renderTutorialModal(); }
          break;
        }
        case 'tutorial-exit': exitTutorial(); break;
        default: break;
      }
      return;
    }

    const tab = event.target.closest('[data-helper-tab]');
    if (tab) { setHelperTab(tab.dataset.helperTab); return; }

    const pair = event.target.closest('[data-pair-index]');
    if (pair) { humanPairClick(Number(pair.dataset.pairIndex)); return; }

    const cardEl = event.target.closest('[data-card-id]');
    if (cardEl && cardEl.tagName === 'BUTTON' && !cardEl.disabled) humanCardClick(cardEl.dataset.cardId);
  }

  function handleChange(event) {
    const target = event.target;
    if (target.matches('[data-language-select]')) { setLanguage(target.value); return; }
    if (target.id === 'speed-select') { setSetting('speed', target.value); return; }
    if (target.matches('[data-bot-index]') && pendingNewGame) {
      pendingNewGame.bots[Number(target.dataset.botIndex)] = target.value;
      return;
    }
    if (target.matches('[data-new-setting]') && pendingNewGame) {
      if (target.dataset.newSetting === 'botCount') {
        pendingNewGame.botCount = Number(target.value);
        renderNewGameSetup();
      }
      return;
    }
    if (target.matches('[data-new-rule]') && pendingNewGame) {
      pendingNewGame.rules[target.dataset.newRule] = target.checked;
      return;
    }
    if (target.dataset && target.dataset.setting) {
      const value = target.type === 'checkbox' ? target.checked : target.value;
      setSetting(target.dataset.setting, value);
    }
  }

  function init() {
    loadMeta();
    D.i18n.setLanguage(state.settings.language);
    applyLanguageToDOM();
    setHelperTab('players');
    document.addEventListener('click', handleClick);
    document.addEventListener('change', handleChange);
    U.render(state);
    renderTutorialModal();
    showMainMenu();
  }

  D.game = { state, init, startNewGame, startPractice, showMainMenu, hideMainMenu, refreshMainMenu, readSavedSession, continueSaved, clearSession, refresh: draw };
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();