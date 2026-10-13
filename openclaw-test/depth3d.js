/* depth3d.js v2 - BOLD Three.js hero (particle galaxy + floating neon geometry, mouse parallax), GSAP 3D reveals, deep tilt+shine. Honours reduced motion. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js";
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SMALL = matchMedia("(max-width: 760px)").matches;
const FINE = matchMedia("(hover:hover) and (pointer:fine)").matches;
const mk=(c,cls)=>{const d=document.createElement("div");d.className=cls;d.setAttribute("aria-hidden","true");document.body.appendChild(d);return d;};
mk(0,"d3-mesh");["a","b","c"].forEach(c=>mk(0,"d3-blob "+c));
const bar=mk(0,"d3-progress");
const hero = document.querySelector(".hero");
let mx=0,my=0,tmx=0,tmy=0;
if(FINE) addEventListener("pointermove",e=>{tmx=e.clientX/innerWidth-.5;tmy=e.clientY/innerHeight-.5;},{passive:true});
if (hero) {
  const canvas = document.createElement("canvas"); canvas.id="d3-canvas"; canvas.setAttribute("aria-hidden","true"); hero.prepend(canvas);
  try {
    const r = new THREE.WebGLRenderer({canvas, antialias:!SMALL, alpha:true, powerPreference:SMALL?"low-power":"high-performance"});
    const MAX_PR = SMALL ? 1 : 1.5, MIN_PR = SMALL ? 1 : 0.4;
    let pr = Math.min(devicePixelRatio, MAX_PR);
    const UP_CAP = Math.min(MAX_PR, devicePixelRatio);
    r.setPixelRatio(pr);
    const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x03141F,.045);
    const cam=new THREE.PerspectiveCamera(55,1,.1,200); cam.position.set(0,0,12);
    scene.add(new THREE.AmbientLight(0xffffff,.35));
    const L=[[0x2EF2D6,6,3,6],[0xFF6FB5,-6,-2,5],[0x8B7CFF,0,6,-4]].map(([c,x,y,z])=>{const l=new THREE.PointLight(c,90,40);l.position.set(x,y,z);scene.add(l);return l;});
    // glowing sprite texture
    const tc=document.createElement("canvas");tc.width=tc.height=64;const cx=tc.getContext("2d");const gr=cx.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.25,"rgba(255,255,255,.6)");gr.addColorStop(1,"rgba(255,255,255,0)");cx.fillStyle=gr;cx.fillRect(0,0,64,64);
    const glow=new THREE.CanvasTexture(tc);
    // particle galaxy (spiral arms, 3 neon colours)
    const N=SMALL?900:6000, pos=new Float32Array(N*3), col=new Float32Array(N*3);
    const pal=[new THREE.Color(0x2EF2D6),new THREE.Color(0xFF6FB5),new THREE.Color(0x8B7CFF)];
    for(let i=0;i<N;i++){const arm=i%3, rad=Math.pow(Math.random(),.6)*14, ang=arm/3*Math.PI*2+rad*.45, s=.9;
      pos[i*3]=Math.cos(ang)*rad+(Math.random()-.5)*s*rad*.35; pos[i*3+1]=(Math.random()-.5)*1.6*(1-rad/16)+(Math.random()-.5)*.6; pos[i*3+2]=Math.sin(ang)*rad+(Math.random()-.5)*s*rad*.35;
      const c=pal[arm].clone().lerp(new THREE.Color(0xffffff),Math.max(0,1-rad/3)*.7); col.set([c.r,c.g,c.b],i*3);}
    const pg=new THREE.BufferGeometry(); pg.setAttribute("position",new THREE.BufferAttribute(pos,3)); pg.setAttribute("color",new THREE.BufferAttribute(col,3));
    const galaxy=new THREE.Points(pg,new THREE.PointsMaterial({size:SMALL?.16:.13,map:glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
    galaxy.rotation.x=.9; galaxy.position.set(SMALL?0:3,SMALL?3:-.5,-6); scene.add(galaxy);
    // star dust
    const M=SMALL?260:1200, sp=new Float32Array(M*3); for(let i=0;i<M*3;i++) sp[i]=(Math.random()-.5)*60;
    const sg=new THREE.BufferGeometry(); sg.setAttribute("position",new THREE.BufferAttribute(sp,3));
    const dust=new THREE.Points(sg,new THREE.PointsMaterial({size:.08,map:glow,color:0xCFFFF7,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending})); scene.add(dust);
    // hero centrepiece: neon knot + wire shell + rings
    const hg=new THREE.Group(); scene.add(hg);
    const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(1.5,.45,SMALL?90:200,SMALL?10:24),new THREE.MeshStandardMaterial({color:0x0E6E6A,metalness:.8,roughness:.15,emissive:0x0a3d4a,emissiveIntensity:.6}));
    const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(3.1,1),new THREE.MeshBasicMaterial({color:0x2EF2D6,wireframe:true,transparent:true,opacity:.28,blending:THREE.AdditiveBlending}));
    const rings=[0xFF6FB5,0x2EF2D6,0x8B7CFF].map((c,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(3.8+i*.55,.025,8,128),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.85,blending:THREE.AdditiveBlending}));m.rotation.set(1.1+i*.4,i*.6,0);hg.add(m);return m;});
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color:0x2EF2D6,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false})); halo.scale.setScalar(11);
    hg.add(halo,knot,shell);
    // floating geometry swarm (parallax depth layers)
    const shapes=[new THREE.OctahedronGeometry(.45),new THREE.TetrahedronGeometry(.5),new THREE.BoxGeometry(.55,.55,.55),new THREE.IcosahedronGeometry(.4)];
    const floats=[]; const F=SMALL?8:24;
    for(let i=0;i<F;i++){const c=pal[i%3]; const m=new THREE.Mesh(shapes[i%4],i%2?new THREE.MeshStandardMaterial({color:c,metalness:.6,roughness:.2,emissive:c,emissiveIntensity:.35}):new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:.7}));
      const d=Math.random(); m.position.set((Math.random()-.5)*26,(Math.random()-.5)*14,-2-d*14+4); m.userData={d:1.4-d,s:.3+Math.random()*.8,o:Math.random()*6.28,y:m.position.y}; m.scale.setScalar(.6+Math.random()*1.2); scene.add(m); floats.push(m);}
    function size(){const w=hero.clientWidth,h=hero.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
      hg.position.set(SMALL?0:4.2,SMALL?3.4:.2,0); hg.scale.setScalar(SMALL?.62:1);}
    size(); addEventListener("resize",size);
    let visible=true; new IntersectionObserver(([e])=>visible=e.isIntersecting).observe(hero);
    const clock=new THREE.Clock();
    // Phones render the hero at ~30fps instead of 60 to halve GPU/CPU work; visually identical for a slow ambient scene.
    const MIN_DT = SMALL ? 32 : 0;
    // Adaptive resolution: when frames run slow (weak GPU, software WebGL, heavy load) the
    // internal render scale drops and recovers when there is headroom again. Capable machines
    // keep full quality; weak ones stay smooth instead of stuttering.
    let lastRender = 0, lastFrame = 0, ema = 16.7, lastDown = 0, lastUp = 0;
    function frame(){const now=performance.now(); if(MIN_DT && now-lastRender<MIN_DT) return;
      const dtMs = lastFrame ? now-lastFrame : 16.7; lastFrame = now; lastRender = now;
      const t=clock.getElapsedTime(); mx+=(tmx-mx)*.05; my+=(tmy-my)*.05;
      const sy=Math.min(scrollY/innerHeight,1.2);
      knot.rotation.set(t*.25+my*1.2,t*.35+mx*1.6,0); shell.rotation.set(-t*.1,-t*.15+mx,0);
      rings.forEach((m,i)=>{m.rotation.z=t*(.3+i*.15)*(i%2?-1:1);});
      halo.material.opacity=.28+Math.sin(t*1.5)*.08;
      galaxy.rotation.y=t*.05; dust.rotation.y=t*.01+mx*.2; dust.rotation.x=my*.1;
      floats.forEach(m=>{const u=m.userData; m.rotation.x+=.004*u.s*3; m.rotation.y+=.006*u.s*3; m.position.y=u.y+Math.sin(t*u.s+u.o)*.5+sy*u.d*4; m.position.x+=(-mx*u.d*.06);});
      L[0].position.x=6+Math.sin(t)*2; L[1].position.y=-2+Math.cos(t*.8)*2;
      cam.position.x+=(mx*2.5-cam.position.x)*.05; cam.position.y+=(-my*1.6-cam.position.y)*.05; cam.position.z=12+sy*5; cam.lookAt(0,0,-2);
      hg.rotation.x=sy*.8; r.render(scene,cam);
      ema = ema*.85 + dtMs*.15;
      if (ema > 24 && pr > MIN_PR && now-lastDown > 400) {
        pr = Math.max(MIN_PR, pr - 0.15); r.setPixelRatio(pr); size(); lastDown = now; lastUp = now;
      } else if (ema < 11 && pr < UP_CAP && now-lastUp > 4000) {
        pr = Math.min(UP_CAP, pr + 0.15); r.setPixelRatio(pr); size(); lastUp = now;
      }}
    if(RM) frame(); else r.setAnimationLoop(()=>{if(visible && !document.hidden) frame();});
  } catch(e){ canvas.remove(); }
}
if (!RM) {
  addEventListener("scroll",()=>{const h=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${h>0?scrollY/h:0})`;},{passive:true});
  const go=()=>{const gsap=window.gsap; if(!gsap||!window.ScrollTrigger) return setTimeout(go,150); gsap.registerPlugin(ScrollTrigger);
    gsap.to(".hero .hero-grid",{yPercent:-25,opacity:.15,ease:"none",scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:true}});
    gsap.to(".hero .ai-card",{yPercent:-20,rotateY:-14,rotateX:8,ease:"none",scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:true}});
    gsap.utils.toArray("section h2").forEach(h=>gsap.from(h,{rotateX:-90,y:50,z:-120,opacity:0,transformOrigin:"50% 100%",duration:1.1,ease:"expo.out",scrollTrigger:{trigger:h,start:"top 88%"}}));
    gsap.utils.toArray("section:not(.hero)").forEach(s=>{const cards=s.querySelectorAll(".card,.calc-card"); if(!cards.length) return;
      gsap.from(cards,{rotateY:SMALL?0:(i)=>i%2?28:-28,rotateX:SMALL?18:12,z:SMALL?-60:-260,y:SMALL?40:80,opacity:0,duration:1.1,stagger:.09,ease:"expo.out",transformPerspective:1100,clearProps:"transform,opacity",scrollTrigger:{trigger:s,start:"top 80%"}});});
    if(!SMALL) gsap.utils.toArray(".d3-blob").forEach((b,i)=>gsap.to(b,{yPercent:-(60+i*40),ease:"none",scrollTrigger:{trigger:document.body,start:"top top",end:"bottom bottom",scrub:true}}));
    if(!SMALL) gsap.utils.toArray("section:not(.hero) img").forEach(im=>gsap.fromTo(im,{yPercent:8},{yPercent:-8,ease:"none",scrollTrigger:{trigger:im,scrub:true}}));
  }; go();
  if (FINE) document.querySelectorAll(".card,.calc-card,.hero .ai-card").forEach(c=>{c.classList.add("d3-tilt");
    c.addEventListener("pointermove",e=>{const b=c.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;
      c.style.setProperty("--mx",x*100+"%");c.style.setProperty("--my",y*100+"%");
      c.style.transform=`perspective(800px) rotateX(${-(y-.5)*18}deg) rotateY(${(x-.5)*22}deg) translateZ(24px) scale(1.03)`;});
    c.addEventListener("pointerleave",()=>c.style.transform="");});
}
