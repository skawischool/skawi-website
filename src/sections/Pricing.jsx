import {useEffect,useRef} from 'react';
import './Pricing.css';

const copy={
 UA:['Обери свій формат навчання','«Твій темп. Твій формат. Твій результат.»','Що входить:','Записатися на заняття','год',[
 ['Комплексний','Рівень A1–B2','Польська для щоденного життя.',['Мінігрупи до 4–9 осіб','Живе спілкування','Інтерактивні завдання','Поступове зростання рівня']],
 ['Екзаменаційний','Рівень A1–B2','Вільно спілкуйся польською без бар’єрів.',['Повний супровід','Розбір формату іспитів','Мінігрупи до 4–6 осіб','Практика типових завдань']],
 ['Персональний','Індивідуально','Індивідуальне навчання у твоєму темпі.',['Аналіз твого прогресу','Практика з викладачем','Постійний зворотний зв’язок','Індивідуальна програма']]]],
 RU:['Выбери свой формат обучения','«Твой темп. Твой формат. Твой результат.»','Что входит:','Записаться на занятия','ч',[
 ['Комплексный','Уровень A1–B2','Польский для повседневной жизни.',['Мини-группы 4–9 человек','Живое общение','Интерактивные задания','Постепенное повышение уровня']],
 ['Экзаменационный','Уровень A1–B2','Свободно общайся на польском без барьеров.',['Полное сопровождение','Разбор формата экзаменов','Мини-группы 4–6 человек','Практика типовых заданий']],
 ['Персональный','Индивидуально','Индивидуальное обучение в твоём темпе.',['Анализ твоего прогресса','Практика с преподавателем','Постоянная обратная связь','Индивидуальная программа']]]],
 EN:['Choose your learning format','“Your pace. Your format. Your result.”','What’s included:','Book a lesson','h',[
 ['Comprehensive','Level A1–B2','Polish for everyday life.',['Small groups of 4–9','Real conversations','Interactive exercises','Gradual level progression']],
 ['Exam preparation','Level A1–B2','Speak Polish freely without barriers.',['Full support','Exam format review','Small groups of 4–6','Practice with typical tasks']],
 ['Personal','Individual','Individual learning at your own pace.',['Progress analysis','Practice with a teacher','Continuous feedback','Personalised programme']]]],
 PL:['Wybierz swój format nauki','„Twoje tempo. Twój format. Twój wynik.”','Co obejmuje:','Zapisz się na zajęcia','godz.',[
 ['Kompleksowy','Poziom A1–B2','Polski w codziennym życiu.',['Małe grupy 4–9 osób','Żywa komunikacja','Interaktywne zadania','Stopniowy rozwój poziomu']],
 ['Egzaminacyjny','Poziom A1–B2','Rozmawiaj po polsku swobodnie, bez barier.',['Pełne wsparcie','Omówienie formatu egzaminów','Małe grupy 4–6 osób','Ćwiczenie typowych zadań']],
 ['Personalny','Indywidualnie','Indywidualna nauka w Twoim tempie.',['Analiza postępów','Praktyka z lektorem','Stała informacja zwrotna','Indywidualny program']]]],
 SP:['Elige tu formato de aprendizaje','«Tu ritmo. Tu formato. Tu resultado.»','Qué incluye:','Inscríbete en las clases','h',[
 ['Integral','Nivel A1–B2','Polaco para la vida cotidiana.',['Grupos pequeños de 4–9 personas','Conversación real','Ejercicios interactivos','Progreso gradual de nivel']],
 ['Preparación de examen','Nivel A1–B2','Habla polaco libremente y sin barreras.',['Acompañamiento completo','Análisis del formato de los exámenes','Grupos pequeños de 4–6 personas','Práctica de tareas típicas']],
 ['Personal','Individual','Aprendizaje individual a tu ritmo.',['Análisis de tu progreso','Práctica con el profesor','Comentarios continuos','Programa individual']]]]
};
function PlanButton({dark,label,onApply}){
 const ref=useRef(null),textRef=useRef(null),arrow=useRef(null);
 useEffect(()=>{
  const el=ref.current;
  const measure=()=>{const s=getComputedStyle(el);const w=el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);el.style.setProperty('--plan-label-travel',Math.max(0,w-textRef.current.offsetWidth)+'px');el.style.setProperty('--plan-arrow-travel',-Math.max(0,w-arrow.current.offsetWidth)+'px');};
  measure();if(!('ResizeObserver' in window))return;const observer=new ResizeObserver(measure);observer.observe(el);observer.observe(textRef.current);return()=>observer.disconnect();
 },[label]);
 return <button type="button" ref={ref} className="pricing__cta pricing__cta--application" onClick={onApply}>
  <span ref={textRef} className="pricing__cta-label">{label}</span>
  <span ref={arrow} className="pricing__arrow" aria-hidden="true"><img src={import.meta.env.BASE_URL+'icons/cta-arrow'+(dark?'-active':'')+'.svg'} width="36" height="36" alt=""/><img className="pricing__arrow-hover" src={import.meta.env.BASE_URL+'icons/cta-arrow'+(dark?'':'-active')+'.svg'} width="36" height="36" alt=""/></span>
 </button>;
}
export default function Pricing({language='UA',onApply}){
 const [heading,quote,includes,cta,hour,plans]=copy[language]??copy.UA;
 const root=useRef(null);
 useEffect(()=>{
  const section=root.current;
  const grid=section?.querySelector('.pricing__grid');
  if(!grid)return;
  const cards=[...grid.querySelectorAll('.pricing__card')];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop=window.matchMedia('(min-width:951px)');
  let frame=0, navigationAligned=false;
  const prepareNavigation=()=>{
   navigationAligned=true;
   section.classList.remove('pricing--navigation-reveal');
   section.classList.add('pricing--navigation-pending');
   cards.forEach(card=>card.style.setProperty('--pricing-offset','0px'));
  };
  const revealNavigation=()=>{
   section.classList.remove('pricing--navigation-pending');
   section.classList.add('pricing--navigation-reveal');
  };
  const finishReveal=e=>{
   if(e.animationName==='pricing-navigation-card'&&e.target===cards[2])section.classList.remove('pricing--navigation-reveal');
  };
  section.addEventListener('pricing:prepare-navigation',prepareNavigation);
  section.addEventListener('pricing:reveal-navigation',revealNavigation);
  section.addEventListener('animationend',finishReveal);
  const update=()=>{
   frame=0;
   if(reduced.matches||!desktop.matches){cards.forEach(card=>card.style.removeProperty('--pricing-offset'));return;}
   const rect=grid.getBoundingClientRect(),vh=window.innerHeight;
   // Keep the direct navigation view aligned, including short desktop viewports.
   // Release only after leaving the pricing entrance region on a manual scroll.
   if(navigationAligned){
    if(rect.top>=vh || rect.bottom<=0 || rect.top<=vh*.28) navigationAligned=false;
    else {cards.forEach(card=>card.style.setProperty('--pricing-offset','0px'));return;}
   }
   const span=Math.max(1,vh*.72);
   const progress=Math.max(0,Math.min(1,(vh-rect.top)/span));
   const eased=progress*progress*(3-2*progress);
   const offsets=[65,-40,90];
   cards.forEach((card,i)=>card.style.setProperty('--pricing-offset',((1-eased)*offsets[i]).toFixed(2)+'px'));
  };
  const request=()=>{if(!frame)frame=requestAnimationFrame(update);};
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',request,{passive:true});
  reduced.addEventListener('change',request);
  desktop.addEventListener('change',request);
  update();
  return()=>{cancelAnimationFrame(frame);section.removeEventListener('pricing:prepare-navigation',prepareNavigation);section.removeEventListener('pricing:reveal-navigation',revealNavigation);section.removeEventListener('animationend',finishReveal);section.classList.remove('pricing--navigation-pending','pricing--navigation-reveal');window.removeEventListener('scroll',request);window.removeEventListener('resize',request);reduced.removeEventListener('change',request);desktop.removeEventListener('change',request);cards.forEach(card=>card.style.removeProperty('--pricing-offset'));};
 },[]);
 return <section id="pricing" className="pricing" ref={root} aria-labelledby="pricing-heading">
  <div className="pricing__backdrop" aria-hidden="true"/>
  <div className="pricing__topline"><h2 id="pricing-heading">{heading}</h2><span>{quote}</span></div>
  <div className="pricing__grid">
   {plans.map(([name,level,description,features],i)=><article key={i} className={'pricing__card pricing__card--'+i+(i===1?' pricing__card--dark':'')}>
    <div className="pricing__card-content">
     <div className="pricing__head"><h3>{name}</h3><span>{level}</span></div>
     <p className="pricing__description">{description}</p>
     <p className="pricing__price">{i===0?'1390 zł':i===1?'1500 zł':'75 - 85 zł/'+hour}</p>
     <div className="pricing__line" aria-hidden="true"/>
     <div className="pricing__features"><p>{includes}</p><ul>{features.map(feature=><li key={feature}>{feature}</li>)}</ul></div>
     <PlanButton dark={i===1} label={cta} onApply={()=>onApply?.(i)}/>
    </div>
   </article>)}
  </div>
 </section>;
}
