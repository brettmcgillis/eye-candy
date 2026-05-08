import{S as t,bg as k}from"./index-BnEdaNJi.js";let g=null;function C(){return g||(g=k(()=>import("./index-B17Bpz30.js"),[])),g}function D(y={}){const{audioContext:c=void 0,withSamples:h=!0}=y||{},n=t.useRef(null),o=t.useRef(null),u=t.useRef(!1),a=t.useRef(null),[w,x]=t.useState(!1),[b,i]=t.useState(!1);t.useEffect(()=>{if(c===null){console.log("[strudel] waiting for external AudioContext…");return}let e=!0;async function p(){console.log("[strudel] init start");const{initStrudel:d,samples:R}=await C();let s;c===void 0?(s=new AudioContext,u.current=!0,console.log("[strudel] created internal AudioContext")):(s=c,u.current=!1,console.log("[strudel] using external AudioContext")),o.current=s;const l=await d({audioContext:s,prebake:h?()=>R("github:tidalcycles/dirt-samples"):void 0});if(!e)return;n.current=l;const r=s.createGain();r.gain.value=1,u.current&&r.connect(s.destination),l.connect?l.connect(r):l.masterGain?.connect?l.masterGain.connect(r):console.warn("[strudel] could not find strudel output to connect"),a.current=r,x(!0),console.log("[strudel] init done"),console.log("[strudel] ctx ===",s),console.log("[strudel] output ===",r)}return p(),()=>{e=!1;try{n.current?.evaluate?.("hush")}catch{console.error("[strudel] hush failed")}try{a.current?.disconnect()}catch{console.error("[strudel] disconnect failed")}if(u.current&&o.current)try{o.current.close()}catch{console.error("[strudel] ctx close failed")}n.current=null,a.current=null,o.current=null,u.current=!1,x(!1),i(!1)}},[c,h]);const f=t.useCallback(async()=>{const e=o.current;e&&e.state!=="running"&&(console.log("[strudel] unlocking audio…"),await e.resume(),console.log("[strudel] audio state:",e.state))},[]),m=t.useCallback(()=>{if(n.current?.evaluate)try{n.current.evaluate("hush"),i(!1),console.log("[strudel] stop")}catch(e){console.error("[strudel] stop failed:",e)}},[]),v=t.useCallback(async e=>{if(n.current?.evaluate){await f();try{n.current.evaluate("hush"),n.current.evaluate(e),i(!0),console.log("[strudel] play")}catch(p){i(!1),console.error("[strudel] play failed:",p)}}},[f]);return{ready:w,isPlaying:b,play:v,stop:m,unlock:f,output:a.current,ctx:o.current}}const S=`
setcps(0.7)

stack(
  sound("bd ~ bd ~").gain(1.1),
  sound("hh*8").gain(0.4),
  sound("arpy:2").slow(2).gain(0.5)
)
`,_=`
setcps(0.9)

stack(
  sound("bd*2").gain(1.2),
  sound("cp ~").every(3, rev),
  sound("hh*16").gain(0.25),
  sound("noise").slow(4).gain(0.1)
)
`,A=`
setcps(0.4)

stack(
  sound("arpy:1").slow(4).gain(0.5),
  sound("pad:2").slow(8).gain(0.4),
  sound("~ hh ~ hh").gain(0.15)
)
`,P=`
setcps(0.7);

p1: n("0 2 4 6 7 6 4 2")
  .scale("<c3:major>/2")
  .s("supersaw")
  .distort(0.7)
  .superimpose((x) => x.detune("<0.5>"))
  .lpenv(perlin.slow(3).range(1, 4))
  .lpf(perlin.slow(2).range(100, 2000))
  .gain(0.3);
p2: "<a1 e2>/8".clip(0.8).struct("x*8").s("supersaw").note();
`,E=`
setcps(0.7)

stack(
  sound("bd ~ bd ~").gain(1.1),
  sound("hh*8").gain(0.4),
  sound("arpy:2").slow(2).gain(0.5)
)
`,G={threeD:S,glitch:_,ambient:A,weirderStuff:P,defaultPattern:E};export{G as S,D as u};
