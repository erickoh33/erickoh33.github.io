/* Shared Titan News renderer. Pages set <body data-page="article" data-slug="..."> or data-page="archive". */
(function(){
const P=window.TITAN_POSTS||[],root=document.getElementById('app'),page=document.body.dataset.page;
const q=new URLSearchParams(location.search).get('lang');
let lang=q||localStorage.getItem('titanLang')||'en';if(lang!=='bm')lang='en';
const L={en:{back:'← Back to news',home:'Titan home',read:'Read',title:'Titan News',sub:'Race reports, results and club stories.',trial:'Book a free trial',notfound:'Post not found.'},
 bm:{back:'← Kembali ke berita',home:'Laman utama Titan',read:'Baca',title:'Berita Titan',sub:'Laporan kejohanan, keputusan dan cerita kelab.',trial:'Tempah sesi percuma',notfound:'Berita tidak dijumpai.'}};
const WA='https://wa.me/60122864815?text=Hi%20Titan!%20I%27d%20like%20to%20book%20a%20free%20trial.';
const base=page==='article'?'../':'';
function article(p){const t=p[lang],k=p.kl;document.title=t.title+' | Titan Finswimming Club';
 let h=`<a class="back" href="${base}?lang=${lang}">${L[lang].back}</a><div class="fade"><span class="tag">${t.tag}</span><span class="date">${p.date[lang]}</span><h1>${t.title}</h1><p class="lede">${t.intro}</p>`;
 if(p.op&&t.opList){const o=p.op;h+=`<section class="kl op"><h2>${t.opTitle}</h2><p>${t.opIntro}</p>${t.nr?`<div class="nr">${t.nr}</div>`:''}<div class="chips"><div class="chip g"><b>${o.gold}</b>${t.chips[0]}</div><div class="chip s"><b>${o.silver}</b>${t.chips[1]}</div><div class="chip b"><b>${o.bronze}</b>${t.chips[2]}</div><div class="chip p"><b>${o.pb}</b>${t.chips[3]}</div></div><ul class="sw">${t.opList.map(x=>`<li><strong>${x[0]}</strong>${x[1]}</li>`).join('')}</ul>${t.opNote?`<p class="note">${t.opNote}</p>`:''}</section>`}
 if(k)h+=`<section class="kl"><h2>${t.klTitle}</h2><p>${t.klIntro}</p><div class="chips"><div class="chip g"><b>${k.gold}</b>${t.chips[0]}</div><div class="chip s"><b>${k.silver}</b>${t.chips[1]}</div><div class="chip b"><b>${k.bronze}</b>${t.chips[2]}</div><div class="chip p"><b>${k.pb}</b>${t.chips[3]}</div></div><ul class="sw">${t.klList.map(x=>`<li><strong>${x[0]}</strong>${x[1]}</li>`).join('')}</ul></section>`;
 if(t.tm)h+=`<section class="tm"><h2>${t.tmTitle}</h2><p>${t.tmIntro}</p><ul class="sw">${t.tm.map(x=>`<li><strong>${x[0]}</strong><span>${x[1]}</span></li>`).join('')}</ul>${t.soon?`<span class="soon">${t.soon}</span>`:''}</section>`;
 if(t.outro)h+=`<p class="outro">${t.outro}</p>`;
 h+=`<div class="cta"><p>${t.cta}</p><a class="btn" href="${WA}" target="_blank" rel="noopener">${L[lang].trial}</a></div></div>`;return h}
function archive(){document.title=L[lang].title+' | Titan Finswimming Club';
 return `<a class="back" href="../?lang=${lang}#news">← ${L[lang].home}</a><div class="fade"><h1>Titan <em>${lang==='bm'?'Berita':'News'}</em></h1><p>${L[lang].sub}</p><div class="list">${P.map(p=>{const t=p[lang];return `<a class="nitem" href="${p.slug}/?lang=${lang}"><span class="meta"><span class="tag">${t.tag}</span><span class="date">${p.date[lang]}</span></span><span class="nt"><b>${t.title}</b><span>${t.teaser}</span></span><span class="go">${L[lang].read} →</span></a>`}).join('')}</div></div>`}
function medals(el){const re=/\b(gold|silver|bronze|emas|perak|gangsa)(s?)\b/gi,w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),ns=[];while(w.nextNode())ns.push(w.currentNode);ns.forEach(n=>{if(!re.test(n.nodeValue))return;re.lastIndex=0;const f=document.createElement('span');f.innerHTML=n.nodeValue.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(re,(m,a)=>`<span class="m-${({emas:'gold',perak:'silver',gangsa:'bronze'})[a.toLowerCase()]||a.toLowerCase()}">${m}</span>`);n.replaceWith(...f.childNodes)})}
function render(){document.documentElement.lang=lang==='bm'?'ms':'en';
 if(page==='article'){const p=P.find(x=>x.slug===document.body.dataset.slug);root.innerHTML=p?article(p):`<p>${L[lang].notfound}</p>`;medals(root)}else root.innerHTML=archive();
 document.querySelectorAll('.lang button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.lang===lang));
 const u=new URL(location);u.searchParams.set('lang',lang);history.replaceState(null,'',u)}
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;localStorage.setItem('titanLang',lang);render()});
render();})();
