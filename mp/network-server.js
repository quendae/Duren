(() => {
  'use strict';

  const D = window.DurakMP;
  const mp = D.mp;
  const GAME_ID = 'duren';
  const CLIENT_BUILD = '20260906-shared1';
  const WS_URL = window.DURAK_WS_URL || 'wss://api.qqnd.fyi/api/v1/ws';
  const SESSION_KEY = 'duren.qqnd.server-session.v1';
  const REQUEST_TIMEOUT_MS = 12000;
  const legacyStartHostGame = D.startHostGame;

  Object.assign(mp, {
    socketPromise: null,
    reconnectTimer: null,
    reconnectAttempt: 0,
    intentionalClose: false,
    waiters: [],
    session: null,
    resumeToken: '',
    roomObj: null,
    hostSessionId: '',
    rooms: [],
    botSeats: [],
    graceBySeat: {},
    graceTicker: null,
    presenceTransientTimer: null,
    starting: false,
    clientBuild: CLIENT_BUILD,
  });

  for (const pack of Object.values(D.TEXT)) {
    Object.assign(pack, {
      privateTable: pack === D.TEXT.pl ? 'STÓŁ QQND SERVER' : pack === D.TEXT.de ? 'QQND-SERVERTISCH' : pack === D.TEXT.ru ? 'СТОЛ QQND SERVER' : 'QQND SERVER TABLE',
      networkNote: pack === D.TEXT.pl ? 'Tryb online korzysta ze wspólnego serwera QQND. Stan gry może zostać wznowiony po odświeżeniu przeglądarki.' : pack === D.TEXT.de ? 'Online nutzt den gemeinsamen QQND-Server. Der Spielzustand kann nach einem Browser-Neustart wiederhergestellt werden.' : pack === D.TEXT.ru ? 'Онлайн использует общий сервер QQND. Состояние игры можно восстановить после перезапуска браузера.' : 'Online play uses the shared QQND server. Game state can be resumed after restarting the browser.',
      signalingError: pack === D.TEXT.pl ? 'Nie udało się połączyć z serwerem QQND.' : pack === D.TEXT.de ? 'Keine Verbindung zum QQND-Server.' : pack === D.TEXT.ru ? 'Не удалось подключиться к серверу QQND.' : 'Could not reach the QQND server.',
      connectionLostText: pack === D.TEXT.pl ? 'Czekamy na powrót gracza. Po 60 sekundach jego miejsce może przejąć bot.' : pack === D.TEXT.de ? 'Wir warten auf die Rückkehr des Spielers. Nach 60 Sekunden kann ein Bot übernehmen.' : pack === D.TEXT.ru ? 'Ожидаем возвращения игрока. Через 60 секунд его место может занять бот.' : 'Waiting for the player to return. After 60 seconds a bot may take the seat.',
    });
  }

  function socketSend(payload) {
    if (mp.socket?.readyState !== WebSocket.OPEN) throw new Error('server_not_connected');
    mp.socket.send(JSON.stringify(payload));
  }

  function addWaiter(types, predicate = () => true, timeout = REQUEST_TIMEOUT_MS) {
    const accepted = new Set(Array.isArray(types) ? types : [types]);
    return new Promise((resolve, reject) => {
      const waiter = { accepted, predicate, resolve, reject, timer: null };
      waiter.timer = setTimeout(() => {
        mp.waiters = mp.waiters.filter((item) => item !== waiter);
        reject(new Error('timeout'));
      }, timeout);
      mp.waiters.push(waiter);
    });
  }

  function settleWaiters(message) {
    for (const waiter of [...mp.waiters]) {
      if (message.type === 'error') {
        clearTimeout(waiter.timer);
        mp.waiters = mp.waiters.filter((item) => item !== waiter);
        waiter.reject(new Error(message.code || 'server_error'));
        continue;
      }
      if (!waiter.accepted.has(message.type) || !waiter.predicate(message)) continue;
      clearTimeout(waiter.timer);
      mp.waiters = mp.waiters.filter((item) => item !== waiter);
      waiter.resolve(message);
    }
  }

  async function request(payload, types, predicate) {
    await ensureSocket();
    const pending = addWaiter(types, predicate);
    socketSend(payload);
    return pending;
  }

  function loadStoredSession() {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return value?.sessionId && value?.resumeToken && value?.nickname ? value : null;
    } catch {
      return null;
    }
  }

  function storeSession() {
    if (!mp.session?.id || !mp.resumeToken) return;
    try {
      const previous = loadStoredSession() || {};
      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: mp.session.id, resumeToken: mp.resumeToken, nickname: mp.session.nickname, roomId: mp.roomCode || previous.roomId || null, onlineEligible: mp.roomObj?.status === 'in_game' ? true : previous.onlineEligible }));
    } catch {}
  }

  function clearStoredSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }

  function normalizeName(value) {
    return String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  }

  function ensureSocket() {
    if (mp.socket?.readyState === WebSocket.OPEN) return Promise.resolve(mp.socket);
    if (mp.socketPromise) return mp.socketPromise;
    mp.intentionalClose = false;
    mp.socketPromise = new Promise((resolve, reject) => {
      const socket = new WebSocket(WS_URL);
      mp.socket = socket;
      let opened = false;
      const timer = setTimeout(() => {
        if (!opened) {
          try { socket.close(); } catch {}
          reject(new Error('timeout'));
        }
      }, REQUEST_TIMEOUT_MS);

      socket.addEventListener('open', () => { opened = true; });
      socket.addEventListener('message', (event) => {
        const message = D.parseMessage(event.data);
        if (!message) return;
        if (message.type === 'hello') {
          clearTimeout(timer);
          mp.reconnectAttempt = 0;
          resolve(socket);
        }
        settleWaiters(message);
        handleServerMessage(message);
      });
      socket.addEventListener('error', () => {
        if (!opened) {
          clearTimeout(timer);
          reject(new Error('websocket_error'));
        }
      });
      socket.addEventListener('close', () => {
        clearTimeout(timer);
        if (mp.socket === socket) mp.socket = null;
        mp.socketPromise = null;
        mp.session = null;
        for (const waiter of mp.waiters.splice(0)) {
          clearTimeout(waiter.timer);
          waiter.reject(new Error('connection_closed'));
        }
        if (mp.inGame) updatePresenceNotice();
        if (!mp.intentionalClose && loadStoredSession()) scheduleReconnect();
      });
    }).finally(() => { mp.socketPromise = null; });
    return mp.socketPromise;
  }

  function scheduleReconnect() {
    if (mp.reconnectTimer) return;
    const delay = Math.min(10000, 700 * Math.pow(1.7, mp.reconnectAttempt++));
    mp.reconnectTimer = setTimeout(async () => {
      mp.reconnectTimer = null;
      try {
        await ensureSocket();
        await resumeStoredSession(true);
      } catch {
        scheduleReconnect();
      }
    }, delay);
  }

  async function resumeStoredSession(silent = false) {
    if (mp.session) return mp.session;
    const stored = loadStoredSession();
    if (!stored) return null;
    try {
      const message = await request({ type: 'session.resume', sessionId: stored.sessionId, resumeToken: stored.resumeToken }, 'session.resumed');
      mp.session = message.session;
      mp.resumeToken = stored.resumeToken;
      const room = (message.rooms || []).find((item) => item.game === GAME_ID);
      if (room) {
        syncRoom(room);
      }
      if (!silent && D.$('mp-name') && !D.$('mp-name').value) D.$('mp-name').value = stored.nickname;
      return mp.session;
    } catch (error) {
      if (/invalid_session_credentials|session_expired/.test(String(error?.message || error))) {
        clearStoredSession();
        mp.session = null;
        mp.resumeToken = '';
        return null;
      }
      throw error;
    }
  }

  async function ensureSession(name) {
    const nickname = normalizeName(name);
    if (!D.validName(nickname)) throw new Error('invalid_name');
    await ensureSocket();
    if (!mp.session) await resumeStoredSession(true);
    if (mp.session?.nickname === nickname) return mp.session;
    if (mp.session && mp.roomObj) throw new Error('already_in_room');
    if (mp.session && mp.session.nickname !== nickname) {
      mp.session = null;
      mp.resumeToken = '';
      clearStoredSession();
      mp.intentionalClose = true;
      try { mp.socket?.close(1000, 'new session'); } catch {}
      mp.socket = null;
      await ensureSocket();
    }
    const message = await request({ type: 'session.create', nickname }, 'session.created');
    mp.session = message.session;
    mp.resumeToken = message.resumeToken;
    storeSession();
    return mp.session;
  }

  function relayChannel(toSessionId) {
    return {
      readyState: 'open',
      send(raw) {
        if (!mp.roomCode || mp.socket?.readyState !== WebSocket.OPEN) return;
        let payload;
        try { payload = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return; }
        socketSend({ type: 'room.send', roomId: mp.roomCode, toSessionId, payload });
      },
      close() { this.readyState = 'closed'; },
    };
  }

  function rebuildPeers() {
    const next = new Map();
    for (const [seat, player] of (mp.roomObj?.players || []).entries()) {
      if (player.id === mp.session?.id) continue;
      next.set(player.id, {
        guestId: player.id,
        sessionId: player.id,
        nick: player.nickname,
        seat,
        connected: !!player.connected,
        channel: relayChannel(player.id),
        pc: { close() {} },
      });
    }
    mp.peers = next;
  }

  function syncRoom(room) {
    if (!room || room.game !== GAME_ID) return;
    mp.roomObj = room;
    mp.roomCode = room.id;
    if (!mp.inGame || !mp.hostSessionId) mp.hostSessionId = room.ownerSessionId;
    mp.localSeat = mp.session ? room.players.findIndex((player) => player.id === mp.session.id) : 0;
    mp.role = mp.session?.id === mp.hostSessionId ? 'host' : 'guest';
    if (room.players.length >= 3 && mp.botSeat === 2) {
      mp.botSeat = null;
      if (D.$('mp-use-bot')) D.$('mp-use-bot').checked = false;
    }
    rebuildPeers();
    storeSession();
    if (!mp.inGame) {
      D.renderLobby();
      if (mp.role === 'host') D.broadcastLobby();
    }
  }

  D.canHostStart = () => {
    if (mp.role !== 'host' || mp.inGame || !mp.roomObj) return false;
    const humans = mp.roomObj.players || [];
    return humans.length >= 2 && humans.length <= 3 && humans.every((player) => player.connected);
  };

  D.lobbySnapshot = () => {
    const players = mp.roomObj?.players || [];
    const seats = [0, 1, 2].map((seat) => {
      const player = players[seat];
      const bot = !player && seat === 2 && mp.botSeat === 2;
      return {
        seat,
        name: player?.nickname || (bot ? D.tr('bot') : ''),
        kind: player ? 'human' : bot ? 'bot' : 'empty',
        connected: bot || !!player?.connected,
        host: player?.id === mp.hostSessionId,
        difficulty: bot ? mp.botDifficulty : undefined,
      };
    });
    return { room: mp.roomCode, seats, botSeat: mp.botSeat, botDifficulty: mp.botDifficulty, canStart: D.canHostStart() };
  };

  D.renderLobby = (snapshot = D.lobbySnapshot()) => {
    D.$('mp-home')?.classList.add('hidden');
    D.$('mp-lobby')?.classList.remove('hidden');
    if (D.$('mp-room-code')) D.$('mp-room-code').textContent = snapshot.room || mp.roomCode || '—';
    const seats = D.$('mp-seats');
    if (seats) {
      seats.innerHTML = (snapshot.seats || []).map((seat) => {
        const label = seat.kind === 'bot' ? D.tr('botSeat', { level: seat.difficulty || 'normal' }) : seat.kind === 'empty' ? D.tr('empty') : seat.name;
        const detail = seat.host ? D.tr('host') : seat.kind === 'bot' ? D.tr('reserved') : seat.kind === 'empty' ? D.tr('thirdOptional') : D.tr('human');
        const cls = seat.kind === 'bot' ? 'bot' : seat.connected ? 'ready' : '';
        const state = seat.kind === 'bot' ? D.tr('bot') : seat.connected ? D.tr('connected') : D.tr('empty');
        return `<div class="mp-seat"><div class="mp-seat-avatar">${D.initials(label)}</div><div><b>${D.escapeHtml(label)}</b><small>${D.escapeHtml(detail)}</small></div><span class="mp-seat-state ${cls}">${D.escapeHtml(state)}</span></div>`;
      }).join('');
    }
    const hostOnly = mp.role === 'host' && !mp.inGame;
    D.$('mp-bot-panel')?.classList.toggle('hidden', !hostOnly || (mp.roomObj?.players?.length || 0) !== 2);
    D.$('mp-start')?.classList.toggle('hidden', !hostOnly);
    if (D.$('mp-start')) D.$('mp-start').disabled = !snapshot.canStart;
    D.setStatus('mp-lobby-status', mp.role === 'host' ? (snapshot.canStart ? D.tr('canStart') : D.tr('waiting')) : D.tr('guestWait'));
  };

  D.broadcastLobby = () => {
    if (mp.role !== 'host' || !mp.roomCode || mp.socket?.readyState !== WebSocket.OPEN) return;
    const snapshot = D.lobbySnapshot();
    socketSend({ type: 'room.send', roomId: mp.roomCode, payload: { type: 'lobby', ...snapshot } });
    D.renderLobby(snapshot);
  };

  function sharedCopy(key) {
    const lang = D.language();
    const table = {
      pl: { visibility: 'Widoczność', public: 'Publiczny', private: 'Prywatny', publicRooms: 'Publiczne pokoje', refresh: 'Odśwież', noRooms: 'Brak otwartych pokojów.', join: 'Dołącz' },
      en: { visibility: 'Visibility', public: 'Public', private: 'Private', publicRooms: 'Public rooms', refresh: 'Refresh', noRooms: 'No open rooms.', join: 'Join' },
      de: { visibility: 'Sichtbarkeit', public: 'Öffentlich', private: 'Privat', publicRooms: 'Öffentliche Räume', refresh: 'Aktualisieren', noRooms: 'Keine offenen Räume.', join: 'Beitreten' },
      ru: { visibility: 'Видимость', public: 'Публичный', private: 'Приватный', publicRooms: 'Публичные комнаты', refresh: 'Обновить', noRooms: 'Нет открытых комнат.', join: 'Войти' },
    };
    return (table[lang] || table.pl)[key];
  }

  function prepareSharedUI() {
    const home = D.$('mp-home');
    if (!home) return;
    if (!D.$('mp-room-visibility')) {
      const label = document.createElement('label');
      label.className = 'mp-field';
      label.innerHTML = `<span>${D.escapeHtml(sharedCopy('visibility'))}</span><select id="mp-room-visibility"><option value="public">${D.escapeHtml(sharedCopy('public'))}</option><option value="private">${D.escapeHtml(sharedCopy('private'))}</option></select>`;
      home.insertBefore(label, home.querySelector('.mp-home-actions'));
    }
    if (!D.$('mp-server-browser')) {
      const section = document.createElement('section');
      section.id = 'mp-server-browser';
      section.style.cssText = 'margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1)';
      section.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><b>${D.escapeHtml(sharedCopy('publicRooms'))}</b><button id="mp-refresh-rooms" type="button">${D.escapeHtml(sharedCopy('refresh'))}</button></div><div id="mp-room-list" style="display:grid;gap:8px;margin-top:10px"></div>`;
      home.appendChild(section);
      D.$('mp-refresh-rooms')?.addEventListener('click', refreshRooms);
      D.$('mp-room-list')?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-room-id]');
        if (button) D.joinRoom(button.dataset.roomId);
      });
    }
    renderRoomBrowser();
  }

  function renderRoomBrowser() {
    const list = D.$('mp-room-list');
    if (!list) return;
    const rooms = (mp.rooms || []).filter((room) => room.game === GAME_ID && room.visibility === 'public');
    if (!rooms.length) {
      list.innerHTML = `<div style="font-size:12px;opacity:.7">${D.escapeHtml(sharedCopy('noRooms'))}</div>`;
      return;
    }
    list.innerHTML = rooms.map((room) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:9px;border:1px solid rgba(255,255,255,.1);border-radius:10px"><span><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${D.escapeHtml(room.name || 'Duren')}</b><small>${D.escapeHtml(room.id)}</small></span><span>${room.players?.length || 0}/${room.maxPlayers}</span><button type="button" data-room-id="${D.escapeHtml(room.id)}">${D.escapeHtml(sharedCopy('join'))}</button></div>`).join('');
  }

  async function refreshRooms() {
    try {
      await ensureSocket();
      socketSend({ type: 'rooms.list', game: GAME_ID });
    } catch {}
  }

  D.createRoom = async () => {
    if (location.protocol === 'file:') { D.setStatus('mp-home-status', D.tr('unavailableLocal'), true); return; }
    const name = normalizeName(D.$('mp-name')?.value);
    if (!D.validName(name)) { D.setStatus('mp-home-status', D.tr('invalidName'), true); return; }
    D.setStatus('mp-home-status', D.tr('creating'));
    if (D.$('mp-create')) D.$('mp-create').disabled = true;
    try {
      await leaveCurrentRoom(false);
      await ensureSession(name);
      const visibility = D.$('mp-room-visibility')?.value === 'private' ? 'private' : 'public';
      const message = await request({ type: 'room.create', game: GAME_ID, name: `${name} · Duren`, visibility }, 'room.created');
      Object.assign(mp, { active: true, role: 'host', name, roomCode: message.room.id, hostSessionId: message.room.ownerSessionId, closeExpected: false });
      syncRoom(message.room);
    } catch (error) {
      console.error('[Durak MP] create room', error);
      D.setStatus('mp-home-status', D.tr('signalingError'), true);
    } finally {
      if (D.$('mp-create')) D.$('mp-create').disabled = false;
    }
  };

  D.joinRoom = async (requestedRoom) => {
    if (location.protocol === 'file:') { D.setStatus('mp-home-status', D.tr('unavailableLocal'), true); return; }
    const name = normalizeName(D.$('mp-name')?.value);
    const room = D.normalizeRoom(requestedRoom || D.$('mp-room-input')?.value);
    if (!D.validName(name)) { D.setStatus('mp-home-status', D.tr('invalidName'), true); return; }
    if (!D.ROOM_RE.test(room)) { D.setStatus('mp-home-status', D.tr('invalidRoom'), true); return; }
    D.setStatus('mp-home-status', D.tr('joining'));
    if (D.$('mp-join')) D.$('mp-join').disabled = true;
    try {
      await leaveCurrentRoom(false);
      await ensureSession(name);
      const message = await request({ type: 'room.join', roomId: room }, 'room.joined', (item) => item.room?.id === room);
      Object.assign(mp, { active: true, name, roomCode: room, hostSessionId: message.room.ownerSessionId, closeExpected: false });
      syncRoom(message.room);
    } catch (error) {
      console.error('[Durak MP] join room', error);
      D.setStatus('mp-home-status', String(error?.message || '').includes('room_full') ? D.tr('roomFull') : D.tr('signalingError'), true);
    } finally {
      if (D.$('mp-join')) D.$('mp-join').disabled = false;
    }
  };

  async function leaveCurrentRoom(renderHome = true) {
    try {
      if (mp.roomCode && mp.session && mp.socket?.readyState === WebSocket.OPEN) socketSend({ type: 'room.leave', roomId: mp.roomCode });
    } catch {}
    if (!mp.inGame) {
      mp.roomObj = null;
      mp.roomCode = '';
      mp.hostSessionId = '';
      mp.peers.clear();
      mp.botSeat = null;
      mp.botSeats = [];
      if (renderHome) {
        D.$('mp-lobby')?.classList.add('hidden');
        D.$('mp-home')?.classList.remove('hidden');
        refreshRooms();
      }
    }
  }

  D.sharedLeaveRoom = leaveCurrentRoom;

  function hostInitializeGame(message) {
    if (!mp.game || !mp.roomObj) return;
    const total = Number(message.seatCount) || mp.roomObj.players.length;
    const permanentBots = new Set((message.botSeats || []).filter((seat) => seat >= mp.roomObj.players.length));
    mp.inGame = false;
    mp.paused = false;
    mp.revision = 0;
    mp.remoteQueue.clear();
    const state = mp.game.state;
    state.botCount = total - 1;
    state.botConfig = Array.from({ length: Math.max(0, total - 1) }, (_, index) => permanentBots.has(index + 1) ? mp.botDifficulty : 'normal');
    mp.game.startNewGame();
    state.multiplayer = true;
    for (let seat = 0; seat < total; seat += 1) {
      const player = mp.roomObj.players[seat];
      if (player) state.players[seat] = { name: player.nickname, isBot: false, difficulty: 'normal' };
      else state.players[seat] = { name: 'Bot', isBot: true, difficulty: mp.botDifficulty };
    }
    state.players.length = total;
    state.hands.length = total;
    state.out.length = total;
    if (Array.isArray(state.bubbles)) state.bubbles.length = total;
    state.botCount = state.players.filter((player) => player.isBot).length;
    mp.inGame = true;
    try { localStorage.removeItem('durniowie-session-v1'); } catch {}
    D.$('mp-overlay')?.classList.add('hidden');
    
    D.hideGameMenu();
    mp.game.refresh();
    setTimeout(() => D.broadcastState(), 0);
  }

  function guestEnterGame() {
    mp.inGame = true;
    mp.paused = false;
    mp.lastRevision = 0;
    D.$('mp-overlay')?.classList.add('hidden');
    
    D.hideGameMenu();
    setTimeout(() => {
      try { socketSend({ type: 'game.state.get', roomId: mp.roomCode }); } catch {}
    }, 120);
  }

  function enterStartedGame(message) {
    mp.hostSessionId = message.hostSessionId || mp.hostSessionId;
    mp.localSeat = Number.isInteger(message.seat) ? message.seat : mp.localSeat;
    mp.botSeats = Array.isArray(message.botSeats) ? [...message.botSeats] : [];
    if (message.room) syncRoom(message.room);
    mp.role = mp.session?.id === mp.hostSessionId ? 'host' : 'guest';
    mp.starting = false;
    if (mp.role === 'host') hostInitializeGame(message);
    else guestEnterGame();
    applyPresenceSnapshot(message.presence);
  }

  D.startHostGame = async () => {
    if (mp.fakeTestMode) return legacyStartHostGame();
    if (!D.canHostStart() || !mp.roomObj || mp.starting) return false;
    const humans = mp.roomObj.players.length;
    const botCount = humans === 2 && mp.botSeat === 2 ? 1 : 0;
    mp.starting = true;
    try {
      await request({ type: 'game.start', roomId: mp.roomCode, botCount }, 'game.started', (message) => message.room?.id === mp.roomCode);
      return true;
    } catch (error) {
      mp.starting = false;
      D.setStatus('mp-lobby-status', String(error?.message || error), true);
      return false;
    }
  };

  D.broadcastState = () => {
    if (mp.role !== 'host' || !mp.inGame || mp.paused || mp.socket?.readyState !== WebSocket.OPEN || !mp.game?.state) return;
    mp.revision += 1;
    const revision = mp.revision;
    socketSend({ type: 'game.state.commit', roomId: mp.roomCode, revision, state: D.clone(mp.game.state) });
    for (const peer of mp.peers.values()) {
      if (!peer.connected) continue;
      const view = D.stateForSeat(peer.seat);
      if (view) socketSend({ type: 'game.state.publish', roomId: mp.roomCode, revision, toSessionId: peer.sessionId, state: view });
    }
  };

  D.sendGuestAction = (action, payload = {}) => {
    if (!mp.inGame || mp.socket?.readyState !== WebSocket.OPEN) return;
    socketSend({ type: 'game.action', roomId: mp.roomCode, action, payload, actionId: `${Date.now()}-${Math.random().toString(36).slice(2)}` });
  };

  function applyGuestState(message) {
    if (!message.state || !Number.isInteger(message.revision) || message.revision <= mp.lastRevision) return;
    mp.lastRevision = message.revision;
    mp.guestView = message.state;
    mp.guestUi.defenseTarget = Math.max(0, (message.state.table || []).findIndex((pair) => !pair.defense));
    mp.guestUi.transferMode = false;
    D.renderGuestView();
  }

  function applyHostState(message) {
    if (!message.state || !mp.game?.state) return;
    // Original browser host always owns seat 0. Host migration after a 60 s timeout is
    // intentionally deferred to the server-authoritative Duren phase.
    if (mp.localSeat !== 0) return;
    Object.assign(mp.game.state, D.clone(message.state));
    mp.revision = Math.max(mp.revision, Number(message.revision) || 0);
    mp.inGame = true;
    mp.paused = false;
    D.$('mp-overlay')?.classList.add('hidden');
    
    D.hideGameMenu();
    mp.game.refresh();
  }

  function serverBotSeats(seats) {
    mp.botSeats = Array.isArray(seats) ? [...new Set(seats.filter(Number.isInteger))] : mp.botSeats;
    if (mp.role !== 'host' || !mp.game?.state?.players) return;
    const permanent = new Set(mp.botSeats.filter((seat) => seat >= (mp.roomObj?.players?.length || 0)));
    for (let seat = 0; seat < mp.game.state.players.length; seat += 1) {
      const player = mp.game.state.players[seat];
      if (!player) continue;
      const peer = [...mp.peers.values()].find((item) => item.seat === seat);
      if (mp.botSeats.includes(seat)) player.isBot = true;
      else if (peer) player.isBot = false;
      else if (permanent.has(seat)) player.isBot = true;
    }
    mp.game.refresh();
  }

  function presenceText(entry) {
    const seconds = Math.max(0, Math.ceil(((entry.deadline || 0) - Date.now()) / 1000));
    const name = entry.nickname || 'Player';
    const lang = D.language();
    if (entry.phase === 'bot') {
      if (lang === 'pl') return `Bot przejął miejsce gracza ${name} i gra jego zastaną ręką.`;
      if (lang === 'de') return `Ein Bot hat den Platz von ${name} mit der aktuellen Hand übernommen.`;
      if (lang === 'ru') return `Бот занял место ${name} и продолжает с текущей рукой.`;
      return `A bot took ${name}'s seat and continues with the current hand.`;
    }
    if (lang === 'pl') return `Utracono połączenie z graczem ${name}. Bot przejmie jego miejsce za ${seconds} s.`;
    if (lang === 'de') return `Verbindung zu ${name} verloren. Ein Bot übernimmt in ${seconds} s.`;
    if (lang === 'ru') return `Связь с ${name} потеряна. Бот займёт место через ${seconds} с.`;
    return `Connection to ${name} was lost. A bot will take the seat in ${seconds} s.`;
  }

  function ensurePresenceNotice() {
    let node = D.$('mp-presence-notice');
    if (node) return node;
    node = document.createElement('div');
    node.id = 'mp-presence-notice';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100000;width:min(560px,calc(100vw - 32px));padding:18px 22px;border-radius:16px;border:1px solid rgba(255,170,120,.68);background:rgba(7,16,12,.96);color:#edf5ef;box-shadow:0 24px 72px rgba(0,0,0,.56);font:760 15px/1.45 system-ui;text-align:center;opacity:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(node);
    return node;
  }

  function updatePresenceNotice() {
    const node = ensurePresenceNotice();
    const entries = Object.values(mp.graceBySeat || {});
    const entry = entries.find((item) => item?.phase === 'waiting') || entries.find((item) => item?.phase === 'bot');
    if (!entry) {
      node.style.opacity = '0';
      node.style.visibility = 'hidden';
      return;
    }
    node.textContent = presenceText(entry);
    node.style.visibility = 'visible';
    node.style.opacity = '1';
  }

  function refreshGraceTicker() {
    if (mp.graceTicker) clearInterval(mp.graceTicker);
    updatePresenceNotice();
    const waiting = Object.values(mp.graceBySeat || {}).some((entry) => entry?.phase === 'waiting');
    mp.graceTicker = waiting ? setInterval(updatePresenceNotice, 250) : null;
  }

  function applyPresenceSnapshot(entries) {
    if (!Array.isArray(entries)) return;
    const next = {};
    for (const entry of entries) {
      if (!entry || !Number.isInteger(entry.seat) || entry.sessionId === mp.session?.id) continue;
      const previous = mp.graceBySeat?.[entry.seat];
      if (!entry.connected && entry.botActive) next[entry.seat] = { phase: 'bot', nickname: entry.nickname || previous?.nickname || 'Player', deadline: 0 };
      else if (!entry.connected && Number.isFinite(entry.graceDeadline)) next[entry.seat] = { phase: 'waiting', nickname: entry.nickname || previous?.nickname || 'Player', deadline: entry.graceDeadline };
    }
    mp.graceBySeat = next;
    refreshGraceTicker();
  }

  function handleRoomMessage(message) {
    const payload = message.payload;
    if (!payload || message.roomId !== mp.roomCode) return;
    if (payload.type === 'lobby' && mp.role === 'guest' && !mp.inGame) {
      D.renderLobby(payload);
      return;
    }
    if (payload.type === 'error' && mp.role === 'guest') {
      D.flashGameStatus(payload.message || D.tr('illegal'));
    }
  }

  function handleServerMessage(message) {
    if (message.type === 'session.created') {
      mp.session = message.session;
      mp.resumeToken = message.resumeToken;
      storeSession();
      return;
    }
    if (message.type === 'session.resumed') {
      mp.session = message.session;
      const room = (message.rooms || []).find((item) => item.game === GAME_ID);
      if (room) {
        syncRoom(room);
        if (room.status === 'in_game') socketSend({ type: 'game.state.get', roomId: room.id });
      }
      return;
    }
    if (['room.created', 'room.joined', 'room.updated'].includes(message.type) && message.room?.game === GAME_ID) {
      syncRoom(message.room);
      return;
    }
    if (message.type === 'rooms.list') {
      mp.rooms = Array.isArray(message.rooms) ? message.rooms : [];
      renderRoomBrowser();
      return;
    }
    if (message.type === 'room.message') {
      handleRoomMessage(message);
      return;
    }
    if (message.type === 'game.started' && message.game === GAME_ID) {
      enterStartedGame(message);
      return;
    }
    if (message.type === 'game.action' && message.game === GAME_ID && mp.role === 'host' && mp.inGame) {
      const peer = [...mp.peers.values()].find((item) => item.sessionId === message.fromSessionId || item.seat === message.seat);
      if (peer) D.queueRemoteAction(peer, message.action, message.payload || {});
      return;
    }
    if (message.type === 'game.state' && message.roomId === mp.roomCode) {
      mp.hostSessionId = message.hostSessionId || mp.hostSessionId;
      mp.botSeats = Array.isArray(message.botSeats) ? [...message.botSeats] : mp.botSeats;
      applyPresenceSnapshot(message.presence);
      if (mp.session?.id === mp.hostSessionId) {
        mp.role = 'host';
        applyHostState(message);
      } else {
        mp.role = 'guest';
        if (!mp.inGame) guestEnterGame();
        applyGuestState(message);
      }
      serverBotSeats(message.botSeats);
      return;
    }
    if (message.type === 'game.presence' && message.roomId === mp.roomCode) {
      applyPresenceSnapshot(message.presence);
      serverBotSeats(message.botSeats);
      return;
    }
    if (message.type === 'game.player.connection' && message.roomId === mp.roomCode) {
      const peer = mp.peers.get(message.sessionId);
      if (peer) peer.connected = !!message.connected;
      if (Number.isInteger(message.seat)) {
        if (message.connected) delete mp.graceBySeat[message.seat];
        else if (Number.isFinite(message.graceDeadline)) mp.graceBySeat[message.seat] = { phase: 'waiting', nickname: message.nickname || peer?.nick || 'Player', deadline: message.graceDeadline };
      }
      serverBotSeats(message.botSeats);
      refreshGraceTicker();
      if (message.connected && mp.role === 'host' && mp.inGame) {
        setTimeout(() => D.broadcastState(), 0);
      }
      return;
    }
    if (message.type === 'game.player.bot_takeover' && message.roomId === mp.roomCode) {
      if (Number.isInteger(message.seat) && message.sessionId !== mp.session?.id) mp.graceBySeat[message.seat] = { phase: 'bot', nickname: message.nickname || 'Player', deadline: 0 };
      serverBotSeats(message.botSeats);
      refreshGraceTicker();
      return;
    }
    if (message.type === 'game.host.changed' && message.roomId === mp.roomCode) {
      mp.hostSessionId = message.hostSessionId || mp.hostSessionId;
      if (mp.session?.id === mp.hostSessionId && mp.localSeat !== 0) {
        D.showDisconnect(D.language() === 'pl' ? 'Host nie wrócił. Migracja autorytetu hosta będzie dostępna po przeniesieniu zasad Duren na serwer.' : 'The host did not return. Host authority migration will be available after Duren rules move to the server.');
      }
      return;
    }
    if (message.type === 'room.closed' && message.roomId === mp.roomCode) {
      D.showDisconnect(D.tr('connectionLostText'));
      return;
    }
    if (message.type === 'error') {
      const text = String(message.code || 'server_error');
      if (!mp.inGame) D.setStatus(mp.roomObj ? 'mp-lobby-status' : 'mp-home-status', text, true);
      else D.flashGameStatus(D.tr('illegal'));
    }
  }


  D.getStoredServerSession = loadStoredSession;
  D.clearStoredServerSession = clearStoredSession;
  D.clearOnlineResumeCandidate = () => {
    const stored = loadStoredSession();
    if (!stored) return;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ...stored, roomId: null, onlineEligible: false })); } catch {}
  };
  D.resumeOnlineGame = async () => {
    await ensureSocket();
    const session = await resumeStoredSession(false);
    const room = mp.roomObj;
    if (!session || !room || room.game !== GAME_ID || room.status !== 'in_game') {
      D.clearOnlineResumeCandidate();
      return false;
    }
    mp.active = true;
    storeSession();
    const stateMessage = await request(
      { type:'game.state.get', roomId:room.id },
      ['game.state','game.state.empty'],
      (message) => message.roomId === room.id,
    );
    return stateMessage.type === 'game.state';
  };

  D.connectSharedServer = async () => {
    prepareSharedUI();
    await ensureSocket();
    await resumeStoredSession(true);
    if (mp.roomObj) D.renderLobby();
    else refreshRooms();
    return true;
  };
  D.refreshRooms = refreshRooms;
  D.clientBuild = CLIENT_BUILD;

  window.addEventListener('online', () => { if (!mp.socket || mp.socket.readyState !== WebSocket.OPEN) scheduleReconnect(); });
  window.addEventListener('pagehide', () => {
    if (!mp.inGame || !mp.roomCode || mp.socket?.readyState !== WebSocket.OPEN) return;
    try { socketSend({ type: 'room.leave', roomId: mp.roomCode }); } catch {}
  });

  prepareSharedUI();
  const stored = loadStoredSession();
  if (stored?.nickname && D.$('mp-name')) D.$('mp-name').value = stored.nickname;
})();
