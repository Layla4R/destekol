'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { readCampaignGallery } from '@/lib/campaign-gallery';
const labels = {
  ar:{title:'صور الحملة',photo:'صورة',play:'تشغيل العرض التلقائي',pause:'إيقاف العرض التلقائي'},
  tr:{title:'Kampanya fotoğrafları',photo:'Fotoğraf',play:'Otomatik gösterimi başlat',pause:'Otomatik gösterimi durdur'},
  en:{title:'Campaign gallery',photo:'Photo',play:'Start slideshow',pause:'Pause slideshow'},
  fr:{title:'Photos de la campagne',photo:'Photo',play:'Lancer le diaporama',pause:'Mettre le diaporama en pause'},
};
export default function CampaignGallery({images, title, locale}:{images:string[];title:string;locale:string}) {
  const photos=readCampaignGallery(images), copy=labels[locale as keyof typeof labels]||labels.en;
  const [active,setActive]=useState(0), [playing,setPlaying]=useState(true), [visible,setVisible]=useState(false), [pageVisible,setPageVisible]=useState(true), [hovered,setHovered]=useState(false), [focused,setFocused]=useState(false), [reducedMotion,setReducedMotion]=useState(false);
  const root=useRef<HTMLElement>(null), thumbs=useRef<(HTMLButtonElement|null)[]>([]);
  const index=active<photos.length?active:0;
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const motion=()=>{setReducedMotion(media.matches);if(media.matches)setPlaying(false);}, visibility=()=>setPageVisible(!document.hidden);
    motion();visibility();media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
    const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting===true),{threshold:0.15});
    if(root.current)observer.observe(root.current);
    return()=>{observer.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  useEffect(()=>{
    if(photos.length<2||!playing||!visible||!pageVisible||hovered||focused||reducedMotion)return;
    const timer=setInterval(()=>setActive(i=>(i+1)%photos.length),1000);
    return()=>clearInterval(timer);
  },[photos.length,playing,visible,pageVisible,hovered,focused,reducedMotion]);
  useEffect(()=>{
    const button=thumbs.current[index], track=button?.parentElement;
    if(button&&track){const left=button.offsetLeft, right=left+button.offsetWidth;if(left<track.scrollLeft||right>track.scrollLeft+track.clientWidth)track.scrollTo({left:Math.max(0,left-(track.clientWidth-button.offsetWidth)/2),behavior:reducedMotion?'auto':'smooth'});}
  },[index,reducedMotion]);
  if(!photos.length)return null;
  return <section ref={root} className="campaign-gallery" data-playing={playing} data-running={playing&&visible&&pageVisible&&!hovered&&!focused&&!reducedMotion} aria-label={copy.title} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={e=>setFocused(!(e.target as HTMLElement).closest('.campaign-gallery-play'))} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setFocused(false);}}>
    <h2>{copy.title}</h2>
    <div className="campaign-gallery-stage" aria-roledescription="carousel">
      {photos.map((src,i)=><div key={src} className="campaign-gallery-slide" data-active={i===index} aria-hidden={i!==index}><Image src={src} alt={`${title} — ${copy.photo} ${i+1}`} fill sizes="(max-width: 1023px) 100vw, 960px" quality={75} className="object-cover"/></div>)}
      <span className="campaign-gallery-counter"><bdi dir="ltr">{index+1} / {photos.length}</bdi></span>
      {photos.length>1&&<button type="button" className="campaign-gallery-play" onClick={()=>{setPlaying(!playing);setReducedMotion(false);}} aria-label={playing?copy.pause:copy.play}>{playing?<span aria-hidden="true">Ⅱ</span>:<span aria-hidden="true">▶</span>}</button>}
    </div>
    <div className="campaign-gallery-thumbnails" dir="ltr">{photos.map((src,i)=><button ref={el=>{thumbs.current[i]=el;}} key={src} type="button" aria-label={`${copy.photo} ${i+1}`} aria-pressed={i===index} onClick={()=>{setActive(i);setPlaying(false);}}><Image src={src} alt="" fill sizes="160px" quality={60} className="object-cover"/></button>)}</div>
  </section>;
}
