(() => {
  'use strict';
  const D=window.DurakMP, mp=D.mp;
  let broadcastQueued=false;

  function decorateHumans(state){
    const doc=D.gameDoc(); if(!doc||!state?.players)return;
    doc.querySelectorAll('#score-list .player-panel').forEach((panel,index)=>{
      const p=state.players[index]; if(!p||p.isBot||index===0)return;
      const role=panel.querySelector('.player-role'); if(role?.textContent.includes(' · '))role.textContent=role.textContent.split(' · ').slice(-1)[0];
    });
  }
  D.installGameHooks=()=>{
    const w=D.frame.contentWindow;
    if(!w?.Durak?.game)return;
    mp.frameWindow=w; mp.game=w.Durak.game;
    const G=w.Durak;
    if(G.ui.__durakMpHooked){mp.hooksInstalled=true;return;}
    Object.defineProperty(G.ui,'__durakMpHooked',{value:true});
    mp.originalRender=G.ui.render.bind(G.ui);
    G.ui.render=function(state){ mp.originalRender(state); decorateHumans(state); if(mp.role==='host'&&mp.inGame&&!mp.paused&&state===G.game.state)D.queueBroadcast(); };
    mp.originalBot={chooseAttack:G.bot.chooseAttack,chooseThrowIn:G.bot.chooseThrowIn,chooseDefense:G.bot.chooseDefense};
    G.bot.chooseAttack=function(ctx){const q=consumeRemoteMove(ctx,['play-card']);return q?(ctx.hand.find(c=>c.id===q.payload.cardId)||null):mp.originalBot.chooseAttack(ctx);};
    G.bot.chooseThrowIn=function(ctx){const q=consumeRemoteMove(ctx,['play-card','pass']);return q?(q.action==='pass'?null:(ctx.hand.find(c=>c.id===q.payload.cardId)||null)):mp.originalBot.chooseThrowIn(ctx);};
    G.bot.chooseDefense=function(ctx){const q=consumeRemoteMove(ctx,['take','beat','transfer']);if(!q)return mp.originalBot.chooseDefense(ctx);if(q.action==='take')return{type:'take'};if(q.action==='transfer')return{type:'transfer',card:ctx.hand.find(c=>c.id===q.payload.cardId)};return{type:'beat',pair:G.game.state.table[q.payload.pairIndex],card:ctx.hand.find(c=>c.id===q.payload.cardId)};};
    try{
      const proto=w.Storage?.prototype;
      if(proto&&!proto.__durakMpPatched){const original=proto.setItem;Object.defineProperty(proto,'__durakMpPatched',{value:true});proto.setItem=function(k,v){if(k==='durniowie-session-v1'&&mp.inGame)return;return original.call(this,k,v);};}
    }catch{}
    const doc=D.gameDoc(); doc?.addEventListener('click',captureGameClick,true); doc?.addEventListener('change',captureGameChange,true);
    mp.hooksInstalled=true; D.applyLanguage();
  };

  function consumeRemoteMove(ctx,allowed){
    if(mp.role!=='host'||!mp.inGame||!mp.game)return null;
    const seat=mp.game.state.hands.indexOf(ctx.hand),q=mp.remoteQueue.get(seat);
    if(!q||!allowed.includes(q.action))return null;
    mp.remoteQueue.delete(seat);
    const p=mp.game.state.players[seat]; if(p&&q.control==='human')p.isBot=false;
    return q;
  }
  D.currentActor=(s)=>s.phase==='attack'?s.attacker:s.phase==='defense'?s.defender:s.phase==='throwin'?s.thrower:null;
  function nextActive(s,from){for(let step=1;step<=s.players.length;step++){const i=(from+step)%s.players.length;if(!s.out[i])return i;}return from;}

  D.validateAction=(seat,action,payload={})=>{
    const G=mp.frameWindow?.Durak,s=G?.game?.state;
    if(!s||!mp.inGame||mp.paused)return{ok:false,code:'NOT_IN_GAME'};
    if(!Number.isInteger(seat)||seat<1||seat>=s.players.length)return{ok:false,code:'BAD_SEAT'};
    if(D.currentActor(s)!==seat)return{ok:false,code:'NOT_YOUR_TURN'};
    if(mp.remoteQueue.has(seat))return{ok:false,code:'BUSY'};
    const hand=s.hands[seat]||[],card=typeof payload.cardId==='string'?hand.find(c=>c.id===payload.cardId):null;
    if(action==='play-card'){
      if(!card||!['attack','throwin'].includes(s.phase))return{ok:false,code:'ILLEGAL_CARD'};
      if(s.phase==='throwin'){
        if(s.table.length>=s.maxAttacks)return{ok:false,code:'ATTACK_LIMIT'};
        if(!G.rules.legalThrowIns(hand,s.table).some(c=>c.id===card.id))return{ok:false,code:'ILLEGAL_THROWIN'};
      }
      return{ok:true};
    }
    if(action==='beat'){
      const pair=s.table[Number(payload.pairIndex)];
      return s.phase==='defense'&&card&&pair&&!pair.defense&&G.rules.beats(pair.attack,card,s.trump)?{ok:true}:{ok:false,code:'ILLEGAL_DEFENSE'};
    }
    if(action==='take')return s.phase==='defense'?{ok:true}:{ok:false,code:'ILLEGAL_TAKE'};
    if(action==='pass')return s.phase==='throwin'?{ok:true}:{ok:false,code:'ILLEGAL_PASS'};
    if(action==='transfer'){
      if(s.phase!=='defense'||!s.rules.transfer||!card)return{ok:false,code:'ILLEGAL_TRANSFER'};
      if(!G.rules.transferOptions(hand,s.table).some(c=>c.id===card.id))return{ok:false,code:'ILLEGAL_TRANSFER'};
      const next=nextActive(s,s.defender);
      if(next===s.defender||(s.hands[next]||[]).length<s.table.length+1)return{ok:false,code:'ILLEGAL_TRANSFER_TARGET'};
      return{ok:true};
    }
    return{ok:false,code:'UNKNOWN_ACTION'};
  };

  D.queueRemoteAction=(peer,action,payload={})=>{
    const check=D.validateAction(peer.seat,action,payload);
    if(!check.ok){D.safeSend(peer.channel,{type:'error',code:check.code,message:D.tr('illegal')});return false;}
    const state=mp.game.state;
    mp.remoteQueue.set(peer.seat,{action,payload,control:'human'});
    state.players[peer.seat].isBot=true;
    const speedKey=state.settings.speed,old=mp.frameWindow.Durak.SPEEDS[speedKey];
    mp.frameWindow.Durak.SPEEDS[speedKey]=0.01;
    try{mp.game.refresh();}finally{mp.frameWindow.Durak.SPEEDS[speedKey]=old;}
    return true;
  };

  D.clone=(v)=>{try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v));}};
  const mapIndex=(map,v)=>v==null?v:(map.has(v)?map.get(v):v);
  D.stateForSeat=(seat)=>{
    const source=mp.game?.state;
    if(!source||!Number.isInteger(seat)||seat<0||seat>=source.players.length)return null;
    const view=D.clone(source);
    view.multiplayer=true; view.tutorial={active:false,coach:null,hintCardId:null}; view.botConfig=[];
    view.deck=Array(source.deck.length).fill(null); view.discard=[];
    view.hands=source.hands.map((hand,i)=>i===seat?D.clone(hand):Array(hand.length).fill(null));
    view.players=source.players.map((p,i)=>({name:i===0?mp.name:p.name,isBot:!!p.isBot&&!D.peerForSeat(i),difficulty:p.difficulty||'normal'}));
    const n=view.players.length,order=Array.from({length:n},(_,o)=>(seat+o)%n),map=new Map(order.map((old,i)=>[old,i])),reorder=(arr)=>order.map(i=>arr?.[i]);
    view.players=reorder(view.players);view.hands=reorder(view.hands);view.out=reorder(view.out);view.bubbles=reorder(view.bubbles);
    view.attacker=mapIndex(map,view.attacker);view.defender=mapIndex(map,view.defender);view.thrower=mapIndex(map,view.thrower);view.durak=mapIndex(map,view.durak);
    view.passed=(view.passed||[]).map(i=>mapIndex(map,i));view.outOrder=(view.outOrder||[]).map(i=>mapIndex(map,i));
    view.transferMode=false;view.defenseTarget=Math.max(0,view.table.findIndex(pair=>!pair.defense));
    setLocalStatus(view); return view;
  };
  function setLocalStatus(view){
    const G=mp.frameWindow?.Durak;if(!G)return;
    if(view.phase==='attack'&&view.attacker===0)view.status={key:'status.yourAttack',vars:null};
    else if(view.phase==='defense'&&view.defender===0){const u=G.rules.unbeatenPairs(view.table);view.status=u.length>1?{key:'status.yourDefenseMulti',vars:null}:u.length===1?{key:'status.yourDefense',vars:{card:G.rules.cardLabel(u[0].attack)}}:view.status;}
    else if(view.phase==='throwin'&&view.thrower===0)view.status={key:view.taking?'status.yourThrowInTake':'status.yourThrowIn',vars:view.taking?{name:view.players[view.defender]?.name||D.tr('human')}:null};
    else{const a=D.currentActor(view);if(a!=null)view.status={key:'status.waitBot',vars:{name:view.players[a]?.name||D.tr('human')}};}
  }

  D.queueBroadcast=()=>{if(broadcastQueued)return;broadcastQueued=true;queueMicrotask(()=>{broadcastQueued=false;D.broadcastState();});};
  D.broadcastState=()=>{
    if(mp.role!=='host'||!mp.inGame||mp.paused)return;
    mp.revision++;
    for(const peer of mp.peers.values())if(peer.connected)D.safeSend(peer.channel,{type:'state',revision:mp.revision,state:D.stateForSeat(peer.seat)});
  };

  D.renderGuestView=()=>{
    if(mp.role!=='guest'||!mp.guestView||!mp.frameWindow?.Durak?.ui)return;
    const view=D.clone(mp.guestView);view.defenseTarget=mp.guestUi.defenseTarget;view.transferMode=mp.guestUi.transferMode;
    mp.frameWindow.Durak.ui.render(view);D.hideGameMenu();
  };
  D.flashGameStatus=(text)=>{const n=D.gameDoc()?.getElementById('status-text');if(!n)return;const old=n.textContent;n.textContent=text;setTimeout(()=>{if(n.textContent===text)n.textContent=old;},1800);};
  D.sendGuestAction=(action,payload={})=>D.safeSend(mp.peer?.channel,{type:'action',action,payload});

  function captureGameClick(event){
    if(!mp.inGame)return;
    const target=event.target,actionEl=target.closest?.('[data-action]'),cardEl=target.closest?.('[data-card-id]'),pairEl=target.closest?.('[data-pair-index]');
    if(mp.role==='host'){
      if(actionEl?.dataset.action==='open-main-menu'){event.preventDefault();event.stopImmediatePropagation();D.leaveMultiplayer();}
      return;
    }
    if(mp.role!=='guest')return;
    if(actionEl){
      const action=actionEl.dataset.action;
      if(['human-take','human-pass','start-transfer','cancel-transfer','open-main-menu','open-settings','close-settings','next-round'].includes(action)){
        event.preventDefault();event.stopImmediatePropagation();
        if(action==='human-take')D.sendGuestAction('take');else if(action==='human-pass')D.sendGuestAction('pass');else if(action==='start-transfer'){mp.guestUi.transferMode=true;D.renderGuestView();}else if(action==='cancel-transfer'){mp.guestUi.transferMode=false;D.renderGuestView();}else if(action==='open-main-menu')D.leaveMultiplayer();else if(action==='open-settings')D.gameDoc()?.getElementById('settings-modal')?.classList.remove('hidden');else if(action==='close-settings')D.gameDoc()?.getElementById('settings-modal')?.classList.add('hidden');
        return;
      }
    }
    if(pairEl&&mp.guestView?.phase==='defense'&&mp.guestView.defender===0&&!mp.guestUi.transferMode){event.preventDefault();event.stopImmediatePropagation();const i=Number(pairEl.dataset.pairIndex);if(mp.guestView.table[i]&&!mp.guestView.table[i].defense){mp.guestUi.defenseTarget=i;D.renderGuestView();}return;}
    if(cardEl?.tagName==='BUTTON'&&!cardEl.disabled){event.preventDefault();event.stopImmediatePropagation();const cardId=cardEl.dataset.cardId,phase=mp.guestView?.phase;if(phase==='attack'||phase==='throwin')D.sendGuestAction('play-card',{cardId});else if(phase==='defense'){if(mp.guestUi.transferMode)D.sendGuestAction('transfer',{cardId});else D.sendGuestAction('beat',{cardId,pairIndex:mp.guestUi.defenseTarget});}}
  }
  function captureGameChange(event){
    if(!mp.inGame)return;const target=event.target;
    if(mp.role==='guest'){event.preventDefault();event.stopImmediatePropagation();return;}
    if(mp.role==='host'&&target?.dataset?.setting&&['throwInAll','transfer','limitSix'].includes(target.dataset.setting)){event.preventDefault();event.stopImmediatePropagation();}
  }

  D.startHostGame=()=>{
    if(!D.canHostStart?.()||!mp.game)return false;
    const humans=[D.peerForSeat(1),D.peerForSeat(2)].filter(Boolean),useBot=mp.botSeat===2&&!D.peerForSeat(2),total=1+humans.length+(useBot?1:0);
    if(total<2||total>3)return false;
    mp.inGame=false;mp.paused=false;mp.revision=0;mp.remoteQueue.clear();
    const state=mp.game.state;state.botCount=total-1;state.botConfig=Array.from({length:state.botCount},(_,i)=>(useBot&&i===total-2?mp.botDifficulty:'normal'));
    mp.game.startNewGame();state.multiplayer=true;state.players[0]={name:mp.name,isBot:false,difficulty:'normal'};
    for(const peer of humans)state.players[peer.seat]={name:peer.nick,isBot:false,difficulty:'normal'};
    if(useBot)state.players[2]={name:'Bot',isBot:true,difficulty:mp.botDifficulty};
    state.botCount=state.players.filter(p=>p.isBot).length;mp.inGame=true;
    try{mp.frameWindow.localStorage.removeItem('durniowie-session-v1');}catch{}
    for(const peer of humans)D.safeSend(peer.channel,{type:'start',seat:peer.seat,players:state.players.map(p=>({name:p.name,isBot:p.isBot}))});
    D.$('mp-overlay').classList.add('hidden');D.$('mp-launch').classList.add('hidden');mp.game.refresh();
    if(mp.socket?.readyState===WebSocket.OPEN){mp.closeExpected=true;mp.socket.send(JSON.stringify({type:'close-room'}));}
    return true;
  };
  D.showDisconnect=(reason)=>{mp.paused=true;D.$('mp-disconnect-text').textContent=reason||D.tr('connectionLostText');D.$('mp-disconnect').classList.remove('hidden');};
})();
