import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {copy} from '../data/applicationCopy.js';
import './ApplicationForm.css';

const endpoint='https://skawi-mail.skawischool.workers.dev/';
const sitekey=import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAGXVBWsBjAhCKqJq';
const base=import.meta.env.BASE_URL;
const tariffs=['Комплексний — 1390 zł','Екзаменаційний — 1500 zł','Персональний — 75–85 zł/год'];
let scriptPromise;
function loadTurnstile(){
 if(window.turnstile) return Promise.resolve(window.turnstile);
 if(!scriptPromise) scriptPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const fail=()=>{clearTimeout(timer);script.remove();scriptPromise=null;reject(new Error('turnstile'));};
  const timer=setTimeout(fail,15000);
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;script.onload=()=>{clearTimeout(timer);window.turnstile?resolve(window.turnstile):fail();};script.onerror=fail;
  document.head.append(script);
 });
 return scriptPromise;
}
function Action({label,back=false,wide='',onClick,disabled=false}){
 const ref=useRef(null),text=useRef(null),arrow=useRef(null);
 useLayoutEffect(()=>{
  const el=ref.current;
  const measure=()=>{const s=getComputedStyle(el),w=el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);el.style.setProperty('--plan-label-travel',(back?-1:1)*Math.max(0,w-text.current.offsetWidth)+'px');el.style.setProperty('--plan-arrow-travel',(back?1:-1)*Math.max(0,w-arrow.current.offsetWidth)+'px');};
  measure();const observer=new ResizeObserver(measure);observer.observe(el);observer.observe(text.current);return()=>observer.disconnect();
 },[label,back]);
 const icon=<span ref={arrow} className="pricing__arrow application__arrow" aria-hidden="true"><img src={base+'icons/'+(back?'application-back.svg':'application-next.svg')} width="36" height="36" alt=""/><img className="pricing__arrow-hover" src={base+'icons/'+(back?'application-back-hover.svg':'application-next-hover.svg')} width="36" height="36" alt=""/></span>;
 return <button type="button" ref={ref} disabled={disabled} className={'pricing__cta application__action '+(back?'application__action--back ':'')+wide} onClick={onClick}>{back&&icon}<span ref={text} className="pricing__cta-label">{label}</span>{!back&&icon}</button>;
}
function Option({label,checked,onChange,multiple,name}){
 return <label className="application__option"><input type={multiple?'checkbox':'radio'} name={name} checked={checked} onChange={onChange}/><span className="application__circle" aria-hidden="true"><img src={base+'icons/application-option.svg'} alt="" width="12" height="12"/><img className="application__circle-active" src={base+'icons/application-option-active.svg'} alt="" width="12" height="12"/></span><span>{label}</span></label>;
}
export default function ApplicationForm({tariff,language,closing,onClose}){
 const c=copy[language]||copy.UA;
 const [step,setStep]=useState(0),[direction,setDirection]=useState('forward'),[details,setDetails]=useState({name:'',phone:'',email:''}),[goals,setGoals]=useState([]),[other,setOther]=useState(''),[format,setFormat]=useState(null),[method,setMethod]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const dialog=useRef(null),heading=useRef(null),challenge=useRef(null),widget=useRef(null),pending=useRef(false),alive=useRef(true),abort=useRef(null),timer=useRef(null);
 useEffect(()=>{alive.current=true;const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{alive.current=false;clearTimeout(timer.current);abort.current?.abort();if(widget.current!==null)window.turnstile?.remove(widget.current);document.body.style.overflow=old;};},[]);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[step]);
 useEffect(()=>{
  function key(e){
   if(e.key==='Escape'&&!busy&&!closing){e.preventDefault();onClose(step===3);}
   if(e.key==='Tab'){
    const elements=[...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),iframe,[tabindex="0"]')].filter(x=>x.getClientRects().length);
    if(!elements.length)return;
    const first=elements[0],last=elements[elements.length-1];
    if(e.shiftKey&&(document.activeElement===first||document.activeElement===heading.current)){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  }
  document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
 },[busy,closing,onClose,step]);
 const move=(next)=>{setError('');setDirection(next<step?'back':'forward');setStep(next);};
 const next=()=>{
  if(step===0&&(!details.name.trim()||details.phone.replace(/\D/g,'').length<7||(details.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())))){setError(c.errors[0]);return;}
  if(step===1&&(!goals.length||(goals.includes(c.goals.length-1)&&!other.trim()))){setError(c.errors[1]);return;}
  move(step+1);
 };
 function finishError(message){
  if(!alive.current||!pending.current)return;
  pending.current=false;clearTimeout(timer.current);setBusy(false);setError(message);
  if(widget.current!==null){window.turnstile?.remove(widget.current);widget.current=null;}
 }
 async function send(token){
  if(!pending.current||!alive.current)return;
  clearTimeout(timer.current);
  abort.current=new AbortController();
  timer.current=setTimeout(()=>abort.current?.abort(),25000);
  try{
   const result=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:abort.current.signal,body:JSON.stringify({type:'enrollment',token,name:details.name.trim(),phone:details.phone.trim(),email:details.email.trim(),tariff:tariffs[tariff],goal:goals.map(i=>copy.UA.goals[i]+(i===copy.UA.goals.length-1?': '+other.trim():'')).join('; '),format:copy.UA.formats[format],method:copy.UA.methods[method],language})});
   const data=await result.json();
   if(!result.ok||!data.success)throw new Error('send');
   if(!alive.current)return;
   pending.current=false;clearTimeout(timer.current);setBusy(false);
   if(widget.current!==null){window.turnstile?.remove(widget.current);widget.current=null;}
   move(3);
  }catch{finishError(c.errors[3]);}
 }
 async function submit(){
  if(pending.current)return;
  if(format===null||method===null){setError(c.errors[2]);return;}
  if(location.hostname!=='skawischool.github.io'){setError(c.errors[4]);return;}
  pending.current=true;setBusy(true);setError('');
  try{
   const ts=await loadTurnstile();
   if(!alive.current||!pending.current)return;
   widget.current=ts.render(challenge.current,{sitekey,action:'enrollment',execution:'execute',appearance:'interaction-only',callback:send,'error-callback':()=>finishError(c.errors[5]),'expired-callback':()=>finishError(c.errors[5]),'timeout-callback':()=>finishError(c.errors[5])});
   timer.current=setTimeout(()=>finishError(c.errors[5]),120000);
   ts.execute(widget.current);
  }catch{finishError(c.errors[5]);}
 }
 return createPortal(<div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="application-heading" data-lenis-prevent className={'application '+(closing?'application--closing ':'')+(step===3?'application--success':'')}>
 <div className="application__shell">
  <div className="application__top"><span>{c.labels[step]}</span>{step===3?<span>{c.status[2]}</span>:null}{step!==3&&<button type="button" disabled={busy||closing} className="application__close" aria-label={c.close} onClick={()=>onClose(false)}><svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="14" fill="#023536"/><path d="M9 9l10 10M19 9L9 19" stroke="#EAF4F0" strokeWidth="1.5"/></svg></button>}</div>
    <div className="application__middle">
   {step!==3&&<div key={step} className={'application__intro application__motion--'+direction}><h2 id="application-heading" tabIndex={-1} ref={heading}>{c.headings[step]}</h2><p>{c.descriptions[step]}</p></div>}
   <div className="application__panel">
    <div key={step} className={'application__content application__content--'+step+' application__motion--'+direction}>
    {step===0&&<>{['name','phone','email'].map((key,i)=><label key={key} className="application__field"><span>{c.fields[i]}</span><input type={['text','tel','email'][i]} autoComplete={['name','tel','email'][i]} maxLength={[120,40,254][i]} required={i<2} placeholder={c.placeholders[i]} value={details[key]} onChange={e=>setDetails(old=>({...old,[key]:e.target.value}))}/></label>)}<p className="application__privacy">{c.privacy}</p></>}
    {step===1&&<><div className="application__goals">{c.goals.map((label,i)=><Option key={i} label={label} multiple checked={goals.includes(i)} onChange={()=>setGoals(old=>old.includes(i)?old.filter(x=>x!==i):[...old,i])}/>)}</div><textarea aria-label={c.other} placeholder={c.other} maxLength={1000} disabled={!goals.includes(c.goals.length-1)} value={other} onChange={e=>setOther(e.target.value)}/></>}
    {step===2&&<>{[c.formats,c.methods].map((items,g)=><fieldset key={g} aria-labelledby={g===1?"application-delivery-heading":undefined}>{g===1?<div id="application-delivery-heading" className="application__delivery-heading">{c.groups[g]}</div>:<legend>{c.groups[g]}</legend>}{items.map((label,i)=><Option key={i} name={'application-group-'+g} label={label} checked={(g?method:format)===i} onChange={()=>g?setMethod(i):setFormat(i)}/>)}</fieldset>)}</>}
    {step===3&&<><h2 id="application-heading" tabIndex={-1} ref={heading}>{c.success[0]}</h2><p>{c.success[1]}</p><h3>{c.success[2]}</h3></>}
    </div>
   </div>
  </div>
  <div className="application__bottom">{step===3?null:<div className="application__progress"><span>0{step+1}</span><div aria-hidden="true" className="application__progress-lines">{[0,1,2].map(i=><span key={i} className={i<=step?'is-filled':''}/>)}</div><span>03</span></div>}<div className="application__actions">{error&&<p role="alert" className="application__error">{error}</p>}{step===2&&<div ref={challenge} className="application__challenge"/>}{step>0&&step<3&&<Action back label={c.buttons[1]} onClick={()=>move(step-1)} disabled={busy||closing}/>}<Action label={step===3?c.buttons[3]:step===2?(busy?c.buttons[4]:c.buttons[2]):c.buttons[0]} wide={step===3?'application__action--return':step===2?'application__action--submit':''} disabled={busy||closing} onClick={step===3?()=>onClose(true):step===2?submit:next}/></div></div>
 </div></div>,document.body);
}
