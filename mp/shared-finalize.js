(() => {
  'use strict';
  const D = window.DurakMP;
  const mp = D?.mp;
  if (!D || !mp) return;

  const copy = {
    pl: {
      lead: 'Utwórz pokój, dołącz kodem albo wybierz publiczny stół. Rozgrywka korzysta ze wspólnego serwera QQND.',
      fillBotHint: 'Bot zajmuje trzecie miejsce i jest wykonywany przez przeglądarkę hosta.',
    },
    en: {
      lead: 'Create a room, join by code, or choose a public table. Gameplay uses the shared QQND server.',
      fillBotHint: 'The bot occupies the third seat and is run by the host browser.',
    },
    de: {
      lead: 'Erstelle einen Raum, tritt per Code bei oder wähle einen öffentlichen Tisch. Das Spiel nutzt den gemeinsamen QQND-Server.',
      fillBotHint: 'Der Bot besetzt den dritten Platz und läuft im Browser des Hosts.',
    },
    ru: {
      lead: 'Создайте комнату, войдите по коду или выберите публичный стол. Игра использует общий сервер QQND.',
      fillBotHint: 'Бот занимает третье место и выполняется браузером хоста.',
    },
  };
  for (const [lang, values] of Object.entries(copy)) Object.assign(D.TEXT[lang] || {}, values);

  function requestCurrentState() {
    D.installGameHooks?.();
    if (mp.role === 'guest' && mp.guestView) D.renderGuestView?.();
    if (!mp.inGame || !mp.roomCode || mp.socket?.readyState !== WebSocket.OPEN) return;
    try { mp.socket.send(JSON.stringify({ type: 'game.state.get', roomId: mp.roomCode })); } catch {}
  }

  D.frame?.addEventListener('load', () => setTimeout(requestCurrentState, 0));
  setTimeout(requestCurrentState, 0);
})();
