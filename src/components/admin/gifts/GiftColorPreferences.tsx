"use client";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./GiftColorPreferences.module.css";
export type GiftColorPreference={name:string;hex:string};
const MAX=8;
export function GiftColorPreferences({initialColors}:{initialColors:GiftColorPreference[]}){
  const router=useRouter(); const [colors,setColors]=useState(initialColors.slice(0,MAX)); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const add=()=>setColors(v=>v.length>=MAX?v:[...v,{name:"",hex:"#12308e"}]);
  async function save(){
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/admin/gift-preferences",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({colors})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){setMessage(data.message||"Não foi possível salvar.");return}
      setMessage("Cores salvas.");router.refresh();
    }finally{setBusy(false)}
  }
  return <section className={styles.panel}>
    <div className={styles.header}><div><strong>Cores de preferência</strong><p>Valem para toda a lista de presentes.</p></div><button type="button" onClick={add} disabled={busy||colors.length>=MAX}><Plus size={15}/>Adicionar cor</button></div>
    <div className={styles.list}>{colors.map((c,i)=><div className={styles.row} key={i}>
      <input type="color" value={c.hex} onChange={e=>setColors(v=>v.map((x,j)=>j===i?{...x,hex:e.target.value}:x))}/>
      <input value={c.name} maxLength={40} placeholder="Nome opcional, ex.: Azul-marinho" onChange={e=>setColors(v=>v.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/>
      <span className={styles.dot} style={{backgroundColor:c.hex}}/>
      <button type="button" onClick={()=>setColors(v=>v.filter((_,j)=>j!==i))}><Trash2 size={15}/></button>
    </div>)}</div>
    {!colors.length&&<p className={styles.empty}>Nenhuma cor cadastrada. O bloco não aparecerá para os convidados.</p>}
    <div className={styles.footer}><div className={styles.preview}><span>Prévia:</span>{colors.map((c,i)=><i key={i} style={{backgroundColor:c.hex}} title={c.name||c.hex}/>)}</div><button className="button button--primary" type="button" onClick={save} disabled={busy}>{busy?"Salvando...":"Salvar cores"}</button></div>
    {message&&<p className={styles.message}>{message}</p>}
  </section>
}
