/* ==========================================================================
   enterprise.js — progressive enhancement only.
   --------------------------------------------------------------------------
   The page is complete without this file: case studies expand through native
   <details>, every section is readable, and all links work. This adds the
   scroll reveal and assembles the email address at runtime.
   ========================================================================== */

(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Reveal on scroll ───────────────────────────────────────────────
       The hiding rule is armed by a small inline script in the document head
       (html.js-reveal). If anything here fails, dropping that class restores
       every section immediately — content is never left invisible.
    ─────────────────────────────────────────────────────────────────────── */
    function showEverything() {
        document.documentElement.classList.remove('js-reveal');
    }

    function initReveal() {
        var targets = document.querySelectorAll('[data-reveal]');

        if (!targets.length || prefersReducedMotion || !('IntersectionObserver' in window)) {
            showEverything();
            return;
        }

        try {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });

            targets.forEach(function (el) { observer.observe(el); });

            /* Tells the head script's failsafe to stand down. */
            document.documentElement.setAttribute('data-reveal-ready', '');
        } catch (err) {
            showEverything();
        }
    }

    /* ── Email assembly ─────────────────────────────────────────────────
       Keeps the address out of the page source, matching the approach the
       media site already uses.
    ─────────────────────────────────────────────────────────────────────── */
    function initEmail() {
        var link = document.getElementById('enterprise-email');
        if (!link) return;

        var address = link.getAttribute('data-u') + '@' + link.getAttribute('data-d');
        var slot = link.querySelector('.contact__address');

        link.setAttribute('href', 'mailto:' + address);
        if (slot) slot.textContent = address;
    }

    /* ── Case studies ───────────────────────────────────────────────────
       One case opens by default so the section demonstrates its own depth.
       On a narrow screen that same open card buries the four beneath it, so
       it starts collapsed there instead. Only ever closed before the visitor
       has touched anything — never reopened underneath them.
    ─────────────────────────────────────────────────────────────────────── */
    function initCases() {
        var featured = document.querySelector('.case[data-desktop-open]');
        if (!featured) return;

        var narrow = window.matchMedia('(max-width: 1023px)');
        var touched = false;

        /* Listening for real interaction rather than the toggle event, which
           also fires for the programmatic change below and would immediately
           mark the card as touched. */
        var summary = featured.querySelector('summary');
        if (summary) {
            summary.addEventListener('click', function () { touched = true; });
            summary.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') touched = true;
            });
        }

        function apply() {
            if (!touched && narrow.matches) featured.open = false;
        }

        apply();

        if (typeof narrow.addEventListener === 'function') {
            narrow.addEventListener('change', apply);
        }
    }

    /* ── Scroll progress ────────────────────────────────────────────────
       The same micro-behaviour the media site runs, so moving between the
       two sections feels like one site. Read-only decoration — hidden from
       assistive technology and skipped entirely under reduced motion.
    ─────────────────────────────────────────────────────────────────────── */
    function initScrollBar() {
        var bar = document.getElementById('scroll-bar');
        if (!bar) return;

        if (prefersReducedMotion) {
            bar.style.display = 'none';
            return;
        }

        var ticking = false;

        function update() {
            var doc = document.documentElement;
            var scrollable = doc.scrollHeight - window.innerHeight;
            var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
            bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }, { passive: true });

        window.addEventListener('resize', update, { passive: true });
        update();
    }

    /* ── Diagram flow ───────────────────────────────────────────────────
       Runs only while the diagram is on screen. Animation that continues
       out of view is pure distraction — it costs attention and shows
       nobody anything.
    ─────────────────────────────────────────────────────────────────────── */
    function initFlow() {
        var diagram = document.querySelector('.diagram');
        if (!diagram) return;
        if (prefersReducedMotion) return;

        if (!('IntersectionObserver' in window)) {
            diagram.classList.add('is-flowing');
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                diagram.classList.toggle('is-flowing', entry.isIntersecting);
            });
        }, { threshold: 0.25 });

        observer.observe(diagram);
    }

    function init() {
        initReveal();
        initCases();
        initFlow();
        initScrollBar();
        initEmail();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
