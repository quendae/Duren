(() => {
  'use strict';
  const D=window.DurakMP,mp=D.mp;
  D.canHostStart=()=>mp.role==='host'&&!!(D.peerForSeat(1)||D.peerForSeat(2));
  D.lobbySnapshot=()=>({room:mp.roomCode,seats:[
    {seat:0,name:mp.name,kind:'human',connected:true,host:true},
    {seat:1,name:D.peerForSeat(1)?.nick||'',kind:D.peerForSeat(1)?'human':'empty',connected:!!D.peerForSeat(1)},
    {seat:2,name:D.peerForSeat(2)?.nick||(mp.botSeat===2?D.tr('bot'):''),kind:D.peerForSeat(2)?'human':(mp.botSeat===2?'bot':'empty'),connected:!!D.peerForSeat(2),difficulty:mp.botDifficulty},
  ],botSeat:mp.botSeat,botDifficulty:mp.botDifficulty,canStart:D.canHostStart()});

  D.renderLobby=(snapshot=D.lobbySnapshot())=>{
    D.$('mp-home').classList.add('hidden');D.$('mp-lobby').classList.remove('hidden');D.$('mp-room-code').textContent=snapshot.room||mp.roomCode||'—';
    D.$('mp-seats').innerHTML=(snapshot.seats||[]).map(seat=>{
      const label=seat.kind==='bot'?D.tr('botSeat',{level:seat.difficulty||'normal'}):seat.kind==='empty'?D.tr('empty'):seat.name;
      const detail=seat.host?D.tr('host'):seat.kind==='bot'?D.tr('reserved'):seat.kind==='empty'?D.tr('thirdOptional'):D.tr('human');
      const cls=seat.kind==='bot'?'bot':seat.connected?'ready':'',state=seat.kind==='bot'?D.tr('bot'):seat.connected?D.tr('connected'):D.tr('empty');
      return `<div class="mp-seat"><div class="mp-seat-avatar">${D.initials(label)}</div><div><b>${D.escapeHtml(label)}</b><small>${D.escapeHtml(detail)}</small></div><span class="mp-seat-state ${cls}">${D.escapeHtml(state)}</span></div>`;
    }).join('');
    D.$('mp-bot-panel').classList.toggle('hidden',mp.role!=='host');D.$('mp-start').classList.toggle('hidden',mp.role!=='host');D.$('mp-start').disabled=!snapshot.canStart;
    D.setStatus('mp-lobby-status',mp.role==='host'?(snapshot.canStart?D.tr('canStart'):D.tr('waiting')):D.tr('guestWait'));
  };
  D.broadcastLobby=()=>{if(mp.role!=='host')return;const s=D.lobbySnapshot();for(const p of mp.peers.values())if(p.connected)D.safeSend(p.channel,{type:'lobby',...s});D.renderLobby(s);};

  function socketPromise(socket,onOpen){
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('signaling timeout')),8000);
      socket.addEventListener('open',()=>{try{onOpen();}catch(e){reject(e);}},{once:true});
      socket.addEventListener('message',event=>{const msg=D.parseMessage(event.data);if(msg?.type==='authenticated'){clearTimeout(timer);resolve(msg);}});
      socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('websocket error'));},{once:true});
      socket.addEventListener('close',event=>{if(!mp.inGame&&!mp.closeExpected&&event.code!==1000){clearTimeout(timer);reject(new Error(event.reason||'socket closed'));}},{once:true});
    });
  }

  D.createRoom=async()=>{
    if(location.protocol==='file:'){D.setStatus('mp-home-status',D.tr('unavailableLocal'),true);return;}
    const name=D.$('mp-name').value.trim();if(!D.validName(name)){D.setStatus('mp-home-status',D.tr('invalidName'),true);return;}
    D.setStatus('mp-home-status',D.tr('creating'));D.$('mp-create').disabled=true;
    try{
      const r=await fetch('/api/rooms',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nick:name})});if(!r.ok)throw new Error(`HTTP ${r.status}`);const data=await r.json();
      Object.assign(mp,{active:true,role:'host',name,roomCode:data.room,hostToken:data.hostToken,localSeat:0});await openHostSocket();D.renderLobby();
    }catch(e){console.error('[Durak MP] create room',e);D.setStatus('mp-home-status',D.tr('signalingError'),true);D.resetNetworkOnly();}
    finally{D.$('mp-create').disabled=false;}
  };
  D.joinRoom=async()=>{
    if(location.protocol==='file:'){D.setStatus('mp-home-status',D.tr('unavailableLocal'),true);return;}
    const name=D.$('mp-name').value.trim(),room=D.normalizeRoom(D.$('mp-room-input').value);
    if(!D.validName(name)){D.setStatus('mp-home-status',D.tr('invalidName'),true);return;}if(!D.ROOM_RE.test(room)){D.setStatus('mp-home-status',D.tr('invalidRoom'),true);return;}
    D.setStatus('mp-home-status',D.tr('joining'));D.$('mp-join').disabled=true;
    try{Object.assign(mp,{active:true,role:'guest',name,roomCode:room});await openGuestSocket();}
    catch(e){console.error('[Durak MP] join room',e);D.setStatus('mp-home-status',D.tr('signalingError'),true);D.resetNetworkOnly();}
    finally{D.$('mp-join').disabled=false;}
  };

  async function openHostSocket(){
    const socket=new WebSocket(D.wsUrl(mp.roomCode));mp.socket=socket;socket.addEventListener('message',onHostSignal);socket.addEventListener('close',()=>{if(!mp.inGame&&!mp.closeExpected&&mp.active)D.setStatus('mp-lobby-status',D.tr('signalingError'),true);});
    await socketPromise(socket,()=>socket.send(JSON.stringify({type:'authenticate',role:'host',token:mp.hostToken})));
  }
  async function openGuestSocket(){
    const socket=new WebSocket(D.wsUrl(mp.roomCode));mp.socket=socket;socket.addEventListener('message',onGuestSignal);socket.addEventListener('close',event=>{if(!mp.inGame&&!mp.closeExpected&&mp.active)D.setStatus('mp-home-status',event.code===4009?D.tr('roomFull'):D.tr('signalingError'),true);});
    const auth=await socketPromise(socket,()=>socket.send(JSON.stringify({type:'authenticate',role:'guest',nick:mp.name})));await createGuestOffer(auth.guestId);
    D.renderLobby({room:mp.roomCode,seats:[{seat:0,name:D.tr('host'),kind:'human',connected:true,host:true},{seat:1,name:mp.name,kind:'human',connected:false},{seat:2,name:'',kind:'empty',connected:false}],canStart:false});
  }
  async function createGuestOffer(guestId){
    const pc=D.newPeerConnection(),channel=pc.createDataChannel('durak-game',{ordered:true});mp.peer={guestId,pc,channel,seat:null,connected:false};
    pc.addEventListener('connectionstatechange',()=>{if(['failed','disconnected','closed'].includes(pc.connectionState)&&mp.inGame&&!mp.closeExpected)D.showDisconnect(D.tr('hostGone'));});
    channel.addEventListener('open',()=>{mp.peer.connected=true;D.safeSend(channel,{type:'hello',name:mp.name});mp.socket?.send(JSON.stringify({type:'connected'}));D.safeSend(channel,{type:'sync-request'});});
    channel.addEventListener('message',onGuestData);channel.addEventListener('close',()=>{if(mp.inGame&&!mp.closeExpected)D.showDisconnect(D.tr('hostGone'));});
    await pc.setLocalDescription(await pc.createOffer());await D.waitIceComplete(pc);mp.socket.send(JSON.stringify({type:'offer',sdp:pc.localDescription}));
  }

  async function onHostSignal(event){const msg=D.parseMessage(event.data);if(!msg)return;if(msg.type==='offer'){try{await acceptGuestOffer(msg);}catch(e){console.error('[Durak MP] host offer',e);mp.socket?.send(JSON.stringify({type:'reject',guestId:msg.guestId,reason:'webrtc_failed'}));}}else if(msg.type==='guest-left')removePeer(msg.guestId,false);}
  async function acceptGuestOffer(msg){
    const seat=allocateSeat();if(!seat){mp.socket?.send(JSON.stringify({type:'reject',guestId:msg.guestId,reason:'room_full'}));return;}
    const pc=D.newPeerConnection(),peer={guestId:msg.guestId,nick:msg.nick||D.tr('human'),seat,pc,channel:null,connected:false};mp.peers.set(peer.guestId,peer);
    pc.addEventListener('datachannel',e=>bindHostChannel(peer,e.channel));pc.addEventListener('connectionstatechange',()=>{if(['failed','disconnected','closed'].includes(pc.connectionState))removePeer(peer.guestId,mp.inGame);});
    await pc.setRemoteDescription(msg.sdp);await pc.setLocalDescription(await pc.createAnswer());await D.waitIceComplete(pc);mp.socket?.send(JSON.stringify({type:'answer',guestId:peer.guestId,seat,sdp:pc.localDescription}));D.renderLobby();
  }
  function bindHostChannel(peer,channel){peer.channel=channel;channel.addEventListener('open',()=>{peer.connected=true;D.safeSend(channel,{type:'welcome',seat:peer.seat,...D.lobbySnapshot()});D.broadcastLobby();});channel.addEventListener('message',e=>onHostData(peer,e));channel.addEventListener('close',()=>removePeer(peer.guestId,mp.inGame));}
  function allocateSeat(){const occupied=new Set([...mp.peers.values()].map(p=>p.seat));for(const seat of [1,2])if(seat!==mp.botSeat&&!occupied.has(seat))return seat;return null;}
  function compactLobbySeats(){if(mp.inGame)return;const list=[...mp.peers.values()].filter(p=>p.connected).sort((a,b)=>a.seat-b.seat);list.forEach((p,i)=>{const desired=i+1;if(desired===2&&mp.botSeat===2)return;if(p.seat!==desired){p.seat=desired;D.safeSend(p.channel,{type:'seat-update',seat:desired});}});}
  function removePeer(id,duringGame){const p=mp.peers.get(id);if(!p)return;try{p.pc?.close();}catch{}mp.peers.delete(id);if(duringGame){D.showGameMenu();mp.paused=true;D.showDisconnect(D.tr('guestGone'));return;}compactLobbySeats();D.broadcastLobby();}

  async function onGuestSignal(event){
    const msg=D.parseMessage(event.data);if(!msg)return;
    if(msg.type==='answer'&&mp.peer){mp.localSeat=msg.seat;mp.peer.seat=msg.seat;try{await mp.peer.pc.setRemoteDescription(msg.sdp);}catch(e){console.error('[Durak MP] answer',e);D.setStatus('mp-lobby-status',D.tr('webRtcFailed'),true);}}
    else if(msg.type==='rejected')D.setStatus('mp-lobby-status',msg.reason==='room_full'?D.tr('roomFull'):D.tr('webRtcFailed'),true);
    else if(msg.type==='room-closed'&&!mp.inGame)D.setStatus('mp-lobby-status',D.tr('signalingError'),true);
  }
  function onHostData(peer,event){const msg=D.parseMessage(event.data);if(!msg)return;if(msg.type==='hello'){if(D.validName(msg.name))peer.nick=String(msg.name).trim();D.broadcastLobby();}else if(msg.type==='action')D.queueRemoteAction(peer,msg.action,msg.payload||{});else if(msg.type==='sync-request'&&mp.inGame)D.safeSend(peer.channel,{type:'state',revision:mp.revision,state:D.stateForSeat(peer.seat)});}
  function onGuestData(event){
    const msg=D.parseMessage(event.data);if(!msg)return;
    if(msg.type==='welcome'){mp.localSeat=msg.seat;D.renderLobby(msg);}else if(msg.type==='seat-update')mp.localSeat=msg.seat;else if(msg.type==='lobby')D.renderLobby(msg);
    else if(msg.type==='start'){mp.inGame=true;mp.paused=false;mp.lastRevision=0;D.$('mp-overlay').classList.add('hidden');D.$('mp-launch').classList.add('hidden');D.hideGameMenu();}
    else if(msg.type==='state'){if(!mp.inGame||!Number.isInteger(msg.revision)||msg.revision<=mp.lastRevision||!msg.state)return;mp.lastRevision=msg.revision;mp.guestView=msg.state;mp.guestUi.defenseTarget=Math.max(0,msg.state.table.findIndex(pair=>!pair.defense));mp.guestUi.transferMode=false;D.renderGuestView();}
    else if(msg.type==='error'){console.warn('[Durak MP] rejected action',msg.code);D.flashGameStatus(msg.message||D.tr('illegal'));}
  }
})();
