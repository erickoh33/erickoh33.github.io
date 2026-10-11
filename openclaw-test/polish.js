(function(){
  // Scroll progress bar (top) - purely visual, additive.
  var bar=document.createElement('div');bar.id='fx-progress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);
  var doc=document.documentElement,ticking=false;
  function upd(){ticking=false;var h=doc.scrollHeight-innerHeight;bar.style.width=(h>0?(doc.scrollTop/h*100):0)+'%';}
  function req(){if(!ticking){ticking=true;requestAnimationFrame(upd);}}
  addEventListener('scroll',req,{passive:true});addEventListener('resize',req);upd();
  // Active nav link highlight for in-page anchors.
  var links=[].slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var secs=links.map(function(a){return document.querySelector(a.getAttribute('href'));});
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;
      var i=secs.indexOf(e.target);if(i<0)return;
      links.forEach(function(l){l.classList.remove('active')});links[i].classList.add('active');});},
      {rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(function(s){if(s)io.observe(s)});
  }
})();
