function rng(seed){ let x=seed; return ()=>((x=(x*16807)%2147483647)/2147483647); }
const fx = n => Math.round(n*10)/10;
function pine(x,base,h,c){ const w=h*.34; let p=""; for(let i=0;i<3;i++){ const y=base-h*(i*.28), ww=w*(1-i*.22), hh=h*.46; p+=`M${fx(x-ww)} ${fx(y)} L${fx(x)} ${fx(y-hh)} L${fx(x+ww)} ${fx(y)}Z `; } return `<path d="${p}" fill="${c}"/><rect x="${fx(x-1)}" y="${fx(base)}" width="2" height="4" fill="${c}"/>`; }
function palm(x,base,h,lean,c){
  const tx=x+lean, ty=base-h; let s=`<path d="M${x-1.6} ${base} Q${fx(x+lean*.2)} ${fx(base-h*.55)} ${fx(tx)} ${fx(ty)} L${fx(tx+1.2)} ${fx(ty+1)} Q${fx(x+lean*.2+2)} ${fx(base-h*.55)} ${x+1.6} ${base}Z" fill="${c}"/>`;
  [[-26,6],[-16,12],[-6,15],[6,14],[17,11],[27,5],[-22,-2],[22,-3]].forEach(([dx,dy])=>{
    s+=`<path d="M${fx(tx)} ${fx(ty)} Q${fx(tx+dx*.5)} ${fx(ty-8+dy*.1)} ${fx(tx+dx)} ${fx(ty+dy)}" stroke="${c}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; });
  return s;
}
const SCENES = {
  sf:{label:"San Francisco", hdr:"#2C4466", svg:()=>{
    let cables=""; for(let x=118;x<=282;x+=7){ const t=(x-110)/180, y=(1-t)*(1-t)*42+2*t*(1-t)*120+t*t*42; cables+=`M${x} ${fx(y)}V104 `; }
    for(let x=6;x<104;x+=8){ const t=x/110, y=(1-t)*(1-t)*98+2*t*(1-t)*86+t*t*42; cables+=`M${x} ${fx(y)}V104 `; }
    for(let x=296;x<396;x+=8){ const t=(x-290)/110, y=(1-t)*(1-t)*42+2*t*(1-t)*86+t*t*98; cables+=`M${x} ${fx(y)}V104 `; }
    const tower=x=>`<rect x="${x-5}" y="36" width="3.2" height="80" /><rect x="${x+2}" y="36" width="3.2" height="80"/><rect x="${x-5}" y="44" width="10" height="2"/><rect x="${x-5}" y="66" width="10" height="2"/><rect x="${x-5}" y="88" width="10" height="2"/>`;
    return `<defs><linearGradient id="sfs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#253F63"/><stop offset=".55" stop-color="#B9727A"/><stop offset=".85" stop-color="#F0B48A"/></linearGradient>
      <linearGradient id="sfw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A5F7E"/><stop offset="1" stop-color="#1D2B45"/></linearGradient></defs>
      <rect width="400" height="160" fill="url(#sfs)"/><circle cx="318" cy="98" r="20" fill="#FBDDB2" opacity=".85"/>
      <path d="M0 108 Q50 86 105 100 T215 94 T320 102 T400 96 V160 H0Z" fill="#5E4E6E" opacity=".75"/>
      <path d="M0 100 Q90 92 200 99 T400 97 V108 H0Z" fill="#fff" opacity=".16"/>
      <rect y="112" width="400" height="48" fill="url(#sfw)"/>
      <path d="M300 118 h36 M286 126 h52 M296 134 h30" stroke="#FBDDB2" stroke-width="1.2" opacity=".35"/>
      <g fill="#A63A28">${tower(110)}${tower(290)}<rect x="0" y="103" width="400" height="3.5"/></g>
      <g stroke="#A63A28" fill="none"><path d="M-10 100 Q55 86 110 42 Q200 120 290 42 Q345 86 410 100" stroke-width="1.6"/><path d="${cables}" stroke-width=".45" opacity=".8"/></g>`; }},
  yos:{label:"Yosemite · El Portal", hdr:"#3E5161", svg:()=>{
    const r=rng(7); let snow=""; for(let i=0;i<70;i++) snow+=`<circle cx="${fx(r()*400)}" cy="${fx(r()*150)}" r="${fx(.5+r()*1.1)}"/>`;
    let trees=""; [[14,150,34],[34,152,26],[52,151,40],[70,153,24],[300,152,30],[318,150,42],[338,153,28],[358,151,36],[380,153,26],[396,150,38]].forEach(([x,b,h])=>trees+=pine(x,b,h,"#22392F"));
    return `<defs><linearGradient id="yss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7F97AD"/><stop offset="1" stop-color="#D9E2E9"/></linearGradient>
      <linearGradient id="ysr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6F7E8E"/><stop offset="1" stop-color="#9AA7B4"/></linearGradient></defs>
      <rect width="400" height="160" fill="url(#yss)"/>
      <path d="M0 112 Q70 92 140 104 T280 98 T400 104 V160 H0Z" fill="#AEBBC7"/>
      <path d="M176 136 C186 96 202 52 238 40 Q252 36 262 38 L264 136Z" fill="url(#ysr)"/>
      <path d="M190 84 C200 62 214 46 238 40 Q252 36 262 38" stroke="#fff" stroke-width="2.4" fill="none" opacity=".85"/>
      <path d="M262 38 L264 136" stroke="#5B6876" stroke-width="1.5"/>
      <path d="M0 136 L0 58 Q24 50 52 54 Q80 60 92 80 L112 136Z" fill="#5C6A78"/>
      <path d="M0 58 Q24 50 52 54 Q74 58 86 70" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>
      <path d="M0 148 Q100 136 200 142 T400 140 V160 H0Z" fill="#EEF3F7"/>
      ${trees}<g fill="#fff" opacity=".75">${snow}</g>`; }},
  mry:{label:"Monterey · Carmel", hdr:"#1E5560", svg:()=>{
    return `<defs><linearGradient id="mys" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FA4B5"/><stop offset=".75" stop-color="#E9D6B8"/></linearGradient>
      <linearGradient id="myw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A8796"/><stop offset="1" stop-color="#173F4A"/></linearGradient></defs>
      <rect width="400" height="160" fill="url(#mys)"/><circle cx="92" cy="96" r="15" fill="#FFF1D6" opacity=".9"/>
      <path d="M0 104 Q40 100 90 103 L90 106 H0Z" fill="#7C8F95" opacity=".6"/>
      <rect y="104" width="400" height="56" fill="url(#myw)"/>
      <path d="M60 112 h50 M30 122 h40 M120 128 h60 M70 140 h70 M180 116 h30" stroke="#FFF1D6" stroke-width="1" opacity=".35"/>
      <path d="M232 160 L244 128 Q262 112 292 114 L330 104 Q362 102 382 94 L400 92 V160Z" fill="#3E3532"/>
      <path d="M244 128 Q262 112 292 114 L330 104 Q362 102 382 94" stroke="#6B5A52" stroke-width="2" fill="none"/>
      <path d="M248 160 Q262 150 290 152 Q300 146 320 150" stroke="#fff" stroke-width="1.4" fill="none" opacity=".5"/>
      <g fill="#1F332C"><path d="M331 106 C328 94 320 88 324 74 L328 74 C328 88 336 94 336 106Z"/>
        <ellipse cx="326" cy="70" rx="36" ry="8.5"/><ellipse cx="312" cy="79" rx="24" ry="6.5"/><ellipse cx="342" cy="60" rx="24" ry="7"/><ellipse cx="350" cy="72" rx="14" ry="5"/></g>
      <path d="M150 50 q5 -5 10 0 q5 -5 10 0 M178 38 q4 -4 8 0 q4 -4 8 0" stroke="#2C4A52" stroke-width="1.3" fill="none"/>`; }},
  la:{label:"Los Angeles · Venice", hdr:"#3A2C59", svg:(plane)=>{
    const r=rng(11); let stars=""; for(let i=0;i<24;i++) stars+=`<circle cx="${fx(r()*400)}" cy="${fx(r()*40)}" r="${fx(.4+r()*.7)}"/>`;
    let wheel=`<circle cx="70" cy="80" r="18" fill="none"/>`; for(let a=0;a<12;a++){ const t=a*Math.PI/6; wheel+=`<path d="M70 80 L${fx(70+18*Math.cos(t))} ${fx(80+18*Math.sin(t))}"/>`; }
    return `<defs><linearGradient id="las" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2150"/><stop offset=".45" stop-color="#B3507A"/><stop offset=".8" stop-color="#F29A5E"/><stop offset="1" stop-color="#FBD08A"/></linearGradient>
      <linearGradient id="law" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A3A63"/><stop offset="1" stop-color="#1E1636"/></linearGradient></defs>
      <rect width="400" height="160" fill="url(#las)"/><g fill="#fff" opacity=".6">${stars}</g>
      <circle cx="214" cy="110" r="30" fill="#FFE1A6"/>
      <rect y="110" width="400" height="50" fill="url(#law)"/>
      <path d="M192 118 h44 M198 126 h32 M204 134 h20 M208 142 h12" stroke="#FFE1A6" stroke-width="1.6" opacity=".6"/>
      <g stroke="#1A1330" stroke-width="1.2">${wheel}<path d="M0 104 H140 M10 104V116 M30 104V116 M50 104V116 M70 104V116 M90 104V116 M110 104V116 M130 104V116 M70 80 L62 104 M70 80 L78 104"/></g>
      ${palm(300,160,92,-10,"#1A1330")}${palm(330,160,74,8,"#1A1330")}${palm(362,160,104,-4,"#1A1330")}${palm(250,160,60,6,"#1A1330")}
      ${plane?`<path d="M130 40 l24 -6 l6 -8 l3 0 l-3 9 l14 -3 l4 -4 l2 0 l-2 6 l-2 3 l-2 0 l-14 2 l-5 8 l-3 0 l2 -7 l-22 2Z" fill="#1A1330" opacity=".85"/>`:""}`; }},
  bs:{label:"Big Sur · Highway 1", hdr:"#34534F", svg:()=>{
    let cols=""; for(let x=128;x<=272;x+=9){ const t=(x-120)/160, y=(1-t)*(1-t)*112+2*t*(1-t)*38+t*t*112; cols+=`M${x} ${fx(y)}V76 `; }
    return `<defs><linearGradient id="bss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FB6C9"/><stop offset=".7" stop-color="#F1DFC4"/></linearGradient>
      <linearGradient id="bsw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3D8A98"/><stop offset="1" stop-color="#1A4A57"/></linearGradient></defs>
      <rect width="400" height="160" fill="url(#bss)"/>
      <path d="M0 96 Q80 70 170 84 T400 74 V160 H0Z" fill="#9CB2A4" opacity=".8"/>
      <rect y="118" width="400" height="42" fill="url(#bsw)"/>
      <path d="M140 128 h40 M200 136 h50 M160 146 h70" stroke="#fff" stroke-width="1" opacity=".35"/>
      <path d="M0 160 L0 74 L104 76 L116 112 L124 160Z" fill="#5A4E40"/><path d="M0 74 L104 76 L108 86 Q60 80 0 84Z" fill="#4D6A47"/>
      <path d="M276 160 L284 112 L296 76 L400 70 V160Z" fill="#5A4E40"/><path d="M296 76 L400 70 V80 Q340 82 292 88Z" fill="#4D6A47"/>
      <g stroke="#ECE5D8" fill="none"><path d="M120 112 Q200 38 280 112" stroke-width="4.5"/><path d="${cols}" stroke-width="1.6"/></g>
      <rect x="98" y="72" width="204" height="5" fill="#ECE5D8"/><rect x="98" y="77" width="204" height="1.5" fill="#B9B0A2"/>
      <path d="M0 64 Q60 56 120 62 T260 58" stroke="#fff" stroke-width="8" opacity=".18" fill="none" stroke-linecap="round"/>`; }},
  lv:{label:"Las Vegas · The Strip", hdr:"#2A1B45", svg:(plane)=>{
    const r=rng(23); let stars="", win="";
    for(let i=0;i<30;i++) stars+=`<circle cx="${fx(r()*400)}" cy="${fx(r()*60)}" r="${fx(.4+r()*.8)}"/>`;
    const towers=[[150,62,18],[172,48,14],[188,70,20],[212,40,12],[226,58,16],[246,76,22],[272,66,18],[294,84,26],[324,72,16],[344,90,30],[378,80,22]];
    let b=""; towers.forEach(([x,y,w])=>{ b+=`<rect x="${x}" y="${y}" width="${w}" height="${160-y}"/>`; for(let yy=y+6;yy<140;yy+=7) for(let xx=x+3;xx<x+w-2;xx+=5) if(r()>.55) win+=`<rect x="${xx}" y="${yy}" width="1.6" height="2.4"/>`; });
    return `<defs><linearGradient id="lvs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120D2C"/><stop offset=".55" stop-color="#3A1D57"/><stop offset="1" stop-color="#8A2F6E"/></linearGradient></defs>
      <rect width="400" height="160" fill="url(#lvs)"/><g fill="#fff" opacity=".7">${stars}</g>
      <path d="M0 118 L40 96 L80 110 L120 90 L170 112 L230 98 L290 114 L340 100 L400 112 V160 H0Z" fill="#2A1840"/>
      <g fill="#1A1030"><rect x="58" y="22" width="3" height="138"/><path d="M52 34 h15 l-2 7 h-11Z"/><rect x="58.6" y="10" width="1.8" height="12"/>
        <path d="M98 160 L108 82 L112 82 L122 160Z M104 120 h14"/>${b}</g>
      <g fill="#FFD98A" opacity=".85">${win}</g>
      <path d="M0 150 H400" stroke="#FF5FA2" stroke-width="1.2" opacity=".7"/><path d="M0 154 H400" stroke="#52E3E1" stroke-width=".8" opacity=".5"/>
      <circle cx="59.5" cy="37" r="1.4" fill="#FF5FA2"/>
      ${plane?`<path d="M250 30 l24 -6 l6 -8 l3 0 l-3 9 l14 -3 l4 -4 l2 0 l-2 6 l-2 3 l-2 0 l-14 2 l-5 8 l-3 0 l2 -7 l-22 2Z" fill="#F5D7FF" opacity=".75"/>`:""}`; }},
  home:{label:"LAX → Fort Lauderdale", hdr:"#3A2C59", svg:()=>SCENES.la.svg(true)},
  vhome:{label:"LAS → Florida", hdr:"#2A1B45", svg:()=>SCENES.lv.svg(true)}
};
function sceneSVG(k){ return `<svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${SCENES[k].svg()}</svg>`; }
