/* fx.js - extra motion layer: progress bar, active nav, hero dot network,
   self-drawing icons, steps line, card tilt + spotlight, fail-safe. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  function mq(q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } }
  var RM = mq("(prefers-reduced-motion: reduce)");
  var FINE = mq("(hover: hover) and (pointer: fine)");
  var SMALL = mq("(max-width: 760px)");
  var main = doc.querySelector("main") || doc.body;
  var TAU = Math.PI * 2;
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  if (!RM) root.classList.add("mx-ready");
  /* ---------------------------------------------------------
     1. Reading progress bar
     --------------------------------------------------------- */
  (function progress() {
    var bar = el("div", "mx-progress");
    bar.setAttribute("aria-hidden", "true");
    var fill = el("i");
    bar.appendChild(fill);
    doc.body.appendChild(bar);
    var raf = 0;
    function paint() {
      raf = 0;
      var h = root.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.pageYOffset / h) * 100 : 0;
      fill.style.width = Math.max(0, Math.min(100, p)) + "%";
    }
    function soon() { if (!raf) raf = requestAnimationFrame(paint); }
    window.addEventListener("scroll", soon, { passive: true });
    window.addEventListener("resize", soon);
    paint();
  })();

  /* ---------------------------------------------------------
     2. Header state + active nav link
     --------------------------------------------------------- */
  (function headerState() {
    var header = doc.querySelector("header");
    if (header) {
      var raf = 0;
      function paint() {
        raf = 0;
        header.classList.toggle("mx-scrolled", window.pageYOffset > 8);
      }
      window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
      paint();
    }
    var links = [].slice.call(doc.querySelectorAll(".nav-links a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = id && doc.getElementById(id);
      if (sec) { map[id] = a; targets.push(sec); }
    });
    if (!targets.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("mx-active"); a.removeAttribute("aria-current"); });
        var a2 = map[en.target.id];
        if (a2) { a2.classList.add("mx-active"); a2.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    targets.forEach(function (s) { io.observe(s); });
  })();

  /* ---------------------------------------------------------
     4. Hero: rotating 3D particle constellation (canvas)
     --------------------------------------------------------- */
  (function constellation() {
    if (RM) return;
    var hero = doc.querySelector("main .hero");
    if (!hero) return;
    var cv = el("canvas", "mx-canvas");
    cv.setAttribute("aria-hidden", "true");
    hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext("2d");
    if (!ctx) { cv.parentNode.removeChild(cv); return; }

    var W = 0, H = 0, DPR = 1, base = 300;
    var pts = [], N = 0;
    var FOV = 560, ROT = 0.00013, LINK = 20000, LINKR = Math.sqrt(20000);
    var mx = 0, my = 0, tmx = 0, tmy = 0, raf = 0, last = 0, visible = true, lastDraw = 0;

    function build() {
      N = SMALL ? 22 : 46;
      pts = [];
      for (var i = 0; i < N; i++) {
        var k = i + 0.5;
        var phi = Math.acos(1 - (2 * k) / N);
        var th = Math.PI * (1 + Math.sqrt(5)) * k;
        pts.push({
          x: Math.sin(phi) * Math.cos(th),
          y: Math.sin(phi) * Math.sin(th) * 0.55,
          z: Math.cos(phi),
          coral: i % 9 === 0
        });
      }
    }
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, SMALL ? 1 : 1.5);
      W = hero.clientWidth; H = hero.clientHeight;
      if (!W || !H) return;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      base = Math.min(W, H) * 0.62 + 120;
    }
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (!visible || doc.hidden) return;
      /* Cap the background network to ~30fps: it is ambient, and halving frames halves its fill-rate cost. */
      if (ts - lastDraw < 33) return;
      lastDraw = ts;
      if (!last) last = ts;
      var dt = Math.min(60, ts - last); last = ts;
      if (dt <= 0) return;
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;
      var a = ts * ROT + mx * 0.55;
      var tilt = -0.16 + my * 0.24;
      var ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
      var cx = W * 0.5, cy = H * 0.45;
      var i, j, n = pts.length, pr = [];
      for (i = 0; i < n; i++) {
        var p = pts[i];
        var px = p.x * base, py = p.y * base, pz = p.z * base;
        var x1 = px * ca - pz * sa;
        var z1 = px * sa + pz * ca;
        var y1 = py * ct - z1 * st;
        var z2 = py * st + z1 * ct;
        var s = FOV / (FOV + z2 + 460);
        pr.push({ X: cx + x1 * s, Y: cy + y1 * s, s: s, coral: p.coral });
      }
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          var dx = pr[i].X - pr[j].X, dy = pr[i].Y - pr[j].Y;
          var d2 = dx * dx + dy * dy;
          if (d2 > LINK) continue;
          var d = Math.sqrt(d2);
          var al = (1 - d / LINKR) * 0.20 * ((pr[i].s + pr[j].s) / 2);
          if (al < 0.012) continue;
          ctx.strokeStyle = "rgba(14,110,106," + al.toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(pr[i].X, pr[i].Y); ctx.lineTo(pr[j].X, pr[j].Y); ctx.stroke();
        }
      }
      for (i = 0; i < n; i++) {
        var q = pr[i];
        ctx.beginPath();
        ctx.fillStyle = q.coral ? "rgba(232,119,111,.72)" : "rgba(21,154,147,.60)";
        ctx.arc(q.X, q.Y, Math.max(1.2, 3.3 * q.s), 0, TAU);
        ctx.fill();
      }
    }
    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    resize(); build();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { visible = en.isIntersecting; });
      }, { threshold: 0 }).observe(hero);
    }
    doc.addEventListener("visibilitychange", function () { if (doc.hidden) stop(); else start(); });
    window.addEventListener("resize", function () { resize(); build(); }, { passive: true });
    if (FINE) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        tmx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        tmy = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }, { passive: true });
      hero.addEventListener("pointerleave", function () { tmx = 0; tmy = 0; });
    }
    start();
  })();

  /* ---------------------------------------------------------
     7. Icons that draw themselves in
     --------------------------------------------------------- */
  (function iconDraw() {
    if (RM) return;
    var icons = [].slice.call(main.querySelectorAll(".icon"));
    if (!icons.length) return;
    icons.forEach(function (i) { i.classList.add("mx-draw"); });
    if (!("IntersectionObserver" in window)) {
      icons.forEach(function (i) { i.classList.add("mx-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("mx-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.2 });
    icons.forEach(function (i) { io.observe(i); });
  })();

  /* ---------------------------------------------------------
     9. "How it works": connector fills + dots pop, in sequence
     --------------------------------------------------------- */
  (function steps() {
    var box = doc.querySelector(".steps");
    if (!box || RM) return;
    var line = el("span", "mx-steps-line");
    line.setAttribute("aria-hidden", "true");
    box.insertBefore(line, box.firstChild);
    var dots = [].slice.call(box.querySelectorAll(".step .dot"));
    if (!("IntersectionObserver" in window)) {
      line.classList.add("mx-in");
      dots.forEach(function (d) { d.classList.add("mx-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        line.classList.add("mx-in");
        dots.forEach(function (d, i) { setTimeout(function () { d.classList.add("mx-in"); }, 260 + i * 150); });
        io.disconnect();
      });
    }, { threshold: 0.3 });
    io.observe(box);
  })();

  /* Card tilt + spotlight (fine pointer only) */
  (function pointer3d() {
    if (RM || !FINE) return;
    function bindTilt(node) {
      var raf = 0, rx = 0, ry = 0;
      node.classList.add("mx-tilt");
      function paint() { raf = 0; node.style.transform = "perspective(900px) rotateX(" + ry.toFixed(2) + "deg) rotateY(" + rx.toFixed(2) + "deg) translateY(-6px)"; }
      function move(e) {
        var r = node.getBoundingClientRect(); if (!r.width || !r.height) return;
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        rx = (px - 0.5) * 6; ry = (0.5 - py) * 6;
        node.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        node.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        node.classList.add("mx-spot");
        if (!raf) raf = requestAnimationFrame(paint);
      }
      function out() { if (raf) { cancelAnimationFrame(raf); raf = 0; } node.style.transform = ""; node.classList.remove("mx-spot"); }
      node.addEventListener("pointermove", move, { passive: true });
      node.addEventListener("pointerleave", out);
      node.addEventListener("pointercancel", out);
    }
    [].slice.call(main.querySelectorAll(".card,.tool,.calc-card")).forEach(bindTilt);
  })();

  /* Fail-safe: after 7s make sure nothing is left hidden */
  window.setTimeout(function () {
    [].slice.call(doc.querySelectorAll("[data-aos]")).forEach(function (n) { n.classList.add("aos-animate"); });
    [].slice.call(doc.querySelectorAll(".mx-draw,.step .dot,.mx-steps-line")).forEach(function (n) { n.classList.add("mx-in"); });
  }, 7000);
})();
