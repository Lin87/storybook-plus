/*
 * Storybook Plus (SB+)
 *
 * @author: Ethan Lin
 * @url: https://github.com/Lin87/storybook-plus
 * @version: 3.6.4
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
import { fetchResource, headRequest, loadScript, onAnimationEnd, onDelegate } from "./utilities";
import "../sass/sbplus.scss";

/*******************************************************************************
    STORYBOOK PLUS MAIN OBJECT CLASS
*******************************************************************************/
'use strict';

import { Page } from "./page";

function supportsStorage( storageType ) {
    try {
        const storage = window[storageType];
        const key = "__sbplus_storage_test__";
        storage.setItem( key, key );
        storage.removeItem( key );
        return true;
    } catch ( error ) {
        return false;
    }
}

const SBPLUS = {
    
    /***************************************************************************
        VARIABLE / CONSTANT / OBJECT DECLARATIONS
    ***************************************************************************/
    
    // holds the HTML structure classes and IDs
    loadingScreen: null,
    layout: null,
    splash: null,
    banner: null,
    tableOfContents: null,
    widget: null,
    button: null,
    menu : null,
    screenReader: null,
    presentationId: '',
    logo: 'sources/images/logo.svg',
    
    // holds current and total pages in the presentation
    totalPages: 0,
    currentPage: null,
    targetPage: null,
    
    // holds external data
    manifest: null,
    xml: null,
    xmlPath: null,
    assetsPath: null,
    downloads: {},
    settings: null,
    
    // status flags
    hasLocalStorageSupport: supportsStorage( "localStorage" ),
    hasSessionStorageSupport: supportsStorage( "sessionStorage" ),
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
    
    // videojs
    playbackrate: 1,

    // version number
    version: '3.6.4',
    
    // easter egg variables
    clickCount: 0,
    randomNum: Math.floor((Math.random() * 6) + 5),
    
    /***************************************************************************
        CORE FUNCTIONS
    ***************************************************************************/
    
    /**
     * The initiating function that sets the HTML classes and IDs to the class
     * variables. Also, getting data from the manifest file.
     **/
    go: function() {
        
        // set general HTML layout classes and IDs
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
            mainMenu: null
        };
        
        // set HTML banner classes and IDs
        this.banner = {
            bar: '#sbplus_banner_bar',
            title: '#sbplus_lesson_title',
            author: '#sbplus_author_name'
        };
        
        // set HTML splashscreen classes and IDs
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
            logo: '#sb_splash_logo'
        };
        
        // set HTML table of contents classes and IDs
        this.tableOfContents = {
            container: '#sbplus_table_of_contents_wrapper',
            header: '.section .header',
            page: '.section .list .item'
        };
        
        // set HTML widget classes and IDs
        this.widget = {
            bar: '#sbplus_widget .widget_controls_bar',
            segment: '#sbplus_widget .widget_controls_bar .tab_segment',
            segments: [],
            content: '#sbplus_widget .segment_content'
        };
        
        // set HTML button classes and IDs
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
            mobileTocToggle: '#mobile_toc_toggle_btn'
        };
        
        // set HTML menu classes and IDs
        this.menu = {
            menuList: '#sbplus_menu_list',
            menuContentList: '#menu_item_content .menu',
            menuBarTitle: '#menu_item_content .sbplus_menu_title_bar .title',
            menuContentWrapper: '#menu_item_content',
            menuContent: '#menu_item_content .content',
            menuSavingMsg: '#save_settings',
            versionContainer: '#sbplus_version'
        };
        
        // set screen reader classes and IDs
        this.screenReader = {
            pageStatus: '.sr-page-status',
            currentPage: '.sr-page-status .sr-current-page',
            totalPages: '.sr-page-status .sr-total-pages',
            pageTitle: '.sr-page-status .sr-page-title',
            hasNotes: '.sr-page-status .sr-has-notes'
        };

        // set loading screen id
        this.loadingScreen = {
            wrapper: '#sbplus_loading_screen',
            logo: '#sbplus_loading_screen .program_logo'
        }

        this.applyStorageItems(); // set player initial settings to the local storage

        // get manifest data if not set
        if ( this.manifest === null ) {
            
            const self = this;
            const manifestUrl = "./sources/manifest.json";
            
            self.requestFile( manifestUrl, response => {

                if ( !response ) {

                    // display the error message to the HTML page
                    const wrapperEl = document.querySelector( self.layout.wrapper );
                    if ( wrapperEl ) {
                        wrapperEl.innerHTML = "<div class=\"sbplus-core-error\"><h1><strong>Storybook Plus Error</strong></h1><p>The manifest.json file may be missing in the app\'s source directory, or it may contains errors.</P></div>";
                    }
                    return;

                }
                
                // set the JSON data to the class manifest object
                self.manifest = JSON.parse( response.responseText );
                self.manifestLoaded = true;

                // set an event listener to unload all session storage on HTML
                // page refresh/reload or closing
                window.addEventListener( 'unload', self.removeAllSessionStorage.bind( self ) );
                
                if ( self.isEmpty( self.manifest.sbplus_root_directory ) ) {
                    self.manifest.sbplus_root_directory = 'sources/';
                }

                // call the loadTemplate function to load Storybook Plus's HTML structures
                /* !! SHOULD BE THE LAST THING TO BE CALLED IN THIS BLOCK!! */
                self.loadTemplate();
                
            } );
            
        }

    }, // end go function

    /**
     * Load Storybook Plus HTML templates from the templates directory
     **/
    loadTemplate: function() {
        
        const self = this;

        // add loaded-in-iframe class if loaded in an iframe
        if ( window.self !== window.top ) {
            const wrapperEl = document.querySelector( self.layout.wrapper );
            if ( wrapperEl ) {
                wrapperEl.classList.add( 'loaded-in-iframe' );
            }
        }
        
        if ( self.manifestLoaded ) {
            
            // set the template URL for the sbplus.tpl file
            const templateUrl = self.manifest.sbplus_root_directory + 'scripts/templates/sbplus.tpl';
            
            // AJAX call and load the sbplus.tpl template
            fetchResource( templateUrl ).then( function( data ) {
                
                // output the template date to the HTML/DOM
                const wrapperEl = document.querySelector( self.layout.wrapper );
                if ( wrapperEl ) {
                    wrapperEl.innerHTML = data;
                }
                
                // set an event listener to resize elements on viewport resize
                window.addEventListener( 'resize', self.resize.bind( self ) );

                // execute tasks before loading external XML data
                self.beforeXMLLoading();
                
                // load the data from the external XML file
                self.loadXML();
                
            } ).catch( function() { // when fail to load the template
                
                // display the error message to the HTML page
                const wrapperEl = document.querySelector( self.layout.wrapper );
                if ( wrapperEl ) {
                    wrapperEl.innerHTML = "<div class=\"sbplus-core-error\"><h1><strong>Storybook Plus Error</strong></h1><p>Failed to load template. Expecting template file located at " + templateUrl + ".</p></div>";
                }
                
            } );
            
        }
        
    }, // end loadTemplate function
    
    /**
     * Set the copyright info
     **/
     setCopyright: function() {
         
        const self = this;
        
        if ( self.manifestLoaded ) {
            
            // set copyright date
            const date = new Date();
            const yearEl = document.querySelector( '#copyright-footer .copyright-year' );
            const noticeEl = document.querySelector( '#copyright-footer .notice' );
            if ( yearEl ) {
                yearEl.textContent = date.getFullYear().toString();
            }
            if ( noticeEl ) {
                noticeEl.innerHTML = self.manifest.sbplus_copyright_notice;
            }
            
        }
         
     }, // end set copyright function

    /**
     * set the default logo
     * @param string - the URL/path to the logo image
     **/
    setLogo: function( path ) {

        const self = this;

        if ( self.isEmpty( path ) ) {
            return;
        }

        // set logo on the loading screen
        const loadingLogoEl = document.querySelector( self.loadingScreen.logo );
        if ( loadingLogoEl ) {
            loadingLogoEl.innerHTML = '<img src="' + path + '" />';
        }

        // set logo on splash screen
        const splashLogo = document.querySelector( self.splash.logo );
        const logo = document.createElement( 'img' );
        
        logo.src = path;
        logo.alt = "";
        logo.width = "385px";
        logo.height = "87px";
        splashLogo.appendChild( logo );

    },

    /**
     * set the custom accent colors and contrast for UIs
     **/
    setAccent: function() {

        const self = this;

        if ( !self.isEmpty( self.xml.settings.accent ) ) {

            const hover = self.colorLum( self.xml.settings.accent, 0.2 ); // set hover color hex value
            const textColor = self.colorContrast( self.xml.settings.accent ); // set the text color hex value
            let markerColor = self.colorLum( self.xml.settings.accent, 0.4 ); // video marker color
            const accentUrl = self.manifest.sbplus_root_directory + "scripts/templates/accent-css.tpl";

            if ( textColor !== "#000" ) {
                markerColor = self.colorLum( self.xml.settings.accent, 0.8 );
            }

            fetchResource( accentUrl ).then( ( data ) => {

                let accentCssModified = data;

                accentCssModified = accentCssModified.replace( /--var-accent/gi, self.xml.settings.accent );
                accentCssModified = accentCssModified.replace( /--var-hover/gi, hover );
                accentCssModified = accentCssModified.replace( /--var-textColor/gi, textColor );
                accentCssModified = accentCssModified.replace( /--var-markerColor/gi, markerColor );

                // append the style/css to the HTML head
                const headEl = document.head;
                if ( headEl ) {
                    headEl.insertAdjacentHTML( 'beforeend', '<style type="text/css">' + accentCssModified + "</style>" );
                }

            } );

        }

    },
    
    /**
     * Execute tasks before loading the external XML data
     **/
    beforeXMLLoading: function() {

        const self = this;
        
        // if manifest and template are loaded and XML was never loaded before
        if ( self.manifestLoaded === true && self.beforeXMLLoadingDone === false ) {
            
            // setup custom menu items specified in the manifest file
            self.setManifestCustomMenu();

            // parse and set the XML and asset path
            self.xmlPath = self.getXMLPath();

            if ( self.xmlPath ) {

                if ( !self.xmlPath.startsWith( self.manifest.sbplus_default_content_directory ) ) {

                    if ( !self.xmlPath.startsWith( 'http' ) ) {
                        self.xmlPath = self.manifest.sbplus_default_content_directory + self.xmlPath.replace(/^\/+|\/+$/g, '') + "?_=" + new Date().getTime();
                    }
                    
                }

            } else {

                self.xmlPath = 'assets/sbplus.xml?_=' + new Date().getTime();

            }

            self.assetsPath = self.extractAssetsPath( self.xmlPath );
            self.presentationId = self.sanitize( self.getCourseDirectory() ); // set the presentation id
            
            // set flag to true
            self.beforeXMLLoadingDone = true;
            
        }
        
    }, // end beforeXMLLoading function
    
    /**
     * Setting up the custom menu items specified in the manifest file
     **/
    setManifestCustomMenu: function() {
        
        const self = this;

        if ( self.manifestLoaded ) {
            
            // set the menu item(s) data from the manifest
            const customMenuItems = self.manifest.sbplus_custom_menu_items;
            
            // if data is exists...
            if ( customMenuItems.length ) {
                
                // loop through the data
                for ( let key in customMenuItems ) {
                    
                    // set the menu item name
                    const name = customMenuItems[key].name;
                    
                    // clean and reformat the name
                    const sanitizedName = self.sanitize( name );
                    
                    // set the HTML LI tag
                    const item = '<li class="menu-item sbplus_' + sanitizedName + '" role="none"><button onclick="SBPLUS.openMenuItem(\'sbplus_' + sanitizedName + '\');" aria-controls="menu_item_content" role="menuitem"><span class="icon-' + sanitizedName + '"></span> ' + name + '</a></li>';
                    
                    // append the HTML LI tag to the menu list
                    const menuListEl = document.querySelector( self.menu.menuList );
                    if ( menuListEl ) {
                        menuListEl.insertAdjacentHTML( 'beforeend', item );
                    }
                    
                }
                
            }
            
            // append/display the menu list to inner menu list
            const menuContentListEl = document.querySelector( self.menu.menuContentList );
            const menuListEl = document.querySelector( self.menu.menuList );
            if ( menuContentListEl && menuListEl ) {
                menuContentListEl.innerHTML = menuListEl.innerHTML;
            }
            
        }
        
    }, // end setManifestCustomMenu function
    
    /**
     * Load presentation data from an external XML file
     **/
    loadXML: function() {
        
        if ( this.beforeXMLLoadingDone ) {
            
            const self = this;
            
            // set the path to the XML file
            // const xmlUrl = 'assets/sbplus.xml?_=' + new Date().getTime();

            // AJAX call to the XML file
            fetchResource( self.xmlPath ).then( function( data ) {
                
                self.xmlLoaded = true;
                
                // call function to parse the XML data
                // SHOULD BE THE LAST TASK TO BE EXECUTED IN THIS BLOCK
                self.parseXMLData( data );
                
            } ).catch( function( error ) { // when fail to load XML file
                
                // set error flag to true
                self.hasError = true;
                
                // display appropriate error message based on the status
                if ( error && error.type === 'parsererror' ) {
                    self.showErrorScreen( 'parser' );
                } else {
                    self.showErrorScreen( 'xml' );
                }
                
            } );
            
        }
        
    }, // end loadXML function
    
    /**
     * Parse presentation data from an external XML file
     * @param string - data from reading the XML file
     **/
    parseXMLData: function( d ) {
        
        const self = this;
            
        if ( self.xmlLoaded ) {
            
            const doc = d;
            const xSb = doc.querySelector( 'storybook' );
            const xSetup = doc.querySelector( 'setup' );
            
            // set data from the XML to respective variables
            let xAccent = xSb ? self.trimAndLower( xSb.getAttribute( 'accent' ) || '' ) : '';
            let xImgType = xSb ? self.trimAndLower( xSb.getAttribute( 'pageImgFormat' ) || '' ) : '';
            let xSplashImgType = 'svg';
            let xMathjax = '';
            let xDownloadableFileName = xSb ? xSb.getAttribute( 'downloadableFileName' ) : '';
            let xSplashImg = '';
            let xTitle = self.noScript( ( xSetup && xSetup.querySelector( 'title' ) ? xSetup.querySelector( 'title' ).textContent : '' ).trim() );
            let xSubtitle = self.noScript( ( xSetup && xSetup.querySelector( 'subtitle' ) ? xSetup.querySelector( 'subtitle' ).textContent : '' ).trim() );
            let xLength = xSetup && xSetup.querySelector( 'length' ) ? xSetup.querySelector( 'length' ).textContent.trim() : '';
            let xAuthor = xSetup ? xSetup.querySelector( 'author' ) : null;
            let xGeneralInfoNode = xSetup ? xSetup.querySelector( 'generalInfo' ) : null;
            let xGeneralInfo = xGeneralInfoNode ? self.noScript( self.noCDATA( xGeneralInfoNode.innerHTML || xGeneralInfoNode.textContent || '' ) ) : '';
            let xSections = doc.querySelectorAll( 'section' );
            
            // variable to hold temporary XML value for further evaluation
            let splashImgType_temp = xSb ? xSb.getAttribute( 'splashImgFormat' ) : '';
            let splashImg_temp = xSetup ? xSetup.getAttribute( 'splashImg' ) : '';
            
            // if temporary splash image type is defined...
            if ( splashImgType_temp ) {
                
                // and if it is not empty...
                if ( !self.isEmpty( splashImgType_temp ) ) {
                    
                    // set the splash image type to the temporary value
                    xSplashImgType = self.trimAndLower( splashImgType_temp );
                    
                }
                
            }
            
            // if splashImg_temp temporary is defined
            // set the splashImg_temp to the temporary value
            if ( splashImg_temp ) {
                xSplashImg = self.trimAndLower( splashImg_temp );
            }
            
            // if accent is empty, set the accent to the value in the manifest

            if ( self.isEmpty( xAccent ) ) {
                xAccent = self.manifest.sbplus_default_accent;
            }
            
            // if image type is empty, default to jpg
            if ( self.isEmpty( xImgType ) ) {
                xImgType = 'jpg';
            }
            
            // if mathjax is not found or empty
            const mathjaxAttr = xSb ? xSb.getAttribute( 'mathjax' ) : '';
            if ( self.isEmpty( mathjaxAttr ) ) {
                
                // default to off
                xMathjax = 'off';
                
            } else {
                
                // value in mathjax attribute is on, set to on
                if ( self.trimAndLower( mathjaxAttr ) === 'on' || self.trimAndLower( mathjaxAttr ) === 'true' ) {
                    xMathjax = 'on';
                }
                
            }
            
            // set the parsed data to the class XML object variable
            self.xml = {
                settings: {
                    accent: xAccent,
                    imgType: xImgType,
                    splashImgType: xSplashImgType,
                    mathjax: xMathjax,
                    downloadableFileName: xDownloadableFileName
                },
                setup: {
                    splashImg: xSplashImg,
                    title: xTitle,
                    subtitle: xSubtitle,
                    author: xAuthor,
                    authorPhoto: '',
                    duration: xLength,
                    generalInfo: xGeneralInfo
                },
                sections: xSections
            };

            self.xmlParsed = true;

            /* finished parsing XML; do additional setup based on parsed XML values */

            self.setLogo( self.logo );
            
            self.getAuthorProfile(); // get author profile
            self.setAccent(); // set accent color
            self.setCopyright(); // set the copyright info
            
            // if mathjax if turned on
            if (self.xml.settings.mathjax === "on" || self.xml.settings.mathjax === "true") {
                // load the MathJAX script from a CDN
                loadScript("https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-MML-AM_CHTML").then( function () {
                    MathJax.Hub.Config({
                        "HTML-CSS": {
                            matchFontHeight: true,
                        },
                    });
                });
            }
            
            // if HotJar site id is set in manifest, get and set HotJar tracking code
            if ( self.manifest.sbplus_hotjar_site_id != "" ) {

                const id = Number( self.manifest.sbplus_hotjar_site_id );

                ( function( h, o, t, j, a, r ) {
                    h.hj=h.hj||function(){ (h.hj.q=h.hj.q||[]).push( arguments ) };
                    h._hjSettings={ hjid:id, hjsv:6 };
                    a=o.getElementsByTagName( 'head' )[0];
                    r=o.createElement( 'script' );r.async=1;
                    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                    a.appendChild( r );
                } ) ( window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=' );
            }
            
            // if analytics ID is specified, get and set Google analytics tracking
            if ( self.manifest.sbplus_ga_tracking && !self.isEmpty( self.manifest.sbplus_ga_tracking.measurement_id ) ) {

                /* Google Analytics gtag.js */
                const head = document.getElementsByTagName( 'head' )[0];
                const gtagScript = document.createElement( 'script' );

                gtagScript.type = "text/javascript";
                gtagScript.setAttribute( 'async', true );
                gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + self.manifest.sbplus_ga_tracking.measurement_id;

                head.appendChild( gtagScript );

                /* Google Analytics */
                function gtag(){
                    const dataLayer = window.dataLayer = window.dataLayer || [];
                    dataLayer.push(arguments);
                }

                gtag('js', new Date());
                gtag('config', self.manifest.sbplus_ga_tracking.measurement_id);

                if ( !self.isEmpty( self.manifest.sbplus_ga_tracking.gTag_id ) ) {

                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                        })(window,document,'script','dataLayer',self.manifest.sbplus_ga_tracking.gTag_id );
                        
                    const noscript = document.getElementsByTagName( 'noscript' )[0];
                    const gtagIframe = document.createElement( 'iframe' );
            
                    gtagIframe.src = 'https://www.googletagmanager.com/ns.html?id=' + self.manifest.sbplus_ga_tracking.gTag_id;
                    gtagIframe.width = 0;
                    gtagIframe.height = 0;
                    gtagIframe.style.display = 'none';
                    gtagIframe.style.visibility = 'hidden';
            
                    noscript.appendChild( gtagIframe );

                    self.gtmLoaded = true;
    
                }

            }

            /* finished setup; ready to render the splash screen */

            self.renderSplashscreen();

            /* preload slide images from asset */
            self.preloadPresentationImages();
            
        }
        
    }, // end parseXMLData function

    /**
     * Set author profile from centralized repo if applicable
     **/

    getAuthorProfile: function() {

        const self = this;

        if ( self.xmlLoaded && !( self.xml.setup.author instanceof Element ) ) {
            return;
        }

        if ( self.xml.setup.author ) {
                
            // set author name and path to the profile to respective variable
            const authorName = self.xml.setup.author.getAttribute( 'name' ) ? self.xml.setup.author.getAttribute( 'name' ).trim() : '';
            const sanitizedAuthor = self.sanitize( authorName );
            const profileUrl = self.manifest.sbplus_author_directory + sanitizedAuthor + '.json';
            const profileInXml = self.noScript( self.noCDATA( self.xml.setup.author.innerHTML || self.xml.setup.author.textContent || '' ) );
            
            self.xml.setup.author = authorName;
            self.xml.setup.profile = profileInXml;

            if ( self.isEmpty( profileInXml ) && !self.isEmpty( self.manifest.sbplus_author_directory ) && !self.isEmpty( sanitizedAuthor ) ) {

                self.requestFile( profileUrl, response => {

                    if ( response ) {

                        const data = JSON.parse( response.responseText );

                        self.xml.setup.author = data.name;
                        self.xml.setup.profile = self.noScript( data.profile );

                        if ( self.splashScreenRendered ) {
                            const splashAuthorEl = document.querySelector( self.splash.author );
                            if ( splashAuthorEl ) {
                                splashAuthorEl.innerHTML = self.xml.setup.author;
                            }
                        }

                    }

                } );

            }

        }

    },
    
    /**************************************************************************
        SPLASH SCREEN FUNCTIONS
    **************************************************************************/
    
    /**
     * Render presentation splash screen
     **/
    renderSplashscreen: function() {
        
        const self = this;
        
        if ( self.xmlParsed === true && self.splashScreenRendered === false ) {

            // set the HTML page title
            document.title = self.xml.setup.title;

            // display data to the splash screen
            const splashTitleEl = document.querySelector( self.splash.title );
            const splashSubtitleEl = document.querySelector( self.splash.subtitle );
            const splashAuthorEl = document.querySelector( self.splash.author );
            const splashDurationEl = document.querySelector( self.splash.duration );
            if ( splashTitleEl ) {
                splashTitleEl.innerHTML = self.xml.setup.title;
            }
            if ( splashSubtitleEl ) {
                splashSubtitleEl.innerHTML = self.xml.setup.subtitle;
            }
            if ( splashAuthorEl ) {
                splashAuthorEl.innerHTML = self.xml.setup.author;
            }
            if ( splashDurationEl ) {
                splashDurationEl.innerHTML = self.xml.setup.duration;
            }

            // set event listener to the start button
            const startBtn = document.querySelector( self.button.start );
            if ( startBtn ) {
                startBtn.addEventListener( "click", self.startPresentation.bind(self) );
            }

            // if local storage has a value for the matching presentation title
            if ( self.hasStorageItem( "sbplus-" + self.presentationId ) ) {

                // set event listener to the resume button
                const resumeBtn = document.querySelector( self.button.resume );
                if ( resumeBtn ) {
                    resumeBtn.addEventListener( "click", self.resumePresentation.bind(self) );
                }

            } else {

                // hide the resume button
                const resumeBtn = document.querySelector( self.button.resume );
                if ( resumeBtn ) {
                    resumeBtn.style.display = 'none';
                    resumeBtn.setAttribute( "tabindex", "-1" );
                }

            }

            self.determineSplashImage();  // get the splash image
            self.determineDownloadableFiles(); // get and set any downloadable files
            self.splashScreenRendered = true; // flag the splash screen as rendered
            self.showSplashScreen(); // show the splash screen
            self.resize(); // "refresh the UI"
            self.scheduleOnlineStatusCheck(); // schedule online connectivity status check
            
            // send additional data to GTM about the environment
            if ( self.gtmLoaded ) {
                dataLayer.push({
                    event: 'mediaPlayerLoaded',
                    iframe: window.self !== window.top,
                    referrer: document.referrer,
                    full_url: window.location.href,
                    sb_title: self.xml.setup.title
                });
            }

        }
        
    }, // end renderSplashScreen function

    /**
     * Set initial sbplus settings if not already
     **/
    applyStorageItems: function() {

        const self = this;

        if ( self.hasStorageItem( "sbplus-colormode" ) === false ) {

            self.setStorageItem( "sbplus-colormode", "light" );

        } else {

            const colorMode = self.getStorageItem( "sbplus-colormode" );
            window.matchMedia( "(prefers-color-scheme: dark)" ).off;

            switch ( colorMode ) {
                case "dark":
                    document.documentElement.classList.add( "dark-mode" );
                    break;
                case "auto":
                    document.documentElement.classList.add( "auto-mode" );

                    self.applyAutoColorMode();

                    break;
                default:
                    document.documentElement.classList.remove( "auto-mode", "dark-mode" );
                break;
            }

        }

        if ( self.hasStorageItem( "sbplus-autoplay" ) === false ) {
            self.setStorageItem( "sbplus-autoplay", 1 );
        }

        if ( self.hasStorageItem( "sbplus-volume" ) === false ) {
            self.setStorageItem( "sbplus-volume", 0.8 );
        }

        if ( self.hasStorageItem( "sbplus-playbackrate" ) === false ) {
            self.setStorageItem( "sbplus-playbackrate", 1 );
        } else {
            self.playbackrate = self.getStorageItem( "sbplus-playbackrate" );
        }

        if ( self.hasStorageItem( "sbplus-subtitle" ) === false ) {
            self.setStorageItem( "sbplus-subtitle", 0 );
        }

        // if autoplay for videoJS is on, add a class to the body tag
        if ( self.getStorageItem( "sbplus-autoplay" ) == "1" ) {
            const wrapperEl = document.querySelector( self.layout.wrapper );
            if ( wrapperEl ) {
                wrapperEl.classList.add( "sbplus_autoplay_on" );
            }
        }

    },

    /**
     * determine the image to load on the splash screen
     **/
    determineSplashImage: function() {

        const self = this;
        const splashImgUrl = self.assetsPath + "splash." + self.xml.settings.splashImgType;

        self.requestedFileExists( splashImgUrl, result => {

            if ( result ) {

                self.setSplashImage( splashImgUrl );
                
            } else {

                /* when failed to load the image in the assets folder
                   attempt to get it from the image repo on the server
                   with the provided splashImg values from the XML */

                // first, if splash directory is not specified in the manifest, no image and exit
                if ( self.isEmpty( self.manifest.sbplus_splash_directory ) ) {
                    self.setSplashImage( "" );
                    return;
                }

                // otherwise, continue...
                // if splashImg is empty, no image and exit
                if ( self.isEmpty( self.xml.setup.splashImg ) ) {

                    self.setSplashImage( "" );
                    return;

                }

                // otherwise, attempt to get the image from server
                const serverSplashImgUrl = self.manifest.sbplus_splash_directory + self.xml.setup.splashImg + "." + self.xml.settings.splashImgType;
                
                self.requestedFileExists( serverSplashImgUrl, serverResult => {
                    self.setSplashImage( serverResult ? serverSplashImgUrl : "" );
                } );

            }

        } );

    },
    
    /**
     * Set the splash screen image to the DOM
     * @param string - the URL/path to the splash image file
     **/
    setSplashImage: function( str ) {
        
        const self = this;

        if ( self.isEmpty( str ) ) { return; }

        const img = new Image();

        img.src = str;
        img.addEventListener( 'load', function() {
            
            if ( img.complete ) {
                const splashBgEl = document.querySelector( self.splash.background );
                if ( splashBgEl ) {
                    splashBgEl.style.backgroundImage = 'url(' + img.src + ')';
                }
            }

        } );
        
    },

    /**
     * Show the splash screen
     **/
    showSplashScreen: function() {

        const self = this;

        const splashInfoBoxEl = document.querySelector( self.splash.infoBox );
        if ( splashInfoBoxEl ) {
            splashInfoBoxEl.style.display = 'block';
        }

        setTimeout( () => {

            const loadingWrapperEl = document.querySelector( self.loadingScreen.wrapper );
            if ( loadingWrapperEl ) {
                loadingWrapperEl.classList.add( "fadeOut" );
                onAnimationEnd( loadingWrapperEl, function() {
                    loadingWrapperEl.classList.remove( 'fadeOut' );
                    loadingWrapperEl.style.display = 'none';
                } );
            }
            
        }, 1500 );

    },

    /**
     * Hide the splash screen. Should be used when starting or resuming.
     **/
    hideSplashScreen: function() {

        const self = this;

        // if presentation is rendered...
        if ( self.presentationRendered ) {
            
            // add fadeOut class and listen for animation completion event
            const splashScreenEl = document.querySelector( self.splash.screen );
            const mainScreenEl = document.querySelector( self.layout.mainScreen );
            if ( splashScreenEl ) {
                splashScreenEl.classList.add( 'fadeOut' );
                onAnimationEnd( splashScreenEl, function() {
                    splashScreenEl.classList.remove( 'fadeOut' );
                    splashScreenEl.style.display = 'none';
                    if ( mainScreenEl ) {
                        mainScreenEl.removeAttribute( 'aria-hidden' );
                        mainScreenEl.classList.remove( 'hide' );
                    }
                } );
            }
            
        }
        
    },

    /**
     * Get and set the downloadable files that are available
     **/
    determineDownloadableFiles: function() {

        const self = this;

        // set downloadable file name from the course directory name in URL
        let fileName = self.xml.settings.downloadableFileName;

        // if file name is empty, default to 'sbplus'
        if ( self.isEmpty( fileName ) ) {
            fileName = self.sanitize( self.xml.setup.title );
        }

        // load each supported downloadable files specified in the manifest
        self.manifest.sbplus_download_files.forEach( function( file ) {

            const downloadableUrl = self.extractAssetsRoot( self.xmlPath ) + fileName + "." + file.format;

            headRequest( downloadableUrl ).then( function() {

                const fileLabel = file.label.toLowerCase();

                self.downloads[fileLabel] = { fileName: fileName, fileFormat: file.format, url: downloadableUrl };

                const downloadBarEl = document.querySelector( self.splash.downloadBar );
                if ( downloadBarEl ) {
                    downloadBarEl.insertAdjacentHTML( 'beforeend', '<a href="' + downloadableUrl + '" download="' + fileName + "." + file.format + '" aria-label="Download ' + fileLabel + ' file" class="sbplus-download-link"><span class="icon-download"></span>' + file.label + "</a>" );
                }

            } ).catch( function() {
                // Downloadable file is optional.
            } ).finally( function () {

                if ( Object.keys( self.downloads ).length <= 0 ) {

                    const splashCtaEl = document.querySelector( self.splash.cta );
                    if ( splashCtaEl ) {
                        splashCtaEl.classList.add("no_downloads");
                    }

                }

            } );

        } );

    },

     /**
     * preload all images used in the presentation if applicable
     **/
    preloadPresentationImages: async function() {

        const self = this;

        if ( self.isEmpty( self.assetsPath ) ) {
            return;
        }
        
        try {

            await self.parseSectionPageSources( self.xml.sections );

        } catch ( err ) {

            console.warn( "Preloading images failed." );
            return err;

        }

    },

     /**
     * parse preload all images used in the presentation
     **/
    parseSectionPageSources: function( xmlSections ) {
        const self = this;
        return new Promise( (resolve, reject) => {

            let srcArray = [];

            Array.from( xmlSections ).forEach( function( sectionNode )  {

                Array.from( sectionNode.querySelectorAll( 'page' ) ).forEach( function ( pageNode ) {

                    const type = pageNode.getAttribute( 'type' );

                    switch ( type ) {

                        case 'bundle': {

                            const src = pageNode.getAttribute( 'src' );
                            const bundleSrc = [];

                            bundleSrc.push( src + '-' + (1) );

                            Array.from( pageNode.querySelectorAll( 'frame' ) ).forEach( function ( _frame, i ) {
                                bundleSrc.push( src + '-' + (i + 2) );
                            } );

                            srcArray = srcArray.concat( bundleSrc );
                            break;

                        }
                        case 'image':
                        case 'image-audio': {
                            const src = pageNode.getAttribute( 'src' );
                            srcArray.push( src );
                            break;
                        }
                        default:
                            break;
                    }

                } );

            } );

            srcArray = srcArray.filter( (value, index) => srcArray.indexOf(value) === index);

            srcArray.forEach( function( name ) {
        
                const imagePath = self.assetsPath + "pages/" + name + "." + self.xml.settings.imgType;
                const linkObj = document.createElement( 'link' );

                linkObj.rel = "prefetch";
                linkObj.href = imagePath;

                document.head.appendChild( linkObj );
                
            } );

            resolve( true );

        } );

    },
    
    /**
     * Start presentation function for the start button
     **/
    startPresentation: function() {
        
        const self = this;
        
        // if presentation has not started, hide splash and render presentation
        if ( self.presentationStarted === false ) {
            
            // render presentation
            self.renderPresentation();
            
            // hide splash screen
            self.hideSplashScreen();
            
            // select the first page
            self.selectPage( '0,0' );
            self.presentationStarted = true;
            
        }
        
    },
    
    /**
     * Resume presentation function for the start button
     **/
    resumePresentation: function() {
        
        const self = this;
        
        // if presentation has not started, hide splash, set resuming flag
        // to true and render presentation
        if ( self.presentationStarted === false ) {
            
            // render presentation
            self.renderPresentation();
            
            // hide screen
            self.hideSplashScreen();
            
            // select the page that was set in the local storage data
            self.selectPage( self.getStorageItem( 'sbplus-' + self.presentationId ) );
            window.setTimeout( function() {
                self.updateScroll( self.targetPage );
            }, 1000 );
            
            self.presentationStarted = true;
            
        }
        
    },
    
    /**
     * Render the presentation (after the hiding the splash screen)
     **/
    renderPresentation: function() {

        const self = this;
        
        if ( self.presentationRendered === false ) {
            
            // remove focus (from the hidden elements)
            document.querySelector( self.layout.sbplus ).focus();
            
            // display presentation title and author to the black banner bar
            const bannerTitleEl = document.querySelector( self.banner.title );
            const bannerAuthorEl = document.querySelector( self.banner.author );
            if ( bannerTitleEl ) {
                bannerTitleEl.innerHTML = self.xml.setup.title;
            }
            if ( bannerAuthorEl ) {
                bannerAuthorEl.innerHTML = self.xml.setup.author;
            }
            
            // display table of contents
            const sections = Array.from( self.xml.sections );
            sections.forEach( function( sectionNode, i ) {
                
                // set section head title
                let sectionHead = sectionNode.getAttribute( 'title' );
                
                // set page array data
                const pages = Array.from( sectionNode.querySelectorAll( 'page' ) );
                
                // set section HTML DOM
                let sectionHTML = '<div class="section">';
                
                // if there is more than 2 sections...
                if ( sections.length >= 2 ) {
                    
                    // if sectionHead title is empty, set a default title
                    if ( self.isEmpty( sectionHead ) ) {
                        sectionHead = 'Section ' + ( i + 1 );
                    }
                    
                    // append section head HTML to DOM
                    sectionHTML += '<h3 class="header" >';
                    sectionHTML += '<button class="title" aria-expanded="true" aria-controls="toc-section-'+i+'">';
                    sectionHTML += sectionHead +'<div class="icon" aria-hidden="true"><span class="icon-collapse"></span></div></button>';
                    sectionHTML += '</h3>';
                    
                }
                
                // append pages (opening list tag) HTML to DOM
                sectionHTML += '<ul id="toc-section-'+i+'" class="list" role="tablist">';
                
                // for each page
                pages.forEach( function( pageNode, j ) {
                    
                    // increment total page
                    ++self.totalPages;
                    
                    const pageType = pageNode.getAttribute( 'type' );
                    const title = pageNode.getAttribute( 'title' );

                    // append opening list item tag to DOM
                    sectionHTML += '<li class="item" data-count="' + self.totalPages + '" data-page="' + i + ',' + j + '" role="presentation">';
                    sectionHTML += '<button role="tab" aria-selected="false" aria-controls="sbplus_main_content_col" aria-label="Slide ' + self.totalPages + ', ' + self.escapeHTMLAttribute(title) +'">';
                    
                    // if page is quiz
                    if ( pageType === 'quiz' ) {
                        
                        // append an quiz icon
                        sectionHTML += '<span class="icon-assessment"></span>';
                        
                    } else {
                        
                        // append a count number
                        sectionHTML += '<span class="numbering">' + self.totalPages + '.</span> ';
                        
                    }
                    
                    // append page title and close the list item tag
                    sectionHTML += title + '</button></li>';
                    
                } );
                
                // appending closing list and div tag
                sectionHTML += '</ul></div>';
                
                // append the section HTML to the table of content DOM area
                const tocContainerEl = document.querySelector( self.tableOfContents.container );
                if ( tocContainerEl ) {
                    tocContainerEl.insertAdjacentHTML( 'beforeend', sectionHTML );
                }
                
            } );
            
            // set total page to the status bar and to the screen reader text holder
            const totalStatusEl = document.querySelector( self.layout.pageStatus + ' span.total' );
            const totalPagesSrEl = document.querySelector( self.screenReader.totalPages );
            if ( totalStatusEl ) {
                totalStatusEl.innerHTML = String( self.totalPages );
            }
            if ( totalPagesSrEl ) {
                totalPagesSrEl.innerHTML = String( self.totalPages );
            }
            
            // if author is missing hide author button and menu item
            if ( self.xml.setup.author.length ) {
                
                const authorBtnEl = document.querySelector( self.button.author );
                if ( authorBtnEl ) {
                    authorBtnEl.addEventListener( 'click', function() {
                        self.openMenuItem( 'sbplus_author_profile' );
                    } );
                }
                
            } else {
                
                const authorBtnEl = document.querySelector( self.button.author );
                if ( authorBtnEl ) {
                    authorBtnEl.disabled = true;
                }
                document.querySelectorAll( '.sbplus_author_profile' ).forEach( function( el ) {
                    el.style.display = 'none';
                } );
                
            }
            
            const nextBtnEl = document.querySelector( self.button.next );
            const prevBtnEl = document.querySelector( self.button.prev );
            const mobileTocToggleEl = document.querySelector( self.button.mobileTocToggle );
            if ( nextBtnEl ) {
                nextBtnEl.addEventListener( 'click', self.goToNextPage.bind( self ) );
            }
            if ( prevBtnEl ) {
                prevBtnEl.addEventListener( 'click', self.goToPreviousPage.bind( self ) );
            }
            if ( mobileTocToggleEl ) {
                mobileTocToggleEl.addEventListener( 'click', self.toggleToc.bind(self) );
            }
            
            if ( sections.length >= 2 ) {
                document.querySelectorAll( self.tableOfContents.header ).forEach( function( headerEl ) {
                    headerEl.addEventListener( 'click', self.toggleSection.bind( self ) );
                } );
            }
            
            document.querySelectorAll( self.tableOfContents.page ).forEach( function( pageEl ) {
                pageEl.addEventListener( 'click', self.selectPage.bind( self ) );
            } );

            const widgetSegmentEl = document.querySelector( self.widget.segment );
            if ( widgetSegmentEl ) {
                self.widgetSegmentCleanup = onDelegate( widgetSegmentEl, 'click', 'button', self.selectSegment.bind( self ) );
            }
            
            // add main menu button
            const menuBtnEl = document.querySelector( self.button.menu );
            if ( menuBtnEl ) {
                menuBtnEl.addEventListener( 'click', function( e ) {

                    const expanded = e.currentTarget.getAttribute( 'aria-expanded' );

                    if ( expanded === 'false' ) {
                        self.openMenu();
                    } else {
                        self.closeMenu();
                    }

                } );
            }
            
            // hide general info under main menu if empty
            if ( self.isEmpty( self.xml.setup.generalInfo ) ) {
                document.querySelectorAll( ".sbplus_general_info" ).forEach( function( infoEl ) {
                    infoEl.style.display = 'none';
                } );
            }
            
            // add download button if downloads object is not empty
            if ( Object.keys( self.downloads ).length > 0 ) {
                
                const downloadBtnEl = document.querySelector( self.button.download );
                if ( downloadBtnEl ) {
                    downloadBtnEl.addEventListener( 'click', function( evt ) {
                        if ( evt.currentTarget.getAttribute( 'aria-expanded') === 'false' ) {
                            self.openDownloadMenu();
                        } else {
                            self.closeDownloadMenu();
                        }
                    } );
                }

                // set download items
                for ( let key in self.downloads ) {
                    
                    if ( self.downloads[key] != undefined ) {
                        const downloadMenuEl = document.querySelector( self.button.downloadMenu );
                        if ( downloadMenuEl ) {
                            downloadMenuEl.insertAdjacentHTML(
                                'beforeend',
                                '<li class="menu-item" role="menuitem"><a download="' + self.downloads[key].fileName + '.' + self.downloads[key].fileFormat + '" href="'
                                + self.downloads[key].url +
                                '" class="sbplus-download-link" aria-label="Download '+ self.escapeHTMLAttribute(key) +' file">' + self.capitalizeFirstLetter( key ) + '</a></li>'
                            );
                        }
                    }
                    
                }
                
            } else {
                
                // hide the download button if download object is empty
                const downloadWrapperEl = document.querySelector( self.button.downloadWrapper );
                if ( downloadWrapperEl ) {
                    downloadWrapperEl.style.display = 'none';
                }
            
            }
            
            // queue MathJAX if turned on
            if ( self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true' ) {
                MathJax.Hub.Queue( ['Typeset', MathJax.Hub] );
            }
            
            // easter egg event listener
            const menuButtonEl = document.querySelector( "#sbplus_menu_btn" );
            if ( menuButtonEl ) {
                menuButtonEl.addEventListener( 'click', self.burgerBurger.bind( self ) );
            }

            // close floating menus when click anywhere on the page
            document.addEventListener( 'click', function ( evt ) {

                const target = evt.target;
                const downloadBtn = document.querySelector( self.button.download );
                const menuBtn = document.querySelector( self.button.menu );
            
                // Check if downloadBtn exists and handle clicks outside it (including descendants)
                if ( downloadBtn && target && target !== downloadBtn && !downloadBtn.contains( target ) ) {
                    if ( downloadBtn.classList.contains( 'active' ) ) {
                        self.closeDownloadMenu();
                    }
                }
            
                // Handle clicks outside menuBtn (including descendants)
                if ( menuBtn && target && target !== menuBtn && !menuBtn.contains( target ) ) {
                    if ( menuBtn.classList.contains( 'active' ) ) {
                        self.closeMenu();
                    }
                }

            } );
            
            this.presentationRendered = true;
            
            // resize elements after everything is put in place
            self.resize();
            
            return document.querySelector( self.layout.sbplus );
            
        }
        
    }, // end renderPresentation function
    
    /**************************************************************************
        MAIN NAVIGATION FUNCTIONS
    **************************************************************************/
    
    /**
     * Go to next page in the table of contents
     **/
    goToNextPage: function() {
        
        const self = this;

        // get/set current page array
        const currentSelected = document.querySelector( '.sb_selected' );
        const currentPage = currentSelected ? currentSelected.getAttribute( 'data-page' ).split(',') : ['0', '0'];
        
        // set section number
        let tSection = Number( currentPage[0] );
        
        // set page number
        let tPage = Number( currentPage[1] );
        
        // set total section
        const totalSections = self.xml.sections.length;
        
        // set total page in current section
        const totalPagesInSection = self.xml.sections[tSection].querySelectorAll( 'page' ).length;
        
        // increment current page number
        tPage++;
        
        // if current page number is greater than total number of page in
        // current section
        if ( tPage > totalPagesInSection - 1 ) {
            
            // increment current section number
            tSection++;
            
            // if current section number is greater total number of sections
            if ( tSection > totalSections - 1 ) {
                
                // set current section number to 0 or the first section number
                tSection = 0;
            }
            
            // set page number to 0 or the first page in the current section
            tPage = 0;
            
        }
        
        // call selectPage function to get the page with current section and
        // and current page number as the arguments
        self.selectPage( tSection + ',' + tPage );
        
    }, // end goToNextPage function
    
    /**
     * Go to previous page in the table of contents
     **/
    goToPreviousPage: function() {
        
        const self = this;

        // get/set current page array
        const currentSelected = document.querySelector( '.sb_selected' );
        const currentPage = currentSelected ? currentSelected.getAttribute( 'data-page' ).split(',') : ['0', '0'];
        
        // set section number
        let tSection = Number( currentPage[0] );
        
        // set page number
        let tPage = Number( currentPage[1] );
        
        // decrement current page number
        tPage--;
        
        // current page number is less than 0 or the first page
        if ( tPage < 0 ) {
            
            // decrement current section number
            tSection--;
            
            // if current section number is 0 or the first section
            if ( tSection < 0 ) {
                
                // set section number to the last section
                tSection = self.xml.sections.length - 1;
                
            }
            
            // set page number to the last page on the current section
            tPage = self.xml.sections[tSection].querySelectorAll( 'page' ).length - 1;
            
        }
        
        // call selectPage function to get the page with current section and
        // and current page number as the arguments
        self.selectPage( tSection + ',' + tPage );
        
    }, // end goToPreviousPage function

    /**
     * Toggle table of contents in mobile view
     **/
    toggleToc: function () {

        const self = this;
        const sbplusWrapper = document.querySelector( self.layout.wrapper );

        if ( sbplusWrapper && sbplusWrapper.classList.contains( 'toc_displayed' ) ) {

            const tocContainerEl = document.querySelector( self.tableOfContents.container );
            if ( tocContainerEl ) {
                tocContainerEl.style.height = '';
            }
            sbplusWrapper.classList.remove( 'toc_displayed' );
            
        } else {

            const tocContainerEl = document.querySelector( self.tableOfContents.container );
            if ( tocContainerEl ) {
                tocContainerEl.style.height = self.calcTocHeight() + 'px';
            }
            if ( sbplusWrapper ) {
                sbplusWrapper.classList.add( 'toc_displayed' );
            }

        }

    },

    /**
     * Calculate the table of content height dynamically
     **/
    calcTocHeight: function() {

        const self = this;
        const bannerEl = document.querySelector( self.banner.bar );
        const mediaEl = document.querySelector( self.layout.media );
        const controlEl = document.querySelector( self.layout.mainControl );
        const bannerHeight = bannerEl ? bannerEl.getBoundingClientRect().height : 0;
        const mediaHeight = mediaEl ? mediaEl.getBoundingClientRect().height : 0;
        const controlHeight = controlEl ? controlEl.getBoundingClientRect().height : 0;
        return window.innerHeight - ( bannerHeight + mediaHeight + controlHeight );

    },
    
    /**
     * Update Page Status (or the status bar) next to the page controls
     **/
    updatePageStatus: function( num ) {
        
        const self = this;

        // display current page number to the status
        const currentEl = document.querySelector( self.layout.pageStatus + ' span.current' );
        if ( currentEl ) {
            currentEl.innerHTML = String( num );
        }
        
    }, // end updatePageStatus function

    /**************************************************************************
        MENU FUNCTIONS
    **************************************************************************/
    openMenu: function() {

        const menuBtn = document.querySelector( this.button.menu );
        const menuList = document.querySelector( this.menu.menuList );
        
        if ( menuBtn ) {
            menuBtn.setAttribute( 'aria-expanded', 'true' );
            menuBtn.classList.add( 'active' );
        }
        if ( menuList ) {
            menuList.classList.add( 'active' );
        }
        
    },

    closeMenu: function() {

        const menuBtn = document.querySelector( this.button.menu );
        const menuList = document.querySelector( this.menu.menuList );

        if ( menuBtn ) {
            menuBtn.setAttribute( 'aria-expanded', 'false' );
            menuBtn.classList.remove( 'active' );
        }
        if ( menuList ) {
            menuList.classList.remove( 'active' );
        }

    },

    openDownloadMenu: function() {

        const downloadBtn = document.querySelector( this.button.download );
        const downloadMenuList = document.querySelector( this.button.downloadMenu );

        if ( downloadBtn ) {
            downloadBtn.setAttribute( 'aria-expanded', 'true' );
            downloadBtn.classList.add( 'active' );
        }
        if ( downloadMenuList ) {
            downloadMenuList.removeAttribute( 'aria-hidden' );
            downloadMenuList.style.display = '';
        }

    },

    closeDownloadMenu: function() {
        const downloadBtn = document.querySelector( this.button.download );
        const downloadMenuList = document.querySelector( this.button.downloadMenu );

        if ( downloadBtn ) {
            downloadBtn.setAttribute( 'aria-expanded', 'false' );
            downloadBtn.classList.remove( 'active' );
        }
        if ( downloadMenuList ) {
            downloadMenuList.setAttribute( 'aria-hidden', 'true' );
            downloadMenuList.style.display = 'none';
        }
    },

    /**
     * open a menu item under the menu
     * @param string
     **/
    openMenuItem: function( id ) {
        
        const self = this;

        if ( self.currentPage.mediaPlayer != null ) {
            
            if (!self.currentPage.mediaPlayer.paused()) {
                self.currentPage.mediaPlayer.pause();
            }
            
        }
        
        const itemId = id;
        let content = "";
        
        const sbplusBanner = document.querySelector( self.banner.bar );
        const sbplusContentWrapper = document.querySelector( self.layout.contentWrapper );
        const menuContentWrapper = document.querySelector( self.menu.menuContentWrapper );
        const menuContent = document.querySelector( self.menu.menuContent );
        const menuTitle = document.querySelector( self.menu.menuBarTitle );
        
        if ( menuContent ) {
            menuContent.innerHTML = '';
        }
        self.closeMenu();

        // Move focus into the menu content before hiding banner/content
        // regions with aria-hidden to avoid focus-in-hidden warnings.
        if ( menuContentWrapper ) {
            menuContentWrapper.removeAttribute( 'aria-hidden' );
            menuContentWrapper.style.display = 'block';
        }
        const menuCloseBtnForFocus = document.querySelector( self.button.menuClose );
        if ( menuCloseBtnForFocus ) {
            menuCloseBtnForFocus.focus();
        } else if ( menuContent ) {
            menuContent.focus();
        }

        if ( sbplusBanner ) {
            sbplusBanner.setAttribute( "aria-hidden", 'true' );
            sbplusBanner.style.display = 'none';
        }
        if ( sbplusContentWrapper ) {
            sbplusContentWrapper.setAttribute( "aria-hidden", 'true' );
            sbplusContentWrapper.style.display = 'none';
        }
        
        document.querySelectorAll( self.menu.menuContentList + ' li' ).forEach( ( itemEl ) => itemEl.classList.remove( 'active' ) );
        document.querySelectorAll( self.menu.menuContentList + ' .' + itemId ).forEach( ( itemEl ) => itemEl.classList.add( 'active' ) );

        document.querySelectorAll( self.menu.menuContentList + ' li button' ).forEach( ( btnEl ) => btnEl.removeAttribute( 'aria-current' ) );
        document.querySelectorAll( self.menu.menuContentList + ' .' + itemId + ' button ' ).forEach( ( btnEl ) => btnEl.setAttribute( 'aria-current', 'true' ) );
        
        switch ( itemId ) {
                    
            case 'sbplus_author_profile':
            
                if ( menuTitle ) {
                    menuTitle.innerHTML = 'Author Profile';
                }
                
                if ( self.xml.setup.author.length ) {
                    
                    if ( menuContent ) {
                        menuContent.insertAdjacentHTML( 'beforeend', '<div class="profileImg"></div>' );
                    }
                    
                    const author = self.xml.setup.author;
                    const sanitizedAuthor = self.sanitize( author );

                    const photoUrl = self.assetsPath + sanitizedAuthor + '.jpg';

                    headRequest( photoUrl ).then( function() {
                        
                        const profileImgEl = document.querySelector( '.profileImg' );
                        if ( profileImgEl ) {
                            profileImgEl.innerHTML = '<img src="' + photoUrl + '" alt="Photo of ' + author + '" crossorigin="Anonymous" />';
                        }
                        
                    } ).catch( function() {
                        
                        if ( !self.isEmpty( self.manifest.sbplus_author_directory ) ) {

                            const fallbackPhotoUrl = self.manifest.sbplus_author_directory + sanitizedAuthor + '.jpg';
                            headRequest( fallbackPhotoUrl ).then( function() {
                                const profileImgEl = document.querySelector( '.profileImg' );
                                if ( profileImgEl ) {
                                    profileImgEl.innerHTML = '<img src="' + fallbackPhotoUrl + '" alt="Photo of ' + author + '" crossorigin="Anonymous" />';
                                }
                            } ).catch( function() {
                                // No fallback author image available.
                            } );
                            
                        }
                        
                    } );
                    
                    content = '<p class="name">' + self.xml.setup.author + '</p>';
                    content += self.noScript( self.xml.setup.profile );
                    
                } else {

                    content = 'No author profile available.';

                }
            
            break;
            
            case 'sbplus_general_info':

                if ( menuTitle ) {
                    menuTitle.innerHTML = 'General Info';
                }
                
                if ( self.isEmpty( self.xml.setup.generalInfo ) ) {
                    content = 'No general information available.';
                } else {
                    content = self.xml.setup.generalInfo;
                }
            
            break;
            
            case 'sbplus_settings':
                
                if ( menuTitle ) {
                    menuTitle.innerHTML = 'Settings';
                }
                
                if ( self.hasLocalStorageSupport && self.hasSessionStorageSupport ) {
                    
                    if ( self.hasStorageItem( 'sbplus-' + self.presentationId + '-settings-loaded', true ) === false ) {
                    
                        fetchResource( self.manifest.sbplus_root_directory + 'scripts/templates/settings.tpl' ).then( function( data ) {
                        
                            self.settings = data;
                            self.setStorageItem( 'sbplus-' + self.presentationId + '-settings-loaded', 1, true );
                            if ( menuContent ) {
                                menuContent.insertAdjacentHTML( 'beforeend', data );
                            }
                            self.afterSettingsLoaded();
                            const versionEl = document.querySelector( self.menu.versionContainer );
                            if ( versionEl ) {
                                versionEl.innerHTML = 'version ' + self.version;
                            }
                            
                        } );
                        
                    } else {
                        
                        if ( menuContent ) {
                            menuContent.insertAdjacentHTML( 'beforeend', self.settings );
                        }
                        const versionEl = document.querySelector( self.menu.versionContainer );
                        if ( versionEl ) {
                            versionEl.innerHTML = 'version ' + self.version;
                        }
                        self.afterSettingsLoaded();
                        
                    }
                    
                } else {
                    
                    content = 'Settings require web browser\'s local storage and session storage support. ';
                    content += 'Your web browser does not support local and session storage or is in private mode.';
                    
                }
                
                
            break;
            
            default:

                const customMenuItems = self.manifest.sbplus_custom_menu_items;

                for ( let key in customMenuItems ) {

                    const menuId = 'sbplus_' + self.sanitize( customMenuItems[key].name );

                    if ( itemId === menuId ) {
                        if ( menuTitle ) {
                            menuTitle.innerHTML = customMenuItems[key].name;
                        }
                        content = customMenuItems[key].content;
                        break;
                    }

                }
            break;
            
        }
        
        if ( menuContentWrapper ) {
            menuContentWrapper.removeAttribute( 'aria-hidden' );
            menuContentWrapper.style.display = 'block';
        }
        if ( menuContent ) {
            menuContent.insertAdjacentHTML( 'beforeend', content );
        }
        document.querySelector( self.menu.menuContent ).focus();
        
        const menuCloseBtnEl = document.querySelector( self.button.menuClose );
        if ( menuCloseBtnEl ) {
            menuCloseBtnEl.addEventListener( 'click', self.closeMenuContent.bind( self ) );
        }
        
        if ( self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true' ) {
            MathJax.Hub.Queue( ['Typeset', MathJax.Hub] );
        }
            
    },
    
    /**
     * Close the menu and its content
     **/
    closeMenuContent: function() {
        
        const self = this;
        const sbplusBanner = document.querySelector( self.banner.bar );
        const sbplusContentWrapper = document.querySelector( self.layout.contentWrapper );
        const menuContentWrapper = document.querySelector( self.menu.menuContentWrapper );
        const menuContent = document.querySelector( self.menu.menuContent );
        
        if ( menuContent ) {
            menuContent.innerHTML = '';
        }
        if ( menuContentWrapper ) {
            menuContentWrapper.setAttribute( 'aria-hidden', 'true' );
            menuContentWrapper.style.display = 'none';
        }

        if ( sbplusBanner ) {
            sbplusBanner.removeAttribute( "aria-hidden" );
            sbplusBanner.style.display = 'flex';
        }
        if ( sbplusContentWrapper ) {
            sbplusContentWrapper.removeAttribute( "aria-hidden" );
            sbplusContentWrapper.style.display = 'flex';
        }
        document.querySelector( self.button.menu ).focus();
        
        const menuCloseBtnEl = document.querySelector( this.button.menuClose );
        if ( menuCloseBtnEl ) {
            const clone = menuCloseBtnEl.cloneNode( true );
            menuCloseBtnEl.parentNode.replaceChild( clone, menuCloseBtnEl );
        }
        
    },
    
    /**
     * an easter egg to change the menu icon to a hamburger emoji
     **/
    burgerBurger: function() {
        
        const self = this;
        const menuIcon = document.querySelector( 'span.menu-icon' );
            
        self.clickCount++;
        
        if ( self.clickCount === self.randomNum ) {
            if ( menuIcon ) {
                menuIcon.classList.remove('icon-menu');
                menuIcon.innerHTML = '🍔';
            }
            self.clickCount = 0;
            self.randomNum = Math.floor((Math.random() * 6) + 5);
        } else {
            if ( menuIcon ) {
                menuIcon.classList.add('icon-menu');
                menuIcon.innerHTML = '';
            }
        }
        
    },
    /**************************************************************************
        TABLE OF CONTENT (SIDEBAR) FUNCTIONS
    **************************************************************************/
    /**
     * Toggling table of content sections
     * @param any
     **/
    toggleSection: function( el ) {
        
        const self = this;

        // get total number of 
        const headers = document.querySelectorAll( this.tableOfContents.header );
        const totalHeaderCount = headers.length;
        
        // if total number of section is greater than 1...
        if ( totalHeaderCount > 1 ) {
            
            // declare a variable to hold current targeted section
            let targetSectionHeader;
            
            // if the object is an click event object
            if ( el instanceof Object ) {
                
                // set the current section to the current event click target
                targetSectionHeader = el.currentTarget;
                
            } else {
                
                // if argument is greater than total number of sections
                if ( Number( el ) > totalHeaderCount - 1 ) {
                    
                    // exit function
                    return false;
                    
                }
                
                // set the current section to the passed argument
                targetSectionHeader = headers[Number( el )];
                
            }
            
            const targetList = targetSectionHeader ? targetSectionHeader.nextElementSibling : null;
            const isVisible = !!( targetList && ( targetList.offsetWidth || targetList.offsetHeight || targetList.getClientRects().length ) );
            // if target is visible...
            if ( isVisible ) {
                
                self.closeSection( targetSectionHeader );
                
            } else {
                
                self.openSection( targetSectionHeader );
                
            }
            
        }
        
    }, // end toggleSection function
    
    /**
     * Close specified table of content section
     * @param object
     **/
     
     closeSection: function( obj ) {
        
        // set the target to the list element under the section
        const target = obj ? obj.nextElementSibling : null;
        
        // the open/collapse icon on the section title bar
        const icon = obj ? obj.querySelector( '.icon' ) : null;
        
        // slide up (hide) the list
        const titleBtn = obj ? obj.querySelector( 'button.title' ) : null;
        if ( titleBtn ) {
            titleBtn.setAttribute( 'aria-expanded', 'false' );
        }
        if ( target ) {
            target.style.display = 'none';
        }
            
        // update the icon to open icon
        if ( icon ) {
            icon.innerHTML = '<span class="icon-open"></span>';
        }
         
     },
     
     /**
     * Open specified table of content section
     * @param object
     **/
     
     openSection: function( obj ) {
        
        // set the target to the list element under the section
        const target = obj ? obj.nextElementSibling : null;
        
        // the open/collapse icon on the section title bar
        const icon = obj ? obj.querySelector( '.icon' ) : null;
        
        // slide down (show) the list
        const titleBtn = obj ? obj.querySelector( 'button.title' ) : null;
        if ( titleBtn ) {
            titleBtn.setAttribute( 'aria-expanded', 'true' );
        }
        if ( target ) {
            target.style.display = '';
        }
        
        // update the icon to collapse icon
        if ( icon ) {
            icon.innerHTML = '<span class="icon-collapse"></span>';
        }
         
     },
    
    /**
     * Selecting page on the table of contents
     * @param any
     **/
    selectPage: function( el ) {
        
        const self = this;

        // if the argument is an click event object
        if ( el instanceof Object ) {
            
            // set target to current click event target
            self.targetPage = el.currentTarget;
            
        } else {
            
            // set target to the passed in argument
            self.targetPage = document.querySelector( '.item[data-page="' + el + '"]' );
            
            // if targe page does not exist
            if ( !self.targetPage ) {
                
                // exit function; stop further execution
                return false;
            }
            
        }
        
        // if target page does not have the sb_selected class
        if ( !self.targetPage.classList.contains( 'sb_selected' ) ) {
            
            // get all pages
            const allPages = Array.from( document.querySelectorAll( self.tableOfContents.page ) );
            
            // get section headers
            const sectionHeaders = Array.from( document.querySelectorAll( self.tableOfContents.header ) );
            
            // if more than one section headers...
            if ( sectionHeaders.length > 1 ) {
                
                // set the target header to targeted page's header
                const targetHeader = self.targetPage.parentElement ? self.targetPage.parentElement.previousElementSibling : null;
                
                // if targeted header does not have the current class
                if ( targetHeader && !targetHeader.classList.contains( 'current' ) ) {
                    
                    // remove current class from all section headers
                    sectionHeaders.forEach( ( headerEl ) => headerEl.classList.remove( 'current' ) );
                    
                    // add current class to targeted header
                    targetHeader.classList.add( 'current' );
                    
                }
                
                self.openSection( targetHeader );
                
            }
            
            // remove sb_selected class from all pages
            allPages.forEach( ( pageEl ) => {
                pageEl.classList.remove( 'sb_selected' );
                const btn = pageEl.querySelector( 'button' );
                if ( btn ) {
                    btn.setAttribute( 'aria-selected', 'false' );
                }
            } );
            
            // add sb_selected class to targeted page
            self.targetPage.classList.add( 'sb_selected' );
            const selectedBtn = self.targetPage.querySelector( 'button' );
            if ( selectedBtn ) {
                selectedBtn.setAttribute( 'aria-selected', 'true' );
            }
            
            // call the getPage function with targeted page data as parameter
            self.getPage( self.targetPage.getAttribute( 'data-page' ) );
            
            // update the page status with the targeted page count data
            self.updatePageStatus( self.targetPage.getAttribute( 'data-count' ) );
            
            // update screen reader status
            const srCurrentPage = document.querySelector( self.screenReader.currentPage );
            if ( srCurrentPage ) {
                srCurrentPage.innerHTML = self.targetPage.getAttribute( 'data-count' );
            }
            
            // update the scroll bar to targeted page with a 1
            const sidebarEl = document.querySelector( self.layout.sidebar );
            if ( sidebarEl && ( sidebarEl.offsetWidth || sidebarEl.offsetHeight || sidebarEl.getClientRects().length ) ) {
                self.updateScroll( self.targetPage );
            }

            // hide table of content in mobile view
            const wrapperEl = document.querySelector( self.layout.wrapper );
            if ( wrapperEl && wrapperEl.classList.contains( 'toc_displayed' ) ) {
                self.toggleToc();
            }
            
        }
        
    }, // end selectPage function
    
    /**
     * Getting page after selected a page
     * @param string
     **/
    getPage: function ( page ) {
        
        const self = this;
        const getAttrTrim = function( node, name, fallback = '' ) {
            if ( !node || !node.getAttribute ) {
                return fallback;
            }

            const value = node.getAttribute( name );
            if ( value === null || value === undefined ) {
                return fallback;
            }

            return String( value ).trim();
        };

        // split the page value into an array
        page = page.split( ',' );
        
        // set section to page array index 0
        const section = page[0];
        
        // set item to page array index 1
        const item = page[1];
        
        // get and set target based on the section and item variable
        const pageNodes = self.xml.sections[section].querySelectorAll( 'page' );
        const target = pageNodes[item];
        if ( !target ) {
            return;
        }
        
        // create a pageData object to hold page title and type
        const pageData = {
            xml: [target],
            title: getAttrTrim( target, 'title', '' ),
            type: getAttrTrim( target, 'type', '' ).toLowerCase()
        };
        
        // set number property to the pageData object
        pageData.number = page;
        
        // if page type is not quiz
        if ( pageData.type !== 'quiz' ) {
            
            // add/set additional property to the pageData object
            pageData.src = getAttrTrim( target, 'src', '' );
            
            // check for preventAutoplay attribute
            if ( target.getAttribute( 'preventAutoplay' ) != undefined ) {
                pageData.preventAutoplay = getAttrTrim( target, 'preventAutoplay', 'false' );
            } else {
                pageData.preventAutoplay = "false";
            }

            // check for defaultPlayer attribute if it is youtube or vimeo
            if ( target.getAttribute( 'useDefaultPlayer' ) !== undefined ) {
                pageData.useDefaultPlayer = getAttrTrim( target, 'useDefaultPlayer', 'true' );
            } else {
                pageData.useDefaultPlayer = "true";
            }

            // check for disableFullscreen attribute
            if ( pageData.type == 'brightcove' 
            || pageData.type == 'kaltura'
            || pageData.type == 'video' 
            || ( pageData.type == 'youtube' && pageData.useDefaultPlayer == "true" ) ) {

                if ( target.getAttribute( 'disableFullscreen' ) != undefined ) {
                    pageData.disableFullscreen = getAttrTrim( target, 'disableFullscreen', 'false' );
                } else {
                    pageData.disableFullscreen = "false";
                }

            }
            
            // if there is a note tag, set notes
            if ( target.querySelectorAll( 'note' ).length ) {
                const noteNode = target.querySelector( 'note' );
                pageData.notes = noteNode ? self.noScript( self.noCDATA( noteNode.innerHTML || noteNode.textContent || '' ) ) : '';
                
            }
            
            pageData.widget = target.querySelectorAll( 'widget' );

            if ( target.querySelectorAll( 'copyableContent' ).length ) {
                pageData.copyableContent = target.querySelectorAll( 'copyableContent' );
            }

            if ( target.querySelectorAll( 'description' ).length ) {
                pageData.description = target.querySelectorAll( 'description' );
            }

            pageData.frames = target.querySelectorAll( 'frame' );
            pageData.imageFormat = self.xml.settings.imgType;
            pageData.transition = target.hasAttribute( 'transition' ) ? 
                getAttrTrim( target, 'transition', '' ) : '';

            if ( pageData.type !== 'image' ) {
                pageData.markers = target.querySelectorAll( 'markers' );
            }
            
            // create new page object using the pageData and set to SBPLUS's
            // currentPage property
            self.currentPage = new Page( pageData );
                
        } else {
            
            self.currentPage = new Page( pageData, target );
            
        }
        
        // get the page media
        self.currentPage.getPageMedia();
        
        // update the page title to the screen reader
        const pageTitleEl = document.querySelector( self.screenReader.pageTitle );
        if ( pageTitleEl ) {
            pageTitleEl.innerHTML = pageData.title;
        }
        
    }, // end getPage function
    
    /**
     * Updating the table of content's scroll bar position
     * @param object
     **/
    updateScroll: function( obj ) {
        
        const self = this;
        const scrollOption = { behavior: 'smooth', block: 'nearest', inline: 'start' };

        // set the obj from the parameter
        let target = obj;
        
        // if the target is not visible
        if ( !( target.offsetWidth || target.offsetHeight || target.getClientRects().length ) ) {
            
            // target its parent's siblings
            target = target.parentElement ? target.parentElement.previousElementSibling : target;
            
        }
        
        if ( target && target.getAttribute && target.getAttribute( "data-page" ) == "0,0" ) {
            
            if ( target.parentElement && target.parentElement.previousElementSibling ) {
                
                target.parentElement.previousElementSibling.scrollIntoView( scrollOption );
                
            } else {
                
                target.scrollIntoView( scrollOption );
                
            }

            return;
        }
        
        // get/set the scrollable height
        const tocContainerEl = document.querySelector( self.tableOfContents.container );
        const scrollHeight = tocContainerEl ? tocContainerEl.getBoundingClientRect().height : 0;
        const targetHeight = target.getBoundingClientRect().height;
        const sectionHeaders = document.querySelectorAll( self.tableOfContents.header );
        let targetTop = target.getBoundingClientRect().top + window.scrollY - targetHeight;
        
        if ( sectionHeaders.length <= 0 ) {
            targetTop += 40;
        }
        
        if ( targetTop > scrollHeight ) {
            target.scrollIntoView( scrollOption );
        }
        
        if ( targetTop < targetHeight ) {
            
            target.scrollIntoView( scrollOption );
            
        }
        
    }, // end updateScroll function

    /**************************************************************************
        WIDGET FUNCTIONS
    **************************************************************************/

    /**
     * clear the widget area
     **/
    clearWidget: function() {

        const self = this;
        const widgetSegmentEl = document.querySelector( self.widget.segment );
        const widgetContentEl = document.querySelector( self.widget.content );
        if ( widgetSegmentEl ) {
            widgetSegmentEl.innerHTML = '';
        }
        if ( widgetContentEl ) {
            widgetContentEl.innerHTML = '';
        }

    },
    
     /**
     * determine if the widget has content
     **/
    hasWidgetContent: function() {
        
        const self = this;
        const widgetSegmentEl = document.querySelector( self.widget.segment );
        return widgetSegmentEl ? widgetSegmentEl.querySelectorAll( 'button' ).length : 0;
        
    },
    
    /**
     * select the tabs in the widget area
     * @param any
     **/
    selectSegment: function( el ) {
        
        const self = this;
        const buttons = Array.from( document.querySelectorAll( self.widget.segment + ' button' ) );
        const widgetLayoutEl = document.querySelector( self.layout.widget );
        const widgetContentEl = document.querySelector( self.widget.content );
        const srHasNotesEl = document.querySelector( self.screenReader.hasNotes );
        const notesBtnEl = document.querySelector( self.button.notes );
        
        if ( self.hasWidgetContent() ) {
            
            if ( widgetLayoutEl ) {
                widgetLayoutEl.classList.remove('noSegments');
                widgetLayoutEl.removeAttribute( 'aria-hidden' );
            }
            if ( widgetContentEl ) {
                widgetContentEl.style.backgroundImage = '';
                widgetContentEl.removeAttribute( 'aria-hidden' );
            }
            if ( srHasNotesEl ) {
                srHasNotesEl.innerHTML = 'This slide contains notes.';
            }
            if ( notesBtnEl ) {
                notesBtnEl.disabled = false;
                notesBtnEl.setAttribute( 'title', 'View Notes' );
                notesBtnEl.setAttribute( 'aria-label', 'View Notes' );
            }

            if ( notesBtnEl ) {
                notesBtnEl.onclick = function() {

                    const secControlExpandedBtn = document.querySelector( '#expand_contract_btn' );

                    if ( secControlExpandedBtn && secControlExpandedBtn.classList.contains( 'expanded' ) ) {
                        secControlExpandedBtn.classList.remove( 'expanded' );
                    }

                    if ( self.currentPage.mediaPlayer && self.currentPage.mediaPlayer.hasClass( 'sbplus-vjs-expanded' ) ) {
                        self.currentPage.mediaPlayer.removeClass( 'sbplus-vjs-expanded' );
                    }

                    document.querySelector( self.layout.sbplus ).classList.remove( 'sbplus-vjs-expanded' );
        
                };
            }
            
            let target = null;
            let targetId = '';
            
            if ( typeof el === 'string' ) {
                target = document.getElementById( el );
                targetId = el;
            } else {
                target = el.currentTarget;
                targetId = target.id;
            }
            
            if ( target && !target.classList.contains( 'active' ) ) {
                self.currentPage.getWidgetContent( targetId );
                buttons.forEach( ( buttonEl ) => {
                    buttonEl.classList.remove( 'active' );
                    buttonEl.setAttribute( 'aria-selected', 'false' );
                } );
                target.classList.add( 'active' );
                target.setAttribute( 'aria-selected', 'true' );
            }
            
            if ( self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true' ) {
                MathJax.Hub.Queue( ['Typeset', MathJax.Hub] );
            }
            
        } else {
            
            if ( srHasNotesEl ) {
                srHasNotesEl.innerHTML = '';
            }
            if ( widgetLayoutEl ) {
                widgetLayoutEl.classList.add('noSegments');
                widgetLayoutEl.setAttribute( 'aria-hidden', 'true' );
            }
            if ( notesBtnEl ) {
                notesBtnEl.disabled = true;
                notesBtnEl.setAttribute( 'title', '' );
                notesBtnEl.setAttribute( 'aria-label', '' );
            }
            if ( widgetContentEl ) {
                widgetContentEl.setAttribute( 'aria-hidden', 'true' );
                widgetContentEl.removeAttribute( 'aria-labelledby' );
                widgetContentEl.removeAttribute( 'tabindex' );
                widgetContentEl.removeAttribute( 'role' );
            }

            // show logo
            if ( !self.isEmpty( self.logo ) ) {

                if ( widgetContentEl ) {
                    widgetContentEl.style.backgroundImage = 'url(' + self.logo + ')';
                }

            }
            
        }
        
    },
    
    /**
     * select the first tab in the widget area
     **/
    selectFirstSegment: function() {
        
        const self = this;
        const button = document.querySelector( self.widget.segment + ' button' );
        const target = button ? button.getAttribute( 'id' ) : '';
        
        if ( target ) {
            self.selectSegment( target );
        } else {
            // Trigger empty widget state so logo fallback is shown.
            self.selectSegment( '' );
        }
        
    },
    
    /**
     * add a tab to the widget area
     * @param string
     **/
    addSegment: function( str ) {
        
        const self = this;
        const btn = '<button role="tab" id="sbplus_' + self.sanitize( str ) + '" aria-controls="widget_content" aria-selected="false">' + str + '</button>';
        
        self.widget.segments.push( str );
        
        if ( str === 'Notes' ) {
            const segmentEl = document.querySelector( self.widget.segment );
            if ( segmentEl ) {
                segmentEl.insertAdjacentHTML( 'afterbegin', btn );
            }
        } else {
            const segmentEl = document.querySelector( self.widget.segment );
            if ( segmentEl ) {
                segmentEl.insertAdjacentHTML( 'beforeend', btn );
            }
        }
        
    },
    
    /**
     * clear all tabs and their content
     **/
    clearWidgetSegment: function() {

        const self = this;

        const widgetSegmentEl = document.querySelector( self.widget.segment );
        const widgetContentEl = document.querySelector( self.widget.content );
        const widgetBgEl = document.querySelector( self.widget.bg );
        if ( widgetSegmentEl ) {
            widgetSegmentEl.innerHTML = '';
        }
        if ( widgetContentEl ) {
            widgetContentEl.innerHTML = '';
        }
        if ( widgetBgEl ) {
            widgetBgEl.style.backgroundImage = '';
        }
        
        self.widget.segments = [];
        
    },
    
    /***************************************************************************
        HELPER FUNCTIONS
    ***************************************************************************/
    
    /**
     * get and read file
     * @param string - the URL/path to the file
     * @param callback - callback function
     **/
    requestFile( url, callback ) {
    
        const request = new XMLHttpRequest();
        
        request.open( 'GET', url + "?_=" + new Date().getTime(), true );
        
        request.onload = function() {
            
            callback( this.status >= 200 && this.status < 400 ? this : null );
            request.abort();
            
        };
        
        request.onerror = function() {
            
            callback( null );
            
        };
        
        request.send();
        
    },

    /**
     * check if file existing by requesting the HEAD
     * @param string - the URL/path to the file
     * @param callback - callback function
     **/
    requestedFileExists( url, callback ) {
    
        const request = new XMLHttpRequest();
        
        request.open( 'HEAD', url + "?_=" + new Date().getTime(), true );
        
        request.onload = function() {
            
            callback( this.status >= 200 && this.status < 400 ? true : false );
            request.abort();
            
        };
        
        request.onerror = function() {
            
            callback( false );
            
        };
        
        request.send();
        
    },
    
    /**
     * show the error message screen based on error type
     * (visually covered up the presentation)
     * @param string
     **/
    showErrorScreen: function( type ) {
        
        const self = this;

        if ( self.hasError && type.length ) {
            
            let errorTemplateUrl = self.manifest.sbplus_root_directory;
        
            const sbplusEl = document.querySelector( self.layout.sbplus );
            if ( sbplusEl ) {
                sbplusEl.style.display = 'none';
            }
            
            switch ( type ) {
                
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
            
            if ( errorTemplateUrl.length ) {
                
                fetchResource( errorTemplateUrl ).then( function( data ) {
                    
                    const errorScreenEl = document.querySelector( self.layout.errorScreen );
                    if ( errorScreenEl ) {
                        errorScreenEl.innerHTML = data;
                        errorScreenEl.style.display = 'flex';
                    }
                    
                } );
                
            }
            
        }
        
    },
    
     /**
     * calculate the height of the player
     **/
    calcLayout: function() {

        const self = this;

        const wrapperEl = document.querySelector( self.layout.wrapper );
        const tocContainerEl = document.querySelector( self.tableOfContents.container );

        if ( wrapperEl && wrapperEl.classList.contains ( 'toc_displayed' ) ) {
            if ( tocContainerEl ) {
                tocContainerEl.style.height = self.calcTocHeight() + 'px';
            }
        }

        if ( window.innerWidth < 900 || window.screen.width <= 414 ) {

            self.layout.isMobile = true;
            self.alreadyResized = true;
            if ( wrapperEl ) {
                wrapperEl.classList.remove( 'sbplus_boxed' );
            }

        } else {
            
            self.layout.isMobile = false;
            if ( wrapperEl ) {
                wrapperEl.classList.add( 'sbplus_boxed' );
                wrapperEl.classList.remove( 'toc_displayed');
            }
            if ( tocContainerEl ) {
                tocContainerEl.style.height = '';
            }

        }

        // if the media area is too large and covers up the table of content
        // made the table of content pop out instead
        if ( (window.innerWidth >= 600 && window.innerWidth <= 899) && window.innerHeight <= 586 ) {
            if ( tocContainerEl ) {
                tocContainerEl.classList.add( 'popout' );
            }
        } else {
            if ( tocContainerEl ) {
                tocContainerEl.classList.remove( 'popout' );
            }
        }
        
    },
    
    /**
     * resize the player layout; alias for calcLayout function
     **/
    resize: function() {

        const self = this;
        self.calcLayout();

    },
    
    /**
     * get the sbplus.xml URL/path form the query parameter
     **/
    getXMLPath: function() {
        
        const self = this;
        const presentationParam = "p";
        
        if ( URLSearchParams ) {

            const urlParams = new URLSearchParams( window.location.search );
            const presentation = urlParams.get( presentationParam );

            if ( presentation ) {
                
                return self.isXMLFile( presentation ) ? presentation : undefined;

            }

        } else { // fallback if URLSearchParams is not available

            const query = windows.location.search.substring( 1 );
            const vars = query.split( "&" );
            
            for ( let i = 0; i < vars.length; i++ ) {

                const pair = vars[i].split( '=' );

                if ( pair[0] === presentationParam ) {

                    return self.isXMLFile( decodeURIComponent( pair[1] ) ) ? decodeURIComponent( pair[1] ) : undefined;

                }

            }

        }
        
        return undefined;
        
    },

    /**
     * determine if the XML URL/path ends with sbplus.xml
     * @param string - the path or URL to the sbplus.xml file
     **/
    isXMLFile: function( path ) {

        return path.endsWith( 'sbplus.xml' );

    },

    /**
     * extract the path to the assets directory from the XML URL
     * @param string - the path or URL to the sbplus.xml file
     **/
    extractAssetsPath: function( path ) {

        const parts = path.split( "/" );

        parts.pop();

        return parts.join( "/" ) + "/";

    },

     /**
     * extract the path to the root directory containing the assets directory from the XML URL
     * @param string - the path or URL to the sbplus.xml file
     **/
    extractAssetsRoot: function( path ) {

        const parts = path.split( "/" );

        if ( parts.length <= 2 ) {
            return "";
        }

        parts.pop();
        parts.pop();

        return parts.join( "/" ) + "/";

    },

    /**
     * get the course or root directory name
     **/
    getCourseDirectory: function() {

        const self = this;

        if ( !self.assetsPath.startsWith( "http" ) ) {
            return "sbplus";
        }

        const parts = this.assetsPath.split( "/" );

        if ( parts.length <= 2 ) {
            return "sbplus";
        }

        parts.pop();
        parts.pop();

        return parts[parts.length -1];
        
    },
    
    /**
     * clean the string to be web friendly
     * @param string
     **/
    sanitize: function( str ) {
    
        return str.replace(/[^\w.]/gi, '').toLowerCase();
    
    },
    
     /**
     * Capitalize the first letter of a word
     * @param string
     **/
    capitalizeFirstLetter: function (str) {
        return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
    },
    
     /**
     * trim empty space before and after a string and set it to lowercase
     * @param string
     **/
    trimAndLower: function (str) {
        return str.trim().toLowerCase();
    },
    
    /**
     * check if a string is empty
     * @param string
     **/
    isEmpty: function( str ) {
        
        return str === undefined || str === null || !str.trim() || str.trim().length === 0;
        
    },

    /**
     * escape string to be HTML attribute safe
     * @param string
     **/
    escapeHTMLAttribute( str ) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },
    
    /**
     * get the color highlight based on the parameters
     * @param string - the hexadecimal
     * @param number - the luminosity rate between 0 to 1
     **/
    colorLum: function( hex, lum ) {
    
        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        
        if (hex.length < 6) {
        	hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        
        lum = lum || 0;
        
        // convert to decimal and change luminosity
        let rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
        	c = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        	c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        	rgb += ("00" + c).substring(c.length);
        }
        
        return rgb;
        
    },
    
    /**
     * get the color contrast for text colors based on the parameter
     * @param string - the hexadecimal
     **/
    colorContrast: function( hex ) {

        hex = hex.replace("#", "");

        const r = parseInt(hex.substring(0,2),16);
        const g = parseInt(hex.substring(2,4),16);
        const b = parseInt(hex.substring(4,2),16);
        const yiq = ((r*299)+(g*587)+(b*114))/1000;

        return yiq >= 128 ? '#000' : '#fff';
        
    },
    
    /**
     * remove script tag in string value
     * @param string
     **/
    noScript: function( str ) {
        
        if ( str !== "" || str !== undefined ) {

           const container = document.createElement( 'span' );
           container.innerHTML = str.trim();
           container.querySelectorAll( "script,noscript,style" ).forEach( ( node ) => node.remove() );
           return container.innerHTML;
    
       }
    
       return str;
        
    },
    
    /**
     * remove CDATA from string value in XML
     * @param string
     **/
    noCDATA: function( str ) {
        
        if ( str === undefined || str === '' ) {
            return '';
        }
        
        return str.replace(/<!\[CDATA\[/g, '').replace( /\]\]>/g, '').trim();
        
    },

    /**
     * convert hexadecimal to RGB value
     * @param string - the hexadecimal
     **/
    hexToRgb: function( hex ) {
        
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        
        hex = hex.replace( shorthandRegex, function( m, r, g, b ) {
            return r + r + g + g + b + b;
        } );
    
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec( hex );
        
        return result ? parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) : null;
    },
    
    /**
     * remove empty items from an array
     * @param array
     **/
    removeEmptyElements: function ( array ) {
    
        let found = false;
    
        for ( let i = 0; i < array.length; i++ ) {
            
            if ( self.isEmpty( array[i] ) ) {
                found = true;
            }
            
            if ( array[i].match(/^[0-9]+$/m) ) {
                found = true;
            }
            
            if ( found ) {
                array.splice( i, 1 );
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
     **/
    setStorageItem: function( key, value, toSession ) {

        if ( toSession ) {
            if ( this.hasSessionStorageSupport ) {
                return sessionStorage.setItem( key, value );
            }

            return;
        }

        if ( this.hasLocalStorageSupport ) {
            return localStorage.setItem( key, value );
        }

    },
    
    /**
     * get setting values from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     **/
    getStorageItem: function( key, fromSession ) {

        if ( fromSession ) {
            if ( this.hasSessionStorageSupport ) {
                return sessionStorage.getItem( key );
            }

            return;
        }

        if ( this.hasLocalStorageSupport ) {
            return localStorage.getItem( key );
        }

    },
    
    /**
     * delete setting values from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     **/
    deleteStorageItem: function( key, fromSession ) {

        if ( fromSession ) {
            if ( this.hasSessionStorageSupport ) {
                return sessionStorage.removeItem( key );
            }

            return;
        }

        if ( this.hasLocalStorageSupport ) {
            return localStorage.removeItem( key );
        }

    },
    
    /**
     * check for setting value existence from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     **/
    hasStorageItem: function( key, fromSession ) {

        const self = this;

        if ( fromSession ) {

            if ( !self.hasSessionStorageSupport ) {
                return false;
            }

            if ( self.isEmpty( sessionStorage.getItem( key ) ) ) {
                return false;
            }

            return true;
        }

        if ( !self.hasLocalStorageSupport ) {
            return false;
        }

        if ( self.isEmpty( localStorage.getItem( key ) ) ) {
            return false;
        }

        return true;
    },
    
    /**
     * delete all settings value in local and session storage
     **/
    removeAllSessionStorage: function() {

        if ( this.hasSessionStorageSupport ) {
            return sessionStorage.clear();
        }

    },
    
    /**
     * decode strings that contain HTML/XMl tags
     * also remove any script tags and CDATA
     * @param object
     **/
    getTextContent: function( obj ) {
        
        const self = this;
        let str = obj.html();
        
        if ( str === undefined ) {
            
            if ( !self.isEmpty( obj[0].textContent ) ) {
            
                const div = document.createElement('div');
                div.appendChild(obj[0]);
                
                const fcNodePatternOpen = new RegExp('<' + div.firstChild.nodeName + '?\\s*([A-Za-z]*=")*[A-Za-z\\s]*"*>', 'gi');
                const fcNodePatternClose = new RegExp('</' + div.firstChild.nodeName + '>', 'gi');
                
                str = div.innerHTML;
                
                str = str.replace( fcNodePatternOpen, '' )
                      .replace( fcNodePatternClose, '' )
                      .replace( /&lt;/g, '<')
                      .replace( /&gt;/g, '>').trim();
                
            } else {
                
                return '';
                
            }
            
        }
        
        return self.noScript( self.noCDATA( str ) );
        
    },

    /**
     * determine if it is on a web browser in mobile device
     **/
    isMobileDevice: function() {

        return navigator.userAgentData ? /iOS|Android/.test(navigator.userAgentData.platform) : /iPad|iPhone|iPod|Android/.test(navigator.platform);
        
    },
    
    /**
     * save settings to the local and session storages
     **/
    afterSettingsLoaded: function() {
        
        const self = this;
        
        if ( self.getStorageItem( 'sbplus-' + self.presentationId + '-settings-loaded', true ) === '1' ) {
            
            if ( self.isMobileDevice() ) {
                    
                const autoplayLabel = document.querySelector( '#autoplay_label' );
                const autoplayToggle = document.querySelector( '#sbplus_va_autoplay' );
                if ( autoplayLabel ) {
                    autoplayLabel.insertAdjacentHTML( 'afterend', '<p class="error">Mobile devices do not support autoplay.</p>' );
                }
                if ( autoplayToggle ) {
                    autoplayToggle.checked = false;
                    autoplayToggle.setAttribute( 'disabled', 'true' );
                }
                
            }
            
            self.syncSettings();
            
            document.querySelectorAll( '.settings input, .settings select' ).forEach( function( inputEl ) {
                inputEl.addEventListener( 'change', function() {
                
                // show msg
                const savingMsgEl = document.querySelector( self.menu.menuSavingMsg );
                if ( savingMsgEl ) {
                    savingMsgEl.style.display = '';
                    savingMsgEl.innerHTML = 'Saving...';
                }

                // color mode
                window.matchMedia( "(prefers-color-scheme: dark)" ).off;

                const selectedColorMode = document.querySelector( 'input[name="sbplus_color_mode"]:checked' );
                if ( selectedColorMode ) {

                    const mode = selectedColorMode.value;

                    self.setStorageItem( 'sbplus-colormode', mode );

                    switch (mode) {
                        case 'dark':
                            document.documentElement.classList.add( 'dark-mode' );
                            document.documentElement.classList.remove( 'auto-mode' );
                            break;
                        case 'auto':
                            document.documentElement.classList.add( 'auto-mode' );

                            self.applyAutoColorMode();
                            break;
                        default:
                            document.documentElement.classList.remove( "auto-mode", "dark-mode" );
                            break;
                    }

                } else {

                    self.setStorageItem( 'sbplus-colormode', 'light' );

                }
                
                // autoplay
                const autoplayEl = document.querySelector( '#sbplus_va_autoplay' );
                if ( autoplayEl && autoplayEl.checked ) {
                    self.setStorageItem( 'sbplus-autoplay', 1 );
                    const wrapperEl = document.querySelector( self.layout.wrapper );
                    if ( wrapperEl ) {
                        wrapperEl.classList.add( 'sbplus_autoplay_on' );
                    }
                } else {
                    self.setStorageItem( 'sbplus-autoplay', 0 );
                    const wrapperEl = document.querySelector( self.layout.wrapper );
                    if ( wrapperEl ) {
                        wrapperEl.classList.remove( 'sbplus_autoplay_on' );
                    }
                }
                
                // subtitle
                const subtitleEl = document.querySelector( '#sbplus_va_subtitle' );
                if ( subtitleEl && subtitleEl.checked ) {
                    self.setStorageItem( 'sbplus-subtitle', 1 );
                } else {
                    self.setStorageItem( 'sbplus-subtitle', 0 );
                }
                
                // volume
                const volumeEl = document.querySelector( '#sbplus_va_volume' );
                let vol = volumeEl ? volumeEl.value : 0;
                let volError = false;
                
                if ( vol < 0 || vol > 100 || self.isEmpty( vol ) ) {
                    
                    volError = true;
                    vol = Number( self.getStorageItem( 'sbplus-volume' ) ) * 100;
                    
                } else {
                    
                    self.setStorageItem( 'sbplus-volume', vol / 100 );
                    self.setStorageItem( 'sbplus-' + self.presentationId + '-volume-temp', vol / 100, true );
                    
                }
                
                if ( volError ) {
                    
                    const volumeLabel = document.querySelector( '#volume_label' );
                    if ( volumeLabel ) {
                        volumeLabel.insertAdjacentHTML( 'afterend', '<p class="error">Value must be between 0 and 100.</p>' );
                    }
                    
                } else {
                    
                    const volumeLabel = document.querySelector( '#volume_label' );
                    const nextEl = volumeLabel ? volumeLabel.nextElementSibling : null;
                    if ( nextEl && nextEl.classList.contains( 'error' ) ) {
                        nextEl.remove();
                    }
                    
                }
                
                // playback rate
                const playbackRateEl = document.querySelector( '#sbplus_va_playbackrate' );
                self.setStorageItem(
                    'sbplus-playbackrate',
                    playbackRateEl ? playbackRateEl.value : '1'
                );
                
                self.setStorageItem(
                    'sbplus-' + self.presentationId + '-playbackrate-temp',
                    playbackRateEl ? playbackRateEl.value : '1',
                    true
                );
                
                // show msg
                if ( savingMsgEl ) {
                    savingMsgEl.innerHTML = 'Settings saved!';
                }
                
                setTimeout( function() {
                    if ( savingMsgEl ) {
                        savingMsgEl.style.display = 'none';
                        savingMsgEl.innerHTML = '';
                    }
                    
                }, 1500 );
                
            } );
            } );
            
        }
            
    },

    /**
     * apply auto mode to toggle system default color mode
     **/
    applyAutoColorMode: function() {

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add( "dark-mode" );
        } else {
            document.documentElement.classList.add( "auto-mode" );
        }

        // watch for color mode change
        window.matchMedia( "(prefers-color-scheme: dark)" ).addEventListener( "change", event => {

            const color = event.matches ? "dark" : "light";
            
            if ( color === "dark" ) {
                document.documentElement.classList.add( "dark-mode" );
            } else {
                document.documentElement.classList.remove( "dark-mode" );
            }

        });

    },
    
    /**
     * load saved settings from the local and session storages
     **/
    syncSettings: function() {
        
        const self = this;
        
        if ( self.getStorageItem( 'sbplus-' + self.presentationId + '-settings-loaded', true ) === '1' ) {
            
            // color mode
            const colorMode = self.getStorageItem( 'sbplus-colormode' );

            switch (colorMode) {

                case 'dark':
                    const darkModeEl = document.querySelector( '#dark_color_mode' );
                    if ( darkModeEl ) darkModeEl.checked = true;
                    break;
                case 'auto':
                    const autoModeEl = document.querySelector( '#auto_color_mode' );
                    if ( autoModeEl ) autoModeEl.checked = true;
                    break;
                default:
                    const lightModeEl = document.querySelector( '#light_color_mode' );
                    if ( lightModeEl ) lightModeEl.checked = true;
                    break;

            }
            
            // autoplay
            const autoplayVal = self.getStorageItem( 'sbplus-autoplay' );
            
            if ( self.isMobileDevice() === false ) {
                
                if ( autoplayVal === '1') {
                    
                    const autoplayEl = document.querySelector( '#sbplus_va_autoplay' );
                    if ( autoplayEl ) autoplayEl.checked = true;
                    
                } else {
                    
                    const autoplayEl = document.querySelector( '#sbplus_va_autoplay' );
                    if ( autoplayEl ) autoplayEl.checked = false;
            
                }
                
            }
            
            // volume
            const volumeVal = self.getStorageItem( 'sbplus-volume' );
            
            const volumeEl = document.querySelector( '#sbplus_va_volume' );
            if ( volumeEl ) {
                volumeEl.value = volumeVal * 100;
            }
            
            // playback rate
            const playbackRateVal = self.getStorageItem( 'sbplus-playbackrate' );
            
            const playbackRateEl = document.querySelector( '#sbplus_va_playbackrate' );
            if ( playbackRateEl ) {
                playbackRateEl.value = playbackRateVal;
            }
            
            //subtitle
            const subtitleVal = self.getStorageItem( 'sbplus-subtitle' );
            
            if ( subtitleVal === '1') {
                const subtitleEl = document.querySelector( '#sbplus_va_subtitle' );
                if ( subtitleEl ) subtitleEl.checked = true;
            } else {
                const subtitleEl = document.querySelector( '#sbplus_va_subtitle' );
                if ( subtitleEl ) subtitleEl.checked = false;
            }
            
        }
        
    },
    
    /**
     * Show an message if the user has not network/Internet connectivity
     **/
    showConnectionMessage: function() {

        const self = this;
        const sbplusEl = document.querySelector( self.layout.sbplus );

        if ( sbplusEl && !sbplusEl.contains( document.querySelector( '#connection_error_msg' ) ) ) {

            const messageEl = document.createElement( 'div' );

            messageEl.setAttribute( 'id', 'connection_error_msg' );
            messageEl.innerHTML = '<strong>No Internet Connection.</strong> Please check your network connection.';
            sbplusEl.appendChild( messageEl );

        }

    },

    /**
     * hide the message if the user has network/Internet connectivity
     **/
    hideConnectionMessage: function() {

        const self = this;
        const sbplusEl = document.querySelector( self.layout.sbplus );

        if ( sbplusEl && sbplusEl.contains( document.querySelector( '#connection_error_msg' ) ) ) {

            sbplusEl.removeChild( document.querySelector( '#connection_error_msg' ) );

        }

    },

    /**
     * hold the network/Internet connectivity status by pinging the index file
     **/
    checkOnlineStatus: async () => {

        try {
            const online = await fetch( "index.html" + "?_=" + new Date().getTime(), { method: "HEAD" } );
            return online.status >= 200 && online.status < 300;
        } catch ( err ) {
            return false;
        }

    },

    /**
     * schedule network/Internet connectivity status check by pinging
     * the index.html HEAD every 3 minutes
     **/
    scheduleOnlineStatusCheck: async function() {

        const online = await SBPLUS.checkOnlineStatus();

        if ( online ) {
            SBPLUS.hideConnectionMessage();
        } else {
            SBPLUS.showConnectionMessage();
        }

        setTimeout( SBPLUS.scheduleOnlineStatusCheck, 3 * 60 * 1000 );

    },
        
};

export { SBPLUS };

/*******************************************************************************
        ON DOM READY
*******************************************************************************/
if ( document.readyState === 'loading' ) {
    document.addEventListener( 'DOMContentLoaded', function() {
        window.SBPLUS = SBPLUS;
        SBPLUS.go();
    } );
} else {
    window.SBPLUS = SBPLUS;
    SBPLUS.go();
}




