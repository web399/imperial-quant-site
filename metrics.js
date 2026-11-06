/* Metrics rendering only. All simulation parameters live in mockData.js. */
(()=>{
const source=window.IQCMockData,root=document.querySelector('.account-metrics');
if(!source||!root)return;
const keys=['equity','pnl','position','win','sharpe','drawdown'],cards=[...root.children];
const money=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0,unsubscribe=null,observer=null,last=null,target=null;
const status=document.querySelector('.status-strip>span');
const topEquity=document.querySelectorAll('.status-strip b')[1];
function format(k,v){
 if(k==='pnl')return (v>=0?'▲ +':'▼ −')+money.format(Math.abs(v));
 if(k==='win')return v.toFixed(1)+'%';
 if(k==='sharpe')return v.toFixed(2);
 if(k==='drawdown')return v.toFixed(1)+'%';
 return money.format(v);
}
cards.forEach((card,i)=>{
 card.dataset.metric=keys[i];card.classList.add('live-metric');
 const detail=document.createElement('span');detail.className='metric-detail';card.append(detail);
 if(i<2){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 200 28');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('sparkline');svg.innerHTML='<path fill="none" stroke="currentColor" stroke-width="1.5"/>';card.append(svg);}
});
function draw(values){
 cards.forEach((card,i)=>{
 const k=keys[i],v=values[k];card.querySelector('strong').textContent=format(k,v);
 if(k==='pnl'){card.querySelector('strong').classList.toggle('positive',v>=0);card.querySelector('strong').classList.toggle('negative',v<0);card.querySelector('.metric-detail').textContent=(values.pnlPercent>=0?'+':'')+values.pnlPercent.toFixed(2)+'%';}
 });
 topEquity.textContent=money.format(values.equity);
}
function chart(svg,history,key){
 const values=history.map(p=>p[key]),min=Math.min(...values),max=Math.max(...values),span=max-min||1;
 const path=values.map((v,i)=>(i?'L':'M')+(200-(values.length-1-i)*200/59).toFixed(2)+' '+(25-(v-min)/span*22).toFixed(2)).join(' ');
 svg.querySelector('path').setAttribute('d',path);svg.classList.toggle('negative',key==='pnl'&&values.at(-1)<0);
}
function render(s){
 cancelAnimationFrame(frame);target=s;
 if(!s){status.textContent='展示模式 · 数据未接入';topEquity.textContent='—';root.setAttribute('aria-label','账户数据未接入');cards.forEach(c=>{c.querySelector('strong').textContent='—';c.querySelector('small').textContent='未接入';c.querySelector('.metric-detail').textContent='';c.querySelector('svg')?.setAttribute('hidden','');});last=null;return;}
 status.textContent='模拟数据 · 非真实账户';root.setAttribute('aria-label','模拟账户指标：演示数据，非真实收益');
 cards.forEach((c,i)=>{
 c.querySelector('small').textContent='演示数据';
 if(last&&last[keys[i]]!==s[keys[i]]&&!reduced.matches){const up=s[keys[i]]>last[keys[i]];c.querySelector('strong').animate([{color:up?'var(--up)':'var(--down)'},{color:getComputedStyle(c.querySelector('strong')).color}],{duration:200});}
 });
 cards.slice(0,2).forEach((c,i)=>chart(c.querySelector('svg'),s.history,keys[i]));
 const start=last||s,begin=performance.now();
 function step(t){const p=reduced.matches?1:Math.min(1,(t-begin)/source.CONFIG.animationMs),ease=1-Math.pow(1-p,3),v={};[...keys,'pnlPercent'].forEach(k=>v[k]=start[k]+(s[k]-start[k])*ease);draw(v);last=v;if(p<1)frame=requestAnimationFrame(step);else frame=0;}
 if(docHidden()) {draw(s);last=s;} else frame=requestAnimationFrame(step);
}
function docHidden(){return document.hidden;}
function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;cards.forEach(c=>c.querySelector('strong').getAnimations().forEach(a=>a.cancel()));if(target){draw(target);last=target;}}}
function mount(){if(unsubscribe||!root.isConnected)return;unsubscribe=source.subscribe(render);observer=new MutationObserver(()=>{if(!root.isConnected)dispose();});observer.observe(document.body,{childList:true,subtree:true});document.addEventListener('visibilitychange',visibility);}
function dispose(){unsubscribe?.();unsubscribe=null;cancelAnimationFrame(frame);frame=0;observer?.disconnect();document.removeEventListener('visibilitychange',visibility);cards.forEach(c=>c.querySelector('strong').getAnimations().forEach(a=>a.cancel()));}
window.addEventListener('pagehide',dispose);
window.addEventListener('pageshow',e=>{if(e.persisted)mount();});
mount();
})();
