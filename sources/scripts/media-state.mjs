// Source selection, preferences and timing rules used by the presentation player.
export function frameAt(time, cuepoints = []) {
    return 1 + cuepoints.filter((cue) => Number.isFinite(cue) && time >= cue).length;
}

export function orderedSources(sources = []) {
    const seen = new Set();
    return sources.filter((source) => {
        if (!source.src || seen.has(source.src)) return false;
        seen.add(source.src);
        return true;
    });
}

export function mediaTag(source) {
    if (/youtube/.test(source.type || '')) return 'youtube-video';
    return /mpegurl/i.test(source.type || '') || /\.m3u8(?:[?#]|$)/i.test(source.src) ? 'hlsjs-video' : 'video';
}

export function sideloadedCaptions(source, tracks) {
    return mediaTag(source) === 'video' ? tracks : [];
}

export function preference(app, name, fallback) {
    const key = `sbplus-${app.presentationId}-${name}-temp`;
    const value = app.hasStorageItem(key, true) ? app.getStorageItem(key, true) : app.getStorageItem(`sbplus-${name}`);
    return value === null || value === undefined || value === '' ? fallback : value;
}

export function engagementRange(time, duration, lastBucket, ended = false) {
    if (ended) return { bucket: -1, range: `${Math.floor(duration)}..${Math.floor(duration)}` };
    const bucket = Math.floor(time / 10) * 10;
    if (bucket <= lastBucket || bucket >= Math.floor(duration)) return null;
    return { bucket, range: `${bucket}..${Math.min(bucket + 10, Math.floor(duration))}` };
}

export function releaseMedia(media) {
    // Embed SDKs can destroy their iframe before the host disconnects. Their
    // pause/source setters may then throw, but navigation must still remove it.
    try { media.pause(); } catch { /* Already stopped by the provider. */ }
    try {
        media.removeAttribute('src');
        if ('source' in media) media.source = null;
    } catch { /* Disconnection below releases the remaining adapter resources. */ }
    if (media.localName === 'video' || media.localName === 'audio') {
        try { media.load(); } catch { /* The document may already be unloading. */ }
    }
    media.remove();
}
