(function () {
  var rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (rm || !("IntersectionObserver" in window)) return;
  var nodes = document.querySelectorAll(".about li b");
  if (!nodes.length) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      var b = en.target;
      var m = (b.textContent || "").match(/^(\d+)(\s*yrs)$/);
      if (!m) return;
      var end = +m[1];
      var t0 = 0;
      function step(now) {
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / 1100);
        var eased = 1 - Math.pow(1 - p, 2);
        b.textContent = Math.round(end * eased) + m[2];
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  nodes.forEach(function (b) { io.observe(b); });
})();
