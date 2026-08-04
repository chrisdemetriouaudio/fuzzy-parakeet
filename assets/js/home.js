/* ==========================================================================
   home.js — progressive enhancement only.
   --------------------------------------------------------------------------
   The page is complete without this file: case studies expand through native
   <details>, every section is readable, every link works. This adds the
   reveal, the sticky header state, the count-up and the email assembly.

   Nothing here animates twice. Repeat motion is the difference between
   guidance and irritation.
   ========================================================================== */

(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Sticky header ──────────────────────────────────────────────────
       Transparent over the hero, solid once you've left it. */
    function initHeader() {
        var hd = document.getElementById('hd');
        if (!hd) return;
        var ticking = false;

        function update() {
            hd.classList.toggle('is-stuck', window.scrollY > 40);
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }, { passive: true });

        update();
    }

    /* ── Reveal ─────────────────────────────────────────────────────────
       The hiding rule is armed by an inline script in the head. If anything
       here fails, dropping that class restores every section immediately —
       content is never left invisible.

       Siblings stagger, so the cascade rows arrive in sequence. That is the
       one place motion earns its keep: it is what happens on a real
       programme, one consequence at a time. */
    function initReveal() {
        var root = document.documentElement;
        var targets = document.querySelectorAll('[data-reveal]');

        function showAll() { root.classList.remove('js-reveal'); }

        if (!targets.length || reduced || !('IntersectionObserver' in window)) {
            showAll();
            return;
        }

        try {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;

                    var siblings = Array.prototype.filter.call(
                        entry.target.parentElement.children,
                        function (n) { return n.hasAttribute('data-reveal'); }
                    );
                    var i = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = (Math.min(i, 9) * 60) + 'ms';
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

            targets.forEach(function (el) { io.observe(el); });
            root.setAttribute('data-reveal-ready', '');
        } catch (err) {
            showAll();
        }
    }

    /* ── Count-up ───────────────────────────────────────────────────────
       Once, on first sight, never again on scroll-back. */
    function initCounters() {
        var groups = document.querySelectorAll('.stats');
        if (!groups.length || reduced || !('IntersectionObserver' in window)) return;

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                io.unobserve(entry.target);

                entry.target.querySelectorAll('[data-count]').forEach(function (el) {
                    var to = parseInt(el.getAttribute('data-count'), 10);
                    var pre = el.getAttribute('data-prefix') || '';
                    var suf = el.getAttribute('data-suffix') || '';
                    var start = 0;

                    function step(ts) {
                        if (!start) start = ts;
                        var p = Math.min((ts - start) / 900, 1);
                        var v = Math.round(to * (1 - Math.pow(1 - p, 3)));
                        el.innerHTML = pre + v.toLocaleString('en-GB') + suf;
                        if (p < 1) window.requestAnimationFrame(step);
                    }

                    window.requestAnimationFrame(step);
                });
            });
        }, { threshold: 0.4 });

        groups.forEach(function (el) { io.observe(el); });
    }

    /* ── Email ──────────────────────────────────────────────────────────
       Assembled at runtime so the address never sits in the page source,
       which blocks the great majority of harvesting bots. Same approach the
       media site has always used. */
    function initEmail() {
        var el = document.getElementById('mail');
        if (!el) return;
        el.setAttribute('href', 'mailto:' + el.getAttribute('data-u') + '@' + el.getAttribute('data-d'));
    }

    function init() {
        initHeader();
        initReveal();
        initCounters();
        initEmail();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
