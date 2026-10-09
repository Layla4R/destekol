'use client';
import { useState } from 'react';
import ImageUpload from './ImageUpload';
export default function CampaignGalleryEditor({value,onChange}:{value:string[];onChange:(images:string[])=>void}) {
  const [draft,setDraft]=useState('');
  function move(index:number,direction:number){const images=[...value],target=index+direction;[images[index],images[target]]=[images[target],images[index]];onChange(images);}
  return <section className="space-y-4 rounded-2xl border border-line bg-slate-50 p-5">
    <h2 className="font-bold text-lg">Campaign gallery / معرض صور الحملة</h2>
    <p className="text-sm text-muted">Large photo with thumbnails at the end of the campaign page. Automatic switching every second. Upload up to 20 campaign photos and arrange their order here.</p>
    <div className="grid gap-4 sm:grid-cols-3">{value.map((src,index)=><div key={`${src}-${index}`} className="overflow-hidden rounded-xl border bg-white"><img src={src} alt={`Gallery photo ${index+1}`} className="aspect-video w-full object-cover"/><div className="flex justify-between gap-2 p-2"><button type="button" aria-label={`Move photo ${index+1} earlier`} disabled={index===0} onClick={()=>move(index,-1)} className="disabled:opacity-30">←</button><span>{index+1}</span><button type="button" aria-label={`Move photo ${index+1} later`} disabled={index===value.length-1} onClick={()=>move(index,1)} className="disabled:opacity-30">→</button><button type="button" className="text-danger" onClick={()=>onChange(value.filter((_,i)=>i!==index))}>Remove</button></div></div>)}</div>
    {value.length<20&&<><ImageUpload value={draft} onChange={setDraft} label="New gallery photo / صورة جديدة"/><button type="button" disabled={!draft.trim()} className="rounded-xl bg-brand px-5 py-2 text-white disabled:opacity-40" onClick={()=>{if(!value.includes(draft.trim()))onChange([...value,draft.trim()]);setDraft('');}}>Add photo / إضافة صورة</button></>}
  </section>;
}
