// The lead chat widget (Phase 9, step 7). One deferred script, no dependencies.
// It asks the server whether the chat is on (/api/chat/config); if not, it does nothing and
// the page works exactly as before ("Request a free workflow audit" scrolls to the form).
// "preview" mode shows it only to someone who opened a page with ?chat=preview
// (?chat=off forgets that). Turnstile, the bot check, loads only once the chat is opened.
// With CHAT_NEXT on (D35), factual questions get tap-to-answer buttons and a mapped chat
// shows a summary card to confirm or correct before the contact form.
(function(){
  var PREVIEW_KEY = "cd-chat-preview";
  var WEB3FORMS_KEY = "38481c38-f460-483b-8941-23df4aa83522";   // public: it only routes mail to hello@
  var root = document.documentElement;

  try {
    var q = new URLSearchParams(location.search).get("chat");
    if (q === "preview") localStorage.setItem(PREVIEW_KEY, "1");
    if (q === "off") localStorage.removeItem(PREVIEW_KEY);
  } catch (e) {}
  function previewing(){ try { return localStorage.getItem(PREVIEW_KEY) === "1"; } catch (e) { return false; } }

  fetch("/api/chat/config" + (previewing() ? "?preview=1" : ""), { credentials: "same-origin" })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(cfg){ if (cfg && (cfg.mode === "on" || (cfg.mode === "preview" && previewing()))) start(cfg); })
    .catch(function(){});

  function el(tag, attrs, html){
    var n = document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (html) n.innerHTML = html;
    return n;
  }
  function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  // Replies are plain text; links the bot shares become real links (https only).
  function linkify(text){
    return esc(text).replace(/https:\/\/[^\s<]+[^\s<.,;:!?)]/g, function(url){ return '<a href="' + url + '" target="_blank" rel="noopener">' + url + "</a>"; });
  }

  function start(cfg){
    var css = el("link", { rel: "stylesheet", href: "/styles/chat.css?v=2" });
    document.head.appendChild(css);

    var launcher = el("button", { type: "button", "class": "chat-launch", "aria-haspopup": "dialog", "aria-controls": "chat-panel" },
      '<span class="chat-launch-dot" aria-hidden="true"></span>Chat about your workflow');
    var panel = el("div", { "class": "chat-panel", id: "chat-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "chat-title", hidden: "" },
      '<div class="chat-head"><h2 id="chat-title">Your workflow</h2>' +
      '<button type="button" class="chat-close" aria-label="Close the chat"><span aria-hidden="true">×</span></button></div>' +
      '<p class="chat-disclose">I\'m Chris\'s AI assistant. Chris reads every conversation and replies personally. <a href="/privacy/">Privacy</a></p>' +
      '<div class="chat-log" role="log" aria-live="polite"></div>' +
      '<div class="chat-ts"></div>' +
      '<form class="chat-input" novalidate><label class="chat-vh" for="chat-text">Your message</label>' +
      '<textarea id="chat-text" rows="2" maxlength="800" autocomplete="off"></textarea>' +
      '<button type="submit" class="chat-send">Send</button></form>');
    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    var log = panel.querySelector(".chat-log");
    var input = panel.querySelector("#chat-text");
    var form = panel.querySelector(".chat-input");
    var opener = null, started = false, said = [], controller = null;
    var next = cfg.next === true, quick = cfg.quick || {};
    var tsBox = panel.querySelector(".chat-ts"), tsWidget = null, tsToken = null, tsWaiters = [], tsLoaded = false;

    addMessage("assistant", cfg.opening);

    // ── Open and close; the dialog keeps focus inside it until it's closed ──
    function open(from){
      opener = from || launcher;
      panel.hidden = false;
      launcher.hidden = true;
      root.classList.add("chat-open");
      loadTurnstile();
      input.focus();
    }
    function close(){
      panel.hidden = true;
      launcher.hidden = false;
      root.classList.remove("chat-open");
      (opener && document.contains(opener) ? opener : launcher).focus();
    }
    launcher.addEventListener("click", function(){ open(launcher); });
    panel.querySelector(".chat-close").addEventListener("click", close);
    document.addEventListener("click", function(e){
      var t = e.target.closest && e.target.closest("[data-open-chat]");
      if (t) { e.preventDefault(); open(t); }
    });
    panel.addEventListener("keydown", function(e){
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(panel.querySelectorAll("a[href], button, textarea, input, select, iframe"), function(n){ return !n.disabled && n.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });

    // ── Turnstile: one token for the first message ──
    function loadTurnstile(){
      if (tsLoaded || started) return;
      tsLoaded = true;
      window.cdTurnstileReady = function(){
        tsWidget = window.turnstile.render(tsBox, {
          sitekey: cfg.sitekey, action: "chat", appearance: "interaction-only",
          callback: function(t){ tsToken = t; tsWaiters.splice(0).forEach(function(w){ w(t); }); },
          "error-callback": function(){ tsWaiters.splice(0).forEach(function(w){ w(null); }); }
        });
      };
      var s = el("script", { src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=cdTurnstileReady", async: "" });
      s.onerror = function(){ tsWaiters.splice(0).forEach(function(w){ w(null); }); };
      document.head.appendChild(s);
    }
    function token(){
      if (started) return Promise.resolve(null);
      if (tsToken) { var t = tsToken; tsToken = null; return Promise.resolve(t); }
      return new Promise(function(resolve){ tsWaiters.push(function(t){ tsToken = null; resolve(t); }); });
    }
    function freshToken(){
      tsToken = null;
      if (window.turnstile && tsWidget !== null) window.turnstile.reset(tsWidget);
      return token();
    }

    // ── Messages ──
    function addMessage(role, text){
      var m = el("div", { "class": "chat-msg chat-" + role });
      m.innerHTML = '<span class="chat-vh">' + (role === "user" ? "You: " : "Assistant: ") + "</span>" + (role === "user" ? esc(text) : linkify(text));
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return m;
    }
    // While a reply streams in, it's shown in a bubble screen readers skip; when it's done,
    // the whole reply is added to the log once, so it's read out once.
    function streamingBubble(){
      var b = el("div", { "class": "chat-msg chat-assistant chat-typing", "aria-hidden": "true" }, '<span class="chat-dots"><i></i><i></i><i></i></span>');
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
      return b;
    }

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var text = input.value.trim();
      if (!text) { input.focus(); return; }
      input.value = "";
      send(text);
    });
    input.addEventListener("keydown", function(e){
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); }
    });

    function send(text, retried){
      if (controller) controller.abort();          // a new message stops the reply in progress
      removeChips();
      if (!retried) { said.push(text); addMessage("user", text); }
      var bubble = streamingBubble();
      (retried ? freshToken() : token()).then(function(t){
        controller = new AbortController();
        return fetch("/api/chat", {
          method: "POST", credentials: "same-origin", signal: controller.signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: text, turnstile: t || undefined, page: location.pathname, next: next || undefined })
        });
      }).then(function(res){
        var type = res.headers.get("content-type") || "";
        if (type.indexOf("text/event-stream") === -1) {
          return res.json().catch(function(){ return {}; }).then(function(d){
            bubble.remove();
            if (d.error === "turnstile" && !retried) return send(text, true);
            if (d.error === "done") return addMessage("assistant", "Thanks, Chris has your details and will be in touch by email.");
            fallback();
          });
        }
        started = true;
        return read(res.body, bubble);
      }).catch(function(err){
        if (err && err.name === "AbortError") { bubble.remove(); return; }
        bubble.remove();
        fallback();
      });
    }

    function read(body, bubble){
      var reader = body.getReader(), dec = new TextDecoder(), buf = "", text = "";
      function finish(mapped, ask){
        bubble.remove();
        if (text) addMessage("assistant", text);
        if (mapped) { if (next) brief(); else leadForm(); }
        else if (ask && quick[ask]) chips(ask);
      }
      function pump(){
        return reader.read().then(function(r){
          if (r.done) { if (bubble.isConnected) finish(false); return; }
          buf += dec.decode(r.value, { stream: true });
          var i;
          while ((i = buf.indexOf("\n\n")) !== -1) {
            var line = buf.slice(0, i); buf = buf.slice(i + 2);
            if (line.indexOf("data: ") !== 0) continue;
            var ev; try { ev = JSON.parse(line.slice(6)); } catch (e) { continue; }
            if (ev.t) { text += ev.t; bubble.classList.remove("chat-typing"); bubble.innerHTML = linkify(text); log.scrollTop = log.scrollHeight; }
            if (ev.replace) { text = ev.replace; bubble.innerHTML = linkify(text); }
            if (ev.fallback) { bubble.remove(); return fallback(); }
            if (ev.done) return finish(ev.mapped, ev.ask);
          }
          return pump();
        });
      }
      return pump();
    }

    // ── Fact buttons (D35): tap an answer for a factual question, or type your own ──
    function removeChips(){ var q = log.querySelector(".chat-quick"); if (q) q.remove(); }
    function chips(key){
      removeChips();
      var g = el("div", { "class": "chat-quick", role: "group", "aria-label": "Quick answers" });
      quick[key].forEach(function(label){
        var b = el("button", { type: "button", "class": "chat-chip" });
        b.textContent = label;
        b.addEventListener("click", function(){ send(label); input.focus(); });
        g.appendChild(b);
      });
      g.appendChild(el("p", { "class": "chat-quick-hint" }, "Or type your own answer."));
      log.appendChild(g);
      log.scrollTop = log.scrollHeight;
    }

    // ── The summary card (D35): the brief, confirmed or corrected before their details ──
    function brief(){
      var wait = streamingBubble();
      fetch("/api/brief", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ next: true }) })
        .then(function(r){ return r.ok ? r.json() : {}; })
        .then(function(d){ wait.remove(); if (d.fields && d.labels) showBrief(d.fields, d.labels); else leadForm(); })
        .catch(function(){ wait.remove(); leadForm(); });
    }
    function showBrief(fields, labels){
      var card = el("section", { "class": "chat-brief", "aria-labelledby": "chat-brief-title" });
      var head = '<h3 id="chat-brief-title" tabindex="-1">Your brief</h3>';
      function lines(){
        return "<dl>" + labels.filter(function(l){ return fields[l[0]]; }).map(function(l){
          return "<dt>" + esc(l[1]) + "</dt><dd>" + esc(fields[l[0]]) + "</dd>";
        }).join("") + "</dl>";
      }
      function view(){
        card.innerHTML = head + "<p>Is this right? Chris writes your audit from it.</p>" + lines() +
          '<div class="chat-brief-actions"><button type="button" class="chat-send" data-ok>That\'s right</button>' +
          '<button type="button" class="chat-ghost" data-edit>Change something</button></div>';
        card.querySelector("[data-ok]").addEventListener("click", function(){ confirm({}); });
        card.querySelector("[data-edit]").addEventListener("click", edit);
      }
      function edit(){
        card.innerHTML = head + '<form novalidate><p>Change anything that\'s wrong or missing.</p>' + labels.map(function(l){
          return '<div class="chat-field"><label for="chat-brief-' + l[0] + '">' + esc(l[1]) + '</label>' +
            '<textarea id="chat-brief-' + l[0] + '" name="' + l[0] + '" rows="2" maxlength="300">' + esc(fields[l[0]] || "") + "</textarea></div>";
        }).join("") + '<button type="submit" class="chat-send">Save my brief</button></form>';
        var f = card.querySelector("form");
        f.querySelector("textarea").focus();
        f.addEventListener("submit", function(e){
          e.preventDefault();
          var changed = {};
          labels.forEach(function(l){
            var v = f.elements[l[0]].value.trim();
            if (v !== (fields[l[0]] || "")) { changed[l[0]] = v; fields[l[0]] = v; }
          });
          confirm(changed);
        });
      }
      function confirm(changed){
        Array.prototype.forEach.call(card.querySelectorAll("button"), function(b){ b.disabled = true; });
        fetch("/api/brief/confirm", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
          body: JSON.stringify({ next: true, fields: changed }) })
          .catch(function(){})
          .then(function(){
            card.innerHTML = head + lines() + '<p class="chat-brief-ok">✓ Confirmed</p>';
            leadForm(true);
          });
      }
      view();
      log.appendChild(card);
      log.scrollTop = log.scrollHeight;
      card.querySelector("h3").focus();
    }

    // ── "Want this as your written audit?" ──
    function leadForm(afterBrief){
      if (log.querySelector(".chat-lead")) return;
      var f = el("form", { "class": "chat-lead", novalidate: "" },
        (afterBrief
          ? '<p><strong>Where should Chris send it?</strong> Leave your details for your written audit, with a link to your private portal.</p>'
          : '<p><strong>Want this as your written audit?</strong> Leave your details and Chris will send it, with a link to your private portal.</p>') +
        field("lead-name", "name", "Your name", "text", "name") +
        field("lead-email", "email", "Work email", "email", "email") +
        field("lead-org", "org", 'Organisation <span class="chat-opt">(optional)</span>', "text", "organization") +
        '<div class="chat-field chat-check"><input type="checkbox" id="chat-lead-consent" name="consent" aria-describedby="chat-lead-consent-err">' +
        '<label for="chat-lead-consent">Chris can use these details to send my audit and set up my portal. <a href="/privacy/">Privacy</a></label>' +
        '<p class="chat-err" id="chat-lead-consent-err" hidden></p></div>' +
        '<button type="submit" class="chat-send">Send me the audit</button>');
      log.appendChild(f);
      log.scrollTop = log.scrollHeight;
      f.querySelector("input").focus();
      f.addEventListener("submit", function(e){
        e.preventDefault();
        var x = f.elements;
        var data = { name: x.name.value.trim(), email: x.email.value.trim(), org: x.org.value.trim(), consent: x.consent.checked };
        var btn = f.querySelector("button"); btn.disabled = true;
        fetch("/api/lead", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(data) })
          .then(function(res){ return res.json().catch(function(){ return {}; }).then(function(d){ return { ok: res.ok, d: d }; }); })
          .then(function(r){
            btn.disabled = false;
            Array.prototype.forEach.call(f.querySelectorAll(".chat-err"), function(p){ p.hidden = true; p.textContent = ""; });
            Array.prototype.forEach.call(f.querySelectorAll("[aria-invalid]"), function(n){ n.removeAttribute("aria-invalid"); });
            if (r.ok) {
              f.remove();
              addMessage("assistant", "Done. Check your inbox: your private portal link is on its way, and Chris will send your written audit.");
              input.focus();
              return;
            }
            var errs = (r.d && r.d.fields) || {}, first = null;
            ["name", "email", "org", "consent"].forEach(function(k){
              if (!errs[k]) return;
              var inp = f.querySelector('[name="' + k + '"]'), p = f.querySelector("#chat-lead-" + k + "-err");
              inp.setAttribute("aria-invalid", "true"); p.textContent = "Error: " + errs[k]; p.hidden = false;
              first = first || inp;
            });
            if (first) first.focus(); else fallback();
          }).catch(function(){ btn.disabled = false; fallback(); });
      });
    }
    function field(id, name, label, type, auto){
      return '<div class="chat-field"><label for="chat-' + id + '">' + label + "</label>" +
        '<input id="chat-' + id + '" name="' + name + '" type="' + type + '" autocomplete="' + auto + '" aria-describedby="chat-' + id + '-err">' +
        '<p class="chat-err" id="chat-' + id + '-err" hidden></p></div>';
    }

    // ── Fallback: the audit form, here in the panel, with what they've said so far ──
    function fallback(){
      if (log.querySelector(".chat-fallback")) return;
      form.hidden = true;
      var f = el("form", { "class": "chat-fallback", novalidate: "" },
        "<p><strong>The chat's resting for now.</strong> Send this instead and Chris will reply personally, by email.</p>" +
        '<div class="chat-field"><label for="chat-fb-msg">What eats your week?</label><textarea id="chat-fb-msg" name="message" rows="4"></textarea></div>' +
        '<div class="chat-field"><label for="chat-fb-name">Your name</label><input id="chat-fb-name" name="name" autocomplete="name"></div>' +
        '<div class="chat-field"><label for="chat-fb-email">Work email</label><input id="chat-fb-email" name="email" type="email" autocomplete="email"></div>' +
        '<div class="chat-field"><label for="chat-fb-org">Organisation <span class="chat-opt">(optional)</span></label><input id="chat-fb-org" name="organisation" autocomplete="organization"></div>' +
        '<button type="submit" class="chat-send">Request my written audit</button><p class="chat-err" role="status"></p>');
      var x = f.elements;
      x.message.value = said.join("\n\n");
      log.appendChild(f);
      log.scrollTop = log.scrollHeight;
      (said.length ? x.name : x.message).focus();
      f.addEventListener("submit", function(e){
        e.preventDefault();
        var status = f.querySelector(".chat-err");
        if (!x.message.value.trim() || !x.name.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email.value.trim())) {
          status.textContent = "Fill in what eats your week, your name and a work email."; return;
        }
        var body = new FormData(f);
        body.append("access_key", WEB3FORMS_KEY);
        body.append("subject", "Workflow audit request (chat): " + (x.organisation.value.trim() || x.name.value.trim()) + " — chrisdemetriou.com");
        body.append("from_name", "chrisdemetriou.com");
        f.querySelector("button").disabled = true;
        fetch("https://api.web3forms.com/submit", { method: "POST", body: body, headers: { Accept: "application/json" } })
          .then(function(r){ return r.json(); })
          .then(function(d){
            if (d.success !== true) throw new Error("not sent");
            f.remove();
            addMessage("assistant", "Received. Chris will reply by email with your one-page map.");
          })
          .catch(function(){
            f.querySelector("button").disabled = false;
            status.innerHTML = 'That didn\'t send. Please email <a href="mailto:hello@chrisdemetriou.com">hello@chrisdemetriou.com</a> instead.';
          });
      });
    }
  }
})();
