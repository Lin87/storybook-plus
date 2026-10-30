import '@videojs/html/video/player';
import '@videojs/html/media/hlsjs-video';
import '@videojs/html/media/youtube-video';
import '../components/videojs/video/skin';
import '../components/videojs/video/presentation-controls';
import skin from '../components/videojs/video/skin.html';
import '../components/videojs/video/presentation.css';
import { frameAt, orderedSources, mediaTag, preference, releaseMedia, sideloadedCaptions } from './media-state.mjs';

/** One session owns its media, source fallback, subscriptions and listeners. */
export function createPresentationPlayer(page, src, app) {
    const placeholder = document.getElementById('mp');
    if (!placeholder || page.requests.signal.aborted) return null;
    const root = document.createElement('video-player');
    root.id = 'mp';
    root.innerHTML = skin;
    const container = root.querySelector('media-container');
    const stage = root.querySelector('.sbplus-media-stage');
    const slot = document.createComment('presentation media');
    stage.prepend(slot);
    const bridge = document.createElement('sbplus-player-state');
    root.append(bridge);
    // The narration player is only a short bar on HTML pages. Constraining
    // popups to that bar leaves no room for a menu or tooltip above it.
    if (page.type === 'html') {
        root.querySelectorAll('media-menu, media-volume-popover, media-tooltip')
            .forEach((popup) => popup.setAttribute('boundary', 'viewport'));
    }
    const poster = root.querySelector('.sbplus-narration');
    const fullscreen = page.allowFullscreen === true && !(page.isAudio || page.isBundle);
    if (!fullscreen) {
        root.querySelector('media-fullscreen-button')?.remove();
        root.querySelectorAll('[action="toggleFullscreen"]').forEach((el) => el.remove());
    }
    const autoplay = !app.isMobileDevice() && app.getStorageItem('sbplus-autoplay') !== '0' && page.preventAutoplay !== 'true';
    document.querySelector(app.layout.wrapper)?.classList.toggle('preventAutoplay', !autoplay);
    let sources;
    if (page.isKaltura) sources = [...page.isKaltura.playerSrc].reverse();
    else if (page.isBrightcove) sources = page.isBrightcove.sources.map((s) => ({ ...s, type: s.codec === 'H264' ? 'video/mp4' : s.type }));
    else if (page.isYoutube) sources = [{ src: `https://www.youtube.com/watch?v=${src}`, type: 'video/youtube' }];
    else sources = [{ src: `${app.assetsPath}${page.isVideo ? 'video/' : 'audio/'}${src}.${page.isVideo ? 'mp4' : 'mp3'}`, type: page.isVideo ? 'video/mp4' : 'audio/mpeg' }];
    sources = orderedSources(sources);
    let media, index = 0, mediaAbort, unsubscribe, disposed = false, generation = 0;
    let resumeTime = 0, resumePlaying = false;
    const lifetime = new AbortController();
    const signal = lifetime.signal;
    const listen = (target, type, callback) => target.addEventListener(type, callback, { signal });
    const save = (key, value) => app.setStorageItem(`sbplus-${app.presentationId}-${key}-temp`, value, true);
    const session = {
        root, container,
        get source() { return sources[index] || { src: '', type: '' }; },
        dispose() {
            if (disposed) return;
            disposed = true;
            generation++;
            unsubscribe?.();
            mediaAbort?.abort();
            lifetime.abort();
            if (media) releaseMedia(media);
            root.remove();
            page.mediaPlayer = null;
            page.isPlaying = false;
        },
    };
    page.requests.signal.addEventListener('abort', () => session.dispose(), { once: true, signal });
    const updateFrame = () => {
        if (!page.isBundle && !(page.isAudio && page.hasImage)) return;
        const imageSrc = `${app.assetsPath}pages/${src}${page.isBundle ? '-' + frameAt(media.currentTime, page.cuepoints) : ''}.${page.imgType}`;
        if (poster.getAttribute('src') !== imageSrc) poster.setAttribute('src', imageSrc);
        poster.alt = `Content about ${page.title}`;
        poster.hidden = false;
        if (page.description) poster.setAttribute('aria-describedby', 'long-description');
    };
    let markerSignature = '';
    const updateMarkers = () => {
        const rail = root.querySelector('.sbplus-markers');
        const signature = JSON.stringify([media.duration, page.markers]);
        if (signature === markerSignature) return;
        markerSignature = signature;
        rail.replaceChildren();
        if (!Number.isFinite(media.duration) || media.duration <= 0) return;
        (page.markers || []).forEach((marker, markerIndex) => {
            if (marker.time < 0 || marker.time > media.duration) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'sbplus-marker';
            button.style.left = `${marker.time / media.duration * 100}%`;
            if (marker.color) button.style.setProperty('--marker-color', marker.color);
            button.id = `sbplus-marker-${markerIndex}`;
            const label = marker.text || `${marker.time}s`;
            button.setAttribute('aria-label', `${label}, ${marker.time} seconds`);
            button.addEventListener('click', () => { media.currentTime = marker.time; });
            const tooltip = document.createElement('media-tooltip');
            tooltip.setAttribute('trigger', button.id);
            tooltip.setAttribute('side', 'top');
            if (page.type === 'html') tooltip.setAttribute('boundary', 'viewport');
            tooltip.className = 'media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip';
            tooltip.textContent = label;
            rail.append(button, tooltip);
        });
    };
    listen(root.querySelector('.sbplus-expand'), 'click', () => {
        const layout = document.querySelector(app.layout.sbplus);
        layout.classList.toggle('sbplus-media-expanded');
        root.querySelector('.sbplus-expand').setAttribute('aria-pressed', String(layout.classList.contains('sbplus-media-expanded')));
    });
    root.querySelector('.sbplus-expand').setAttribute('aria-pressed', String(document.querySelector(app.layout.sbplus).classList.contains('sbplus-media-expanded')));
    root.querySelectorAll('[data-seek]').forEach((button) => listen(button, 'click', () => {
        if (Number.isFinite(media.duration)) media.currentTime = Math.max(0, Math.min(media.duration, media.currentTime + Number(button.dataset.seek)));
    }));
    listen(poster, 'error', () => page.showPageError('NO_IMG', poster.src));
    placeholder.replaceWith(root);

    function loadSource() {
        const version = ++generation;
        unsubscribe?.();
        mediaAbort?.abort();
        if (media) releaseMedia(media);
        if (!sources[index]) { page.showPageError('NO_MEDIA', src); return; }
        mediaAbort = new AbortController();
        markerSignature = '';
        const on = (type, callback) => media.addEventListener(type, callback, { signal: mediaAbort.signal });
        media = document.createElement(mediaTag(sources[index]));
        media.id = 'mp_media';
        media.setAttribute('playsinline', '');
        media.setAttribute('preload', 'auto');
        media.setAttribute('disablepictureinpicture', '');
        media.setAttribute('crossorigin', 'anonymous');
        if (autoplay || resumePlaying) media.setAttribute('autoplay', '');
        if (page.description) media.setAttribute('aria-describedby', 'long-description');
        if (!autoplay) media.poster = page.isKaltura ? page.isKaltura.poster + '/width/900/quality/100' : page.isBrightcove?.poster?.[0]?.src || '';
        if (page.transition) media.classList.add('animated', page.transition.trim());
        on('animationend', () => media.classList.remove('animated', ...(page.transition ? [page.transition.trim()] : [])));
        const tracks = Array.isArray(page.captionUrl) ? page.captionUrl : page.captionUrl ? [{ kind: 'captions', language: 'en', label: 'English', url: page.captionUrl }] : [];
        // Hosted HLS already supplies its caption tracks. Adding the API's VTT
        // copies as well lets two English tracks show simultaneously. Sideload
        // those tracks only for progressive fallback, as the original player did.
        sideloadedCaptions(sources[index], tracks).forEach((caption) => {
            const track = document.createElement('track');
            Object.assign(track, { kind: caption.kind, srclang: caption.language, label: caption.label, src: caption.url });
            media.append(track);
        });
        page.mediaPlayer = media;
        on('loadedmetadata', (event) => {
            if (resumeTime) media.currentTime = Math.min(resumeTime, media.duration || resumeTime);
            updateFrame(); updateMarkers();
            if (page.isBrightcove) {
                page.isBrightcove.duration = media.duration;
                if (!page.isBrightcove.impressionSent) {
                    page.isBrightcove.impressionSent = true;
                    page.sendBrightcoveAnalyticsEvent('video_impression', event);
                }
            }
        });
        on('durationchange', updateMarkers);
        on('seeking', updateFrame);
        on('timeupdate', (event) => { updateFrame(); if (page.isBrightcove && !media.paused && !media.seeking) page.onBrightcoveTimeUpdate(event); });
        on('play', () => {
            const msg = document.querySelector(app.layout.mediaMsg);
            msg?.classList.add('hide');
            if (page.isBrightcove && !page.isBrightcove.firstPlaySent) {
                page.isBrightcove.firstPlaySent = true;
                page.isBrightcove.firstPlayRequestTime = Date.now();
            }
        });
        on('playing', (event) => {
            page.isPlaying = true;
            if (page.isBrightcove) {
                page.sendBrightcoveAnalyticsEvent('play_request', event);
                page.sendBrightcoveAnalyticsEvent('video_view', event);
            }
        });
        ['waiting', 'pause', 'ended'].forEach((type) => on(type, (event) => {
            page.isPlaying = false;
            if (type === 'ended' && page.isBrightcove) page.onBrightcoveTimeUpdate(event);
        }));
        on('error', () => {
            if (disposed) return;
            resumeTime = media.currentTime || 0;
            resumePlaying = !media.paused;
            if (index + 1 < sources.length) { index++; loadSource(); }
            else page.showPageError('NO_MEDIA', sources[index].src);
        });
        slot.after(media);
        updateFrame();
        // Attach every listener before assigning the source, including provider telemetry.
        if (page.isYoutube) media.source = { src: sources[index].src, engine: { youtube: { rel: 0, iv_load_policy: 3, fs: fullscreen ? 1 : 0 } } };
        else if (media.localName === 'hlsjs-video') media.source = sources[index];
        else media.src = sources[index].src;

        let restored = false, captionsRestored = false, previous = {};
        const sync = () => {
            const store = bridge.store;
            if (!store?.target || disposed || generation !== version) return;
            let state = store.state;
            if (!restored) {
                restored = true;
                store.setVolume(Math.max(0, Math.min(1, Number(preference(app, 'volume', 1)))));
                store.setPlaybackRate(Number(preference(app, 'playbackrate', app.playbackrate || 1)));
                state = store.state;
            }
            const captionTracks = state.textTrackList?.filter((t) => ['captions', 'subtitles'].includes(t.kind)) || [];
            if (!captionsRestored && captionTracks.length) {
                captionsRestored = true;
                const enabled = preference(app, 'subtitle', '0') === '1';
                store.selectSubtitlesTrack(enabled ? captionTracks[0].id : null);
                previous.captions = enabled;
            } else if (captionsRestored) {
                const showing = Array.from(media.textTracks || []).some((track) => ['captions', 'subtitles'].includes(track.kind) && track.mode === 'showing');
                if (previous.captions !== showing) {
                    previous.captions = showing;
                    save('subtitle', showing ? 1 : 0);
                }
            }
            if (previous.volume !== state.volume) { previous.volume = state.volume; save('volume', state.volume); }
            if (previous.rate !== state.playbackRate) {
                previous.rate = state.playbackRate;
                app.playbackrate = state.playbackRate;
                save('playbackrate', state.playbackRate);
            }
        };
        // Connection is synchronous; store attachment finishes in the next update.
        queueMicrotask(() => {
            if (disposed || version !== generation) return;
            unsubscribe = bridge.store?.subscribe(sync);
            sync();
        });
    }
    if (page.isBrightcove) page.sendBrightcoveAnalyticsEvent('player_load', { type: 'ready' });
    loadSource();
    if (page.isYoutube) installYouTubeCaptions();

    function installYouTubeCaptions() {
        // Let the browser parse WebVTT in a detached, silent native media element.
        // YouTube's textTracks list accepts provider tracks only.
        const parser = document.createElement('video');
        const track = document.createElement('track');
        track.kind = 'captions'; track.srclang = 'en'; track.label = 'English';
        parser.hidden = true;
        root.append(parser); parser.append(track);
        track.track.mode = 'hidden';
        const overlay = root.querySelector('.sbplus-local-captions');
        const toggle = root.querySelector('.sbplus-local-caption-toggle');
        let enabled = preference(app, 'subtitle', '0') === '1';
        let loaded = false;
        let playbackStarted = false;
        const fallbackAvailable = () => loaded && playbackStarted && !Array.from(media.textTracks || [])
            .some((item) => ['captions', 'subtitles'].includes(item.kind));
        const draw = () => {
            overlay.replaceChildren();
            if (!enabled || !fallbackAvailable() || !track.track.cues) return;
            Array.from(track.track.cues).filter((cue) => media.currentTime >= cue.startTime && media.currentTime < cue.endTime).forEach((cue) => {
                const line = document.createElement('span');
                line.append(cue.getCueAsHTML()); overlay.append(line);
            });
        };
        const updateAvailability = () => {
            const available = fallbackAvailable();
            toggle.hidden = !available;
            toggle.setAttribute('aria-pressed', String(available && enabled));
            draw();
        };
        listen(track, 'load', () => { loaded = true; updateAvailability(); });
        // YouTube exposes provider captions only after playback begins. Wait
        // for that inspection, and remove the fallback if tracks arrive later.
        listen(media, 'playing', () => { playbackStarted = true; updateAvailability(); });
        ['addtrack', 'removetrack', 'change'].forEach((type) => listen(media.textTracks, type, updateAvailability));
        listen(toggle, 'click', () => {
            if (!fallbackAvailable()) return;
            enabled = !enabled;
            save('subtitle', enabled ? 1 : 0);
            updateAvailability();
        });
        ['timeupdate', 'seeking', 'seeked', 'ended'].forEach((type) => listen(media, type, draw));
        track.src = `${app.assetsPath}video/yt-${src}.vtt`;
        // Overlay uses percentage positioning and reflows naturally on resize/fullscreen.
    }
    return session;
}
