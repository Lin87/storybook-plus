import { headRequest, loadScript, onAnimationEnd, onDelegate, isVisible } from './utilities';
import { SBPLUS } from './sbplus-dev';
import { Quiz } from './quiz';

/**
 * Represents a presentation page and normalizes XML/media metadata for rendering.
 * @param {Object} obj Parsed page data from the table of contents entry.
 * @param {Array|NodeList|HTMLCollection|Element} data XML node context for the selected page.
 */
let Page = function (obj, data) {
    this.pageXML = obj.xml[0];
    this.pageData = data;
    this.title = obj.title;
    this.type = obj.type;
    this.transition = obj.transition;
    this.pageNumber = obj.number;

    if (obj.type !== 'quiz') {
        this.src = obj.src;
        this.preventAutoplay = obj.preventAutoplay;
        this.disableFullscreen = obj.disableFullscreen;
        this.useDefaultPlayer = obj.useDefaultPlayer;
        this.notes = obj.notes;
        this.widget = obj.widget;
        this.widgetSegments = {};
        this.copyableContent = obj.copyableContent;
        this.imgType = obj.imageFormat;
        this.description = obj.description;

        if (obj.type !== 'image' && obj.markers.length) {
            this.markersNode = obj.markers[0];
            this.markers = [];
        }

        if (obj.frames.length) {
            this.frames = obj.frames;
            this.cuepoints = [];
        }

        this.mediaPlayer = null;
        this.isKaltura = null;
        this.isAudio = false;
        this.isVideo = false;
        this.isYoutube = false;
        this.isBrightcove = null;
        this.isBundle = false;
        this.isPlaying = false;
        this.captionUrl = '';

        this.hasImage = false;
        this.missingImgUrl = '';
        this.delayStorage = null;
    }

    this.root = SBPLUS.manifest.sbplus_root_directory;
    this.assetsRoot = SBPLUS.assetsPath;
    this.kaltura = {
        id: SBPLUS.manifest.sbplus_kaltura_id,
    };
    this.kalturaSrc = {};

    this.mediaContent = SBPLUS.layout.mediaContent;
    this.quizContainer = SBPLUS.layout.quizContainer;
    this.mediaError = SBPLUS.layout.mediaError;
};

/**
 * Clears prior media state and renders the selected page's primary media.
 * @returns {void}
 */
Page.prototype.getPageMedia = function () {
    const self = this;

    const quizContainerEl = document.querySelector(SBPLUS.layout.quizContainer);
    const mediaContentEl = document.querySelector(self.mediaContent);
    const mediaErrorEl = document.querySelector(this.mediaError);
    const mediaMsgEl = document.querySelector(SBPLUS.layout.mediaMsg);
    const mediaWrapperEl = document.querySelector(SBPLUS.layout.media);
    const widgetEl = document.querySelector(SBPLUS.layout.widget);
    if (typeof videojs !== 'undefined' && typeof videojs.getPlayer === 'function') {
        const existingPlayer = videojs.getPlayer('mp');
        if (existingPlayer) {
            existingPlayer.dispose();
        }
    } else if (document.querySelector('#mp')) {
        videojs('mp').dispose();
    }

    if (quizContainerEl) {
        quizContainerEl.classList.add('hidden');
        quizContainerEl.innerHTML = '';
    }

    if (mediaContentEl) {
        mediaContentEl.style.backgroundImage = '';
        mediaContentEl.classList.remove('compat-object-fit', 'show-vjs-poster', 'iframeEmbed');
        mediaContentEl.innerHTML = '';
    }

    if (mediaErrorEl) {
        mediaErrorEl.innerHTML = '';
        mediaErrorEl.style.display = 'none';
    }

    SBPLUS.clearWidget();

    if (mediaMsgEl) {
        mediaMsgEl.classList.add('hide');
        mediaMsgEl.innerHTML = '';
    }
    if (mediaWrapperEl) {
        mediaWrapperEl.classList.remove('hidden');
    }
    if (widgetEl) {
        widgetEl.classList.remove('hidden');
    }

    removeSecondaryControls();
    self.showCopyBtn();

    switch (self.type) {
        case 'kaltura':
            if (!isNaN(self.kaltura.id) && self.kaltura.id !== 0) {
                self.addMarkers();

                if (SBPLUS.kalturaLoaded === false) {
                    loadScript(self.root + 'scripts/libs/kaltura/mwembedloader.js')
                        .then(() => loadScript(self.root + 'scripts/libs/kaltura/kwidgetgetsources.js'))
                        .then(() => {
                            SBPLUS.kalturaLoaded = true;
                            self.loadKalturaVideoData();
                        });
                } else {
                    self.loadKalturaVideoData();
                }
            } else {
                self.showPageError('KAL_NOT_AVAILABLE');
            }

            self.setWidgets();

            break;

        case 'brightcove':
            self.addMarkers();
            self.loadBrightcoveVideoData();
            self.setWidgets();

            break;

        case 'image-audio':
            self.isAudio = true;

            const imageAudioUrl = SBPLUS.assetsPath + 'pages/' + self.src + '.' + self.imgType;

            headRequest(imageAudioUrl)
                .then(() => {
                    self.hasImage = true;
                })
                .catch(() => {
                    self.showPageError('NO_IMG', imageAudioUrl);
                    self.missingImgUrl = imageAudioUrl;
                })
                .finally(() => {
                    const captionPath = SBPLUS.assetsPath + 'audio/' + self.src + '.vtt';

                    headRequest(captionPath)
                        .then(() => {
                            self.captionUrl = captionPath;
                        })
                        .catch(() => {
                            self.captionUrl = '';
                        })
                        .finally(() => {
                            const html = '<video id="mp" class="video-js vjs-default-skin"></video>';

                            if (mediaContentEl) {
                                mediaContentEl.classList.add('show-vjs-poster');
                                mediaContentEl.innerHTML = html;
                            }

                            self.addMarkers();
                            self.renderVideoJS();
                            self.setWidgets();

                            if (!!self.description) {
                                self.insertDescription();
                            }
                        });
                });

            break;

        case 'image':
            const img = new Image();
            img.src = SBPLUS.assetsPath + 'pages/' + self.src + '.' + self.imgType;
            img.alt = self.title;

            img.addEventListener('load', function () {
                self.hasImage = true;

                document.querySelectorAll('.sbplus_media_content').forEach((container) => {
                    const image = container.querySelector('img');
                    const imgUrl = image ? image.src : '';
                    if (imgUrl) {
                        container.style.backgroundImage = 'url(' + imgUrl + ')';
                    }
                });
            });

            img.addEventListener('error', function () {
                self.hasImage = false;
                self.showPageError('NO_IMG', img.src);
            });

            if (mediaContentEl) {
                mediaContentEl.innerHTML = '<img src="' + img.src + '" class="img_only"  alt="Content about ' + SBPLUS.escapeHTMLAttribute(self.title) + '" />';
            }
            self.setWidgets();

            if (!!self.description) {
                self.insertDescription();
            }

            addSecondaryControls(true);

            break;

        case 'video':
            const videoCaptionPath = SBPLUS.assetsPath + 'video/' + self.src + '.vtt';

            headRequest(videoCaptionPath)
                .then(() => {
                    self.captionUrl = videoCaptionPath;
                })
                .catch(() => {
                    self.captionUrl = '';
                })
                .finally(() => {
                    const html = '<video id="mp" class="video-js vjs-default-skin" crossorigin="anonymous" width="100%" height="100%"></video>';

                    if (mediaContentEl) {
                        mediaContentEl.innerHTML = html;
                    }
                    self.isVideo = true;
                    self.addMarkers();
                    self.renderVideoJS();

                    if (!!self.description) {
                        const html5Api = document.querySelector('#mp_html5_api');
                        if (html5Api) {
                            html5Api.setAttribute('aria-describedby', 'long-description');
                        }
                        self.insertDescription();
                    }

                    self.setWidgets();
                });

            break;

        case 'youtube':
            self.isYoutube = true;

            if (self.useDefaultPlayer === 'true' || self.useDefaultPlayer === 'yes') {
                if (mediaContentEl) {
                    mediaContentEl.innerHTML = '<video id="mp" class="video-js vjs-default-skin"></video>';
                }

                self.addMarkers();
                self.renderVideoJS();

                if (!!self.description) {
                    document.querySelector('.video-js').setAttribute('aria-describedby', 'long-description');
                    self.insertDescription();
                }
            } else {
                const autoplay = self.preventAutoplay === 'false' || self.preventAutoplay === 'no' ? 1 : 0;

                if (mediaContentEl) {
                    mediaContentEl.innerHTML = '<div class="yt-native"><iframe id="youtube-ui" width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/' + self.src + '?autoplay=' + autoplay + '&playsinline=1&modestbranding=1&disablekb=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture, fullscreen"></iframe></div>';
                }
                addSecondaryControls();
            }

            self.setWidgets();

            break;

        case 'bundle':
            Array.from(self.frames).forEach((frame) => {
                const start = frame && frame.getAttribute ? frame.getAttribute('start') : '';
                const cue = toSeconds(start);
                self.cuepoints.push(cue);
            });

            const bundleCaptionPath = SBPLUS.assetsPath + 'audio/' + self.src + '.vtt';

            headRequest(bundleCaptionPath)
                .then(() => {
                    self.captionUrl = bundleCaptionPath;
                })
                .catch(() => {
                    self.captionUrl = '';
                })
                .finally(() => {
                    const html = '<video id="mp" class="video-js vjs-default-skin"></video>';

                    if (mediaContentEl) {
                        mediaContentEl.classList.add('show-vjs-poster');
                        mediaContentEl.innerHTML = html;
                    }

                    self.isBundle = true;
                    self.addMarkers();
                    self.renderVideoJS();
                    self.setWidgets();

                    if (!!self.description) {
                        const html5Api = document.querySelector('#mp_html5_api');
                        if (html5Api) {
                            html5Api.setAttribute('aria-describedby', 'long-description');
                        }
                        self.insertDescription();
                    }
                });

            break;

        case 'quiz':
            if (quizContainerEl) {
                quizContainerEl.classList.remove('hidden');
            }
            if (widgetEl) {
                widgetEl.classList.add('hidden');
            }
            if (mediaWrapperEl) {
                mediaWrapperEl.classList.add('hidden');
            }

            const qObj = {
                id: self.pageNumber,
            };

            const quizItem = new Quiz(qObj, self.pageData);
            quizItem.getQuiz();

            break;

        case 'html':
            let embed = false;
            let audioSrc = false;
            let path = self.src;

            if (!isUrl(path)) {
                path = SBPLUS.assetsPath + 'html/' + self.src + '/index.html';
            }

            const embedAttr = self.pageXML.getAttribute('embed');
            if (embedAttr !== null) {
                embed = embedAttr.toLowerCase();
            }

            const audioNode = self.pageXML.querySelector('audio');
            if (audioNode) {
                audioSrc = (audioNode.getAttribute('src') || '').toLowerCase();
            }

            if (embed === 'yes' || embed === 'true') {
                let iframe = '<iframe class="html" src="' + path + '" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"></iframe>';

                if (audioSrc.length) {
                    let audio = '<video id="mp" class="video-js vjs-default-skin"></video>';

                    self.isAudio = true;
                    if (mediaContentEl) {
                        mediaContentEl.insertAdjacentHTML('beforeend', audio);
                    }
                    self.addMarkers();
                    self.renderVideoJS(audioSrc);
                } else {
                    addSecondaryControls(false);
                }

                if (mediaContentEl) {
                    mediaContentEl.classList.add('iframeEmbed');
                    mediaContentEl.insertAdjacentHTML('afterbegin', iframe);
                }
            } else {
                let holder = '<div class="html exLink">';
                holder += '<small>click the link to open it in a new tab/window</small>';
                holder += '<a href="' + path + '" target="_blank">' + path + '</a>';
                holder += '</div>';

                if (mediaContentEl) {
                    mediaContentEl.classList.add('html');
                    mediaContentEl.innerHTML = holder;
                }
                window.open(path, '_blank');
            }

            self.setWidgets();

            break;

        default:
            self.showPageError('UNKNOWN_TYPE', self.type);
            self.setWidgets();
            break;
    }

    if (self.type === 'image' || self.type === 'html') {
        if (mediaContentEl) {
            const transitionClass = typeof self.transition === 'string' ? self.transition.trim() : '';
            if (transitionClass) {
                mediaContentEl.classList.add(transitionClass);
            }
            onAnimationEnd(mediaContentEl, function () {
                if (transitionClass) {
                    mediaContentEl.classList.remove(transitionClass);
                }
            });
        }
    }

    window.setTimeout(function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        const mediaWrapper = document.querySelector(SBPLUS.layout.media);
        if (mediaWrapper) {
            mediaWrapper.focus();
        }
    }, 750);

    window.clearTimeout(self.delayStorage);

    self.delayStorage = window.setTimeout(function () {
        const presentation = SBPLUS.sanitize(SBPLUS.getCourseDirectory());
        const pSectionNumber = self.pageNumber[0] + ',' + self.pageNumber[1];

        if (pSectionNumber !== '0,0') {
            SBPLUS.setStorageItem('sbplus-' + presentation, pSectionNumber);
        } else {
            SBPLUS.deleteStorageItem('sbplus-' + presentation);
        }
    }, 3000);
};

/**
 * Adds the copy-to-clipboard control when the current page exposes copyable text.
 * @returns {void}
 */
Page.prototype.showCopyBtn = function () {
    this.removeCopyBtn();

    if (this.copyableContent) {
        const copyBtn = document.createElement('button');
        copyBtn.id = 'copyToCbBtn';

        const copyBtnTxt = document.createElement('span');
        copyBtnTxt.classList.add('btn-txt');

        const copyName = this.copyableContent && this.copyableContent[0] ? this.copyableContent[0].getAttribute('name') : '';
        if (!SBPLUS.isEmpty(copyName)) {
            copyBtnTxt.innerHTML = copyName;
        } else {
            copyBtnTxt.innerHTML = 'Copy to Clipboard';
        }

        copyBtn.append(copyBtnTxt);

        const copyTxtArea = document.createElement('textarea');
        copyTxtArea.id = 'copyableTxt';
        copyTxtArea.readOnly = true;
        copyTxtArea.innerHTML = this.copyableContent[0].textContent;
        copyTxtArea.setAttribute('aria-hidden', true);

        const mediaContainer = document.querySelector(SBPLUS.layout.media);
        if (mediaContainer) {
            mediaContainer.prepend(copyBtn);
            mediaContainer.prepend(copyTxtArea);
            this.copyDelegateCleanup = onDelegate(mediaContainer, 'click', '#copyToCbBtn', copyToClipboard);
        }
    }
};

/**
 * Removes any existing copy-to-clipboard control from the media area.
 * @returns {void}
 */
Page.prototype.removeCopyBtn = function () {
    const copyBtn = document.getElementById('copyToCbBtn');
    const copyTxtArea = document.getElementById('copyableTxt');

    if (copyBtn && copyTxtArea) {
        copyBtn.parentNode.removeChild(copyBtn);
        copyTxtArea.parentNode.removeChild(copyTxtArea);
        if (this.copyDelegateCleanup) {
            this.copyDelegateCleanup();
            this.copyDelegateCleanup = null;
        }
    }
};

/**
 * Copies page text from the hidden source element into the system clipboard.
 * @returns {void}
 */
function copyToClipboard() {
    const copyBtn = document.getElementById('copyToCbBtn');
    const copyTxtArea = document.getElementById('copyableTxt');

    if (copyBtn && copyTxtArea) {
        const copyBtnTxt = copyBtn.querySelectorAll('.btn-txt')[0];
        if (!copyBtnTxt) {
            return;
        }
        const originalCopyBtnTxt = copyBtn.innerHTML;
        const clipboard = navigator.clipboard;

        clipboard.writeText(copyTxtArea.innerHTML).then(() => {
            copyBtn.focus();
            copyBtnTxt.innerHTML = 'Copied';
        });

        setTimeout(() => {
            copyBtnTxt.innerHTML = originalCopyBtnTxt;
        }, 3000);
    }
}

/**
 * Injects long-description content and wires toggle behavior for accessibility.
 * @returns {void}
 */
Page.prototype.insertDescription = function () {
    const self = this;

    if (self.description) {
        const longDescEl = document.createElement('div');

        longDescEl.id = 'long-description';
        longDescEl.classList.add('sr-only');
        longDescEl.innerText = self.description[0].textContent;

        const imageOnly = document.querySelector('.img_only');

        if (imageOnly) {
            imageOnly.setAttribute('aria-describedby', 'long-description');
        }

        document.querySelector(self.mediaContent).appendChild(longDescEl);
    }
};

/**
 * Fetches Kaltura metadata/sources and initializes playback data for Video.js.
 * @returns {void}
 */
Page.prototype.loadKalturaVideoData = function () {
    const self = this;

    self.isKaltura = {
        status: {
            entry: 0,
            low: 0,
            normal: 0,
            medium: 0,
        },
        duration: '',
    };

    kWidget.getSources({
        partnerId: self.kaltura.id,
        entryId: self.src,
        callback: function (data) {
            const captions = data.caption;

            self.isKaltura.status.entry = data.status;
            self.isKaltura.duration = data.duration;
            self.isKaltura.poster = data.poster;
            self.isKaltura.playerSrc = [];

            data.sources.forEach((source) => {
                if (source.type === 'video/mp4') {
                    self.isKaltura.playerSrc.push({
                        src: source.src,
                        type: source.type,
                    });
                }

                if (source.type === 'application/vnd.apple.mpegurl') {
                    self.isKaltura.playerSrc.push({
                        src: source.src,
                        type: source.type,
                    });
                }
            });

            if (self.isKaltura.status.entry == 2) {
                if (captions !== null) {
                    self.captionUrl = [];

                    captions.forEach((caption) => {
                        if (caption.label.toLowerCase() != 'english (autocaption)') {
                            self.captionUrl.push({
                                kind: 'captions',
                                language: caption.languageCode,
                                label: caption.language,
                                url: 'https://www.kaltura.com/api_v3/?service=caption_captionasset&action=servewebvtt&captionAssetId=' + caption.id + '&segmentDuration=' + self.isKaltura.duration + '&segmentIndex=1',
                            });
                        }
                    });
                }

                const html = '<video id="mp" class="video-js vjs-default-skin" crossorigin="anonymous" width="100%" height="100%"></video>';

                const mediaContentEl = document.querySelector(self.mediaContent);
                if (mediaContentEl) {
                    mediaContentEl.innerHTML = html;
                }
                self.renderVideoJS();

                if (!!self.description) {
                    const html5Api = document.querySelector('#mp_html5_api');
                    if (html5Api) {
                        html5Api.setAttribute('aria-describedby', 'long-description');
                    }
                    self.insertDescription();
                }
            } else {
                self.showPageError('KAL_ENTRY_NOT_READY');
            }
        },
    });
};

/**
 * Fetches Brightcove playback data and prepares source/caption metadata.
 * @returns {void}
 */
Page.prototype.loadBrightcoveVideoData = function () {
    const self = this;

    const mediaContentEl = document.querySelector(self.mediaContent);
    if (mediaContentEl) {
        mediaContentEl.innerHTML = '<span class="loading-spinner"></span>';
    }

    fetch('https://api.academics.excelsior.edu/brightcove?vid=' + self.src)
        .then((response) => {
            if (!response.ok) {
                self.showPageError('BRIGHTCOVE_NOT_AVAILABLE');
                throw new Error('Failed to retrieve Brightcove video');
            }

            return response.json();
        })
        .then((data) => {
            const now = new Date().toISOString();
            const rand = Math.random() * 1000000;
            const session = parseInt(rand).toString() + '_' + now;

            self.isBrightcove = {
                name: data.response.name,
                sources: data.response.sources,
                poster: data.response.poster,
                duration: 0,
                session: session,
                videoId: self.src,
                accountId: SBPLUS.manifest.sbplus_brightcove_id,
                lastEngagedTime: -1,
                firstPlayRequestTime: Date().valueOf(),
            };

            self.captionUrl = [];

            if (data.response.text_tracks.length) {
                data.response.text_tracks.forEach((caption) => {
                    if (caption.label.toLowerCase() != 'english (autocaption)') {
                        self.captionUrl.push({
                            kind: caption.kind,
                            language: caption.srclang,
                            label: caption.label,
                            url: caption.src,
                        });
                    }
                });
            }

            const html = '<video id="mp" class="video-js vjs-default-skin animated fadeIn" crossorigin="anonymous" width="100%" height="100%"></video>';

            const contentEl = document.querySelector(self.mediaContent);
            if (contentEl) {
                contentEl.innerHTML = html;
            }
            self.renderVideoJS();
            if (!!self.description) {
                const html5Api = document.querySelector('#mp_html5_api');
                if (html5Api) {
                    html5Api.setAttribute('aria-describedby', 'long-description');
                }
                self.insertDescription();
            }
        })
        .catch((error) => {
            self.showPageError('BRIGHTCOVE_NOT_AVAILABLE');
        });
};

/**
 * Parses marker data from XML into Video.js marker configuration entries.
 * @returns {void}
 */
Page.prototype.addMarkers = function () {
    if (this.markersNode != undefined) {
        Array.from(this.markersNode.children).forEach((marker) => {
            const m = {
                time: toSeconds(marker.getAttribute('timecode')),
                text: marker.innerHTML.trim().length ? SBPLUS.noScript(marker.innerHTML.trim()) : '',
                color: marker.getAttribute('color') ? marker.getAttribute('color') : '',
            };

            this.markers.push(m);
        });
    }
};

/**
 * Builds and configures a Video.js instance for the current page.
 * @param {string=} src Optional direct media source URL override.
 * @returns {void}
 */
Page.prototype.renderVideoJS = function (src) {
    const self = this;

    src = typeof src !== 'undefined' ? src : self.src;

    let isAutoplay = true;

    if (SBPLUS.getStorageItem('sbplus-autoplay') === '0') {
        isAutoplay = false;
    }

    if (self.preventAutoplay === 'true') {
        isAutoplay = false;
        const wrapperEl = document.querySelector(SBPLUS.layout.wrapper);
        if (wrapperEl) {
            wrapperEl.classList.add('preventAutoplay');
        }
    } else {
        const wrapperEl = document.querySelector(SBPLUS.layout.wrapper);
        if (wrapperEl) {
            wrapperEl.classList.remove('preventAutoplay');
        }
    }

    const options = {
        techOrder: ['html5'],
        controls: true,
        inactivityTimeout: 0,
        autoplay: isAutoplay,
        preload: 'auto',
        playbackRates: [0.5, 1, 1.5, 2],
        controlBar: {
            fullscreenToggle: false,
            pictureInPictureToggle: false,
            liveDisplay: false,
            seekToLive: false,
            skipButtons: {
                forward: 10,
                backward: 10,
            },
        },
        plugins: {
            qualityMenu: {},
        },
    };
    if (SBPLUS.isMobileDevice()) {
        options.autoplay = false;
        options.playsinline = true;
        options.nativeControlsForTouch = false;
    }
    if (self.isYoutube) {
        options.techOrder = ['youtube'];
        options.sources = [{ type: 'video/youtube', src: 'https://www.youtube.com/watch?v=' + src }];
        options.youtube = { iv_load_policy: 3, rel: 0 };
        options.playbackRates = null;
    }

    if (self.isBrightcove) {
        options.html5 = {
            vhs: {
                withCredentials: false,
                overrideNative: false,
            },
        };
    }

    if (self.isKaltura || self.isBrightcove || self.isYoutube || self.isVideo) {
        options.controlBar.fullscreenToggle = self.disableFullscreen === 'true' ? false : true;
    }

    self.mediaPlayer = videojs('mp', options, function onPlayerReady() {
        const player = this;

        if (self.isKaltura) {
            if (isAutoplay === false) {
                player.poster(self.isKaltura.poster + '/width/900/quality/100');
            }

            player.src(self.isKaltura.playerSrc.reverse());
        }

        if (self.isBrightcove) {
            if (isAutoplay === false && self.isBrightcove.poster.length) {
                player.poster(self.isBrightcove.poster[0].src);
            }

            let vidSources = [];

            self.isBrightcove.sources.forEach((source) => {
                if (source.codec && source.codec == 'H264') {
                    vidSources.push({ type: 'video/mp4', src: source.src });
                }

                vidSources.push({ type: source.type, src: source.src });
            });

            player.src(vidSources);

            player.on('loadedmetadata', (evt) => {
                Array.from(player.textTracks())
                    .filter(({ kind }) => !['chapters', 'metadata'].includes(kind))
                    .forEach((track) => (track.mode = 'disabled'));
                self.isBrightcove.duration = player.duration();
                self.sendBrightcoveAnalyticsEvent('video_impression', evt);
            });

            player.on('ready', function (evt) {
                self.sendBrightcoveAnalyticsEvent('player_load', evt);
            });

            player.one('play', function () {
                self.isBrightcove.firstPlayRequestTime = Date.now();
            });

            player.on('playing', function (evt) {
                self.sendBrightcoveAnalyticsEvent('play_request', evt);
                self.sendBrightcoveAnalyticsEvent('video_view', evt);
            });

            player.on('timeupdate', function (evt) {
                self.onBrightcoveTimeUpdate(evt);
            });

            player.on('ended', function (evt) {
                self.onBrightcoveTimeUpdate(evt);
            });
        }

        if (self.isAudio || self.isBundle) {
            if (self.isAudio && self.hasImage) {
                player.poster(SBPLUS.assetsPath + 'pages/' + src + '.' + self.imgType);
                const imgPath = `${SBPLUS.assetsPath}pages/${src}.${self.imgType}`;
                const imgAlt = `Content about ${SBPLUS.escapeHTMLAttribute(self.title)}`;
                const imgElement = `<img src="${imgPath}" alt="${imgAlt}"${self.description ? ' aria-describedby="long-description"' : ''} tabindex="0" />`;

                const posterEl = document.querySelector('.vjs-poster');
                if (posterEl) {
                    posterEl.innerHTML = imgElement;
                }
            }

            if (self.isBundle) {
                let srcDuration = 0;
                const pageImage = new Image();

                player.on('loadedmetadata', function () {
                    srcDuration = Math.floor(player.duration());
                });

                player.cuepoints();
                player.addCuepoint({
                    namespace: src + '-1',
                    start: 0,
                    end: self.cuepoints[0],
                    onStart: function () {
                        pageImage.src = SBPLUS.assetsPath + 'pages/' + src + '-1.' + self.imgType;
                        const posterEl = document.querySelector('.vjs-poster');
                        if (posterEl) {
                            posterEl.innerHTML = '<img src=' + pageImage.src + ' />';
                        }
                        player.poster(pageImage.src);
                    },
                    onEnd: function () {},
                    params: '',
                });

                self.cuepoints.forEach(function (_cuepoint, i) {
                    let endCue;

                    if (self.cuepoints[i + 1] === undefined) {
                        endCue = srcDuration;
                    } else {
                        endCue = self.cuepoints[i + 1];
                    }

                    player.addCuepoint({
                        namespace: src + '-' + (i + 2),
                        start: self.cuepoints[i],
                        end: endCue,
                        onStart: function () {
                            pageImage.src = SBPLUS.assetsPath + 'pages/' + src + '-' + (i + 2) + '.' + self.imgType;

                            pageImage.onerror = function () {
                                self.showPageError('NO_IMG', pageImage.src);
                            };

                            const imageEl = document.querySelector('.vjs-poster');
                            const img = document.createElement('img');

                            img.src = pageImage.src;

                            if (imageEl) {
                                imageEl.appendChild(img);
                            }
                            img.style.display = 'none';
                            window.setTimeout(() => {
                                img.style.display = '';
                            }, 250);

                            player.poster(pageImage.src);
                        },
                    });
                });

                player.on('seeking', function () {
                    const posterEl = document.querySelector('.vjs-poster');
                    if (posterEl) {
                        posterEl.innerHTML = '';
                    }

                    if (player.currentTime() <= self.cuepoints[0]) {
                        player.poster(SBPLUS.assetsPath + 'pages/' + src + '-1.' + self.imgType);
                    }
                });
            }

            player.src({ type: 'audio/mp3', src: SBPLUS.assetsPath + 'audio/' + src + '.mp3' });
        }

        if (self.isVideo) {
            player.src({ type: 'video/mp4', src: SBPLUS.assetsPath + 'video/' + src + '.mp4' });
        }

        if (self.isKaltura || self.isBrightcove) {
            if (self.captionUrl.length && player.currentSource().src.includes('.mp4')) {
                self.captionUrl.forEach((caption) => {
                    player.addRemoteTextTrack(
                        {
                            kind: caption.kind,
                            language: caption.language,
                            label: caption.label,
                            src: caption.url,
                        },
                        true,
                    );
                });
            }
        } else {
            if (self.captionUrl) {
                player.addRemoteTextTrack(
                    {
                        kind: 'captions',
                        language: 'en',
                        label: 'English',
                        src: self.captionUrl,
                    },
                    true,
                );
            }
        }

        if (self.isYoutube && self.useDefaultPlayer) {
            const ytCaptionPath = SBPLUS.assetsPath + 'video/yt-' + src + '.vtt';
            headRequest(ytCaptionPath)
                .then(function () {
                    player.addRemoteTextTrack(
                        {
                            kind: 'captions',
                            language: 'en',
                            label: 'English',
                            src: ytCaptionPath,
                        },
                        true,
                    );
                })
                .catch(function () {
                });
        }
        if (options.playbackRates !== null) {
            player.playbackRate(SBPLUS.playbackrate);
        }
        player.on(['waiting', 'pause'], function () {
            self.isPlaying = false;
        });

        player.on('play', function () {
            const mediaMsgEl = document.querySelector(SBPLUS.layout.mediaMsg);
            if (isVisible(mediaMsgEl)) {
                mediaMsgEl.classList.add('hide');
                mediaMsgEl.innerHTML = '';
            }
        });

        player.on('playing', function () {
            self.isPlaying = true;
        });

        player.on('ended', function () {
            self.isPlaying = false;
        });

        player.on('error', function () {
            self.showPageError('NO_MEDIA', player.src());
        });

        player.on('resolutionchange', function () {
            player.playbackRate(SBPLUS.playbackrate);
        });

        player.on('fullscreenchange', () => {
            if (player.isFullscreen()) {
                player.options({ inactivityTimeout: 2000 });
            } else {
                player.options({ inactivityTimeout: 0 });
                const defaultSkinEl = document.querySelector('.video-js.vjs-default-skin');
                if (defaultSkinEl) {
                    defaultSkinEl.classList.remove('vjs-user-inactive');
                }
            }
        });

        player.on('ratechange', function () {
            const rate = this.playbackRate();

            if (SBPLUS.playbackrate !== rate) {
                SBPLUS.playbackrate = rate;
                this.playbackRate(rate);
            }
        });
        if (SBPLUS.hasStorageItem('sbplus-' + SBPLUS.presentationId + '-volume-temp', true)) {
            player.volume(Number(SBPLUS.getStorageItem('sbplus-' + SBPLUS.presentationId + '-volume-temp', true)));
        } else {
            player.volume(Number(SBPLUS.getStorageItem('sbplus-volume')));
        }

        player.on('volumechange', function () {
            SBPLUS.setStorageItem('sbplus-' + SBPLUS.presentationId + '-volume-temp', this.volume(), true);
        });
        if (self.isYoutube === false && player.textTracks().tracks_.length >= 1) {
            if (SBPLUS.hasStorageItem('sbplus-' + SBPLUS.presentationId + '-subtitle-temp', true)) {
                if (SBPLUS.getStorageItem('sbplus-' + SBPLUS.presentationId + '-subtitle-temp', true) === '1') {
                    player.textTracks().tracks_[0].mode = 'showing';
                } else {
                    player.textTracks().tracks_[0].mode = 'disabled';
                }
            } else {
                if (SBPLUS.getStorageItem('sbplus-subtitle') === '1') {
                    player.textTracks().tracks_[0].mode = 'showing';
                } else {
                    player.textTracks().tracks_[0].mode = 'disabled';
                }
            }

            player.textTracks().addEventListener('change', function () {
                const tracks = this.tracks_;

                Array.from(tracks).forEach(function (track) {
                    if (track.mode === 'showing') {
                        SBPLUS.setStorageItem('sbplus-' + SBPLUS.presentationId + '-subtitle-temp', 1, true);
                    } else {
                        SBPLUS.setStorageItem('sbplus-' + SBPLUS.presentationId + '-subtitle-temp', 0, true);
                    }
                });
            });
        }
        addExpandContractButton(player);
        if (Array.isArray(self.markers) && self.markers.length > 0) {
            setupMarkers(player, self.markers);
        }
    });

    const transitionClass = typeof self.transition === 'string' ? self.transition.trim() : '';

    const mpHtml5Api = document.querySelector('#mp_html5_api');
    if (mpHtml5Api) {
        mpHtml5Api.classList.add('animated');
        if (transitionClass) {
            mpHtml5Api.classList.add(transitionClass);
        }
        onAnimationEnd(mpHtml5Api, function () {
            mpHtml5Api.classList.remove('animated');
            if (transitionClass) {
                mpHtml5Api.classList.remove(transitionClass);
            }
        });
    }

    const mpYoutubeApi = document.querySelector('#mp_Youtube_api');
    if (mpYoutubeApi && mpYoutubeApi.parentElement) {
        const parent = mpYoutubeApi.parentElement;
        parent.classList.add('animated');
        if (transitionClass) {
            parent.classList.add(transitionClass);
        }
        onAnimationEnd(parent, function () {
            parent.classList.remove('animated');
            if (transitionClass) {
                parent.classList.remove(transitionClass);
            }
        });
    }
};

/**
 * Populates widget tabs and content based on page-level widget metadata.
 * @returns {void}
 */
Page.prototype.setWidgets = function () {
    const self = this;

    SBPLUS.clearWidgetSegment();

    if (this.type != 'quiz') {
        if (!SBPLUS.isEmpty(this.notes)) {
            SBPLUS.addSegment('Notes');
        }

        if (this.widget.length) {
            const widgetRoot = this.widget && this.widget[0] ? this.widget[0] : this.widget;
            const segments = widgetRoot ? widgetRoot.querySelectorAll('segment') : [];

            segments.forEach(function (segment) {
                const name = segment.getAttribute('name');
                const key = 'sbplus_' + SBPLUS.sanitize(name);

                self.widgetSegments[key] = segment.innerHTML;
                SBPLUS.addSegment(name);
            });
        }

        SBPLUS.selectFirstSegment();
    }
};

/**
 * Resolves widget content for a segment identifier from XML or page data.
 * @param {string} id Widget segment identifier.
 * @returns {string}
 */
Page.prototype.getWidgetContent = function (id) {
    const self = this;

    switch (id) {
        case 'sbplus_notes':
            displayWidgetContent(id, this.notes);

            break;

        default:
            displayWidgetContent(id, self.widgetSegments[id]);

            break;
    }
};
/**
 * Displays a user-facing media error with context for the failed source.
 * @param {string} type Error code used to resolve a localized message.
 * @param {string=} src Optional source URL that failed to load.
 * @returns {void}
 */
Page.prototype.showPageError = function (type, src) {
    src = typeof src !== 'undefined' ? src : '';

    const self = this;

    let msg = '';

    switch (type) {
        case 'NO_IMG':
            msg = '<p><strong>The content for this Storybook Page could not be loaded.</strong></p><p><strong>Expected image:</strong> ' + src + '</p><p>Please try refreshing your browser, or coming back later.</p><p>Contact support if you continue to have issues.</p>';

            break;

        case 'KAL_NOT_AVAILABLE':
            msg = '<p>The manifest file does not specify the Kaltura organization or partner ID. Consequently, Kaltura is unavailable for use throughout the presentation.</p><p><strong>Expected Kaltura video source</strong>: ' + self.src + '</p>';

            break;

        case 'KAL_ENTRY_NOT_READY':
            msg = '<p>The video for this Storybook Page is still processing and could not be loaded at the moment. Please try again later. Contact support if you continue to have issues.</p><p><strong>Expected video source</strong>: Kaltura video ID ' + self.src + '<br><strong>Status</strong>: ';

            msg += getEntryKalturaStatus(self.isKaltura.status.entry) + '</p>';

            break;

        case 'BRIGHTCOVE_NOT_AVAILABLE':
            msg = '<p>The video is still processing or could not be loaded at the moment. Please try again later. Contact support if you continue to have issues.</p><p><strong>Expected video source</strong>: Brightcove video ID # ' + self.src + '<br><strong>Status</strong>: ';

            break;

        case 'NO_MEDIA':
            msg = '<p><strong>The content for this Storybook Page could not be loaded.</strong></p>';

            if (self.hasImage === false) {
                msg += '<p><strong>Expected audio:</strong> ' + src + '<br>';
                msg += '<strong>Expected image:</strong> ' + self.missingImgUrl + '</p>';
            } else {
                msg += '<p><strong>Expected media:</strong> ' + src + '</p>';
            }

            msg += '<p>Please try refreshing your browser, or coming back later.</p><p>Contact support if you continue to have issues.</p>';

            break;

        case 'UNKNOWN_TYPE':
            msg = '<p><strong>UNKNOWN PAGE TYPE</strong></p><p>Page type ("' + src + '") is not supported.</p><p>Contact support if you continue to have issues.</p>';
            break;
    }

    const mediaErrorEl = document.querySelector(self.mediaError);
    if (mediaErrorEl) {
        mediaErrorEl.innerHTML = msg;
        mediaErrorEl.style.display = 'block';
    }
};

/**
 * Sends a Brightcove analytics event to the SB+ telemetry endpoint.
 * @param {string} eventType Analytics event name.
 * @param {Object} evt Event payload from the player callback.
 * @returns {void}
 */
Page.prototype.sendBrightcoveAnalyticsEvent = function (eventType, evt) {
    const self = this;
    const baseURL = 'https://metrics.brightcove.com/tracker/v2/?';
    const time = Date.now();
    const destination = encodeURI(window.location.href);
    const source = encodeURI(document.referrer);

    let urlStr = '';
    urlStr = 'event=' + eventType + '&session=' + self.isBrightcove.session + '&domain=videocloud&account=' + self.isBrightcove.accountId + '&time=' + time + '&destination=' + destination + '&video=' + self.isBrightcove.videoId + '&video_name=' + encodeURI(self.isBrightcove.name);
    if (source !== '' && source != destination) {
        urlStr += '&source=' + source;
    }

    if (eventType === 'video_view') {
        urlStr += '&start_time_ms=' + self.isBrightcove.firstPlayRequestTime;
    }

    if (eventType !== 'player_load') {
        urlStr += '&video_duration=' + self.isBrightcove.duration;
    }
    if (eventType === 'video_engagement') {
        const currentSource = self.mediaPlayer.currentSource();
        urlStr += '&range=' + evt.range + '&rendition_url=' + encodeURI(currentSource.src.split('?')[0]) + '&rendition_mime_type=' + encodeURI(currentSource.type);
    }
    urlStr = baseURL + urlStr;
    sendData(urlStr);

    return;
};

/**
 * Throttles and emits Brightcove engagement metrics during playback.
 * @param {Object} evt Time-update payload containing current playback progress.
 * @returns {void}
 */
Page.prototype.onBrightcoveTimeUpdate = function (evt) {
    const self = this;
    const currentTime = self.mediaPlayer.currentTime();
    const engagementThreshold = 10; // Brightcove engagement events are emitted in 10-second buckets.
    const currentSegment = Math.floor(currentTime / engagementThreshold) * engagementThreshold;
    let range = '';

    if (currentSegment > self.isBrightcove.lastEngagedTime) {
        let endRange = Math.floor(currentTime) + engagementThreshold;

        if (endRange >= self.isBrightcove.duration) {
            endRange = Math.floor(self.isBrightcove.duration);
        }

        range = (Math.floor(currentTime) + '..' + endRange).toString();
        evt.range = range;
        self.sendBrightcoveAnalyticsEvent('video_engagement', evt);
        self.isBrightcove.lastEngagedTime = currentSegment;
    }

    if (evt.type === 'ended') {
        const duration = Math.floor(self.isBrightcove.duration);
        range = (duration + '..' + duration).toString();
        evt.range = range;
        self.sendBrightcoveAnalyticsEvent('video_engagement', evt);
        self.isBrightcove.lastEngagedTime = -1;
    }
};

/**
 * Maps Kaltura API status codes to a status key used by error handling.
 * @param {number|string} code Entry status code returned by Kaltura.
 * @returns {string}
 */
function getEntryKalturaStatus(code) {
    let msg = '';
    switch (code) {
        case -2:
            msg = 'ERROR IMPORTING';
            break;
        case -1:
            msg = 'ERROR CONVERTING';
            break;
        case 0:
            msg = 'IMPORTING';
            break;
        case 1:
            msg = 'PRECONVERT';
            break;
        case 2:
            msg = 'READY';
            break;
        case 3:
            msg = 'DELETED';
            break;
        case 4:
            msg = 'PENDING MODERATION';
            break;
        case 5:
            msg = 'MODERATE';
            break;
        case 6:
            msg = 'BLOCKED';
            break;
        default:
            msg = 'UNKNOWN ERROR (check entry ID)';
            break;
    }
    return msg;
}

/**
 * Adds the expand/contract toggle to the Video.js control bar.
 * @param {Object} vjs Video.js player instance.
 * @returns {void}
 */
function addExpandContractButton(vjs) {
    class ExpandContractButton extends videojs.getComponent('Button') {
        constructor(player, options) {
            super(player, options);
            this.el().setAttribute('aria-label', 'Expand/Contract');
            this.controlText('Expand/Contract');

            if (document.querySelector(SBPLUS.layout.sbplus).classList.contains('sbplus-vjs-expanded')) {
                vjs.addClass('sbplus-vjs-expanded');
            }
        }

        handleClick() {
            if (vjs.hasClass('sbplus-vjs-expanded')) {
                vjs.removeClass('sbplus-vjs-expanded');
                document.querySelector(SBPLUS.layout.sbplus).classList.remove('sbplus-vjs-expanded');
            } else {
                vjs.addClass('sbplus-vjs-expanded');
                document.querySelector(SBPLUS.layout.sbplus).classList.add('sbplus-vjs-expanded');
            }
        }

        buildCSSClass() {
            return 'vjs-expand-contract-button vjs-control vjs-button';
        }
    }

    videojs.registerComponent('ExpandContractButton', ExpandContractButton);
    vjs.getChild('controlBar').addChild('ExpandContractButton', {}, 15);
}

/**
 * Toggles expanded media layout mode for the active page.
 * @param {Event} evt Click event from the expand/contract control.
 * @returns {void}
 */
function toggleExpandContractView(evt) {
    const layout = document.querySelector(SBPLUS.layout.sbplus);

    if (layout.classList.contains('sbplus-vjs-expanded')) {
        evt.target.classList.remove('expanded');
        layout.classList.remove('sbplus-vjs-expanded');
    } else {
        evt.target.classList.add('expanded');
        layout.classList.add('sbplus-vjs-expanded');
    }
}

/**
 * Injects non-media controls (copy, description, transcript) under media content.
 * @param {boolean} [noAudio=false] Hides audio-specific controls when true.
 * @returns {void}
 */
function addSecondaryControls(noAudio = false) {
    noAudio = typeof noAudio !== 'undefined' ? noAudio : false;

    const secondaryControlDiv = document.createElement('div');
    secondaryControlDiv.classList.add('sbplus_secondary_controls');

    if (noAudio) {
        const noAudioLabelEl = document.createElement('div');
        noAudioLabelEl.classList.add('no_audio_label');
        noAudioLabelEl.innerHTML = 'This slide is not narrated.';
        secondaryControlDiv.appendChild(noAudioLabelEl);
    }

    const expandContractBtn = document.createElement('button');
    expandContractBtn.setAttribute('id', 'expand_contract_btn');
    expandContractBtn.setAttribute('title', 'Expand/Contract');
    expandContractBtn.setAttribute('aria-label', 'Expand/Contract');

    secondaryControlDiv.appendChild(expandContractBtn);
    secondaryControlDiv.addEventListener('click', toggleExpandContractView);

    const mediaContentEl = document.querySelector(SBPLUS.layout.mediaContent);
    if (mediaContentEl) {
        mediaContentEl.appendChild(secondaryControlDiv);
    }
}

/**
 * Removes secondary controls previously inserted for a page.
 * @returns {void}
 */
function removeSecondaryControls() {
    const secondaryControlsDiv = document.querySelector('.sbplus_secondary_controls');

    if (secondaryControlsDiv) {
        const expandBtn = document.querySelector('#expand_contract_btn');
        expandBtn.removeEventListener('click', toggleExpandContractView);
    }
}

/**
 * Configures marker plugin data for the active Video.js player.
 * @param {Object} player Video.js player instance.
 * @param {Array<Object>} markers Marker definitions with time and label data.
 * @returns {void}
 */
function setupMarkers(player, markers) {
    if (!Array.isArray(markers) || markers.length === 0) {
        return;
    }

    if (typeof player.markers !== 'function') {
        console.warn('Video.js markers plugin is not loaded; skipping marker setup.');
        return;
    }

    player.markers({
        markers: markers,
    });
}

/**
 * Renders widget HTML into the widget panel for the selected segment.
 * @param {string} id Widget content container id.
 * @param {string} str HTML content to render.
 * @returns {void}
 */
function displayWidgetContent(id, str) {
    const contentEl = document.querySelector(SBPLUS.widget.content);
    if (!contentEl) {
        return;
    }

    contentEl.innerHTML = str;
    contentEl.setAttribute('role', 'tabpanel');
    contentEl.setAttribute('tabindex', '0');
    contentEl.setAttribute('aria-labelledby', id);

    contentEl.querySelectorAll('a').forEach(function (link) {
        link.setAttribute('target', '_blank');
    });
}

/**
 * Converts a time string (hh:mm:ss or seconds) into total seconds.
 * @param {string|number} str Time value to convert.
 * @returns {number}
 */
function toSeconds(str) {
    const arr = str.split(':');

    if (arr.length >= 3) {
        return Number(arr[0] * 60) * 60 + Number(arr[1] * 60) + Number(arr[2]);
    } else {
        return Number(arr[0] * 60) + Number(arr[1]);
    }
}

/**
 * Tests whether a string appears to be an absolute URL.
 * @param {string} s Candidate URL string.
 * @returns {boolean}
 */
function isUrl(s) {
    const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(s);
}

/**
 * Sends analytics data by creating a tracking image request.
 * @param {string} requestURL Fully built analytics request URL.
 * @returns {boolean}
 */
function sendData(requestURL) {
    const scriptElement = document.createElement('img');
    scriptElement.setAttribute('src', requestURL);
    scriptElement.setAttribute('alt', '');
    scriptElement.setAttribute('aria-hidden', 'true');
    scriptElement.style.display = 'none';
    document.getElementsByTagName('body')[0].appendChild(scriptElement);
    return true;
}

export { Page };
