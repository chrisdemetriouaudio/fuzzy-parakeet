// Display settings: theme, text size, dyslexia-friendly font, wider spacing, high contrast and
// a reading mask. The same panel as the Neuro Support Checker. Saved on this device only
// (localStorage "cd-display"; listed in the cookie policy). Each page's <head> applies the
// saved settings before it paints, so there's no flash; this file adds the button and panel.
(function(){
  var KEY = "cd-display";
  var DEFAULTS = { theme: "light", text: "normal", font: "default", spacing: "normal", contrast: "normal", mask: "off" };
  var root = document.documentElement;
  var slot = document.querySelector(".masthead .container, .masthead .shell");
  if (!slot) return;

  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { prefs = {}; }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }

  var darkQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function resolvedTheme(){
    var t = prefs.theme || DEFAULTS.theme;
    if (t === "auto") return darkQuery && darkQuery.matches ? "dark" : "light";
    return t;
  }

  // reading mask: two dimmed strips that follow the pointer or finger
  var top = null, bottom = null, maskOn = false;
  function strip(cls){ var d = document.createElement("div"); d.className = "reading-mask " + cls; d.setAttribute("aria-hidden", "true"); document.body.appendChild(d); return d; }
  function place(y){ var h = Math.max(44, Math.round(window.innerHeight * .07)); top.style.height = Math.max(0, y - h) + "px"; bottom.style.height = Math.max(0, window.innerHeight - y - h) + "px"; }
  function move(e){ var p = e.touches && e.touches.length ? e.touches[0] : e; if (typeof p.clientY === "number") place(p.clientY); }
  function setMask(on){
    if (on === maskOn) return;
    maskOn = on;
    if (on){
      if (!top){ top = strip("reading-mask--top"); bottom = strip("reading-mask--bottom"); }
      top.hidden = bottom.hidden = false;
      place(window.innerHeight / 2);
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("touchstart", move, { passive: true });
      window.addEventListener("touchmove", move, { passive: true });
    } else if (top){
      top.hidden = bottom.hidden = true;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("touchstart", move);
      window.removeEventListener("touchmove", move);
    }
  }

  function apply(){
    var theme = resolvedTheme();
    if (theme === "dark") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", "light");
    ["text", "font", "spacing", "contrast"].forEach(function(k){
      var v = prefs[k];
      if (v && v !== DEFAULTS[k]) root.setAttribute("data-" + k, v); else root.removeAttribute("data-" + k);
    });
    setMask(prefs.mask === "on");
  }

  // the button
  var toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "display-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "display-panel");
  toggle.setAttribute("aria-label", "Display settings");
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 18L8.2 5h1.6L15 18M5 14h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 11.5c.6-.9 1.5-1.4 2.6-1.4 1.6 0 2.4 1 2.4 2.5V18m0-3.5c-.8-.4-1.6-.5-2.5-.5-1.5 0-2.5.8-2.5 2s.9 2 2.2 2c1.3 0 2.3-.8 2.8-1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Display</span>';
  var tools = slot.querySelector(".mast-tools");   // a page can leave a slot for it
  if (!tools){
    tools = document.createElement("span");
    tools.className = "mast-tools";
    if (slot.children.length > 1) tools.appendChild(slot.lastElementChild);
    slot.appendChild(tools);
  }
  tools.appendChild(toggle);

  // the panel
  var panel = document.createElement("div");
  panel.className = "display-panel";
  panel.id = "display-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "display-heading");
  panel.hidden = true;
  function radios(name, legend, opts){
    return '<fieldset><legend>' + legend + '</legend><div class="segmented">' + opts.map(function(o){
      var id = "display-" + name + "-" + o[0];
      return '<input type="radio" name="' + name + '" id="' + id + '" value="' + o[0] + '"><label for="' + id + '"' + (o[2] ? ' class="' + o[2] + '"' : "") + ">" + o[1] + "</label>";
    }).join("") + "</div></fieldset>";
  }
  function sw(name, value, title, hint){
    return '<li><label class="switch" for="display-' + name + '"><span>' + title + "<small>" + hint + '</small></span><input type="checkbox" role="switch" name="' + name + '" id="display-' + name + '" value="' + value + '"></label></li>';
  }
  panel.innerHTML =
    '<div class="display-head"><h2 id="display-heading" tabindex="-1">Display settings</h2><button type="button" class="display-close">Close</button></div>' +
    radios("theme", "Theme", [["light", "Light"], ["dark", "Dark"], ["auto", "Match device"]]) +
    radios("text", "Text size", [["normal", "Normal"], ["large", "Large", "size-2"], ["xlarge", "Larger", "size-3"]]) +
    '<ul class="switches">' +
      sw("font", "dyslexic", "Dyslexia-friendly font", "OpenDyslexic: heavier letter bottoms help stop letters flipping") +
      sw("spacing", "wide", "Wider spacing", "More space between letters, words and lines") +
      sw("contrast", "high", "High contrast", "Strong colours and outlines") +
      sw("mask", "on", "Reading mask", "Dims the page except a strip that follows your finger or mouse") +
    "</ul>" +
    '<div class="display-foot"><p>Saved on this device only.</p><button type="button" class="display-reset">Reset all</button></div>';
  document.body.appendChild(panel);

  function sync(){
    panel.querySelectorAll("input[type=radio]").forEach(function(i){ i.checked = (prefs[i.name] || DEFAULTS[i.name]) === i.value; });
    panel.querySelectorAll("input[type=checkbox]").forEach(function(i){ i.checked = prefs[i.name] === i.value; });
  }
  function open(){ panel.hidden = false; toggle.setAttribute("aria-expanded", "true"); panel.querySelector("h2").focus(); }
  function close(back){ panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); if (back) toggle.focus(); }

  panel.addEventListener("change", function(e){
    var i = e.target;
    var v = i.type === "checkbox" && !i.checked ? DEFAULTS[i.name] : i.value;
    if (v === DEFAULTS[i.name]) delete prefs[i.name]; else prefs[i.name] = v;   // only changes are saved
    apply(); save();
  });
  toggle.addEventListener("click", function(){ if (panel.hidden) open(); else close(false); });
  panel.querySelector(".display-close").addEventListener("click", function(){ close(true); });
  panel.querySelector(".display-reset").addEventListener("click", function(){ prefs = {}; save(); apply(); sync(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && !panel.hidden) close(true); });
  document.addEventListener("click", function(e){ if (!panel.hidden && !panel.contains(e.target) && !toggle.contains(e.target)) close(false); });
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener("change", function(){ if (prefs.theme === "auto") apply(); });

  sync(); apply();
})();
