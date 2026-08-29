(() => {
  'use strict';
  const D=window.DurakMP,mp=D.mp;

  D.resetNetworkOnly=()=>{
    mp.closeExpected=true;
    try{mp.socket?.close(1000,'leave');}catch{}
    try{mp.peer?.channel?.close();mp.peer?.pc?.close();}catch{}
    for(const p of mp.peers.values()){try{p.channel?.close();p.pc?.close();}catch{}}
    Object.assign(mp,{active:false,role:null,roomCode:'',hostToken:'',socket:null,peer:null,botSeat:null,inGame:false,paused:false});
    mp.peers.clear();mp.remoteQueue.clear();
  };
  D.leaveMultiplayer=()=>{if(mp.role==='guest'&&mp.socket?.readyState===WebSocket.OPEN&&!mp.inGame)mp.socket.send(JSON.stringify({type:'leave'}));D.resetNetworkOnly();location.reload();};
  D.openOverlay=()=>{D.installGameHooks();D.applyLanguage();D.$('mp-overlay').classList.remove('hidden');if(!mp.active){D.$('mp-home').classList.remove('hidden');D.$('mp-lobby').classList.add('hidden');}if(location.protocol==='file:')D.setStatus('mp-home-status',D.tr('unavailableLocal'),true);};
  D.closeOverlay=()=>{if(!mp.inGame)D.$('mp-overlay').classList.add('hidden');};

  D.$('mp-launch').addEventListener('click',D.openOverlay);
  D.$('mp-close').addEventListener('click',D.closeOverlay);
  D.$('mp-create').addEventListener('click',D.createRoom);
  D.$('mp-join').addEventListener('click',D.joinRoom);
  D.$('mp-room-input').addEventListener('input',e=>{e.target.value=D.normalizeRoom(e.target.value)||e.target.value.toUpperCase().replace(/[^A-Z2-9-]/g,'').slice(0,9);});
  D.$('mp-copy-room').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(mp.roomCode);D.$('mp-copy-room').textContent=D.tr('copied');setTimeout(D.applyLanguage,1200);}catch{}});
  D.$('mp-use-bot').addEventListener('change',e=>{if(mp.role!=='host')return;if(e.target.checked&&D.peerForSeat(2)){e.target.checked=false;return;}mp.botSeat=e.target.checked?2:null;D.broadcastLobby();});
  D.$('mp-bot-difficulty').addEventListener('change',e=>{mp.botDifficulty=e.target.value;D.broadcastLobby();});
  D.$('mp-start').addEventListener('click',D.startHostGame);
  D.$('mp-leave').addEventListener('click',D.leaveMultiplayer);
  D.$('mp-disconnect-exit').addEventListener('click',D.leaveMultiplayer);

  D.frame.addEventListener('load',()=>{mp.hooksInstalled=false;setTimeout(D.installGameHooks,0);});
  if(D.frame.contentWindow?.Durak?.game)D.installGameHooks();

  const invariants=()=>{
    const s=mp.game?.state;if(!s||s.collecting)return{stable:false,total:null,unique:true};
    const cards=[];for(const hand of s.hands||[])cards.push(...hand);cards.push(...(s.deck||[]),...(s.discard||[]));for(const pair of s.table||[]){if(pair.attack)cards.push(pair.attack);if(pair.defense)cards.push(pair.defense);}
    const ids=cards.filter(Boolean).map(c=>c.id);return{stable:true,total:ids.length,unique:new Set(ids).size===ids.length};
  };
  const autoStep=()=>{
    const s=mp.game?.state;if(!s||!mp.inGame||['end','idle','refill'].includes(s.phase))return false;
    const actor=D.currentActor(s);if(actor==null)return false;if(s.players[actor]?.isBot&&!D.peerForSeat(actor))return false;
    if(actor===0){const doc=D.gameDoc();if(s.phase==='attack'){doc?.querySelector('#human-hand button[data-card-id]:not(:disabled)')?.click();return true;}if(s.phase==='defense'){const card=doc?.querySelector('#human-hand button[data-card-id]:not(:disabled)');if(card)card.click();else doc?.querySelector('[data-action="human-take"]')?.click();return true;}if(s.phase==='throwin'){doc?.querySelector('[data-action="human-pass"]')?.click();return true;}return false;}
    const peer=D.peerForSeat(actor);if(!peer)return false;if(s.phase==='attack')return D.queueRemoteAction(peer,'play-card',{cardId:s.hands[actor][0]?.id});if(s.phase==='throwin')return D.queueRemoteAction(peer,'pass',{});if(s.phase==='defense'){const pairIndex=s.table.findIndex(pair=>!pair.defense),pair=s.table[pairIndex],beat=pair?mp.frameWindow.Durak.rules.beatOptions(s.hands[actor],pair.attack,s.trump)[0]:null;return beat?D.queueRemoteAction(peer,'beat',{cardId:beat.id,pairIndex}):D.queueRemoteAction(peer,'take',{});}return false;
  };
  async function startHostGameForTest({guestCount=1,bot=false,difficulty='normal'}={}){
    D.installGameHooks();D.resetNetworkOnly();mp.closeExpected=false;Object.assign(mp,{fakeTestMode:true,active:true,role:'host',name:'Host',roomCode:'TEST-ROOM',botSeat:bot?2:null,botDifficulty:difficulty});
    for(let i=1;i<=Math.min(2,guestCount);i++){const channel={readyState:'open',send(){},close(){}};mp.peers.set(`test-${i}`,{guestId:`test-${i}`,nick:`Human ${i}`,seat:i,connected:true,channel,pc:{close(){}}});}
    D.renderLobby();return D.startHostGame();
  }
  window.DurakMultiplayer={debug:{get state(){return mp;},normalizeRoom:D.normalizeRoom,stateForSeat:D.stateForSeat,validateAction:D.validateAction,renderLobby:D.renderLobby,invariants,autoStep,startHostGameForTest}};
})();
