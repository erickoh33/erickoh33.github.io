(function(){
  var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small=matchMedia('(max-width: 760px)').matches;
  var iOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var damp=(small||iOS)?0.5:1; // gentler effect on phones
  // Reveal on scroll
  if(!rm&&'IntersectionObserver' in window){
    document.documentElement.classList.add('js-reveal');
    var els=document.querySelectorAll('main section:not(.hero) .section-head, main section:not(.hero) .wrap > *:not(.section-head)');
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    els.forEach(function(el){el.classList.add('rv');io.observe(el);});
  }
  if(rm)return;
  var layers=[].slice.call(document.querySelectorAll('[data-speed]'));
  var ticking=false,vh=innerHeight;
  function update(){
    ticking=false;
    for(var i=0;i<layers.length;i++){
      var l=layers[i],box=l.parentNode.getBoundingClientRect();
      if(box.bottom<-100||box.top>vh+100)continue;
      var c=box.top+box.height/2-vh/2;
      l.style.transform='translate3d(0,'+(-c*parseFloat(l.dataset.speed)*damp).toFixed(1)+'px,0)';
    }
  }
  function req(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',function(){vh=innerHeight;req();});
  update();
})();
