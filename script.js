const bg=document.getElementById('bg'),bgx=bg.getContext('2d');
const wrap=document.getElementById('screen-wrap');
let paused=false,mute=false,AC=null,dashHold=false;
function fitBg(){
  const r=wrap.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio||1,2);
  bg.width=Math.max(1,Math.round(r.width*dpr));
  bg.height=Math.max(1,Math.round(r.height*dpr));
  bg.style.width=r.width+'px';bg.style.height=r.height+'px';
  bg.dataset.logicalWidth=String(Math.round(r.width));
  bg.dataset.logicalHeight=String(Math.round(r.height));
}
window.addEventListener('resize',fitBg);window.addEventListener('orientationchange',fitBg);fitBg();
function paintBg(t){
  const w=bg.width,h=bg.height;if(!w||!h)return;
  const g=bgx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#0F2140');g.addColorStop(1,'#0A1A30');
  bgx.fillStyle=g;bgx.fillRect(0,0,w,h);
  bgx.fillStyle='rgba(244,228,168,.12)';
  const a=((t/6000)%1)*Math.PI*2;
  bgx.beginPath();bgx.moveTo(w*.8,h*.28);bgx.lineTo(w*.8+Math.cos(a)*w,h*.28+Math.sin(a)*h*.2);bgx.lineTo(w*.8+Math.cos(a)*w,h*.28-Math.sin(a)*h*.2);bgx.fill();
}
function loopBg(ts){if(!paused)paintBg(ts||0);requestAnimationFrame(loopBg);}
requestAnimationFrame(loopBg);
try{mute=localStorage.getItem('tg.247.mute')==='1';}catch(e){}
function unlockAudio(){
  try{
    AC=AC||new(window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    const buf=AC.createBuffer(1,1,22050);const src=AC.createBufferSource();src.buffer=buf;src.connect(AC.destination);src.start(0);
    makeTickBuf();
    bgmArmed=true;
  }catch(e){}
}
const BGMFILES={
  coastal:"audio/coastal-midnight.m4a",
  paper:"audio/paper-walls-and-moonlight.m4a",
  land:"audio/where-the-land-ends.m4a",
  water:"audio/where-water-meets-sky.m4a"
};
const BGMVOL=0.22,BGMSPEED=0.22/2000;
let bgmPlayers=null,bgmId=null,bgmFade=null,bgmLast=0,bgmTarget={},bgmArmed=false;
function ensureBgm(){if(!bgmPlayers)bgmPlayers={};}
function hookBgm(a){
  if(!AC||a._gain)return;
  try{
    const src=AC.createMediaElementSource(a);
    const g=AC.createGain();
    g.gain.value=0;
    src.connect(g).connect(AC.destination);
    a._gain=g;
    a.volume=1;
  }catch(e){}
}
function bgmVol(a){return a._gain?a._gain.gain.value:a.volume;}
function setBgmVol(a,v){
  v=Math.max(0,Math.min(1,v));
  if(a._gain)a._gain.gain.value=v;
  else a.volume=v;
}
function playerFor(k){
  ensureBgm();
  if(bgmPlayers[k])return bgmPlayers[k];
  const a=new Audio();
  a.preload="none";
  a.loop=true;
  a.playsInline=true;
  a.setAttribute("playsinline","");
  a.volume=0;
  a.src=BGMFILES[k];
  bgmPlayers[k]=a;
  bgmTarget[k]=0;
  hookBgm(a);
  return a;
}
function trackFor(){
  if(typeof st==="undefined"||!st||!st.scene)return"paper";
  if(st.endTrack)return st.endTrack;
  const sc=S[st.scene];
  if(!sc)return"paper";
  let id=sc.bgm||"paper";
  if(sc.bgmCue)Object.keys(sc.bgmCue).map(Number).sort((x,y)=>x-y).forEach(k=>{if(k<=st.idx)id=sc.bgmCue[k];});
  return id;
}
function startFade(){
  if(!bgmFade){bgmLast=0;bgmFade=requestAnimationFrame(tickBgm);}
}
function applyTargets(want){
  ensureBgm();
  Object.keys(bgmPlayers).forEach(k=>{bgmTarget[k]=(k===want&&!mute&&!paused)?BGMVOL:0;});
  if(want&&!mute&&!paused){
    const a=playerFor(want);
    hookBgm(a);
    bgmTarget[want]=BGMVOL;
    if(a.paused)a.play().catch(()=>{});
  }
  startFade();
}
function playBgm(id){
  if(id)bgmId=id;
  const want=bgmId||"paper";
  if(!bgmArmed)return;
  if(mute||paused){applyTargets(null);return;}
  const a=playerFor(want);
  hookBgm(a);
  const go=()=>{if(bgmId!==want||mute||paused)return;applyTargets(want);};
  if(a.readyState>=2)go();
  else{
    a.addEventListener("canplay",go,{once:true});
    a.play().catch(()=>{});
    startFade();
  }
}
function tickBgm(now){
  if(!bgmPlayers){bgmFade=null;return;}
  if(!bgmLast)bgmLast=now;
  const dt=Math.min(50,now-bgmLast);bgmLast=now;
  const step=BGMSPEED*dt;
  let busy=false;
  Object.keys(bgmPlayers).forEach(k=>{
    const a=bgmPlayers[k],tgt=bgmTarget[k]||0;
    let v=bgmVol(a);
    if(Math.abs(v-tgt)<0.006){
      setBgmVol(a,tgt);
      if(tgt===0&&!a.paused&&a.readyState>=4)a.pause();
      return;
    }
    busy=true;
    setBgmVol(a,tgt>v?Math.min(tgt,v+step):Math.max(tgt,v-step));
    if(tgt>0&&a.paused)a.play().catch(()=>{});
  });
  bgmFade=busy?requestAnimationFrame(tickBgm):(bgmLast=0,null);
}
function hushBgm(){
  if(!bgmPlayers)return;
  applyTargets(null);
}
let tickBuf=null,tickBus=null,tickFlip=false;
function makeTickBuf(){
  if(!AC||tickBuf)return;
  const n=Math.max(32,Math.floor(AC.sampleRate*0.016));
  tickBuf=AC.createBuffer(1,n,AC.sampleRate);
  const d=tickBuf.getChannelData(0);
  for(let i=0;i<n;i++){
    const e=Math.pow(1-i/n,2.4);
    d[i]=(Math.random()*2-1)*0.28*e+Math.sin(2*Math.PI*1180*i/AC.sampleRate)*0.1*e;
  }
  tickBus=AC.createGain();
  tickBus.gain.value=.055;
  tickBus.connect(AC.destination);
}
function typeTick(ch){
  if(mute||paused||!AC||!ch||/\s|[、。！？…・「」『』（）―]/.test(ch))return;
  if(!/[ぁ-んァ-ン一-龯A-Za-z0-9]/.test(ch))return;
  tickFlip=!tickFlip;
  if(tickFlip)return;
  makeTickBuf();
  if(!tickBuf||!tickBus)return;
  try{
    const src=AC.createBufferSource();
    src.buffer=tickBuf;
    src.playbackRate.value=0.9+Math.random()*0.18;
    src.connect(tickBus);
    src.start();
  }catch(e){}
}
function setMute(v){mute=v;try{localStorage.setItem('tg.247.mute',mute?'1':'0');}catch(e){}const b=document.getElementById('btnMute');if(b)b.textContent=mute?'🔇':'♪';const d=document.getElementById('btnMuteDlg');if(d)d.textContent=mute?'音: オフ':'音: オン';if(!bgmPlayers)return;if(mute)hushBgm();else playBgm(bgmId||trackFor());}
function setPaused(on){paused=on;const dlg=document.getElementById('pauseDlg');if(on){try{dlg.showModal();}catch(e){}hushBgm();if(typing){clearInterval(typing);typing=null;if(el('txt'))el('txt').textContent=full;}}else{try{dlg.close();}catch(e){}try{if(AC&&AC.state==='suspended')AC.resume();}catch(e){}if(!mute)playBgm(bgmId||trackFor());}}
function bindTap(el,handler){if(!el)return;const fire=e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(err){}el.classList.add('is-pressed');if(navigator.vibrate)navigator.vibrate(12);unlockAudio();handler(e);};const release=()=>el.classList.remove('is-pressed');el.addEventListener('pointerdown',fire);el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('pointerleave',release);}
setMute(mute);
let lastTouchEnd=0;document.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouchEnd<=300)e.preventDefault();lastTouchEnd=now;},{passive:false});
document.addEventListener('touchmove',e=>{if(e.target.closest('[data-scrollable],.box'))return;e.preventDefault();},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault());document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('selectstart',e=>e.preventDefault());
document.addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('pointerdown',unlockAudio,{once:true});
document.addEventListener('keydown',unlockAudio,{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){setPaused(true);hushBgm();}});
window.addEventListener('pageshow',()=>{try{if(AC&&AC.state==='suspended'&&!paused)AC.resume();}catch(e){}});

const S = {
  prologue:{bgm:"coastal",art:["ferry"],place:"最終便の連絡船",mood:"sea",lines:[
    "夜の海は、昼間とはまるで別の生き物のようだった。",
    "小さな連絡船の客は、私と、網を膝に抱えた老人がひとりだけ。",
    "膝の上には、ひと月前に届いた封筒。差出人は「潮見荘　女将　田所ミツ」。",
    "――遥さんのお荷物を、ずっとお預かりしております。",
    "遥。五年前、この島から戻らなかった妹。",
    "船長｜汐見島まで、あと二十分ばい。",
    "ふと顔を上げると、網の老人がこちらを見ていた。目が合うと、すぐに窓の外へ視線を逸らした。"
  ],next:"arrive"},
  arrive:{bgm:"coastal",bgmCue:{2:"paper"},art:["pier", "woman"],cue:{"2": ["inn", "upwin"], "4": ["walls", "easel"]},place:"潮見荘",mood:"room",lines:[
    "桟橋の街灯の下に、小柄な老女が立っていた。",
    "女将｜遠いところを、ようおいでくださいました。田所です。",
    "通されたのは、二階の一番奥の部屋。",
    "女将｜遥さんが泊まっておられたお部屋です。あのまんまにしとります。",
    "窓辺にイーゼル。描きかけの夜の海に、細い光の筋が一本。",
    "女将｜それと、これを。『もし姉が来たら』と、帳場に置いていかれたもんです。"
  ],choice:{q:"小さく折りたたまれた紙。どうする？",opts:[
    {t:"すぐに読む",f:"accept",go:"c1a"},
    {t:"先に、あの夜のことを聞く",f:"truth",go:"c1b"}]}},
  c1a:{bgm:"paper",art:["walls", "easel", "letter"],place:"潮見荘",mood:"room",lines:[
    "見慣れた、少し右上がりの字だった。",
    "遥｜お姉ちゃん、ごめんね。私、ずっと疲れてた。",
    "遥｜私がどこに行ったのかは、書かないでおくね。書いたら、お姉ちゃんはそこで立ち止まってしまうから。",
    "遥｜この部屋の窓から、夜の海を見てほしい。それで、もういいよって思えたら、帰って。",
    "紙を持つ指が、震えていた。"
  ],next:"night"},
  c1b:{bgm:"paper",art:["walls", "easel"],place:"潮見荘",mood:"room",lines:[
    "私｜その前に教えてください。あの夜、遥は本当はどうしていたんですか。",
    "女将は、しばらく黙っていた。",
    "女将｜……笑うておられましたよ。明日は早起きして描きます、って。",
    "女将｜ただ、夜明け前に、裏の勝手口の鍵が開いとりました。わたしが、開けたまんまにしとったとです。",
    "私｜女将さんが？",
    "女将｜それ以上は、あの子のもんです。わたしが勝手に話してよかことじゃなか。",
    "私は紙を開かないまま、ポケットにしまった。答えは、自分で探すしかない。"
  ],next:"night"},
  night:{bgm:"paper",art:["walls", "easel"],place:"二階の奥の部屋",mood:"sea",lines:[
    "女将が下がり、部屋にひとりになった。",
    "灯りを消すと、窓の向こうで灯台がゆっくりと回っている。",
    "光が海を渡るたび、黒い水の上に一瞬だけ白い道が生まれ、消えた。",
    "キャンバスの絵と、同じだった。"
  ],choice:{q:"この夜を、どう過ごす？",opts:[
    {t:"窓から海を見る",f:"accept",go:"c2a"},
    {t:"灯台まで行く",f:"truth",go:"c2b"}]}},
  c2a:{bgm:"paper",art:["walls", "easel"],place:"二階の奥の部屋",mood:"sea",lines:[
    "窓を開けると、潮の匂いが流れこんできた。",
    "光の道は、何度も律儀に、この窓の下までやってくる。",
    "五年間、私は答えを探していた。答えさえわかれば、自分を許せる気がしていた。",
    "でも遥は、答えの代わりに、この景色を残した。",
    "私｜……届いてたよ、遥。私が、見ようとしなかっただけ。",
    "声に出したら、涙が止まらなくなった。"
  ],next:"morning"},
  c2b:{bgm:"land",art:["cliff"],cue:{"2": ["sheddoor", "doorcard"], "3": ["postcard"], "7": ["sheddoor"]},place:"岬の灯台",placeCue:{2:"物置小屋",3:"絵葉書",7:"物置小屋"},mood:"sea",lines:[
    "岬への坂道を、手探りで上った。",
    "灯台の真下。崖の向こうに、五年前、遥のスケッチブックが見つかった岩場が見えた。",
    "灯台の古い物置小屋の扉に、一枚の絵葉書が画鋲で留めてあった。",
    "夜の海に、一本の光の道。消印は二年前。知らない港町の名前。",
    "差出人はない。宛名は「汐見島　灯台守さま」。",
    "その筆づかいに、見覚えがあった。",
    "私｜……遥？",
    "私は絵葉書をそっと外して、ポケットにしまった。"
  ],next:"morning"},
  morning:{bgm:"water",art:["pier", "woman", "torch"],place:"朝の桟橋",mood:"dawn",lines:[
    "翌朝。桟橋のいちばん先に、女将がいた。",
    "懐中電灯は消えている。持ち方だけが、最終便の形のままだった。",
    "女将｜……あ。もう、朝でしたが。",
    "女将は自分の手を見て、小さく息を吐いた。",
    "女将｜今夜からは、ここには立たんとです。",
    "それ以上は言わず、消えた灯りを、私のほうへ出した。"
  ],choice:{q:"女将の手の、懐中電灯。",opts:[
    {t:"受け取る",f:"accept",go:"c3a"},
    {t:"断る",f:"cling",go:"c3b"}]}},
  c3a:{bgm:"water",art:["pier", "woman", "torch"],place:"朝の桟橋",mood:"dawn",lines:[
    "思ったより軽かった。指の腹に、小さな傷がある。",
    "女将は、空になった手を、一度だけ握った。"
  ],next:"judge"},
  c3b:{bgm:"water",art:["pier", "woman", "torch"],place:"朝の桟橋",mood:"dawn",lines:[
    "私は、手を出さなかった。",
    "私｜置いていってください。ここが空になると、困るんです。",
    "女将｜……あなた、それは。",
    "女将は何か言いかけて、やめた。懐中電灯を持つ手が、少しだけ震えていた。"
  ],next:"judge"},
  endA:{bgm:"water",art:["ferry"],place:"帰りの船",mood:"dawn",end:"A",lines:[
    "船は、朝の海を進んでいく。",
    "小さくなる桟橋で、女将が一度だけ手を振った。",
    "探しには行かない。答えも、もういらない。",
    "帰ったら、今夜だけは玄関の鍵を閉めずに眠ろう。母がそうしていたように。",
    "そして明日からは、ちゃんと閉めて眠ろう。",
    "光の道は見えない。けれど私は、その上を渡っている気がした。"
  ]},
  endB:{bgm:"water",art:["ferry"],cue:{"5": ["ferry", "postcard"], "6": ["ferry"]},place:"帰りの船",mood:"dawn",end:"B",lines:[
    "帰りの連絡船に、網を抱えた老人が乗っていた。昨夜と同じ人だ。",
    "私｜あの。五年前の夏、朝の漁に出られましたか。",
    "老人は長いこと、海を見ていた。",
    "老人｜わしは、何も見とらん。",
    "老人｜……ばってん、本土の港町に、腕のいい看板描きがおるらしか。魚屋の品書きが、えらいきれいかとげな。",
    "私はポケットの絵葉書を握りしめた。消印の町の名前を、口の中で繰り返す。",
    "五年間、遥は答えを残さなかった。",
    "だったら今度は、私が探しに行く番だ。"
  ]},
  endC:{bgm:"paper",bgmCue:{3:"coastal",5:"paper",8:"coastal"},art:["inn"],cue:{"3": ["pier", "woman", "flash"], "5": ["inn", "upwin"], "6": ["walls", "easel"], "8": ["pier", "woman", "flash"]},place:"潮見荘",mood:"sea",end:"C",lines:[
    "私は、島に残った。",
    "潮見荘の看板を磨き直し、女将から帳場の仕事を教わった。",
    "三年後、女将が亡くなり、宿は私ひとりになった。",
    "最終便が着くたびに、私は女将の懐中電灯を持って桟橋に立つ。",
    "降りてくるのは、いつも知らない人ばかりだ。",
    "ある夜、宿に戻ると、二階の一番奥の部屋に灯りがついていた。",
    "襖を開ける。誰もいない。イーゼルの絵だけが、ほんの少し、描き足されているように見えた。",
    "気のせいだ、と思うことにした。",
    "光の道は、今夜も誰も連れてこない。それでも私は、灯りを消さない。"
  ]},
  true1:{bgm:"paper",art:["walls", "easel"],cue:{"3": ["inn", "upwin"], "6": ["inn"]},place:"五年前　潮見荘",mood:"past",lines:[
    "五年前の夏。私――遥は、潮見荘の窓辺で、何も描けないキャンバスを眺めていた。",
    "窓の外で、灯台の光が海に道をつくる。――ああ、あれなら描ける。",
    "でも、描き上げたら帰らなきゃいけない。お姉ちゃんのいる、あのちゃんとした世界に。",
    "遥｜女将さん、これ、預かってもらえますか。",
    "女将｜……帰らんつもりね。",
    "遥｜帰ります。でも、家じゃないところに。一回くらい、自分で立ってみたいんです。",
    "ミツさんは何も言わず、裏の勝手口の鍵を開けておいてくれた。"
  ],next:"true2"},
  true2:{bgm:"land",bgmCue:{4:"paper"},art:["cliff"],cue:{"2": ["fisher"], "4": ["fisher", "inn", "upwin"]},place:"五年前　夜明け前の岬",mood:"past",lines:[
    "誰にも届かなかった絵のスケッチブックを、私は海に投げた。",
    "白い頁が一瞬ひらいて、黒い水に消えた。怖いくらい、身体が軽かった。",
    "桟橋では、網を積んだ漁船が待っていた。",
    "源さん｜乗るか。わしは何も見とらん。朝の漁に出ただけたい。",
    "振り返ると、潮見荘の二階の窓に、小さな灯りがともっていた。"
  ],next:"true3"},
  true3:{bgm:"water",art:["town"],cue:{"5": ["town", "postcard"]},place:"五年後　本土の港町",mood:"dawn",lines:[
    "私は港町で、看板を描いて暮らしている。名前も残らない、でも毎日誰かが見てくれる絵。",
    "二年前、灯台守さん宛てに一枚だけ絵葉書を出した。島に届けば、それでよかった。",
    "ある日、ミツさんから手紙が来た。",
    "女将｜お姉様がお見えになりました。朝はちゃんと、前を向いて船に乗られましたよ。",
    "私は、自分で立っていたつもりだった。でも本当は、ずっと誰かの灯りの中に立っていたんだ。",
    "その夜、私は絵葉書を描いた。夜の海に一本の光の道。右下に小さく「H」とだけ入れて。"
  ],next:"true4"},
  true4:{bgm:"paper",art:["walls", "curtain", "postcard"],cue:{"2": ["walls", "curtain", "sillflash"]},place:"秋の終わり　姉の部屋",mood:"warm",end:"D",lines:[
    "郵便受けに、差出人のない絵葉書が一枚。",
    "夜の海に、一本の光の道。水平線から、こちらの足もとへ。右下に、小さな「H」。",
    "私は棚の懐中電灯を手に取り、窓辺にそっと置いた。",
    "探しには行かない。今は、まだ。",
    "私｜おかえり、は、まだとっとくね。"
  ]}
};
const ENDMETA={
  A:{name:"受容エンド",sub:"光の道の上",line:"答えのない朝を、渡っていく。",mood:"sunrise",art:["ferry","sun"],view:"leave",place:"帰りの船",bgm:"water"},
  B:{name:"追跡エンド",sub:"港町の看板",line:"今度は、私が迎えに行く番。",mood:"dawn",art:["town","walker"],view:"far",place:"本土の港町",bgm:"water"},
  C:{name:"灯守りエンド",sub:"桟橋の灯り",line:"灯りは、今夜も消えない。",mood:"deep",art:["pier","woman","flash"],view:"pier",place:"夜の桟橋",bgm:"coastal"},
  D:{name:"真エンド",sub:"光の道の、向こう側",line:"おかえり、は、まだとっとくね。",mood:"warm",art:["walls","curtain","sillflash","postcard2","farlight"],view:"base",place:"姉の部屋",bgm:"paper"}
};
const ENDS={A:"受容エンド「光の道の上」",B:"追跡エンド「港町の看板」",C:"灯守りエンド「桟橋の灯り」",D:"真エンド「光の道の、向こう側」"};
const ENDMARK={A:"受容",B:"追跡",C:"灯守",D:"真"};
const MOODS={
  sea:{sky:"#0F2140",sea:"#0A1A30",cape:"#081426",beam:true,stars:true},
  room:{sky:"#14264A",sea:"#0C1C34",cape:"#081426",beam:true,stars:true},
  dawn:{sky:"#9FB6C9",sea:"#6F8BA3",cape:"#3E5266",beam:false},
  past:{sky:"#3B3530",sea:"#2A2622",cape:"#1C1916",beam:true,stars:true},
  sunrise:{sky:"#E4C4A2",sea:"#7E93A8",cape:"#4A5A6E",beam:false},
  deep:{sky:"#08142A",sea:"#050E1E",cape:"#030A16",beam:true,stars:true},
  warm:{sky:"#4A3A52",sea:"#2E2A44",cape:"#1E1B30",beam:true}
};
const KEY="shiomiso-cleared";
const KEY2="tg.247.cleared";
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let cleared=new Set();
try{const v=localStorage.getItem(KEY2)||localStorage.getItem(KEY);if(v)cleared=new Set(JSON.parse(v));}catch(e){}
function save(){try{const s=JSON.stringify([...cleared]);localStorage.setItem(KEY,s);localStorage.setItem(KEY2,s);}catch(e){}}

const box=document.getElementById("box");
const el=id=>document.getElementById(id);
let reading=false;
document.addEventListener("keydown",e=>{
  unlockAudio();
  if(e.key==="Escape"||e.key==="p"||e.key==="P"){e.preventDefault();setPaused(!paused);return;}
  if(paused||!reading||e.target.tagName==="BUTTON")return;
  if(e.key==="Enter"||e.key===" "){e.preventDefault();advance();}
  if(e.key==="Shift")dashHold=true;
});
document.addEventListener("keyup",e=>{if(e.key==="Shift")dashHold=false;});
let st={scene:null,idx:0,flags:{accept:0,truth:0,cling:0}},typing=null,full="";

function setMood(m,place){
  const c=MOODS[m]||MOODS.sea;
  el("sky").setAttribute("fill",c.sky);el("sea").setAttribute("fill",c.sea);el("cape").setAttribute("fill",c.cape);
  el("beamg").style.display=c.beam?"":"none";el("road").style.display=c.beam?"":"none";
  el("lamp").style.display=c.beam?"":"none";el("lantern").setAttribute("fill",c.beam?"#F4E4A8":"#8FA3B6");el("stars").style.display=c.stars?"":"none";
  el("place").textContent=place||"";
}
const VIEWS={
  base:"none",
  ahead:"translate(380px,222px) scale(1.3) translate(-520px,-222px)",
  pier:"translate(130px,222px) scale(-0.8,0.8) translate(-520px,-222px)",
  leave:"translate(110px,222px) scale(0.55) translate(-520px,-222px)",
  far:"translate(600px,222px) scale(0.5) translate(-520px,-222px)"
};
function setArt(a,force){
  const v=force||a.includes("pier")?"pier":a.includes("ferry")?(st.scene&&st.scene.startsWith("end")?"leave":"ahead"):a.includes("town")?"far":"base";
  el("lh").style.transform=VIEWS[v];document.querySelectorAll(".art").forEach(g=>g.classList.toggle("show",a.includes(g.id)));}
function artFor(sc,idx){let a=sc.art||[];if(sc.cue)Object.keys(sc.cue).map(Number).sort((x,y)=>x-y).forEach(k=>{if(k<=idx)a=sc.cue[k];});return a;}
function esc(s){return s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}

const sceneSvg=document.querySelector("#scene svg");
function setSceneAlign(titleOn){
  if(sceneSvg)sceneSvg.setAttribute("preserveAspectRatio",titleOn?"xMinYMid slice":"xMidYMid slice");
}
function title(){
  reading=false;st.scene=null;st.endTrack=null;
  el("endcard").classList.remove("show");
  wrap.classList.add("is-title");box.classList.add("is-title");
  setSceneAlign(true);
  setMood("sea","汐見島");setArt(["inn","upwin"]);
  if(bgmArmed)playBgm("paper");
  else bgmId="paper";
  const unlocked=["A","B","C"].every(k=>cleared.has(k));
  const rec=Object.keys(ENDS).map(k=>{
    const on=cleared.has(k);
    return `<li class="${on?"on":"off"}"><span class="lamp"></span><span class="lab">${ENDMARK[k]}</span></li>`;
  }).join("");
  box.innerHTML=`<div class="title-screen">
  <div class="title-copy">
    <p class="kicker">汐見島　最終便</p>
    <h1 class="title">潮見荘</h1>
    <p class="sub">五年前、妹は島から戻らなかった。<br>夜の海を渡り、あの旅館へ。</p>
    <ul class="records" aria-label="既読の灯り">${rec}</ul>
  </div>
  <div class="title-actions">
    <button type="button" class="primary" id="start">はじめる</button>
    <button type="button" id="truebtn" ${unlocked?"":"disabled"}>${unlocked?"真エンドを読む":"真エンド"}</button>
    ${unlocked?"":'<p class="true-hint">三つの灯りが揃うと開く</p>'}
    <button type="button" class="ghost" id="reset">記録を消す</button>
  </div>
  </div>`;
  bindTap(el("start"),()=>{unlockAudio();st.flags={accept:0,truth:0,cling:0};go("prologue");});
  bindTap(el("truebtn"),()=>{if(el("truebtn").disabled)return;unlockAudio();go("true1");});
  bindTap(el("reset"),()=>{cleared=new Set();save();title();});
  el("start").focus();
}
function go(id){
  unlockAudio();
  wrap.classList.remove("is-title");box.classList.remove("is-title");
  setSceneAlign(false);
  st.scene=id;st.idx=0;st.endTrack=null;const s=S[id];setMood(s.mood,s.place);
  box.innerHTML=`<div class="speaker" id="spk"></div><div class="text" id="txt"></div><div class="hint" id="hint">タップで次へ</div>`;
  bindTap(el("txt"),advance);
  reading=true;
  show();
}
function show(){
  const sc=S[st.scene];
  if(!sc||!sc.lines)return;
  setArt(artFor(sc,st.idx));
  let place=sc.place||"";
  if(sc.placeCue)Object.keys(sc.placeCue).map(Number).sort((x,y)=>x-y).forEach(k=>{if(k<=st.idx)place=sc.placeCue[k];});
  el("place").textContent=place;
  playBgm(trackFor());
  const raw=sc.lines[st.idx];
  if(typeof raw!=='string')return;
  const p=raw.indexOf("｜");
  const spk=el("spk"),t=el("txt");
  if(!spk||!t)return;
  spk.textContent=p>0?raw.slice(0,p):"";
  full=p>0?"「"+raw.slice(p+1)+"」":raw;
  if(reduce||dashHold){t.textContent=full;return;}
  let i=0;t.textContent="";clearInterval(typing);
  typing=setInterval(()=>{
    i++;
    t.textContent=full.slice(0,i);
    typeTick(full.charAt(i-1));
    if(i>=full.length){clearInterval(typing);typing=null;}
  },32);
}
function advance(){
  if(paused||!reading)return;
  if(typing){clearInterval(typing);typing=null;if(el("txt"))el("txt").textContent=full;return;}
  const s=S[st.scene];
  if(!s||!s.lines)return;
  if(st.idx<s.lines.length-1){st.idx++;show();return;}
  if(s.choice)return choose(s.choice);
  if(s.end)return ending(s.end);
  if(s.next==="judge")return go(judge());
  go(s.next);
}
function judge(){
  const f=st.flags;
  if(f.cling>0&&f.accept<=1)return"endC";
  if(f.truth>=2)return"endB";
  return"endA";
}
function choose(c){
  el("spk").textContent="";
  el("hint").remove();
  reading=false;
  el("txt").textContent=c.q;
  const wrap=document.createElement("div");wrap.className="choices";
  c.opts.forEach(o=>{const b=document.createElement("button");b.textContent=o.t;
    bindTap(b,()=>{st.flags[o.f]++;go(o.go);});wrap.appendChild(b);});
  box.appendChild(wrap);wrap.firstChild.focus();
}
function ending(k){
  reading=false;
  wrap.classList.remove("is-title");box.classList.remove("is-title");
  setSceneAlign(false);
  const m=ENDMETA[k];
  st.endTrack=m.bgm||"paper";
  setMood(m.mood,m.place);setArt(m.art,m.view);
  playBgm(st.endTrack);
  const ec=el("endcard");
  ec.innerHTML=`<div class="en">${m.name}</div><div class="es">「${m.sub}」</div><div class="el">${m.line}</div>`;
  ec.classList.remove("show");void ec.offsetWidth;ec.classList.add("show");
  const first=!cleared.has(k);cleared.add(k);save();
  const unlockedNow=k!=="D"&&["A","B","C"].every(x=>cleared.has(x));
  box.innerHTML=`<div class="speaker">終</div><div class="endtitle">${esc(ENDS[k])}</div>
  <p class="sub">${first?"このエンドを記録しました。":"記録済みのエンドです。"}${unlockedNow?"<br>3つのエンドを見届けました。真エンドが解放されています。":""}</p>
  <div class="row"><button class="primary" id="back">タイトルへ戻る</button></div>`;
  bindTap(el("back"),()=>title());el("back").focus();
}
title();
bindTap(document.getElementById('btnNext'),()=>{
  unlockAudio();
  if(paused)return;
  if(!reading){
    if(document.getElementById('start')){st.flags={accept:0,truth:0,cling:0};go("prologue");return;}
    if(document.getElementById('back')){title();return;}
    return;
  }
  advance();
});
document.getElementById('btnDash').addEventListener('pointerdown',e=>{e.preventDefault();try{e.currentTarget.setPointerCapture(e.pointerId);}catch(err){}e.currentTarget.classList.add('is-pressed');dashHold=true;if(typing){clearInterval(typing);typing=null;if(el('txt'))el('txt').textContent=full;}});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>document.getElementById('btnDash').addEventListener(ev,()=>{document.getElementById('btnDash').classList.remove('is-pressed');dashHold=false;}));
bindTap(document.getElementById('btnMute'),()=>setMute(!mute));
bindTap(document.getElementById('btnPause'),()=>setPaused(true));
bindTap(document.getElementById('btnResume'),()=>setPaused(false));
bindTap(document.getElementById('btnMuteDlg'),()=>setMute(!mute));
bindTap(document.getElementById('btnQuit'),()=>{setPaused(false);title();});
