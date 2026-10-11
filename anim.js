(function(){
  var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small=matchMedia('(max-width: 760px)').matches;
  if(rm)return;
  // AOS on section heads + content blocks
  if(window.AOS){
    var n=0;
    document.querySelectorAll('main section:not(.hero) .section-head, main section:not(.hero) .wrap > *:not(.section-head)').forEach(function(el){
      el.setAttribute('data-aos', el.classList.contains('section-head')?'fade-up':(n++%2?'fade-left':'fade-right'));
      if(small)el.setAttribute('data-aos','fade-up');
    });
    AOS.init({once:true,duration:750,easing:'ease-out-cubic',offset:60,disable:false});
  }
  // Lenis smooth scroll (desktop only; native on touch)
  if(window.Lenis && !small){
    var lenis=new Lenis({lerp:.1,smoothWheel:true});
    function raf(t){lenis.raf(t);requestAnimationFrame(raf)}requestAnimationFrame(raf);
    if(window.ScrollTrigger)lenis.on('scroll',ScrollTrigger.update);
    document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href');if(id.length>1&&document.querySelector(id)){e.preventDefault();lenis.scrollTo(id,{offset:-70});}});});
  }
  // GSAP hero reveal + count-up of existing number
  if(window.gsap){
    if(window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
    var tl=gsap.timeline({defaults:{ease:'power3.out'}});
    tl.from('.hero .eyebrow',{y:16,opacity:0,duration:.5})
      .from('.hero h1',{y:40,opacity:0,duration:.8},'-=.2')
      .from('.hero .lead',{y:20,opacity:0,duration:.6},'-=.45')
      .from('.hero-ctas .btn',{y:16,opacity:0,stagger:.12,duration:.5},'-=.35')
      .from('.hero-points li',{x:-12,opacity:0,stagger:.08,duration:.4},'-=.3')
      .from('.ai-card',{y:40,opacity:0,rotate:2,duration:.9},'-=1.1');
    document.querySelectorAll('.about li b').forEach(function(b){
      var m=b.textContent.match(/^(\d+)(\s*yrs)$/);if(!m)return;
      var o={v:0},end=+m[1];
      gsap.to(o,{v:end,duration:1.6,ease:'power2.out',scrollTrigger:{trigger:b,start:'top 90%',once:true},onUpdate:function(){b.textContent=Math.round(o.v)+m[2];}});
    });
  }
})();
