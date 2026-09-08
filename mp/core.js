(() => {
  'use strict';

  const D = window.DurakMP = {};
  D.$ = (id) => document.getElementById(id);
  D.MAX_MESSAGE = 64 * 1024;
  D.ROOM_RE = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

  D.TEXT = {
    pl:{online:'Gra online',privateTable:'STÓŁ QQND SERVER',title:'Multiplayer',lead:'Utwórz pokój, dołącz kodem albo wybierz publiczny stół. Rozgrywka korzysta ze wspólnego serwera QQND.',name:'Nazwa gracza',create:'Utwórz pokój',join:'Dołącz',networkNote:'Tryb online korzysta ze wspólnego serwera QQND. Stan gry może zostać wznowiony po odświeżeniu przeglądarki.',roomCode:'Kod pokoju',copy:'Kopiuj',copied:'Skopiowano',fillBot:'Uzupełnij trzecie miejsce botem',fillBotHint:'Bot zajmuje trzecie miejsce i jest wykonywany przez przeglądarkę hosta.',difficulty:'Poziom bota',leave:'Opuść',start:'Rozpocznij grę',host:'Host',human:'Gracz',bot:'Bot',empty:'Wolne miejsce',connected:'Połączony',ready:'Gotowy',reserved:'Zarezerwowane',creating:'Tworzę pokój…',joining:'Łączenie z pokojem…',signalingError:'Nie udało się połączyć z serwerem QQND.',invalidName:'Nazwa musi mieć 3–20 znaków.',invalidRoom:'Wpisz poprawny kod pokoju.',waiting:'Czekam na co najmniej jednego drugiego gracza.',canStart:'Stół gotowy. Host może rozpocząć.',guestWait:'Połączono. Czekaj, aż host rozpocznie grę.',roomFull:'Pokój jest pełny albo miejsce jest zarezerwowane dla bota.',connectionLost:'Połączenie zostało przerwane',connectionLostText:'Czekamy na powrót gracza. Po 60 sekundach jego miejsce może przejąć bot.',backMenu:'Wróć do menu',illegal:'Host odrzucił nielegalny ruch.',unavailableLocal:'Multiplayer nie działa z adresu file://. Uruchom grę przez HTTPS; tryb offline nadal działa normalnie.',hostGone:'Host rozłączył się.',guestGone:'Gracz rozłączył się.',botSeat:'Bot · {level}',thirdOptional:'Trzecie miejsce jest opcjonalne.'},
    en:{online:'Online game',privateTable:'QQND SERVER TABLE',title:'Multiplayer',lead:'Create a room, join by code, or choose a public table. Gameplay uses the shared QQND server.',name:'Player name',create:'Create room',join:'Join',networkNote:'Online play uses the shared QQND server. Game state can be resumed after restarting the browser.',roomCode:'Room code',copy:'Copy',copied:'Copied',fillBot:'Fill the third seat with a bot',fillBotHint:'The bot occupies the third seat and is run by the host browser.',difficulty:'Bot difficulty',leave:'Leave',start:'Start game',host:'Host',human:'Player',bot:'Bot',empty:'Empty seat',connected:'Connected',ready:'Ready',reserved:'Reserved',creating:'Creating room…',joining:'Joining room…',signalingError:'Could not reach the QQND server.',invalidName:'Name must be 3–20 characters.',invalidRoom:'Enter a valid room code.',waiting:'Waiting for at least one other human player.',canStart:'Table ready. The host can start.',guestWait:'Connected. Waiting for the host to start.',roomFull:'The room is full or the seat is reserved for a bot.',connectionLost:'Connection lost',connectionLostText:'Waiting for the player to return. After 60 seconds a bot may take the seat.',backMenu:'Back to menu',illegal:'The host rejected an illegal move.',unavailableLocal:'Multiplayer cannot run from file://. Serve the game over HTTPS; offline play still works normally.',hostGone:'The host disconnected.',guestGone:'A player disconnected.',botSeat:'Bot · {level}',thirdOptional:'The third seat is optional.'},
    de:{online:'Online spielen',privateTable:'QQND-SERVERTISCH',title:'Mehrspieler',lead:'Erstelle einen Raum, tritt per Code bei oder wähle einen öffentlichen Tisch. Das Spiel nutzt den gemeinsamen QQND-Server.',name:'Spielername',create:'Raum erstellen',join:'Beitreten',networkNote:'Online nutzt den gemeinsamen QQND-Server. Der Spielzustand kann nach einem Browser-Neustart wiederhergestellt werden.',roomCode:'Raumcode',copy:'Kopieren',copied:'Kopiert',fillBot:'Dritten Platz mit Bot füllen',fillBotHint:'Der Bot besetzt den dritten Platz und läuft im Browser des Hosts.',difficulty:'Bot-Stärke',leave:'Verlassen',start:'Spiel starten',host:'Host',human:'Spieler',bot:'Bot',empty:'Freier Platz',connected:'Verbunden',ready:'Bereit',reserved:'Reserviert',creating:'Raum wird erstellt…',joining:'Verbindung…',signalingError:'Keine Verbindung zum QQND-Server.',invalidName:'Name: 3–20 Zeichen.',invalidRoom:'Gültigen Raumcode eingeben.',waiting:'Warte auf mindestens einen weiteren Menschen.',canStart:'Tisch bereit. Der Host kann starten.',guestWait:'Verbunden. Warte auf den Host.',roomFull:'Raum voll oder Platz für Bot reserviert.',connectionLost:'Verbindung unterbrochen',connectionLostText:'Wir warten auf die Rückkehr des Spielers. Nach 60 Sekunden kann ein Bot übernehmen.',backMenu:'Zum Menü',illegal:'Der Host hat einen ungültigen Zug abgelehnt.',unavailableLocal:'Mehrspieler funktioniert nicht über file://. Nutze HTTPS; Offline bleibt verfügbar.',hostGone:'Der Host hat die Verbindung getrennt.',guestGone:'Ein Spieler hat die Verbindung getrennt.',botSeat:'Bot · {level}',thirdOptional:'Der dritte Platz ist optional.'},
    ru:{online:'Игра онлайн',privateTable:'СТОЛ QQND SERVER',title:'Мультиплеер',lead:'Создайте комнату, войдите по коду или выберите публичный стол. Игра использует общий сервер QQND.',name:'Имя игрока',create:'Создать комнату',join:'Войти',networkNote:'Онлайн использует общий сервер QQND. Состояние игры можно восстановить после перезапуска браузера.',roomCode:'Код комнаты',copy:'Копировать',copied:'Скопировано',fillBot:'Заполнить третье место ботом',fillBotHint:'Бот занимает третье место и выполняется браузером хоста.',difficulty:'Сложность бота',leave:'Выйти',start:'Начать игру',host:'Хост',human:'Игрок',bot:'Бот',empty:'Свободно',connected:'Подключён',ready:'Готов',reserved:'Занято',creating:'Создаю комнату…',joining:'Подключение…',signalingError:'Не удалось подключиться к серверу QQND.',invalidName:'Имя должно быть длиной 3–20 символов.',invalidRoom:'Введите правильный код комнаты.',waiting:'Жду хотя бы одного второго игрока.',canStart:'Стол готов. Хост может начать.',guestWait:'Подключено. Ждите запуска хостом.',roomFull:'Комната заполнена или место зарезервировано для бота.',connectionLost:'Соединение потеряно',connectionLostText:'Ожидаем возвращения игрока. Через 60 секунд его место может занять бот.',backMenu:'В меню',illegal:'Хост отклонил недопустимый ход.',unavailableLocal:'Мультиплеер не работает через file://. Откройте игру по HTTPS; офлайн работает как обычно.',hostGone:'Хост отключился.',guestGone:'Игрок отключился.',botSeat:'Bot · {level}',thirdOptional:'Третье место необязательно.'},
  };

  D.mp = {
    active:false, role:null, roomCode:'', name:'Gracz', localSeat:0, hostToken:'', socket:null,
    peers:new Map(), peer:null, inGame:false, paused:false, botSeat:null, botDifficulty:'normal',
    revision:0, lastRevision:0, guestView:null, guestUi:{defenseTarget:0,transferMode:false},
    remoteQueue:new Map(), hooksInstalled:false, originalBot:null, originalRender:null,
    game:null, closeExpected:false, fakeTestMode:false,
  };

  D.language = () => {
    const value = window.Durak?.game?.state?.settings?.language || window.Durak?.i18n?.language;
    return D.TEXT[value] ? value : 'pl';
  };
  D.tr = (key, vars) => {
    let value = (D.TEXT[D.language()] || D.TEXT.pl)[key] || D.TEXT.pl[key] || key;
    if (vars) value = value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
    return value;
  };
  D.applyLanguage = () => {
    document.documentElement.lang = D.language();
    document.querySelectorAll('[data-mp-i18n]').forEach((node) => {
      const value = D.tr(node.dataset.mpI18n);
      if (value) node.textContent = value;
    });
  };
  D.initials = (name) => Array.from(String(name || '?').trim()).slice(0,2).join('').toUpperCase();
  D.validName = (value) => {
    const name = String(value || '').normalize('NFKC').replace(/\s+/g,' ').trim();
    const len = Array.from(name).length;
    return len >= 3 && len <= 20 && /^[\p{L}\p{N} _-]+$/u.test(name);
  };
  D.normalizeRoom = (value) => {
    const raw = String(value || '').toUpperCase().replace(/[^A-Z2-9]/g,'');
    return raw.length === 8 ? `${raw.slice(0,4)}-${raw.slice(4)}` : '';
  };
  D.setStatus = (id, text, error = false) => {
    const node = D.$(id);
    if (!node) return;
    node.textContent = text || '';
    node.classList.toggle('error', !!error);
  };
  D.safeSend = (channel, message) => {
    try {
      if (channel?.readyState === 'open') channel.send(JSON.stringify(message));
    } catch {}
  };
  D.parseMessage = (raw) => {
    if (typeof raw !== 'string' || raw.length > D.MAX_MESSAGE) return null;
    try {
      const value = JSON.parse(raw);
      return value && typeof value.type === 'string' ? value : null;
    } catch {
      return null;
    }
  };
  D.gameDoc = () => document;
  D.hideGameMenu = () => document.getElementById('main-menu')?.classList.add('hidden');
  D.showGameMenu = () => window.Durak?.game?.showMainMenu?.();
  D.escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  D.peerForSeat = (seat) => {
    for (const peer of D.mp.peers.values()) if (peer.seat === seat && peer.connected) return peer;
    return null;
  };
})();
