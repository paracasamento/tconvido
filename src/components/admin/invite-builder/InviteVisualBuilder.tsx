"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import {

  AlignCenter, AlignLeft, AlignRight, Box, BringToFront, ChevronDown, Copy, Eye, EyeOff,

  ExternalLink, Grid3X3, ImagePlus, Layers3, Link2, Lock, MoveDown, MoveUp, Plus, Redo2, RotateCcw, Save,

  SendToBack, SlidersHorizontal, Trash2, Type, Undo2, Unlock, ZoomIn, ZoomOut

} from "lucide-react";

import type { InviteElement, InvitePartStyle, InviteSavedLayout, InviteScreen, InviteScreenId, InviteVisualConfig } from "@/lib/invite-builder";

import {
  normalizeInviteVisualConfig,
  resolveInviteFlowScreen,
  resolveRsvpScenarioScreen,
  SLOT_PARTS,
  type RsvpScenarioId,
} from "@/lib/invite-builder";

import { InviteCanvas } from "@/components/invite/InviteCanvas";
import { InviteContinuousFlow } from "@/components/invite/InviteContinuousFlow";
import { AccessFormView } from "@/components/invite/functional/AccessFormView";
import { RsvpControlsView } from "@/components/invite/functional/RsvpControlsView";
import { RsvpStatusView } from "@/components/invite/functional/RsvpStatusView";
import { RsvpFlowView, type RsvpPreviewState } from "@/components/invite/functional/RsvpFlowView";
import { GiftCard, type GiftUi } from "@/components/GiftCard";
import { GiftGridView } from "@/components/invite/functional/GiftGridView";
import { GiftNoteView } from "@/components/invite/functional/GiftNoteView";
import { CountdownView } from "@/components/invite/functional/CountdownView";
import { INVITE_ICON_OPTIONS } from "@/components/invite/InvitePartIcon";
import type { InviteEditorPreviewData } from "@/lib/invite-editor-preview";
import styles from "./InviteVisualBuilder.module.css";



type EditorPageId = "cover" | "access" | "invite-flow" | "rsvp";
type InviteFlowState = "before" | "after";

const EDITOR_PAGES: Array<{ id: EditorPageId; label: string }> = [
  { id: "cover", label: "Capa" },
  { id: "access", label: "Login" },
  { id: "invite-flow", label: "Convite completo" },
  { id: "rsvp", label: "Presença" },
];

const RSVP_PREVIEW_STATES: { id: RsvpPreviewState; label: string; short: string }[] = [
  { id:"children-question", label:"1. Pergunta sobre filhos", short:"Filhos?" },
  { id:"form-no-children", label:"2. Formulário sem filhos", short:"Sem filhos" },
  { id:"form-children", label:"3. Formulário com filhos", short:"Com filhos" },
  { id:"confirmed", label:"4. Presença confirmada", short:"Confirmado" },
  { id:"error", label:"5. Erro técnico", short:"Erro" },
];

const RSVP_PART_SCENARIO: Partial<Record<string, RsvpPreviewState>> = {
  "question-title": "children-question",
  "yes-button": "children-question",
  "yes-text": "children-question",
  "no-button": "children-question",
  "no-text": "children-question",
  "form-title": "form-no-children",
  "name-label": "form-no-children",
  "name-input": "form-no-children",
  "children-label": "form-children",
  "stepper": "form-children",
  "stepper-button": "form-children",
  "stepper-value": "form-children",
  "success-icon": "confirmed",
  "success-title": "confirmed",
  "success-copy": "confirmed",
  "success-copy-children": "confirmed",
  "error-card": "error",
  "error-title": "error",
  "error-copy": "error",
  "retry-button": "error",
  "retry-text": "error",
};

const RSVP_SCENARIO_PART_IDS: Record<RsvpPreviewState, string[]> = {
  "children-question": [
    "flow", "step-label", "question-title", "yes-button", "yes-text", "no-button", "no-text"
  ],
  "form-no-children": [
    "flow", "step-label", "form-title", "name-label", "name-input", "confirm-button", "confirm-text"
  ],
  "form-children": [
    "flow", "step-label", "form-title", "name-label", "name-input", "children-label", "stepper",
    "stepper-button", "stepper-value", "confirm-button", "confirm-text"
  ],
  confirmed: [
    "flow", "success-icon", "success-title", "success-copy", "success-copy-children"
  ],
  error: [
    "flow", "error-card", "error-title", "error-copy", "retry-button", "retry-text"
  ],
};

const RSVP_SCENARIO_DEFAULT_PART: Record<RsvpPreviewState, string> = {
  "children-question": "question-title",
  "form-no-children": "form-title",
  "form-children": "form-title",
  confirmed: "success-title",
  error: "error-title",
};

const ASSETS = [

  ["Monograma", "/brand/monograma-pl.png"], ["Floral esquerdo", "/florals/floral-top-left.webp"],

  ["Floral direito", "/florals/floral-top-right.webp"], ["Divisor floral", "/florals/floral-divider.webp"],

  ["Arranjo cozinha", "/florals/kitchen-arrangement.webp"]

] as const;

const FONTS = ["Cormorant Garamond","Inter","Georgia","Garamond","Baskerville","Palatino Linotype","Times New Roman","Arial","Verdana","Trebuchet MS","Courier New","Didot","Helvetica","Tahoma"];

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

const uid=()=>Math.random().toString(36).slice(2,9);

const deep=<T,>(v:T):T=>structuredClone(v);


function completeRsvpScenarios(
  config: InviteVisualConfig
): NonNullable<InviteVisualConfig["rsvpScenarios"]> {
  const normalized = normalizeInviteVisualConfig(deep(config));
  const scenarios = normalized.rsvpScenarios;

  // normalizeInviteVisualConfig guarantees the five RSVP scenarios at runtime.
  // The explicit guard also narrows the optional property for TypeScript.
  if (!scenarios) {
    throw new Error("Configuração RSVP inválida: cenários ausentes.");
  }

  return deep(scenarios);
}

function SlotPreview({ el }: { el: InviteElement }) {
  return (
    <div className={styles.slot}>
      <small>BLOCO FUNCIONAL</small>
      <strong>{el.name}</strong>
    </div>
  );
}


export function InviteVisualBuilder({initial,defaults,previewData}:{initial:InviteVisualConfig;defaults:InviteVisualConfig;previewData:InviteEditorPreviewData}){

  // The public invitation always renders the normalized visual config. The editor
  // must start from the exact same normalized object, otherwise a newly-added
  // default part (for example retry-button/error-card) can look like a raw browser
  // button in the editor while the public page receives the default visual style.
  const normalizedInitial=useMemo(()=>normalizeInviteVisualConfig(deep(initial)),[initial]);

  const [config,setConfig]=useState(()=>deep(normalizedInitial));
  const [screenId,setScreenId]=useState<InviteScreenId>("cover");
  const [editorPage,setEditorPage]=useState<EditorPageId>("cover");
  const [inviteFlowState,setInviteFlowState]=useState<InviteFlowState>("before");
  const [inviteSection,setInviteSection]=useState<"invite"|"gifts">("invite");
  const [unitMode,setUnitMode]=useState<"px"|"pct">("px");

  const [selectedId,setSelectedId]=useState<string|null>(normalizedInitial.screens.cover.elements[0]?.id||null); const [selectedPart,setSelectedPart]=useState<string|null>(null);
  const [rsvpPreviewState,setRsvpPreviewState]=useState<RsvpPreviewState>("children-question");
  const [layoutPanelOpen,setLayoutPanelOpen]=useState(false);
  const [layoutName,setLayoutName]=useState("");
  const [layoutBusy,setLayoutBusy]=useState(false);

  const [saving,setSaving]=useState(false);
  const [inspectorMode,setInspectorMode]=useState<"essential"|"pro"|"screen">("essential");
  const [status,setStatus]=useState("");
  const [zoom,setZoom]=useState(1);
  const [grid,setGrid]=useState(true);
  const [snap,setSnap]=useState(true);
  const [previewWidth,setPreviewWidth]=useState(430);

  // Professional measurement / grid tools
  const [gridPx,setGridPx]=useState(8);
  const [showRulers,setShowRulers]=useState(true);
  const [showGuides,setShowGuides]=useState(true);
  const [guides,setGuides]=useState<Array<{id:string;axis:"x"|"y";px:number;locked?:boolean}>>([]);
  const [guideDrag,setGuideDrag]=useState<string|null>(null);
  const [showColumns,setShowColumns]=useState(false);
  const [columnCount,setColumnCount]=useState(4);
  const [columnMargin,setColumnMargin]=useState(20);
  const [columnGutter,setColumnGutter]=useState(12);
  const [showSafeArea,setShowSafeArea]=useState(false);
  const [safeTop,setSafeTop]=useState(44);
  const [safeBottom,setSafeBottom]=useState(34);
  const [snapGrid,setSnapGrid]=useState(true);
  const [snapGuides,setSnapGuides]=useState(true);
  const [snapCenter,setSnapCenter]=useState(true);
  const [snapBounds,setSnapBounds]=useState(true);
  const [snapElements,setSnapElements]=useState(true);
  const [snapTolerance,setSnapTolerance]=useState(6);
  const [cursorPx,setCursorPx]=useState<{x:number;y:number}|null>(null);
  const [dragMetrics,setDragMetrics]=useState<{x:number;y:number;w:number;h:number;dx:number;dy:number}|null>(null);
  const [smartGuideLines,setSmartGuideLines]=useState<{x:number[];y:number[]}>({x:[],y:[]});

  const [history,setHistory]=useState<InviteVisualConfig[]>([]); const [future,setFuture]=useState<InviteVisualConfig[]>([]); const [styleClipboard,setStyleClipboard]=useState<any>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<any>(null);
  const suppressPartClickRef = useRef(false);
  const configRef = useRef(config);
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localDraftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const savePromiseRef = useRef<Promise<void> | null>(null);
  const saveAgainRef = useRef(false);
  const dirtyVersionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const mountedRef = useRef(true);
  const recoveredDraftRef = useRef(false);
  const LOCAL_DRAFT_KEY = "pl_invite_editor_unsaved_draft_v4";

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    // Keep editor/public parity when the server sends a fresher saved design.
    // Do not mark dirty: this is canonicalization, not a user edit.
    const next=normalizeInviteVisualConfig(deep(initial));
    configRef.current=next;
    setConfig(next);
  }, [initial]);


  useEffect(() => {
    if(typeof window==="undefined" || recoveredDraftRef.current)return;
    recoveredDraftRef.current=true;

    try{
      const raw=window.localStorage.getItem(LOCAL_DRAFT_KEY);
      if(!raw)return;

      const parsed=JSON.parse(raw);
      if(!parsed?.config || parsed.saved===true)return;

      const recovered=normalizeInviteVisualConfig(parsed.config as InviteVisualConfig);
      configRef.current=recovered;
      setConfig(recovered);
      dirtyVersionRef.current=Math.max(dirtyVersionRef.current,1);
      savedVersionRef.current=0;
      setStatus("Rascunho não salvo recuperado deste navegador · salvando...");
      scheduleIdleSave();
    }catch{
      // Ignore malformed/stale recovery data.
    }
  }, []);

  useEffect(() => {
    // React StrictMode mounts/cleans/remounts effects in development.
    // Reset the flag on every setup so saves never think the editor is unmounted.
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (autosaveIntervalRef.current) clearInterval(autosaveIntervalRef.current);
      if (idleSaveTimerRef.current) clearTimeout(idleSaveTimerRef.current);
      if (localDraftTimerRef.current) clearTimeout(localDraftTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if(!guideDrag) return;
    const move=(e:PointerEvent)=>{
      const point=canvasPointerPx(e);
      if(!point)return;
      const guide=guides.find(g=>g.id===guideDrag);
      if(!guide)return;
      updateGuide(guideDrag,guide.axis==="x"?point.x:point.y);
    };
    const up=()=>setGuideDrag(null);
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",up,{once:true});
    return()=>{
      window.removeEventListener("pointermove",move);
      window.removeEventListener("pointerup",up);
    };
  },[guideDrag,guides,screenId]);

  const screen=screenId==="rsvp"
    ? resolveRsvpScenarioScreen(config,rsvpPreviewState as RsvpScenarioId)
    : screenId==="invite"
      ? resolveInviteFlowScreen(config,inviteFlowState)
      : config.screens[screenId];

  const inviteRuntimeScreen = useMemo(() => {
    const base = resolveInviteFlowScreen(config,inviteFlowState);
    const after = inviteFlowState === "after";

    return {
      ...base,
      elements: base.elements
        .filter(element => {
          if (element.id === "invite-gifts") return false;
          if (after && element.id === "invite-rsvp") return false;
          return true;
        })
        .map(element => {
          if (!after && element.id === "invite-rsvp") {
            return { ...element, x: (100 - element.width) / 2 };
          }
          return element;
        }),
    };
  }, [config.screens.invite, config.inviteFlow?.afterInviteScreen, inviteFlowState]);

  const continuousBackground = config.inviteFlow?.continuousBackground === true;
  const continuousBackgroundSource =
    config.inviteFlow?.backgroundSource === "gifts" ? "gifts" : "invite";
  const sharedFlowBackgroundActive =
    editorPage === "invite-flow" &&
    inviteFlowState === "after" &&
    continuousBackground;
  const sharedBackgroundScreen =
    config.screens[continuousBackgroundSource];

  const displayScreen = screenId === "invite" ? inviteRuntimeScreen : screen;
  const layerElements = screenId === "invite" ? displayScreen.elements : screen.elements;

  const selected=useMemo(()=>screen.elements.find(e=>e.id===selectedId)||null,[screen,selectedId]);
  const activePart:InvitePartStyle=selectedPart
    ? (selected?.partStyles?.[selectedPart]||{})
    : {};

  // The public canvas can grow up to 430px. Preview the real viewport width,
  // while preserving the public screen aspect ratio (390 / minHeight).
  const CANVAS_W = previewWidth;
  const CANVAS_H = screen.minHeight * (previewWidth / 390);
  const pctToPxX = (v:number) => v / 100 * CANVAS_W;
  const pctToPxY = (v:number) => v / 100 * CANVAS_H;
  const pxToPctX = (v:number) => v / CANVAS_W * 100;
  const pxToPctY = (v:number) => v / CANVAS_H * 100;

  function addGuide(axis:"x"|"y",px?:number){
    const value = px ?? (axis==="x" ? CANVAS_W/2 : CANVAS_H/2);
    setGuides(g=>[...g,{id:`guide-${uid()}`,axis,px:Math.round(value)}]);
  }

  function updateGuide(id:string,px:number){
    setGuides(g=>g.map(x=>x.id===id?{...x,px:Math.round(px)}:x));
  }

  function removeGuide(id:string){
    setGuides(g=>g.filter(x=>x.id!==id));
  }

  function centerSelected(axis:"x"|"y"|"both"){
    if(!selected)return;
    const patch:any={};
    if(axis==="x"||axis==="both") patch.x=(100-selected.width)/2;
    if(axis==="y"||axis==="both") patch.y=(100-selected.height)/2;
    mutateElement(selected.id,patch);
  }

  function snapAxis(
    rawPx:number,
    sizePx:number,
    axis:"x"|"y",
    elId:string
  ){
    if(!snap) return {px:rawPx,lines:[] as number[]};

    const canvasSize=axis==="x"?CANVAS_W:CANVAS_H;
    const targets:number[]=[];

    if(snapGrid&&gridPx>0){
      targets.push(Math.round(rawPx/gridPx)*gridPx);
    }

    if(snapCenter){
      targets.push(canvasSize/2, canvasSize/2-sizePx/2);
    }

    if(snapBounds){
      targets.push(0,canvasSize-sizePx);
    }

    if(snapGuides){
      for(const g of guides.filter(g=>g.axis===axis)){
        targets.push(g.px, g.px-sizePx/2, g.px-sizePx);
      }
    }

    if(snapElements){
      for(const other of screen.elements){
        if(other.id===elId||!other.visible)continue;
        const pos=axis==="x"?pctToPxX(other.x):pctToPxY(other.y);
        const size=axis==="x"?pctToPxX(other.width):pctToPxY(other.height);
        const edge1=pos, center=pos+size/2, edge2=pos+size;
        targets.push(edge1,center,edge2,edge1-sizePx/2,center-sizePx/2,edge2-sizePx);
      }
    }

    let best=rawPx;
    let bestDist=Infinity;
    for(const t of targets){
      const d=Math.abs(t-rawPx);
      if(d<bestDist&&d<=snapTolerance){
        best=t;bestDist=d;
      }
    }

    const lines:number[]=[];
    if(bestDist!==Infinity){
      lines.push(best);
      lines.push(best+sizePx/2);
      lines.push(best+sizePx);
    }
    return {px:best,lines};
  }

  function canvasPointerPx(e:React.PointerEvent|PointerEvent){
    const rect=canvasRef.current?.getBoundingClientRect();
    if(!rect)return null;
    const x=(e.clientX-rect.left)/rect.width*CANVAS_W;
    const y=(e.clientY-rect.top)/rect.height*CANVAS_H;
    return {x:clamp(x,0,CANVAS_W),y:clamp(y,0,CANVAS_H)};
  }



  function persistLocalDraft(snapshot:InviteVisualConfig){
    if(typeof window==="undefined")return;
    try{
      window.localStorage.setItem(
        LOCAL_DRAFT_KEY,
        JSON.stringify({
          saved:false,
          createdAt:Date.now(),
          config:snapshot
        })
      );
    }catch{
      // Local backup is best-effort only; server persistence remains primary.
    }
  }

  function scheduleLocalDraft(){
    if(localDraftTimerRef.current) clearTimeout(localDraftTimerRef.current);
    localDraftTimerRef.current=setTimeout(()=>{
      persistLocalDraft(deep(configRef.current));
    },350);
  }

  function clearLocalDraft(){
    if(typeof window==="undefined")return;
    try{window.localStorage.removeItem(LOCAL_DRAFT_KEY)}catch{}
  }

  function scheduleIdleSave(){
    if(idleSaveTimerRef.current) clearTimeout(idleSaveTimerRef.current);
    idleSaveTimerRef.current=setTimeout(()=>{
      if(
        dirtyVersionRef.current!==savedVersionRef.current &&
        !saveInFlightRef.current
      ){
        void persistConfig(false);
      }
    },4_000);
  }

  function markDirty(){
    dirtyVersionRef.current+=1;
    setStatus("Alterações pendentes · salvando após alguns segundos");
    scheduleLocalDraft();
    scheduleIdleSave();
  }

  async function persistConfig(manual=false){
    // A manual click while autosave is already running must never be ignored.
    // Queue another save with the newest config after the current request finishes.
    if(saveInFlightRef.current){
      saveAgainRef.current=true;
      if(manual && mountedRef.current) setStatus("Salvamento em andamento · aguardando alterações mais recentes...");
      if(savePromiseRef.current) await savePromiseRef.current;
      if(
        manual &&
        dirtyVersionRef.current!==savedVersionRef.current &&
        !saveInFlightRef.current
      ){
        return persistConfig(true);
      }
      return;
    }

    if(!manual && dirtyVersionRef.current===savedVersionRef.current){
      return;
    }

    const version=dirtyVersionRef.current;
    const snapshot=deep(configRef.current);

    // Write browser recovery before network I/O.
    persistLocalDraft(snapshot);

    saveInFlightRef.current=true;
    if(mountedRef.current){
      setSaving(true);
      setStatus(manual ? "Salvando..." : "Salvando automaticamente...");
    }

    const request=(async()=>{
      try{
        const r=await fetch("/api/admin/invite-design",{
          method:"PUT",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({config:snapshot}),
          cache:"no-store"
        });
        const d=await r.json().catch(()=>({}));

        if(!r.ok) throw new Error(d.message||`Erro ao salvar (${r.status}).`);

        savedVersionRef.current=Math.max(savedVersionRef.current,version);

        if(
          d.config &&
          mountedRef.current &&
          dirtyVersionRef.current===version
        ){
          const canonical=deep(d.config as InviteVisualConfig);
          configRef.current=canonical;
          setConfig(canonical);
        }

        if(dirtyVersionRef.current===savedVersionRef.current){
          clearLocalDraft();
        }

        if(mountedRef.current){
          setStatus(
            dirtyVersionRef.current===savedVersionRef.current
              ? (manual ? "Salvo com sucesso." : "Salvo automaticamente.")
              : "Alterações novas aguardando salvamento..."
          );
        }
      }catch(error){
        // Keep the local draft. Reloading the editor will recover it.
        persistLocalDraft(deep(configRef.current));
        if(mountedRef.current){
          setStatus(
            error instanceof Error
              ? `Falha ao salvar: ${error.message} · rascunho protegido neste navegador`
              : "Falha ao salvar · rascunho protegido neste navegador"
          );
        }
      }finally{
        saveInFlightRef.current=false;
        savePromiseRef.current=null;
        if(mountedRef.current) setSaving(false);

        const shouldRunAgain=
          saveAgainRef.current ||
          dirtyVersionRef.current!==savedVersionRef.current;

        saveAgainRef.current=false;

        if(shouldRunAgain && mountedRef.current){
          scheduleIdleSave();
        }
      }
    })();

    savePromiseRef.current=request;
    await request;
  }


  function flushAutosave(){
    if(dirtyVersionRef.current!==savedVersionRef.current){
      if(saveInFlightRef.current) saveAgainRef.current=true;
      else void persistConfig(false);
    }
  }

  function commit(next:InviteVisualConfig,remember=true){
    if(remember){
      setHistory(h=>[...h.slice(-79),deep(configRef.current)]);
      setFuture([]);
    }
    configRef.current=next;
    setConfig(next);
    markDirty();
  }

  function undo(){
    if(!history.length)return;
    const previous=history[history.length-1];
    const current=deep(configRef.current);

    setHistory(items=>items.slice(0,-1));
    setFuture(items=>[current,...items].slice(0,50));

    const restored=deep(previous);
    configRef.current=restored;
    setConfig(restored);
    dirtyVersionRef.current+=1;
    setStatus("Alteração desfeita · salvando após alguns segundos");
  }

  function redo(){
    if(!future.length)return;
    const next=future[0];
    const current=deep(configRef.current);

    setFuture(items=>items.slice(1));
    setHistory(items=>[...items,current].slice(-50));

    const restored=deep(next);
    configRef.current=restored;
    setConfig(restored);
    dirtyVersionRef.current+=1;
    setStatus("Alteração refeita · salvando após alguns segundos");
  }

  function updateScreen(patch:any,remember=false){
    const current=configRef.current;

    if(screenId==="rsvp"){
      const scenarioId=rsvpPreviewState as RsvpScenarioId;
      const rsvpScenarios=completeRsvpScenarios(current);
      const currentScenario=rsvpScenarios[scenarioId];

      const {elements,deletedElementIds,id,name,...screenStylePatch}=patch||{};

      commit({
        ...current,
        rsvpScenarios:{
          ...rsvpScenarios,
          [scenarioId]:{
            ...currentScenario,
            ...(name!==undefined?{name}:{}),
            screenStyle:{
              ...(currentScenario.screenStyle||{}),
              ...screenStylePatch
            },
            ...(elements!==undefined?{elements}:{}),
            ...(deletedElementIds!==undefined?{deletedElementIds}:{})
          }
        }
      },remember);

      return;
    }

    if(
      screenId==="invite" &&
      editorPage==="invite-flow" &&
      inviteFlowState==="after"
    ){
      const currentAfter =
        current.inviteFlow?.afterInviteScreen ||
        structuredClone(current.screens.invite);

      commit({
        ...current,
        inviteFlow:{
          ...current.inviteFlow,
          continuousBackground: current.inviteFlow?.continuousBackground === true,
          backgroundSource: current.inviteFlow?.backgroundSource === "gifts" ? "gifts" : "invite",
          afterInviteScreen:{
            ...currentAfter,
            ...patch,
            id:"invite",
            name:"Convite após confirmação",
          },
        },
      },remember);
      return;
    }

    commit({
      ...current,
      screens:{
        ...current.screens,
        [screenId]:{
          ...current.screens[screenId],
          ...patch
        }
      }
    },remember);
  }

  function updateInviteFlow(patch:Partial<NonNullable<InviteVisualConfig["inviteFlow"]>>){
    const current=configRef.current;
    commit({
      ...current,
      inviteFlow:{
        continuousBackground: current.inviteFlow?.continuousBackground === true,
        backgroundSource: current.inviteFlow?.backgroundSource === "gifts" ? "gifts" : "invite",
        ...patch,
      },
    },true);
  }

  function updateBackgroundStyle(patch:Partial<InviteScreen>){
    if(sharedFlowBackgroundActive){
      const current=configRef.current;
      const sourceId=current.inviteFlow?.backgroundSource === "gifts" ? "gifts" : "invite";
      commit({
        ...current,
        screens:{
          ...current.screens,
          [sourceId]:{
            ...current.screens[sourceId],
            ...patch,
          },
        },
      },true);
      return;
    }

    updateScreen(patch,true);
  }

  function updateElement(id:string,patch:Partial<InviteElement>,remember=false){
    const cur=screenId==="rsvp"
      ? resolveRsvpScenarioScreen(configRef.current,rsvpPreviewState as RsvpScenarioId)
      : screenId==="invite"
        ? resolveInviteFlowScreen(configRef.current,inviteFlowState)
        : configRef.current.screens[screenId];
    updateScreen({elements:cur.elements.map(e=>e.id===id?{...e,...patch}:e)},remember);
  }

  function mutateElement(id:string,patch:Partial<InviteElement>){updateElement(id,patch,true)}

  function mutatePart(partId:string,patch:Partial<InvitePartStyle>){
    if(!selected)return;
    mutateElement(selected.id,{
      partStyles:{
        ...(selected.partStyles||{}),
        [partId]:{...(selected.partStyles?.[partId]||{}),...patch}
      }
    });
  }

  function partStyleFor(element:InviteElement,partId:string):InvitePartStyle{
    return element.partStyles?.[partId]||{};
  }

  function setPartVisible(element:InviteElement,partId:string,visible:boolean){
    updateElement(element.id,{
      partStyles:{
        ...(element.partStyles||{}),
        [partId]:{
          ...(element.partStyles?.[partId]||{}),
          visible
        }
      }
    },true);
    setSelectedId(element.id);
    setSelectedPart(partId);
    setStatus(visible
      ? "Parte restaurada somente nesta tela."
      : "Parte removida somente desta tela. Ela continua na árvore para restaurar.");
  }

  function setElementVisibleOnly(element:InviteElement,visible:boolean){
    mutateElement(element.id,{visible});
    setSelectedId(element.id);
    setSelectedPart(null);
    setStatus(visible
      ? "Elemento restaurado somente nesta tela."
      : "Elemento removido somente desta tela.");
  }

  function resetCurrentRsvpScenario(){
    if(screenId!=="rsvp")return;

    const scenarioId=rsvpPreviewState as RsvpScenarioId;
    const current=configRef.current;
    const rsvpScenarios=completeRsvpScenarios(current);
    const base=deep(current.screens.rsvp);

    commit({
      ...current,
      rsvpScenarios:{
        ...rsvpScenarios,
        [scenarioId]:{
          id:scenarioId,
          name:rsvpScenarios[scenarioId].name||scenarioId,
          screenStyle:{},
          deletedElementIds:[],
          elements:deep(base.elements)
        }
      }
    },true);

    setSelectedId(base.elements[0]?.id||null);
    setSelectedPart(null);
    setStatus("Somente este cenário foi restaurado.");
  }


  function switchScreen(id:InviteScreenId){
    setScreenId(id);
    setSelectedPart(null);

    const active=id==="rsvp"
      ? resolveRsvpScenarioScreen(configRef.current,rsvpPreviewState as RsvpScenarioId)
      : configRef.current.screens[id];

    const elements=active.elements;
    const target=id==="rsvp"
      ? elements.find(element=>element.slot==="rsvp-flow")?.id||elements[0]?.id
      : elements[0]?.id;

    setSelectedId(target||null);
  }

  function switchEditorPage(id:EditorPageId){
    setEditorPage(id);
    setSelectedPart(null);

    if(id==="cover"){ switchScreen("cover"); return; }
    if(id==="access"){ switchScreen("access"); return; }
    if(id==="rsvp"){ switchScreen("rsvp"); return; }

    setInviteSection("invite");
    switchScreen("invite");
  }

  function switchInviteSection(id:"invite"|"gifts"){
    setInviteSection(id);
    switchScreen(id);
  }

  function changeInviteFlowState(next:InviteFlowState){
    setInviteFlowState(next);

    if(next==="before" && inviteSection==="gifts"){
      setInviteSection("invite");
      switchScreen("invite");
      return;
    }

    if(screenId==="invite" && next==="after" && (selectedId==="invite-rsvp" || selectedId==="invite-gifts")){
      const fallback=configRef.current.screens.invite.elements.find(element=>
        element.id!=="invite-rsvp" && element.id!=="invite-gifts"
      );
      setSelectedId(fallback?.id||null);
    }

    setSelectedPart(null);
  }

  function openRsvpScenario(state:RsvpPreviewState){
    setEditorPage("rsvp");
    if(screenId!=="rsvp") setScreenId("rsvp");
    setRsvpPreviewState(state);

    const scenarioScreen=resolveRsvpScenarioScreen(
      configRef.current,
      state as RsvpScenarioId
    );

    const flow=scenarioScreen.elements.find(element=>element.slot==="rsvp-flow");
    setSelectedId(flow?.id||scenarioScreen.elements[0]?.id||null);
    setSelectedPart(null);
  }

  function selectInternalPart(element:InviteElement,partId:string){
    setSelectedId(element.id);
    setSelectedPart(partId);
  }

  function slotPartsForEditor(element:InviteElement){
    const all=SLOT_PARTS[element.slot!]||[];
    if(screenId!=="rsvp"||element.slot!=="rsvp-flow") return all;

    const allowed=new Set(RSVP_SCENARIO_PART_IDS[rsvpPreviewState]);
    return all.filter(part=>allowed.has(part.id));
  }

  function addElement(type:InviteElement["type"],src?:string,name?:string){
    const id=`${type}-${uid()}`;
    const base:any={
      id,
      name:name||`Novo ${type}`,
      type,
      x:25,
      y:42,
      width:50,
      height:type==="text"?8:12,
      opacity:1,
      rotate:0,
      scaleX:1,
      scaleY:1,
      zIndex:20,
      visible:true,
      locked:false
    };

    if(type==="text"){
      Object.assign(base,{
        text:"Novo texto",
        color:"#0f238d",
        fontSize:26,
        fontFamily:"Cormorant Garamond",
        fontWeight:400,
        textAlign:"center",
        lineHeight:1.06
      });
    }

    if(type==="image"){
      Object.assign(base,{
        src:src||"/florals/floral-divider.webp",
        objectFit:"contain",
        objectPositionX:50,
        objectPositionY:50,
        brightness:100,
        contrast:100,
        saturate:100,
        grayscale:0,
        blur:0,
        height:18
      });
    }

    if(type==="link"){
      Object.assign(base,{
        name:"Novo botão",
        text:"NOVO BOTÃO",
        href:"#",
        backgroundColor:"#0f238d",
        color:"#fff",
        borderRadius:999,
        fontSize:15,
        fontFamily:"Cormorant Garamond",
        fontWeight:600,
        textAlign:"center",
        letterSpacing:1.2,
        height:7
      });
    }

    if(type==="box"){
      Object.assign(base,{
        name:"Novo container",
        backgroundColor:"rgba(255,255,255,.5)",
        borderColor:"#c59b3a",
        borderWidth:1,
        borderRadius:16,
        height:18
      });
    }

    updateScreen({elements:[...screen.elements,base]},true);
    setSelectedId(id);
    setSelectedPart(null);
  }

  function extractScreenStyle(source: InviteScreen): InviteSavedLayout["screenStyle"] {
    return {
      backgroundColor: source.backgroundColor,
      minHeight: source.minHeight,
    };
  }

  function layoutElementsFromScreen(source: InviteScreen){
    return source.elements
      .filter(element=>element.type==="image")
      .map(element=>{
        const copy:any=deep(element);
        delete copy.styleBaseId;
        delete copy.styleOverrides;
        return copy as InviteElement;
      });
  }

  function createLayoutFromCurrent(){
    const name=layoutName.trim();
    if(!name){
      setStatus("Informe um nome para a decoração.");
      return;
    }

    setLayoutBusy(true);
    try{
      const id=`layout-${uid()}`;
      const now=new Date().toISOString();

      const layout:InviteSavedLayout={
        id,
        name,
        sourceScreenId:screenId,
        createdAt:now,
        updatedAt:now,
        decorationRevision:2,
        screenStyle:extractScreenStyle(screen),
        elements:layoutElementsFromScreen(screen),
      };

      commit({
        ...configRef.current,
        savedLayouts:{...(configRef.current.savedLayouts||{}),[id]:layout},
      },true);

      setLayoutName("");
      setLayoutPanelOpen(false);
      setStatus(`Decoração “${name}” salva.`);
    }finally{
      setLayoutBusy(false);
    }
  }

  function updateSavedLayout(layoutId:string){
    const existing=configRef.current.savedLayouts?.[layoutId];
    if(!existing)return;

    const updated:InviteSavedLayout={
      ...existing,
      sourceScreenId:screenId,
      updatedAt:new Date().toISOString(),
      decorationRevision:2,
      screenStyle:extractScreenStyle(screen),
      elements:layoutElementsFromScreen(screen),
    };

    commit({
      ...configRef.current,
      savedLayouts:{...(configRef.current.savedLayouts||{}),[layoutId]:updated},
    },true);

    setStatus(`Decoração “${existing.name}” atualizada.`);
  }

  function deleteSavedLayout(layoutId:string){
    const current=configRef.current;
    const existing=current.savedLayouts?.[layoutId];
    if(!existing)return;

    const next={...(current.savedLayouts||{})};
    delete next[layoutId];

    commit({...current,savedLayouts:next},true);
    setStatus(`Decoração “${existing.name}” excluída.`);
  }

  function applySavedLayout(layoutId:string){
    const layout=configRef.current.savedLayouts?.[layoutId];
    if(!layout)return;

    const currentScreen=screen;
    const preserved=currentScreen.elements.filter(element=>element.type!=="image");

    const defaultImageIds=defaults.screens[screenId].elements
      .filter(element=>element.type==="image")
      .map(element=>element.id);

    const imported=layout.elements.map(element=>{
      const copy:any=deep(element);
      copy.id=`decor-copy-${uid()}`;
      copy.name=element.name;
      delete copy.styleBaseId;
      delete copy.styleOverrides;
      return copy as InviteElement;
    });

    const deletedElementIds=[
      ...new Set([
        ...(currentScreen.deletedElementIds||[]),
        ...defaultImageIds,
      ])
    ];

    updateScreen({
      deletedElementIds,
      elements:[...preserved,...imported],
    },true);

    setSelectedId(imported[0]?.id||preserved[0]?.id||null);
    setSelectedPart(null);
    setStatus(`Decoração “${layout.name}” aplicada somente nesta tela.`);
  }

  function duplicate(){if(!selected)return;const id=`${selected.type}-${uid()}`,copy={...deep(selected),id,name:`${selected.name} cópia`,x:selected.x+3,y:selected.y+3,zIndex:selected.zIndex+1};updateScreen({elements:[...screen.elements,copy]},true);setSelectedId(id);setSelectedPart(null)}

  function remove(){
    if(!selected)return;

    const defaultScreen = defaults.screens[screenId];
    const isDefaultElement = defaultScreen.elements.some(element => element.id === selected.id);
    const deletedElementIds = new Set(((screen as any).deletedElementIds || []) as string[]);

    if(isDefaultElement) deletedElementIds.add(selected.id);

    updateScreen({
      elements: screen.elements.filter(element => element.id !== selected.id),
      deletedElementIds: [...deletedElementIds]
    }, true);

    setSelectedId(null);
    setSelectedPart(null);
  }

  function resetScreen(){
    if(!confirm(`Restaurar “${screen.name}”?`))return;

    if(screenId==="rsvp"){
      resetCurrentRsvpScenario();
      return;
    }

    const restored:any = deep(defaults.screens[screenId]);
    restored.deletedElementIds = [];

    if(
      screenId==="invite" &&
      editorPage==="invite-flow" &&
      inviteFlowState==="after"
    ){
      commit({
        ...configRef.current,
        inviteFlow:{
          ...configRef.current.inviteFlow,
          continuousBackground: configRef.current.inviteFlow?.continuousBackground === true,
          backgroundSource: configRef.current.inviteFlow?.backgroundSource === "gifts" ? "gifts" : "invite",
          afterInviteScreen:{
            ...restored,
            id:"invite",
            name:"Convite após confirmação",
          },
        },
      },true);
    }else{
      commit({...configRef.current,screens:{...configRef.current.screens,[screenId]:restored}},true);
    }

    setSelectedId(defaults.screens[screenId].elements[0]?.id||null);
    setSelectedPart(null);
  }

  function reorder(mode:"up"|"down"|"front"|"back"){if(!selected)return;const zs=screen.elements.map(e=>e.zIndex),min=Math.min(...zs),max=Math.max(...zs);mutateElement(selected.id,{zIndex:mode==="up"?selected.zIndex+1:mode==="down"?selected.zIndex-1:mode==="front"?max+1:min-1})}

  function copyStyle(){if(selectedPart&&selected){setStyleClipboard({kind:"part",value:deep(activePart)});setStatus("Estilo da parte copiado.");return}if(!selected)return;const {id,name,text,src,href,slot,x,y,width,height,zIndex,...rest}=selected;setStyleClipboard({kind:"element",value:deep(rest)});setStatus("Estilo copiado.")}

  function pasteStyle(){if(!selected||!styleClipboard)return;if(selectedPart&&styleClipboard.kind==="part")mutatePart(selectedPart,deep(styleClipboard.value));else if(!selectedPart&&styleClipboard.kind==="element")mutateElement(selected.id,deep(styleClipboard.value));else setStatus("Selecione o mesmo tipo de alvo para colar o estilo.")}



  async function optimizeImage(file:File){
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){
      throw new Error("Use uma imagem JPG, PNG ou WEBP.");
    }

    if(file.size>15*1024*1024){
      throw new Error("A imagem original deve ter no máximo 15 MB.");
    }

    const url=URL.createObjectURL(file);

    try{
      const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
        const img=new Image();
        img.onload=()=>resolve(img);
        img.onerror=()=>reject(new Error("Não foi possível abrir essa imagem."));
        img.src=url;
      });

      const max=2000;
      const scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));

      const context=canvas.getContext("2d");
      if(!context) throw new Error("Não foi possível processar a imagem.");
      context.drawImage(image,0,0,canvas.width,canvas.height);

      const qualities=[.82,.72,.62,.52];
      let blob:Blob|null=null;

      for(const quality of qualities){
        blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",quality));
        if(blob && blob.size<=3.5*1024*1024) break;
      }

      if(!blob) throw new Error("Não foi possível otimizar a imagem.");
      if(blob.size>4*1024*1024) throw new Error("A imagem ficou grande demais mesmo após otimização.");

      return new File([blob],`${file.name.replace(/\.[^.]+$/,"")||"imagem"}.webp`,{
        type:"image/webp"
      });
    }finally{
      URL.revokeObjectURL(url);
    }
  }

  async function uploadEditorImage(file:File){
    const optimized=await optimizeImage(file);
    const form=new FormData();
    form.set("image",optimized);

    const response=await fetch("/api/owner/invite-assets",{
      method:"POST",
      body:form
    });

    const data=await response.json().catch(()=>({}));
    if(!response.ok || !data.url){
      throw new Error(data.message||"Não foi possível enviar a imagem.");
    }

    return String(data.url);
  }

  async function pickImage(file:File|null,target:"element"|"part"|"screen"){
    if(!file)return;

    try{
      setStatus("Otimizando e enviando imagem...");
      const imageUrl=await uploadEditorImage(file);

      if(target==="screen"){
        updateBackgroundStyle({backgroundImage:imageUrl,useGradient:false});
      }else if(target==="part"&&selectedPart){
        mutatePart(selectedPart,{backgroundImage:imageUrl});
      }else if(selected){
        if(selected.type==="image"){
          mutateElement(selected.id,{src:imageUrl});
        }else{
          mutateElement(selected.id,{backgroundImage:imageUrl,useGradient:false});
        }
      }

      setStatus("Imagem enviada · alteração pendente para o próximo salvamento.");
    }catch(error){
      setStatus(error instanceof Error ? error.message : "Erro ao enviar imagem.");
    }
  }



  async function save(){
    if(idleSaveTimerRef.current){
      clearTimeout(idleSaveTimerRef.current);
      idleSaveTimerRef.current=null;
    }
    await persistConfig(true);
  }

  async function openPreview(){
    const href=`/gestao/editor/preview?page=${editorPage}&state=${inviteFlowState}&rsvp=${rsvpPreviewState}`;
    const previewWindow=window.open("about:blank","_blank");

    if(previewWindow){
      try{previewWindow.opener=null}catch{}
      previewWindow.document.title="Carregando preview...";
      previewWindow.document.body.innerHTML="<p style='font-family:Arial,sans-serif;padding:24px'>Salvando alterações e preparando preview...</p>";
    }

    if(idleSaveTimerRef.current){
      clearTimeout(idleSaveTimerRef.current);
      idleSaveTimerRef.current=null;
    }

    await persistConfig(true);

    if(dirtyVersionRef.current!==savedVersionRef.current){
      previewWindow?.close();
      setStatus("O preview não foi aberto porque ainda existem alterações sem salvar.");
      return;
    }

    if(previewWindow){
      previewWindow.location.replace(href);
    }else{
      window.open(href,"_blank","noopener,noreferrer");
    }
  }

  useEffect(()=>{
    // 30s maximum safety net. Normal edits save after 4s of inactivity.
    autosaveIntervalRef.current=setInterval(()=>{
      if(dirtyVersionRef.current!==savedVersionRef.current){
        if(saveInFlightRef.current) saveAgainRef.current=true;
        else void persistConfig(false);
      }
    },30_000);

    const onBeforeUnload=(event:BeforeUnloadEvent)=>{
      if(dirtyVersionRef.current!==savedVersionRef.current){
        // A 300KB+ visual document cannot be reliably sent during pagehide.
        // Block accidental refresh/close instead of pretending it was saved.
        persistLocalDraft(deep(configRef.current));
        event.preventDefault();
        event.returnValue="";
      }
    };

    window.addEventListener("beforeunload",onBeforeUnload);

    return()=>{
      if(autosaveIntervalRef.current){
        clearInterval(autosaveIntervalRef.current);
        autosaveIntervalRef.current=null;
      }
      if(idleSaveTimerRef.current){
        clearTimeout(idleSaveTimerRef.current);
        idleSaveTimerRef.current=null;
      }
      window.removeEventListener("beforeunload",onBeforeUnload);
    };
  },[]);


  function beginPointer(
    e: React.PointerEvent,
    el: InviteElement,
    mode: "move" | "resize"
  ) {
    e.stopPropagation();

    if (el.locked) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    suppressPartClickRef.current = false;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      mode,
      id: el.id,
      sx: e.clientX,
      sy: e.clientY,
      x: el.x,
      y: el.y,
      w: el.width,
      h: el.height,
      rect,
      moved: false,
      historyCaptured: false,
      before: deep(configRef.current)
    };

    setSelectedId(el.id);
    setSelectedPart(null);
  }

  const snapped = (n: number) =>
    snap ? Math.round(n * 1000) / 1000 : Math.round(n * 1000) / 1000;

  function movePointer(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;

    const pixelX = e.clientX - d.sx;
    const pixelY = e.clientY - d.sy;

    if (!d.moved && (Math.abs(pixelX) > 3 || Math.abs(pixelY) > 3)) {
      d.moved = true;
      suppressPartClickRef.current = true;

      if (!d.historyCaptured) {
        d.historyCaptured = true;
        setHistory(h => [...h.slice(-79), deep(d.before)]);
        setFuture([]);
      }
    }

    if (!d.moved) return;

    const dxPct = pixelX / d.rect.width * 100;
    const dyPct = pixelY / d.rect.height * 100;

    if (d.mode === "move") {
      const rawXPct=d.x+dxPct, rawYPct=d.y+dyPct;
      const rawXPx=pctToPxX(rawXPct), rawYPx=pctToPxY(rawYPct);
      const wPx=pctToPxX(d.w), hPx=pctToPxY(d.h);
      const sx=snapAxis(rawXPx,wPx,"x",d.id);
      const sy=snapAxis(rawYPx,hPx,"y",d.id);

      updateElement(d.id,{
        x:snapped(pxToPctX(sx.px)),
        y:snapped(pxToPctY(sy.px))
      });
      setSmartGuideLines({x:sx.lines,y:sy.lines});
      setDragMetrics({
        x:sx.px,y:sy.px,w:wPx,h:hPx,
        dx:sx.px-pctToPxX(d.x),dy:sy.px-pctToPxY(d.y)
      });
      return;
    }

    let widthPx=clamp(pctToPxX(d.w)+pixelX,4,CANVAS_W*1.7);
    let heightPx=clamp(pctToPxY(d.h)+pixelY,4,CANVAS_H*2);
    if(snap&&snapGrid&&gridPx>0){
      widthPx=Math.round(widthPx/gridPx)*gridPx;
      heightPx=Math.round(heightPx/gridPx)*gridPx;
    }

    updateElement(d.id,{
      width:snapped(pxToPctX(widthPx)),
      height:snapped(pxToPctY(heightPx))
    });
    setDragMetrics({
      x:pctToPxX(d.x),y:pctToPxY(d.y),w:widthPx,h:heightPx,
      dx:widthPx-pctToPxX(d.w),dy:heightPx-pctToPxY(d.h)
    });
  }

  const endPointer = () => {
    const wasDragging = !!dragRef.current?.moved;
    dragRef.current = null;
    setSmartGuideLines({x:[],y:[]});
    setDragMetrics(null);

    if (wasDragging) {
      window.setTimeout(() => {
        suppressPartClickRef.current = false;
      }, 0);
    }
  };

  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches("input,textarea,select"))return;const meta=e.ctrlKey||e.metaKey;if(meta&&e.key.toLowerCase()==="z"){e.preventDefault();e.shiftKey?redo():undo();return}if(meta&&e.key.toLowerCase()==="y"){e.preventDefault();redo();return}if(meta&&e.key.toLowerCase()==="d"){e.preventDefault();duplicate();return}if(e.key==="Delete"||e.key==="Backspace"){
        e.preventDefault();
        if(selectedPart&&screenId==="rsvp"&&selected?.slot==="rsvp-flow"){
          mutatePart(selectedPart,{visible:false});
          setStatus("Parte ocultada somente neste cenário.");
          return;
        }
        remove();
        return;
      }
      if(!selected||selected.locked)return;
      if(selectedPart && !e.altKey) return;
      const step=e.shiftKey?2.5:.25;if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();const patch:any={};if(e.key==="ArrowLeft")patch.x=selected.x-step;if(e.key==="ArrowRight")patch.x=selected.x+step;if(e.key==="ArrowUp")patch.y=selected.y-step;if(e.key==="ArrowDown")patch.y=selected.y+step;mutateElement(selected.id,patch)}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[selected,selectedPart,history,future]);



  const defaultSelected = selected
    ? defaults.screens[screenId].elements.find(element => element.id === selected.id) || null
    : null;

  const defaultPart: InvitePartStyle =
    selectedPart && defaultSelected?.partStyles?.[selectedPart]
      ? defaultSelected.partStyles[selectedPart]
      : {};

  const sameValue = (a: unknown, b: unknown) => {
    if (a === b) return true;
    if (a === undefined && b === undefined) return true;
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  function restoreElementProperty(key:keyof InviteElement){
    if(!selected)return;
    const next:any={...selected};
    const fallback:any=defaultSelected?.[key];

    if(fallback === undefined) delete next[key];
    else next[key]=deep(fallback);

    const {id,...patch}=next;
    mutateElement(selected.id,patch);
  }

  function restorePartProperty(key:keyof InvitePartStyle){
    if(!selected||!selectedPart)return;
    const next={...(selected.partStyles?.[selectedPart]||{})} as Record<string,unknown>;
    const fallback=(defaultPart as any)[key];
    if(fallback === undefined) delete next[key as string];
    else next[key as string]=deep(fallback);
    mutateElement(selected.id,{
      partStyles:{...(selected.partStyles||{}),[selectedPart]:next as InvitePartStyle}
    });
  }

  function clearPartProperty(key:keyof InvitePartStyle){
    if(!selected||!selectedPart)return;
    const current={...(selected.partStyles?.[selectedPart]||{})} as Record<string,unknown>;
    delete current[key as string];
    mutateElement(selected.id,{
      partStyles:{...(selected.partStyles||{}),[selectedPart]:current as InvitePartStyle}
    });
  }

  function restoreWholePart(){
    if(!selected||!selectedPart)return;
    const parts={...(selected.partStyles||{})};
    if(defaultSelected?.partStyles?.[selectedPart]){
      parts[selectedPart]=deep(defaultSelected.partStyles[selectedPart]);
    }else{
      delete parts[selectedPart];
    }
    mutateElement(selected.id,{partStyles:parts});
    setStatus("Parte restaurada somente neste cenário.");
  }

  function propertyState(value:unknown, fallback:unknown){
    if(value === "transparent" || value === "none") return "none";
    return sameValue(value,fallback) ? "inherit" : "custom";
  }

  const propertyShell=(
    label:string,
    state:"inherit"|"custom"|"none",
    onReset:()=>void,
    body:React.ReactNode,
    noneAction?:()=>void
  )=>(
    <div className={styles.propertyField}>
      <div className={styles.propertyHeader}>
        <span>{label}</span>
        <div className={styles.propertyActions}>
          {noneAction && state!=="none" ? (
            <button
              type="button"
              className={styles.propertyNoneButton}
              onClick={noneAction}
              title="Remover valor visual"
              aria-label={`Remover ${label}`}
            >
              <EyeOff size={11}/>
            </button>
          ) : null}
          {state!=="inherit" ? (
            <button
              type="button"
              className={styles.propertyResetButton}
              onClick={onReset}
              title="Restaurar valor padrão"
              aria-label={`Restaurar ${label}`}
            >
              <RotateCcw size={12}/>
            </button>
          ) : null}
        </div>
      </div>
      {body}
    </div>
  );

  const num=(label:string,key:keyof InviteElement,step=.1,min?:number,max?:number)=>{
    const value=selected?.[key] as number|undefined;
    const fallback=defaultSelected?.[key] as number|undefined;
    return propertyShell(
      label,
      propertyState(value,fallback),
      ()=>restoreElementProperty(key),
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        placeholder={fallback===undefined ? "Herdar" : String(fallback)}
        value={value===undefined ? "" : String(value)}
        onChange={e=>{
          if(!selected)return;
          if(e.target.value===""){
            restoreElementProperty(key);
            return;
          }
          mutateElement(selected.id,{[key]:Number(e.target.value)} as any);
        }}
      />
    );
  };

  const color=(label:string,key:keyof InviteElement,fallbackColor:string)=>{
    const value=selected?.[key] as string|undefined;
    const fallback=defaultSelected?.[key] as string|undefined;
    const state=propertyState(value,fallback);

    return propertyShell(
      label,
      state,
      ()=>restoreElementProperty(key),
      <div className={styles.colorField}>
        <input
          type="color"
          value={String(value||fallback||fallbackColor).startsWith("#") ? String(value||fallback||fallbackColor) : fallbackColor}
          onChange={e=>selected&&mutateElement(selected.id,{[key]:e.target.value} as any)}
        />
        <input
          placeholder={fallback===undefined ? "Herdar" : String(fallback)}
          value={value===undefined ? "" : String(value)}
          onChange={e=>{
            if(!selected)return;
            if(e.target.value===""){
              restoreElementProperty(key);
              return;
            }
            mutateElement(selected.id,{[key]:e.target.value} as any);
          }}
        />
      </div>,
      ()=>selected&&mutateElement(selected.id,{[key]:"transparent"} as any)
    );
  };

  const pNum=(label:string,key:keyof InvitePartStyle,step=.1,min?:number,max?:number)=>{
    const value=activePart[key] as number|undefined;
    const fallback=defaultPart[key] as number|undefined;

    return propertyShell(
      label,
      propertyState(value,fallback),
      ()=>restorePartProperty(key),
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        placeholder={fallback===undefined ? "Herdar" : String(fallback)}
        value={value===undefined ? "" : String(value)}
        onChange={e=>{
          if(!selectedPart)return;
          if(e.target.value===""){
            restorePartProperty(key);
            return;
          }
          mutatePart(selectedPart,{[key]:Number(e.target.value)} as any);
        }}
      />
    );
  };

  const pText=(label:string,key:keyof InvitePartStyle)=>{
    const value=activePart[key] as string|undefined;
    const fallback=defaultPart[key] as string|undefined;
    const isContent = key === "text";

    return propertyShell(
      label,
      propertyState(value,fallback),
      ()=>restorePartProperty(key),
      <input
        placeholder={!isContent && fallback!==undefined ? String(fallback) : !isContent ? "Herdar" : ""}
        value={value===undefined ? "" : String(value)}
        onChange={e=>{
          if(!selectedPart)return;
          if(!isContent && e.target.value===""){
            restorePartProperty(key);
            return;
          }
          mutatePart(selectedPart,{[key]:e.target.value} as any);
        }}
      />
    );
  };

  const pColor=(label:string,key:keyof InvitePartStyle,fallbackColor="#000000")=>{
    const value=activePart[key] as string|undefined;
    const fallback=defaultPart[key] as string|undefined;
    const state=propertyState(value,fallback);

    return propertyShell(
      label,
      state,
      ()=>restorePartProperty(key),
      <div className={styles.colorField}>
        <input
          type="color"
          value={String(value||fallback||fallbackColor).startsWith("#") ? String(value||fallback||fallbackColor) : fallbackColor}
          onChange={e=>selectedPart&&mutatePart(selectedPart,{[key]:e.target.value} as any)}
        />
        <input
          placeholder={fallback===undefined ? "Herdar" : String(fallback)}
          value={value===undefined ? "" : String(value)}
          onChange={e=>{
            if(!selectedPart)return;
            if(e.target.value===""){
              restorePartProperty(key);
              return;
            }
            mutatePart(selectedPart,{[key]:e.target.value} as any);
          }}
        />
      </div>,
      ()=>selectedPart&&mutatePart(selectedPart,{[key]:"transparent"} as any)
    );
  };

  const pSelect=<K extends keyof InvitePartStyle>(
    label:string,
    key:K,
    options:Array<{value:string;label:string}>
  )=>{
    const value=(activePart[key] as string|undefined);
    const fallback=(defaultPart[key] as string|undefined);

    return propertyShell(
      label,
      propertyState(value,fallback),
      ()=>restorePartProperty(key),
      <select
        value={value===undefined ? "" : value}
        onChange={e=>{
          if(!selectedPart)return;
          if(e.target.value===""){
            restorePartProperty(key);
            return;
          }
          mutatePart(selectedPart,{[key]:e.target.value} as any);
        }}
      >
        <option value="">Herdar{fallback ? ` (${fallback})` : ""}</option>
        {options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  };

  const pCss=(label:string,key:"customCss"|"hoverCss"|"focusCss"|"activeCss",rows=4,placeholder="")=>{
    const value=activePart[key];
    const fallback=defaultPart[key];

    return propertyShell(
      label,
      propertyState(value,fallback),
      ()=>restorePartProperty(key),
      <textarea
        rows={rows}
        placeholder={placeholder || (fallback ? String(fallback) : "Herdar / sem CSS")}
        value={value===undefined ? "" : value}
        onChange={e=>{
          if(!selectedPart)return;
          if(e.target.value===""){
            restorePartProperty(key);
            return;
          }
          mutatePart(selectedPart,{[key]:e.target.value});
        }}
      />
    );
  };



  const rulerX=Array.from({length:Math.floor(CANVAS_W/10)+1},(_,i)=>i*10);
  const rulerY=Array.from({length:Math.floor(CANVAS_H/10)+1},(_,i)=>i*10);
  const selectedPx=selected?{
    x:pctToPxX(selected.x),
    y:pctToPxY(selected.y),
    w:pctToPxX(selected.width),
    h:pctToPxY(selected.height)
  }:null;
  const canvasGridStyle:React.CSSProperties = {};

  const selectPart = (elementId:string, partId:string) => {
    if (suppressPartClickRef.current) return;
    setSelectedId(elementId);
    setSelectedPart(partId);
  };

  const editorSlots: Record<string, React.ReactNode> = {};
  for (const element of screen.elements) {
    if (element.type !== "slot" || !element.slot) continue;

    if (element.slot === "access-form") {
      editorSlots[element.slot] = (
        <AccessFormView
          key={element.id}
          parts={element.partStyles}
          name=""
          code=""
          preview
          selectedPart={selectedId===element.id ? selectedPart : null}
          onPartSelect={partId=>selectPart(element.id,partId)}
        />
      );
      continue;
    }

    if (element.slot === "rsvp-flow") {
      editorSlots[element.slot] = (
        <RsvpFlowView
          key={element.id}
          parts={element.partStyles}
          preview
          previewState={rsvpPreviewState}
          selectedPart={selectedId===element.id ? selectedPart : null}
          onPartSelect={partId=>selectPart(element.id,partId)}
        />
      );
      continue;
    }

    if (element.slot === "rsvp-controls") {
      editorSlots[element.slot] = (
        <RsvpControlsView
          key={element.id}
          parts={element.partStyles}
          preview
          selectedPart={selectedId===element.id ? selectedPart : null}
          onPartSelect={partId=>selectPart(element.id,partId)}
        />
      );
      continue;
    }

    if (element.slot === "rsvp-status") {
      editorSlots[element.slot] = (
        <RsvpStatusView
          key={element.id}
          parts={element.partStyles}
          preview
          selectedPart={selectedId===element.id ? selectedPart : null}
          onPartSelect={partId=>selectPart(element.id,partId)}
        />
      );
      continue;
    }

    if (element.slot === "gift-grid") {
      editorSlots[element.slot] = previewData.gifts.length ? (
        <GiftGridView
          key={element.id}
          parts={element.partStyles}
          preview
          selectedPart={selectedId===element.id ? selectedPart : null}
          onSelectPart={partId=>selectPart(element.id,partId)}
        >
          {previewData.gifts.map(gift=>(
            <GiftCard
              key={gift.id}
              gift={gift}
              preview
              preferredColors={[
                {name:"Azul-marinho",hex:"#12308e"},
                {name:"Dourado suave",hex:"#c69a3a"},
                {name:"Branco",hex:"#f8f6ef"}
              ]}
              parts={element.partStyles}
              selectedPart={selectedId===element.id ? selectedPart : null}
              onSelectPart={partId=>selectPart(element.id,partId)}
            />
          ))}
        </GiftGridView>
      ) : (
        <div key={element.id} className="guest-state-card">
          <h2>A lista ainda está sendo preparada.</h2>
          <p>Volte em breve para conferir as sugestões.</p>
        </div>
      );
      continue;
    }

    if (element.slot === "gift-note") {
      editorSlots[element.slot] = (
        <GiftNoteView
          key={element.id}
          parts={element.partStyles}
          preview
          selectedPart={selectedId===element.id ? selectedPart : null}
          onSelectPart={partId=>selectPart(element.id,partId)}
        />
      );
      continue;
    }

    if (element.slot === "countdown") {
      editorSlots[element.slot] = (
        <CountdownView
          key={element.id}
          target={previewData.vars.event_datetime || "2026-11-22T16:00:00-03:00"}
          parts={element.partStyles}
        />
      );
      continue;
    }

    editorSlots[element.slot] = (
      <SlotPreview key={element.id} el={element} />
    );
  }

  const passiveInviteSlots: Record<string, React.ReactNode> = {};
  const passiveInviteCountdown = inviteRuntimeScreen.elements.find(element => element.slot === "countdown");
  if (passiveInviteCountdown) {
    passiveInviteSlots.countdown = (
      <CountdownView
        key="passive-invite-countdown"
        target={previewData.vars.event_datetime || "2026-11-22T16:00:00-03:00"}
        parts={passiveInviteCountdown.partStyles}
      />
    );
  }

  const giftsPreviewScreen = config.screens.gifts;
  const passiveGiftSlots: Record<string, React.ReactNode> = {};
  const passiveGiftGrid = giftsPreviewScreen.elements.find(element => element.slot === "gift-grid");
  const passiveGiftNote = giftsPreviewScreen.elements.find(element => element.slot === "gift-note");

  if (passiveGiftGrid) {
    passiveGiftSlots["gift-grid"] = previewData.gifts.length ? (
      <GiftGridView key="passive-gift-grid" parts={passiveGiftGrid.partStyles} preview>
        {previewData.gifts.map(gift => (
          <GiftCard key={gift.id} gift={gift} preview parts={passiveGiftGrid.partStyles} />
        ))}
      </GiftGridView>
    ) : (
      <div className="guest-state-card">
        <h2>A lista ainda está sendo preparada.</h2>
        <p>Volte em breve para conferir as sugestões.</p>
      </div>
    );
  }

  if (passiveGiftNote) {
    passiveGiftSlots["gift-note"] = (
      <GiftNoteView key="passive-gift-note" parts={passiveGiftNote.partStyles} preview />
    );
  }

  return <div className={styles.builder}>

    <header className={styles.topbar}><div className={styles.brand}><strong>Editor do convite</strong><span>Mobile-first · preview real do convidado</span></div><div className={styles.toolbar}>

      <button onClick={undo} disabled={!history.length} title="Desfazer"><Undo2 size={16}/></button>
      <button onClick={redo} disabled={!future.length} title="Refazer"><Redo2 size={16}/></button>
      <span className={styles.sep}/>
      <label className={styles.viewportSelect}>Mobile <select value={previewWidth} onChange={e=>setPreviewWidth(Number(e.target.value))}><option value={360}>360</option><option value={390}>390</option><option value={393}>393</option><option value={414}>414</option><option value={430}>430</option></select></label>
      <span className={styles.sep}/>
      <button onClick={()=>setGrid(v=>!v)} className={grid?styles.on:""} title="Grid"><Grid3X3 size={16}/></button>
      <button onClick={()=>setSnap(v=>!v)} className={snap?styles.on:""}>Snap</button>
      <span className={styles.sep}/>
      <button onClick={()=>setZoom(z=>clamp(z-.1,.45,1.6))}><ZoomOut size={16}/></button>
      <span className={styles.zoom}>{Math.round(zoom*100)}%</span>
      <button onClick={()=>setZoom(z=>clamp(z+.1,.45,1.6))}><ZoomIn size={16}/></button>
      <span className={styles.sep}/>
      <button type="button" className={styles.previewLink} onClick={openPreview} disabled={saving}><ExternalLink size={15}/> Preview</button>
      <button onClick={resetScreen}><RotateCcw size={16}/> Restaurar seção</button>
      <button className={styles.save} onClick={save} disabled={saving}><Save size={16}/>{saving?"Salvando...":"Salvar"}</button>

    </div></header>{status&&<div className={styles.status}>{status}</div>}

    <div className={styles.workspace}>

      <aside className={styles.leftbar}>
        <div className={styles.leftHeading}>Páginas</div>
        <div className={styles.screenTabs}>
          {EDITOR_PAGES.map(page=><button key={page.id} className={editorPage===page.id?styles.active:""} onClick={()=>switchEditorPage(page.id)}>{page.label}</button>)}
        </div>

        {editorPage==="invite-flow"&&(
          <section className={styles.flowNavigator}>
            <div className={styles.flowStateSwitch}>
              <button type="button" className={inviteFlowState==="before"?styles.flowStateActive:""} onClick={()=>changeInviteFlowState("before")}>Antes da confirmação</button>
              <button type="button" className={inviteFlowState==="after"?styles.flowStateActive:""} onClick={()=>changeInviteFlowState("after")}>Após confirmação</button>
            </div>

            {inviteFlowState==="after"&&(
              <div className={styles.flowBackgroundControl}>
                <label>
                  <input
                    type="checkbox"
                    checked={continuousBackground}
                    onChange={e=>updateInviteFlow({continuousBackground:e.target.checked})}
                  />
                  <span><strong>Fundo contínuo</strong><small>Une Convite + Presentes sem reiniciar o fundo na emenda.</small></span>
                </label>

                {continuousBackground&&(
                  <label className={styles.flowBackgroundSource}>
                    Fundo-base
                    <select
                      value={continuousBackgroundSource}
                      onChange={e=>updateInviteFlow({backgroundSource:e.target.value as "invite"|"gifts"})}
                    >
                      <option value="invite">Convite</option>
                      <option value="gifts">Lista de presentes</option>
                    </select>
                  </label>
                )}
              </div>
            )}

            <div className={styles.leftHeading}>Seções</div>
            <div className={styles.sectionNavigator}>
              <button type="button" className={inviteSection==="invite"?styles.sectionActive:""} onClick={()=>switchInviteSection("invite")}>
                <span>1</span><div><strong>Convite</strong><small>{inviteFlowState==="after"?"Sem botões de ação":"Com confirmar presença"}</small></div>
              </button>
              {inviteFlowState==="after"&&<button type="button" className={inviteSection==="gifts"?styles.sectionActive:""} onClick={()=>switchInviteSection("gifts")}>
                <span>2</span><div><strong>Lista de presentes</strong><small>Segunda seção no scroll</small></div>
              </button>}
            </div>
          </section>
        )}

        {screenId==="rsvp"&&<section className={styles.rsvpScenarios}>
          <div className={styles.rsvpScenariosHeader}><strong>Cenários da confirmação</strong><span>5 estados</span></div>
          <p>Cada etapa é uma tela independente. Texto, posição, imagens, botões e exclusões ficam somente nela.</p>
          <div className={styles.rsvpScenarioGrid}>{RSVP_PREVIEW_STATES.map(item=><button key={item.id} type="button" className={rsvpPreviewState===item.id?styles.rsvpScenarioActive:""} onClick={()=>openRsvpScenario(item.id)}>{item.label}</button>)}</div>
          <button type="button" className={styles.rsvpScenarioReset} onClick={resetCurrentRsvpScenario}>
            Restaurar somente este cenário
          </button>
        </section>}

        <details className={styles.utilityDrawer}>
          <summary><ImagePlus size={14}/> Biblioteca e decorações <ChevronDown size={14}/></summary>
          <section className={styles.layoutLibrary}>
          <div className={styles.layoutLibraryHeader}>
            <div>
              <strong>Decorações salvas</strong>
              <span>Reaplique flores, logomarca e imagens decorativas</span>
            </div>
            <button type="button" onClick={()=>setLayoutPanelOpen(v=>!v)}>
              {layoutPanelOpen?"Fechar":"+ Salvar decoração"}
            </button>
          </div>

          {layoutPanelOpen&&<div className={styles.layoutSaveForm}>
            <input
              value={layoutName}
              onChange={e=>setLayoutName(e.target.value)}
              placeholder="Ex.: Floral azul"
              maxLength={80}
            />
            <button type="button" onClick={createLayoutFromCurrent} disabled={layoutBusy}>
              {layoutBusy?"Salvando...":"Salvar decoração"}
            </button>
            <small>Salva somente imagens decorativas posicionadas. Background, textos, botões, formulários e dados da tela não são salvos.</small>
          </div>}

          {Object.keys(config.savedLayouts||{}).length===0
            ? <p className={styles.layoutEmpty}>Nenhuma decoração salva ainda.</p>
            : <div className={styles.layoutList}>
                {Object.values(config.savedLayouts||{}).map(layout=><article key={layout.id}>
                  <div>
                    <strong>{layout.name}</strong>
                    <span>Base: {config.screens[layout.sourceScreenId]?.name||layout.sourceScreenId}</span>
                  </div>
                  <div className={styles.layoutActions}>
                    <button type="button" className={styles.layoutApply} onClick={()=>applySavedLayout(layout.id)}>Aplicar nesta tela</button>
                    <button type="button" onClick={()=>updateSavedLayout(layout.id)}>Atualizar</button>
                    <button type="button" className={styles.layoutDelete} onClick={()=>deleteSavedLayout(layout.id)}>Excluir</button>
                  </div>
                </article>)}
              </div>}
          </section>
          <div className={styles.assetTitle}>Identidade visual</div>
          <div className={styles.assets}>{ASSETS.map(([name,src])=><button key={src} onClick={()=>addElement("image",src,name)}><img src={src} alt=""/><span>{name}</span></button>)}</div>
        </details>

        <div className={styles.layersHeader}>
          <div className={styles.sectionTitle}><Layers3 size={15}/> Camadas <span>{layerElements.length}</span></div>
          <details className={styles.addMenu}>
            <summary><Plus size={14}/> Adicionar</summary>
            <div className={styles.addGrid}><button onClick={()=>addElement("text")}><Type size={14}/> Texto</button><button onClick={()=>addElement("image")}><ImagePlus size={14}/> Imagem</button><button onClick={()=>addElement("link")}><Link2 size={14}/> Botão</button><button onClick={()=>addElement("box")}><Box size={14}/> Container</button></div>
          </details>
        </div>


        <div className={styles.layers}>
          {[...layerElements].sort((a,b)=>b.zIndex-a.zIndex).map(el=>{
            const hidden=el.visible===false;
            return <div key={el.id}>
              <div className={`${styles.layer} ${selectedId===el.id&&!selectedPart?styles.layerActive:""} ${hidden?styles.layerHidden:""}`} onClick={()=>{setSelectedId(el.id);setSelectedPart(null)}}>
                <span className={styles.kind}>{el.type==="text"?<Type size={13}/>:el.type==="image"?<ImagePlus size={13}/>:el.type==="link"?<Link2 size={13}/>:<Layers3 size={13}/>}</span>
                <b>{el.name}</b>
                {hidden?<small className={styles.removedTag}>removido</small>:null}
                <button title={el.locked?"Desbloquear":"Bloquear"} onClick={ev=>{ev.stopPropagation();mutateElement(el.id,{locked:!el.locked})}}>{el.locked?<Lock size={13}/>:<Unlock size={13}/>}</button>
                <button title={hidden?"Mostrar nesta tela":"Ocultar nesta tela"} onClick={ev=>{ev.stopPropagation();setElementVisibleOnly(el,hidden)}}>{hidden?<EyeOff size={13}/>:<Eye size={13}/>}</button>
                <button title="Remover somente desta tela" className={styles.layerDelete} disabled={hidden} onClick={ev=>{ev.stopPropagation();setElementVisibleOnly(el,false)}}><Trash2 size={13}/></button>
              </div>

              {selectedId===el.id&&el.type==="slot"&&el.slot&&
                <div className={styles.partsTree}>
                  {slotPartsForEditor(el).map(part=>{
                    const partHidden=partStyleFor(el,part.id).visible===false;
                    return <div key={part.id} className={`${styles.partTreeRow} ${selectedPart===part.id?styles.partTreeRowActive:""} ${partHidden?styles.partTreeRowHidden:""}`}>
                      <button type="button" className={styles.partTreeSelect} onClick={()=>selectInternalPart(el,part.id)}>
                        <span>↳</span><b>{part.name}</b>{partHidden?<small>removido</small>:null}
                      </button>
                      <button type="button" className={styles.partTreeIcon} title={partHidden?"Mostrar nesta tela":"Ocultar nesta tela"} onClick={ev=>{ev.stopPropagation();setPartVisible(el,part.id,partHidden)}}>{partHidden?<EyeOff size={12}/>:<Eye size={12}/>}</button>
                      <button type="button" className={`${styles.partTreeIcon} ${styles.partTreeDelete}`} disabled={partHidden} title="Remover somente desta tela" onClick={ev=>{ev.stopPropagation();setPartVisible(el,part.id,false)}}><Trash2 size={12}/></button>
                    </div>
                  })}
                </div>
              }
            </div>
          })}
        </div>

      </aside>

      <main className={styles.stage} onPointerMove={movePointer} onPointerUp={endPointer} onPointerCancel={endPointer}>
        {editorPage==="invite-flow"&&inviteFlowState==="after"&&screenId==="gifts"&&(
          <section className={styles.compositeSection}>
            <button type="button" className={styles.compositeSectionLabel} onClick={()=>switchInviteSection("invite")}>
              <span>Seção 1</span><strong>Convite</strong><small>Clique para editar</small>
            </button>
            <div className={styles.passiveCanvas} style={{width:CANVAS_W}}>
              <InviteCanvas screen={inviteRuntimeScreen} vars={previewData.vars} slots={passiveInviteSlots} className="editor-live-invite"/>
            </div>
          </section>
        )}

        {editorPage==="invite-flow"&&(
          <div className={styles.activeSectionBanner}>
            <span>{screenId==="gifts"?"Seção 2":"Seção 1"}</span>
            <strong>{screenId==="gifts"?"Lista de presentes":"Convite"}</strong>
            <small>Editando agora</small>
          </div>
        )}

        <div className={styles.deviceLabel}>
          {CANVAS_W}px · {screenId==="gifts"?"Lista de presentes":screen.name}
        </div>

        <div className={styles.measurementShell}>
          {showRulers&&<>
            <div className={styles.rulerCorner}/>
            <div className={styles.rulerX} style={{width:CANVAS_W*zoom}}>
              {rulerX.map(px=><span key={px} className={px%50===0?styles.rulerMajor:styles.rulerMinor} style={{left:`${px/CANVAS_W*100}%`}}>{px%50===0?<b>{px}</b>:null}</span>)}
              {cursorPx?<i className={styles.rulerCursorX} style={{left:`${cursorPx.x/CANVAS_W*100}%`}}/>:null}
            </div>
            <div className={styles.rulerY} style={{height:CANVAS_H*zoom}}>
              {rulerY.map(px=><span key={px} className={px%50===0?styles.rulerMajor:styles.rulerMinor} style={{top:`${px/CANVAS_H*100}%`}}>{px%50===0?<b>{px}</b>:null}</span>)}
              {cursorPx?<i className={styles.rulerCursorY} style={{top:`${cursorPx.y/CANVAS_H*100}%`}}/>:null}
            </div>
          </>}

          <div className={styles.zoomWrap} style={{width:CANVAS_W,transform:`scale(${zoom})`,transformOrigin:"top left",marginBottom:`${(zoom-1)*CANVAS_H}px`}}>
            <div
              ref={canvasRef}
              data-builder-screen={displayScreen.id}
              className={styles.canvas}
              style={{...canvasGridStyle,width:CANVAS_W,aspectRatio:`390 / ${displayScreen.minHeight}`}}
              onPointerMove={e=>{const point=canvasPointerPx(e);if(point)setCursorPx(point)}}
              onPointerLeave={()=>setCursorPx(null)}
              onPointerDown={()=>{setSelectedId(null);setSelectedPart(null)}}
            >
              <div className={styles.liveRenderer}>
                <InviteCanvas
                  screen={displayScreen}
                  vars={previewData.vars}
                  slots={editorSlots}
                  className="editor-live-invite"
                  getElementProps={el=>({
                    "data-builder-id": el.id,
                    onPointerDown: (event: React.PointerEvent<HTMLElement>) => beginPointer(event, el, "move"),
                    onClick: (event: React.MouseEvent<HTMLElement>) => {
                      if(el.type==="link"){
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedId(el.id);
                        setSelectedPart(null);
                      }
                    },
                  })}
                  renderElementAdornment={el=>
                    selectedId===el.id&&!selectedPart
                      ? <>
                          <span
                            className={`${styles.selectionFrame} ${el.locked ? styles.selectionFrameLocked : ""}`}
                            aria-hidden
                          />
                          {!el.locked ? (
                            <button
                              type="button"
                              className={styles.resize}
                              onPointerDown={event=>beginPointer(event,el,"resize")}
                            />
                          ) : null}
                        </>
                      : null
                  }
                />
              </div>

              <div className={styles.precisionGridOverlay} style={{display:grid?"block":"none",backgroundSize:`${gridPx}px ${gridPx}px`}}/>

              {showColumns?<div className={styles.columnGridOverlay}>
                {Array.from({length:columnCount},(_,i)=>{
                  const available=CANVAS_W-(columnMargin*2)-((columnCount-1)*columnGutter);
                  const col=Math.max(1,available/columnCount);
                  const left=columnMargin+i*(col+columnGutter);
                  return <span key={i} style={{left:`${left/CANVAS_W*100}%`,width:`${col/CANVAS_W*100}%`}}/>;
                })}
              </div>:null}

              {showSafeArea?<div className={styles.safeAreaOverlay}>
                <span className={styles.safeTop} style={{height:`${safeTop/CANVAS_H*100}%`}}/>
                <span className={styles.safeBottom} style={{height:`${safeBottom/CANVAS_H*100}%`}}/>
                <b>safe area</b>
              </div>:null}

              {showGuides&&guides.map(g=>
                <button
                  key={g.id}
                  type="button"
                  className={`${styles.manualGuide} ${g.axis==="x"?styles.manualGuideX:styles.manualGuideY}`}
                  style={g.axis==="x"?{left:`${g.px/CANVAS_W*100}%`}:{top:`${g.px/CANVAS_H*100}%`}}
                  onPointerDown={e=>{e.stopPropagation();if(!g.locked)setGuideDrag(g.id)}}
                  onDoubleClick={e=>{e.stopPropagation();removeGuide(g.id)}}
                  title={`${g.axis==="x"?"Vertical":"Horizontal"} ${g.px}px • duplo clique remove`}
                />
              )}

              {smartGuideLines.x.map((px,i)=><span key={`sx-${i}-${px}`} className={`${styles.smartGuide} ${styles.smartGuideX}`} style={{left:`${px/CANVAS_W*100}%`}}/>)}
              {smartGuideLines.y.map((px,i)=><span key={`sy-${i}-${px}`} className={`${styles.smartGuide} ${styles.smartGuideY}`} style={{top:`${px/CANVAS_H*100}%`}}/>)}

              {dragMetrics?<div className={styles.dragMetrics} style={{left:`${clamp((dragMetrics.x+dragMetrics.w/2)/CANVAS_W*100,4,96)}%`,top:`${clamp((dragMetrics.y-8)/CANVAS_H*100,2,96)}%`}}>
                X {dragMetrics.x.toFixed(1)} • Y {dragMetrics.y.toFixed(1)}<br/>
                W {dragMetrics.w.toFixed(1)} • H {dragMetrics.h.toFixed(1)} px
              </div>:null}
            </div>
          </div>
        </div>

        {editorPage==="invite-flow"&&inviteFlowState==="after"&&screenId==="invite"&&(
          <section className={styles.compositeSection}>
            <button type="button" className={styles.compositeSectionLabel} onClick={()=>switchInviteSection("gifts")}>
              <span>Seção 2</span><strong>Lista de presentes</strong><small>Clique para editar</small>
            </button>
            <div className={styles.passiveCanvas} style={{width:CANVAS_W}}>
              <InviteCanvas screen={giftsPreviewScreen} vars={previewData.vars} slots={passiveGiftSlots} className="editor-live-invite"/>
            </div>
          </section>
        )}

        {sharedFlowBackgroundActive&&(
          <section className={styles.continuousPreview}>
            <div className={styles.continuousPreviewHeader}>
              <div>
                <strong>Prévia do encaixe contínuo</strong>
                <span>Mostra exatamente como o fundo atravessa Convite + Presentes.</span>
              </div>
              <small>Somente visualização</small>
            </div>
            <div className={styles.continuousPreviewCanvas} style={{width:CANVAS_W}}>
              <InviteContinuousFlow
                backgroundScreen={sharedBackgroundScreen}
                sections={[
                  {
                    key:"invite-flow-preview",
                    screen:inviteRuntimeScreen,
                    vars:previewData.vars,
                    slots:passiveInviteSlots,
                  },
                  {
                    key:"gifts-flow-preview",
                    screen:giftsPreviewScreen,
                    vars:previewData.vars,
                    slots:passiveGiftSlots,
                  },
                ]}
              />
            </div>
          </section>
        )}

        <div className={styles.stageStatusBar}>
          <span>{CANVAS_W}×{CANVAS_H}</span>
          <span>Zoom {Math.round(zoom*100)}%</span>
          <span>Grid {grid?`${gridPx}px`:"off"}</span>
          <span>Snap {snap?"on":"off"}</span>
          {cursorPx?<span>Cursor X {cursorPx.x.toFixed(1)} Y {cursorPx.y.toFixed(1)}</span>:null}
          {selectedPx?<span>Sel X {selectedPx.x.toFixed(1)} Y {selectedPx.y.toFixed(1)} W {selectedPx.w.toFixed(1)} H {selectedPx.h.toFixed(1)}</span>:null}
        </div>
      </main>

      <aside className={styles.inspector}>
        <div className={styles.inspectorHeader}>
          <div className={styles.sectionTitle}>
            <SlidersHorizontal size={15}/>
            {selectedPart ? "Parte interna" : selected ? "Elemento" : "Editor"}
          </div>

          <div className={styles.inspectorTabs}>
            <button
              className={inspectorMode==="essential" ? styles.inspectorTabActive : ""}
              onClick={()=>setInspectorMode("essential")}
            >
              Editar
            </button>
            <button
              className={inspectorMode==="pro" ? styles.inspectorTabActive : ""}
              onClick={()=>setInspectorMode("pro")}
            >
              Avançado
            </button>
            <button
              className={inspectorMode==="screen" ? styles.inspectorTabActive : ""}
              onClick={()=>setInspectorMode("screen")}
            >
              Seção
            </button>
          </div>
        </div>

        {selected&&!selectedPart&&inspectorMode!=="screen" ? (
          <div className={styles.elementQuickActions}>
            <button type="button" onClick={()=>setElementVisibleOnly(selected,selected.visible===false)}>
              {selected.visible===false?<EyeOff size={13}/>:<Eye size={13}/>}
              {selected.visible===false?"Mostrar nesta tela":"Ocultar nesta tela"}
            </button>
            <button type="button" onClick={duplicate}><Copy size={13}/> Duplicar</button>
            <button type="button" className={styles.elementRemoveAction} disabled={selected.visible===false} onClick={()=>setElementVisibleOnly(selected,false)}>
              <Trash2 size={13}/> Remover desta tela
            </button>
          </div>
        ) : null}

        {inspectorMode === "screen" ? (
          <>
            <div className={styles.inspectorIntro}>
              {sharedFlowBackgroundActive
                ? `Fundo compartilhado do fluxo. A base atual é “${continuousBackgroundSource==="gifts"?"Lista de presentes":"Convite"}”.`
                : "Fundo e configurações da seção ativa. Ferramentas de precisão ficam recolhidas abaixo."}
            </div>

            {editorPage==="invite-flow"&&inviteFlowState==="after"&&(
              <div className={styles.flowInspectorCard}>
                <label className={styles.inlineCheck}>
                  <input
                    type="checkbox"
                    checked={continuousBackground}
                    onChange={e=>updateInviteFlow({continuousBackground:e.target.checked})}
                  />
                  Fundo contínuo entre as duas seções
                </label>
                {continuousBackground&&(
                  <div className={styles.grid2}>
                    <label>
                      Fundo-base
                      <select
                        value={continuousBackgroundSource}
                        onChange={e=>updateInviteFlow({backgroundSource:e.target.value as "invite"|"gifts"})}
                      >
                        <option value="invite">Convite</option>
                        <option value="gifts">Presentes</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      className={styles.utilityButton}
                      onClick={()=>switchInviteSection(continuousBackgroundSource)}
                    >
                      Editar seção-base
                    </button>
                  </div>
                )}
                <p className={styles.hint}>
                  Desligado: cada seção usa seu próprio fundo. Ligado: o fundo escolhido atravessa as duas seções como uma única página e remove a emenda visual entre elas.
                </p>
              </div>
            )}

            <details open className={styles.screenSettings}>
              <summary>{sharedFlowBackgroundActive ? "Fundo contínuo do fluxo" : "Fundo da seção"} <ChevronDown size={14}/></summary>
              <div className={styles.panel}>
                <div className={styles.grid2}>
                  <label>
                    Cor de fundo
                    <input
                      type="color"
                      value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).backgroundColor}
                      onChange={e=>updateBackgroundStyle({backgroundColor:e.target.value})}
                    />
                  </label>
                  <label>
                    Altura base
                    <input
                      type="number"
                      min="500"
                      max="3000"
                      value={screen.minHeight}
                      onChange={e=>updateScreen({minHeight:Number(e.target.value)},true)}
                    />
                  </label>
                </div>

                <label>
                  Imagem de fundo
                  <input
                    value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).backgroundImage||""}
                    placeholder="URL da imagem"
                    onChange={e=>updateBackgroundStyle({backgroundImage:e.target.value,useGradient:false})}
                  />
                </label>

                <label className={styles.fileUploadLabel}>
                  Carregar foto de fundo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e=>pickImage(e.target.files?.[0]||null,"screen")}
                  />
                </label>

                <div className={styles.grid2}>
                  <label>
                    Posição X
                    <input
                      type="number"
                      value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).backgroundPositionX??50}
                      onChange={e=>updateBackgroundStyle({backgroundPositionX:Number(e.target.value)})}
                    />
                  </label>
                  <label>
                    Posição Y
                    <input
                      type="number"
                      value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).backgroundPositionY??50}
                      onChange={e=>updateBackgroundStyle({backgroundPositionY:Number(e.target.value)})}
                    />
                  </label>
                </div>

                <label className={styles.inlineCheck}>
                  <input
                    type="checkbox"
                    checked={!!(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).useGradient}
                    onChange={e=>updateBackgroundStyle({useGradient:e.target.checked})}
                  />
                  Usar gradiente
                </label>

                {(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).useGradient ? (
                  <>
                    <div className={styles.grid2}>
                      <label>
                        Cor 1
                        <input
                          type="color"
                          value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).gradientFrom||"#ffffff"}
                          onChange={e=>updateBackgroundStyle({gradientFrom:e.target.value})}
                        />
                      </label>
                      <label>
                        Cor 2
                        <input
                          type="color"
                          value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).gradientTo||"#eeeeee"}
                          onChange={e=>updateBackgroundStyle({gradientTo:e.target.value})}
                        />
                      </label>
                    </div>
                    <label>
                      Ângulo
                      <input
                        type="number"
                        value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).gradientAngle??180}
                        onChange={e=>updateBackgroundStyle({gradientAngle:Number(e.target.value)})}
                      />
                    </label>
                  </>
                ) : null}

                <div className={styles.grid2}>
                  <label>
                    Overlay
                    <input
                      type="color"
                      value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).backgroundOverlayColor||"#000000"}
                      onChange={e=>updateBackgroundStyle({backgroundOverlayColor:e.target.value})}
                    />
                  </label>
                  <label>
                    Opacidade overlay
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step=".05"
                      value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).backgroundOverlayOpacity??0}
                      onChange={e=>updateBackgroundStyle({backgroundOverlayOpacity:Number(e.target.value)})}
                    />
                  </label>
                </div>

                <div className={styles.grid2}>
                  <label>
                    Ajuste do fundo
                    <select
                      value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).backgroundSize||"cover"}
                      onChange={e=>updateBackgroundStyle({backgroundSize:e.target.value as any})}
                    >
                      <option value="cover">Cobrir</option>
                      <option value="contain">Conter</option>
                      <option value="auto">Natural</option>
                      <option value="100% 100%">Esticar</option>
                    </select>
                  </label>
                  <label>
                    Repetição
                    <select
                      value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).backgroundRepeat||"no-repeat"}
                      onChange={e=>updateBackgroundStyle({backgroundRepeat:e.target.value as any})}
                    >
                      <option value="no-repeat">Não repetir</option>
                      <option value="repeat">Repetir</option>
                      <option value="repeat-x">Horizontal</option>
                      <option value="repeat-y">Vertical</option>
                    </select>
                  </label>
                </div>

                <label>
                  Textura do papel
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    value={(sharedFlowBackgroundActive?sharedBackgroundScreen:screen).paperOpacity??.5}
                    onChange={e=>updateBackgroundStyle({paperOpacity:Number(e.target.value)})}
                  />
                </label>
              </div>
            </details>

            <details className={styles.screenSettings}>
              <summary>Ferramentas de precisão <ChevronDown size={14}/></summary>
              <div className={styles.panel}>
                <div className={styles.grid2}>
                  <label className={styles.inlineCheck}>
                    <input type="checkbox" checked={showRulers} onChange={e=>setShowRulers(e.target.checked)}/>
                    Réguas
                  </label>
                  <label className={styles.inlineCheck}>
                    <input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/>
                    Grid
                  </label>
                </div>

                <div className={styles.grid2}>
                  <label>
                    Grid px
                    <input type="number" min="2" max="100" step="1" value={gridPx} onChange={e=>setGridPx(clamp(Number(e.target.value)||8,2,100))}/>
                  </label>
                  <label>
                    Tolerância snap
                    <input type="number" min="1" max="30" step="1" value={snapTolerance} onChange={e=>setSnapTolerance(clamp(Number(e.target.value)||6,1,30))}/>
                  </label>
                </div>

                <label className={styles.inlineCheck}>
                  <input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)}/>
                  Snap global
                </label>

                <div className={styles.snapChecks}>
                  <label><input type="checkbox" checked={snapGrid} onChange={e=>setSnapGrid(e.target.checked)}/> Grid</label>
                  <label><input type="checkbox" checked={snapGuides} onChange={e=>setSnapGuides(e.target.checked)}/> Guias</label>
                  <label><input type="checkbox" checked={snapCenter} onChange={e=>setSnapCenter(e.target.checked)}/> Centro</label>
                  <label><input type="checkbox" checked={snapBounds} onChange={e=>setSnapBounds(e.target.checked)}/> Bordas</label>
                  <label><input type="checkbox" checked={snapElements} onChange={e=>setSnapElements(e.target.checked)}/> Elementos</label>
                </div>
              </div>
            </details>

            <details className={styles.screenSettings}>
              <summary>Guias, colunas e safe area <ChevronDown size={14}/></summary>
              <div className={styles.panel}>
                <div className={styles.grid2}>
                  <button className={styles.utilityButton} onClick={()=>addGuide("x")}>+ Guia vertical</button>
                  <button className={styles.utilityButton} onClick={()=>addGuide("y")}>+ Guia horizontal</button>
                </div>

                <label className={styles.inlineCheck}>
                  <input type="checkbox" checked={showGuides} onChange={e=>setShowGuides(e.target.checked)}/>
                  Mostrar guias
                </label>

                {guides.length ? (
                  <div className={styles.guidesList}>
                    {guides.map(g=>(
                      <div key={g.id}>
                        <span>{g.axis==="x"?"V":"H"}</span>
                        <input type="number" value={g.px} step="1" onChange={e=>updateGuide(g.id,Number(e.target.value))}/>
                        <span>px</span>
                        <button onClick={()=>setGuides(x=>x.map(v=>v.id===g.id?{...v,locked:!v.locked}:v))}>{g.locked?"🔒":"🔓"}</button>
                        <button onClick={()=>removeGuide(g.id)}>×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.hint}>Crie guias exatas em px e arraste diretamente no canvas.</p>
                )}

                <div className={styles.measureDivider}/>

                <label className={styles.inlineCheck}>
                  <input type="checkbox" checked={showColumns} onChange={e=>setShowColumns(e.target.checked)}/>
                  Grid de colunas
                </label>

                {showColumns ? (
                  <div className={styles.grid3}>
                    <label>
                      Colunas
                      <input type="number" min="1" max="24" value={columnCount} onChange={e=>setColumnCount(clamp(Number(e.target.value)||4,1,24))}/>
                    </label>
                    <label>
                      Margem
                      <input type="number" min="0" max="150" value={columnMargin} onChange={e=>setColumnMargin(clamp(Number(e.target.value)||0,0,150))}/>
                    </label>
                    <label>
                      Gutter
                      <input type="number" min="0" max="100" value={columnGutter} onChange={e=>setColumnGutter(clamp(Number(e.target.value)||0,0,100))}/>
                    </label>
                  </div>
                ) : null}

                <label className={styles.inlineCheck}>
                  <input type="checkbox" checked={showSafeArea} onChange={e=>setShowSafeArea(e.target.checked)}/>
                  Mostrar safe area
                </label>

                {showSafeArea ? (
                  <div className={styles.grid2}>
                    <label>
                      Topo px
                      <input type="number" min="0" max="200" value={safeTop} onChange={e=>setSafeTop(clamp(Number(e.target.value)||0,0,200))}/>
                    </label>
                    <label>
                      Base px
                      <input type="number" min="0" max="200" value={safeBottom} onChange={e=>setSafeBottom(clamp(Number(e.target.value)||0,0,200))}/>
                    </label>
                  </div>
                ) : null}
              </div>
            </details>

            <details>
              <summary>CSS avançado da seção <ChevronDown size={14}/></summary>
              <div className={styles.panel}>
                <label>
                  CSS da seção
                  <textarea
                    rows={7}
                    value={screen.customCss||""}
                    onChange={e=>updateScreen({customCss:e.target.value},true)}
                  />
                </label>
                <p className={styles.hint}>Use apenas quando os controles visuais não forem suficientes.</p>
              </div>
            </details>
          </>
        ) : !selected ? (
          <div className={styles.emptyState}>
            <SlidersHorizontal size={22}/>
            <strong>Nenhum elemento selecionado</strong>
            <span>Selecione uma camada no canvas ou na lista à esquerda.</span>
            <button onClick={()=>setInspectorMode("screen")}>Editar tela</button>
          </div>
        ) : selectedPart ? (
          <>
            <div className={styles.partHeader}>
              <div>
                <span className={styles.eyebrow}>
                  {screenId==="rsvp"&&selected.slot==="rsvp-flow"
                    ? `Cenário · ${RSVP_PREVIEW_STATES.find(item=>item.id===rsvpPreviewState)?.short||rsvpPreviewState}`
                    : "Parte interna"}
                </span>
                <b>{SLOT_PARTS[selected.slot!]?.find(p=>p.id===selectedPart)?.name||selectedPart}</b>
              </div>
              <div className={styles.partHeaderActions}>
                <button
                  type="button"
                  className={activePart.visible===false?styles.partShowButton:styles.partHideButton}
                  onClick={()=>selected&&selectedPart&&setPartVisible(selected,selectedPart,activePart.visible===false)}
                >
                  {activePart.visible===false?"Mostrar nesta tela":"Ocultar nesta tela"}
                </button>
                <button
                  type="button"
                  className={styles.partRemoveButton}
                  disabled={activePart.visible===false}
                  onClick={()=>selected&&selectedPart&&setPartVisible(selected,selectedPart,false)}
                >
                  <Trash2 size={12}/> Remover
                </button>
                <button type="button" onClick={()=>selectedPart&&mutatePart(selectedPart,{offsetX:0,offsetY:0})}>Zerar posição</button>
                <button type="button" onClick={restoreWholePart}><RotateCcw size={13}/> Restaurar parte</button>
                <button type="button" onClick={()=>setSelectedPart(null)}>Voltar ao bloco</button>
              </div>
            </div>

            {inspectorMode === "essential" ? (
              <>
                {selectedPart.includes("button") ? (
                  <details open className={styles.buttonQuickEditor}>
                    <summary>Botão · edição rápida <ChevronDown size={14}/></summary>
                    <div className={styles.panel}>
                      <div className={styles.grid2}>
                        {pText("Largura","width")}
                        {pNum("Altura mínima","minHeight",1,0,300)}
                      </div>
                      <div className={styles.grid2}>
                        {pNum("Posição X","offsetX",1,-1000,1000)}
                        {pNum("Posição Y","offsetY",1,-1000,1000)}
                      </div>
                      <div className={styles.grid2}>
                        {pColor("Fundo","backgroundColor","#12308e")}
                        {pColor("Borda","borderColor","#12308e")}
                      </div>
                      <div className={styles.grid3}>
                        {pNum("Espessura","borderWidth",1,0,20)}
                        {pNum("Raio","borderRadius",1,0,999)}
                        {pNum("Gap","gap",1,0,80)}
                      </div>
                      <div className={styles.grid4}>
                        {pNum("Pad T","paddingTop",1,0,120)}
                        {pNum("Pad R","paddingRight",1,0,120)}
                        {pNum("Pad B","paddingBottom",1,0,120)}
                        {pNum("Pad L","paddingLeft",1,0,120)}
                      </div>
                      <p className={styles.hint}>Essas alterações pertencem somente ao cenário selecionado. O texto do botão continua em uma camada própria.</p>
                    </div>
                  </details>
                ) : null}

                <details open>
                  <summary>Conteúdo <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    {pText("Texto / rótulo","text")}
                    {selectedPart.includes("icon") ? (
                      <p className={styles.hint}>O ícone é configurado pelo seletor disponível nesta parte quando suportado pelo componente.</p>
                    ) : null}
                  </div>
                </details>

                <details open>
                  <summary>Tipografia <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    {pSelect("Fonte","fontFamily",FONTS.map(font=>({value:font,label:font})))}
                    <div className={styles.grid3}>
                      {pNum("Tamanho","fontSize",1,6,120)}
                      {pNum("Peso","fontWeight",100,100,900)}
                      {pNum("Linha","lineHeight",.05,.5,3)}
                    </div>
                    <div className={styles.grid2}>
                      {pNum("Tracking","letterSpacing",.1,-5,30)}
                      {pColor("Cor","color","#0f238d")}
                    </div>
                    {pSelect("Alinhamento","textAlign",[
                      {value:"left",label:"Esquerda"},
                      {value:"center",label:"Centro"},
                      {value:"right",label:"Direita"},
                      {value:"justify",label:"Justificar"}
                    ])}
                  </div>
                </details>

                <details open>
                  <summary>Caixa <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <div className={styles.grid2}>
                      {pText("Largura CSS","width")}
                      {pText("Altura CSS","height")}
                    </div>
                    <div className={styles.grid2}>
                      {pNum("Posição X","offsetX",1,-1000,1000)}
                      {pNum("Posição Y","offsetY",1,-1000,1000)}
                    </div>
                    <p className={styles.hint}>Posição X/Y move somente esta parte dentro do bloco funcional, sem alterar o restante do formulário.</p>
                    <div className={styles.grid4}>
                      {pNum("Pad T","paddingTop",1)}
                      {pNum("Pad R","paddingRight",1)}
                      {pNum("Pad B","paddingBottom",1)}
                      {pNum("Pad L","paddingLeft",1)}
                    </div>
                    <div className={styles.grid4}>
                      {pNum("Marg T","marginTop",1)}
                      {pNum("Marg R","marginRight",1)}
                      {pNum("Marg B","marginBottom",1)}
                      {pNum("Marg L","marginLeft",1)}
                    </div>
                  </div>
                </details>

                <details>
                  <summary>Aparência <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <div className={styles.grid2}>
                      {pColor("Fundo","backgroundColor","#ffffff")}
                      {pNum("Opacidade","opacity",.05,0,1)}
                    </div>
                    <div className={styles.grid3}>
                      {pNum("Borda","borderWidth",1,0,30)}
                      {pNum("Raio","borderRadius",1,0,999)}
                      {pColor("Cor borda","borderColor","#c59b3a")}
                    </div>
                    {pText("Imagem de fundo (URL)","backgroundImage")}
                    <label className={styles.fileUploadLabel}>
                      Carregar foto
                      <input type="file" accept="image/*" onChange={e=>pickImage(e.target.files?.[0]||null,"part")}/>
                    </label>
                  </div>
                </details>
              </>
            ) : (
              <>
                <details open>
                  <summary>Sombra e layout <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <div className={styles.grid4}>
                      {pNum("X","shadowX",1)}
                      {pNum("Y","shadowY",1)}
                      {pNum("Blur","shadowBlur",1,0,100)}
                      {pNum("Spread","shadowSpread",1,-50,100)}
                    </div>
                    {pColor("Cor sombra","shadowColor","#000000")}
                    <div className={styles.grid2}>
                      {pText("Display","display")}
                      {pNum("Gap","gap",1,0,100)}
                    </div>
                  </div>
                </details>

                <details open>
                  <summary>Estados <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    {pCss("Normal","customCss",5,"transition: .2s ease;")}
                    {pCss("Hover","hoverCss",4)}
                    {pCss("Focus / focus-within","focusCss",4)}
                    {pCss("Active","activeCss",3)}
                    <p className={styles.hint}>CSS isolado somente nesta parte interna.</p>
                  </div>
                </details>

                <div className={styles.styleTools}>
                  <button onClick={copyStyle}><Copy size={14}/> Copiar estilo</button>
                  <button onClick={pasteStyle} disabled={!styleClipboard}>Colar estilo</button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className={styles.selectedSummary}>
              <div>
                <span className={styles.eyebrow}>{selected.type==="slot"?"Bloco funcional":selected.type}</span>
                <strong>{selected.name}</strong>
              </div>
              <div className={styles.summaryActions}>
                <button onClick={()=>mutateElement(selected.id,{locked:!selected.locked})} title={selected.locked?"Desbloquear":"Bloquear"}>
                  {selected.locked?<Unlock size={14}/>:<Lock size={14}/>}
                </button>
                <button onClick={()=>mutateElement(selected.id,{visible:!selected.visible})} title={selected.visible?"Ocultar":"Mostrar"}>
                  {selected.visible?<EyeOff size={14}/>:<Eye size={14}/>}
                </button>
              </div>
            </div>

            {inspectorMode === "essential" ? (
              <>
                <details open>
                  <summary>Conteúdo <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <label>
                      Nome da camada
                      <input value={selected.name} onChange={e=>mutateElement(selected.id,{name:e.target.value})}/>
                    </label>

                    {(selected.type==="text"||selected.type==="link") ? (
                      <label>
                        Texto
                        <textarea rows={3} value={selected.text||""} onChange={e=>mutateElement(selected.id,{text:e.target.value})}/>
                      </label>
                    ) : null}

                    {selected.type==="image" ? (
                      <>
                        <label>
                          Arquivo / URL
                          <input value={selected.src||""} onChange={e=>mutateElement(selected.id,{src:e.target.value})}/>
                        </label>
                        <label className={styles.fileUploadLabel}>
                          Carregar imagem
                          <input type="file" accept="image/*" onChange={e=>pickImage(e.target.files?.[0]||null,"element")}/>
                        </label>
                      </>
                    ) : null}

                    {selected.type==="link" ? (
                      <label>
                        Destino
                        <input value={selected.href||""} onChange={e=>mutateElement(selected.id,{href:e.target.value})}/>
                      </label>
                    ) : null}
                  </div>
                </details>

                <details open>
                  <summary>Posição e tamanho <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <div className={styles.unitSwitch}>
                      <span>Unidade</span>
                      <button type="button" className={unitMode==="px"?styles.unitActive:""} onClick={()=>setUnitMode("px")}>px</button>
                      <button type="button" className={unitMode==="pct"?styles.unitActive:""} onClick={()=>setUnitMode("pct")}>%</button>
                    </div>

                    <div className={styles.measureGrid}>
                      {unitMode==="px" ? (
                        <>
                          <label>X<input type="number" step=".1" value={Number(pctToPxX(selected.x).toFixed(1))} onChange={e=>mutateElement(selected.id,{x:pxToPctX(Number(e.target.value))})}/></label>
                          <label>Y<input type="number" step=".1" value={Number(pctToPxY(selected.y).toFixed(1))} onChange={e=>mutateElement(selected.id,{y:pxToPctY(Number(e.target.value))})}/></label>
                          <label>Largura<input type="number" step=".1" value={Number(pctToPxX(selected.width).toFixed(1))} onChange={e=>mutateElement(selected.id,{width:pxToPctX(Number(e.target.value))})}/></label>
                          <label>Altura<input type="number" step=".1" value={Number(pctToPxY(selected.height).toFixed(1))} onChange={e=>mutateElement(selected.id,{height:pxToPctY(Number(e.target.value))})}/></label>
                        </>
                      ) : (
                        <>
                          <label>X<input type="number" step=".001" value={selected.x} onChange={e=>mutateElement(selected.id,{x:Number(e.target.value)})}/></label>
                          <label>Y<input type="number" step=".001" value={selected.y} onChange={e=>mutateElement(selected.id,{y:Number(e.target.value)})}/></label>
                          <label>Largura<input type="number" step=".001" value={selected.width} onChange={e=>mutateElement(selected.id,{width:Number(e.target.value)})}/></label>
                          <label>Altura<input type="number" step=".001" value={selected.height} onChange={e=>mutateElement(selected.id,{height:Number(e.target.value)})}/></label>
                        </>
                      )}
                    </div>

                    <div className={styles.alignActions}>
                      <button onClick={()=>mutateElement(selected.id,{x:(100-selected.width)/2})}>Centralizar H</button>
                      <button onClick={()=>mutateElement(selected.id,{y:(100-selected.height)/2})}>Centralizar V</button>
                      <button onClick={()=>mutateElement(selected.id,{x:(100-selected.width)/2,y:(100-selected.height)/2})}>Centro da tela</button>
                    </div>
                  </div>
                </details>

                {(selected.type==="text"||selected.type==="link") ? (
                  <details open>
                    <summary>Tipografia <ChevronDown size={14}/></summary>
                    <div className={styles.panel}>
                      <label>
                        Fonte
                        <select value={selected.fontFamily||"Cormorant Garamond"} onChange={e=>mutateElement(selected.id,{fontFamily:e.target.value})}>
                          {FONTS.map(f=><option key={f}>{f}</option>)}
                        </select>
                      </label>
                      <div className={styles.grid3}>
                        {num("Tamanho","fontSize",1,6,160)}
                        {num("Peso","fontWeight",100,100,900)}
                        {num("Linha","lineHeight",.05,.5,3)}
                      </div>
                      <div className={styles.grid2}>
                        {num("Tracking","letterSpacing",.1,-5,30)}
                        {color("Cor","color","#0f238d")}
                      </div>
                      <div className={styles.inlineBtns}>
                        <button onClick={()=>mutateElement(selected.id,{textAlign:"left"})}><AlignLeft size={15}/></button>
                        <button onClick={()=>mutateElement(selected.id,{textAlign:"center"})}><AlignCenter size={15}/></button>
                        <button onClick={()=>mutateElement(selected.id,{textAlign:"right"})}><AlignRight size={15}/></button>
                      </div>
                    </div>
                  </details>
                ) : null}

                <details>
                  <summary>Aparência <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <div className={styles.grid2}>
                      {color("Fundo","backgroundColor","#ffffff")}
                      {num("Opacidade","opacity",.05,0,1)}
                    </div>
                    <div className={styles.grid3}>
                      {num("Borda","borderWidth",1,0,30)}
                      {num("Raio","borderRadius",1,0,999)}
                      {color("Cor borda","borderColor","#c59b3a")}
                    </div>
                    <div className={styles.grid2}>
                      {num("Pad X","paddingX",1,0,100)}
                      {num("Pad Y","paddingY",1,0,100)}
                    </div>
                  </div>
                </details>

                {selected.type==="slot"&&selected.slot ? (
                  <details open>
                    <summary>Partes internas <ChevronDown size={14}/></summary>
                    <div className={styles.panel}>
                      <p className={styles.hint}>Escolha exatamente a parte que deseja editar. O painel muda para mostrar somente os controles daquela parte.</p>
                      <div className={styles.partButtons}>
                        {slotPartsForEditor(selected).map(part=>{
                          const hidden=partStyleFor(selected,part.id).visible===false;
                          return <button key={part.id} className={hidden?styles.partButtonHidden:""} onClick={()=>selectInternalPart(selected,part.id)}>
                            {part.name}{hidden?" · removido":""}
                          </button>
                        })}
                      </div>
                    </div>
                  </details>
                ) : null}
              </>
            ) : (
              <>
                <details open>
                  <summary>Transformação e camada <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <div className={styles.grid4}>
                      {num("Rotação","rotate",1)}
                      {num("Escala X","scaleX",.05)}
                      {num("Escala Y","scaleY",.05)}
                      {num("Camada","zIndex",1)}
                    </div>
                    <div className={styles.layerActions}>
                      <button onClick={()=>reorder("front")}><BringToFront size={15}/></button>
                      <button onClick={()=>reorder("up")}><MoveUp size={15}/></button>
                      <button onClick={()=>reorder("down")}><MoveDown size={15}/></button>
                      <button onClick={()=>reorder("back")}><SendToBack size={15}/></button>
                    </div>
                  </div>
                </details>

                <details open>
                  <summary>Fundo avançado <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <label>
                      Imagem de fundo
                      <input value={selected.backgroundImage||""} onChange={e=>mutateElement(selected.id,{backgroundImage:e.target.value,useGradient:false})}/>
                    </label>
                    <label className={styles.fileUploadLabel}>
                      Carregar foto de fundo
                      <input type="file" accept="image/*" onChange={e=>pickImage(e.target.files?.[0]||null,"element")}/>
                    </label>

                    <label className={styles.inlineCheck}>
                      <input type="checkbox" checked={!!selected.useGradient} onChange={e=>mutateElement(selected.id,{useGradient:e.target.checked})}/>
                      Usar gradiente
                    </label>

                    {selected.useGradient ? (
                      <>
                        <div className={styles.grid2}>
                          {color("Gradiente 1","gradientFrom","#ffffff")}
                          {color("Gradiente 2","gradientTo","#eeeeee")}
                        </div>
                        {num("Ângulo","gradientAngle",1,0,360)}
                      </>
                    ) : null}

                    <div className={styles.grid3}>
                      {num("Pos X","backgroundPositionX",1,0,100)}
                      {num("Pos Y","backgroundPositionY",1,0,100)}
                      <label>
                        Ajuste
                        <select value={selected.backgroundSize||"cover"} onChange={e=>mutateElement(selected.id,{backgroundSize:e.target.value as any})}>
                          <option value="cover">Cover</option>
                          <option value="contain">Contain</option>
                          <option value="auto">Auto</option>
                          <option value="100% 100%">Esticar</option>
                        </select>
                      </label>
                    </div>

                    <div className={styles.grid2}>
                      {color("Overlay","overlayColor","#000000")}
                      {num("Overlay opac.","overlayOpacity",.05,0,1)}
                    </div>
                  </div>
                </details>

                <details>
                  <summary>Sombra <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <div className={styles.grid4}>
                      {num("S X","shadowX",1)}
                      {num("S Y","shadowY",1)}
                      {num("Blur","shadowBlur",1,0,100)}
                      {num("Spread","shadowSpread",1,-50,100)}
                    </div>
                    {color("Cor sombra","shadowColor","#000000")}
                  </div>
                </details>

                {selected.type==="image" ? (
                  <details open>
                    <summary>Imagem <ChevronDown size={14}/></summary>
                    <div className={styles.panel}>
                      <label>
                        Ajuste
                        <select value={selected.objectFit||"contain"} onChange={e=>mutateElement(selected.id,{objectFit:e.target.value as any})}>
                          <option value="contain">Conter</option>
                          <option value="cover">Cobrir</option>
                          <option value="fill">Esticar</option>
                          <option value="none">Natural</option>
                        </select>
                      </label>
                      <div className={styles.grid2}>
                        {num("Pos X","objectPositionX",1,0,100)}
                        {num("Pos Y","objectPositionY",1,0,100)}
                      </div>
                      <div className={styles.grid4}>
                        {num("Brilho","brightness",1,0,300)}
                        {num("Contraste","contrast",1,0,300)}
                        {num("Saturação","saturate",1,0,300)}
                        {num("Cinza","grayscale",1,0,100)}
                      </div>
                      {num("Blur","blur",.5,0,40)}
                      <div className={styles.inlineBtns}>
                        <button onClick={()=>mutateElement(selected.id,{flipX:!selected.flipX})}>Espelhar X</button>
                        <button onClick={()=>mutateElement(selected.id,{flipY:!selected.flipY})}>Espelhar Y</button>
                      </div>
                    </div>
                  </details>
                ) : null}

                <details open>
                  <summary>Estados / CSS <ChevronDown size={14}/></summary>
                  <div className={styles.panel}>
                    <label>
                      Normal
                      <textarea rows={5} value={selected.customCss||""} onChange={e=>mutateElement(selected.id,{customCss:e.target.value})}/>
                    </label>
                    <label>
                      Hover
                      <textarea rows={4} value={selected.hoverCss||""} onChange={e=>mutateElement(selected.id,{hoverCss:e.target.value})}/>
                    </label>
                    <label>
                      Focus
                      <textarea rows={4} value={selected.focusCss||""} onChange={e=>mutateElement(selected.id,{focusCss:e.target.value})}/>
                    </label>
                    <label>
                      Active
                      <textarea rows={3} value={selected.activeCss||""} onChange={e=>mutateElement(selected.id,{activeCss:e.target.value})}/>
                    </label>
                    <p className={styles.hint}>Área avançada. Use somente quando precisar ultrapassar os controles visuais.</p>
                  </div>
                </details>

                <div className={styles.styleTools}>
                  <button onClick={copyStyle}><Copy size={14}/> Copiar estilo</button>
                  <button onClick={pasteStyle} disabled={!styleClipboard}>Colar estilo</button>
                </div>

                <div className={styles.elementActions}>
                  <button onClick={duplicate}><Copy size={15}/> Duplicar</button>
                  <button className={styles.danger} onClick={remove}><Trash2 size={15}/> Excluir</button>
                </div>
              </>
            )}
          </>
        )}
      </aside>

    </div>

  </div>

}
