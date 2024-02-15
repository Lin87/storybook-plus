/*
 * Storybook Plus
 *
 * @author: Ethan Lin
 * @url: https://github.com/excelsior-university-web-systems/sbplus-v3
 * @version: 3.5.0
 * Released xx/xx/xx
 *
 * @license: GNU GENERAL PUBLIC LICENSE v3
 *
    Storybook Plus is an web application that serves multimedia contents.
    Copyright (C) 2013-2024 Ethan Lin and Excelsior University

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
import $ from "jquery";
import "../sass/sbplus.scss";

/*******************************************************************************
    STORYBOOK PLUS MAIN OBJECT CLASS
*******************************************************************************/
'use strict';

import { MenuBar } from "./menubar";
import { Page } from "./page";

let worker;
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
    manifestLoaded: false,
    splashScreenRendered: false,
    presentationRendered: false,
    beforeXMLLoadingDone: false,
    xmlLoaded: false,
    xmlParsed: false,
    presentationStarted: false,
    hasError: false,
    kalturaLoaded: false,
    alreadyResized: false,
    
    // videojs
    playbackrate: 1,
    
    // google analytics variables
    gaTimeouts: {
        start: null,
        halfway: null,
        completed: null
    },
    
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
            errorScreen: '#sbplus_error_screen',
            widget: '#sbplus_widget',
            media: '#sbplus_media_wrapper',
            mediaContent: '#sbplus_media_wrapper .sbplus_media_content',
            mediaError: '#sbplus_media_wrapper .sbplus_media_error',
            mediaMsg: '#sbplus_media_wrapper .sbplus_media_msg',
            leftCol: '#sbplus_left_col',
            sidebar: '#sbplus_right_col',
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
            downloadMenu: '#sbplus_download_btn .menu-parent .downloadFiles',
            author: '#sbplus_author_name',
            menu: '#sbplus_menu_btn',
            menuClose: '#sbplus_menu_close_btn',
            next: '#sbplus_next_btn',
            prev: '#sbplus_previous_btn',
            mobileTocToggle: '#mobile_toc_toggle_btn'
        };
        
        // set HTML menu classes and IDs
        this.menu = {
            menuList: '#sbplus_menu_btn_wrapper .menu',
            menuContentList: '#menu_item_content .menu',
            menuBarTitle: '#menu_item_content .sbplus_menu_title_bar .title',
            menuContentWrapper: '#menu_item_content',
            menuContent: '#menu_item_content .content',
            menuSavingMsg: '#save_settings'
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
                    $( self.layout.wrapper ).html( "<div class=\"sbplus-core-error\"><h1><strong>Storybook Plus Error</strong></h1><p>The manifest.json file may be missing in the app\'s source directory, or it may contains errors.</P></div>" );
                    return;

                }
                
                // set the JSON data to the class manifest object
                self.manifest = JSON.parse( response.responseText );
                self.manifestLoaded = true;

                // set an event listener to unload all session storage on HTML
                // page refresh/reload or closing
                $( window ).on( 'unload', self.removeAllSessionStorage.bind( self ) );
                
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
            $( self.layout.wrapper ).addClass( 'loaded-in-iframe' );
        }
        
        if ( self.manifestLoaded ) {
            
            // set the template URL for the sbplus.tpl file
            const templateUrl = self.manifest.sbplus_root_directory + 'scripts/templates/sbplus.tpl';
            
            // AJAX call and load the sbplus.tpl template
            $.get( templateUrl, function( data ) {
                
                // output the template date to the HTML/DOM
                $( self.layout.wrapper ).html( data );
                
                // set an event listener to resize elements on viewport resize
                $( window ).on( 'resize', self.resize.bind( self ) );
                
                // show support error is any
                if ( self.checkForSupport() === 0 ) {
                    self.hasError = true;
                    self.showErrorScreen( 'support' );
                    return false; // EXIT & STOP FURTHER SCRIPT EXECUTION
                }
                
                // execute tasks before loading external XML data
                self.beforeXMLLoading();
                
                // load the data from the external XML file
                self.loadXML();
                
            } ).fail( function() { // when fail to load the template
                
                // display the error message to the HTML page
                $( self.layout.wrapper ).html( "<div class=\"sbplus-core-error\"><h1><strong>Storybook Plus Error</strong></h1><p>Failed to load template. Expecting template file located at " + this.url + ".</p></div>" );
                
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
            $( '#copyright-footer .copyright-year' ).html( date.getFullYear() );
            $( '#copyright-footer .notice' ).html( self.manifest.sbplus_copyright_notice );
            
        }
         
     }, // end set copyright function

    /**
     * get the program logo
     **/
    getLogo: function() {

        const self = this;

        // if the logo repo is not specified in the manifest
        // use the player's logo (sources/images/logo.svg) and exit
        if ( self.isEmpty ( self.manifest.sbplus_logo_directory ) ) {

            self.setLogo( self.logo );
            return;

        }

        /* if logo repo is specified in the manifest */
        
        // check to see if a program is specified in the XML
        // otherwise use the default program specified in the manifest
        const program = self.isEmpty( self.xml.setup.program ) ? self.manifest.sbplus_program_default: self.xml.setup.program;

        // if program is still empty
        // use the player's logo (sources/images/logo.svg) and exit
        if ( self.isEmpty( program ) ) {

            self.setLogo( self.logo );
            return;

        }

        /* if program is specified in the XML/manifest, attempt to get it */

        const originLogo = self.logo; // hold the original logo path
        self.logo = self.manifest.sbplus_logo_directory + program + '.svg'; // update the logo path

        self.requestedFileExists( self.logo, response => {

            // if not found logo repo; set logo back to original
            if ( !response ) {
                self.logo = originLogo;
            }

            self.setLogo( self.logo );

        } );

    },

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
        $( self.loadingScreen.logo ).html( '<img src="' + path + '" />' );

        // set logo on splash screen
        const splashLogo = document.querySelector( self.splash.logo );
        const logo = document.createElement( 'img' );
        
        logo.src = path;
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

            $.get( accentUrl, ( data ) => {

                let accentCssModified = data;

                accentCssModified = accentCssModified.replace( /--var-accent/gi, self.xml.settings.accent );
                accentCssModified = accentCssModified.replace( /--var-hover/gi, hover );
                accentCssModified = accentCssModified.replace( /--var-textColor/gi, textColor );
                accentCssModified = accentCssModified.replace( /--var-markerColor/gi, markerColor );

                // append the style/css to the HTML head
                $( "head" ).append('<style type="text/css">' + accentCssModified + "</style>");

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
                    const item = '<li tabindex="-1" role="menuitem" aria-live="polite" class="menu-item sbplus_' + sanitizedName + '"><a href="javascript:void(0);" onclick="SBPLUS.openMenuItem(\'sbplus_' + sanitizedName + '\');"><span class="icon-' + sanitizedName + '"></span> ' + name + '</a></li>';
                    
                    // append the HTML LI tag to the menu list
                    $( self.menu.menuList ).append( item );
                    
                }
                
            }
            
            // append/display the menu list to inner menu list
            $( self.menu.menuContentList ).html( $( self.menu.menuList ).html() );
            
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
            $.get( self.xmlPath, function( data ) {
                
                self.xmlLoaded = true;
                
                // call function to parse the XML data
                // SHOULD BE THE LAST TASK TO BE EXECUTED IN THIS BLOCK
                self.parseXMLData( data );
                
            } ).fail( function( res, status ) { // when fail to load XML file
                
                // set error flag to true
                self.hasError = true;
                
                // display appropriate error message based on the status
                if ( status === 'parsererror' ) {
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
            
            // set the parameter as jQuery set
            const data = $( d );
            
            // set data from the XML to respective variables
            let xSb = data.find( 'storybook' );
            let xSetup = data.find( 'setup' );
            let xAccent = self.trimAndLower( xSb.attr( 'accent' ) );
            let xImgType = self.trimAndLower( xSb.attr( 'pageImgFormat' ) );
            let xSplashImgType = 'svg';
            let xAnalytics = self.trimAndLower( xSb.attr( 'analytics' ) );
            let xMathjax = '';
            let xVersion = xSb.attr( 'xmlVersion' );
            let xProgram = '';
            let xCourse = self.trimAndLower( xSetup.attr( 'course' ) );
            let xTitle = self.noScript( xSetup.find( 'title' ).text().trim() );
            let xSubtitle = self.noScript( xSetup.find( 'subtitle' ).text().trim() );
            let xLength = xSetup.find( 'length' ).text().trim();
            let xAuthor = xSetup.find( 'author' );
            let xGeneralInfo = self.getTextContent( xSetup.find( 'generalInfo' ) );
            let xSections = data.find( 'section' );
            
            // variable to hold temporary XML value for further evaluation
            let splashImgType_temp = xSb.attr( 'splashImgFormat' );
            let program_temp = xSetup.attr( 'program' );
            
            // if temporary splash image type is defined...
            if ( splashImgType_temp ) {
                
                // and if it is not empty...
                if ( !self.isEmpty( splashImgType_temp ) ) {
                    
                    // set the splash image type to the temporary value
                    xSplashImgType = self.trimAndLower( splashImgType_temp );
                    
                }
                
            }
            
            // if program temporary is defined
            if ( program_temp ) {
                
                // set the program to the temporary value
                xProgram = self.trimAndLower( program_temp );
                
            }
            
            // if accent is empty, set the accent to the value in the manifest

            if ( self.isEmpty( xAccent ) ) {
                xAccent = self.manifest.sbplus_default_accent;
            }
            
            // if image type is empty, default to jpg
            if ( self.isEmpty( xImgType ) ) {
                xImgType = 'jpg';
            }
            
            // if analytic is not on, default to off
            if ( xAnalytics !== 'on' && xAnalytics !== 'true' ) {
                xAnalytics = 'off';
            }
            
            // if mathjax is not found or empty
            if ( self.isEmpty( xSb.attr( 'mathjax' ) ) ) {
                
                // default to off
                xMathjax = 'off';
                
            } else {
                
                // value in mathjax attribute is on, set to on
                if ( self.trimAndLower( xSb.attr( 'mathjax' ) ) === 'on' || self.trimAndLower( xSb.attr( 'mathjax' ) ) === 'true' ) {
                    xMathjax = 'on';
                }
                
            }
            
            // set the parsed data to the class XML object variable
            self.xml = {
                settings: {
                    accent: xAccent,
                    imgType: xImgType,
                    splashImgType: xSplashImgType,
                    analytics: xAnalytics,
                    mathjax: xMathjax,
                    version: xVersion
                },
                setup: {
                    program: xProgram,
                    course: xCourse,
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
            
            self.getAuthorProfile(); // get author profile
            self.setAccent(); // set accent color
            self.getLogo(); // get program logo
            self.setCopyright(); // set the copyright info
            self.preloadPresentationImages(); // preload images
            
            // if mathjax if turned on
            if (self.xml.settings.mathjax === "on" || self.xml.settings.mathjax === "true") {
                // load the MathJAX script from a CDN
                $.getScript("https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-MML-AM_CHTML", function () {
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
            
            // if analytics is on, get and set Google analytics tracking
            if ( !self.isEmpty( self.manifest.sbplus_google_tracking_id ) && ( self.xml.settings.analytics === 'on' || self.xml.settings.analytics === 'true' ) ) {

                /* Google Analytics gtag.js */
                const head = document.getElementsByTagName( 'head' )[0];
                const gtagScript = document.createElement( 'script' );

                gtagScript.type = "text/javascript";
                gtagScript.setAttribute( 'async', true );
                gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + self.manifest.sbplus_google_tracking_id;

                head.appendChild( gtagScript );

                /* Google Tag Manager */
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','GTM-NT3HHS5');
                
                const noscript = document.getElementsByTagName( 'noscript' )[0];
                const gtagIframe = document.createElement( 'iframe' );

                gtagIframe.src = 'https://www.googletagmanager.com/ns.html?id=GTM-NT3HHS5';
                gtagIframe.width = 0;
                gtagIframe.height = 0;
                gtagIframe.style.display = 'none';
                gtagIframe.style.visibility = 'hidden';

                noscript.appendChild( gtagIframe );

                /* Google Analytics */
                function gtag(){
                    const dataLayer = window.dataLayer = window.dataLayer || [];
                    dataLayer.push(arguments);
                }

                gtag('js', new Date());
                gtag('config', self.manifest.sbplus_google_tracking_id);

            }

            /* finished setup; ready to render the splash screen */

            self.renderSplashscreen();
            
        }
        
    }, // end parseXMLData function

    /**
     * Set author profile from centralized repo if applicable
     **/

    getAuthorProfile: function() {

        const self = this;

        if ( self.xmlLoaded && typeof self.xml.setup.author !== "object" ) {
            return;
        }

        if ( self.xml.setup.author.length ) {
                
            // set author name and path to the profile to respective variable
            const sanitizedAuthor = self.sanitize( self.xml.setup.author.attr( 'name' ).trim() );
            const profileUrl = self.manifest.sbplus_author_directory + sanitizedAuthor + '.json';
            const profileInXml = self.getTextContent( self.xml.setup.author );
            
            self.xml.setup.author = self.xml.setup.author.attr( 'name' ).trim();
            self.xml.setup.profile = profileInXml;

            if ( self.isEmpty( profileInXml ) && !self.isEmpty( self.manifest.sbplus_author_directory ) && !self.isEmpty( sanitizedAuthor ) ) {

                self.requestFile( profileUrl, response => {

                    if ( response ) {

                        const data = JSON.parse( response.responseText );

                        self.xml.setup.author = data.name;
                        self.xml.setup.profile = self.noScript( data.profile );

                        if ( self.splashScreenRendered ) {
                            $( self.splash.author ).html( self.xml.setup.author );
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
            $( document ).attr( "title", self.xml.setup.title );

            // display data to the splash screen
            $( self.splash.title ).html( self.xml.setup.title );
            $( self.splash.subtitle ).html( self.xml.setup.subtitle );
            $( self.splash.author ).html( self.xml.setup.author );
            $( self.splash.duration ).html( self.xml.setup.duration );

            // set event listener to the start button
            $( self.button.start ).on( "click", self.startPresentation.bind(self) );

            // if local storage has a value for the matching presentation title
            if ( self.hasStorageItem( "sbplus-" + self.presentationId ) ) {

                // set event listener to the resume button
                $( self.button.resume ).on( "click", self.resumePresentation.bind(self) );

            } else {

                // hide the resume button
                $( self.button.resume ).hide( 0, function() {
                    $( self ).attr( "tabindex", "-1" );
                } );

            }

            self.determineSplashImage();  // get the splash image
            self.determineDownloadableFiles(); // get and set any downloadable files
            self.splashScreenRendered = true; // flag the splash screen as rendered
            self.showSplashScreen(); // show the splash screen
            self.resize(); // "refresh the UI"
            self.sendToGA( "splash_screen_view", self.getCourseDirectory() + " - splash" ); // send splash screen loaded event to GA
            self.scheduleOnlineStatusCheck(); // schedule online connectivity status check

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
                    $ ( "html" ).addClass( "dark-mode" );
                    break;
                case "auto":
                    $ ( "html" ).addClass( "auto-mode" );

                    self.applyAutoColorMode();

                    break;
                default:
                    $( "html" ).removeClass( ["auto-mode", "dark-mode"] );
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
            $( self.layout.wrapper ).addClass( "sbplus_autoplay_on" );
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
                   with the provided program and course values from the XML */

                // first, if splash directory is not specified in the manifest, no image and exit
                if ( self.isEmpty( self.manifest.sbplus_splash_directory ) ) {
                    self.setSplashImage( "" );
                    return;
                }

                // otherwise, continue...
                const program = self.isEmpty( self.xml.setup.program ) ? self.manifest.sbplus_program_default : self.xml.setup.program;
                const course = self.isEmpty( self.xml.setup.course ) ? "" : "/" + self.xml.setup.course;

                // if program is still empty, no image and exit
                if ( self.isEmpty( program ) ) {

                    self.setSplashImage( "" );
                    return;

                }

                // otherwise, attempt to get the image from server
                let serverSplashImgUrl = self.manifest.sbplus_splash_directory;

                if ( self.isEmpty( course ) ) {
                    serverSplashImgUrl += program + "/" + program + "." + self.xml.settings.splashImgType;
                } else {
                    serverSplashImgUrl += program + course + "." + self.xml.settings.splashImgType
                }
                
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
                
                $( self.splash.background ).css( 'background-image', 'url(' + img.src + ')' );

            }

        } );
        
    },

    /**
     * Show the splash screen
     **/
    showSplashScreen: function() {

        const self = this;

        $( self.splash.infoBox ).show();

        setTimeout( () => {

            $( self.loadingScreen.wrapper ).addClass( "fadeOut" ).one( 'webkitAnimationEnd mozAnimationEnd animationend', function() {
                
                $( this ).off();
                $( this ).removeClass( 'fadeOut' ).hide();

            } );
            
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
            $( self.splash.screen ).addClass( 'fadeOut' ).one( 'webkitAnimationEnd mozAnimationEnd animationend', function() {

                    $( this ).removeClass( 'fadeOut' ).hide();
                    $( this ).off();

                }
            );
            
        }
        
    },

    /**
     * Get and set the downloadable files that are available
     **/
    determineDownloadableFiles: function() {

        const self = this;

        // set downloadable file name from the course directory name in URL
        let fileName = self.getCourseDirectory().replace( ".sbproj", "" );

        // if file name is empty, default to 'sbplus'
        if ( self.isEmpty( fileName ) ) {
            fileName = "sbplus";
        }

        // load each supported downloadable files specified in the manifest
        self.manifest.sbplus_download_files.forEach( function( file ) {

            $.ajax( {

                url: self.extractAssetsRoot( self.xmlPath ) + fileName + "." + file.format,
                type: "HEAD",

             } ).done( function() {

                const fileLabel = file.label.toLowerCase();

                self.downloads[fileLabel] = { fileName: fileName, fileFormat: file.format, url: this.url };

                $( self.splash.downloadBar ).append('<a href="' + this.url + '" tabindex="1" download="' + fileName + "." + file.format + '" aria-label="Download ' + fileLabel + ' file" class="sbplus-download-link"><span class="icon-download"></span>' + file.label + "</a>");

            } ).always( function () {

                if ( Object.keys( self.downloads ).length <= 0 ) {

                    $(self.splash.cta).addClass("no_downloads");

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

            $( xmlSections ).each( function()  {

                $( this ).find( 'page' ).each( function () {

                    const type = $( this ).attr( 'type' );

                    switch ( type ) {

                        case 'bundle': {

                            const src = $ ( this ).attr( 'src' );
                            const bundleSrc = [];

                            bundleSrc.push( src + '-' + (1) );

                            $( this ).find( 'frame' ).each( function ( i ) {
                                bundleSrc.push( src + '-' + (i + 2) );
                            } );

                            srcArray = srcArray.concat( bundleSrc );
                            break;

                        }
                        case 'image':
                        case 'image-audio': {
                            const src = $( this ).attr( 'src' );
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
                linkObj.setAttribute( 'aria-hidden', true );
                linkObj.style = "position: fixed; width: 1px; height: 1px; opacity: 0;";

                document.getElementsByTagName( "body" )[0].appendChild( linkObj );
                
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
            self.renderPresentation().promise().done( function() {
                
                // hide splash screen
                self.hideSplashScreen();
                
                // select the first page
                self.selectPage( '0,0' );
                self.presentationStarted = true;
                self.sendToGA( 'presentation_screen_view', self.getCourseDirectory() );
                
            } );
            
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
            self.renderPresentation().promise().done( function() {
                
                // hide screen
                self.hideSplashScreen();
                
                // select the page that was set in the local storage data
                self.selectPage( self.getStorageItem( 'sbplus-' + self.presentationId ) );
                
            } );
            
            self.presentationStarted = true;
            self.sendToGA( 'presentation_screen_view', self.getCourseDirectory() );
            
        }
        
    },
    
    /**
     * Render the presentation (after the hiding the splash screen)
     **/
    renderPresentation: function() {

        const self = this;
        
        if ( self.presentationRendered === false ) {
            
            // remove focus (from the hidden elements)
            $( self.layout.sbplus ).blur();
            
            // display presentation title and author to the black banner bar
            $( self.banner.title ).html( self.xml.setup.title );
            $( self.banner.author ).html( self.xml.setup.author );
            
            // display table of contents
            $( self.xml.sections ).each( function( i ) {
                
                // set section head title
                let sectionHead = $( this ).attr( 'title' );
                
                // set page array data
                const pages = $( this ).find( 'page' );
                
                // set section HTML DOM
                let sectionHTML = '<div class="section">';
                
                // if there is more than 2 sections...
                if ( $( self.xml.sections ).length >= 2 ) {
                    
                    // if sectionHead title is empty, set a default title
                    if ( self.isEmpty( sectionHead ) ) {
                        sectionHead = 'Section ' + ( i + 1 );
                    }
                    
                    // append section head HTML to DOM
                    sectionHTML += '<div class="header">';
                    sectionHTML += '<div class="title">';
                    sectionHTML += sectionHead +'</div>';
                    sectionHTML += '<div class="icon"><span class="icon-collapse"></span></div></div>';
                    
                }
                
                // append pages (opening list tag) HTML to DOM
                sectionHTML += '<ul class="list">';
                
                // for each page
                $.each( pages, function( j ) {
                    
                    // increment total page
                    ++self.totalPages;
                    
                    const pageType = $( this ).attr( 'type' );

                    // append opening list item tag to DOM
                    sectionHTML += '<li class="item" data-count="';
                    sectionHTML += self.totalPages + '" data-page="' + i + ',' + j + '">';
                    
                    // if page is quiz
                    if ( pageType === 'quiz' ) {
                        
                        // append an quiz icon
                        sectionHTML += '<span class="icon-assessment"></span>';
                        
                    } else {
                        
                        // append a count number
                        sectionHTML += '<span class="numbering">' + self.totalPages + '.</span> ';
                        
                    }
                    
                    // append page title and close the list item tag
                    sectionHTML += $( this ).attr( 'title' ) + '</li>';
                    
                } );
                
                // appending closing list and div tag
                sectionHTML += '</ul></div>';
                
                // append the section HTML to the table of content DOM area
                $( self.tableOfContents.container ).append( sectionHTML );
                
            } );
            
            // set total page to the status bar and to the screen reader text holder
            $( self.layout.pageStatus ).find( 'span.total' ).html( self.totalPages );
            $( self.screenReader.totalPages ).html( self.totalPages );
            
            // if author is missing hide author button and menu item
            if ( self.xml.setup.author.length ) {
                
                $( self.button.author ).on( 'click', function() {
                    self.openMenuItem( 'sbplus_author_profile' );
                } );
                
            } else {
                
                $( self.button.author ).prop( 'disabled', true );
                $( '.sbplus_author_profile' ).hide();
                
            }
            
            $( self.button.next ).on( 'click', self.goToNextPage.bind( self ) );
            $( self.button.prev ).on( 'click', self.goToPreviousPage.bind( self ) );
            $( self.button.mobileTocToggle).on( 'click', self.toggleToc.bind(self) );
            
            if ( $( self.xml.sections ).length >= 2 ) {
                $( self.tableOfContents.header ).on( 'click', self.toggleSection.bind( self ) );
            }
            
            $( self.tableOfContents.page ).on( 'click', self.selectPage.bind( self ) );
            $( self.widget.segment ).on( 'click', 'button', self.selectSegment.bind( self ) );
            
            // add main menu button
            self.layout.mainMenu = new MenuBar( $( self.button.menu )[0].id, false );
            
            // hide general info under main menu if empty
            if ( self.isEmpty( self.xml.setup.generalInfo ) ) {

                $( ".sbplus_general_info" ).hide();

            }
            
            // add download button if downloads object is not empty
            if ( !$.isEmptyObject( self.downloads ) ) {
                
                self.layout.dwnldMenu = new MenuBar( $( self.button.download )[0].id, false );
                
                // set download items
                for ( let key in self.downloads ) {
                    
                    if ( self.downloads[key] != undefined ) {
                        $( self.button.downloadMenu ).append(
                            '<li class="menu-item" tabindex="-1" role="menuitem" aria-live="polite"><a download="' + self.downloads[key].fileName + '.' + self.downloads[key].fileFormat + '" href="'
                            + self.downloads[key].url +
                            '" class="sbplus-download-link">' + self.capitalizeFirstLetter( key ) + '</a></li>'
                        );
                    }
                    
                }
                
            } else {
                
                // hide the download button if download object is empty
                $( self.button.downloadWrapper ).hide();
            
            }
            
            // queue MathJAX if turned on
            if ( self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true' ) {
                MathJax.Hub.Queue( ['Typeset', MathJax.Hub] );
            }
            
            // easter egg event listener
            $( "#sbplus_menu_btn .menu-parent" ).on( 'click', self.burgerBurger.bind( self ) );
            
            this.presentationRendered = true;
            
            // resize elements after everything is put in place
            self.resize();
            
            return $( self.layout.sbplus );
            
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
        const currentPage = $( '.sb_selected' ).data( 'page' ).split(',');
        
        // set section number
        let tSection = Number( currentPage[0] );
        
        // set page number
        let tPage = Number( currentPage[1] );
        
        // set total section
        const totalSections = self.xml.sections.length;
        
        // set total page in current section
        const totalPagesInSection = $( self.xml.sections[tSection] ).find( 'page' ).length;
        
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
        const currentPage = $( '.sb_selected' ).data( 'page' ).split(',');
        
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
            tPage = $( self.xml.sections[tSection] ).find( 'page' ).length - 1;
            
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
        const sbplusWrapper = $( self.layout.wrapper );

        if ( sbplusWrapper.hasClass( 'toc_displayed' ) ) {

            $( self.tableOfContents.container ).css( 'height', '' );
            sbplusWrapper.removeClass( 'toc_displayed' );
            
        } else {

            $( self.tableOfContents.container ).height( self.calcTocHeight() );
            sbplusWrapper.addClass( 'toc_displayed' );

        }

    },

    /**
     * Calculate the table of content height dynamically
     **/
    calcTocHeight: function() {

        const self = this;
        return window.innerHeight - ( $( self.banner.bar ).height() + $( self.layout.media ).height() + $( self.layout.mainControl ).height() );

    },
    
    /**
     * Update Page Status (or the status bar) next to the page controls
     **/
    updatePageStatus: function( num ) {
        
        const self = this;

        // display current page number to the status
        $( self.layout.pageStatus ).find( 'span.current' ).html( num );
        
    }, // end updatePageStatus function
    
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
        const totalHeaderCount = $( this.tableOfContents.header ).length;
        
        // if total number of section is greater than 1...
        if ( totalHeaderCount > 1 ) {
            
            // declare a variable to hold current targeted section
            let targetSectionHeader;
            
            // if the object is an click event object
            if ( el instanceof Object ) {
                
                // set the current section to the current event click target
                targetSectionHeader = $( el.currentTarget );
                
            } else {
                
                // if argument is greater than total number of sections
                if ( Number( el ) > totalHeaderCount - 1 ) {
                    
                    // exit function
                    return false;
                    
                }
                
                // set the current section to the passed argument
                targetSectionHeader = $( '.header:eq(' + el + ')' );
                
            }
            
            // if target is visible...
            if ( $( targetSectionHeader.siblings( '.list' ) ).is( ':visible' ) ) {
                
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
        const target = $( obj.siblings( '.list' ) );
        
        // the open/collapse icon on the section title bar
        const icon = obj.find( '.icon' );
        
        // slide up (hide) the list
        target.slideUp();
            
        // update the icon to open icon
        icon.html( '<span class="icon-open"></span>' );
         
     },
     
     /**
     * Open specified table of content section
     * @param object
     **/
     
     openSection: function( obj ) {
        
        // set the target to the list element under the section
        const target = $( obj.siblings( '.list' ) );
        
        // the open/collapse icon on the section title bar
        const icon = obj.find( '.icon' );
        
        // slide down (show) the list
        target.slideDown();
        
        // update the icon to collapse icon
        icon.html( '<span class="icon-collapse"></span>' );
         
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
            self.targetPage = $( el.currentTarget );
            
        } else {
            
            // set target to the passed in argument
            self.targetPage = $( '.item[data-page="' + el + '"]' );
            
            // if targe page does not exist
            if ( self.targetPage.length === 0 ) {
                
                // exit function; stop further execution
                return false;
            }
            
        }
        
        // if target page does not have the sb_selected class
        if ( !self.targetPage.hasClass( 'sb_selected' ) ) {
            
            // get jQuery set that contain pages
            const allPages = $( self.tableOfContents.page );
            
            // get jQuery set that contain section headers
            const sectionHeaders = $( self.tableOfContents.header );
            
            // if more than one section headers...
            if ( sectionHeaders.length > 1 ) {
                
                // set the target header to targeted page's header
                const targetHeader = self.targetPage.parent().siblings( '.header' );
                
                // if targeted header does not have the current class
                if ( !targetHeader.hasClass( 'current' ) ) {
                    
                    // remove current class from all section headers
                    sectionHeaders.removeClass( 'current' );
                    
                    // add current class to targeted header
                    targetHeader.addClass( 'current' );
                    
                }
                
                self.openSection( targetHeader );
                
            }
            
            // remove sb_selected class from all pages
            allPages.removeClass( 'sb_selected' );
            
            // add sb_selected class to targeted page
            self.targetPage.addClass( 'sb_selected' );
            
            // call the getPage function with targeted page data as parameter
            self.getPage( self.targetPage.data('page') );
            
            // update the page status with the targeted page count data
            self.updatePageStatus( self.targetPage.data( 'count' ) );
            
            // update screen reader status
            $( self.screenReader.currentPage ).html( self.targetPage.data( 'count' ) );
            
            // update the scroll bar to targeted page
            if ( $( self.layout.sidebar ).is( ':visible' ) ) {
                
                self.updateScroll( self.targetPage[0] );
                
            }

            // hide table of content in mobile view
            if ( $( self.layout.wrapper ).hasClass( 'toc_displayed' ) ) {
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

        // split the page value into an array
        page = page.split( ',' );
        
        // set section to page array index 0
        const section = page[0];
        
        // set item to page array index 1
        const item = page[1];
        
        // get and set target based on the section and item variable
        const target = $( $( self.xml.sections[section] ).find( 'page' )[item] );
        
        // create a pageData object to hold page title and type
        const pageData = {
            xml: target,
            title: target.attr( 'title' ).trim(),
            type: target.attr( 'type' ).trim().toLowerCase()
        };
        
        // set number property to the pageData object
        pageData.number = page;
        
        // if page type is not quiz
        if ( pageData.type !== 'quiz' ) {
            
            // add/set additional property to the pageData object
            pageData.src = target.attr( 'src' ).trim();
            
            // check for preventAutoplay attribute
            
            if ( target.attr( 'preventAutoplay' ) != undefined ) {
                pageData.preventAutoplay = target.attr( 'preventAutoplay' ).trim();
            } else {
                pageData.preventAutoplay = "false";
            }

            // check for defaultPlayer attribute if it is youtube or vimeo
            if ( target.attr( 'useDefaultPlayer' ) !== undefined ) {
                pageData.useDefaultPlayer = target.attr( 'useDefaultPlayer' ).trim();
            } else {
                pageData.useDefaultPlayer = "true";
            }
            
            // if there is a note tag, set notes
            if ( target.find( 'note' ).length ) {
                
                pageData.notes = self.getTextContent( target.find( 'note' ) );
                
            }
            
            pageData.widget = target.find( 'widget' );

            if ( target.find( 'copyableContent' ).length ) {
                pageData.copyableContent = target.find( 'copyableContent' );
            }

            pageData.frames = target.find( 'frame' );
            pageData.imageFormat = self.xml.settings.imgType;
            pageData.transition = target[0].hasAttribute( 'transition' ) ? 
                target.attr( 'transition' ).trim() : '';

            if ( pageData.type !== 'image' ) {
                pageData.markers = target.find( 'markers' );
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
        $( self.screenReader.pageTitle ).html( pageData.title );
        
    }, // end getPage function
    
    /**
     * Updating the table of content's scroll bar position
     * @param object
     **/
    updateScroll: function( obj ) {
        
        const self = this;

        // set the obj from the parameter
        let target = obj;
        
        // if the target is not visible
        if ( !$( target ).is( ':visible' ) ) {
            
            // target its parent's siblings
            target = $( target ).parent().siblings( '.header' )[0];
            
        }
        
        if ( $( target ).data( "page" ) == "0,0" ) {
            
            if ( $( target ).parent().prev().length ) {
                
                $( $( target ).parent().prev() )[0].scrollIntoView( { behavior: 'smooth', block: 'end' } );
                
            } else {
                
                target.scrollIntoView( { behavior: 'smooth', block: 'end' } );
                
            }
            
            return;
        }
        
        // get/set the scrollable height
        const scrollHeight = $( self.tableOfContents.container ).height();
        const targetHeight = $( target ).outerHeight();
        const sectionHeaders = $( self.tableOfContents.header );
        let targetTop = $( target ).offset().top - targetHeight;
        
        if ( sectionHeaders.length <= 0 ) {
            targetTop += 40;
        }
        
        if ( targetTop > scrollHeight ) {
            target.scrollIntoView( { behavior: 'smooth', block: 'end' } );
        }
        
        if ( targetTop < targetHeight ) {
            
            target.scrollIntoView( { behavior: 'smooth' } );
            
        }
        
    }, // end updateScroll function
    
    /**************************************************************************
        MENU FUNCTIONS
    **************************************************************************/
    
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
        const menuContentWrapper = $( self.menu.menuContentWrapper );
        const menuContent = $( self.menu.menuContent );
        const menuTitle = $( self.menu.menuBarTitle );
        
        menuContent.empty();
        
        $( self.menu.menuContentList + ' li' ).removeClass( 'active' );
        $( self.menu.menuContentList + ' .' + itemId ).addClass( 'active' );
        
        switch ( itemId ) {
                    
            case 'sbplus_author_profile':
            
                menuTitle.html( 'Author Profile' );
                
                if ( self.xml.setup.author.length ) {
                    
                    menuContent.append( '<div class="profileImg"></div>' );
                    
                    const author = self.xml.setup.author;
                    const sanitizedAuthor = self.sanitize( author );

                    const photoUrl = self.assetsPath + sanitizedAuthor + '.jpg';

                    $.ajax( {
                
                        type: 'HEAD',
                        url: photoUrl
                        
                    } ).done( function() {
                        
                        $( '.profileImg' ).html( '<img src="' + this.url + '" alt="Photo of ' + author + '" crossorigin="Anonymous" />' );
                        
                    } ).fail( function() {
                        
                        if ( !self.isEmpty( self.manifest.sbplus_author_directory ) ) {

                            $.ajax( {
                            
                                type: 'HEAD',
                                url: self.manifest.sbplus_author_directory + sanitizedAuthor + '.jpg'
                            
                            } ).done( function() {
                                
                                $( '.profileImg' ).html( '<img src="' + this.url + '" alt="Photo of ' + author + '" crossorigin="Anonymous" />' );
                                
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

                menuTitle.html( 'General Info' );
                
                if ( self.isEmpty( self.xml.setup.generalInfo ) ) {
                    content = 'No general information available.';
                } else {
                    content = self.xml.setup.generalInfo;
                }
            
            break;
            
            case 'sbplus_settings':
                
                menuTitle.html( 'Settings' );
                
                if ( Modernizr.localstorage && Modernizr.sessionstorage ) {
                    
                    if ( self.hasStorageItem( 'sbplus-' + self.presentationId + '-settings-loaded', true ) === false ) {
                    
                        $.get( self.manifest.sbplus_root_directory + 'scripts/templates/settings.tpl', function( data ) {
                        
                            self.settings = data;
                            self.setStorageItem( 'sbplus-' + self.presentationId + '-settings-loaded', 1, true );
                            menuContent.append( data );
                            self.afterSettingsLoaded();
                            
                        } );
                        
                    } else {
                        
                        menuContent.append( self.settings );
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
                        menuTitle.html( customMenuItems[key].name );
                        content = customMenuItems[key].content;
                        break;
                    }

                }
            break;
            
        }
        
        menuContentWrapper.show();
        menuContent.append( content );
        
        $( self.button.menuClose ).on( 'click', self.closeMenuContent.bind( self ) );
        
        if ( self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true' ) {
            MathJax.Hub.Queue( ['Typeset', MathJax.Hub] );
        }
            
    },
    
    /**
     * Close the menu and its content
     **/
    closeMenuContent: function() {
        
        const self = this;
        const menuContentWrapper = $( self.menu.menuContentWrapper );
        const menuContent = $( self.menu.menuContent );
        
        menuContent.empty();
        menuContentWrapper.hide();
        
        $( this.button.menuClose ).off( 'click' );
        
    },
    
    /**
     * an easter egg to change the menu icon to a hamburger emoji
     **/
    burgerBurger: function() {
        
        const self = this;
        const menuIcon = $( 'span.menu-icon' );
            
        self.clickCount++;
        
        if ( self.clickCount === self.randomNum ) {
            menuIcon.removeClass('icon-menu').html('🍔');
            self.clickCount = 0;
            self.randomNum = Math.floor((Math.random() * 6) + 5);
        } else {
            menuIcon.addClass('icon-menu').empty();
        }
        
    },
    
    /**************************************************************************
        WIDGET FUNCTIONS
    **************************************************************************/

    /**
     * clear the widget area
     **/
    clearWidget: function() {

        const self = this;
        $( self.widget.segment ).empty();
        $( self.widget.content ).empty();

    },
    
     /**
     * determine if the widget has content
     **/
    hasWidgetContent: function() {
        
        const self = this;
        return $( self.widget.segment ).find( 'button' ).length;
        
    },
    
    /**
     * select the tabs in the widget area
     * @param any
     **/
    selectSegment: function( el ) {
        
        const self = this;
        const button = $( self.widget.segment ).find( 'button' );
        
        if ( self.hasWidgetContent() ) {
            
            $( self.layout.widget ).removeClass('noSegments');
            $( self.widget.content ).css( 'background-image', '' );
            $( self.screenReader.hasNotes ).html( 'This page contains notes.' );
            $( self.button.notes ).prop( 'disabled', false );
            $( self.button.notes ).attr( 'title', 'View Notes' );
            $( self.button.notes ).attr( 'aria-label', 'View Notes' );

            $( self.button.notes ).on( 'click', function() {

                const secControlExpandedBtn = document.querySelector( '#expand_contract_btn' );

                if ( secControlExpandedBtn && secControlExpandedBtn.classList.contains( 'expanded' ) ) {
                    secControlExpandedBtn.classList.remove( 'expanded' );
                }

                if ( self.currentPage.mediaPlayer && self.currentPage.mediaPlayer.hasClass( 'sbplus-vjs-expanded' ) ) {
                    self.currentPage.mediaPlayer.removeClass( 'sbplus-vjs-expanded' );
                }

                document.querySelector( self.layout.sbplus ).classList.remove( 'sbplus-vjs-expanded' );
        
            } );
            
            let target = '';
            let targetId = '';
            
            if ( typeof el === 'string' ) {
                target = $( '#' + el );
                targetId = el;
            } else {
                target = $( el.currentTarget );
                targetId = target[0].id;
            }
            
            if ( !target.hasClass( 'active' ) ) {
                self.currentPage.getWidgetContent( targetId );
                button.removeClass( 'active' );
                target.addClass( 'active' );
            }
            
            if ( self.xml.settings.mathjax === 'on' || self.xml.settings.mathjax === 'true' ) {
                MathJax.Hub.Queue( ['Typeset', MathJax.Hub] );
            }
            
        } else {
            
            $( self.screenReader.hasNotes ).empty();
            $( self.layout.widget ).addClass('noSegments');
            $( self.button.notes ).prop( 'disabled', true );
            $( self.button.notes ).attr( 'title', '' );
            $( self.button.notes ).attr( 'aria-label', '' );

            // show logo
            if ( !self.isEmpty( self.logo ) ) {

                $( self.widget.content ).css( 'background-image', 'url(' + self.logo + ')' );

            }
            
        }
        
    },
    
    /**
     * select the first tab in the widget area
     **/
    selectFirstSegment: function() {
        
        const self = this;
        const button = $( self.widget.segment ).find( 'button' )[0];
        const target = $( button ).attr( 'id' );
        
        self.selectSegment( target );
        
    },
    
    /**
     * add a tab to the widget area
     * @param string
     **/
    addSegment: function( str ) {
        
        const self = this;
        const btn = '<button id="sbplus_' + self.sanitize( str ) + '">' + str + '</button>';
        
        self.widget.segments.push( str );
        
        if ( str === 'Notes' ) {
            $( self.widget.segment ).prepend( btn );
        } else {
            $( self.widget.segment ).append( btn );
        }
        
    },
    
    /**
     * clear all tabs and their content
     **/
    clearWidgetSegment: function() {

        const self = this;

        $( self.widget.segment ).empty();
        $( self.widget.content ).empty();
        $( self.widget.bg ).css( 'background-image', '' );
        
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
     * check to see if the browser supports the listed features
     **/
    checkForSupport: function() {
        
        if ( Modernizr.video && Modernizr.eventlistener && Modernizr.json && Modernizr.flexbox && Modernizr.csscalc ) {
            return 1;
        }
        
        return 0;
        
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
        
            $( self.layout.sbplus ).hide();
            
            switch ( type ) {
                
                case 'support':
                    errorTemplateUrl += 'scripts/templates/support_error.tpl';
                break;
                
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
                
                $.get( errorTemplateUrl, function( data ) {
                    
                    $( self.layout.errorScreen ).html( data ).show().css( 'display', 'flex' );
                    
                } );
                
            }
            
        }
        
    },
    
     /**
     * calculate the height of the player
     **/
    calcLayout: function() {

        const self = this;

        if ( $( self.layout.wrapper ).hasClass ( 'toc_displayed' ) ) {
            $( self.tableOfContents.container ).height( self.calcTocHeight() );
        }

        if ( window.innerWidth < 900 || window.screen.width <= 414 ) {

            self.layout.isMobile = true;
            self.alreadyResized = true;
            $( self.layout.wrapper ).removeClass( 'sbplus_boxed' );

        } else {
            
            self.layout.isMobile = false;
            $( self.layout.wrapper ).addClass( 'sbplus_boxed' );
            $( self.layout.wrapper ).removeClass( 'toc_displayed');
            $( self.tableOfContents.container ).css( 'height', '' );

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
        const g = parseInt(hex.substring(2,2),16);
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

           const results = $( "<span>" +  str.trim() + "</span>" );
    
           results.find( "script,noscript,style" ).remove().end();
           
           return results.html();
    
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
        
        if ( Modernizr.localstorage || Modernizr.sessionstorage ) {
            
            if ( toSession ) {
            
                return sessionStorage.setItem( key, value );
                
            }

            return localStorage.setItem( key, value );
            
        }
        
    },
    
    /**
     * get setting values from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     **/
    getStorageItem: function( key, fromSession ) {
        
        if ( Modernizr.localstorage || Modernizr.sessionstorage ) {
            
            if ( fromSession ) {
            
                return sessionStorage.getItem( key );
                
            }

            return localStorage.getItem( key );
            
        }
        
    },
    
    /**
     * delete setting values from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     **/
    deleteStorageItem: function( key, fromSession ) {
        
        if ( Modernizr.localstorage || Modernizr.sessionstorage ) {
            
            if ( fromSession ) {
            
                return sessionStorage.removeItem( key );
                
            }

            return localStorage.removeItem( key );
            
        }
        
    },
    
    /**
     * check for setting value existence from the local or session storage
     * @param string - key
     * @param boolean - `true` for session; `false` for local
     **/
    hasStorageItem: function( key, fromSession ) {
        
        if ( Modernizr.localstorage || Modernizr.sessionstorage ) {
            
            const self = this;

            if ( fromSession ) {
            
                if ( self.isEmpty( sessionStorage.getItem( key ) ) ) {
                    return false;
                }
                
                return true;
                
            }

            if ( self.isEmpty( localStorage.getItem( key ) ) ) {
                return false;
            }
            
            return true;
            
        }
        
    },
    
    /**
     * delete all settings value in local and session storage
     **/
    removeAllSessionStorage: function() {
        
        if ( Modernizr.sessionstorage ) {
            
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
                    
                $( '#autoplay_label' ).after( '<p class="error">Mobile devices do not support autoplay.</p>' );
                $( '#sbplus_va_autoplay' ).prop( 'checked', false ).attr( 'disabled', true );
                
            }
            
            self.syncSettings();
            
            $( '.settings input, .settings select' ).on( 'change', function() {
                
                // show msg
                $( self.menu.menuSavingMsg ).fadeIn().html( 'Saving...' );

                // color mode
                window.matchMedia( "(prefers-color-scheme: dark)" ).off;

                if ( $( 'input[name="sbplus_color_mode"]:checked' ) ) {

                    const mode = $( 'input[name="sbplus_color_mode"]:checked' ).val()

                    self.setStorageItem( 'sbplus-colormode', mode );

                    switch (mode) {
                        case 'dark':
                            $( "html" ).addClass( 'dark-mode' );
                            $( "html" ).removeClass( ["auto-mode"] )
                            break;
                        case 'auto':
                            $( 'html' ).addClass( 'auto-mode' );

                            self.applyAutoColorMode();
                            break;
                        default:
                            $( "html" ).removeClass( ["auto-mode", "dark-mode"] );
                            break;
                    }

                } else {

                    self.setStorageItem( 'sbplus-colormode', 'light' );

                }
                
                // autoplay
                if ( $( '#sbplus_va_autoplay' ).is( ':checked' ) ) {
                    self.setStorageItem( 'sbplus-autoplay', 1 );
                    $( self.layout.wrapper ).addClass( 'sbplus_autoplay_on' );
                } else {
                    self.setStorageItem( 'sbplus-autoplay', 0 );
                    $( self.layout.wrapper ).removeClass( 'sbplus_autoplay_on' );
                }
                
                // subtitle
                if ( $( '#sbplus_va_subtitle' ).is( ':checked' ) ) {
                    self.setStorageItem( 'sbplus-subtitle', 1 );
                } else {
                    self.setStorageItem( 'sbplus-subtitle', 0 );
                }
                
                // volume
                let vol = $( '#sbplus_va_volume' ).val();
                let volError = false;
                
                if ( vol < 0 || vol > 100 || self.isEmpty( vol ) ) {
                    
                    volError = true;
                    vol = Number( self.getStorageItem( 'sbplus-volume' ) ) * 100;
                    
                } else {
                    
                    self.setStorageItem( 'sbplus-volume', vol / 100 );
                    self.setStorageItem( 'sbplus-' + self.presentationId + '-volume-temp', vol / 100, true );
                    
                }
                
                if ( volError ) {
                    
                    $( '#volume_label' ).after( '<p class="error">Value must be between 0 and 100.</p>' );
                    
                } else {
                    
                    $( '#volume_label' ).next( '.error' ).remove();
                    
                }
                
                // playback rate
                self.setStorageItem(
                    'sbplus-playbackrate',
                    $( '#sbplus_va_playbackrate option:selected' ).val()
                );
                
                self.setStorageItem(
                    'sbplus-' + self.presentationId + '-playbackrate-temp',
                    $( '#sbplus_va_playbackrate option:selected' ).val(),
                    true
                );
                
                // show msg
                $( self.menu.menuSavingMsg ).html( 'Settings saved!' );
                
                setTimeout( function() {
                    
                    $( self.menu.menuSavingMsg ).fadeOut( 'slow', function() {
                        $( this ).empty();
                    } );
                    
                }, 1500 );
                
            });
            
        }
            
    },

    /**
     * apply auto mode to toggle system default color mode
     **/
    applyAutoColorMode: function() {

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            $ ( "html" ).addClass( "dark-mode" );
        } else {
            $ ( "html" ).addClass( "auto-mode" );
        }

        // watch for color mode change
        window.matchMedia( "(prefers-color-scheme: dark)" ).addEventListener( "change", event => {

            const color = event.matches ? "dark" : "light";
            
            if ( color === "dark" ) {
                $ ( "html" ).addClass( "dark-mode" );
            } else {
                $ ( "html" ).removeClass( "dark-mode" );
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
                    $( '#dark_color_mode' ).prop( "checked", true );
                    break;
                case 'auto':
                    $( '#auto_color_mode' ).prop( "checked", true );
                    break;
                default:
                    $( '#light_color_mode').prop( "checked", true );
                    break;

            }
            
            // autoplay
            const autoplayVal = self.getStorageItem( 'sbplus-autoplay' );
            
            if ( self.isMobileDevice() === false ) {
                
                if ( autoplayVal === '1') {
                    
                    $( '#sbplus_va_autoplay' ).prop( 'checked', true );
                    
                } else {
                    
                    $( '#sbplus_va_autoplay' ).prop( 'checked', false );
            
                }
                
            }
            
            // volume
            const volumeVal = self.getStorageItem( 'sbplus-volume' );
            
            $( '#sbplus_va_volume' ).prop( 'value', volumeVal * 100 );
            
            // playback rate
            const playbackRateVal = self.getStorageItem( 'sbplus-playbackrate' );
            
            $( '#sbplus_va_playbackrate' ).val( playbackRateVal );
            
            //subtitle
            const subtitleVal = self.getStorageItem( 'sbplus-subtitle' );
            
            if ( subtitleVal === '1') {
                $( '#sbplus_va_subtitle' ).prop( 'checked', true );
            } else {
                $( '#sbplus_va_subtitle' ).prop( 'checked', false );
            }
            
        }
        
    },
    
     /**
     * send tracked event to Google Analytics
     **/
    sendToGA: function( event, context ) {

        const self = this;
        
        if ( !self.isEmpty( self.manifest.sbplus_google_tracking_id ) && ( self.xml.settings.analytics === 'on' || self.xml.settings.analytics === 'true' ) ) {

            window.dataLayer = window.dataLayer || [];

            switch ( event ) {

                case 'splash_screen_view':

                    window.dataLayer.push( {
                        'event': 'splash_screen_view',
                        'screenName': context
                    } );

                break;

                case 'presentation_screen_view':

                    window.dataLayer.push( {
                        'event': 'presentation_screen_view',
                        'screenName': context
                    } );

                break;
            }
            
        }
        
    },
    
    /**
     * clear Google Analytics time intervals for video progress check
     **/
    clearGATimeout: function() {

        const self = this;
        
        if ( this.xml.settings.analytics === 'on' ) {
            
            if ( self.gaTimeouts.start !== null ) {
                clearTimeout( self.gaTimeouts.start );
            }
            
            if ( self.gaTimeouts.halfway !== null ) {
                clearTimeout( self.gaTimeouts.halfway );
            }
            
            if ( self.gaTimeouts.completed !== null ) {
                clearTimeout( self.gaTimeouts.completed );
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
$( function() {
    
    window.SBPLUS = SBPLUS;
    SBPLUS.go();

} );