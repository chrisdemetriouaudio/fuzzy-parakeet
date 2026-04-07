    // ── Logo alignment + width matching ──────────────────────────
    // 1. Measures the actual rendered cap height of the wordmark by
    //    comparing bounding boxes of an uppercase vs lowercase test span.
    // 2. Sets bar heights proportionally so the tallest bar = cap height.
    // 3. Aligns bars so their bottom sits exactly on the text baseline.
    // 4. Adjusts wordmark letter-spacing so logo row = tagline width.
    // All recalculates on resize.

    const trackSectionDescriptions = {

    "Drama":
        "Sound design and dialogue editing shaped to support narrative tension and character perspective.",

    "Podcast":
        "Editing and sound shaping that keeps conversations clear, engaging and naturally paced.",

    "Commercial":
        "Audio crafted to establish tone, clarity and impact within tight creative constraints.",

    "Radio Imaging":
        "Short-form audio designed to establish station identity instantly.",

    "Voice & Links":
        "Delivery focused on tone, pacing and connection with the listener."

};


/* Track-level notes */

const trackDescriptions = {

"The Quiet Path":
"Atmospheric narrative soundscape · building tension through place, silence and subtle movement",

"Mentalwealth":
"Public awareness audio piece · clear narrative arc guiding listeners from problem to action",

"That’ll Be The Tism":
"Podcast identity design · intro and imaging establishing tone and audience context",

"Tech Influence Unpacked":
"Magazine programme segment mix · structured conversation shaped for clarity and pace",

"Wired Different: From Chaos to Clarity":
"Neurodiversity podcast excerpt · conversational storytelling with warmth and reflective pacing",

"Proud Paws":
"Character-led commercial scene · domestic ambience and inclusive LGBTQ+ storytelling",

"Lumen Coffee House":
"Café scene commercial · environmental sound design building place and atmosphere",

"Yorkshire Fibre":
"Rural character story · regional voice and soundscape creating a sense of place",

"Bingey Box Streaming":
"Stylised retro broadcast parody · vintage tone and period sound design",

"Burger Goals":
"Community sports campaign · energetic storytelling supporting girls’ and women’s football",

"Pride Air":
"Travel campaign story · energetic pacing celebrating LGBTQ+ community journeys",

"Alpha: Ask the Big Questions":
"Reflective campaign montage · multi-voice storytelling exploring faith and meaning",

"Crunchy Morn":
"Comedic breakfast advert · playful timing and character driven humour",

"Chradio Christmas Artist Drop":
"Radio imaging artist drop · rhythmic branding for seasonal broadcast identity",

"Chris Radio Breakfast":
"Breakfast show imaging · high energy stings shaping programme pace and tone",

"This Is Chris Radio":
"Station ID jingle · concise sonic branding for recognition and continuity",

"Dignity for Chips: The Air Fryer Cult":
"Scripted mock documentary comedy · narration and timing driving absurd storytelling",

"Chradio Presenter Link":
"Presenter link production · voice, music and imaging integrated into broadcast flow",

"Theatre of the Mind":
"Cinematic audio trailer · dramatic sound design creating narrative tension"

};

/* FAST LOOKUP MAP */

const trackDescriptionsNormalized = {};

Object.keys(trackDescriptions).forEach(function(key){
    trackDescriptionsNormalized[key.toLowerCase()] = trackDescriptions[key];
});

/* SHOWREEL LISTENING ORDER (ALL TAB ONLY) */

const showreelOrder = [

"Wired Different: From Chaos to Clarity",
"The Quiet Path",
"Lumen Coffee House",
"Yorkshire Fibre",
"Mentalwealth",
"Tech Influence Unpacked",

"Dignity for Chips: The Air Fryer Cult",
"Theatre of the Mind",

"Chradio Presenter Link",
"That’ll Be The Tism",

"Chris Radio Breakfast",
"Chradio Christmas Artist Drop",
"This Is Chris Radio",

"Proud Paws",
"Burger Goals",
"Pride Air",
"Alpha: Ask the Big Questions",

"Bingey Box Streaming",
"Crunchy Morn"

];


function alignLogo() {

    const logos = document.querySelectorAll('.cdaudio-wordmark-text');

    logos.forEach(wordmark => {

        const container = wordmark.closest('.nav-brand, .ap-brand');
        if (!container) return;

        const mark = container.querySelector('.logo-mark');
        if (!mark) return;

        const bars = mark.querySelectorAll('.bar');
        if (!bars.length) return;

        // ── Measure cap height ─────────────────────────────
        const probe = document.createElement('span');
        probe.textContent = 'H';
        probe.style.cssText = `
            position: absolute;
            visibility: hidden;
            pointer-events: none;
            font-family: ${getComputedStyle(wordmark).fontFamily};
            font-size: ${getComputedStyle(wordmark).fontSize};
            font-weight: ${getComputedStyle(wordmark).fontWeight};
            line-height: 1;
            white-space: nowrap;
        `;

        document.body.appendChild(probe);
        const capH = probe.getBoundingClientRect().height;
        document.body.removeChild(probe);

        mark.style.height = capH + 'px';

        // ── Bar ratios ─────────────────────────────────────
        const ratios = [0.38, 0.62, 0.88, 1.0, 0.72, 0.46, 0.28];

        bars.forEach((bar, i) => {
            bar.style.height = Math.round(capH * ratios[i]) + 'px';
        });

    });
}

document.addEventListener('DOMContentLoaded', () => {
    alignLogo();
    window.addEventListener('resize', alignLogo);

    const menuBtn  = document.querySelector('.menu-btn');
    const navLinks = document.getElementById('nav-links') || document.querySelector('.nav-overlay');
    const backToTop = document.getElementById('back-to-top');

    // ─── 1. Burger Menu ──────────────────────────────────────────
if (menuBtn && navLinks) {

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        const open = navLinks.classList.toggle('active');

        menuBtn.classList.toggle('is-open', open);
        document.body.classList.toggle('menu-open', open);
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuBtn.classList.remove('is-open');
            document.body.classList.remove('menu-open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
            navLinks.classList.remove('active');
            menuBtn.classList.remove('is-open');
            document.body.classList.remove('menu-open');
        }
    });
}

    // ─── 2. Smooth Scrolling ─────────────────────────────────────
    const CHROME_OFFSET = 108; // no fixed navbar

    function slowScrollTo(targetY, duration) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        let startTime = null;
        function ease(t) { return t; }
        function step(now) {
            if (!startTime) startTime = now;
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            window.scrollTo(0, startY + distance * ease(progress));
            if (elapsed < duration) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offsetPosition =
                    targetElement.getBoundingClientRect().top +
                    window.pageYOffset -
                    CHROME_OFFSET;

                slowScrollTo(offsetPosition, 700);
            }
        });
    });


    // ─── 3. Scroll bar — fades in behind logo + burger ───────────
    const scrollBar = document.getElementById('scroll-bar');
    const navBrand = document.getElementById('nav-brand');
    if (scrollBar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                scrollBar.classList.add('visible');
                navBrand.classList.add('scrolled');
            } else {
                scrollBar.classList.remove('visible');
                navBrand.classList.remove('scrolled');
            }
        }, { passive: true });
    }


    // ─── 4. Back to Top Button ───────────────────────────────────
    // Shows the button after scrolling 400px, hides it at the top.
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // ─── 5. Scroll Reveal Animation ──────────────────────────────
    // JS adds .reveal to target elements, then IntersectionObserver
    // adds .active when they enter the viewport — CSS does the rest.
    const observerOptions = {
        threshold:  0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // animate once only
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .hero-content, .section-title, .split-content p, .step, .testimonial')
        .forEach(el => {
            // Don't apply reveal to anything inside the fixed navbar or ribbon
            if (el.closest('.navbar') || el.closest('.ribbon-static')) return;
            el.classList.add('reveal');
            observer.observe(el);
        });


    // ─── 6. Auto-Update Copyright Year ───────────────────────────
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }


    // ─── 8. Ticker — rAF-driven, opposite directions, always on ─────────────────
    // Top row scrolls LEFT, bottom row scrolls RIGHT.
    // Always running on all devices. Hover/touch pauses to let names be read.
    (function () {
        const wrap = document.querySelector('.ticker-rows-wrap');
        if (!wrap) return;

        const tickers = Array.from(wrap.querySelectorAll('.ticker'));
        if (!tickers.length) return;

        // Kill any CSS animation — JS owns the transform from here
        tickers.forEach(t => {
            t.style.animation = 'none';
            t.style.transform = 'translateX(0)';
        });

        const SPEED = 100; // px/s for all sizes

        // Even-index ticker (top) → left (−1),  odd-index (bottom) → right (+1)
        const dirs = tickers.map((_, i) => i % 2 === 0 ? -1 : 1);
        const pos  = tickers.map(() => 0);
        const seeded = tickers.map(() => false); // right-moving needs a -half seed

        let speed = SPEED; // always running — hover sets to 0
        let raf   = null;
        let last  = 0;

        function frame(ts) {
            const dt = Math.min((ts - last) / 1000, 0.05); // cap at 50 ms (tab-switch guard)
            last = ts;

            tickers.forEach((t, i) => {
                const half = t.scrollWidth / 2; // content doubled in HTML → seamless loop
                if (half <= 0) return;

                // Seed right-moving ticker at −half so it starts mid-loop (no blank run-in)
                if (!seeded[i]) {
                    pos[i] = dirs[i] === 1 ? -half : 0;
                    seeded[i] = true;
                }

                if (speed > 0) {
                    pos[i] += dirs[i] * speed * dt;
                    // Seamless wrap for each direction
                    if (dirs[i] === -1 && pos[i] <= -half) pos[i] += half;
                    if (dirs[i] ===  1 && pos[i] >=    0) pos[i] -= half;
                }

                t.style.transform = `translateX(${pos[i]}px)`;
            });

            raf = requestAnimationFrame(frame);
        }

        // Start immediately — always on, all devices
        last = performance.now();
        raf  = requestAnimationFrame(frame);

        // Hover / touch → pause so names can be read; release → resume
        wrap.addEventListener('mouseenter', () => { speed = 0; });
        wrap.addEventListener('mouseleave', () => { speed = SPEED; });
        wrap.addEventListener('touchstart', () => { speed = 0; }, { passive: true });
        wrap.addEventListener('touchend',   () => { speed = SPEED; }, { passive: true });
    })();


    // ON AIR (red) → ON DEMAND (amber) → IN POST (green) → loop
    // Tube dims, colour shifts, text changes, tube flickers back on

    const NEON_STATES = [
        { text: 'ON AIR',    cls: 'state-on-air'    },
        { text: 'ON DEMAND', cls: 'state-on-demand' },
        { text: 'IN POST',   cls: 'state-in-post'   },
    ];

    const NEON_HOLD   = 3800;
    const NEON_DIM_MS = 600;
    const NEON_GAP_MS = 150;

    function initNeonSign(frameEl, textEl) {
        let current = 0;

        frameEl.classList.add(NEON_STATES[0].cls);
        textEl.textContent = NEON_STATES[0].text;

        function cycle() {
            frameEl.classList.add('neon-dim');

            setTimeout(() => {
                const next = (current + 1) % NEON_STATES.length;
                frameEl.classList.remove(NEON_STATES[current].cls);
                frameEl.classList.add(NEON_STATES[next].cls);
                textEl.textContent = NEON_STATES[next].text;
                current = next;

                setTimeout(() => {
                    frameEl.classList.remove('neon-dim');
                    frameEl.classList.add('neon-flicker');

                    setTimeout(() => {
                        frameEl.classList.remove('neon-flicker');
                        setTimeout(cycle, NEON_HOLD);
                    }, 500);

                }, NEON_GAP_MS);

            }, NEON_DIM_MS);
        }

        setTimeout(cycle, NEON_HOLD);
    }

    document.querySelectorAll('.neon-sign').forEach(sign => {
        const frame = sign.querySelector('.neon-frame');
        const text  = sign.querySelector('.neon-text');
        if (frame && text) initNeonSign(frame, text);
    });




   // ── Audio Academy badge: Attending on 13 March 2026, Complete from 14 March ──
   // Runs inside DOMContentLoaded so the badge is updated before sortRightNowTable reads it
   (function () {
      var badge = document.getElementById('radio-academy-status');
      if (!badge) return;
      var now      = new Date();
      var eventDay = new Date('2026-03-13T00:00:00');
      var dayAfter = new Date('2026-03-14T00:00:00');
      if (now >= dayAfter) {
         badge.textContent = 'Complete';
         badge.className = 'tag status-complete';
      } else if (now >= eventDay) {
         badge.textContent = 'Attending';
         badge.className = 'tag status-attending';
      }
   })();

});

   // ── Gameboard signal chain ──
   (function () {
      var chain = [
         { id: 'gb-c12',  cls: 'is-live' },
         { id: 'gb-c23',  cls: 'is-live' },
         { id: 'gb-cvr',  cls: 'is-live' },
         { id: 'gb-c45',  cls: 'is-live' },
         { id: 'gb-c56',  cls: 'is-live' },
      ];
      var step = 0;

      function pulse() {
         chain.forEach(function(c) {
            var el = document.getElementById(c.id);
            if (el) { el.classList.remove(c.cls); void el.offsetWidth; }
         });
         var cur = chain[step];
         var el = document.getElementById(cur.id);
         if (el) { void el.offsetWidth; el.classList.add(cur.cls); }
         step = (step + 1) % chain.length;
      }

      setTimeout(function() {
         pulse();
         setInterval(pulse, 850);
      }, 800);
   })();

// Player JS moved to js/player.js
    /* RIGHT NOW table dynamic sorting */

    function sortRightNowTable() {

        const table = document.querySelector('#career table tbody');
        if (!table) return;

        const rows = Array.from(table.querySelectorAll('tr'));

        const statusOrder = {
            "status-active": 1,
            "status-attending": 2,
            "status-upcoming": 3,
            "status-pending": 4,
            "status-discussion": 5,
            "status-complete": 6
        };

        rows.sort((a, b) => {

            const aStatus = Array.from(a.querySelectorAll('.tag'))
                .find(t => t.className.includes('status-'));

            const bStatus = Array.from(b.querySelectorAll('.tag'))
                .find(t => t.className.includes('status-'));

            const aKey = Object.keys(statusOrder)
                .find(k => aStatus.classList.contains(k));

            const bKey = Object.keys(statusOrder)
                .find(k => bStatus.classList.contains(k));

            const statusDiff = statusOrder[aKey] - statusOrder[bKey];
            if (statusDiff !== 0) return statusDiff;

            const aType = a.querySelector('.tag[class*="cat-"]')?.textContent || "";
            const bType = b.querySelector('.tag[class*="cat-"]')?.textContent || "";

            return aType.localeCompare(bType);

        });

        rows.forEach(row => table.appendChild(row));
    }

    // sortRightNowTable disabled — table order is set manually in HTML
    // document.addEventListener("DOMContentLoaded", sortRightNowTable);

    /* Cinematic hero parallax */
window.addEventListener("scroll", function () {

    const heroImg = document.querySelector(".hero-img");
    const heroContent = document.querySelector(".hero-content");

    if (!heroImg || !heroContent) return;

    const scroll = window.scrollY;

    heroImg.style.transform = "translateY(" + (scroll * 0.35) + "px)";

});

/* Ambient cursor spotlight */

document.addEventListener("mousemove", function(e) {

    document.body.style.setProperty("--mouse-x", e.clientX + "px");
    document.body.style.setProperty("--mouse-y", e.clientY + "px");

});

document.querySelector('.hero-cta').addEventListener('click', function(e){

e.preventDefault();

const target = document.querySelector('#soundcloud-section');

const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;

const startPosition = window.pageYOffset;

const distance = targetPosition - startPosition;

const duration = 1400;

let start = null;

function animation(currentTime){

if(start === null) start = currentTime;

const timeElapsed = currentTime - start;

const progress = Math.min(timeElapsed / duration, 1);

window.scrollTo(0, startPosition + distance * easeInOut(progress));

if(timeElapsed < duration){
requestAnimationFrame(animation);
}

}

function easeInOut(t){
return t < 0.5
? 2 * t * t
: 1 - Math.pow(-2 * t + 2, 2) / 2;
}

requestAnimationFrame(animation);

});

const creditTabs = document.querySelectorAll(".credits-tab");
const creditPanels = document.querySelectorAll(".credits-tab-content");

creditTabs.forEach(function(tab){

tab.addEventListener("click", function(){

creditTabs.forEach(function(t){
t.classList.remove("active");
});

creditPanels.forEach(function(p){
p.classList.remove("active");
});

tab.classList.add("active");

document.getElementById(tab.dataset.tab).classList.add("active");

});

});

/* =====================================
   Progressive Reveal for Credits Tables
   ===================================== */

const revealRows = document.querySelectorAll(".reveal-row");

const revealObserver = new IntersectionObserver(function(entries){

entries.forEach(function(entry){

if(entry.isIntersecting){

entry.target.classList.add("visible");

}

});

},{
threshold:0.05
});

revealRows.forEach(function(row){

revealObserver.observe(row);

});


/* ============================================================
   MICRO-INTERACTIONS — Premium layer
   ============================================================ */

// ── 1. Hero title — one-shot glitch on page load ─────────────
(function () {
    const title = document.querySelector('.hero-title');
    if (!title) return;
    // Fire after fonts & layout have settled
    setTimeout(function () {
        title.classList.add('glitch-active');
        title.addEventListener('animationend', function () {
            title.classList.remove('glitch-active');
        }, { once: true });
    }, 700);
})();


// ── 2. Nav text scramble on hover ────────────────────────────
(function () {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·▸◉█▪';
    const FRAMES = 18;

    function scramble(el) {
        const original = el.dataset.scrambleOrig || el.textContent;
        el.dataset.scrambleOrig = original;
        let frame = 0;

        (function tick() {
            el.textContent = original.split('').map(function (char, i) {
                if (char === ' ') return ' ';
                // Resolve letters progressively left-to-right
                if (i < Math.floor((frame / FRAMES) * original.length)) return original[i];
                return CHARS[Math.floor(Math.random() * CHARS.length)];
            }).join('');
            frame++;
            if (frame <= FRAMES) requestAnimationFrame(tick);
            else el.textContent = original;
        })();
    }

    document.querySelectorAll('.nav-item').forEach(function (el) {
        el.addEventListener('mouseenter', function () { scramble(el); });
    });
})();


// ── 3. cdplayer — subtle 3-D perspective tilt on hover ───────
(function () {
    const player = document.querySelector('.cdplayer');
    if (!player) return;
    const MAX = 2.5; // max degrees

    player.addEventListener('mousemove', function (e) {
        const r = player.getBoundingClientRect();
        const x = (e.clientX - r.left)  / r.width  - 0.5; // -0.5 → +0.5
        const y = (e.clientY - r.top)   / r.height - 0.5;
        player.style.transition = 'transform 0.08s ease-out';
        player.style.transform  = `perspective(900px) rotateY(${x * MAX * 2}deg) rotateX(${-y * MAX * 2}deg)`;
    });

    player.addEventListener('mouseleave', function () {
        player.style.transition = 'transform 0.6s ease-out';
        player.style.transform  = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
    });
})();


// ── 4. Button click ripple ────────────────────────────────────
(function () {
    document.querySelectorAll('.cdp-btn, .hero-cta, .back-to-top').forEach(function (btn) {
        btn.style.overflow = 'hidden';

        btn.addEventListener('click', function (e) {
            const r    = btn.getBoundingClientRect();
            const x    = e.clientX - r.left;
            const y    = e.clientY - r.top;
            const size = Math.max(r.width, r.height) * 2.2;

            const dot = document.createElement('span');
            dot.style.cssText = [
                'position:absolute',
                `left:${x - size / 2}px`,
                `top:${y - size / 2}px`,
                `width:${size}px`,
                `height:${size}px`,
                'border-radius:50%',
                'background:rgba(238,255,0,0.18)',
                'pointer-events:none',
                'animation:btn-ripple-expand 0.55s ease-out forwards'
            ].join(';');

            btn.appendChild(dot);
            dot.addEventListener('animationend', function () { dot.remove(); });
        });
    });
})();


// ── Showreel Modal (v71) ────────────────────────────────────────
(function () {
    var btn        = document.getElementById('reel-float-btn');
    var modal      = document.getElementById('reel-modal');
    var close      = document.getElementById('reel-modal-close');
    var video      = document.getElementById('reel-video');
    var playBtn    = document.getElementById('reel-play-btn');

    if (!btn || !modal) return;

    function hidePlayButton() {
        if (playBtn) playBtn.classList.add('hidden');
    }

    function openReel() {
        modal.classList.add('reel-active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeReel() {
        modal.classList.remove('reel-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (video) { video.pause(); video.currentTime = 0; }
        if (playBtn) playBtn.classList.remove('hidden');
    }

    // Play button click handler
    if (playBtn) {
        playBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (video) {
                video.play().catch(function() {});
                hidePlayButton();
            }
        });
    }

    // Hide play button when video starts playing (native controls)
    if (video) {
        video.addEventListener('play', hidePlayButton);
    }

    btn.addEventListener('click', openReel);

    // Any element with data-open-reel also opens the showreel (e.g. hero button)
    document.querySelectorAll('[data-open-reel]').forEach(function(el) {
        el.addEventListener('click', function(e) { e.preventDefault(); openReel(); });
    });

    if (close) close.addEventListener('click', closeReel);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeReel();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('reel-active')) closeReel();
    });
})();

// ── SSL Mixing Console Faders ──────────────────────────────────────────────────
(function() {
    const categories = [
        {
            name: 'Radio Production',
            skills: ['Imaging', 'Features', 'Package Production', 'Content Editing']
        },
        {
            name: 'Podcast Production',
            skills: ['Dialogue Editing', 'Full Audio & Video Podcast', 'Production']
        },
        {
            name: 'Sound Design',
            skills: ['Narrative', 'Audio Drama', 'Documentaries', 'Immersive Audio']
        }
    ];

    let soundEnabled = false;
    const faderStates = {};

    function createMixer() {
        const mixerChannels = document.querySelector('.mixer-channels');
        if (!mixerChannels) return;

        // Clear existing content
        mixerChannels.innerHTML = '';

        categories.forEach((category, index) => {
            // Initialize fader state - START AT TOP (100%)
            faderStates[index] = { percentage: 100 };

            // Create channel strip container
            const channelStrip = document.createElement('div');
            channelStrip.className = 'channel-strip';
            channelStrip.setAttribute('data-channel', index);

            // Create fader track with handle and meter
            const faderTrack = document.createElement('div');
            faderTrack.className = 'fader-track';

            const meterFill = document.createElement('div');
            meterFill.className = 'fader-meter-fill';
            meterFill.style.height = '100%';

            const faderHandle = document.createElement('div');
            faderHandle.className = 'fader-handle';
            faderHandle.setAttribute('draggable', 'false');

            faderTrack.appendChild(meterFill);
            faderTrack.appendChild(faderHandle);

            // Create category name
            const categoryName = document.createElement('div');
            categoryName.className = 'channel-name';
            categoryName.textContent = category.name;

            // Create skills container
            const skillsContainer = document.createElement('div');
            skillsContainer.className = 'skills-container';

            category.skills.forEach(skill => {
                const badge = document.createElement('div');
                badge.className = 'skill-badge';
                badge.textContent = skill;
                skillsContainer.appendChild(badge);
            });

            // Assemble channel strip: TWO-COLUMN layout
            // 1. Channel name spans full width at top
            channelStrip.appendChild(categoryName);

            // 2. Create main content wrapper (two columns)
            const contentWrapper = document.createElement('div');
            contentWrapper.style.display = 'flex';
            contentWrapper.style.gap = '12px';
            contentWrapper.style.width = '100%';
            contentWrapper.style.alignItems = 'flex-start';

            // LEFT: Fader
            contentWrapper.appendChild(faderTrack);

            // RIGHT: Skills + Knobs + Routing
            const rightColumn = document.createElement('div');
            rightColumn.style.display = 'flex';
            rightColumn.style.flexDirection = 'column';
            rightColumn.style.gap = '8px';
            rightColumn.style.flex = '1';
            rightColumn.style.overflow = 'hidden';

            // Skills
            rightColumn.appendChild(skillsContainer);

            // Create knobs section
            const knobsSection = document.createElement('div');
            knobsSection.className = 'knobs-section';

            // Pan knob
            const panKnobControl = createKnobControl('Pan', 'PAN', index, 'pan');
            knobsSection.appendChild(panKnobControl);

            // Gain and Aux knobs row
            const knobsRow = document.createElement('div');
            knobsRow.className = 'knobs-row';

            const gainKnobControl = createKnobControl('Gain', 'GAIN', index, 'gain');
            const auxKnobControl = createKnobControl('Aux', 'AUX', index, 'aux');

            knobsRow.appendChild(gainKnobControl);
            knobsRow.appendChild(auxKnobControl);
            knobsSection.appendChild(knobsRow);

            // Routing matrix
            const routingMatrix = createRoutingMatrix(index);
            knobsSection.appendChild(routingMatrix);

            // Add knobs section to right column
            rightColumn.appendChild(knobsSection);

            // Assemble
            contentWrapper.appendChild(rightColumn);
            channelStrip.appendChild(contentWrapper);

            // Add fader event listeners
            addFaderListeners(faderTrack, faderHandle, meterFill, channelStrip, index);

            // Initialize fader to UP position (100%) with skill badges illuminated
            updateFader(index, 100, faderHandle, meterFill, channelStrip);

            mixerChannels.appendChild(channelStrip);
        });
    }

    function createKnobControl(label, displayLabel, channelIndex, knobType) {
        const control = document.createElement('div');
        control.className = 'knob-control';
        control.style.flex = '1';

        const knob = document.createElement('div');
        knob.className = 'knob';
        knob.setAttribute('data-channel', channelIndex);
        knob.setAttribute('data-knob-type', knobType);
        knob.style.setProperty('--rotation', '0deg');

        const value = document.createElement('div');
        value.className = 'knob-value';
        value.textContent = '50%';

        const labelEl = document.createElement('div');
        labelEl.className = 'knob-label';
        labelEl.textContent = displayLabel;

        // Knob interaction
        let isDragging = false;
        let startY = 0;
        let currentRotation = 0;

        function handleKnobStart(e) {
            isDragging = true;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            knob.style.cursor = 'grabbing';
        }

        function handleKnobMove(e) {
            if (!isDragging) return;
            const currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const delta = startY - currentY;
            currentRotation = Math.max(-90, Math.min(90, currentRotation + delta * 0.5));
            startY = currentY;

            const percentage = Math.round((currentRotation + 90) / 180 * 100);
            knob.style.transform = `rotate(${currentRotation}deg)`;
            value.textContent = percentage + '%';
        }

        function handleKnobEnd() {
            isDragging = false;
            knob.style.cursor = 'pointer';
        }

        knob.addEventListener('mousedown', handleKnobStart);
        knob.addEventListener('touchstart', handleKnobStart);
        document.addEventListener('mousemove', handleKnobMove);
        document.addEventListener('touchmove', handleKnobMove);
        document.addEventListener('mouseup', handleKnobEnd);
        document.addEventListener('touchend', handleKnobEnd);

        control.appendChild(knob);
        control.appendChild(value);
        control.appendChild(labelEl);

        return control;
    }

    function createRoutingMatrix(channelIndex) {
        const container = document.createElement('div');
        container.className = 'routing-matrix';

        const header = document.createElement('div');
        header.className = 'routing-header';
        header.textContent = 'Routing';

        const grid = document.createElement('div');
        grid.className = 'routing-grid';

        const busses = ['L', 'R', 'C', 'M'];
        busses.forEach(bus => {
            const button = document.createElement('button');
            button.className = 'routing-button';
            button.textContent = bus;
            button.setAttribute('data-channel', channelIndex);
            button.setAttribute('data-bus', bus);

            button.addEventListener('click', function() {
                this.classList.toggle('active');
            });

            grid.appendChild(button);
        });

        container.appendChild(header);
        container.appendChild(grid);
        return container;
    }

    function addFaderListeners(faderTrack, faderHandle, meterFill, channelStrip, index) {
        let isDragging = false;

        function handleStart(e) {
            isDragging = true;
            faderHandle.style.cursor = 'grabbing';
        }

        function handleMove(e) {
            if (!isDragging) return;

            e.preventDefault();

            // Get mouse/touch position
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const rect = faderTrack.getBoundingClientRect();
            const trackHeight = rect.height;

            // Calculate fader position (inverted: bottom = 100%, top = 0%)
            let newY = clientY - rect.top;
            newY = Math.max(0, Math.min(newY, trackHeight));
            const percentage = ((trackHeight - newY) / trackHeight) * 100;

            updateFader(index, percentage, faderHandle, meterFill, channelStrip);

            if (soundEnabled) {
                playFaderSound(percentage);
            }
        }

        function handleEnd(e) {
            isDragging = false;
            faderHandle.style.cursor = 'grab';
        }

        // Mouse events
        faderHandle.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);

        // Touch events
        faderHandle.addEventListener('touchstart', handleStart);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
    }

    function updateFader(index, percentage, faderHandle, meterFill, channelStrip) {
        faderStates[index].percentage = percentage;

        // Constrain percentage to 0-100
        percentage = Math.max(0, Math.min(100, percentage));

        // Update handle position - account for handle height to keep it within bounds
        // Handle is 40px tall, track is 300px. Keep handle center within track bounds
        const handleHeightPercent = (40 / 300) * 100; // ~13.3%
        const maxBottomPercent = 100 - handleHeightPercent;
        const constrainedPosition = Math.max(0, Math.min(percentage, maxBottomPercent));

        faderHandle.style.bottom = constrainedPosition + '%';

        // Update meter fill
        meterFill.style.height = percentage + '%';

        // Update skill badges brightness
        const badges = channelStrip.querySelectorAll('.skill-badge');
        badges.forEach(badge => {
            if (percentage > 0) {
                badge.classList.add('active');
                // Set opacity based on percentage (brighter as fader goes up)
                badge.style.opacity = 0.4 + (percentage / 100) * 0.6;
            } else {
                badge.classList.remove('active');
                badge.style.opacity = '0.4';
            }
        });
    }

    function playFaderSound(percentage) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            // Map percentage to frequency (100-2000 Hz range)
            const frequency = 100 + (percentage / 100) * 1900;
            oscillator.frequency.value = frequency;

            // Short beep envelope
            gain.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.05);
        } catch (e) {
            // Audio API not supported, silently fail
        }
    }

    function initMixer() {
        createMixer();

        // Sound toggle button
        const soundToggle = document.querySelector('#sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', function() {
                soundEnabled = !soundEnabled;
                this.classList.toggle('active', soundEnabled);
            });
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMixer);
    } else {
        initMixer();
    }
})();