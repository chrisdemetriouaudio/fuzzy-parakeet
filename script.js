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
    const navLinks = document.querySelector('.nav-overlay');
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

// ─────────────────────────────────────────────
// SoundCloud Engine with Preload + Loading Bar + Fallback
// ─────────────────────────────────────────────

window.addEventListener('load', function () {

    const iframe   = document.getElementById('sc-widget');
    const player   = document.querySelector('.bottom-player');
    const fallback = document.getElementById('sc-fallback');
    const loading  = document.querySelector('.ap-loading');
    const artwork  = document.getElementById('ap-artwork-img');
    const mainArtwork = document.getElementById('cdp-artwork-img');

    if (!iframe) return;

    function initSoundCloud() {

        if (typeof SC === 'undefined' || !SC.Widget) {
            setTimeout(initSoundCloud, 100);
            return;
        }

        window.scWidget = SC.Widget(iframe);
        const widget = window.scWidget;
        console.log("Widget created");

        const playBtn  = document.getElementById('ap-play-btn');
        const prevBtn  = document.getElementById('ap-prev-btn');
        const nextBtn  = document.getElementById('ap-next-btn');

        const titleEl = document.querySelector('.ap-track-title');
        const mainTitleEl = document.getElementById('cdp-title');

        const subEl   = document.querySelector('.ap-track-sub');
        const extraEl = document.querySelector('.ap-track-extra');

        const timeEl = document.querySelector('.ap-time-overlay');

        const mainCurrent = document.getElementById('cdp-current');
        const mainDuration = document.getElementById('cdp-duration');
        const mainProgressFill  = null; // replaced by waveform canvas
        const mainProgressThumb = null;
        const mainProgressTrack = null;
        const mainTracklist = document.getElementById('cdp-tracklist');
        const mainCanvas = document.getElementById('cdp-waveform');
        const mainCtx = mainCanvas ? mainCanvas.getContext('2d') : null;

        const volumeSlider = document.getElementById('ap-volume');
        const mainVolumeSlider = document.getElementById('cdp-volume');

        const canvas = document.getElementById('ap-waveform');
        const ctx = canvas ? canvas.getContext('2d') : null;

        function updateVolumeFill(slider) {
    const percent = (slider.value / slider.max) * 100 + "%";
    slider.style.setProperty("--vol", percent);
}

        /* ───── Waveform drawing ───── */
        let bars     = [];      // bottom player — sized to its canvas width
        let mainBars = [];      // main player   — sized to its own wider canvas
        const barWidth = 2;
        const gap      = 2;

        function _makeBars(width, height) {
            const arr   = [];
            const count = Math.floor(width / (barWidth + gap));
            for (let i = 0; i < count; i++) arr.push(Math.random() * height);
            return arr;
        }

        // Draw a specific bars array onto a specific canvas/ctx
        function _drawWaveOn(c, x, barsArr, progress) {
            if (!c || !x || !barsArr.length) return;
            const dpr = window.devicePixelRatio || 1;
            const w   = c.width  / dpr;
            const h   = c.height / dpr;
            x.clearRect(0, 0, w, h);
            const progressX = w * progress;
            const accent = getComputedStyle(document.documentElement)
                               .getPropertyValue('--accent').trim();
            barsArr.forEach((barH, i) => {
                const px = i * (barWidth + gap);
                const py = (h - barH) / 2;
                x.fillStyle   = px < progressX ? accent : 'white';
                x.globalAlpha = px < progressX ? 1 : 0.25;
                x.fillRect(px, py, barWidth, barH);
            });
        }

        // Draw on both players — each uses its own bar array
        function drawWave(progress = 0) {
            _drawWaveOn(canvas,     ctx,     bars,     progress);
            _drawWaveOn(mainCanvas, mainCtx, mainBars, progress);
        }

        // ── Bottom player canvas setup / resize ──
        function resizeWaveformCanvas() {
            if (!canvas || !ctx) return;
            const dpr     = window.devicePixelRatio || 1;
            const wrapper = canvas.parentElement;
            if (!wrapper) return;
            const w = wrapper.offsetWidth;
            const h = wrapper.offsetHeight || 56;
            if (!w) return;
            canvas.width  = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            bars = _makeBars(w, h);   // regenerate for new width
            if (duration && duration > 0) {
                widget.getPosition(function (pos) { drawWave(pos / duration); });
            } else {
                drawWave(0);
            }
        }

        function setupCanvas() {
            if (!canvas || !ctx) return;
            const wrapper = canvas.parentElement;
            if (!wrapper) return;
            const w = wrapper.offsetWidth;
            const h = wrapper.offsetHeight || 56;
            if (!w) { setTimeout(setupCanvas, 100); return; }
            const dpr = window.devicePixelRatio || 1;
            canvas.width  = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            bars = _makeBars(w, h);   // bottom player's own bar array
            drawWave(0);
        }

        // ── Main player canvas setup / resize ──
        function resizeMainCanvas() {
            if (!mainCanvas || !mainCtx) return;
            const dpr     = window.devicePixelRatio || 1;
            const wrapper = mainCanvas.parentElement;
            if (!wrapper) return;
            const w = wrapper.offsetWidth || mainCanvas.offsetWidth;
            const h = 64;
            if (!w) return;
            mainCanvas.width  = w * dpr;
            mainCanvas.height = h * dpr;
            mainCtx.setTransform(1, 0, 0, 1, 0, 0);
            mainCtx.scale(dpr, dpr);
            mainBars = _makeBars(w, h);   // regenerate for new width
            if (duration && duration > 0) {
                widget.getPosition(function (pos) { drawWave(pos / duration); });
            } else {
                drawWave(0);
            }
        }

        function setupMainCanvas() {
            if (!mainCanvas || !mainCtx) return;
            const wrapper = mainCanvas.parentElement;
            if (!wrapper) return;
            const w = wrapper.offsetWidth || mainCanvas.offsetWidth;
            const h = 64;
            if (!w) { setTimeout(setupMainCanvas, 150); return; }
            const dpr = window.devicePixelRatio || 1;
            mainCanvas.width  = w * dpr;
            mainCanvas.height = h * dpr;
            mainCtx.setTransform(1, 0, 0, 1, 0, 0);
            mainCtx.scale(dpr, dpr);
            mainBars = _makeBars(w, h);   // main player gets its own bar array at full width
            drawWave(0);
        }

        let playlistLoaded = false;
        let duration = 0;

        if (player) player.style.display = 'flex';
        if (fallback) fallback.style.display = 'none';
        if (loading)  loading.style.display = 'block';

        const timeout = setTimeout(function () {
            if (!playlistLoaded) {
                if (player)   player.style.display = 'none';
                if (fallback) fallback.style.display = 'block';
                if (loading)  loading.style.display = 'none';
            }
        }, 12000); // 12s — generous enough for slow connections; tryLoadSounds retries cancel this early

       widget.bind(SC.Widget.Events.READY, function () {

           console.log("SC READY EVENT FIRED");

           // ───── Volume Control (correct location) ─────
           if (volumeSlider) {

               widget.setVolume(Number(volumeSlider.value));

               function setVolumeFill(slider, percent) {
                   if (!slider) return;
                   slider.style.background =
                       `linear-gradient(to right, var(--accent) ${percent}%, rgba(255,255,255,0.15) ${percent}%)`;
               }

               volumeSlider.addEventListener('input', function () {

                   const value = Number(this.value);

                   widget.setVolume(value);

                   if (mainVolumeSlider && mainVolumeSlider.value != value) {
                       mainVolumeSlider.value = value;
                   }

                   setVolumeFill(volumeSlider, value);
                   setVolumeFill(mainVolumeSlider, value);
               });

               // Trigger once on load so it styles correctly
               volumeSlider.dispatchEvent(new Event('input'));
           }

           if (mainVolumeSlider) {

    mainVolumeSlider.addEventListener('input', function () {

        const value = Number(this.value);

        if (window.scWidget) {
            window.scWidget.setVolume(value);
        }

        if (volumeSlider && volumeSlider.value != value) {
            volumeSlider.value = value;
        }

        setVolumeFill(volumeSlider, value);
        setVolumeFill(mainVolumeSlider, value);

    });

}
console.log("Widget ready test", widget);

// Draw placeholder waveform bars immediately — visible before any track loads
setTimeout(function() {
    setupCanvas();
    setupMainCanvas();
}, 300);

// Retry getSounds until SC actually returns tracks (can take several seconds on live)
let _soundsAttempt = 0;
function tryLoadSounds() {
    _soundsAttempt++;
    widget.getSounds(function(sounds) {

        console.log("SoundCloud sounds (attempt " + _soundsAttempt + "):", sounds);

        if (!sounds || !sounds.length) {
            console.log("SoundCloud returned no sounds yet — retrying…");
            // Up to 30 attempts: fast retries early, slower later to let SC catch up
            if (_soundsAttempt < 30) {
                const delay = _soundsAttempt < 6 ? 700 : _soundsAttempt < 15 ? 1200 : 2000;
                setTimeout(tryLoadSounds, delay);
            }
            return;
        }

        // Create grouped arrays
        const groupedTracks = {
            drama: [],
            podcast: [],
            commercial: [],
            imaging: [],
            voice: [],
            other: []
        };

        // Log all track titles
        console.log("TRACK TITLES:", sounds.map(s => s.title));

        // Classify tracks into groups
        sounds.forEach(function(sound, index) {

            console.log("PREFIX TEST:", sound.title, "→", sound.title.split("|")[0]);

            // Save the playlist index for each track
            sound._playlistIndex = index;

            const rawTitle = sound.title || "";
            const prefix = rawTitle.split("|")[0].trim().toLowerCase();
            const title = rawTitle;

            let category = "other";

            if (prefix.includes("audio drama") || prefix.includes("narrative") || prefix.includes("audio trailer")) {
                category = "drama";
            } else if (prefix.includes("podcast")) {
                category = "podcast";
            } else if (prefix.includes("radio imaging") || prefix.includes("radio jingle")) {
                category = "imaging";
            } else if (prefix.includes("presenter link") || prefix.includes("link")) {
                category = "voice";
            } else if (prefix.includes("commercial")) {
                category = "commercial";
            } else if (prefix.includes("spot") || prefix.includes("advert")) {
                category = "commercial";
            } else if (prefix.includes("sketch")) {
                category = "voice";
            }

            groupedTracks[category].push(sound);

        }); // closes sounds.forEach

        // === Rendering Track Sections ===
        const tracklistEl = document.getElementById("cdp-tracklist");
        tracklistEl.innerHTML = "";

        /* ── Curated ALL showreel order (BBC-friendly listening sequence) ── */

        const allTracksOrdered = showreelOrder
        .map(title => sounds.find(s =>
            (s.title || "").toLowerCase().includes(title.toLowerCase())
        ))
        .filter(Boolean);

        if (allTracksOrdered.length) {
            renderSection("All", allTracksOrdered, "all");
        }

        // Format ms duration → m:ss
        function fmtDur(ms) {
            if (!ms) return "";
            const m = Math.floor(ms / 60000);
            const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
            return m + ":" + s;
        }

        function renderSection(title, tracks, key) {

            if (!tracks.length) return;

            const section = document.createElement("div");
            section.className = "cdp-group";
            section.dataset.group = key;

            const headerWrap = document.createElement("div");
            headerWrap.className = "cdp-track-section-header";

            const header = document.createElement("div");
            header.className = "cdp-track-section-title";
            header.textContent = title;

            headerWrap.appendChild(header);

            if (trackSectionDescriptions[title]) {

                const desc = document.createElement("p");
                desc.className = "cdp-track-section-description";
                desc.textContent = trackSectionDescriptions[title];

                headerWrap.appendChild(desc);

            }

            section.appendChild(headerWrap);

            tracks.forEach(function(track, i) {

                const item = document.createElement("div");
                item.className = "cdp-track-item";
                item.dataset.index = track._playlistIndex;
                item.style.setProperty('--stagger', (i * 0.045) + 's'); // staggered entrance

                // ── Number cell with hover play icon ──
                const numCell = document.createElement("div");
                numCell.className = "cdp-track-num";

                const numLabel = document.createElement("span");
                numLabel.className = "num-label";
                numLabel.textContent = (i + 1).toString().padStart(2, "0");

                const playIcon = document.createElement("span");
                playIcon.className = "play-icon";

                playIcon.innerHTML = `
                <svg class="mini-play" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <svg class="mini-pause" viewBox="0 0 24 24">
                    <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
                </svg>
                `;

                playIcon.addEventListener("click", function(e){

                    e.stopPropagation();

                    widget.getCurrentSoundIndex(function(currentIndex){

                        if(currentIndex === track._playlistIndex){

                            widget.isPaused(function(paused){

                                if(paused){
                                    widget.play();
                                } else {
                                    widget.pause();
                                }

                            });

                        } else {

                            widget.skip(track._playlistIndex);
                            setTimeout(function(){
                                widget.seekTo(0);
                                widget.play();
                            },150);

                        }

                    });

                });

                numCell.appendChild(numLabel);
                numCell.appendChild(playIcon);

                // ── Title cell ──
                const nameCell = document.createElement("div");
                nameCell.className = "cdp-track-name";
                // Strip the prefix (everything before and including the first |)
                const rawTitle = track.title || "(Untitled)";
                const pipeIdx = rawTitle.indexOf("|");
                nameCell.textContent = pipeIdx !== -1
                    ? rawTitle.slice(pipeIdx + 1).trim()
                    : rawTitle;
                nameCell.title = rawTitle; // full title on tooltip

                // ── Duration cell ──
                const durCell = document.createElement("div");
                durCell.className = "cdp-track-dur";
                durCell.textContent = fmtDur(track.duration);
                item.appendChild(numCell);
                item.appendChild(nameCell);
                item.appendChild(durCell);

                /* Track description note */
                const displayTitle = nameCell.textContent.toLowerCase();

                const match = Object.keys(trackDescriptionsNormalized).find(function(key){
                    return displayTitle.includes(key);
                });

                if (match) {

                    const note = document.createElement("div");
                    note.className = "cdp-track-note";
                    note.textContent = trackDescriptionsNormalized[match];

                    nameCell.appendChild(note);

                }

                // ── Click: ripple + skip ──
                item.addEventListener("click", function(e) {

                    // Ripple
                    const ripple = document.createElement("span");
                    ripple.className = "cdp-ripple";
                    const rect = item.getBoundingClientRect();
                    ripple.style.left = (e.clientX - rect.left) + "px";
                    ripple.style.top  = (e.clientY - rect.top)  + "px";
                    item.appendChild(ripple);
                    setTimeout(function() { ripple.remove(); }, 600);

                    widget.skip(track._playlistIndex);
                    setTimeout(function() {
                        widget.seekTo(0);
                        widget.play();
                    }, 200);
                });

                section.appendChild(item);

            });

            tracklistEl.appendChild(section);

        }

        // Render all groups
        renderSection("Drama", groupedTracks.drama, "drama");
        renderSection("Podcast", groupedTracks.podcast, "podcast");
        renderSection("Commercial", groupedTracks.commercial, "commercial");
        renderSection("Radio Imaging", groupedTracks.imaging, "imaging");
        renderSection("Voice & Links", groupedTracks.voice, "voice");
        renderSection("Other", groupedTracks.other, "other");

        // === Tab Filtering ===
        const tabs = document.querySelectorAll(".cdp-tab");

        tabs.forEach(function(tab){

            tab.addEventListener("click", function(){

                tabs.forEach(t => t.classList.remove("active"));
                this.classList.add("active");

                const selected = this.dataset.tab;

                document.querySelectorAll(".cdp-group").forEach(function(group){

                    const type = group.dataset.group;
                    const title = group.querySelector(".cdp-track-section-title");

                    if (selected === "all") {

                        if (type === "all") {
                            group.style.display = "";
                        } else {
                            group.style.display = "none";
                        }

                    } else if(type === selected && type !== "other") {
                        group.style.display = "";
                        if(title) title.style.display = "";
                        } else {
                        group.style.display = "none";
                    }

                });

            });

        });

        // Mark as loaded so the 4s fallback timeout does NOT hide the player
        playlistLoaded = true;
        clearTimeout(timeout);

        // === First track info ===
        const first = sounds[0];

        if(titleEl) titleEl.textContent = first.title || "(Untitled)";
        if(mainTitleEl) mainTitleEl.textContent = first.title || "(Untitled)";
        if(subEl && first.user) subEl.textContent = first.user.username || "";
        if(extraEl) extraEl.textContent = "";

        // === Default artwork for first track ===
        const firstArt = first.artwork_url || (first.user && first.user.avatar_url) || "";
        if (firstArt) {
            const artSrc = firstArt.replace("-large", "-t500x500");
            const apImg = document.getElementById("ap-artwork-img");
            const cdpImg = document.getElementById("cdp-artwork-img");
            if (apImg) {
                apImg.onload = function() { apImg.style.opacity = '1'; };
                apImg.onerror = function() { apImg.style.opacity = '0'; };
                apImg.src = artSrc;
            }
            if (cdpImg) { cdpImg.src = artSrc; cdpImg.style.display = "block"; }
        }

        // === Default volume to full ===
        widget.setVolume(100);
        if (volumeSlider) { volumeSlider.value = 100; volumeSlider.dispatchEvent(new Event("input")); }
        if (mainVolumeSlider) { mainVolumeSlider.value = 100; }

        const defaultTab = document.querySelector(".cdp-tab.active");
        if(defaultTab) defaultTab.click();

        // === Hide loading and setup both waveforms ===
        if(loading) loading.style.display = "none";
        setTimeout(function(){
            setupCanvas();
            setupMainCanvas();

            // ResizeObserver for bottom player waveform
            const wrapper = canvas ? canvas.parentElement : null;
            if(wrapper && 'ResizeObserver' in window){
                new ResizeObserver(() => resizeWaveformCanvas()).observe(wrapper);
            }

            // ResizeObserver for main player waveform
            const mainWrapper = mainCanvas ? mainCanvas.parentElement : null;
            if(mainWrapper && 'ResizeObserver' in window){
                new ResizeObserver(() => resizeMainCanvas()).observe(mainWrapper);
            }

            // Window resize catches breakpoint changes
            window.addEventListener('resize', function(){
                clearTimeout(window._waveResizeTimer);
                window._waveResizeTimer = setTimeout(function(){
                    resizeWaveformCanvas();
                    resizeMainCanvas();
                }, 80);
            });
        }, 200);

    }); // closes getSounds
} // closes tryLoadSounds
setTimeout(tryLoadSounds, 600); // first attempt after a short delay

        // ── Fallback triggers: retry if SC was slow and user starts interacting ──

        // 1. First click or scroll resets and retries immediately
        function retryOnInteraction() {
            if (playlistLoaded) return;
            _soundsAttempt = 0;
            tryLoadSounds();
        }
        document.addEventListener('click',      retryOnInteraction, { once: true, passive: true });
        document.addEventListener('scroll',     retryOnInteraction, { once: true, passive: true });
        document.addEventListener('touchstart', retryOnInteraction, { once: true, passive: true });

        // 2. Tab visibility — user switched away while loading, comes back when SC has caught up
        document.addEventListener('visibilitychange', function onVisible() {
            if (!document.hidden && !playlistLoaded) {
                _soundsAttempt = 0;
                setTimeout(tryLoadSounds, 300);
            }
            if (playlistLoaded) document.removeEventListener('visibilitychange', onVisible);
        });

        // ── Shared helper: populate both players with current track data ──
        // Retries up to 8 times if SC hasn't handed back the sound object yet
        function populateCurrentTrack(attempt) {
            attempt = attempt || 0;
            widget.getCurrentSound(function (sound) {
                if (!sound) {
                    if (attempt < 8) setTimeout(function(){ populateCurrentTrack(attempt + 1); }, 700);
                    return;
                }

                if (titleEl) {
                    titleEl.textContent = sound.title || 'Untitled';
                    titleEl.classList.remove('is-scrolling');
                    titleEl.style.removeProperty('--ap-scroll');
                    requestAnimationFrame(() => {
                        const overflow = titleEl.scrollWidth - titleEl.offsetWidth;
                        if (overflow > 0) {
                            titleEl.style.setProperty('--ap-scroll', `-${overflow}px`);
                            titleEl.classList.add('is-scrolling');
                        }
                    });
                }

                if (mainTitleEl) mainTitleEl.textContent = sound.title || 'Untitled';
                if (subEl && sound.user) subEl.textContent = sound.user.username || '';
                if (extraEl) extraEl.textContent = '';

                const img = document.getElementById('ap-artwork-img');
                const mainImg = document.getElementById('cdp-artwork-img');
                if (img || mainImg) {
                    let art = sound.artwork_url;
                    if (!art && sound.user && sound.user.avatar_url) art = sound.user.avatar_url;
                    if (art) {
                        const artSrc = art.replace('-large', '-t500x500');
                        if (img) img.src = artSrc;
                        if (mainImg) { mainImg.src = artSrc; mainImg.style.display = 'block'; }
                    }
                    if (mainTracklist && sound) {
                        mainTracklist.querySelectorAll('.cdp-track').forEach(t => t.classList.remove('is-active'));
                        const active = mainTracklist.querySelector('[data-sc-id="' + sound.id + '"]');
                        if (active) { active.classList.add('is-active'); active.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
                    }
                }
            });
        }

        // Populate players as soon as the widget is ready (no play needed)
        setTimeout(populateCurrentTrack, 800);

        widget.bind(SC.Widget.Events.PLAY, function () {

            if (player) player.classList.add('is-playing');

            const playIcon  = document.querySelector('.ap-icon-play');
            const pauseIcon = document.querySelector('.ap-icon-pause');

            if (playIcon)  playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'inline';

            const mainPlayIcon  = document.querySelector('.cdp-icon-play');
            const mainPauseIcon = document.querySelector('.cdp-icon-pause');

            if (mainPlayIcon)  mainPlayIcon.style.display = 'none';
            if (mainPauseIcon) mainPauseIcon.style.display = 'inline';

            widget.getCurrentSoundIndex(function(index) {

                document.querySelectorAll('.cdp-track-item .play-icon').forEach(function(icon){

                    icon.innerHTML = `
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    `;

                });

                document.querySelectorAll('.cdp-track-item').forEach(function(el) {
                    el.classList.remove('active');
                });

               const active = document.querySelector('.cdp-track-item[data-index="' + index + '"]');

               if (active) {

                   active.classList.add('active');

                   // Smooth scroll active row into view within tracklist

                   const icon = active.querySelector('.play-icon');

                   if (icon) {

                       icon.innerHTML = `
                           <svg viewBox="0 0 24 24">
                               <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
                           </svg>
                       `;

                   }

               }

            });
            
            populateCurrentTrack();

            // Cache duration once per track — PLAY_PROGRESS uses this cached value
            // instead of calling getDuration() repeatedly (which caused audio glitches)
            widget.getDuration(function(d) { if (d) duration = d; });

        });

        widget.bind(SC.Widget.Events.PAUSE, function () {

            if (player) player.classList.remove('is-playing');

            if (titleEl) titleEl.classList.remove('is-scrolling');

            const playIcon  = document.querySelector('.ap-icon-play');
            const pauseIcon = document.querySelector('.ap-icon-pause');

            if (playIcon)  playIcon.style.display = 'inline';
            if (pauseIcon) pauseIcon.style.display = 'none';

            const mainPlayIcon  = document.querySelector('.cdp-icon-play');
            const mainPauseIcon = document.querySelector('.cdp-icon-pause');

            if (mainPlayIcon)  mainPlayIcon.style.display = 'inline';
            if (mainPauseIcon) mainPauseIcon.style.display = 'none';

        });

        widget.bind(SC.Widget.Events.FINISH, function () {

            // Auto-advance: check if more tracks remain, then skip to next
            widget.getCurrentSoundIndex(function (currentIndex) {
                widget.getSounds(function (sounds) {

                    const hasNext = sounds && (currentIndex + 1) < sounds.length;

                    if (hasNext) {
                        // Play the next track — PLAY event fires and handles all UI updates
                        setTimeout(function () {
                            widget.skip(currentIndex + 1);
                            setTimeout(function () { widget.seekTo(0); widget.play(); }, 200);
                        }, 350);
                    } else {
                        // End of playlist — reset to stopped state
                        if (player) player.classList.remove('is-playing');
                        if (titleEl) titleEl.classList.remove('is-scrolling');
                        const playIcon  = document.querySelector('.ap-icon-play');
                        const pauseIcon = document.querySelector('.ap-icon-pause');
                        if (playIcon)  playIcon.style.display = 'inline';
                        if (pauseIcon) pauseIcon.style.display = 'none';
                    }
                });
            });
        });

        widget.bind(SC.Widget.Events.PLAY_PROGRESS, function (e) {

            if (!e || typeof e.currentPosition === 'undefined') return;
            if (!duration) return; // duration cached on PLAY — skip until ready

            const current = e.currentPosition;

            // Use cached duration — never call getDuration() inside PLAY_PROGRESS
            // (repeated async postMessage calls create a callback backlog that glitches audio)
            const totalDuration = duration;

            const mins = Math.floor(current / 60000);
            const secs = Math.floor((current % 60000) / 1000)
                .toString()
                .padStart(2, '0');

            const totalMins = Math.floor(totalDuration / 60000);
            const totalSecs = Math.floor((totalDuration % 60000) / 1000)
                .toString()
                .padStart(2, '0');

            if (timeEl) {
                timeEl.textContent =
                    mins + ':' + secs + ' / ' + totalMins + ':' + totalSecs;
            }

            if (mainCurrent) {
                mainCurrent.textContent = mins + ':' + secs;
            }

            if (mainDuration) {
                mainDuration.textContent = totalMins + ':' + totalSecs;
            }

            const percent = current / totalDuration;

            if (mainProgressFill) {
                mainProgressFill.style.width = (percent * 100) + "%";
            }

            if (mainProgressThumb) {
                mainProgressThumb.style.left = (percent * 100) + "%";
            }

            if (ctx && canvas) {
                drawWave(percent);
            }

            // Drive the mini mobile player progress bar via CSS custom property
            const bottomPlayer = document.getElementById('bottom-player');
            if (bottomPlayer) {
                bottomPlayer.style.setProperty('--ap-progress', (percent * 100).toFixed(2) + '%');
            }

        });

        if (canvas && ctx) {

            canvas.addEventListener('click', function (e) {

                if (!duration) return;

                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;

                const percent = clickX / rect.width;
                const seekTo = percent * duration;

                widget.seekTo(seekTo);
                widget.play();

            });

        }

        // Click-to-seek on main player waveform canvas
        if (mainCanvas) {
            mainCanvas.style.cursor = 'pointer';
            mainCanvas.addEventListener('click', function (e) {
                if (!duration) return;
                const rect    = mainCanvas.getBoundingClientRect();
                const clickX  = e.clientX - rect.left;
                const percent = clickX / rect.width;
                widget.seekTo(percent * duration);
            });
        }

        if (playBtn) {
            playBtn.addEventListener('click', function () {
                widget.isPaused(function (paused) {
                    if (paused) widget.play();
                    else widget.pause();
                });
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                widget.prev();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                widget.next();
            });
        }


       }); // closes widget.bind(SC.Widget.Events.READY, ...)

    }

    initSoundCloud();

    // ─────────────────────────────
// Shared Player Controller
// ─────────────────────────────

function playerPlayToggle() {
    if (!window.scWidget) return;

    window.scWidget.isPaused(function(paused) {
        if (paused) window.scWidget.play();
        else window.scWidget.pause();
    });
}

function playerNext() {
    if (!window.scWidget) return;
    window.scWidget.next();
}

function playerPrev() {
    if (!window.scWidget) return;
    window.scWidget.prev();
}

const mainPlayBtn = document.getElementById('cdp-play');
const mainNextBtn = document.getElementById('cdp-next');
const mainPrevBtn = document.getElementById('cdp-prev');

if (mainPlayBtn) {
    mainPlayBtn.addEventListener('click', playerPlayToggle);
}

if (mainNextBtn) {
    mainNextBtn.addEventListener('click', playerNext);
}

if (mainPrevBtn) {
    mainPrevBtn.addEventListener('click', playerPrev);
}
});
    /* RIGHT NOW table dynamic sorting */

    function sortRightNowTable() {

        const table = document.querySelector('#career table tbody');
        if (!table) return;

        const rows = Array.from(table.querySelectorAll('tr'));

        const statusOrder = {
            "status-upcoming": 1,
            "status-attending": 2,
            "status-pending": 3,
            "status-complete": 4,
            "status-active": 5,
            "status-discussion": 6
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

    document.addEventListener("DOMContentLoaded", sortRightNowTable);

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