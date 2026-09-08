(() => {
  'use strict';

  const D = window.DurakMP;
  const mp = D.mp;

  D.resetNetworkOnly = () => {
    mp.closeExpected = true;
    mp.intentionalClose = true;
    try { mp.socket?.close(1000, 'leave'); } catch {}
    for (const peer of mp.peers.values()) {
      try { peer.channel?.close(); } catch {}
    }
    if (mp.graceTicker) clearInterval(mp.graceTicker);
    if (mp.reconnectTimer) clearTimeout(mp.reconnectTimer);
    for (const waiter of mp.waiters || []) {
      try {
        clearTimeout(waiter.timer);
        waiter.reject?.(new Error('connection_closed'));
      } catch {}
    }
    Object.assign(mp, {
      active:false,
      role:null,
      roomCode:'',
      hostToken:'',
      socket:null,
      socketPromise:null,
      peer:null,
      roomObj:null,
      hostSessionId:'',
      botSeat:null,
      botSeats:[],
      inGame:false,
      paused:false,
      starting:false,
      graceBySeat:{},
      graceTicker:null,
      reconnectTimer:null,
    });
    if (Array.isArray(mp.waiters)) mp.waiters.length = 0;
    mp.peers.clear();
    mp.remoteQueue.clear();
  };

  D.leaveMultiplayer = async () => {
    try { await D.sharedLeaveRoom?.(false); } catch {}
    D.clearOnlineResumeCandidate?.();
    D.resetNetworkOnly();
    D.$('mp-overlay')?.classList.add('hidden');
    D.$('mp-disconnect')?.classList.add('hidden');
    window.Durak?.game?.showMainMenu?.();
    window.Durak?.game?.refreshMainMenu?.();
  };

  D.openOverlay = () => {
    D.installGameHooks();
    D.applyLanguage();
    D.$('mp-overlay').classList.remove('hidden');
    if (!mp.active) {
      D.$('mp-home').classList.remove('hidden');
      D.$('mp-lobby').classList.add('hidden');
    }
    if (location.protocol === 'file:') {
      D.setStatus('mp-home-status', D.tr('unavailableLocal'), true);
    } else {
      D.connectSharedServer?.().catch(() => D.setStatus('mp-home-status', D.tr('signalingError'), true));
    }
  };

  D.closeOverlay = () => {
    if (!mp.inGame) D.$('mp-overlay').classList.add('hidden');
  };

  D.$('mp-close').addEventListener('click', D.closeOverlay);
  D.$('mp-create').addEventListener('click', D.createRoom);
  D.$('mp-join').addEventListener('click', () => D.joinRoom());
  D.$('mp-room-input').addEventListener('input', (event) => {
    event.target.value = D.normalizeRoom(event.target.value) || event.target.value.toUpperCase().replace(/[^A-Z2-9-]/g, '').slice(0,9);
  });
  D.$('mp-copy-room').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mp.roomCode);
      D.$('mp-copy-room').textContent = D.tr('copied');
      setTimeout(D.applyLanguage, 1200);
    } catch {}
  });
  D.$('mp-use-bot').addEventListener('change', (event) => {
    if (mp.role !== 'host') return;
    if (event.target.checked && (mp.roomObj?.players?.length || 0) >= 3) {
      event.target.checked = false;
      return;
    }
    mp.botSeat = event.target.checked ? 2 : null;
    D.broadcastLobby();
  });
  D.$('mp-bot-difficulty').addEventListener('change', (event) => {
    mp.botDifficulty = event.target.value;
    D.broadcastLobby();
  });
  D.$('mp-start').addEventListener('click', D.startHostGame);
  D.$('mp-leave').addEventListener('click', D.leaveMultiplayer);
  D.$('mp-disconnect-exit').addEventListener('click', D.leaveMultiplayer);


  D.getResumeCandidate = () => {
    const stored = D.getStoredServerSession?.();
    if (stored?.sessionId && stored?.resumeToken && stored.onlineEligible !== false) {
      return { type:'online', roomId:stored.roomId || '' };
    }
    const saved = window.Durak?.game?.readSavedSession?.();
    return saved ? { type:'offline', summary:saved } : null;
  };

  D.continuePreferred = async () => {
    const candidate = D.getResumeCandidate();
    if (candidate?.type === 'online') {
      const info = D.$('menu-session-info');
      if (info) info.textContent = D.language() === 'pl' ? 'Wznawianie gry online…' : 'Resuming online game…';
      try {
        const resumed = await D.resumeOnlineGame?.();
        if (resumed) {
          D.$('mp-overlay')?.classList.add('hidden');
          window.Durak?.game?.hideMainMenu?.();
          return true;
        }
      } catch (error) {
        console.warn('[Durak MP] resume failed', error);
        if (/invalid_session_credentials|session_expired|room_not_found|not_in_game/.test(String(error?.message || error))) D.clearOnlineResumeCandidate?.();
      }
      D.clearOnlineResumeCandidate?.();
      window.Durak?.game?.refreshMainMenu?.();
      return false;
    }
    if (candidate?.type === 'offline') {
      window.Durak?.game?.continueSaved?.();
      return true;
    }
    window.Durak?.game?.refreshMainMenu?.();
    return false;
  };

  function requestCurrentState() {
    D.installGameHooks?.();
    if (mp.role === 'guest' && mp.guestView) D.renderGuestView?.();
    if (!mp.inGame || !mp.roomCode || mp.socket?.readyState !== WebSocket.OPEN) return;
    try {
      mp.socket.send(JSON.stringify({ type:'game.state.get', roomId:mp.roomCode }));
    } catch {}
  }

  D.installGameHooks();
  window.Durak?.game?.refreshMainMenu?.();
  setTimeout(requestCurrentState, 0);

  const invariants = () => {
    const state = mp.game?.state;
    if (!state || state.collecting) return {stable:false,total:null,unique:true};
    const cards = [];
    for (const hand of state.hands || []) cards.push(...hand);
    cards.push(...(state.deck || []), ...(state.discard || []));
    for (const pair of state.table || []) {
      if (pair.attack) cards.push(pair.attack);
      if (pair.defense) cards.push(pair.defense);
    }
    const ids = cards.filter(Boolean).map((card) => card.id);
    return {stable:true,total:ids.length,unique:new Set(ids).size === ids.length};
  };

  const autoStep = () => {
    const state = mp.game?.state;
    if (!state || !mp.inGame || ['end','idle','refill'].includes(state.phase)) return false;
    const actor = D.currentActor(state);
    if (actor == null) return false;
    if (state.players[actor]?.isBot && !D.peerForSeat(actor)) return false;
    if (actor === 0) {
      const doc = D.gameDoc();
      if (state.phase === 'attack') {
        doc?.querySelector('#human-hand button[data-card-id]:not(:disabled)')?.click();
        return true;
      }
      if (state.phase === 'defense') {
        const card = doc?.querySelector('#human-hand button[data-card-id]:not(:disabled)');
        if (card) card.click();
        else doc?.querySelector('[data-action="human-take"]')?.click();
        return true;
      }
      if (state.phase === 'throwin') {
        doc?.querySelector('[data-action="human-pass"]')?.click();
        return true;
      }
      return false;
    }
    const peer = D.peerForSeat(actor);
    if (!peer) return false;
    if (state.phase === 'attack') return D.queueRemoteAction(peer, 'play-card', {cardId:state.hands[actor][0]?.id});
    if (state.phase === 'throwin') return D.queueRemoteAction(peer, 'pass', {});
    if (state.phase === 'defense') {
      const pairIndex = state.table.findIndex((pair) => !pair.defense);
      const pair = state.table[pairIndex];
      const beat = pair ? window.Durak.rules.beatOptions(state.hands[actor], pair.attack, state.trump)[0] : null;
      return beat ? D.queueRemoteAction(peer, 'beat', {cardId:beat.id,pairIndex}) : D.queueRemoteAction(peer, 'take', {});
    }
    return false;
  };

  async function startHostGameForTest({guestCount=1,bot=false,difficulty='normal'}={}) {
    D.installGameHooks();
    D.resetNetworkOnly();
    mp.closeExpected = false;
    const hostId = 'test-host';
    const players = [{id:hostId,nickname:'Host',connected:true}];
    Object.assign(mp, {
      fakeTestMode:true,
      active:true,
      role:'host',
      name:'Host',
      roomCode:'TEST-ROOM',
      hostSessionId:hostId,
      botSeat:bot ? 2 : null,
      botDifficulty:difficulty,
      roomObj:{id:'TEST-ROOM',game:'duren',ownerSessionId:hostId,players,minPlayers:2,maxPlayers:3,status:guestCount>=2?'ready':'waiting'},
    });
    for (let index=1; index<=Math.min(2,guestCount); index++) {
      const id = `test-${index}`;
      const channel = {readyState:'open',send(){},close(){}};
      players.push({id,nickname:`Human ${index}`,connected:true});
      mp.peers.set(id,{guestId:id,sessionId:id,nick:`Human ${index}`,seat:index,connected:true,channel});
    }
    D.renderLobby();
    return D.startHostGame();
  }

  window.DurakMultiplayer = {
    clientBuild:D.clientBuild || 'unknown',
    debug:{
      get state(){ return mp; },
      normalizeRoom:D.normalizeRoom,
      stateForSeat:D.stateForSeat,
      validateAction:D.validateAction,
      renderLobby:D.renderLobby,
      invariants,
      autoStep,
      startHostGameForTest,
      refreshRooms:() => D.refreshRooms?.(),
    },
  };
})();
