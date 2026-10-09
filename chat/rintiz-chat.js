/* RintiZ Helper chat widget.
 * Usage: <script src="chat/rintiz-chat.js" data-endpoint="https://rintiz-chat.<sub>.workers.dev" defer></script>
 * No data-endpoint (or ?chatpreview=1) = PREVIEW mode with canned sample answers (no AI, no network).
 */
(function () {
  "use strict";
  var script = document.currentScript;
  var ENDPOINT = (script && script.getAttribute("data-endpoint")) || "";
  var PREVIEW = !ENDPOINT || /[?&]chatpreview=1/.test(location.search);
  var WA_NUMBER = "60122992009";
  var WA_TEXT = "Hi Eric, I saw the RintiZ fresh-grad programme on your website and would like to know more.";
  var WA_URL = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(WA_TEXT);
  var MAX_CHARS = 600;
  var MAX_TURNS = 8;
  var MAX_QUESTIONS = 5;            // free questions per browser session (worker enforces the same)
  var QKEY = "rz-qcount";           // sessionStorage holds ONLY this number (+ an opener-used flag), nothing personal
  var OKEY = "rz-opener";
  var OPENER = "Tell me more about the RintiZ programme"; // first suggestion: does NOT count toward the limit (once)

  var GREETING = "Hi there! 👋 I'm the RintiZ Helper, an AI assistant on Eric's page. You can ask me up to 5 questions about the 2026 RintiZ programme for fresh grads: who can join, training, how to start. Want to meet Eric? Tap \"Book a coffee chat\" anytime.";

  var INVITE_TEXT = "Since you're keen to know more, how about a coffee chat with Eric? ☕ He can walk you through RintiZ personally.";
  var NOTNOW_TEXT = "No problem, thanks for chatting! 😊 If anything else comes up, tap the green WhatsApp button below to message Eric directly.";
  var CONFIRM_TEXT = "Tap Send in WhatsApp and Eric will get back to you soon. 🙌";
  var CONSENT_TEXT = "I agree that Eric Koh may contact me about the RintiZ programme. My details are used only for this.";

  var CHIPS = [
    OPENER,
    "Who can join?",
    "Is there training?",
    "Do I need sales experience?",
    "How do I apply?",
    "How much can I earn?",
    "What's the career path?"
  ];

  // Preview-only sample answers, drawn from the RintiZ summary (no bonus figures).
  var CANNED = {
    "Tell me more about the RintiZ programme": "Happy to! Once you're contracted as an agent, you earn commission on every sale. On top of that, you're invited to join RintiZ and can earn a fixed RintiZ incentive of up to RM3,600 a month in your first 6 months, subject to meeting the programme requirements. This is on top of your commission, not including it (monthly and quarterly incentives through your first year, based on your results).\n- Who can join: age 18+ with minimum SPM\n- Support: onboarding, MVP learning modules, monthly Jumpstart sessions and monthly planning with your leader\nKeen to know more? Tap \"Book a coffee chat\" at the top to meet Eric ☕",
    "Who can join?": "Anyone aged 18 and above with at least SPM can apply for RintiZ, so fresh grads are very welcome! 🎓\nThose are the entry requirements listed in the programme summary. Eric can confirm your eligibility personally. Tap the green WhatsApp button below to ask him.",
    "Is there training?": "Yes, quite a lot of support in your first year (up to 12 months):\n- Onboarding Briefing: a 45-minute virtual session before you start\n- MVP I & MVP II learning modules: one by month 3, both by month 6\n- Jumpstart: a monthly 2-hour virtual session\n- Monthly sales activity planning with your leader\nWant to know how Eric's team coaches new joiners? WhatsApp him below.",
    "Do I need sales experience?": "No sales experience is listed as a requirement. The listed entry criteria are age 18+ and minimum SPM. The programme comes with structured training and monthly planning with your leader, so you learn as you go. Eric can share what a typical first month looks like. Just WhatsApp him!",
    "How do I apply?": "Easiest way: WhatsApp Eric for a casual coffee chat ☕ He'll explain the programme, check your eligibility and guide you through registration. After you're registered, your start month (M1) is normally the 1st of the following month.\nPlease don't share your IC or other personal details here. Eric will handle that with you directly.",
    "How much can I earn?": "You earn commission on every sale. On top of that, RintiZ pays a fixed incentive of up to RM3,600 a month in months 1-6, subject to meeting the programme requirements. This RintiZ incentive does not include your commission, which you earn separately, with monthly and quarterly incentives based on your validated results. Your actual income depends on your own results.\nEric will explain the details personally. Tap \"Book a coffee chat\" or WhatsApp him.",
    "What's the career path?": "Strong performers can apply to move into the NGM / NGM+ leadership track. That involves meeting production and case targets, completing a professional qualification module (for SPM holders), and then a panel interview. RintiZ plus NGM/NGM+ together run up to 24 months.\nEric can share how he grew from Unit Manager to District Manager. WhatsApp him!"
  };
  var PREVIEW_FALLBACK = "(Preview) In the live version, the AI assistant will answer this using only the RintiZ programme information. For now, try one of the suggested questions, or WhatsApp Eric directly.";

  var ICON = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>',
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V9z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M12 3v2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.41z"/></svg>'
  };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function linkify(s) {
    return s.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, function (u) {
      return '<a href="' + u + '" target="_blank" rel="noopener">' + u.replace(/^https?:\/\//, "") + "</a>";
    });
  }
  // Safe mini-renderer: escape, linkify, "- " bullets, line breaks.
  function render(text) {
    var lines = esc(text).split(/\n/), out = "", inList = false;
    lines.forEach(function (ln) {
      var m = ln.match(/^\s*[-•*]\s+(.*)$/);
      if (m) { if (!inList) { out += "<ul>"; inList = true; } out += "<li>" + linkify(m[1]) + "</li>"; }
      else { if (inList) { out += "</ul>"; inList = false; } if (ln.trim()) out += "<p>" + linkify(ln) + "</p>"; }
    });
    if (inList) out += "</ul>";
    return out.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  }

  var root = el("div", "rz-root" + (PREVIEW ? " rz-preview" : ""));
  root.innerHTML =
    '<button class="rz-launcher" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="rz-panel">' +
      '<span class="rz-ico">' + ICON.chat + '</span><span class="rz-dot" aria-hidden="true"></span><span>Ask about RintiZ</span></button>' +
    '<section class="rz-panel" id="rz-panel" role="dialog" aria-modal="false" aria-label="Ask about RintiZ chat">' +
      '<header class="rz-head"><div class="rz-avatar" aria-hidden="true">RZ</div>' +
        '<div class="rz-title"><h2>Ask about RintiZ' + (PREVIEW ? ' <span class="rz-badge">Preview</span>' : "") + '</h2>' +
        '<p>Fresh-grad programme · AI assistant</p>' +
        '<button class="rz-book" type="button">' + ICON.cup + 'Book a coffee chat</button></div>' +
        '<button class="rz-close" type="button" aria-label="Close chat">' + ICON.close + '</button></header>' +
      '<div class="rz-disclaimer">' + ICON.info + '<span><b>AI assistant</b> · general info only, may make mistakes. Official terms are per AIA programme documents. Please don\'t share IC or personal details here.</span></div>' +
      (PREVIEW ? '<div class="rz-preview-note">Preview mode: sample answers only, not live AI yet.</div>' : "") +
      '<div class="rz-body" aria-live="polite"></div>' +
      '<div class="rz-foot"><form class="rz-form" autocomplete="off">' +
        '<textarea class="rz-input" rows="1" maxlength="' + MAX_CHARS + '" placeholder="Type your question…" aria-label="Your question"></textarea>' +
        '<button class="rz-send" type="submit" aria-label="Send" disabled>' + ICON.send + '</button></form>' +
        '<div class="rz-count"></div>' +
        '<div class="rz-qleft" aria-live="polite"></div>' +
        '<div class="rz-cta" hidden>' +
          '<button class="rz-btn rz-btn-primary rz-yes" type="button">' + ICON.cup + 'Yes, let\'s meet</button>' +
          '<button class="rz-btn rz-btn-ghost rz-no" type="button">Not now</button></div>' +
        '<a class="rz-wa" href="' + WA_URL + '" target="_blank" rel="noopener">' + ICON.wa + 'Chat with Eric on WhatsApp</a>' +
      '</div></section>';

  var launcher = root.querySelector(".rz-launcher"), panel = root.querySelector(".rz-panel"),
      body = root.querySelector(".rz-body"), form = root.querySelector(".rz-form"),
      input = root.querySelector(".rz-input"), send = root.querySelector(".rz-send"),
      count = root.querySelector(".rz-count"), closeBtn = root.querySelector(".rz-close"),
      qleft = root.querySelector(".rz-qleft"), cta = root.querySelector(".rz-cta"),
      bookBtn = root.querySelector(".rz-book");
  var history = [], busy = false, started = false, asked = {};
  // mode: "chat" (asking), "invite" (5 used, Yes/Not now shown), "ended" (Not now / sent), "form" (coffee-chat form open)
  var mode = "chat", modeBeforeForm = "chat";

  function getQ() { try { return parseInt(sessionStorage.getItem(QKEY), 10) || 0; } catch (e) { return 0; } }
  function setQ(n) { try { sessionStorage.setItem(QKEY, String(n)); } catch (e) {} }
  function openerUsed() { try { return sessionStorage.getItem(OKEY) === "1"; } catch (e) { return false; } }
  function locked() { return getQ() >= MAX_QUESTIONS; }
  function updateQLeft() {
    var left = Math.max(0, MAX_QUESTIONS - getQ());
    qleft.textContent = mode === "chat" ? (left === 1 ? "1 question left" : left + " questions left") : "";
  }
  function setMode(m) {
    mode = m;
    form.hidden = m !== "chat";
    cta.hidden = m !== "invite";
    root.classList.toggle("rz-locked", m !== "chat");
    updateQLeft();
  }

  function scroll() { body.scrollTop = body.scrollHeight; }
  function addMsg(role, text, extra) {
    var m = el("div", "rz-msg " + (role === "user" ? "rz-user" : "rz-bot") + (extra ? " " + extra : ""));
    m.innerHTML = role === "user" ? esc(text).replace(/\n/g, "<br>") : render(text);
    body.appendChild(m); scroll(); return m;
  }
  function addChips() {
    var old = body.querySelector(".rz-chips"); if (old) old.remove();
    var left = CHIPS.filter(function (c) { return !asked[c]; });
    if (!left.length) return;
    var wrap = el("div", "rz-chips");
    left.slice(0, 4).forEach(function (c) {
      var b = el("button", "rz-chip"); b.type = "button"; b.textContent = c;
      b.addEventListener("click", function () { ask(c); });
      wrap.appendChild(b);
    });
    body.appendChild(wrap); scroll();
  }
  function typing() { return addMsg("bot", "", "rz-typing-msg"); }

  function open() {
    root.classList.add("rz-open"); launcher.setAttribute("aria-expanded", "true");
    if (!started) {
      started = true; addMsg("bot", GREETING);
      if (locked()) showInvite(); else { addChips(); setMode("chat"); }
    }
    setTimeout(function () { if (mode === "chat" && window.matchMedia("(min-width:521px)").matches) input.focus(); }, 50);
  }
  function close() { root.classList.remove("rz-open"); launcher.setAttribute("aria-expanded", "false"); launcher.focus(); }

  function ask(text) {
    text = (text || "").trim().slice(0, MAX_CHARS);
    if (!text || busy || mode !== "chat") return;
    if (locked()) { showInvite(); return; }
    asked[text] = true;
    var isOpener = text === OPENER && history.length === 0 && !openerUsed();
    if (isOpener) { try { sessionStorage.setItem(OKEY, "1"); } catch (e) {} }
    else setQ(getQ() + 1);
    updateQLeft();
    var chips = body.querySelector(".rz-chips"); if (chips) chips.remove();
    addMsg("user", text); history.push({ role: "user", content: text });
    input.value = ""; autosize(); busy = true; send.disabled = true;
    var t = typing(); t.innerHTML = '<span class="rz-typing"><i></i><i></i><i></i></span>';
    var done = function (reply, isErr) {
      t.remove(); addMsg("bot", reply, isErr ? "rz-error" : "");
      if (!isErr) history.push({ role: "assistant", content: reply });
      history = history.slice(-MAX_TURNS * 2);
      busy = false; send.disabled = !input.value.trim();
      if (locked()) showInvite(); else addChips();
    };
    if (PREVIEW) {
      var reply = CANNED[text] || matchCanned(text) || PREVIEW_FALLBACK;
      setTimeout(function () { done(reply); }, 650);
      return;
    }
    fetch(ENDPOINT.replace(/\/$/, "") + "/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-MAX_TURNS * 2) })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.reply) done(res.j.reply);
        else done((res.j && res.j.error) || "Sorry, something went wrong. Please WhatsApp Eric.", true);
      })
      .catch(function () { done("Sorry, I can't connect right now. Please WhatsApp Eric directly.", true); });
  }
  // ---- Coffee-chat invitation + lead form (handled entirely in the widget, never sent to the AI or any server) ----
  function removeChips() { var c = body.querySelector(".rz-chips"); if (c) c.remove(); }
  function showInvite() {
    removeChips();
    if (!body.querySelector(".rz-invite")) addMsg("bot", INVITE_TEXT, "rz-invite");
    setMode("invite");
    setTimeout(function () { var y = cta.querySelector(".rz-yes"); if (y) y.focus(); }, 30);
  }
  function notNow() {
    addMsg("bot", NOTNOW_TEXT);
    setMode("ended");
  }
  function normMobile(v) {
    var d = String(v || "").replace(/[\s\-().]/g, "");
    if (/^\+?60/.test(d)) d = "0" + d.replace(/^\+?60/, "");
    return d;
  }
  function validMobile(v) { return /^01(1\d{8}|[02-9]\d{7})$/.test(normMobile(v)); } // 01x-xxxxxxx, 011-xxxxxxxx
  function prettyMobile(v) { var d = normMobile(v); return d.slice(0, 3) + "-" + d.slice(3); }
  function waLink(text) { return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text); }
  function showForm() {
    if (mode === "form") { var f0 = body.querySelector(".rz-lead input"); if (f0) f0.focus(); return; }
    if (busy) return;
    removeChips();
    modeBeforeForm = mode;
    setMode("form");
    var card = el("form", "rz-msg rz-bot rz-lead");
    card.setAttribute("novalidate", "");
    card.setAttribute("autocomplete", "on");
    card.innerHTML =
      '<p class="rz-lead-title">' + ICON.cup + '<b>Coffee chat with Eric</b></p>' +
      '<p class="rz-lead-sub">Share a few details and we\'ll open WhatsApp with your message ready to send.</p>' +
      '<label class="rz-field"><span>Name</span><input name="name" type="text" maxlength="60" autocomplete="name" required placeholder="e.g. Aisyah Tan"></label>' +
      '<label class="rz-field"><span>Mobile number</span><input name="mobile" type="tel" inputmode="tel" maxlength="16" autocomplete="tel" required placeholder="e.g. 012-3456789"></label>' +
      '<label class="rz-field"><span>Preferred day / time <em>(optional)</em></span><input name="when" type="text" maxlength="80" placeholder="e.g. Sat morning, weekday after 6pm"></label>' +
      '<label class="rz-consent"><input name="consent" type="checkbox" required><span>' + esc(CONSENT_TEXT) + '</span></label>' +
      '<p class="rz-lead-err" role="alert" hidden></p>' +
      '<div class="rz-lead-actions"><button class="rz-btn rz-btn-wa" type="submit">' + ICON.wa + 'Continue in WhatsApp</button>' +
      '<button class="rz-btn rz-btn-ghost rz-cancel" type="button">Cancel</button></div>' +
      '<p class="rz-lead-note">Nothing is saved on this website. Please don\'t include your IC number.</p>';
    body.appendChild(card); scroll();
    var err = card.querySelector(".rz-lead-err");
    function fail(msg, field) {
      err.textContent = msg; err.hidden = false;
      card.querySelectorAll(".rz-bad").forEach(function (x) { x.classList.remove("rz-bad"); });
      if (field) { field.classList.add("rz-bad"); field.setAttribute("aria-invalid", "true"); field.focus(); }
    }
    card.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = card.elements, name = f.name.value.trim().replace(/\s+/g, " "), mob = f.mobile.value.trim(), when = f.when.value.trim().replace(/\s+/g, " ");
      if (name.length < 2) return fail("Please enter your name.", f.name);
      if (!validMobile(mob)) return fail("Please enter a valid Malaysian mobile number, e.g. 012-3456789.", f.mobile);
      if (!f.consent.checked) return fail("Please tick the consent box so Eric can contact you.", f.consent);
      var msg = "Hi Eric, I'd like a coffee chat about RintiZ. Name: " + name + ". Mobile: " + prettyMobile(mob) + "." +
        (when ? " Preferred time: " + when + "." : "") + " (via your website chat)";
      var url = waLink(msg);
      card.remove(); // details are not kept anywhere in the page
      var w = null; try { w = window.open(url, "_blank", "noopener"); } catch (x) {}
      var c = addMsg("bot", CONFIRM_TEXT, "rz-confirm");
      var a = el("a", "rz-btn rz-btn-wa rz-reopen", ICON.wa + (w ? "Open WhatsApp again" : "Open WhatsApp"));
      a.href = url; a.target = "_blank"; a.rel = "noopener";
      c.appendChild(a); scroll();
      setMode("ended");
    });
    card.querySelector(".rz-cancel").addEventListener("click", function () {
      card.remove();
      if (modeBeforeForm === "chat" && !locked()) { setMode("chat"); addChips(); }
      else setMode(modeBeforeForm === "invite" ? "invite" : "ended");
    });
    setTimeout(function () { card.querySelector("input[name=name]").focus(); }, 30);
  }

  function matchCanned(q) {
    q = q.toLowerCase();
    if (/(what is rintiz|about (the )?rintiz|tell me more|apa itu rintiz|overview)/.test(q)) return CANNED["Tell me more about the RintiZ programme"];
    if (/(join|eligib|requirement|qualif|age|spm|layak|syarat)/.test(q)) return CANNED["Who can join?"];
    if (/(train|mvp|onboard|jumpstart|latihan|coach)/.test(q)) return CANNED["Is there training?"];
    if (/(experience|pengalaman|no sales|never sold)/.test(q)) return CANNED["Do I need sales experience?"];
    if (/(apply|start|register|sign up|mohon|daftar)/.test(q)) return CANNED["How do I apply?"];
    if (/(earn|income|salary|pay|bonus|money|gaji|pendapatan|rm\s?\d)/.test(q)) return CANNED["How much can I earn?"];
    if (/(career|promot|manager|ngm|leader|kerjaya)/.test(q)) return CANNED["What's the career path?"];
    return null;
  }
  function autosize() {
    input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 96) + "px";
    var n = input.value.length; count.textContent = n + " / " + MAX_CHARS;
    count.classList.toggle("rz-show", n > MAX_CHARS * 0.8);
  }

  launcher.addEventListener("click", open);
  bookBtn.addEventListener("click", showForm);
  cta.querySelector(".rz-yes").addEventListener("click", showForm);
  cta.querySelector(".rz-no").addEventListener("click", notNow);
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("rz-open")) close(); });
  input.addEventListener("input", function () { autosize(); send.disabled = busy || !input.value.trim(); });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });

  function mount() { document.body.appendChild(root); if (/[?&]chat=open/.test(location.search)) open(); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  window.RintizChat = { open: open, close: close, ask: function (q) { open(); ask(q); }, bookCoffeeChat: function () { open(); showForm(); } };
})();
