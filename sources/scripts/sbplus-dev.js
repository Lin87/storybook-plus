/**
 * Storybook Plus (SB+)
 *
 * @author: Ethan Lin
 * @url: https://github.com/Lin87/storybook-plus
 * @version: 3.7.0
 * Released xx/xx/2026
 *
 * @license: GNU GENERAL PUBLIC LICENSE v3
 *
    Storybook Plus is an web application that serves multimedia contents.
    Copyright (C) 2013-2026 Ethan Lin. Sponsored by Excelsior University.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
import { fetchResource, headRequest, loadScript, onAnimationEnd, onDelegate, supportsStorage } from './utilities';
import '../sass/sbplus.scss';

// Storybook Plus main object

('use strict');

import { Page } from './page';

const SBPLUS = {
    // Runtime state, configuration, and cached UI selectors.
    loadingScreen: null,
    layout: null,
    splash: null,
    banner: null,
    tableOfContents: null,
    widget: null,
    button: null,
    menu: null,
    screenReader: null,
    presentationId: '',
    logo: 'sources/images/logo.svg',
    totalPages: 0,
    currentPage: null,
    targetPage: null,
    manifest: null,
    xml: null,
    xmlPath: null,
    assetsPath: null,
    downloads: {},
    settings: null,
    hasLocalStorageSupport: supportsStorage('localStorage'),
    hasSessionStorageSupport: supportsStorage('sessionStorage'),
    manifestLoaded: false,
    splashScreenRendered: false,
    presentationRendered: false,
    beforeXMLLoadingDone: false,
    xmlLoaded: false,
    xmlParsed: false,
    gtmLoaded: false,
    presentationStarted: false,
    hasError: false,
    kalturaLoaded: false,
    alreadyResized: false,
    playbackrate: 1,
    version: '3.7.0',
    clickCount: 0,
    randomNum: Math.floor(Math.random() * 6 + 5),
    colorModeMediaQuery: null,
    colorModeChangeHandler: null,

    // Core bootstrapping and presentation lifecycle methods.

    /**
     * The initiating function that sets the HTML classes and IDs to the class
     * variables. Also, getting data from the manifest file.
     */
    go: function () {
        this.layout = {
            isMobile: false,
            html: 'html',
            wrapper: '.sbplus_wrapper',
            sbplus: '#sbplus',
            mainScreen: '#sbplus_main_screen',
            errorScreen: '#sbplus_error_screen',
            widget: '#sbplus_widget',
            contentWrapper: '#sbplus_content_wrapper',
            media: '#sbplus_media_wrapper',
            mediaContent: '#sbplus_media_wrapper .sbplus_media_content',
            mediaError: '#sbplus_media_wrapper .sbplus_media_error',
            mediaMsg: '#sbplus_media_wrapper .sbplus_media_msg',
            mainContentCol: '#sbplus_main_content_col',
            sidebar: '#sbplus_side_content_col',
            pageStatus: '#sbplus_page_status',
            quizContainer: '#sbplus_quiz_wrapper',
            mainControl: '#sbplus_control_bar',
            dwnldMenu: null,
            mainMenu: null,
        };
        this.banner = {
            bar: '#sbplus_banner_bar',
            title: '#sbplus_lesson_title',
            author: '#sbplus_author_name',
        };
        this.splash = {
            cta: '#splash_cta',
            screen: '#sbplus_splash_screen',
            background: '#sb_splash_bg',
            infoBox: '#sbplus_presentation_info',
            title: '#sbplus_presentation_info .sb_title',
            subtitle: '#sbplus_presentation_info .sb_subtitle',
            author: '#sbplus_presentation_info .sb_author',
            duration: '#sbplus_presentation_info .sb_context .sb_duration',
            downloadBar: '#sbplus_presentation_info .sb_context .sb_downloads',
            logo: '#sb_splash_logo',
        };
        this.tableOfContents = {
            container: '#sbplus_table_of_contents_wrapper',
            header: '.section .header',
            page: '.section .list .item',
        };
        this.widget = {
            bar: '#sbplus_widget .widget_controls_bar',
            segment: '#sbplus_widget .widget_controls_bar .tab_segment',
            segments: [],
            content: '#sbplus_widget .segment_content',
        };
        this.button = {
            start: '#sbplus_start_btn',
            resume: '#sbplus_resume_btn',
            notes: '#sbplus_new_note_btn',
            downloadWrapper: '#sbplus_download_btn_wrapper',
            download: '#sbplus_download_btn',
            downloadMenu: '#sbplus_file_list',
            author: '#sbplus_author_name',
            menu: '#sbplus_menu_btn',
            menuClose: '#sbplus_menu_close_btn',
            next: '#sbplus_next_btn',
            prev: '#sbplus_previous_btn',
            mobileTocToggle: '#mobile_toc_toggle_btn',
        };
        this.menu = {
            menuList: '#sbplus_menu_list',
            menuContentList: '#menu_item_content .menu',
            menuBarTitle: '#menu_item_content .sbplus_menu_title_bar .title',
            menuContentWrapper: '#menu_item_content',
            menuContent: '#menu_item_content .content',
            menuSavingMsg: '#save_settings',
            versionContainer: '#sbplus_version',
        };
        this.screenReader = {
            pageStatus: '.sr-page-status',
            currentPage: '.sr-page-status .sr-current-page',
            totalPages: '.sr-page-status .sr-total-pages',
            pageTitle: '.sr-page-status .sr-page-title',
            hasNotes: '.sr-page-status .sr-has-notes',
        };
        this.loadingScreen = {
            wrapper: '#sbplus_loading_screen',
            logo: '#sbplus_loading_screen .program_logo',
        };

        this.applyStorageItems();
        if (this.manifest === null) {
            const self = this;
            const manifestUrl = './sources/manifest.json';

            self.requestFile(manifestUrl, (response) => {
                if (!response) {
                    const wrapperEl = document.querySelector(self.layout.wrapper);

                    if (wrapperEl) {
                        wrapperEl.innerHTML = '<div class="sbplus-core-error"><h1><strong>Storybook Plus Error</strong></h1><p>The manifest.json file may be missing in the app\'s source directory, or it may contains errors.</P></div>';
                    }

                    return;
                }

                self.manifest = JSON.parse(response.responseText);
                self.manifestLoaded = true;
                
                // `unload` is deprecated; use `pagehide` and skip BFCache transitions.
                window.addEventListener('pagehide', function (event) {
                    if (event && event.persisted) {
                        return;
                    }

                    self.removeAllSessionStorage();
                });

                if (self.isEmpty(self.manifest.sbplus_root_directory)) {
                    self.manifest.sbplus_root_directory = 'sources/';
                }

                /** @private Ensure template load is the final step of initialization. */
                self.loadTemplate();
            });
        }
    },

    /**
     * Load Storybook Plus HTML templates from the templates directory
     */
    loadTemplate: function () {
        const self = this;

        if (window.self !== window.top) {
            const wrapperEl = document.querySelector(self.layout.wrapper);

            if (wrapperEl) {
                wrapperEl.classList.add('loaded-in-iframe');
            }
        }

        if (self.manifestLoaded) {
            const templateUrl = self.manifest.sbplus_root_directory + 'scripts/templates/sbplus.tpl';

            fetchResource(templateUrl)
                .then(function (data) {
                    const wrapperEl = document.querySelector(self.layout.wrapper);
                    if (wrapperEl) {
                        wrapperEl.innerHTML = data;
                    }
                    window.addEventListener('resize', self.resize.bind(self));
                    self.beforeXMLLoading();
                    self.loadXML();
                })
                .catch(function () {
                    const wrapperEl = document.querySelector(self.layout.wrapper);
                    if (wrapperEl) {
                        wrapperEl.innerHTML = '<div class="sbplus-core-error"><h1><strong>Storybook Plus Error</strong></h1><p>Failed to load template. Expecting template file located at ' + templateUrl + '.</p></div>';
                    }
                });
        }
    },

    /**
     * Set the copyright info
     */
    setCopyright: function () {
        const self = this;

        if (self.manifestLoaded) {
            const date = new Date();
            const yearEl = document.querySelector('#copyright-footer .copyright-year');
            const noticeEl = document.querySelector('#copyright-footer .notice');

            if (yearEl) {
                yearEl.textContent = date.getFullYear().toString();
            }

            if (noticeEl) {
                noticeEl.innerHTML = self.manifest.sbplus_copyright_notice;
            }
        }
    },

    /**
     * set the default logo
     * @param string - the URL/path to the logo image
     */
    setLogo: function (path) {
        const self = this;

        if (self.isEmpty(path)) {
            return;
        }

        const loadingLogoEl = document.querySelector(self.loadingScreen.logo);

        if (loadingLogoEl) {
            loadingLogoEl.innerHTML = '<img src="' + path + '" />';
        }

        const splashLogo = document.querySelector(self.splash.logo);
        const logo = document.createElement('img');

        logo.src = path;
        logo.alt = '';
        logo.width = '385px';
        logo.height = '87px';
        splashLogo.appendChild(logo);
    },

    /**
     * set the custom accent colors and contrast for UIs
     */
    setAccent: function () {
        const self = this;

        if (!self.isEmpty(self.xml.settings.accent)) {
            const hover = self.colorLum(self.xml.settings.accent, 0.2);
            const textColor = self.colorContrast(self.xml.settings.accent);
            let markerColor = self.colorLum(self.xml.settings.accent, 0.4);
            const accentUrl = self.manifest.sbplus_root_directory + 'scripts/templates/accent-css.tpl';

            if (textColor !== '#000') {
                markerColor = self.colorLum(self.xml.settings.accent, 0.8);
            }

            fetchResource(accentUrl).then((data) => {
                let accentCssModified = data;

                accentCssModified = accentCssModified.replace(/--var-accent/gi, self.xml.settings.accent);
                accentCssModified = accentCssModified.replace(/--var-hover/gi, hover);
                accentCssModified = accentCssModified.replace(/--var-textColor/gi, textColor);
                accentCssModified = accentCssModified.replace(/--var-markerColor/gi, markerColor);

                const headEl = document.head;

                if (headEl) {
                    headEl.insertAdjacentHTML('beforeend', '<style type="text/css">' + accentCssModified + '</style>');
                }
            });
        }
    },

    /**
     * Execute tasks before loading the external XML data
     */
    beforeXMLLoading: function () {
        const self = this;
        if (self.manifestLoaded === true && self.beforeXMLLoadingDone === false) {
            self.setManifestCustomMenu();
            self.xmlPath = self.getXMLPath();

            if (self.xmlPath) {
                if (!self.xmlPath.startsWith(self.manifest.sbplus_default_content_directory)) {
                    if (!self.xmlPath.startsWith('http')) {
                        self.xmlPath = self.manifest.sbplus_default_content_directory + self.xmlPath.replace(/^\/+|\/+$/g, '') + '?_=' + new Date().getTime();
                    }
                }
            } else {
                self.xmlPath = 'assets/sbplus.xml?_=' + new Date().getTime();
            }

            self.assetsPath = self.extractAssetsPath(self.xmlPath);
            self.presentationId = self.sanitize(self.getCourseDirectory());
            self.beforeXMLLoadingDone = true;
        }
    },

    /**
     * Setting up the custom menu items specified in the manifest file
     */
    setManifestCustomMenu: function () {
        const self = this;

        if (self.manifestLoaded) {
            const customMenuItems = self.manifest.sbplus_custom_menu_items;

            if (customMenuItems.length) {
                for (let key in customMenuItems) {
                    const name = customMenuItems[key].name;
                    const sanitizedName = self.sanitize(name);
                    const item = '<li class="menu-item sbplus_' + sanitizedName + '" role="none"><button onclick="SBPLUS.openMenuItem(\'sbplus_' + sanitizedName + '\');" aria-controls="menu_item_content" role="menuitem"><span class="icon-' + sanitizedName + '"></span> ' + name + '</a></li>';
                    const menuListEl = document.querySelector(self.menu.menuList);

                    if (menuListEl) {
                        menuListEl.insertAdjacentHTML('beforeend', item);
                    }
                }
            }

            const menuContentListEl = document.querySelector(self.menu.menuContentList);
            const menuListEl = document.querySelector(self.menu.menuList);

            if (menuContentListEl && menuListEl) {
                menuContentListEl.innerHTML = menuListEl.innerHTML;
            }
        }
    },

    /**
     * Load presentation data from an external XML file
     */
    loadXML: function () {
        if (this.beforeXMLLoadingDone) {
            const self = this;

            fetchResource(self.xmlPath)
                .then(function (data) {
                    self.xmlLoaded = true;
                    self.parseXMLData(data);
                })
                .catch(function (error) {
                    self.hasError = true;

                    if (error && error.type === 'parsererror') {
                        self.showErrorScreen('parser');
                    } else {
                        self.showErrorScreen('xml');
                    }
                });
        }
    },

    /**
     * Parse presentation data from an external XML file
     * @param string - data from reading the XML file
     */
    parseXMLData: function (d) {
        const self = this;

        if (self.xmlLoaded) {
            const doc = d;
            const xSb = doc.querySelector('storybook');
            const xSetup = doc.querySelector('setup');
            let xAccent = xSb ? self.trimAndLower(xSb.getAttribute('accent') || '') : '';
            let xImgType = xSb ? self.trimAndLower(xSb.getAttribute('pageImgFormat') || '') : '';
            let xSplashImgType = 'svg';
            let xMathjax = '';
            let xDownloadableFileName = xSb ? xSb.getAttribute('downloadableFileName') : '';
            let xSplashImg = '';
            let xTitle = self.noScript((xSetup && xSetup.querySelector('title') ? xSetup.querySelector('title').textContent : '').trim());
            let xSubtitle = self.noScript((xSetup && xSetup.querySelector('subtitle') ? xSetup.querySelector('subtitle').textContent : '').trim());
            let xLength = xSetup && xSetup.querySelector('length') ? xSetup.querySelector('length').textContent.trim() : '';
            let xAuthor = xSetup ? xSetup.querySelector('author') : null;
            let xGeneralInfoNode = xSetup ? xSetup.querySelector('generalInfo') : null;
            let xGeneralInfo = xGeneralInfoNode ? self.noScript(self.noCDATA(xGeneralInfoNode.innerHTML || xGeneralInfoNode.textContent || '')) : '';
            let xSections = doc.querySelectorAll('section');
            let splashImgType_temp = xSb ? xSb.getAttribute('splashImgFormat') : '';
            let splashImg_temp = xSetup ? xSetup.getAttribute('splashImg') : '';

            if (splashImgType_temp) {
                if (!self.isEmpty(splashImgType_temp)) {
                    xSplashImgType = self.trimAndLower(splashImgType_temp);
                }
            }

            if (splashImg_temp) {
                xSplashImg = self.trimAndLower(splashImg_temp);
            }

            // XML attributes are optional; fall back to manifest/defaults for stable rendering.
            if (self.isEmpty(xAccent)) {
                xAccent = self.manifest.sbplus_default_accent;
            }

            if (self.isEmpty(xImgType)) {
                xImgType = 'jpg';
            }

            const mathjaxAttr = xSb ? xSb.getAttribute('mathjax') : '';

            if (self.isEmpty(mathjaxAttr)) {
                xMathjax = 'off';
            } else {
                if (self.trimAndLower(mathjaxAttr) === 'on' || self.trimAndLower(mathjaxAttr) === 'true') {
                    xMathjax = 'on';
                }
            }

            self.xml = {
                settings: {
                    accent: xAccent,
                    imgType: xImgType,
                    splashImgType: xSplashImgType,
                    mathjax: xMathjax,
                    downloadableFileName: xDownloadableFileName,
                },
                setup: {
                    splashImg: xSplashImg,
                    title: xTitle,
                    subtitle: xSubtitle,
                    author: xAuthor,
                    authorPhoto: '',
                    duration: xLength,
                    generalInfo: xGeneralInfo,
                },
                sections: xSections,
            };

            self.xmlParsed = true;

            /** @private XML parsing is complete; run dependent setup tasks. */

            self.setLogo(self.logo);

            self.getAuthorProfile();
            self.setAccent();
            self.setCopyright();

            if (self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true') {
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-MML-AM_CHTML').then(function () {
                    MathJax.Hub.Config({
                        'HTML-CSS': {
                            matchFontHeight: true,
                        },
                    });
                });
            }

            if (self.manifest.sbplus_hotjar_site_id != '') {
                const id = Number(self.manifest.sbplus_hotjar_site_id);

                (function (h, o, t, j, a, r) {
                    h.hj =
                        h.hj ||
                        function () {
                            (h.hj.q = h.hj.q || []).push(arguments);
                        };
                    h._hjSettings = { hjid: id, hjsv: 6 };
                    a = o.getElementsByTagName('head')[0];
                    r = o.createElement('script');
                    r.async = 1;
                    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
                    a.appendChild(r);
                })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
            }

            if (self.manifest.sbplus_ga_tracking && !self.isEmpty(self.manifest.sbplus_ga_tracking.measurement_id)) {
                /** @private Load Google Analytics gtag.js script. */
                const head = document.getElementsByTagName('head')[0];
                const gtagScript = document.createElement('script');

                gtagScript.type = 'text/javascript';
                gtagScript.setAttribute('async', true);
                gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + self.manifest.sbplus_ga_tracking.measurement_id;

                head.appendChild(gtagScript);

                /** @private Initialize Google Analytics tracking wrapper. */
                function gtag() {
                    const dataLayer = (window.dataLayer = window.dataLayer || []);
                    dataLayer.push(arguments);
                }

                gtag('js', new Date());
                gtag('config', self.manifest.sbplus_ga_tracking.measurement_id);

                if (!self.isEmpty(self.manifest.sbplus_ga_tracking.gTag_id)) {
                    (function (w, d, s, l, i) {
                        w[l] = w[l] || [];
                        w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
                        var f = d.getElementsByTagName(s)[0],
                            j = d.createElement(s),
                            dl = l != 'dataLayer' ? '&l=' + l : '';
                        j.async = true;
                        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
                        f.parentNode.insertBefore(j, f);
                    })(window, document, 'script', 'dataLayer', self.manifest.sbplus_ga_tracking.gTag_id);

                    const noscript = document.getElementsByTagName('noscript')[0];
                    const gtagIframe = document.createElement('iframe');

                    gtagIframe.src = 'https://www.googletagmanager.com/ns.html?id=' + self.manifest.sbplus_ga_tracking.gTag_id;
                    gtagIframe.width = 0;
                    gtagIframe.height = 0;
                    gtagIframe.style.display = 'none';
                    gtagIframe.style.visibility = 'hidden';

                    noscript.appendChild(gtagIframe);

                    self.gtmLoaded = true;
                }
            }

            /** @private Boot setup complete; splash screen can be rendered. */

            self.renderSplashscreen();

            /** @private Preload slide images to reduce initial page-switch latency. */
            self.preloadPresentationImages();
        }
    },

    /**
     * Set author profile from centralized repo if applicable
     */

    getAuthorProfile: function () {
        const self = this;

        if (self.xmlLoaded && !(self.xml.setup.author instanceof Element)) {
            return;
        }

        if (self.xml.setup.author) {
            const authorName = self.xml.setup.author.getAttribute('name') ? self.xml.setup.author.getAttribute('name').trim() : '';
            const sanitizedAuthor = self.sanitize(authorName);
            const profileUrl = self.manifest.sbplus_author_directory + sanitizedAuthor + '.json';
            const profileInXml = self.noScript(self.noCDATA(self.xml.setup.author.innerHTML || self.xml.setup.author.textContent || ''));

            self.xml.setup.author = authorName;
            self.xml.setup.profile = profileInXml;

            if (self.isEmpty(profileInXml) && !self.isEmpty(self.manifest.sbplus_author_directory) && !self.isEmpty(sanitizedAuthor)) {
                self.requestFile(profileUrl, (response) => {
                    if (response) {
                        const data = JSON.parse(response.responseText);

                        self.xml.setup.author = data.name;
                        self.xml.setup.profile = self.noScript(data.profile);

                        if (self.splashScreenRendered) {
                            const splashAuthorEl = document.querySelector(self.splash.author);

                            if (splashAuthorEl) {
                                splashAuthorEl.innerHTML = self.xml.setup.author;
                            }
                        }
                    }
                });
            }
        }
    },

    // Splash screen rendering and initialization helpers.

    /**
     * Render presentation splash screen
     */
    renderSplashscreen: function () {
        const self = this;

        if (self.xmlParsed === true && self.splashScreenRendered === false) {
            document.title = self.xml.setup.title;
            const splashTitleEl = document.querySelector(self.splash.title);
            const splashSubtitleEl = document.querySelector(self.splash.subtitle);
            const splashAuthorEl = document.querySelector(self.splash.author);
            const splashDurationEl = document.querySelector(self.splash.duration);

            if (splashTitleEl) {
                splashTitleEl.innerHTML = self.xml.setup.title;
            }

            if (splashSubtitleEl) {
                splashSubtitleEl.innerHTML = self.xml.setup.subtitle;
            }

            if (splashAuthorEl) {
                splashAuthorEl.innerHTML = self.xml.setup.author;
            }

            if (splashDurationEl) {
                splashDurationEl.innerHTML = self.xml.setup.duration;
            }

            const startBtn = document.querySelector(self.button.start);

            if (startBtn) {
                startBtn.addEventListener('click', self.startPresentation.bind(self));
            }

            if (self.hasStorageItem('sbplus-' + self.presentationId)) {
                const resumeBtn = document.querySelector(self.button.resume);

                if (resumeBtn) {
                    resumeBtn.addEventListener('click', self.resumePresentation.bind(self));
                }
            } else {
                const resumeBtn = document.querySelector(self.button.resume);

                if (resumeBtn) {
                    resumeBtn.style.display = 'none';
                    resumeBtn.setAttribute('tabindex', '-1');
                }
            }

            self.determineSplashImage();
            self.determineDownloadableFiles();
            self.splashScreenRendered = true;
            self.showSplashScreen();
            self.resize();
            self.scheduleOnlineStatusCheck();

            if (self.gtmLoaded) {
                dataLayer.push({
                    event: 'mediaPlayerLoaded',
                    iframe: window.self !== window.top,
                    referrer: document.referrer,
                    full_url: window.location.href,
                    sb_title: self.xml.setup.title,
                });
            }
        }
    },

    /**
     * Set initial sbplus settings if not already
     */
    applyStorageItems: function () {
        const self = this;

        if (self.hasStorageItem('sbplus-colormode') === false) {
            self.setStorageItem('sbplus-colormode', 'light');
        } else {
            const colorMode = self.getStorageItem('sbplus-colormode');
            self.removeAutoColorModeListener();

            switch (colorMode) {
                case 'dark':
                    document.documentElement.classList.add('dark-mode');
                    break;
                case 'auto':
                    document.documentElement.classList.add('auto-mode');

                    self.applyAutoColorMode();

                    break;
                default:
                    document.documentElement.classList.remove('auto-mode', 'dark-mode');
                    break;
            }
        }

        if (self.hasStorageItem('sbplus-autoplay') === false) {
            self.setStorageItem('sbplus-autoplay', 1);
        }

        if (self.hasStorageItem('sbplus-volume') === false) {
            self.setStorageItem('sbplus-volume', 0.8);
        }

        if (self.hasStorageItem('sbplus-playbackrate') === false) {
            self.setStorageItem('sbplus-playbackrate', 1);
        } else {
            self.playbackrate = self.getStorageItem('sbplus-playbackrate');
        }

        if (self.hasStorageItem('sbplus-subtitle') === false) {
            self.setStorageItem('sbplus-subtitle', 0);
        }

        if (self.getStorageItem('sbplus-autoplay') == '1') {
            const wrapperEl = document.querySelector(self.layout.wrapper);

            if (wrapperEl) {
                wrapperEl.classList.add('sbplus_autoplay_on');
            }
        }
    },

    /**
     * determine the image to load on the splash screen
     */
    determineSplashImage: function () {
        const self = this;
        const splashImgUrl = self.assetsPath + 'splash.' + self.xml.settings.splashImgType;

        self.requestedFileExists(splashImgUrl, (result) => {
            if (result) {
                self.setSplashImage(splashImgUrl);
            } else {
                /** @private Fall back to the configured splash image repository when local splash assets are missing. */
                if (self.isEmpty(self.manifest.sbplus_splash_directory)) {
                    self.setSplashImage('');
                    return;
                }

                if (self.isEmpty(self.xml.setup.splashImg)) {
                    self.setSplashImage('');
                    return;
                }

                const serverSplashImgUrl = self.manifest.sbplus_splash_directory + self.xml.setup.splashImg + '.' + self.xml.settings.splashImgType;

                self.requestedFileExists(serverSplashImgUrl, (serverResult) => {
                    self.setSplashImage(serverResult ? serverSplashImgUrl : '');
                });
            }
        });
    },

    /**
     * Set the splash screen image to the DOM
     * @param string - the URL/path to the splash image file
     */
    setSplashImage: function (str) {
        const self = this;

        if (self.isEmpty(str)) {
            return;
        }

        const img = new Image();

        img.src = str;
        img.addEventListener('load', function () {
            if (img.complete) {
                const splashBgEl = document.querySelector(self.splash.background);

                if (splashBgEl) {
                    splashBgEl.style.backgroundImage = 'url(' + img.src + ')';
                }
            }
        });
    },

    /**
     * Show the splash screen
     */
    showSplashScreen: function () {
        const self = this;

        const splashInfoBoxEl = document.querySelector(self.splash.infoBox);

        if (splashInfoBoxEl) {
            splashInfoBoxEl.style.display = 'block';
        }

        setTimeout(() => {
            const loadingWrapperEl = document.querySelector(self.loadingScreen.wrapper);

            if (loadingWrapperEl) {
                loadingWrapperEl.classList.add('fadeOut');
                onAnimationEnd(loadingWrapperEl, function () {
                    loadingWrapperEl.classList.remove('fadeOut');
                    loadingWrapperEl.style.display = 'none';
                });
            }
        }, 750);
    },

    /**
     * Hide the splash screen. Should be used when starting or resuming.
     */
    hideSplashScreen: function () {
        const self = this;

        if (self.presentationRendered) {
            const splashScreenEl = document.querySelector(self.splash.screen);
            const mainScreenEl = document.querySelector(self.layout.mainScreen);

            if (splashScreenEl) {
                splashScreenEl.classList.add('fadeOut');
                onAnimationEnd(splashScreenEl, function () {
                    splashScreenEl.classList.remove('fadeOut');
                    splashScreenEl.style.display = 'none';

                    if (mainScreenEl) {
                        mainScreenEl.removeAttribute('aria-hidden');
                        mainScreenEl.classList.remove('hide');
                    }
                });
            }
        }
    },

    /**
     * Get and set the downloadable files that are available
     */
    determineDownloadableFiles: function () {
        const self = this;
        let fileName = self.xml.settings.downloadableFileName;

        if (self.isEmpty(fileName)) {
            fileName = self.sanitize(self.xml.setup.title);
        }

        self.manifest.sbplus_download_files.forEach(function (file) {
            const downloadableUrl = self.extractAssetsRoot(self.xmlPath) + fileName + '.' + file.format;

            headRequest(downloadableUrl)
                .then(function () {
                    const fileLabel = file.label.toLowerCase();

                    self.downloads[fileLabel] = { fileName: fileName, fileFormat: file.format, url: downloadableUrl };

                    const downloadBarEl = document.querySelector(self.splash.downloadBar);

                    if (downloadBarEl) {
                        downloadBarEl.insertAdjacentHTML('beforeend', '<a href="' + downloadableUrl + '" download="' + fileName + '.' + file.format + '" aria-label="Download ' + fileLabel + ' file" class="sbplus-download-link"><span class="material-symbols-outlined" aria-hidden="true">download</span> ' + file.label + '</a>');
                    }
                })
                .catch(function () {
                })
                .finally(function () {
                    if (Object.keys(self.downloads).length <= 0) {
                        const splashCtaEl = document.querySelector(self.splash.cta);

                        if (splashCtaEl) {
                            splashCtaEl.classList.add('no_downloads');
                        }
                    }
                });
        });
    },

    /**
     * preload all images used in the presentation if applicable
     */
    preloadPresentationImages: async function () {
        const self = this;

        if (self.isEmpty(self.assetsPath)) {
            return;
        }

        try {
            await self.parseSectionPageSources(self.xml.sections);
        } catch (err) {
            console.warn('Preloading images failed.');
            return err;
        }
    },

    /**
     * parse preload all images used in the presentation
     */
    parseSectionPageSources: function (xmlSections) {
        const self = this;
        return new Promise((resolve, reject) => {
            let srcArray = [];

            Array.from(xmlSections).forEach(function (sectionNode) {
                Array.from(sectionNode.querySelectorAll('page')).forEach(function (pageNode) {
                    const type = pageNode.getAttribute('type');

                    switch (type) {
                        case 'bundle': {
                            const src = pageNode.getAttribute('src');
                            const bundleSrc = [];

                            bundleSrc.push(src + '-' + 1);

                            Array.from(pageNode.querySelectorAll('frame')).forEach(function (_frame, i) {
                                bundleSrc.push(src + '-' + (i + 2));
                            });

                            srcArray = srcArray.concat(bundleSrc);
                            break;
                        }
                        case 'image':
                        case 'image-audio': {
                            const src = pageNode.getAttribute('src');
                            srcArray.push(src);
                            break;
                        }
                        default:
                            break;
                    }
                });
            });

            srcArray = srcArray.filter((value, index) => srcArray.indexOf(value) === index);

            srcArray.forEach(function (name) {
                const imagePath = self.assetsPath + 'pages/' + name + '.' + self.xml.settings.imgType;
                const linkObj = document.createElement('link');

                linkObj.rel = 'prefetch';
                linkObj.href = imagePath;

                document.head.appendChild(linkObj);
            });

            resolve(true);
        });
    },

    /**
     * Start presentation function for the start button
     */
    startPresentation: function () {
        const self = this;

        if (self.presentationStarted === false) {
            self.renderPresentation();
            self.hideSplashScreen();
            self.selectPage('0,0');
            self.presentationStarted = true;
        }
    },

    /**
     * Resume presentation function for the start button
     */
    resumePresentation: function () {
        const self = this;

        if (self.presentationStarted === false) {
            self.renderPresentation();
            self.hideSplashScreen();
            self.selectPage(self.getStorageItem('sbplus-' + self.presentationId));

            window.setTimeout(function () {
                self.updateScroll(self.targetPage);
            }, 1000);

            self.presentationStarted = true;
        }
    },

    /**
     * Render the presentation (after the hiding the splash screen)
     */
    renderPresentation: function () {
        const self = this;

        if (self.presentationRendered === false) {
            document.querySelector(self.layout.sbplus).focus();
            const bannerTitleEl = document.querySelector(self.banner.title);
            const bannerAuthorEl = document.querySelector(self.banner.author);

            if (bannerTitleEl) {
                bannerTitleEl.innerHTML = self.xml.setup.title;
            }

            if (bannerAuthorEl) {
                bannerAuthorEl.innerHTML = self.xml.setup.author;
            }

            const sections = Array.from(self.xml.sections);

            sections.forEach(function (sectionNode, i) {
                let sectionHead = sectionNode.getAttribute('title');
                const pages = Array.from(sectionNode.querySelectorAll('page'));
                let sectionHTML = '<div class="section">';

                // Collapsible section headers are only needed for multi-section presentations.
                if (sections.length >= 2) {
                    if (self.isEmpty(sectionHead)) {
                        sectionHead = 'Section ' + (i + 1);
                    }

                    sectionHTML += '<h3 class="header" >';
                    sectionHTML += '<button class="title" aria-expanded="true" aria-controls="toc-section-' + i + '">';
                    sectionHTML += sectionHead + '<div class="icon" aria-hidden="true"><span class="material-symbols-outlined small" aria-hidden="true">do_not_disturb_on</span></div></button>';
                    sectionHTML += '</h3>';
                }

                sectionHTML += '<ul id="toc-section-' + i + '" class="list" role="tablist">';

                pages.forEach(function (pageNode, j) {
                    ++self.totalPages;

                    const pageType = pageNode.getAttribute('type');
                    const title = pageNode.getAttribute('title');

                    sectionHTML += '<li class="item" data-count="' + self.totalPages + '" data-page="' + i + ',' + j + '" role="presentation">';
                    sectionHTML += '<button role="tab" aria-selected="false" aria-controls="sbplus_main_content_col" aria-label="Slide ' + self.totalPages + ', ' + self.escapeHTMLAttribute(title) + '">';
                    
                    if (pageType === 'quiz') {
                        sectionHTML += '<span class="numbering">' + self.totalPages + '.</span><span class="material-symbols-outlined small" aria-hidden="true">cognition_2</span>';
                    } else {
                        sectionHTML += '<span class="numbering">' + self.totalPages + '.</span>';
                    }

                    sectionHTML += title + '</button></li>';
                });

                sectionHTML += '</ul></div>';

                const tocContainerEl = document.querySelector(self.tableOfContents.container);

                if (tocContainerEl) {
                    tocContainerEl.insertAdjacentHTML('beforeend', sectionHTML);
                }
            });

            const totalStatusEl = document.querySelector(self.layout.pageStatus + ' span.total');
            const totalPagesSrEl = document.querySelector(self.screenReader.totalPages);

            if (totalStatusEl) {
                totalStatusEl.innerHTML = String(self.totalPages);
            }

            if (totalPagesSrEl) {
                totalPagesSrEl.innerHTML = String(self.totalPages);
            }

            if (self.xml.setup.author.length) {
                const authorBtnEl = document.querySelector(self.button.author);

                if (authorBtnEl) {
                    authorBtnEl.addEventListener('click', function () {
                        self.openMenuItem('sbplus_author_profile');
                    });
                }
            } else {
                const authorBtnEl = document.querySelector(self.button.author);

                if (authorBtnEl) {
                    authorBtnEl.disabled = true;
                }

                document.querySelectorAll('.sbplus_author_profile').forEach(function (el) {
                    el.style.display = 'none';
                });
            }

            const nextBtnEl = document.querySelector(self.button.next);
            const prevBtnEl = document.querySelector(self.button.prev);
            const mobileTocToggleEl = document.querySelector(self.button.mobileTocToggle);

            if (nextBtnEl) {
                nextBtnEl.addEventListener('click', self.goToNextPage.bind(self));
            }

            if (prevBtnEl) {
                prevBtnEl.addEventListener('click', self.goToPreviousPage.bind(self));
            }

            if (mobileTocToggleEl) {
                mobileTocToggleEl.addEventListener('click', self.toggleToc.bind(self));
            }

            if (sections.length >= 2) {
                document.querySelectorAll(self.tableOfContents.header).forEach(function (headerEl) {
                    headerEl.addEventListener('click', self.toggleSection.bind(self));
                });
            }

            document.querySelectorAll(self.tableOfContents.page).forEach(function (pageEl) {
                pageEl.addEventListener('click', self.selectPage.bind(self));
            });

            const widgetSegmentEl = document.querySelector(self.widget.segment);

            if (widgetSegmentEl) {
                self.widgetSegmentCleanup = onDelegate(widgetSegmentEl, 'click', 'button', self.selectSegment.bind(self));
            }

            const menuBtnEl = document.querySelector(self.button.menu);

            if (menuBtnEl) {
                menuBtnEl.addEventListener('click', function (e) {
                    const expanded = e.currentTarget.getAttribute('aria-expanded');

                    if (expanded === 'false') {
                        self.openMenu();
                    } else {
                        self.closeMenu();
                    }
                });
            }

            if (self.isEmpty(self.xml.setup.generalInfo)) {
                document.querySelectorAll('.sbplus_general_info').forEach(function (infoEl) {
                    infoEl.style.display = 'none';
                });
            }

            if (Object.keys(self.downloads).length > 0) {
                const downloadBtnEl = document.querySelector(self.button.download);

                if (downloadBtnEl) {
                    downloadBtnEl.addEventListener('click', function (evt) {
                        if (evt.currentTarget.getAttribute('aria-expanded') === 'false') {
                            self.openDownloadMenu();
                        } else {
                            self.closeDownloadMenu();
                        }
                    });
                }

                for (let key in self.downloads) {
                    if (self.downloads[key] != undefined) {
                        const downloadMenuEl = document.querySelector(self.button.downloadMenu);

                        if (downloadMenuEl) {
                            downloadMenuEl.insertAdjacentHTML('beforeend', '<li class="menu-item" role="menuitem"><a download="' + self.downloads[key].fileName + '.' + self.downloads[key].fileFormat + '" href="' + self.downloads[key].url + '" class="sbplus-download-link" aria-label="Download ' + self.escapeHTMLAttribute(key) + ' file">' + self.capitalizeFirstLetter(key) + '</a></li>');
                        }
                    }
                }
            } else {
                const downloadWrapperEl = document.querySelector(self.button.downloadWrapper);

                if (downloadWrapperEl) {
                    downloadWrapperEl.style.display = 'none';
                }
            }

            if (self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true') {
                MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
            }

            const menuButtonEl = document.querySelector('#sbplus_menu_btn');

            if (menuButtonEl) {
                menuButtonEl.addEventListener('click', self.burgerBurger.bind(self));
            }

            document.addEventListener('click', function (evt) {
                const target = evt.target;
                const downloadBtn = document.querySelector(self.button.download);
                const menuBtn = document.querySelector(self.button.menu);

                if (downloadBtn && target && target !== downloadBtn && !downloadBtn.contains(target)) {
                    if (downloadBtn.classList.contains('active')) {
                        self.closeDownloadMenu();
                    }
                }

                if (menuBtn && target && target !== menuBtn && !menuBtn.contains(target)) {
                    if (menuBtn.classList.contains('active')) {
                        self.closeMenu();
                    }
                }
            });

            this.presentationRendered = true;
            self.resize();

            return document.querySelector(self.layout.sbplus);
        }
    },
    
    // Main page-to-page navigation helpers.

    /**
     * Go to next page in the table of contents
     */
    goToNextPage: function () {
        const self = this;
        const currentSelected = document.querySelector('.sb_selected');
        const currentPage = currentSelected ? currentSelected.getAttribute('data-page').split(',') : ['0', '0'];
        let tSection = Number(currentPage[0]);
        let tPage = Number(currentPage[1]);
        const totalSections = self.xml.sections.length;
        const totalPagesInSection = self.xml.sections[tSection].querySelectorAll('page').length;
        
        tPage++;

        if (tPage > totalPagesInSection - 1) {
            tSection++;

            if (tSection > totalSections - 1) {
                tSection = 0;
            }

            tPage = 0;
        }

        self.selectPage(tSection + ',' + tPage);
    },

    /**
     * Go to previous page in the table of contents
     */
    goToPreviousPage: function () {
        const self = this;
        const currentSelected = document.querySelector('.sb_selected');
        const currentPage = currentSelected ? currentSelected.getAttribute('data-page').split(',') : ['0', '0'];
        let tSection = Number(currentPage[0]);
        let tPage = Number(currentPage[1]);

        tPage--;

        if (tPage < 0) {
            tSection--;

            if (tSection < 0) {
                tSection = self.xml.sections.length - 1;
            }

            tPage = self.xml.sections[tSection].querySelectorAll('page').length - 1;
        }

        self.selectPage(tSection + ',' + tPage);
    },

    /**
     * Toggle table of contents in mobile view
     */
    toggleToc: function () {
        const self = this;
        const sbplusWrapper = document.querySelector(self.layout.wrapper);

        if (sbplusWrapper && sbplusWrapper.classList.contains('toc_displayed')) {
            const tocContainerEl = document.querySelector(self.tableOfContents.container);

            if (tocContainerEl) {
                tocContainerEl.style.height = '';
            }

            sbplusWrapper.classList.remove('toc_displayed');
        } else {
            const tocContainerEl = document.querySelector(self.tableOfContents.container);

            if (tocContainerEl) {
                tocContainerEl.style.height = self.calcDynamicHeight() + 'px';
            }

            if (sbplusWrapper) {
                sbplusWrapper.classList.add('toc_displayed');
            }
        }
    },

    /**
     * Calculate the table of content height dynamically
     */
    calcDynamicHeight: function () {
        const self = this;
        const bannerEl = document.querySelector(self.banner.bar);
        const mediaEl = document.querySelector(self.layout.media);
        const controlEl = document.querySelector(self.layout.mainControl);
        const bannerHeight = bannerEl ? bannerEl.getBoundingClientRect().height : 0;
        const mediaHeight = mediaEl ? mediaEl.getBoundingClientRect().height : 0;
        const controlHeight = controlEl ? controlEl.getBoundingClientRect().height : 0;
        return window.innerHeight - (bannerHeight + mediaHeight + controlHeight);
    },

    /**
     * Update Page Status (or the status bar) next to the page controls
     */
    updatePageStatus: function (num) {
        const self = this;
        const currentEl = document.querySelector(self.layout.pageStatus + ' span.current');

        if (currentEl) {
            currentEl.innerHTML = String(num);
        }
    },

    // Main menu display and interaction handlers.
    openMenu: function () {
        const menuBtn = document.querySelector(this.button.menu);
        const menuList = document.querySelector(this.menu.menuList);

        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', 'true');
            menuBtn.classList.add('active');
        }

        if (menuList) {
            menuList.classList.add('active');
        }
    },

    closeMenu: function () {
        const menuBtn = document.querySelector(this.button.menu);
        const menuList = document.querySelector(this.menu.menuList);

        if (menuBtn) {
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.classList.remove('active');
        }

        if (menuList) {
            menuList.classList.remove('active');
        }
    },

    openDownloadMenu: function () {
        const downloadBtn = document.querySelector(this.button.download);
        const downloadMenuList = document.querySelector(this.button.downloadMenu);

        if (downloadBtn) {
            downloadBtn.setAttribute('aria-expanded', 'true');
            downloadBtn.classList.add('active');
        }

        if (downloadMenuList) {
            downloadMenuList.removeAttribute('aria-hidden');
            downloadMenuList.style.display = 'block';
        }
    },

    closeDownloadMenu: function () {
        const downloadBtn = document.querySelector(this.button.download);
        const downloadMenuList = document.querySelector(this.button.downloadMenu);

        if (downloadBtn) {
            downloadBtn.setAttribute('aria-expanded', 'false');
            downloadBtn.classList.remove('active');
        }

        if (downloadMenuList) {
            downloadMenuList.setAttribute('aria-hidden', 'true');
            downloadMenuList.style.display = 'none';
        }
    },

    /**
     * open a menu item under the menu
     * @param string
     */
    openMenuItem: function (id) {
        const self = this;

        if (self.currentPage.mediaPlayer != null) {
            if (!self.currentPage.mediaPlayer.paused()) {
                self.currentPage.mediaPlayer.pause();
            }
        }

        const itemId = id;
        let content = '';

        const sbplusBanner = document.querySelector(self.banner.bar);
        const sbplusContentWrapper = document.querySelector(self.layout.contentWrapper);
        const menuContentWrapper = document.querySelector(self.menu.menuContentWrapper);
        const menuContent = document.querySelector(self.menu.menuContent);
        const menuTitle = document.querySelector(self.menu.menuBarTitle);

        if (menuContent) {
            menuContent.innerHTML = '';
        }

        self.closeMenu();

        if (menuContentWrapper) {
            menuContentWrapper.removeAttribute('aria-hidden');
            menuContentWrapper.style.display = 'block';
        }

        const menuCloseBtnForFocus = document.querySelector(self.button.menuClose);

        if (menuCloseBtnForFocus) {
            menuCloseBtnForFocus.focus();
        } else if (menuContent) {
            menuContent.focus();
        }

        if (sbplusBanner) {
            sbplusBanner.setAttribute('aria-hidden', 'true');
            sbplusBanner.style.display = 'none';
        }

        if (sbplusContentWrapper) {
            sbplusContentWrapper.setAttribute('aria-hidden', 'true');
            sbplusContentWrapper.style.display = 'none';
        }

        document.querySelectorAll(self.menu.menuContentList + ' li').forEach((itemEl) => itemEl.classList.remove('active'));
        document.querySelectorAll(self.menu.menuContentList + ' .' + itemId).forEach((itemEl) => itemEl.classList.add('active'));
        document.querySelectorAll(self.menu.menuContentList + ' li button').forEach((btnEl) => btnEl.removeAttribute('aria-current'));
        document.querySelectorAll(self.menu.menuContentList + ' .' + itemId + ' button ').forEach((btnEl) => btnEl.setAttribute('aria-current', 'true'));

        switch (itemId) {
            case 'sbplus_author_profile':
                if (menuTitle) {
                    menuTitle.innerHTML = 'Author Profile';
                }

                if (self.xml.setup.author.length) {
                    if (menuContent) {
                        menuContent.insertAdjacentHTML('beforeend', '<div class="profileImg"></div>');
                    }

                    const author = self.xml.setup.author;
                    const sanitizedAuthor = self.sanitize(author);

                    const photoUrl = self.assetsPath + sanitizedAuthor + '.jpg';

                    headRequest(photoUrl)
                        .then(function () {
                            const profileImgEl = document.querySelector('.profileImg');

                            if (profileImgEl) {
                                profileImgEl.innerHTML = '<img src="' + photoUrl + '" alt="Photo of ' + author + '" crossorigin="Anonymous" />';
                            }
                        })
                        .catch(function () {
                            if (!self.isEmpty(self.manifest.sbplus_author_directory)) {
                                const fallbackPhotoUrl = self.manifest.sbplus_author_directory + sanitizedAuthor + '.jpg';

                                headRequest(fallbackPhotoUrl)
                                    .then(function () {
                                        const profileImgEl = document.querySelector('.profileImg');

                                        if (profileImgEl) {
                                            profileImgEl.innerHTML = '<img src="' + fallbackPhotoUrl + '" alt="Photo of ' + author + '" crossorigin="Anonymous" />';
                                        }
                                    })
                                    .catch(function () {
                                    });
                            }
                        });

                    content = '<p class="name">' + self.xml.setup.author + '</p>';
                    content += self.noScript(self.xml.setup.profile);
                } else {
                    content = 'No author profile available.';
                }

                break;

            case 'sbplus_general_info':
                if (menuTitle) {
                    menuTitle.innerHTML = 'General Info';
                }

                if (self.isEmpty(self.xml.setup.generalInfo)) {
                    content = 'No general information available.';
                } else {
                    content = self.xml.setup.generalInfo;
                }

                break;

            case 'sbplus_settings':
                if (menuTitle) {
                    menuTitle.innerHTML = 'Settings';
                }

                if (self.hasLocalStorageSupport && self.hasSessionStorageSupport) {
                    if (self.hasStorageItem('sbplus-' + self.presentationId + '-settings-loaded', true) === false) {
                        fetchResource(self.manifest.sbplus_root_directory + 'scripts/templates/settings.tpl').then(function (data) {
                            self.settings = data;
                            self.setStorageItem('sbplus-' + self.presentationId + '-settings-loaded', 1, true);

                            if (menuContent) {
                                menuContent.insertAdjacentHTML('beforeend', data);
                            }

                            self.afterSettingsLoaded();
                            const versionEl = document.querySelector(self.menu.versionContainer);

                            if (versionEl) {
                                versionEl.innerHTML = 'version ' + self.version;
                            }
                        });
                    } else {
                        if (menuContent) {
                            menuContent.insertAdjacentHTML('beforeend', self.settings);
                        }

                        const versionEl = document.querySelector(self.menu.versionContainer);

                        if (versionEl) {
                            versionEl.innerHTML = 'version ' + self.version;
                        }

                        self.afterSettingsLoaded();
                    }
                } else {
                    content = "Settings require web browser's local storage and session storage support. ";
                    content += 'Your web browser does not support local and session storage or is in private mode.';
                }

                break;

            default:
                const customMenuItems = self.manifest.sbplus_custom_menu_items;

                for (let key in customMenuItems) {
                    const menuId = 'sbplus_' + self.sanitize(customMenuItems[key].name);

                    if (itemId === menuId) {
                        if (menuTitle) {
                            menuTitle.textContent = customMenuItems[key].name;
                        }

                        content = self.noScript(String(customMenuItems[key].content || ''));
                        break;
                    }
                }
                break;
        }

        if (menuContentWrapper) {
            menuContentWrapper.removeAttribute('aria-hidden');
            menuContentWrapper.style.display = 'block';
        }

        if (menuContent) {
            menuContent.insertAdjacentHTML('beforeend', content);
        }

        document.querySelector(self.menu.menuContent).focus();

        const menuCloseBtnEl = document.querySelector(self.button.menuClose);

        if (menuCloseBtnEl) {
            menuCloseBtnEl.addEventListener('click', self.closeMenuContent.bind(self));
        }

        if (self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true') {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
        }
    },

    /**
     * Close the menu and its content
     */
    closeMenuContent: function () {
        const self = this;
        const sbplusBanner = document.querySelector(self.banner.bar);
        const sbplusContentWrapper = document.querySelector(self.layout.contentWrapper);
        const menuContentWrapper = document.querySelector(self.menu.menuContentWrapper);
        const menuContent = document.querySelector(self.menu.menuContent);

        if (menuContent) {
            menuContent.innerHTML = '';
        }

        if (menuContentWrapper) {
            menuContentWrapper.setAttribute('aria-hidden', 'true');
            menuContentWrapper.style.display = 'none';
        }

        if (sbplusBanner) {
            sbplusBanner.removeAttribute('aria-hidden');
            sbplusBanner.style.display = 'flex';
        }

        if (sbplusContentWrapper) {
            sbplusContentWrapper.removeAttribute('aria-hidden');
            sbplusContentWrapper.style.display = 'flex';
        }

        const menuBtnEl = document.querySelector(self.button.menu);

        if (menuBtnEl) {
            menuBtnEl.focus();
        }

        const menuCloseBtnEl = document.querySelector(this.button.menuClose);

        if (menuCloseBtnEl) {
            const clone = menuCloseBtnEl.cloneNode(true);
            menuCloseBtnEl.parentNode.replaceChild(clone, menuCloseBtnEl);
        }
    },

    /**
     * an easter egg to change the menu icon to a hamburger emoji
     */
    burgerBurger: function () {
        const self = this;
        const menuIcon = document.querySelector('span.menu-icon');

        self.clickCount++;

        if (self.clickCount === self.randomNum) {
            if (menuIcon) {
                menuIcon.classList.remove('icon-menu');
                menuIcon.innerHTML = '🍔';
            }

            self.clickCount = 0;
            self.randomNum = Math.floor(Math.random() * 6 + 5);
        } else {
            if (menuIcon) {
                menuIcon.classList.add('icon-menu');
                menuIcon.innerHTML = '';
            }
        }
    },
    
    // Table-of-contents and sidebar navigation helpers.

    /**
     * Toggling table of content sections
     * @param any
     */
    toggleSection: function (el) {
        const self = this;
        const headers = document.querySelectorAll(this.tableOfContents.header);
        const totalHeaderCount = headers.length;

        if (totalHeaderCount > 1) {
            let targetSectionHeader;

            // Supports both event-driven calls and numeric index calls from internal code.
            if (el instanceof Object) {
                targetSectionHeader = el.currentTarget;
            } else {
                if (Number(el) > totalHeaderCount - 1) {
                    return false;
                }

                targetSectionHeader = headers[Number(el)];
            }

            const targetList = targetSectionHeader ? targetSectionHeader.nextElementSibling : null;
            const isVisible = !!(targetList && (targetList.offsetWidth || targetList.offsetHeight || targetList.getClientRects().length));

            if (isVisible) {
                self.closeSection(targetSectionHeader);
            } else {
                self.openSection(targetSectionHeader);
            }
        }
    },

    /**
     * Close specified table of content section
     * @param object
     */
    closeSection: function (obj) {
        const target = obj ? obj.nextElementSibling : null;
        const icon = obj ? obj.querySelector('.icon') : null;
        const titleBtn = obj ? obj.querySelector('button.title') : null;

        if (titleBtn) {
            titleBtn.setAttribute('aria-expanded', 'false');
        }

        if (target) {
            target.style.display = 'none';
        }

        if (icon) {
            icon.innerHTML = '<span class="material-symbols-outlined small" aria-hidden="false">add_circle</span>';
        }
    },

    /**
     * Open specified table of content section
     * @param object
     */
    openSection: function (obj) {
        const target = obj ? obj.nextElementSibling : null;
        const icon = obj ? obj.querySelector('.icon') : null;
        const titleBtn = obj ? obj.querySelector('button.title') : null;

        if (titleBtn) {
            titleBtn.setAttribute('aria-expanded', 'true');
        }

        if (target) {
            target.style.display = '';
        }

        if (icon) {
            icon.innerHTML = '<span class="material-symbols-outlined small" aria-hidden="false">do_not_disturb_on</span>';
        }
    },

    /**
     * Selecting page on the table of contents
     * @param any
     */
    selectPage: function (el) {
        const self = this;

        if (el instanceof Object) {
            self.targetPage = el.currentTarget;
        } else {
            self.targetPage = document.querySelector('.item[data-page="' + el + '"]');

            if (!self.targetPage) {
                return false;
            }
        }

        if (!self.targetPage.classList.contains('sb_selected')) {
            const allPages = Array.from(document.querySelectorAll(self.tableOfContents.page));
            const sectionHeaders = Array.from(document.querySelectorAll(self.tableOfContents.header));

            if (sectionHeaders.length > 1) {
                const targetHeader = self.targetPage.parentElement ? self.targetPage.parentElement.previousElementSibling : null;

                if (targetHeader && !targetHeader.classList.contains('current')) {
                    sectionHeaders.forEach((headerEl) => headerEl.classList.remove('current'));
                    targetHeader.classList.add('current');
                }

                // Ensure the active page is not hidden inside a collapsed section.
                self.openSection(targetHeader);
            }

            allPages.forEach((pageEl) => {
                pageEl.classList.remove('sb_selected');
                const btn = pageEl.querySelector('button');

                if (btn) {
                    btn.setAttribute('aria-selected', 'false');
                }
            });

            self.targetPage.classList.add('sb_selected');
            const selectedBtn = self.targetPage.querySelector('button');

            if (selectedBtn) {
                selectedBtn.setAttribute('aria-selected', 'true');
            }

            self.getPage(self.targetPage.getAttribute('data-page'));
            self.updatePageStatus(self.targetPage.getAttribute('data-count'));
            const srCurrentPage = document.querySelector(self.screenReader.currentPage);

            if (srCurrentPage) {
                srCurrentPage.innerHTML = self.targetPage.getAttribute('data-count');
            }

            const sidebarEl = document.querySelector(self.layout.sidebar);

            if (sidebarEl && (sidebarEl.offsetWidth || sidebarEl.offsetHeight || sidebarEl.getClientRects().length)) {
                self.updateScroll(self.targetPage);
            }

            const wrapperEl = document.querySelector(self.layout.wrapper);

            if (wrapperEl && wrapperEl.classList.contains('toc_displayed')) {
                self.toggleToc();
            }
        }
    },

    /**
     * Getting page after selected a page
     * @param string
     */
    getPage: function (page) {
        const self = this;

        // Local helper avoids repeated null guards while normalizing XML attributes.
        const getAttrTrim = function (node, name, fallback = '') {
            if (!node || !node.getAttribute) {
                return fallback;
            }

            const value = node.getAttribute(name);

            if (value === null || value === undefined) {
                return fallback;
            }

            return String(value).trim();
        };

        page = page.split(',');

        const section = page[0];
        const item = page[1];
        const pageNodes = self.xml.sections[section].querySelectorAll('page');
        const target = pageNodes[item];

        if (!target) {
            return;
        }

        const pageData = {
            xml: [target],
            title: getAttrTrim(target, 'title', ''),
            type: getAttrTrim(target, 'type', '').toLowerCase(),
        };

        pageData.number = page;

        if (pageData.type !== 'quiz') {
            pageData.src = getAttrTrim(target, 'src', '');

            if (target.getAttribute('preventAutoplay') != undefined) {
                pageData.preventAutoplay = getAttrTrim(target, 'preventAutoplay', 'false');
            } else {
                pageData.preventAutoplay = 'false';
            }

            if (target.getAttribute('useDefaultPlayer') !== undefined) {
                pageData.useDefaultPlayer = getAttrTrim(target, 'useDefaultPlayer', 'true');
            } else {
                pageData.useDefaultPlayer = 'true';
            }

            // Fullscreen toggle applies only to player-backed media types.
            if (pageData.type == 'brightcove' || pageData.type == 'kaltura' || pageData.type == 'video' || (pageData.type == 'youtube' && pageData.useDefaultPlayer == 'true')) {
                if (target.getAttribute('disableFullscreen') != undefined) {
                    pageData.disableFullscreen = getAttrTrim(target, 'disableFullscreen', 'false');
                } else {
                    pageData.disableFullscreen = 'false';
                }
            }

            if (target.querySelectorAll('note').length) {
                const noteNode = target.querySelector('note');
                pageData.notes = noteNode ? self.noScript(self.noCDATA(noteNode.innerHTML || noteNode.textContent || '')) : '';
            }

            pageData.widget = target.querySelectorAll('widget');

            if (target.querySelectorAll('copyableContent').length) {
                pageData.copyableContent = target.querySelectorAll('copyableContent');
            }

            if (target.querySelectorAll('description').length) {
                pageData.description = target.querySelectorAll('description');
            }

            pageData.frames = target.querySelectorAll('frame');
            pageData.imageFormat = self.xml.settings.imgType;
            pageData.transition = target.hasAttribute('transition') ? getAttrTrim(target, 'transition', '') : '';

            if (pageData.type !== 'image') {
                pageData.markers = target.querySelectorAll('markers');
            }

            self.currentPage = new Page(pageData);
        } else {
            self.currentPage = new Page(pageData, target);
        }

        self.currentPage.getPageMedia();

        const pageTitleEl = document.querySelector(self.screenReader.pageTitle);

        if (pageTitleEl) {
            pageTitleEl.innerHTML = pageData.title;
        }
    },

    /**
     * Updating the table of content's scroll bar position
     * @param object
     */
    updateScroll: function (obj) {
        const self = this;
        const scrollOption = { behavior: 'smooth', block: 'nearest', inline: 'start' };
        let target = obj;

        if (!(target.offsetWidth || target.offsetHeight || target.getClientRects().length)) {
            target = target.parentElement ? target.parentElement.previousElementSibling : target;
        }

        // First page needs special handling so the section header remains visible after scroll.
        if (target && target.getAttribute && target.getAttribute('data-page') == '0,0') {
            if (target.parentElement && target.parentElement.previousElementSibling) {
                target.parentElement.previousElementSibling.scrollIntoView(scrollOption);
            } else {
                target.scrollIntoView(scrollOption);
            }

            return;
        }

        const tocContainerEl = document.querySelector(self.tableOfContents.container);
        const scrollHeight = tocContainerEl ? tocContainerEl.getBoundingClientRect().height : 0;
        const targetHeight = target.getBoundingClientRect().height;
        const sectionHeaders = document.querySelectorAll(self.tableOfContents.header);
        let targetTop = target.getBoundingClientRect().top + window.scrollY - targetHeight;

        if (sectionHeaders.length <= 0) {
            targetTop += 40;
        }

        if (targetTop > scrollHeight) {
            target.scrollIntoView(scrollOption);
        }

        if (targetTop < targetHeight) {
            target.scrollIntoView(scrollOption);
        }
    },

    // Widget tab lifecycle and content rendering helpers.

    /**
     * clear the widget area
     */
    clearWidget: function () {
        const self = this;
        const widgetSegmentEl = document.querySelector(self.widget.segment);
        const widgetContentEl = document.querySelector(self.widget.content);

        if (widgetSegmentEl) {
            widgetSegmentEl.innerHTML = '';
        }

        if (widgetContentEl) {
            widgetContentEl.innerHTML = '';
        }
    },

    /**
     * determine if the widget has content
     */
    hasWidgetContent: function () {
        const self = this;
        const widgetSegmentEl = document.querySelector(self.widget.segment);

        return widgetSegmentEl ? widgetSegmentEl.querySelectorAll('button').length : 0;
    },

    /**
     * select the tabs in the widget area
     * @param any
     */
    selectSegment: function (el) {
        const self = this;
        const buttons = Array.from(document.querySelectorAll(self.widget.segment + ' button'));
        const widgetLayoutEl = document.querySelector(self.layout.widget);
        const widgetContentEl = document.querySelector(self.widget.content);
        const srHasNotesEl = document.querySelector(self.screenReader.hasNotes);
        const notesBtnEl = document.querySelector(self.button.notes);

        if (self.hasWidgetContent()) {
            if (widgetLayoutEl) {
                widgetLayoutEl.classList.remove('noSegments');
                widgetLayoutEl.removeAttribute('aria-hidden');
            }

            if (widgetContentEl) {
                widgetContentEl.style.backgroundImage = '';
                widgetContentEl.removeAttribute('aria-hidden');
            }

            if (srHasNotesEl) {
                srHasNotesEl.innerHTML = 'This slide contains notes.';
            }

            if (notesBtnEl) {
                notesBtnEl.disabled = false;
                notesBtnEl.setAttribute('title', 'View Notes');
                notesBtnEl.setAttribute('aria-label', 'View Notes');
            }

            if (notesBtnEl) {
                notesBtnEl.onclick = function () {
                    const secControlExpandedBtn = document.querySelector('#expand_contract_btn');

                    if (secControlExpandedBtn && secControlExpandedBtn.classList.contains('expanded')) {
                        secControlExpandedBtn.classList.remove('expanded');
                    }

                    if (self.currentPage.mediaPlayer && self.currentPage.mediaPlayer.hasClass('sbplus-vjs-expanded')) {
                        self.currentPage.mediaPlayer.removeClass('sbplus-vjs-expanded');
                    }

                    document.querySelector(self.layout.sbplus).classList.remove('sbplus-vjs-expanded');
                };
            }

            let target = null;
            let targetId = '';

            if (typeof el === 'string') {
                target = document.getElementById(el);
                targetId = el;
            } else {
                target = el.target.closest('button');
                targetId = target.id;
            }

            if (target && !target.classList.contains('active')) {
                self.currentPage.getWidgetContent(targetId);
                buttons.forEach((buttonEl) => {
                    buttonEl.classList.remove('active');
                    buttonEl.setAttribute('aria-selected', 'false');
                });
                target.classList.add('active');
                target.setAttribute('aria-selected', 'true');
            }

            if (self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true') {
                MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
            }

        } else {
            if (srHasNotesEl) {
                srHasNotesEl.innerHTML = '';
            }

            if (widgetLayoutEl) {
                widgetLayoutEl.classList.add('noSegments');
                widgetLayoutEl.setAttribute('aria-hidden', 'true');
            }

            if (notesBtnEl) {
                notesBtnEl.disabled = true;
                notesBtnEl.setAttribute('title', '');
                notesBtnEl.setAttribute('aria-label', '');
            }

            if (widgetContentEl) {
                widgetContentEl.setAttribute('aria-hidden', 'true');
                widgetContentEl.removeAttribute('aria-labelledby');
                widgetContentEl.removeAttribute('tabindex');
                widgetContentEl.removeAttribute('role');
            }

            if (!self.isEmpty(self.logo)) {
                if (widgetContentEl) {
                    widgetContentEl.style.backgroundImage = 'url(' + self.logo + ')';
                }
            }
        }
    },

    /**
     * select the first tab in the widget area
     */
    selectFirstSegment: function () {
        const self = this;
        const button = document.querySelector(self.widget.segment + ' button');
        const target = button ? button.getAttribute('id') : '';

        if (target) {
            self.selectSegment(target);
        } else {
            self.selectSegment('');
        }
    },

    /**
     * add a tab to the widget area
     * @param string
     */
    addSegment: function (str) {
        const self = this;
        const btn = '<button role="tab" id="sbplus_' + self.sanitize(str) + '" aria-controls="widget_content" aria-selected="false">' + str + '</button>';

        self.widget.segments.push(str);

        if (str === 'Notes') {
            const segmentEl = document.querySelector(self.widget.segment);

            if (segmentEl) {
                segmentEl.insertAdjacentHTML('afterbegin', btn);
            }
        } else {
            const segmentEl = document.querySelector(self.widget.segment);

            if (segmentEl) {
                segmentEl.insertAdjacentHTML('beforeend', btn);
            }
        }
    },

    /**
     * clear all tabs and their content
     */
    clearWidgetSegment: function () {
        const self = this;
        const widgetSegmentEl = document.querySelector(self.widget.segment);
        const widgetContentEl = document.querySelector(self.widget.content);
        const widgetBgEl = document.querySelector(self.widget.bg);

        if (widgetSegmentEl) {
            widgetSegmentEl.innerHTML = '';
        }

        if (widgetContentEl) {
            widgetContentEl.innerHTML = '';
        }

        if (widgetBgEl) {
            widgetBgEl.style.backgroundImage = '';
        }

        self.widget.segments = [];
    },
    
    // Shared utility methods used by SBPLUS modules.

    /**
     * get and read file
     * @param string - the URL/path to the file
     * @param callback - callback function
     */
    requestFile(url, callback) {
        const request = new XMLHttpRequest();

        request.open('GET', url + '?_=' + new Date().getTime(), true);

        request.onload = function () {
            callback(this.status >= 200 && this.status < 400 ? this : null);
            request.abort();
        };

        request.onerror = function () {
            callback(null);
        };

        request.send();
    },

    /**
     * check if file existing by requesting the HEAD
     * @param string - the URL/path to the file
     * @param callback - callback function
     */
    requestedFileExists(url, callback) {
        const request = new XMLHttpRequest();

        request.open('HEAD', url + '?_=' + new Date().getTime(), true);

        request.onload = function () {
            callback(this.status >= 200 && this.status < 400 ? true : false);
            request.abort();
        };

        request.onerror = function () {
            callback(false);
        };

        request.send();
    },

    /**
     * show the error message screen based on error type
     * (visually covered up the presentation)
     * @param string
     */
    showErrorScreen: function (type) {
        const self = this;

        if (self.hasError && type.length) {
            let errorTemplateUrl = self.manifest.sbplus_root_directory;

            const sbplusEl = document.querySelector(self.layout.sbplus);

            if (sbplusEl) {
                sbplusEl.style.display = 'none';
            }

            switch (type) {
                case 'xml':
                    errorTemplateUrl += 'scripts/templates/xml_error.tpl';
                    break;

                case 'parser':
                    errorTemplateUrl += 'scripts/templates/xml_parse_error.tpl';
                    break;

                default:
                    errorTemplateUrl = '';
                    break;
            }

            if (errorTemplateUrl.length) {
                fetchResource(errorTemplateUrl).then(function (data) {
                    const errorScreenEl = document.querySelector(self.layout.errorScreen);

                    if (errorScreenEl) {
                        errorScreenEl.innerHTML = data;
                        errorScreenEl.style.display = 'flex';
                    }
                });
            }
        }
    },

    /**
     * calculate the height of the player
     */
    calcLayout: function () {
        const self = this;

        const wrapperEl = document.querySelector(self.layout.wrapper);
        const tocContainerEl = document.querySelector(self.tableOfContents.container);

        if (wrapperEl && wrapperEl.classList.contains('toc_displayed')) {
            if (tocContainerEl) {
                tocContainerEl.style.height = self.calcDynamicHeight() + 'px';
            }
        }

        if (window.innerWidth < 900 || window.screen.width <= 414) {
            self.layout.isMobile = true;
            self.alreadyResized = true;

            if (wrapperEl) {
                wrapperEl.classList.remove('sbplus_boxed');
            }
        } else {
            self.layout.isMobile = false;

            if (wrapperEl) {
                wrapperEl.classList.add('sbplus_boxed');
                wrapperEl.classList.remove('toc_displayed');
            }

            if (tocContainerEl) {
                tocContainerEl.style.height = '';
            }
        }
        if (window.innerWidth >= 600 && window.innerWidth <= 899 && window.innerHeight <= 586) {
            if (tocContainerEl) {
                tocContainerEl.classList.add('popout');
            }
        } else {
            if (tocContainerEl) {
                tocContainerEl.classList.remove('popout');
            }
        }
    },

    /**
     * resize the player layout; alias for calcLayout function
     */
    resize: function () {
        const self = this;
        self.calcLayout();
    },

    /**
     * get the sbplus.xml URL/path form the query parameter
     */
    getXMLPath: function () {
        const self = this;
        const presentationParam = 'p';

        if (URLSearchParams) {
            const urlParams = new URLSearchParams(window.location.search);
            const presentation = urlParams.get(presentationParam);

            if (presentation) {
                return self.isXMLFile(presentation) ? presentation : undefined;
            }
        } else {

            const query = windows.location.search.substring(1);
            const vars = query.split('&');

            for (let i = 0; i < vars.length; i++) {
                const pair = vars[i].split('=');

                if (pair[0] === presentationParam) {
                    return self.isXMLFile(decodeURIComponent(pair[1])) ? decodeURIComponent(pair[1]) : undefined;
                }
            }
        }

        return undefined;
    },

    /**
     * determine if the XML URL/path ends with sbplus.xml
     * @param string - the path or URL to the sbplus.xml file
     */
    isXMLFile: function (path) {
        return path.endsWith('sbplus.xml');
    },

    /**
     * extract the path to the assets directory from the XML URL
     * @param string - the path or URL to the sbplus.xml file
     */
    extractAssetsPath: function (path) {
        const parts = path.split('/');

        parts.pop();

        return parts.join('/') + '/';
    },

    /**
     * extract the path to the root directory containing the assets directory from the XML URL
     * @param string - the path or URL to the sbplus.xml file
     */
    extractAssetsRoot: function (path) {
        const parts = path.split('/');

        if (parts.length <= 2) {
            return '';
        }

        parts.pop();
        parts.pop();

        return parts.join('/') + '/';
    },

    /**
     * get the course or root directory name
     */
    getCourseDirectory: function () {
        const self = this;

        if (!self.assetsPath.startsWith('http')) {
            return 'sbplus';
        }

        const parts = this.assetsPath.split('/');

        if (parts.length <= 2) {
            return 'sbplus';
        }

        parts.pop();
        parts.pop();

        return parts[parts.length - 1];
    },

    /**
     * clean the string to be web friendly
     * @param string
     */
    sanitize: function (str) {
        // Keep IDs/selectors predictable by stripping non-word characters.
        return str.replace(/[^\w.]/gi, '').toLowerCase();
    },

    /**
     * Capitalize the first letter of a word
     * @param string
     */
    capitalizeFirstLetter: function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * trim empty space before and after a string and set it to lowercase
     * @param string
     */
    trimAndLower: function (str) {
        return str.trim().toLowerCase();
    },

    /**
     * check if a string is empty
     * @param string
     */
    isEmpty: function (str) {
        return str === undefined || str === null || !str.trim() || str.trim().length === 0;
    },

    /**
     * escape string to be HTML attribute safe
     * @param string
     */
    escapeHTMLAttribute(str) {
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    /**
     * get the color highlight based on the parameters
     * @param string - the hexadecimal
     * @param number - the luminosity rate between 0 to 1
     */
    colorLum: function (hex, lum) {
        hex = String(hex).replace(/[^0-9a-f]/gi, '');

        // Expand shorthand colors (e.g. "abc") to full six-digit hex.
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        lum = lum || 0;
        let rgb = '#',
            c,
            i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
            c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
            rgb += ('00' + c).substring(c.length);
        }

        return rgb;
    },

    /**
     * get the color contrast for text colors based on the parameter
     * @param string - the hexadecimal
     */
    colorContrast: function (hex) {
        hex = hex.replace('#', '');

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;

        return yiq >= 128 ? '#000' : '#fff';
    },

    /**
     * remove script tag in string value
     * @param string
     */
    noScript: function (str) {
        if (str === undefined || str === null) {
            return '';
        }

        const container = document.createElement('span');
        container.innerHTML = String(str).trim();
        container.querySelectorAll('script,noscript,style').forEach((node) => node.remove());
        container.querySelectorAll('*').forEach((el) => {
            Array.from(el.attributes).forEach((attr) => {
                const name = attr.name.toLowerCase();
                const value = attr.value ? attr.value.trim().toLowerCase() : '';

                // Block inline handlers like onclick=... regardless of quoting/spacing.
                if (name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                    return;
                }

                if (
                    (name === 'href' || name === 'src' || name === 'xlink:href') &&
                    value.startsWith('javascript:')
                ) {
                    el.removeAttribute(attr.name);
                    return;
                }

                if (name === 'srcdoc') {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return container.innerHTML;
    },

    /**
     * remove CDATA from string value in XML
     * @param string
     */
    noCDATA: function (str) {
        if (str === undefined || str === '') {
            return '';
        }

        return str
            .replace(/<!\[CDATA\[/g, '')
            .replace(/\]\]>/g, '')
            .trim();
    },

    /**
     * convert hexadecimal to RGB value
     * @param string - the hexadecimal
     */
    hexToRgb: function (hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : null;
    },

    /**
     * remove empty items from an array
     * @param array
     */
    removeEmptyElements: function (array) {
        let found = false;

        for (let i = 0; i < array.length; i++) {
            if (self.isEmpty(array[i])) {
                found = true;
            }

            if (array[i].match(/^[0-9]+$/m)) {
                found = true;
            }

            if (found) {
                array.splice(i, 1);
                found = false;
            }
        }

        return array;
    },

    /**
     * set setting values to the local or session storage
     * @param string - key
     * @param string - value
     * @param boolean - `true` for session storage; `false` for local storage
     */
    setStorageItem: function (key, value, toSession) {
        if (toSession) {
            if (this.hasSessionStorageSupport) {
                return sessionStorage.setItem(key, value);
            }

            return;
        }

        if (this.hasLocalStorageSupport) {
            return localStorage.setItem(key, value);
        }
    },

    /**
     * get setting values from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     */
    getStorageItem: function (key, fromSession) {
        if (fromSession) {
            if (this.hasSessionStorageSupport) {
                return sessionStorage.getItem(key);
            }

            return;
        }

        if (this.hasLocalStorageSupport) {
            return localStorage.getItem(key);
        }
    },

    /**
     * delete setting values from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     */
    deleteStorageItem: function (key, fromSession) {
        if (fromSession) {
            if (this.hasSessionStorageSupport) {
                return sessionStorage.removeItem(key);
            }

            return;
        }

        if (this.hasLocalStorageSupport) {
            return localStorage.removeItem(key);
        }
    },

    /**
     * check for setting value existence from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     */
    hasStorageItem: function (key, fromSession) {
        const self = this;

        if (fromSession) {
            if (!self.hasSessionStorageSupport) {
                return false;
            }

            if (self.isEmpty(sessionStorage.getItem(key))) {
                return false;
            }

            return true;
        }

        if (!self.hasLocalStorageSupport) {
            return false;
        }

        if (self.isEmpty(localStorage.getItem(key))) {
            return false;
        }

        return true;
    },

    /**
     * delete all settings value in local and session storage
     */
    removeAllSessionStorage: function () {
        if (this.hasSessionStorageSupport) {
            return sessionStorage.clear();
        }
    },

    /**
     * decode strings that contain HTML/XMl tags
     * also remove any script tags and CDATA
     * @param object
     */
    getTextContent: function (obj) {
        const self = this;
        let str = obj.html();

        if (str === undefined) {
            if (!self.isEmpty(obj[0].textContent)) {
                const div = document.createElement('div');
                div.appendChild(obj[0]);

                const fcNodePatternOpen = new RegExp('<' + div.firstChild.nodeName + '?\\s*([A-Za-z]*=")*[A-Za-z\\s]*"*>', 'gi');
                const fcNodePatternClose = new RegExp('</' + div.firstChild.nodeName + '>', 'gi');

                str = div.innerHTML;

                str = str.replace(fcNodePatternOpen, '').replace(fcNodePatternClose, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
            } else {
                return '';
            }
        }

        return self.noScript(self.noCDATA(str));
    },

    /**
     * determine if it is on a web browser in mobile device
     */
    isMobileDevice: function () {
        return navigator.userAgentData ? /iOS|Android/.test(navigator.userAgentData.platform) : /iPad|iPhone|iPod|Android/.test(navigator.platform);
    },

    /**
     * save settings to the local and session storages
     */
    afterSettingsLoaded: function () {
        const self = this;

        if (self.getStorageItem('sbplus-' + self.presentationId + '-settings-loaded', true) === '1') {
            if (self.isMobileDevice()) {
                const autoplayLabel = document.querySelector('#autoplay_label');
                const autoplayToggle = document.querySelector('#sbplus_va_autoplay');

                if (autoplayLabel) {
                    autoplayLabel.insertAdjacentHTML('afterend', '<p class="error">Mobile devices do not support autoplay.</p>');
                }

                if (autoplayToggle) {
                    autoplayToggle.checked = false;
                    autoplayToggle.setAttribute('disabled', 'true');
                }
            }

            self.syncSettings();

            document.querySelectorAll('.settings input, .settings select').forEach(function (inputEl) {
                inputEl.addEventListener('change', function () {
                    const savingMsgEl = document.querySelector(self.menu.menuSavingMsg);

                    if (savingMsgEl) {
                        savingMsgEl.style.display = '';
                        savingMsgEl.innerHTML = 'Saving...';
                    }

                    window.matchMedia('(prefers-color-scheme: dark)').off;

                    const selectedColorMode = document.querySelector('input[name="sbplus_color_mode"]:checked');

                    if (selectedColorMode) {
                        const mode = selectedColorMode.value;

                        self.setStorageItem('sbplus-colormode', mode);
                        self.removeAutoColorModeListener();

                        switch (mode) {
                            case 'dark':
                                document.documentElement.classList.add('dark-mode');
                                document.documentElement.classList.remove('auto-mode');
                                break;
                            case 'auto':
                                document.documentElement.classList.add('auto-mode');

                                self.applyAutoColorMode();
                                break;
                            default:
                                document.documentElement.classList.remove('auto-mode', 'dark-mode');
                                break;
                        }
                    } else {
                        self.setStorageItem('sbplus-colormode', 'light');
                    }

                    const autoplayEl = document.querySelector('#sbplus_va_autoplay');

                    if (autoplayEl && autoplayEl.checked) {
                        self.setStorageItem('sbplus-autoplay', 1);
                        const wrapperEl = document.querySelector(self.layout.wrapper);

                        if (wrapperEl) {
                            wrapperEl.classList.add('sbplus_autoplay_on');
                        }
                    } else {
                        self.setStorageItem('sbplus-autoplay', 0);
                        const wrapperEl = document.querySelector(self.layout.wrapper);

                        if (wrapperEl) {
                            wrapperEl.classList.remove('sbplus_autoplay_on');
                        }
                    }

                    const subtitleEl = document.querySelector('#sbplus_va_subtitle');

                    if (subtitleEl && subtitleEl.checked) {
                        self.setStorageItem('sbplus-subtitle', 1);
                    } else {
                        self.setStorageItem('sbplus-subtitle', 0);
                    }

                    const volumeEl = document.querySelector('#sbplus_va_volume');
                    let vol = volumeEl ? volumeEl.value : 0;
                    let volError = false;

                    if (vol < 0 || vol > 100 || self.isEmpty(vol)) {
                        volError = true;
                        vol = Number(self.getStorageItem('sbplus-volume')) * 100;
                    } else {
                        self.setStorageItem('sbplus-volume', vol / 100);
                        self.setStorageItem('sbplus-' + self.presentationId + '-volume-temp', vol / 100, true);
                    }

                    if (volError) {
                        const volumeLabel = document.querySelector('#volume_label');

                        if (volumeLabel) {
                            volumeLabel.insertAdjacentHTML('afterend', '<p class="error">Value must be between 0 and 100.</p>');
                        }
                    } else {
                        const volumeLabel = document.querySelector('#volume_label');
                        const nextEl = volumeLabel ? volumeLabel.nextElementSibling : null;

                        if (nextEl && nextEl.classList.contains('error')) {
                            nextEl.remove();
                        }
                    }

                    const playbackRateEl = document.querySelector('#sbplus_va_playbackrate');
                    self.setStorageItem('sbplus-playbackrate', playbackRateEl ? playbackRateEl.value : '1');
                    self.setStorageItem('sbplus-' + self.presentationId + '-playbackrate-temp', playbackRateEl ? playbackRateEl.value : '1', true);

                    if (savingMsgEl) {
                        savingMsgEl.innerHTML = 'Settings saved!';
                    }

                    setTimeout(function () {
                        if (savingMsgEl) {
                            savingMsgEl.style.display = 'none';
                            savingMsgEl.innerHTML = '';
                        }
                    }, 1500);
                });
            });
        }
    },

    /**
     * apply auto mode to toggle system default color mode
     */
    removeAutoColorModeListener: function () {
        const self = this;

        if (!self.colorModeMediaQuery || !self.colorModeChangeHandler) {
            return;
        }

        if (typeof self.colorModeMediaQuery.removeEventListener === 'function') {
            self.colorModeMediaQuery.removeEventListener('change', self.colorModeChangeHandler);
        } else if (typeof self.colorModeMediaQuery.removeListener === 'function') {
            self.colorModeMediaQuery.removeListener(self.colorModeChangeHandler);
        }

        self.colorModeMediaQuery = null;
        self.colorModeChangeHandler = null;
    },

    /**
     * apply auto mode to toggle system default color mode
     */
    applyAutoColorMode: function () {
        const self = this;

        if (!window.matchMedia) {
            return;
        }

        const colorModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        self.removeAutoColorModeListener();

        const syncDarkMode = (isDark) => {
            if (isDark) {
                document.documentElement.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
            }
        };

        syncDarkMode(colorModeMediaQuery.matches);

        const onColorModeChange = (event) => {
            syncDarkMode(event.matches);
        };

        if (typeof colorModeMediaQuery.addEventListener === 'function') {
            colorModeMediaQuery.addEventListener('change', onColorModeChange);
        } else if (typeof colorModeMediaQuery.addListener === 'function') {
            colorModeMediaQuery.addListener(onColorModeChange);
        }

        self.colorModeMediaQuery = colorModeMediaQuery;
        self.colorModeChangeHandler = onColorModeChange;
    },

    /**
     * load saved settings from the local and session storages
     */
    syncSettings: function () {
        const self = this;

        if (self.getStorageItem('sbplus-' + self.presentationId + '-settings-loaded', true) === '1') {
            const colorMode = self.getStorageItem('sbplus-colormode');

            switch (colorMode) {
                case 'dark':
                    const darkModeEl = document.querySelector('#dark_color_mode');

                    if (darkModeEl) darkModeEl.checked = true;
                    break;
                case 'auto':
                    const autoModeEl = document.querySelector('#auto_color_mode');

                    if (autoModeEl) autoModeEl.checked = true;
                    break;
                default:
                    const lightModeEl = document.querySelector('#light_color_mode');

                    if (lightModeEl) lightModeEl.checked = true;
                    break;
            }
            const autoplayVal = self.getStorageItem('sbplus-autoplay');

            if (self.isMobileDevice() === false) {
                if (autoplayVal === '1') {
                    const autoplayEl = document.querySelector('#sbplus_va_autoplay');

                    if (autoplayEl) autoplayEl.checked = true;
                } else {
                    const autoplayEl = document.querySelector('#sbplus_va_autoplay');

                    if (autoplayEl) autoplayEl.checked = false;
                }
            }

            const volumeVal = self.getStorageItem('sbplus-volume');
            const volumeEl = document.querySelector('#sbplus_va_volume');

            if (volumeEl) {
                volumeEl.value = volumeVal * 100;
            }

            const playbackRateVal = self.getStorageItem('sbplus-playbackrate');
            const playbackRateEl = document.querySelector('#sbplus_va_playbackrate');

            if (playbackRateEl) {
                playbackRateEl.value = playbackRateVal;
            }

            const subtitleVal = self.getStorageItem('sbplus-subtitle');

            if (subtitleVal === '1') {
                const subtitleEl = document.querySelector('#sbplus_va_subtitle');

                if (subtitleEl) subtitleEl.checked = true;
            } else {
                const subtitleEl = document.querySelector('#sbplus_va_subtitle');
                
                if (subtitleEl) subtitleEl.checked = false;
            }
        }
    },

    /**
     * Show an message if the user has not network/Internet connectivity
     */
    showConnectionMessage: function () {
        const self = this;
        const sbplusEl = document.querySelector(self.layout.sbplus);

        if (sbplusEl && !sbplusEl.contains(document.querySelector('#connection_error_msg'))) {
            const messageEl = document.createElement('div');

            messageEl.setAttribute('id', 'connection_error_msg');
            messageEl.innerHTML = '<strong>No Internet Connection.</strong> Please check your network connection.';
            sbplusEl.appendChild(messageEl);
        }
    },

    /**
     * hide the message if the user has network/Internet connectivity
     */
    hideConnectionMessage: function () {
        const self = this;
        const sbplusEl = document.querySelector(self.layout.sbplus);

        if (sbplusEl && sbplusEl.contains(document.querySelector('#connection_error_msg'))) {
            sbplusEl.removeChild(document.querySelector('#connection_error_msg'));
        }
    },

    /**
     * hold the network/Internet connectivity status by pinging the index file
     */
    checkOnlineStatus: async () => {
        try {
            const online = await fetch('index.html' + '?_=' + new Date().getTime(), { method: 'HEAD' });
            return online.status >= 200 && online.status < 300;
        } catch (err) {
            return false;
        }
    },

    /**
     * schedule network/Internet connectivity status check by pinging
     * the index.html HEAD every 3 minutes
     */
    scheduleOnlineStatusCheck: async function () {
        const online = await SBPLUS.checkOnlineStatus();

        if (online) {
            SBPLUS.hideConnectionMessage();
        } else {
            SBPLUS.showConnectionMessage();
        }

        setTimeout(SBPLUS.scheduleOnlineStatusCheck, 3 * 60 * 1000);
    },
};

export { SBPLUS };

// Initialize SBPLUS once the DOM is ready.

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        window.SBPLUS = SBPLUS;
        SBPLUS.go();
    });
} else {
    window.SBPLUS = SBPLUS;
    SBPLUS.go();
}
