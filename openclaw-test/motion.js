/* ============================================================
   motion.js - additive motion / 3D layer for Eric Koh's site.
   Pure vanilla, no dependencies, no build step. It only ADDS
   elements and behaviour; it never rewrites the page's own markup,
   copy or features (chat widget + calculators keep working).
   Every effect is gated: nothing runs under prefers-reduced-motion,
   and anything already visible stays visible if this file fails.
   ============================================================ */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  if (root.getAttribute("data-mx") === "1") return;
  root.setAttribute("data-mx", "1");

  function mq(q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } }
  var RM = mq("(prefers-reduced-motion: reduce)");
  var FINE = mq("(hover: hover) and (pointer: fine)");
  var SMALL = mq("(max-width: 760px)");
  if (RM) root.classList.add("mx-rm");

  var main = doc.querySelector("main") || doc.body;
  var TAU = Math.PI * 2;

  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

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
     3. Marquee ticker (reuses wording already on the page)
     --------------------------------------------------------- */
  (function ticker() {
    if (!doc.getElementById("why")) return;            // main page only
    var hero = doc.querySelector("main .hero");
    if (!hero || !hero.parentNode) return;
    var items = ["Uncapped income", "Flexible hours", "Full training", "Path to leadership",
                 "AI-powered selling", "Insurance &amp; Takaful", "Klang Valley"];
    var star = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/></svg>';
    var wrap = el("div", "mx-ticker");
    wrap.setAttribute("aria-hidden", "true");
    var track = el("div", "mx-ticker-track");
    function half() {
      var f = doc.createDocumentFragment();
      for (var r = 0; r < 3; r++) {
        items.forEach(function (txt) {
          var s = el("span", "mx-tk", star + "<span>" + txt + "</span>");
          f.appendChild(s);
        });
      }
      return f;
    }
    track.appendChild(half());
    track.appendChild(half());
    wrap.appendChild(track);
    hero.parentNode.insertBefore(wrap, hero.nextSibling);
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
    var mx = 0, my = 0, tmx = 0, tmy = 0, raf = 0, last = 0, visible = true;

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
      DPR = Math.min(window.devicePixelRatio || 1, 2);
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
     5. Hero headline: word-by-word entrance
     --------------------------------------------------------- */
  (function headline() {
    if (RM) return;
    var h1 = doc.querySelector(".hero h1");
    if (!h1) return;
    var words = [];
    function split(node) {
      var kids = [].slice.call(node.childNodes);
      kids.forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.nodeValue.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var s = el("span", "mx-w");
            s.textContent = p;
            s.style.display = "inline-block";
            s.style.opacity = "0";
            s.style.transform = "translate3d(0,.45em,0)";
            frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          split(n);
        }
      });
    }
    split(h1);
    if (!words.length) return;
    var reduce = false;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); run(); } });
      }, { threshold: 0.25 });
      io.observe(h1);
      setTimeout(function () { io.disconnect(); run(); }, 2600);
    } else { run(); }
    function run() {
      if (reduce) return; reduce = true;
      words.forEach(function (s, i) {
        s.style.transition = "opacity .55s ease " + (i * 55) + "ms, transform .8s cubic-bezier(.2,.85,.2,1) " + (i * 55) + "ms";
        s.style.opacity = "1";
        s.style.transform = "none";
      });
      words.forEach(function (s, i) {
        setTimeout(function () { s.style.transition = ""; s.style.transform = ""; }, i * 55 + 900);
      });
    }
  })();

  /* ---------------------------------------------------------
     6. Scroll reveal (translate/opacity only, so the pointer tilt
        on the same element never conflicts)
     --------------------------------------------------------- */
  var revealPool = [];
  (function reveals() {
    if (RM) return;
    var sel = ".card,.tool,.persona,.calc-card,.step,.timeline li,.tab,.needs-list li";
    var nodes = [].slice.call(main.querySelectorAll(sel));
    if (!nodes.length) return;
    root.classList.add("mx-ready");
    nodes.forEach(function (n) { n.classList.add("mx-rv"); revealPool.push(n); });
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("mx-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        var sibs = t.parentNode ? [].slice.call(t.parentNode.children) : [t];
        var idx = Math.max(0, sibs.indexOf(t));
        var delay = Math.min(idx, 6) * 80;
        t.style.transitionDelay = delay + "ms";
        t.classList.add("mx-in");
        io.unobserve(t);
        // Hand the element back to its normal state once it has arrived,
        // so hover/tilt transitions are not stuck behind the reveal one.
        window.setTimeout(function () {
          t.classList.remove("mx-rv", "mx-in");
          t.style.transitionDelay = "";
        }, 1500 + delay);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    nodes.forEach(function (n) { io.observe(n); });
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
     8. Statistics that count up (numbers already on the page)
     --------------------------------------------------------- */
  (function stats() {
    if (RM) return;
    var nums = [].slice.call(main.querySelectorAll(".timeline li b"));
    nums = nums.filter(function (n) {
      var m = n.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return false;
      var v = parseInt(m[1], 10);
      return v > 0 && v <= 100;
    });
    if (!nums.length) return;
    function run(n) {
      var m = n.textContent.trim().match(/^(\d+)(.*)$/);
      var to = parseInt(m[1], 10), tail = m[2] || "", t0 = 0;
      n.textContent = "0" + tail;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / 1100);
        var e = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(to * e) + tail;
        if (p < 1) requestAnimationFrame(step);
        else n.textContent = to + tail;
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target); io.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
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

  /* ---------------------------------------------------------
     10. Dark "tools" section: drifting aurora backdrop
     --------------------------------------------------------- */
  (function aurora() {
    if (RM) return;
    var learn = doc.querySelector(".learn");
    if (!learn) return;
    var a = el("div", "mx-aurora", "<i></i><i></i><i></i>");
    a.setAttribute("aria-hidden", "true");
    learn.insertBefore(a, learn.firstChild);
  })();

  /* ---------------------------------------------------------
     11. Final call-to-action: slow sweep of light
     --------------------------------------------------------- */
  (function halo() {
    if (RM) return;
    var box = doc.querySelector(".cta-box");
    if (!box) return;
    var h = el("div", "mx-halo");
    h.setAttribute("aria-hidden", "true");
    box.insertBefore(h, box.firstChild);
  })();

  /* ---------------------------------------------------------
     12. Pointer tilt + spotlight + magnetic buttons
        (pointer-fine devices only; ignored on touch)
     --------------------------------------------------------- */
  (function pointer3d() {
    if (RM || !FINE) return;
    var tiltSel = ".ai-card,.card,.tool,.calc-card,.tab,.persona";

    function bindTilt(node) {
      var raf = 0, rx = 0, ry = 0, lit = false;
      var CAN_SPOT = !node.matches(".feature,.um,.results,[aria-selected='true']");
      node.classList.add("mx-tilt");
      function paint() {
        raf = 0;
        node.style.transform = "perspective(900px) rotateX(" + ry.toFixed(2) + "deg) rotateY(" + rx.toFixed(2) + "deg) translateY(-4px)";
      }
      function move(e) {
        var r = node.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        rx = (px - 0.5) * 7;
        ry = (0.5 - py) * 7;
        node.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        node.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        if (!lit) {
          lit = true;
          node.classList.add("mx-lit");
          if (CAN_SPOT) node.classList.add("mx-spot");
          node.style.transitionDelay = "0ms";
        }
        if (!raf) raf = requestAnimationFrame(paint);
      }
      function out() {
        lit = false;
        rx = ry = 0;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        node.style.transform = "";
        node.classList.remove("mx-lit", "mx-spot");
      }
      node.addEventListener("pointerenter", move, { passive: true });
      node.addEventListener("pointermove", move, { passive: true });
      node.addEventListener("pointerleave", out);
      node.addEventListener("pointercancel", out);
    }

    function bindMagnet(node) {
      var raf = 0, dx = 0, dy = 0;
      function paint() {
        raf = 0;
        node.style.transform = "translate3d(" + dx.toFixed(2) + "px," + (dy - 2).toFixed(2) + "px,0)";
      }
      node.addEventListener("pointermove", function (e) {
        var r = node.getBoundingClientRect();
        if (!r.width || !r.height) return;
        dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 9;
        dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * 9;
        if (!raf) raf = requestAnimationFrame(paint);
      }, { passive: true });
      node.addEventListener("pointerleave", function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        node.style.transform = "";
      });
      node.classList.add("mx-magnet");
    }

    [].slice.call(main.querySelectorAll(tiltSel)).forEach(bindTilt);
    [].slice.call(main.querySelectorAll(".btn")).forEach(bindMagnet);
  })();

  /* ---------------------------------------------------------
     13. Safety net: if anything above silently failed, make sure
         no content is left invisible.
     --------------------------------------------------------- */
  window.setTimeout(function () {
    revealPool.forEach(function (n) { n.classList.add("mx-in"); });
  }, 7000);
})();
