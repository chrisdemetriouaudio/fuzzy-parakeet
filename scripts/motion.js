// Micro-behaviours for the homepage. None of them is needed to read or use the page.
// The movement runs only while <html> has the "motion" class: the <head> script adds it
// unless the visitor chose "Reduce motion" in Display or their device asks for less motion,
// and /scripts/display.js takes it away the moment they switch motion off, at which point
// everything here settles into its finished state.
(function(){
  var root = document.documentElement;
  var EASE = "cubic-bezier(.2, .7, .2, 1)";
  function moving(){ return root.classList.contains("motion"); }
  var hasIO = "IntersectionObserver" in window;

  // ── Scroll reveals: blocks that start below the fold rise into place as they arrive ──
  var REVEAL = [".band-head", ".grid-3 > li", ".grid-4 > li", ".steps > li", ".econ > *", ".bridge > *", ".faq > details", ".contact > *", ".band-foot"];
  function settleReveal(el){ el.removeAttribute("data-reveal"); el.classList.remove("in"); el.style.removeProperty("--d"); }
  var revealer = null;
  if (moving() && hasIO){
    revealer = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target, d = parseFloat(el.style.getPropertyValue("--d")) || 0;
        revealer.unobserve(el);
        el.classList.add("in");
        if (el.querySelector(".num-up")) countWithin(el, d);
        setTimeout(function(){ settleReveal(el); }, 700 + d);   // hand transforms back to hover effects
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(REVEAL.join(",")).forEach(function(el){
      if (el.getBoundingClientRect().top < innerHeight * 0.92) return;   // already on screen: leave it
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--d", Math.min(i * 80, 400) + "ms");
      el.setAttribute("data-reveal", "");
      revealer.observe(el);
    });
  }

  // ── Numbers count up as their card arrives. The real number stays in the page the
  //    whole time (search engines and screen readers read it); the ticking one is drawn over it.
  function count(el){
    var to = +el.getAttribute("data-to"), t0 = null;
    if (!to || !moving()) return;
    el.classList.add("counting");
    function step(t){
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / 1300);
      el.setAttribute("data-now", Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1 && moving()) requestAnimationFrame(step); else el.classList.remove("counting");
    }
    el.setAttribute("data-now", "0");
    requestAnimationFrame(step);
  }
  function countWithin(scope, delay){ setTimeout(function(){ scope.querySelectorAll(".num-up").forEach(count); }, delay + 150); }
  // numbers that were already on screen, or not inside a revealed block
  if (moving() && hasIO){
    var counter = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ counter.unobserve(e.target); count(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll(".num-up").forEach(function(n){ if (!n.closest("[data-reveal]")) counter.observe(n); });
  }

  // ── The nav highlight slides to the section you're in, and follows the pointer ──
  var nav = document.querySelector(".masthead .section-nav"), ink = null, hover = null, ticking = false;
  function items(){ return nav ? nav.querySelectorAll(":scope > ul > li > a, :scope > ul > li > details > summary") : []; }
  function place(){
    ticking = false;
    if (!nav || !ink) return;
    var t = hover || nav.querySelector(":scope > ul > li > a.current, :scope > ul > li > details > summary.current");
    nav.querySelectorAll(".inked").forEach(function(x){ if (x !== t) x.classList.remove("inked"); });
    if (!t || !moving()){ ink.style.opacity = "0"; return; }
    var r = t.getBoundingClientRect(), n = nav.getBoundingClientRect();
    var first = ink.style.opacity !== "1";
    if (first) ink.style.transition = "none";   // appear in place, then slide from there on
    ink.style.width = r.width + "px";
    ink.style.height = r.height + "px";
    ink.style.transform = "translate(" + (r.left - n.left) + "px," + (r.top - n.top) + "px)";
    ink.style.opacity = "1";
    t.classList.add("inked");
    if (first){ void ink.offsetWidth; ink.style.transition = ""; }
  }
  function queue(){ if (!ticking){ ticking = true; requestAnimationFrame(place); } }
  function inkOn(){
    if (!nav || ink) return;
    ink = document.createElement("span");
    ink.className = "nav-ink";
    ink.setAttribute("aria-hidden", "true");
    nav.appendChild(ink);
    nav.classList.add("has-ink");
    items().forEach(function(a){
      a.addEventListener("mouseenter", function(){ hover = a; queue(); });
      a.addEventListener("focus", function(){ hover = a; queue(); });
      a.addEventListener("blur", function(){ if (hover === a){ hover = null; queue(); } });
    });
    nav.addEventListener("mouseleave", function(){ hover = null; queue(); });
    queue();
  }
  function inkOff(){
    if (!ink) return;
    ink.remove(); ink = null; hover = null;
    nav.classList.remove("has-ink");
    nav.querySelectorAll(".inked").forEach(function(x){ x.classList.remove("inked"); });
  }
  if (moving()) inkOn();
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);

  // ── The header gets a soft shadow once the page moves under it ──
  var head = document.querySelector(".masthead");
  function shade(){ if (head) head.classList.toggle("scrolled", scrollY > 4); }
  addEventListener("scroll", shade, { passive: true });
  shade();

  // ── FAQ answers glide open and shut ──
  document.querySelectorAll(".faq details").forEach(function(d){
    var sum = d.querySelector("summary"), body = d.querySelector("summary + *");
    if (!sum || !body || !body.animate) return;
    sum.addEventListener("click", function(e){
      if (!moving()) return;   // the browser's own instant open/close
      e.preventDefault();
      var gap = getComputedStyle(body).marginBottom;
      body.style.overflow = "hidden";
      if (d.open){
        body.animate([{ height: body.offsetHeight + "px", marginBottom: gap, opacity: 1 }, { height: "0px", marginBottom: "0px", opacity: 0 }],
          { duration: 220, easing: "ease-in" }).onfinish = function(){ d.open = false; body.style.overflow = ""; };
      } else {
        d.open = true;
        body.animate([{ height: "0px", marginBottom: "0px", opacity: 0 }, { height: body.offsetHeight + "px", marginBottom: gap, opacity: 1 }],
          { duration: 300, easing: EASE }).onfinish = function(){ body.style.overflow = ""; };
      }
    });
  });

  // ── Copy the email address in one tap (not motion; it just saves typing) ──
  var said = document.getElementById("copy-status");
  document.querySelectorAll(".copy[data-copy]").forEach(function(b){
    if (!navigator.clipboard || !window.isSecureContext) return;
    b.hidden = false;
    var timer = null;
    b.addEventListener("click", function(){
      navigator.clipboard.writeText(b.getAttribute("data-copy")).then(function(){
        clearTimeout(timer);
        b.textContent = "Copied ✓";
        b.classList.add("copied");
        if (said) said.textContent = "Email address copied.";
        timer = setTimeout(function(){ b.textContent = "Copy"; b.classList.remove("copied"); if (said) said.textContent = ""; }, 2200);
      }, function(){});
    });
  });

  // ── Motion switched off (or on) in Display: settle everything at once ──
  new MutationObserver(function(){
    if (moving()){ inkOn(); return; }
    document.querySelectorAll("[data-reveal]").forEach(settleReveal);
    document.querySelectorAll(".num-up.counting").forEach(function(n){ n.classList.remove("counting"); });
    inkOff();
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
})();
