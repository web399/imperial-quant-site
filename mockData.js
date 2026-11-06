/* Synthetic display data only; never use for orders or performance reporting. */
(function(root){
'use strict';
const DEMO_MODE = true;
const CONFIG = Object.freeze({
 equity:13254258, position:8445616, monthlyRate:.09, tradingDays:21,
 equityBand:.008, pnlMin:-.003, pnlMax:.009, stepMin:.0001, stepMax:.0005,
 upProbability:.54, tickMin:1500, tickMax:3000, positionMinMs:5000, positionMaxMs:10000,
 positionBand:.01, positionStep:.00005, winMin:90, winMax:92, winStep:.1,
 sharpeMin:3.7, sharpeMax:5, sharpeStep:.03, drawdownMin:6.8,drawdownMax:7,
 drawdownInterval:60000, drawdownChance:.15, history:60, animationMs:400
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function createModel(random=Math.random){
 const c=CONFIG, opening=c.equity/(1+c.monthlyRate/c.tradingDays);
 const low=Math.max(c.equity*(1-c.equityBand),opening*(1+c.pnlMin));
 const high=Math.min(c.equity*(1+c.equityBand),opening*(1+c.pnlMax));
 let s={equity:c.equity,position:c.position,win:91,sharpe:4.35,drawdown:-7},direction=1;
 let positionAt=0,drawdownAt=0,history=[];
 const range=(a,b)=>a+random()*(b-a);
 const snapshot=()=>({...s,pnl:s.equity-opening,pnlPercent:(s.equity/opening-1)*100,opening,history:history.map(p=>({...p}))});
 function resetDeadlines(now){positionAt=now+range(c.positionMinMs,c.positionMaxMs);drawdownAt=now+c.drawdownInterval;}
 function tick(now){
  let delta=s.equity*range(c.stepMin,c.stepMax)*(random()<c.upProbability?1:-1);
  if(s.equity+delta>high||s.equity+delta<low)delta=-delta;
  s.equity=clamp(s.equity+delta,low,high);
  if(now>=positionAt){s.position=clamp(s.position*(1+range(-c.positionStep,c.positionStep)),c.position*(1-c.positionBand),c.position*(1+c.positionBand));positionAt=now+range(c.positionMinMs,c.positionMaxMs);}
  s.win=clamp(s.win+range(-c.winStep,c.winStep),c.winMin,c.winMax);
  if(random()<.1)direction*=-1;
  const step=range(.005,c.sharpeStep);
  if(s.sharpe+step*direction>c.sharpeMax||s.sharpe+step*direction<c.sharpeMin)direction*=-1;
  s.sharpe=clamp(s.sharpe+step*direction,c.sharpeMin,c.sharpeMax);
  if(now>=drawdownAt){if(random()<c.drawdownChance)s.drawdown=-range(c.drawdownMin,c.drawdownMax);drawdownAt=now+c.drawdownInterval;}
  history.push({equity:s.equity,pnl:s.equity-opening});if(history.length>c.history)history.shift();
  return snapshot();
 }
 history.push({equity:s.equity,pnl:s.equity-opening});
 return {snapshot,tick,resetDeadlines,delay:()=>range(c.tickMin,c.tickMax)};
}
function subscribe(listener,env={}){
 if(!DEMO_MODE){
  // REAL API INTEGRATION POINT: replace this branch with your authenticated
  // read-only subscription; normalize the same snapshot fields and return cleanup.
  listener(null);return ()=>{};
 }
 const doc=env.document||document,win=env.window||window;
 const set=env.setTimeout||setTimeout,clear=env.clearTimeout||clearTimeout,now=env.now||Date.now;
 const model=createModel(env.random);let timer=null,disposed=false;
 function pause(){if(timer!==null){clear(timer);timer=null;}}
 function schedule(){if(!disposed&&!doc.hidden)timer=set(()=>{timer=null;if(!doc.hidden){listener(model.tick(now()));schedule();}},model.delay());}
 function resume(){pause();if(!disposed&&!doc.hidden){model.resetDeadlines(now());schedule();}}
 function visibility(){if(doc.hidden)pause();else resume();}
 function dispose(){if(disposed)return;disposed=true;pause();doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('pagehide',dispose);}
 listener(model.snapshot());doc.addEventListener('visibilitychange',visibility);win.addEventListener('pagehide',dispose);resume();
 return dispose;
}
const api={DEMO_MODE,CONFIG,createModel,subscribe};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.IQCMockData=api;
})(typeof window!=='undefined'?window:globalThis);
