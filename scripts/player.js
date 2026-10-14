/* Chris Demetriou — custom SoundCloud player (main + footer).
   Ported from the August 2026 media build. Uses the SoundCloud Widget API only:
   no API keys, no client secrets. Starts only after cookie consent (see index.html). */
// ─────────────────────────────────────────────
// SoundCloud Engine with Preload + Loading Bar + Fallback
// ─────────────────────────────────────────────

window.cdStartPlayer = function () {
    if (window._cdPlayerStarted) return;
    window._cdPlayerStarted = true;

    // Check if OAuth Worker returned playlist data in URL hash
    const hash = window.location.hash;
    if (hash.includes('sc_playlist=')) {
        try {
            const playlistJson = decodeURIComponent(hash.split('sc_playlist=')[1]);
            const playlistData = JSON.parse(playlistJson);
            console.log("[On Air OAuth] Received playlist data from Worker:", playlistData);
            // Store globally so on-air widget can access it
            window._onAirPlaylistFromOAuth = playlistData;
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
            console.error("[On Air OAuth] Failed to parse playlist data:", e);
        }
    }

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
            x.globalAlpha = 1; // reset before clear so nothing leaks between frames
            x.clearRect(0, 0, w, h);
            const progressX = w * progress;
            const accent = getComputedStyle(document.documentElement)
                               .getPropertyValue('--accent').trim();
            barsArr.forEach((barH, i) => {
                const px = i * (barWidth + gap);
                const py = (h - barH) / 2;
                x.fillStyle   = px < progressX ? accent : 'rgba(237,230,221,0.55)';
                x.globalAlpha = px < progressX ? 1 : 0.25;
                x.fillRect(px, py, barWidth, barH);
            });
            x.globalAlpha = 1; // restore after drawing
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

        // Draw placeholder waveform bars immediately on page load — bars are random
        // and need no SC data, so there's no reason to wait for READY or getSounds.
        setTimeout(function() { setupCanvas(); setupMainCanvas(); }, 50);

        // ── On Air widget ───────────────────────────────────────────────────────
        // Initialised HERE (before the main widget's READY binding) so that both
        // READY handlers are registered before either iframe fires — both iframes
        // load in parallel and the On Air player is often already ready by the time
        // the main widget fires READY, causing a missed event if we bind too late.
        const iframeOnAir = document.getElementById('sc-widget-onair');
        let onAirPlaylistLoaded = false;
        let onAirCurrentIndex = -1;
        let _onAirSectionEl = null; // persistent ref so the section survives tracklist rebuilds

        // Creates the On Air section header immediately — does NOT depend on getSounds()
        function _ensureOnAirSection() {
            if (_onAirSectionEl) {
                console.log("[On Air Section] Section already exists, returning cached element");
                return _onAirSectionEl;
            }
            console.log("[On Air Section] Creating On Air section header for first time");
            const tracklistEl = document.getElementById('cdp-tracklist');
            const section = document.createElement('div');
            section.className = 'cdp-group';
            section.dataset.group = 'on-air';
            section.style.display = 'none';

            const headerWrap = document.createElement('div');
            headerWrap.className = 'cdp-track-section-header';
            const header = document.createElement('div');
            header.className = 'cdp-track-section-title';
            header.textContent = 'On Air';
            headerWrap.appendChild(header);

            if (trackSectionDescriptions['On Air']) {
                const desc = document.createElement('p');
                desc.className = 'cdp-track-section-description';
                desc.textContent = trackSectionDescriptions['On Air'];
                headerWrap.appendChild(desc);
            }

            section.appendChild(headerWrap);
            tracklistEl.appendChild(section);
            _onAirSectionEl = section;
            console.log("[On Air Section] Section created and appended to DOM");
            return section;
        }

        if (iframeOnAir) {
            // Wait for SC to be available before creating widget
            function initOnAirWidget() {
                if (typeof SC === 'undefined' || !SC.Widget) {
                    setTimeout(initOnAirWidget, 100);
                    return;
                }
               window.scWidgetOnAir = SC.Widget(iframeOnAir);
            }
            initOnAirWidget();
            const onAirWidget = window.scWidgetOnAir || {};

            let _onAirAttempt = 0;
            function tryLoadOnAirSounds() {
                _onAirAttempt++;
                onAirWidget.getSounds(function(sounds) {
                    if (!sounds || !sounds.length) {
                        // Retry with escalating delays, same as main widget (up to 30 attempts)
                        if (_onAirAttempt < 30) {
                            const delay = _onAirAttempt < 6 ? 700 : _onAirAttempt < 15 ? 1200 : 2000;
                            setTimeout(tryLoadOnAirSounds, delay);
                        }
                        return;
                    }

                    // Got tracks - render them
                    if (onAirPlaylistLoaded) return; // Guard against race conditions
                    onAirPlaylistLoaded = true;
                    _renderOnAirTracks(sounds);
                });
            }

            function _renderOnAirTracks(sounds) {
                sounds.forEach(function(track, i) { track._playlistIndex = i; });

                // Sort display order: long podcast clip (To The Club) goes last
                var displaySounds = sounds.slice().sort(function(a, b) {
                    var aIsLong = (a.title || '').toLowerCase().includes('to the club') || (a.title || '').toLowerCase().includes('jocelyn brown');
                    var bIsLong = (b.title || '').toLowerCase().includes('to the club') || (b.title || '').toLowerCase().includes('jocelyn brown');
                    if (aIsLong && !bIsLong) return 1;
                    if (!aIsLong && bIsLong) return -1;
                    return 0;
                });

                // Use the same renderSection function as Drama/Podcast etc.
                // If main widget hasn't loaded yet, wait for it to expose renderSection globally.
                function doRender() {
                    if (!window.renderSection) {
                        setTimeout(doRender, 200);
                        return;
                    }
                    window.renderSection('On Air', displaySounds, 'on-air', onAirWidget);

                    // Add On Air tracks to global sounds array for ALL tab
                    if (window._allSounds) {
                        sounds.forEach(function(track) {
                            if (!window._allSounds.find(function(t) { return t.id === track.id; })) {
                                window._allSounds.push(track);
                            }
                        });
                    }

                    // Re-render ALL section to include On Air tracks
                    if (window._rerenderAllTab) {
                        window._rerenderAllTab();
                    }

                    // Refresh the active tab so On Air appears in All or its own tab
                    if (window.activateTab) {
                        window.activateTab(window.currentTabKey || 'on-air');
                    }

                    // Update mini/main player to show the first On Air track on load.
                    // populateCurrentTrack lives in the demos READY scope, so we call
                    // it via the window global. If demos hasn't loaded yet, store the
                    // track so the demos widget picks it up when it becomes ready.
                    if (!window.scHasPlayed && sounds[0] && window.currentTabKey === 'on-air') {
                        if (window.populateCurrentTrack) {
                            window.populateCurrentTrack(0, sounds[0]);
                        } else {
                            window._pendingOnAirDefaultTrack = sounds[0];
                        }
                    }
                }
                doRender();

                // Skip logic for next/prev buttons when On Air is active
                function skipOnAir(direction, onEnd) {
                    function doSkip(cur) {
                        const items = Array.from(document.querySelectorAll('.cdp-group[data-group="on-air"] .cdp-track-item'));
                        const indices = items.map(function(el) { return parseInt(el.dataset.index, 10); });
                        const pos = indices.indexOf(cur);
                        if (direction === 'next') {
                            if (pos >= 0 && pos < indices.length - 1) {
                                const nxt = indices[pos + 1];
                                onAirCurrentIndex = nxt;
                                window.scWidgetOnAir.skip(nxt);
                                setTimeout(function() { window.scWidgetOnAir.seekTo(0); window.scWidgetOnAir.play(); }, 150);
                            } else if (typeof onEnd === 'function') { onEnd(); }
                        } else {
                            if (pos > 0) {
                                const prv = indices[pos - 1];
                                onAirCurrentIndex = prv;
                                window.scWidgetOnAir.skip(prv);
                                setTimeout(function() { window.scWidgetOnAir.seekTo(0); window.scWidgetOnAir.play(); }, 150);
                            }
                        }
                    }
                    if (onAirCurrentIndex >= 0) { doSkip(onAirCurrentIndex); }
                    else { window.scWidgetOnAir.getCurrentSoundIndex(doSkip); }
                }
                window.scSkipOnAir = skipOnAir;
            }

            window._tryLoadOnAirSounds = tryLoadOnAirSounds;

            // Wait for widget to be initialized before binding events
            function bindOnAirEvents() {
                if (!window.scWidgetOnAir || typeof window.scWidgetOnAir.bind !== 'function') {
                    setTimeout(bindOnAirEvents, 100);
                    return;
                }
                window.scWidgetOnAir.bind(SC.Widget.Events.READY, function() {
                    setTimeout(function() {
                        tryLoadOnAirSounds();
                    }, 600);
                });

                // ── On Air event bindings (registered directly, not inside READY) ──────
                // Binding directly to window.scWidgetOnAir (not the onAirWidget closure)
                // ensures handlers are registered even if READY fires before bindOnAirEvents
                // runs, or if the .load() call below doesn't re-trigger READY reliably.
                window.scWidgetOnAir.bind(SC.Widget.Events.PLAY, function() {
                    if (!window.scUserInitiated) return;
                    if (!window.onAirTabActive) return;
                    window.scHasPlayed = true;

                    // Reset progress state so new track starts clean
                    duration = 0;
                    drawWave(0);
                    const _bpReset = document.getElementById('bottom-player');
                    if (_bpReset) _bpReset.style.setProperty('--ap-progress', '0%');
                    const _ringReset = document.getElementById('cdp-ring-fill');
                    if (_ringReset) _ringReset.style.strokeDashoffset = '163.36';

                    if (player) player.classList.add('is-playing');
                    const apPlay  = document.querySelector('.ap-icon-play');
                    const apPause = document.querySelector('.ap-icon-pause');
                    if (apPlay)  apPlay.style.display  = 'none';
                    if (apPause) apPause.style.display = 'inline';
                    const cdpPlay  = document.querySelector('.cdp-icon-play');
                    const cdpPause = document.querySelector('.cdp-icon-pause');
                    if (cdpPlay)  cdpPlay.style.display  = 'none';
                    if (cdpPause) cdpPause.style.display = 'inline';

                    window.scWidgetOnAir.getCurrentSoundIndex(function(index) {
                        onAirCurrentIndex = index;
                        document.querySelectorAll('.cdp-group[data-group="on-air"] .cdp-track-item .play-icon').forEach(function(ic) {
                            ic.innerHTML = `
                                <svg class="mini-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                <svg class="mini-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
                            `;
                        });
                        document.querySelectorAll('.cdp-group[data-group="on-air"] .cdp-track-item').forEach(function(el) {
                            el.classList.remove('active');
                        });
                        document.querySelectorAll('.cdp-group[data-group="on-air"] .cdp-track-item[data-index="' + index + '"]').forEach(function(el) {
                            el.classList.add('active');
                            const ic = el.querySelector('.play-icon');
                            if (ic) ic.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>`;
                            const grp = el.closest('.cdp-group');
                            if (grp && grp.style.display !== 'none') {
                                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                            }
                        });
                    });

                    window.scWidgetOnAir.getCurrentSound(function(sound) {
                        if (!sound) return;
                        if (titleEl)     titleEl.textContent = sound.title || 'Untitled';
                        if (mainTitleEl) mainTitleEl.textContent = sound.title || 'Untitled';
                        if (subEl && sound.user) subEl.textContent = sound.user.username || '';
                        const art = sound.artwork_url || (sound.user && sound.user.avatar_url) || '';
                        if (art) {
                            const artSrc = art.replace('-large', '-t500x500');
                            const apImg  = document.getElementById('ap-artwork-img');
                            const cdpImg = document.getElementById('cdp-artwork-img');
                            if (apImg)  apImg.src = artSrc;
                            if (cdpImg) { cdpImg.src = artSrc; cdpImg.style.display = 'block'; }
                        }
                    });

                    window.scWidgetOnAir.getDuration(function(d) { if (d) duration = d; });
                });

                window.scWidgetOnAir.bind(SC.Widget.Events.PAUSE, function() {
                    if (!window.onAirTabActive) return;
                    if (player) player.classList.remove('is-playing');
                    const apPlay  = document.querySelector('.ap-icon-play');
                    const apPause = document.querySelector('.ap-icon-pause');
                    if (apPlay)  apPlay.style.display  = 'inline';
                    if (apPause) apPause.style.display = 'none';
                    const cdpPlay  = document.querySelector('.cdp-icon-play');
                    const cdpPause = document.querySelector('.cdp-icon-pause');
                    if (cdpPlay)  cdpPlay.style.display  = 'inline';
                    if (cdpPause) cdpPause.style.display = 'none';
                });

                window.scWidgetOnAir.bind(SC.Widget.Events.FINISH, function() {
                    if (!window.onAirTabActive) return;
                    window.scSkipOnAir('next', function() {
                        if (player) player.classList.remove('is-playing');
                        const apPlay  = document.querySelector('.ap-icon-play');
                        const apPause = document.querySelector('.ap-icon-pause');
                        if (apPlay)  apPlay.style.display  = 'inline';
                        if (apPause) apPause.style.display = 'none';
                    });
                });

                window.scWidgetOnAir.bind(SC.Widget.Events.PLAY_PROGRESS, function(e) {
                    if (!window.onAirTabActive) return;
                    if (!e || typeof e.currentPosition === 'undefined') return;

                    // Use relativePosition (0-1) for visual indicators so they update
                    // immediately without waiting for the async getDuration cache to fill.
                    const percent = (typeof e.relativePosition === 'number')
                        ? e.relativePosition
                        : (duration ? e.currentPosition / duration : 0);

                    drawWave(percent);

                    const bPlayer = document.getElementById('bottom-player');
                    if (bPlayer) bPlayer.style.setProperty('--ap-progress', (percent * 100).toFixed(2) + '%');

                    const ringFill = document.getElementById('cdp-ring-fill');
                    if (ringFill) {
                        const circumference = 163.36;
                        ringFill.style.strokeDashoffset = (circumference * (1 - percent)).toFixed(2);
                    }

                    // Time display requires a cached duration value
                    if (!duration) return;
                    const current       = e.currentPosition;
                    const totalDuration = duration;
                    const mins  = Math.floor(current / 60000);
                    const secs  = Math.floor((current % 60000) / 1000).toString().padStart(2, '0');
                    const tMins = Math.floor(totalDuration / 60000);
                    const tSecs = Math.floor((totalDuration % 60000) / 1000).toString().padStart(2, '0');

                    if (timeEl)       timeEl.textContent = mins + ':' + secs + ' / ' + tMins + ':' + tSecs;
                    if (mainCurrent)  mainCurrent.textContent  = mins + ':' + secs;
                    if (mainDuration) mainDuration.textContent = tMins + ':' + tSecs;
                });
                // Trigger a fresh load AFTER READY is bound — the READY handler
                // then calls tryLoadOnAirSounds() so getSounds() has tracks ready.
                window.scWidgetOnAir.load(
                    "https://soundcloud.com/chrisdemetrioumusic/sets/on-air-published-content",
                    { auto_play: false }
                );
            }
            bindOnAirEvents();

            // Fallback: if READY already fired before we bound to it, retry directly
            [2000, 4000, 8000].forEach(function(ms) {
                setTimeout(function() { if (!onAirPlaylistLoaded) tryLoadOnAirSounds(); }, ms);
            });
        }
        // ── End On Air widget ────────────────────────────────────────────────────


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
            comedy: [],
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

            if (prefix.includes("radio imaging") || prefix.includes("radio jingle")) return;

            let category = "other";

            if (prefix.includes("audio drama") || prefix.includes("narrative") || prefix.includes("audio trailer") || rawTitle.toLowerCase().includes("theatre of the mind")) {
                category = "drama";
            } else if (prefix.includes("podcast")) {
                category = "podcast";
            } else if (prefix.includes("radio imaging") || prefix.includes("radio jingle")) {
                return;
            } else if (prefix.includes("comedy") || prefix.includes("sketch") || rawTitle.toLowerCase().includes("dignity for chips")) {
                category = "comedy";
            } else if (prefix.includes("presenter link") || prefix.includes("link")) {
                category = "voice";
            } else if (prefix.includes("commercial")) {
                category = "commercial";
            } else if (prefix.includes("spot") || prefix.includes("advert")) {
                category = "commercial";
            }

            groupedTracks[category].push(sound);

        }); // closes sounds.forEach

        // === Rendering Track Sections ===
        const tracklistEl = document.getElementById("cdp-tracklist");
        // Preserve the on-air section if it was already rendered before this clear
        const _savedOnAir = tracklistEl.querySelector('.cdp-group[data-group="on-air"]');
        tracklistEl.innerHTML = "";
        if (_savedOnAir) tracklistEl.appendChild(_savedOnAir);

        /* ── Curated ALL showreel order (BBC-friendly listening sequence) ── */

        // Store sounds globally so On Air can add tracks later
        if (!window._allSounds) {
    window._allSounds = [];
}

sounds.forEach(function(track) {
    if (!window._allSounds.find(function(t) { return t.id === track.id; })) {
        window._allSounds.push(track);
    }
});

        // ALL tab now shows all category sections directly via activateTab — no separate group needed
        window._rerenderAllTab = function() {
            // Re-run tab filtering so the ALL tab picks up any sections that loaded late (e.g. on-air)
            if (window.activateTab && window.currentTabKey) {
                window.activateTab(window.currentTabKey);
            }
        };

        // Format ms duration → m:ss
        function fmtDur(ms) {
            if (!ms) return "";
            const m = Math.floor(ms / 60000);
            const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
            return m + ":" + s;
        }

        function renderSection(title, tracks, key, playbackWidget) {
            if (!playbackWidget) playbackWidget = widget;

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

                    playbackWidget.getCurrentSoundIndex(function(currentIndex){

                        if(currentIndex === track._playlistIndex){

                            playbackWidget.isPaused(function(paused){

                                if(paused){
                                    playbackWidget.play();
                                } else {
                                    playbackWidget.pause();
                                }

                            });

                        } else {

                            playbackWidget.skip(track._playlistIndex);
                            setTimeout(function(){
                                playbackWidget.seekTo(0);
                                playbackWidget.play();
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
                    // Only update the demo widget's navigation index for demo tracks
                    if (playbackWidget === widget) currentPlayingIndex = track._playlistIndex;
                    playbackWidget.skip(track._playlistIndex);
                    setTimeout(function() {
                        playbackWidget.seekTo(0);
                        playbackWidget.play();
                    }, 200);
                });

                section.appendChild(item);

            });

            tracklistEl.appendChild(section);

        }

        // Expose renderSection globally so On Air widget can use the same function
        window.renderSection = renderSection;

        // Render all groups
        renderSection("Commercial", groupedTracks.commercial, "commercial");
        renderSection("Podcast", groupedTracks.podcast, "podcast");
        renderSection("Drama", groupedTracks.drama, "drama");
        renderSection("Comedy", groupedTracks.comedy, "comedy");
        renderSection("Voice & Links", groupedTracks.voice, "voice");

        // === Tab Filtering ===
        const tabs = document.querySelectorAll(".cdp-tab");
        let currentTabKey = 'commercial'; // tracks which tab is active for prev/next nav

        function activateTab(tabKey) {
            tabs.forEach(t => t.classList.remove("active"));
            const tabEl = document.querySelector('.cdp-tab[data-tab="' + tabKey + '"]');
            if (tabEl) tabEl.classList.add("active");
            currentTabKey = tabKey;

            document.querySelectorAll(".cdp-group").forEach(function(group){
                const type = group.dataset.group;
                if (tabKey === "on-air") {
                    group.style.display = type === "on-air" ? "" : "none";
                } else {
                    // Individual category tab — show only the matching group
                    group.style.display = type === tabKey ? "" : "none";
                }
            });

            // Update the active-widget flag so event handlers route to the right widget,
            // but do NOT pause either widget — playback should continue across tab switches.
            window.onAirTabActive = (tabKey === "on-air");
        }

        // Expose activateTab globally so On Air can refresh visibility after late load
        window.activateTab = activateTab;
        window.currentTabKey = currentTabKey;
        // Expose so On Air's doRender() can call it across the scope boundary
        window.populateCurrentTrack = populateCurrentTrack;

        // If On Air tracks loaded before the demos widget was ready, apply now
        if (window._pendingOnAirDefaultTrack && !window.scHasPlayed) {
            populateCurrentTrack(0, window._pendingOnAirDefaultTrack);
            window._pendingOnAirDefaultTrack = null;
        }

        tabs.forEach(function(tab){
            tab.addEventListener("click", function(){
                window.currentTabKey = this.dataset.tab;
                activateTab(this.dataset.tab);
            });
        });
window._rerenderAllTab();
        // Mark as loaded so the 4s fallback timeout does NOT hide the player
        playlistLoaded = true;
        clearTimeout(timeout);
        // Ensure the player is visible — on slow connections (especially mobile) the
        // 12s timeout may have already hidden it before getSounds returned.
        if (player) { player.style.display = 'flex'; player.style.removeProperty('visibility'); }
        if (fallback) fallback.style.display = 'none';

        // === First track info ===
        // Default to first track in curated showreel order, not SC playlist order
        const first = showreelOrder.map(t => (window._allSounds || sounds).find(s => (s.title || "").toLowerCase().includes(t.toLowerCase()))).filter(Boolean)[0] || sounds[0];

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

        // Only populate with the demos default track if Demos is the active tab.
        // When ON AIR is the default, the On Air doRender() call handles this instead.
        setTimeout(function() {
            if (!window.onAirTabActive && !window.scHasPlayed) {
                populateCurrentTrack(0, first);
            }
        }, 800);

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

        widget.bind(SC.Widget.Events.PLAY, function () {

            // SC fires PLAY events internally (e.g. buffering the first track) even with
            // auto_play=false. Ignore those until the user has deliberately pressed play
            // or clicked a track — otherwise they overwrite our curated default display.
            if (!window.scUserInitiated) return;
            if (window.onAirTabActive) return; // On Air widget handles its own UI updates
            window.scHasPlayed = true; // first-play skip logic no longer needed

            // Reset progress state so new track starts clean
            duration = 0;
            drawWave(0);
            const _bpReset = document.getElementById('bottom-player');
            if (_bpReset) _bpReset.style.setProperty('--ap-progress', '0%');
            const _ringReset = document.getElementById('cdp-ring-fill');
            if (_ringReset) _ringReset.style.strokeDashoffset = '163.36';

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

            if (window.onAirTabActive) return;
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
            if (window.onAirTabActive) return;
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

            if (window.onAirTabActive) return;
            if (!e || typeof e.currentPosition === 'undefined') return;

            const current = e.currentPosition;

            // Prefer relativePosition so waveform works immediately without waiting
            // for the async getDuration cache (avoids blank waveform on first play).
            const percent = (typeof e.relativePosition === 'number' && e.relativePosition >= 0)
                ? e.relativePosition
                : (duration ? current / duration : 0);

            if (ctx && canvas) {
                drawWave(percent);
            }

            // Drive the mini mobile player progress bar via CSS custom property
            const bottomPlayer = document.getElementById('bottom-player');
            if (bottomPlayer) {
                bottomPlayer.style.setProperty('--ap-progress', (percent * 100).toFixed(2) + '%');
            }

            // Drive the progress ring around the main play button
            const ringFill = document.getElementById('cdp-ring-fill');
            if (ringFill) {
                const circumference = 163.36;
                ringFill.style.strokeDashoffset = (circumference * (1 - percent)).toFixed(2);
            }

            // Time display requires cached duration — skip until getDuration callback fires
            if (!duration) return;

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

        });

        if (canvas && ctx) {

            canvas.addEventListener('click', function (e) {

                if (!duration) return;

                const rect = canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;

                const percent = clickX / rect.width;
                const seekTo = percent * duration;

                const aw = window.onAirTabActive ? window.scWidgetOnAir : widget;
                if (aw) { aw.seekTo(seekTo); aw.play(); }

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
                const aw = window.onAirTabActive ? window.scWidgetOnAir : widget;
                if (aw) aw.seekTo(percent * duration);
            });
        }

        if (playBtn) {
            playBtn.addEventListener('click', function () {
                window.scUserInitiated = true;
                const aw = window.onAirTabActive ? window.scWidgetOnAir : widget;
                if (!aw) return;
                aw.isPaused(function (paused) {
                    if (paused) {
                        if (!window.onAirTabActive && typeof window.scDefaultTrackIndex === 'number' && !window.scHasPlayed) {
                            if (window.scSetCurrentIndex) window.scSetCurrentIndex(window.scDefaultTrackIndex);
                            widget.skip(window.scDefaultTrackIndex);
                            setTimeout(function() { widget.seekTo(0); widget.play(); }, 200);
                        } else {
                            aw.play();
                        }
                    } else {
                        aw.pause();
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
    const aw = window.onAirTabActive ? window.scWidgetOnAir : window.scWidget;
    if (!aw) return;

    window.scUserInitiated = true;
    aw.isPaused(function(paused) {
        if (paused) {
            if (!window.onAirTabActive && !window.scHasPlayed && typeof window.scDefaultTrackIndex === 'number') {
                if (window.scSetCurrentIndex) window.scSetCurrentIndex(window.scDefaultTrackIndex);
                window.scWidget.skip(window.scDefaultTrackIndex);
                setTimeout(function() {
                    window.scWidget.seekTo(0); window.scWidget.play();
                    setTimeout(function() {
                        window.scWidget.getCurrentSoundIndex(function(idx) {
                            document.querySelectorAll('.cdp-track-item .play-icon').forEach(function(ic) {
                                ic.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
                            });
                            document.querySelectorAll('.cdp-track-item').forEach(function(el) { el.classList.remove('active'); });
                            document.querySelectorAll('.cdp-track-item[data-index="' + idx + '"]').forEach(function(el) {
                                el.classList.add('active');
                                var ic = el.querySelector('.play-icon');
                                if (ic) ic.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
                            });
                        });
                    }, 400);
                }, 200);
            } else {
                aw.play();
            }
        } else {
            aw.pause();
        }
    });
}

function playerNext() {
    if (window.onAirTabActive && window.scSkipOnAir) { window.scSkipOnAir('next'); return; }
    if (window.scSkipInTab) { window.scSkipInTab('next'); return; }
    if (window.scWidget) window.scWidget.next(); // fallback before READY
}

function playerPrev() {
    if (window.onAirTabActive && window.scSkipOnAir) { window.scSkipOnAir('prev'); return; }
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
};

// If consent was already given before this file loaded, start now.
if (document.body && document.body.classList.contains("cd-player-on")) window.cdStartPlayer();
