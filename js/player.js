// SoundCloud Engine + Bottom Player Controller
// Shared across index.html, work.html, about.html

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
            const dpr = window.devicePixelRatio || 1;
            // Use canvas's own rendered width — automatically respects wrapper padding
            const w = mainCanvas.offsetWidth;
            const h = mainCanvas.offsetHeight || 48;
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
            // Use canvas's own rendered width — automatically respects wrapper padding
            const w = mainCanvas.offsetWidth;
            const h = mainCanvas.offsetHeight || 48;
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
        let currentPlayingIndex = -1; // set only by explicit skip calls; used by skipInTab to avoid async race on FINISH
        // Expose so external play-button handlers (playerPlayToggle etc.) can update it
        window.scSetCurrentIndex = function(idx) { currentPlayingIndex = idx; };

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

        // Guard: if a previous getSounds callback already completed setup (race between
        // multiple concurrent retries), bail out immediately so we don't re-register
        // widget.bind(PLAY/PAUSE/FINISH/PLAY_PROGRESS) a second time — double-binding
        // causes FINISH to fire twice, skipping 2 positions instead of 1.
        if (playlistLoaded) return;

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
                    window.scUserInitiated = true;

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

                    window.scUserInitiated = true;
                    currentPlayingIndex = track._playlistIndex;
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
        let currentTabKey = 'all'; // tracks which tab is active for prev/next nav

        function activateTab(tabKey) {
            tabs.forEach(t => t.classList.remove("active"));
            const tabEl = document.querySelector('.cdp-tab[data-tab="' + tabKey + '"]');
            if (tabEl) tabEl.classList.add("active");
            currentTabKey = tabKey;

            document.querySelectorAll(".cdp-group").forEach(function(group){

                const type = group.dataset.group;
                const title = group.querySelector(".cdp-track-section-title");

                if (tabKey === "all") {

                    if (type === "all") {
                        group.style.display = "";
                    } else {
                        group.style.display = "none";
                    }

                } else if(type === tabKey && type !== "other") {
                    group.style.display = "";
                    if(title) title.style.display = "";
                    } else {
                    group.style.display = "none";
                }

            });
        }

        tabs.forEach(function(tab){
            tab.addEventListener("click", function(){
                activateTab(this.dataset.tab);
            });
        });

        // Mark as loaded so the 4s fallback timeout does NOT hide the player
        playlistLoaded = true;
        clearTimeout(timeout);
        // Ensure the player is visible — on slow connections (especially mobile) the
        // 12s timeout may have already hidden it before getSounds returned.
        if (player) { player.style.display = 'flex'; player.style.removeProperty('visibility'); }
        if (fallback) fallback.style.display = 'none';

        // === First track info ===
        // Default to first track in curated showreel order, not SC playlist order
        const first = allTracksOrdered[0] || sounds[0];

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

        // === Expose default track index so play buttons can skip to it on first press ===
        window.scDefaultTrackIndex = (typeof first._playlistIndex === 'number') ? first._playlistIndex : 0;
        // scUserInitiated is ONLY set true by real user actions (play button / track click).
        // The SC widget fires internal PLAY events on load (even with auto_play=false);
        // this flag lets us ignore those until the user has actually pressed something.
        window.scUserInitiated = false;

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

        // ── Auto-retry: if tracks still not loaded after 2 s, reset and go again ──
        // Catches the common case where SC is slow on first load without needing interaction.
        var _autoRetryTimers = [2000, 4000, 7000]; // escalating checkpoints
        _autoRetryTimers.forEach(function(ms) {
            setTimeout(function() {
                if (!playlistLoaded) {
                    _soundsAttempt = 0;
                    tryLoadSounds();
                }
            }, ms);
        });

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
        function populateCurrentTrack(attempt, overrideSound) {
            attempt = attempt || 0;
            var doPopulate = function(sound) {
                // Block any SC-sourced update until the user has actually started playback.
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
            };
            // Use overrideSound directly on init so we don't ask SC (which may not have
            // moved yet) and then overwrite the manually-set default track title/art.
            if (overrideSound) {
                doPopulate(overrideSound);
            } else {
                widget.getCurrentSound(doPopulate);
            }
        }

        // Populate players on ready — pass the curated first track directly so the
        // display shows "Wired Different" without waiting for SC to confirm its position.
        setTimeout(function(){ populateCurrentTrack(0, first); }, 800);

        widget.bind(SC.Widget.Events.PLAY, function () {

            // SC fires PLAY events internally (e.g. buffering the first track) even with
            // auto_play=false. Ignore those until the user has deliberately pressed play
            // or clicked a track — otherwise they overwrite our curated default display.
            if (!window.scUserInitiated) return;
            window.scHasPlayed = true; // first-play skip logic no longer needed

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

                // NOTE: do NOT update currentPlayingIndex here — that is only set by
                // our own explicit widget.skip() calls. SC's async reply can race
                // and return a stale value, corrupting the FINISH-event navigation.

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

               // Highlight ALL matching items (track appears in both ALL group and genre group)
               document.querySelectorAll('.cdp-track-item[data-index="' + index + '"]').forEach(function(el) {
                   el.classList.add('active');
                   const icon = el.querySelector('.play-icon');
                   if (icon) {
                       icon.innerHTML = `
                           <svg viewBox="0 0 24 24">
                               <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
                           </svg>
                       `;
                   }
               });

               // Scroll the VISIBLE instance into view (skip groups with display:none)
               document.querySelectorAll('.cdp-track-item[data-index="' + index + '"]').forEach(function(el) {
                   const group = el.closest('.cdp-group');
                   if (group && group.style.display !== 'none') {
                       el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                   }
               });

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

        // ── Tab-aware navigation helpers ──────────────────────────────
        // Returns playlist indices of all VISIBLE track items, in DOM order.
        // A group is visible when its inline display style is not 'none'.
        function getVisiblePlaylistIndices() {
            const indices = [];
            document.querySelectorAll('.cdp-group').forEach(function(group) {
                if (group.style.display === 'none') return;
                group.querySelectorAll('.cdp-track-item').forEach(function(item) {
                    const idx = parseInt(item.dataset.index, 10);
                    if (!isNaN(idx)) indices.push(idx);
                });
            });
            return indices;
        }

        // Skip to prev/next track within the currently visible tab order.
        // direction: 'prev' | 'next'
        // onEnd: called when there is no further track in that direction
        function skipInTab(direction, onEnd) {
            // Use the index cached by the PLAY event rather than asking SC async —
            // avoids the race where FINISH fires after SC has already advanced internally.
            function doSkip(currentIndex) {
                const indices = getVisiblePlaylistIndices();
                const pos = indices.indexOf(currentIndex);
                if (direction === 'next') {
                    if (pos >= 0 && pos < indices.length - 1) {
                        const nextIdx = indices[pos + 1];
                        currentPlayingIndex = nextIdx;
                        widget.skip(nextIdx);
                        setTimeout(function() { widget.seekTo(0); widget.play(); }, 200);
                    } else if (typeof onEnd === 'function') {
                        onEnd(); // at end of tab
                    }
                } else { // prev
                    if (pos > 0) {
                        const prevIdx = indices[pos - 1];
                        currentPlayingIndex = prevIdx;
                        widget.skip(prevIdx);
                        setTimeout(function() { widget.seekTo(0); widget.play(); }, 200);
                    }
                    // pos === 0: already at start — do nothing
                }
            }
            // Use cached index if available; fall back to async SC call only when needed
            if (currentPlayingIndex >= 0) {
                doSkip(currentPlayingIndex);
            } else {
                widget.getCurrentSoundIndex(doSkip);
            }
        }

        // Expose globally so the main player cdp-next/cdp-prev buttons can use it
        window.scSkipInTab = skipInTab;

        widget.bind(SC.Widget.Events.FINISH, function () {
            // Auto-advance within the active tab's track order
            skipInTab('next', function() {
                // End of tab — reset to stopped state
                if (player) player.classList.remove('is-playing');
                if (titleEl) titleEl.classList.remove('is-scrolling');
                const playIcon  = document.querySelector('.ap-icon-play');
                const pauseIcon = document.querySelector('.ap-icon-pause');
                if (playIcon)  playIcon.style.display = 'inline';
                if (pauseIcon) pauseIcon.style.display = 'none';
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
                window.scUserInitiated = true;
                widget.isPaused(function (paused) {
                    if (paused) {
                        if (typeof window.scDefaultTrackIndex === 'number' && !window.scHasPlayed) {
                            if (window.scSetCurrentIndex) window.scSetCurrentIndex(window.scDefaultTrackIndex);
                            widget.skip(window.scDefaultTrackIndex);
                            setTimeout(function() { widget.seekTo(0); widget.play(); }, 200);
                        } else {
                            widget.play();
                        }
                    } else {
                        widget.pause();
                    }
                });
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function () {
                skipInTab('prev'); // stays on first track if already at start
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function () {
                skipInTab('next'); // stops at end of active tab
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

    window.scUserInitiated = true;
    window.scWidget.isPaused(function(paused) {
        if (paused) {
            if (!window.scHasPlayed && typeof window.scDefaultTrackIndex === 'number') {
                if (window.scSetCurrentIndex) window.scSetCurrentIndex(window.scDefaultTrackIndex);
                window.scWidget.skip(window.scDefaultTrackIndex);
                setTimeout(function() { window.scWidget.seekTo(0); window.scWidget.play(); }, 200);
            } else {
                window.scWidget.play();
            }
        } else {
            window.scWidget.pause();
        }
    });
}

function playerNext() {
    if (window.scSkipInTab) { window.scSkipInTab('next'); return; }
    if (window.scWidget) window.scWidget.next(); // fallback before READY
}

function playerPrev() {
    if (window.scSkipInTab) { window.scSkipInTab('prev'); return; }
    if (window.scWidget) window.scWidget.prev(); // fallback before READY
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
