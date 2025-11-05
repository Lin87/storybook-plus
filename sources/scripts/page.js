import $ from 'jquery';
import { SBPLUS } from "./sbplus-dev";
import { Quiz } from "./quiz";

let Page = function ( obj, data ) {
    
    this.pageXML = obj.xml[0];
    this.pageData = data;
    this.title = obj.title;
    this.type = obj.type;
    this.transition = obj.transition;
    this.pageNumber = obj.number; 
    
    if ( obj.type !== 'quiz' ) {
        
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

        if ( obj.type !== 'image' && obj.markers.length ) {
            this.markersNode = obj.markers[0];
            this.markers = [];
        }
        
        if ( obj.frames.length ) {
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
        id: SBPLUS.manifest.sbplus_kaltura_id
    };
    this.kalturaSrc = {};
    
    this.mediaContent = SBPLUS.layout.mediaContent;
    this.quizContainer = SBPLUS.layout.quizContainer;
    this.mediaError = SBPLUS.layout.mediaError;
    
};

Page.prototype.getPageMedia = function() {
    
    const self = this;
    
    // reset
    if ( $( SBPLUS.layout.quizContainer ).length ) {
        $( SBPLUS.layout.quizContainer ).addClass( 'hidden' ).empty();
    }
    
    $( self.mediaContent ).css('backgroundImage', '').removeClass('compat-object-fit').removeClass( 'show-vjs-poster' );
    $( this.mediaError ).empty().hide();

    if ( $( '#mp' ).length ) {
        videojs( 'mp' ).dispose();
    }
    
    SBPLUS.clearWidget();
    
    $( self.mediaContent ).removeClass( 'iframeEmbed' ).empty();
    $( SBPLUS.layout.mediaMsg ).addClass( 'hide' ).empty('');
    $( SBPLUS.layout.media ).removeClass('hidden');
    $( SBPLUS.layout.widget ).removeClass('hidden');

    removeSecondaryControls();

    // show copy to clipboard button if applicable
    self.showCopyBtn();
    
    // end reset
    
    switch ( self.type ) {
        
        case 'kaltura':

            if ( !isNaN( self.kaltura.id ) && self.kaltura.id !== 0 ) {

                self.addMarkers();

                if ( SBPLUS.kalturaLoaded === false ) {

                    $.getScript( self.root + 'scripts/libs/kaltura/mwembedloader.js', function() {
    
                        $.getScript( self.root +  'scripts/libs/kaltura/kwidgetgetsources.js', function() {
    
                            SBPLUS.kalturaLoaded = true;
                            self.loadKalturaVideoData();
    
                        });
    
                    });
    
                } else {

                    self.loadKalturaVideoData();

                }

            } else {

                self.showPageError( 'KAL_NOT_AVAILABLE' );

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
            
            $.ajax( {
                
                url: SBPLUS.assetsPath + 'pages/' + self.src + '.' + self.imgType,
                type: 'HEAD'
                
            } ).done( function() {
                
                self.hasImage = true;
                
            } ).fail( function() {
                
                self.showPageError( 'NO_IMG', this.url );
                self.missingImgUrl = this.url;
                
            } ).always( function() {
                
                $.ajax( {
                    
                    url: SBPLUS.assetsPath + 'audio/' + self.src + '.vtt',
                    type: 'HEAD'
                    
                } ).done( function() {
                    
                    self.captionUrl = this.url;
                    
                } ).always( function() {
                    
                    const html = '<video id="mp" class="video-js vjs-default-skin"></video>';
                    
                    $( self.mediaContent ).addClass( 'show-vjs-poster' );
                    
                    $( self.mediaContent ).html( html ).promise().done( function() {
                
                        self.addMarkers();
                        self.renderVideoJS();
                        self.setWidgets();

                        if ( !!self.description ) {
                            self.insertDescription();
                        }
                
                    } );
                    
                } );
                
            } );
            
        break;
        
        case 'image':
            
            const img = new Image();
            img.src = SBPLUS.assetsPath + 'pages/' + self.src + '.' + self.imgType;
            img.alt = self.title;
            
            $( img ).on( 'load', function() {
                
                self.hasImage = true;
                
                $('.sbplus_media_content').each(function () {
                    const $container = $(this),
                        imgUrl = $container.find('img').prop('src');
                    if (imgUrl) {
                      $container
                        .css('backgroundImage', 'url(' + imgUrl + ')');
                    }  
                });
                
            } );
            
            $( img ).on( 'error', function() {
                self.hasImage = false;
                self.showPageError( 'NO_IMG', img.src );
            } );
            
            $( self.mediaContent ).html( '<img src="' + img.src + '" class="img_only"  alt="Content about ' + SBPLUS.escapeHTMLAttribute( self.title ) + '" />' ).promise().done( function() {
                self.setWidgets();

                if ( !!self.description ) {
                    self.insertDescription();
                }
                
                addSecondaryControls( true );
            } );
                        
        break;
        
        case 'video':
            
            $.ajax( {
                
                url: SBPLUS.assetsPath + 'video/' + self.src + '.vtt',
                type: 'HEAD'
                
            } ).done( function() {
                
                self.captionUrl = this.url;
                
            } ).always( function() {
                
                const html = '<video id="mp" class="video-js vjs-default-skin" crossorigin="anonymous" width="100%" height="100%"></video>';
                
                $( self.mediaContent ).html( html ).promise().done( function() {
                    
                    // call video js
                    self.isVideo = true;
                    self.addMarkers();
                    self.renderVideoJS();

                    if ( !!self.description ) {
                        document.querySelector( '#mp_html5_api' ).setAttribute( 'aria-describedby', 'long-description' );
                        self.insertDescription();
                    }

                    self.setWidgets();
                    
                } );
                
            } );
        
        break;
        
        case 'youtube':
            
            self.isYoutube = true;
            
            if ( self.useDefaultPlayer === "true" || self.useDefaultPlayer === "yes"  ) {
                
                $( self.mediaContent ).html( '<video id="mp" class="video-js vjs-default-skin"></video>' ).promise().done( function() {

                    self.addMarkers();
                    self.renderVideoJS();

                    if ( !!self.description ) {
                        document.querySelector( '.video-js' ).setAttribute( 'aria-describedby', 'long-description' );
                        self.insertDescription();
                    }
                    
                } );

            } else {
                
                const autoplay = 
                    self.preventAutoplay === "false" || self.preventAutoplay === "no" ? 1 : 0;

                $( self.mediaContent ).html( '<div class="yt-native"><iframe id="youtube-ui" width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/' + self.src + '?autoplay=' + autoplay + '&playsinline=1&modestbranding=1&disablekb=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture, fullscreen"></iframe></div>' ).promise().done( function() {
                
                    addSecondaryControls();
                    
                } );

            }
            
            self.setWidgets();
            
        break;
        
        case 'bundle':
            
            $( self.frames ).each( function() {
                const cue = toSeconds( $( this ).attr( 'start' ) );
                self.cuepoints.push( cue );
            } );
            
            $.ajax( {
                
                url: SBPLUS.assetsPath + 'audio/' + self.src + '.vtt',
                type: 'HEAD'
                
            } ).done( function() {
                
                self.captionUrl = this.url;
                
            } ).always( function() {
                
                const html = '<video id="mp" class="video-js vjs-default-skin"></video>';

                $( self.mediaContent ).addClass( 'show-vjs-poster' );
                
                $( self.mediaContent ).html( html ).promise().done( function() {
            
                    self.isBundle = true;
                    self.addMarkers();
                    self.renderVideoJS();
                    self.setWidgets();

                    if ( !!self.description ) {
                        document.querySelector( '#mp_html5_api' ).setAttribute( 'aria-describedby', 'long-description' );
                        self.insertDescription();
                    }
            
                } );
                
            } );
            
        break;
        
        case 'quiz':
            
            $( self.quizContainer ).removeClass( 'hidden' );
            $( SBPLUS.layout.widget ).addClass('hidden');
            $( SBPLUS.layout.media ).addClass('hidden');

            const qObj = {
                id: self.pageNumber
            };
            
            const quizItem = new Quiz( qObj, self.pageData  );
            quizItem.getQuiz();
            
        break;
        
        case 'html':
            
            let embed = false;
            let audioSrc = false;
            let path = self.src;
                
            if ( !isUrl(path) ) {
                path = SBPLUS.assetsPath + 'html/' + self.src + '/index.html';
            }
            
            if ( $(self.pageXML).attr('embed') !== undefined ) {
                embed = $(self.pageXML).attr('embed').toLowerCase();
            }
            
            if ( $(self.pageXML).find('audio').length >= 1 ) {
                audioSrc = $($(self.pageXML).find('audio')[0]).attr('src').toLowerCase();
            }
            
            if ( embed === 'yes' || embed === "true" ) {
                
                let iframe = '<iframe class="html" src="' + path + '" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"></iframe>';
                
                if ( audioSrc.length ) {

                    let audio = '<video id="mp" class="video-js vjs-default-skin"></video>';

                    self.isAudio = true;
                    $( self.mediaContent ).append( audio );
                    self.addMarkers();
                    self.renderVideoJS( audioSrc );

                } else {

                    addSecondaryControls( false );

                }

                $( self.mediaContent ).addClass( 'iframeEmbed' ).prepend( iframe );
                
            } else {
                
               let holder = '<div class="html exLink">';
               holder += '<small>click the link to open it in a new tab/window</small>';
               holder += '<a href="' + path + '" target="_blank">' + path + '</a>';
               holder += '</div>'
               
               $( self.mediaContent ).addClass( 'html' ).html( holder );
               window.open(path, '_blank');
               
            }
            
            self.setWidgets();
            
        break;
        
        default:
            self.showPageError( 'UNKNOWN_TYPE', self.type);
            self.setWidgets();
        break;
        
    }
    
    if ( self.type === 'image' || self.type === 'html' ) {
        
        $( self.mediaContent ).addClass( self.transition )
            .one( 'webkitAnimationEnd mozAnimationEnd animationend', function() {
                $( this ).removeClass( self.transition );
                $( this ).off();
            }
        );
        
    }
    
    window.setTimeout( function() {
        document.activeElement.blur();
        document.querySelector( SBPLUS.layout.media ).focus();
    }, 750 );

    // add current page index to local storage
    
    window.clearTimeout( self.delayStorage );
    
    self.delayStorage = window.setTimeout( function() {
        
        const presentation = SBPLUS.sanitize( SBPLUS.getCourseDirectory() );
        const pSectionNumber = self.pageNumber[0] + ',' + self.pageNumber[1];
        
        if ( pSectionNumber !== '0,0' ) {
            SBPLUS.setStorageItem( 'sbplus-' + presentation, pSectionNumber );
        } else {
            SBPLUS.deleteStorageItem( 'sbplus-' + presentation );
        }
        
    }, 3000 );
    
};

// add Copy to clipboard button
Page.prototype.showCopyBtn = function() {
    
    // clear it first
    this.removeCopyBtn();

    if ( this.copyableContent ) {

        // build the button
        const copyBtn = document.createElement( 'button' );
        copyBtn.id = 'copyToCbBtn';

        const copyBtnTxt = document.createElement( 'span' );
        copyBtnTxt.classList.add( 'btn-txt' );
        
        if ( !SBPLUS.isEmpty( $(this.copyableContent).attr( 'name' ) ) ) {
            copyBtnTxt.innerHTML = $(this.copyableContent).attr( 'name' );
        } else {
            copyBtnTxt.innerHTML = 'Copy to Clipboard';
        }

        copyBtn.append( copyBtnTxt );

        const copyTxtArea = document.createElement( 'textarea' );
        copyTxtArea.id = 'copyableTxt';
        copyTxtArea.readOnly = true;
        copyTxtArea.innerHTML = this.copyableContent[0].textContent;
        copyTxtArea.setAttribute( 'aria-hidden', true );

        $( SBPLUS.layout.media ).prepend( copyBtn );
        $( SBPLUS.layout.media ).prepend( copyTxtArea );
        $( SBPLUS.layout.media ).on( 'click', '#copyToCbBtn', copyToClipboard );

    }

};

Page.prototype.removeCopyBtn = function() {

    const copyBtn = document.getElementById( 'copyToCbBtn' );
    const copyTxtArea = document.getElementById( 'copyableTxt' );

    if ( copyBtn && copyTxtArea ) {
        copyBtn.parentNode.removeChild( copyBtn );
        copyTxtArea.parentNode.removeChild( copyTxtArea );
        $( SBPLUS.layout.media ).off( 'click', '#copyToCbBtn', copyToClipboard );
    }

};

function copyToClipboard() {

    const copyBtn = document.getElementById( 'copyToCbBtn' );
    const copyBtnTxt = copyBtn.querySelectorAll( '.btn-txt' )[0];
    const copyTxtArea = document.getElementById( 'copyableTxt' );
    const originalCopyBtnTxt = copyBtn.innerHTML;
    
    if ( copyBtn && copyTxtArea ) {

        const clipboard = navigator.clipboard;

        clipboard.writeText( copyTxtArea.innerHTML ).then( () => {

            copyBtn.focus();
            copyBtnTxt.innerHTML = "Copied";

        } );

        setTimeout( () => {
            copyBtnTxt.innerHTML = originalCopyBtnTxt;
        }, 3000 );

    }

}

// insert long description
Page.prototype.insertDescription = function() {

    const self = this;

    if ( self.description ) {
    
        const longDescEl = document.createElement( 'div' );

        longDescEl.id = 'long-description';
        longDescEl.classList.add( 'sr-only' );
        longDescEl.innerText = self.description[0].textContent;

        const imageOnly = document.querySelector( '.img_only' );

        if ( imageOnly ) {
            imageOnly.setAttribute( 'aria-describedby', 'long-description' );
        }

        document.querySelector( self.mediaContent ).appendChild( longDescEl );
        
    }

}

// kaltura api request
Page.prototype.loadKalturaVideoData = function () {
    
    const self = this;

    self.isKaltura = {
        
        status: {
            entry: 0,
            low: 0,
            normal: 0,
            medium: 0
        },
        duration: ''
        
    };

    kWidget.getSources( {

        'partnerId': self.kaltura.id,
        'entryId': self.src,
        'callback': function( data ) {

            const captions = data.caption;

            self.isKaltura.status.entry = data.status;
            self.isKaltura.duration = data.duration;
            self.isKaltura.poster = data.poster;
            self.isKaltura.playerSrc = [];

            data.sources.forEach( ( source ) => {
                
                if ( source.type === "video/mp4" ) {
                    self.isKaltura.playerSrc.push({
                        src: source.src,
                        type: source.type
                    });
                }

                if ( source.type === "application/vnd.apple.mpegurl" ) {
                    self.isKaltura.playerSrc.push({
                        src: source.src,
                        type: source.type
                    } );
                }

            } );

            if ( self.isKaltura.status.entry == 2 ) {

                if ( captions !== null ) {

                    self.captionUrl = [];

                    captions.forEach( caption => {

                        if ( caption.label.toLowerCase() != "english (autocaption)" ) {

                            self.captionUrl.push( {
                                kind: 'captions',
                                language: caption.languageCode,
                                label: caption.language,
                                url: 'https://www.kaltura.com/api_v3/?service=caption_captionasset&action=servewebvtt&captionAssetId=' + caption.id + '&segmentDuration=' + self.isKaltura.duration + '&segmentIndex=1'
                            } );

                        }
                        
                    } );

                }
                
                const html = '<video id="mp" class="video-js vjs-default-skin" crossorigin="anonymous" width="100%" height="100%"></video>';
            
                $( self.mediaContent ).html( html ).promise().done( function() {
                    
                    // call video js
                    self.renderVideoJS();

                    if ( !!self.description ) {
                        document.querySelector( '#mp_html5_api' ).setAttribute( 'aria-describedby', 'long-description' );
                        self.insertDescription();
                    }
                    
                } );
                    
            } else {
                self.showPageError( 'KAL_ENTRY_NOT_READY' );
            }

        }

    } );
    
};

// kaltura api request
Page.prototype.loadBrightcoveVideoData = function () {
    
    const self = this;

    $( self.mediaContent ).html( '<span class="loading-spinner"></span>' );

    fetch( 'https://api.academics.excelsior.edu/brightcove?vid=' + self.src ).then ( response => {

        if ( !response.ok ) {
            self.showPageError( 'BRIGHTCOVE_NOT_AVAILABLE' );
            throw new Error( 'Failed to retrieve Brightcove video' );
        }

        return response.json();

    } ).then( data => {

        const now = new Date().toISOString();
        const rand = Math.random() * 1000000;
        const session = parseInt( rand ).toString() + '_' + now;

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

        if ( data.response.text_tracks.length ) {

            data.response.text_tracks.forEach( caption => {

                if ( caption.label.toLowerCase() != "english (autocaption)" ) {
    
                    self.captionUrl.push( {
                        kind: caption.kind,
                        language: caption.srclang,
                        label: caption.label,
                        url: caption.src
                    } );
    
                }
                
            } );

        }

        const html = '<video id="mp" class="video-js vjs-default-skin animated fadeIn" crossorigin="anonymous" width="100%" height="100%"></video>';
                    
        $( self.mediaContent ).html( html ).promise().done( function() {
            self.renderVideoJS();
            if ( !!self.description ) {
                document.querySelector( '#mp_html5_api' ).setAttribute( 'aria-describedby', 'long-description' );
                self.insertDescription();
            }
        } );
        
    } ).catch( error => {
        self.showPageError( 'BRIGHTCOVE_NOT_AVAILABLE' );
    } );
    
};

Page.prototype.addMarkers = function() {

    if ( this.markersNode != undefined ) {

        Array.from( this.markersNode.children ).forEach( ( marker ) => {

            const m = {
                time: toSeconds( marker.getAttribute( 'timecode' ) ),
                text: marker.innerHTML.trim().length ? SBPLUS.noScript( marker.innerHTML.trim() ) : '',
                color: marker.getAttribute( 'color' ) ? marker.getAttribute( 'color' ) : ''
            };

            this.markers.push( m );

        } );

    }

};

// render videojs
Page.prototype.renderVideoJS = function( src ) {
    
    const self = this;
    
    src = typeof src !== 'undefined' ? src : self.src;

    let isAutoplay = true;
    
    if ( SBPLUS.getStorageItem( 'sbplus-autoplay' ) === '0' ) {
        isAutoplay = false;
    }
    
    if ( self.preventAutoplay === "true" ) {
        
        isAutoplay = false;
        $( SBPLUS.layout.wrapper ).addClass( 'preventAutoplay' ); 
        
    } else {
        $( SBPLUS.layout.wrapper ).removeClass( 'preventAutoplay' ); 
    }

    const options = {
        
        techOrder: ['html5'],
        controls: true,
        inactivityTimeout: 0,
        autoplay: isAutoplay,
        preload: "auto",
        playbackRates: [0.5, 1, 1.5, 2],
        controlBar: {
            fullscreenToggle: false,
            pictureInPictureToggle: false,
            liveDisplay: false,
            seekToLive: false,
            skipButtons: {
                forward: 10,
                backward: 10
            },
        },
        plugins: {
            qualityMenu: {}
        }

    };
    
    // autoplay is off for iPhone or iPod
    if ( SBPLUS.isMobileDevice() ) {
        options.autoplay = false;
        options.playsinline = true;
        options.nativeControlsForTouch = false;
    }
    
    // set tech order and plugins
    if ( self.isYoutube ) {
        options.techOrder = ['youtube'];
        options.sources = [{ type: "video/youtube", src: "https://www.youtube.com/watch?v=" + src }];
        options.youtube = { "iv_load_policy": 3, "rel": 0 };;
        options.playbackRates = null;
    }

    if ( self.isBrightcove ) {
        options.html5 = {
            vhs: {
              withCredentials: false,
              overrideNative: false,
            },
        };
    }
    
    if ( self.isKaltura || self.isBrightcove || self.isYoutube || self.isVideo ) {
        options.controlBar.fullscreenToggle = self.disableFullscreen === "true" ? false : true;
    }

    self.mediaPlayer = videojs( 'mp', options, function onPlayerReady() {

        const player = this;
        
        if ( self.isKaltura ) {
            
            if ( isAutoplay === false ) {
                player.poster( self.isKaltura.poster + '/width/900/quality/100' );
            }
            
            player.src( self.isKaltura.playerSrc.reverse() );
            
        }

        if ( self.isBrightcove ) {

            if ( isAutoplay === false && self.isBrightcove.poster.length ) {
                player.poster( self.isBrightcove.poster[0].src );
            }

            let vidSources = [];

            self.isBrightcove.sources.forEach( source => {
                
                if ( source.codec && source.codec == 'H264' ) {
                    vidSources.push( { type: 'video/mp4', src: source.src } );
                }

                vidSources.push( { type: source.type, src: source.src } );

            } );

            player.src( vidSources );

            player.on( 'loadedmetadata', ( evt ) => {

                Array.from( player.textTracks() ).filter( ({kind}) => !['chapters','metadata'].includes(kind)).forEach((track) => track.mode = 'disabled' );
                
                // event: video started loading
                self.isBrightcove.duration = player.duration();
                self.sendBrightcoveAnalyticsEvent( 'video_impression', evt );

            } );

            player.on( 'ready', function (evt) {
                self.sendBrightcoveAnalyticsEvent( 'player_load', evt );
            } );

            player.one( 'play', function()  {
                self.isBrightcove.firstPlayRequestTime = Date.now();
            } );

            player.on( 'playing', function( evt )  {
                self.sendBrightcoveAnalyticsEvent( 'play_request', evt );
                self.sendBrightcoveAnalyticsEvent( 'video_view', evt );
            } );

            player.on( 'timeupdate', function( evt ) {
                self.onBrightcoveTimeUpdate( evt );
            } );

            player.on( 'ended', function( evt ) {
                self.onBrightcoveTimeUpdate( evt );
            } );

        }
        
        if ( self.isAudio || self.isBundle ) {
            
            if ( self.isAudio && self.hasImage ) {
                player.poster( SBPLUS.assetsPath + 'pages/' + src + '.' + self.imgType );
                const imgPath = `${SBPLUS.assetsPath}pages/${src}.${self.imgType}`;
                const imgAlt = `Content about ${SBPLUS.escapeHTMLAttribute(self.title)}`;
                const imgElement = `<img src="${imgPath}" alt="${imgAlt}"${self.description ? ' aria-describedby="long-description"' : ''} tabindex="0" />`;

                $('.vjs-poster')[0].innerHTML = imgElement;
                
            }
            
            if ( self.isBundle ) {
                
                let srcDuration = 0;
                const pageImage = new Image();
                
                player.on( 'loadedmetadata', function() {
                    
                    srcDuration = Math.floor( player.duration() );
                    
                } );
                
                player.cuepoints();
                player.addCuepoint( {
                    	
                	namespace: src + '-1',
                	start: 0,
                	end: self.cuepoints[0],
                	onStart: function() {
                    	
                    	pageImage.src = SBPLUS.assetsPath + 'pages/' + src + '-1.' + self.imgType;
                    	$('.vjs-poster')[0].innerHTML = "<img src=" + pageImage.src + " />";
                    	player.poster( pageImage.src );
                    	
                	},
                	onEnd: function() {
                    	
                	},
                	params: ''
                	
            	} );
                
                $.each( self.cuepoints, function( i ) {
            
                    let endCue;
                    
                    if ( self.cuepoints[i+1] === undefined ) {
                        endCue = srcDuration;
                    } else {
                        endCue = self.cuepoints[i+1];
                    }
                    
                    player.addCuepoint( {
                        namespace: src + '-' + ( i + 2 ),
                        start: self.cuepoints[i],
                        end: endCue,
                        onStart: function() {
                            
                            pageImage.src = SBPLUS.assetsPath + 'pages/' + src + '-' + ( i + 2 )  + '.' + self.imgType;
                    	    
                            $( pageImage ).on( 'error', function() {
                                self.showPageError( 'NO_IMG', pageImage.src );
                            } );
                            
                            const imageEl = $('.vjs-poster')[0];
                            const img = document.createElement('img');
                            
                            img.src = pageImage.src;
                            
                            $( imageEl ).append( img );
                            $( img ).hide().fadeIn(250);
                            
                            player.poster( pageImage.src );
                            
                        }
                    } );
                    
                } );
                
                player.on('seeking', function() {
                    
                    $('.vjs-poster')[0].innerHTML = "";
                    
                    	
                	if ( player.currentTime() <= self.cuepoints[0] ) {
                    	
                    	player.poster( SBPLUS.assetsPath + 'pages/' + src + '-1.' + self.imgType );
                    	
                	}
                	
            	} );
                
            }
            
            player.src( { type: 'audio/mp3', src: SBPLUS.assetsPath + 'audio/' + src + '.mp3' } );
            
        }
        
        if ( self.isVideo ) {
            player.src( { type: 'video/mp4', src: SBPLUS.assetsPath + 'video/' + src + '.mp4' } );
        }
        
        // add caption

        if ( self.isKaltura || self.isBrightcove ) {

            if ( self.captionUrl.length && player.currentSource().src.includes('.mp4') ) {
            
                self.captionUrl.forEach( caption => {
    
                    player.addRemoteTextTrack( {
                        kind: caption.kind,
                        language: caption.language,
                        label: caption.label,
                        src: caption.url
                    }, true );
    
                } );

            }

        } else {

            if ( self.captionUrl ) {

                player.addRemoteTextTrack( {
                    kind: 'captions',
                    language: 'en',
                    label: 'English',
                    src: self.captionUrl
                }, true );
                
            }
        }

        if ( self.isYoutube && self.useDefaultPlayer ) {

            $.ajax( {
                    
                url: SBPLUS.assetsPath + 'video/yt-' + src + '.vtt',
                type: 'HEAD'
                
            } ).done( function() {
                
                player.addRemoteTextTrack( {
                    kind: 'captions',
                    language: 'en',
                    label: 'English',
                    src: SBPLUS.assetsPath + 'video/yt-' + src + '.vtt'
                }, true );
                
            } )

        }
        
        // set playback rate
        if ( options.playbackRates !== null ) {
            player.playbackRate( SBPLUS.playbackrate );
        }
        
        // video events
        player.on(['waiting', 'pause' ], function() {
          self.isPlaying = false;
        } );
        
        player.on( 'play', function() {
            if ( $(SBPLUS.layout.mediaMsg).is( ':visible' ) ) {
                $(SBPLUS.layout.mediaMsg).addClass( 'hide' ).html('');
            }
        } );
        
        player.on( 'playing', function() {
            self.isPlaying = true;
        } );
        
        player.on( 'ended', function() {      
            self.isPlaying = false;
        } );
        
        player.on( 'error', function() {
          self.showPageError( 'NO_MEDIA', player.src() );
        } );
        
        player.on( 'resolutionchange', function() {
    		player.playbackRate( SBPLUS.playbackrate );
		} );

        player.on( 'fullscreenchange', () => {

            if ( player.isFullscreen() ) {
                player.options( { inactivityTimeout: 2000 } );
            } else {
                player.options( { inactivityTimeout: 0 } );
                document.querySelector( '.video-js.vjs-default-skin' ).classList.remove( 'vjs-user-inactive' );
            }

        } );
        
        player.on( 'ratechange', function() {
            
            const rate = this.playbackRate();
            
            if ( SBPLUS.playbackrate !== rate ) {
                SBPLUS.playbackrate = rate;
                this.playbackRate(rate);
            }
    		
		} );
        
        // volume
        if ( SBPLUS.hasStorageItem( 'sbplus-' + SBPLUS.presentationId + '-volume-temp', true ) ) {
            player.volume( Number( SBPLUS.getStorageItem( 'sbplus-' + SBPLUS.presentationId + '-volume-temp', true ) ) );
        } else {
            player.volume( Number( SBPLUS.getStorageItem( 'sbplus-volume' ) ) );
        }
        
        player.on( 'volumechange', function() {
            SBPLUS.setStorageItem( 'sbplus-' + SBPLUS.presentationId + '-volume-temp', this.volume(), true );
        } );
        
        // subtitle
        if ( self.isYoutube === false && player.textTracks().tracks_.length >= 1 ) {
            
            if ( SBPLUS.hasStorageItem( 'sbplus-' + SBPLUS.presentationId + '-subtitle-temp', true ) ) {
            
                if ( SBPLUS.getStorageItem( 'sbplus-' + SBPLUS.presentationId + '-subtitle-temp', true ) === '1' ) {
                    player.textTracks().tracks_[0].mode = 'showing';
                } else {
                    player.textTracks().tracks_[0].mode = 'disabled';
                }
                
            } else {
                
                if ( SBPLUS.getStorageItem( 'sbplus-subtitle' ) === '1' ) {
                    player.textTracks().tracks_[0].mode = 'showing';
                } else {
                    player.textTracks().tracks_[0].mode = 'disabled';
                }
                
            }
            
            player.textTracks().addEventListener( 'change', function() {
                
                const tracks = this.tracks_;
                
                $.each( tracks, function() {
                    
                    if ( this.mode === 'showing' ) {
                        
                        SBPLUS.setStorageItem( 'sbplus-' + SBPLUS.presentationId + '-subtitle-temp', 1, true );
                        
                    } else {
                        
                        SBPLUS.setStorageItem( 'sbplus-' + SBPLUS.presentationId + '-subtitle-temp', 0, true );
                        
                    }
                    
                } );
                
            } );
            
        }

        // add expand/contract button
        addExpandContractButton( player );

        // add markers
        if ( self.markers ) {
            setupMarkers( player, self.markers );
        }
            
    } );
    
    if ( $( '#mp_html5_api' ).length ) {
        
        $( '#mp_html5_api' ).addClass( 'animated ' + self.transition )
            .one( 'webkitAnimationEnd mozAnimationEnd animationend', function() {
                $( this ).removeClass( 'animated ' +  self.transition );
                $( this ).off();
            }
        );
        
    }
    
    if ( $( '#mp_Youtube_api' ).length ) {
        
        const parent = $( '#mp_Youtube_api' ).parent();
        
        parent.addClass( 'animated ' + self.transition )
            .one( 'webkitAnimationEnd mozAnimationEnd animationend', function() {
                $( this ).removeClass( 'animated ' +  self.transition );
                $( this ).off();
            }
        );
        
    }

}

Page.prototype.setWidgets = function() {
    
    const self = this;

    SBPLUS.clearWidgetSegment();
    
    if ( this.type != 'quiz' ) {
        
        if ( !SBPLUS.isEmpty( this.notes ) ) {
            SBPLUS.addSegment( 'Notes' );
        }
        
        if ( this.widget.length ) {
            
            const segments = $( $( this.widget ).find( 'segment' ) );
            
            segments.each( function() {
                
                const name = $( this ).attr( 'name' );
                const key = 'sbplus_' + SBPLUS.sanitize( name );
                
                self.widgetSegments[key] = SBPLUS.getTextContent( $( this ) );
                SBPLUS.addSegment( name );
                
            } );
 
        } 
        
        SBPLUS.selectFirstSegment();
        
    }
    
}

Page.prototype.getWidgetContent = function( id ) {
    
    const self = this;
    
    switch( id ) {
        
        case 'sbplus_notes':
            
            displayWidgetContent( id, this.notes );
            
        break;
        
        default:
            
            displayWidgetContent( id, self.widgetSegments[id] );
            
        break;
        
    }
    
}

// display page error
Page.prototype.showPageError = function( type, src ) {
    
    src = typeof src !== 'undefined' ? src : '';
    
    const self = this;
    
    let msg = '';
    
    switch ( type ) {
                
        case 'NO_IMG':
        
            msg = '<p><strong>The content for this Storybook Page could not be loaded.</strong></p><p><strong>Expected image:</strong> ' + src + '</p><p>Please try refreshing your browser, or coming back later.</p><p>Contact support if you continue to have issues.</p>';

        break;

        case 'KAL_NOT_AVAILABLE':

            msg = '<p>The manifest file does not specify the Kaltura organization or partner ID. Consequently, Kaltura is unavailable for use throughout the presentation.</p><p><strong>Expected Kaltura video source</strong>: ' + self.src + '</p>';

        break;
        
        case 'KAL_ENTRY_NOT_READY':
            msg = '<p>The video for this Storybook Page is still processing and could not be loaded at the moment. Please try again later. Contact support if you continue to have issues.</p><p><strong>Expected video source</strong>: Kaltura video ID ' + self.src + '<br><strong>Status</strong>: ';
            
            msg += getEntryKalturaStatus( self.isKaltura.status.entry ) + '</p>';
            
        break;

        case 'BTIGHTCOVE_NOT_AVAILABLE':

        msg = '<p>The video is still processing or could not be loaded at the moment. Please try again later. Contact support if you continue to have issues.</p><p><strong>Expected video source</strong>: Brightcove video ID # ' + self.src + '<br><strong>Status</strong>: ';

        break;
        
        case 'NO_MEDIA':
        
            msg = '<p><strong>The content for this Storybook Page could not be loaded.</strong></p>';
            
            if ( self.hasImage === false ) {
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
    
    $( self.mediaError ).html( msg ).show();
    
}

Page.prototype.sendBrightcoveAnalyticsEvent = function( eventType, evt ) {
    
    const self = this;
    const baseURL = 'https://metrics.brightcove.com/tracker/v2/?'
    const time = Date.now();
    const destination = encodeURI( window.location.href );
    const source = encodeURI( document.referrer );

    let urlStr = '';
    
    // add params for all requests
    urlStr = 'event=' + eventType + '&session=' + self.isBrightcove.session + '&domain=videocloud&account=' + self.isBrightcove.accountId + '&time=' + time + '&destination=' + destination + '&video=' + self.isBrightcove.videoId + '&video_name=' + encodeURI( self.isBrightcove.name );

    // source will be empty for direct traffic
    if ( source !== '' && source != destination ) {
        urlStr += '&source=' + source;
    }

    if ( eventType === 'video_view' ) {
        urlStr += '&start_time_ms=' + self.isBrightcove.firstPlayRequestTime;
    }

    if ( eventType !== 'player_load' ) {
        urlStr += '&video_duration=' + self.isBrightcove.duration;
    }
    
    // add params specific to video_engagement events
    if ( eventType === 'video_engagement' ) {
        const currentSource = self.mediaPlayer.currentSource();
        urlStr += '&range=' + evt.range + '&rendition_url=' + encodeURI( currentSource.src.split('?')[0] ) + '&rendition_mime_type=' + encodeURI( currentSource.type );
    }

    // add the base URL
    urlStr = baseURL + urlStr;

    // make the request
    sendData( urlStr );

    return;

}

Page.prototype.onBrightcoveTimeUpdate = function( evt ) {

    const self = this;
    const currentTime = self.mediaPlayer.currentTime();
    const engagementThreshold = 10; // Trigger every 10 seconds
    const currentSegment = Math.floor(currentTime / engagementThreshold) * engagementThreshold;
    let range = '';

    if ( currentSegment > self.isBrightcove.lastEngagedTime ) {

        // set the range and add it to the evt object
        let endRange = ( Math.floor( currentTime ) + engagementThreshold );

        if ( endRange >= self.isBrightcove.duration ) {
            endRange = Math.floor( self.isBrightcove.duration );
        }

        range = ( Math.floor( currentTime ) + '..' + endRange ).toString();
        evt.range = range;

        // send video_enagement event
        self.sendBrightcoveAnalyticsEvent( 'video_engagement', evt );

        // Update last engaged time
        self.isBrightcove.lastEngagedTime = currentSegment;
    }

    if ( evt.type === 'ended' ) {
        const duration = Math.floor( self.isBrightcove.duration );
        range = ( duration + '..' +  duration ).toString();
        evt.range = range;
        self.sendBrightcoveAnalyticsEvent( 'video_engagement', evt );
        self.isBrightcove.lastEngagedTime = -1;
    }

}

// function getKalturaStatus( code ) {
//     let msg = '';
//     switch( code ) {
//         case -1:
//         msg = 'ERROR';
//         break;
//         case 0:
//         msg = 'QUEUED (queued for conversion)';
//         break;
//         case 1:
//         msg = 'CONVERTING';
//         break;
//         case 2:
//         msg = 'READY';
//         break;
//         case 3:
//         msg = 'DELETED';
//         break;
//         case 4:
//         msg = 'NOT APPLICABLE';
//         break;
//         default:
//         msg = 'UNKNOWN ERROR (check main entry)';
//         break;
        
//     }
//     return msg;
// }

function getEntryKalturaStatus( code ) {
    let msg = '';
    switch( code ) {
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

// page class helper functions
function addExpandContractButton( vjs ) {

    class ExpandContractButton extends videojs.getComponent( 'Button' ) {

        constructor(player, options) {

            super(player, options);
            this.el().setAttribute( 'aria-label','Expand/Contract' );
            this.controlText( 'Expand/Contract' );

            if (document.querySelector( SBPLUS.layout.sbplus ).classList.contains( 'sbplus-vjs-expanded' )) {
                vjs.addClass( 'sbplus-vjs-expanded' );
            }

        }

        handleClick() {
            
            if ( vjs.hasClass( 'sbplus-vjs-expanded' ) ) {
                vjs.removeClass( 'sbplus-vjs-expanded' );
                document.querySelector( SBPLUS.layout.sbplus ).classList.remove( 'sbplus-vjs-expanded' );
            } else {
                vjs.addClass( 'sbplus-vjs-expanded' );
                document.querySelector( SBPLUS.layout.sbplus ).classList.add( 'sbplus-vjs-expanded' );
            }
                
        }

        buildCSSClass() {
            return 'vjs-expand-contract-button vjs-control vjs-button';
        }

    }

    videojs.registerComponent( 'ExpandContractButton', ExpandContractButton );
    vjs.getChild( 'controlBar' ).addChild( 'ExpandContractButton', {}, 15 );
    
}

function toggleExpandContractView(evt) {

    const layout = document.querySelector( SBPLUS.layout.sbplus );

    if ( layout.classList.contains( 'sbplus-vjs-expanded' ) ) {
        evt.target.classList.remove( 'expanded' );
        layout.classList.remove( 'sbplus-vjs-expanded' );
    } else {
        evt.target.classList.add( 'expanded' )
        layout.classList.add( 'sbplus-vjs-expanded' );
    }

}

function addSecondaryControls( noAudio = false ) {

    noAudio = typeof noAudio !== 'undefined' ? noAudio : false;

    const secondaryControlDiv = document.createElement( 'div' );
    secondaryControlDiv.classList.add( 'sbplus_secondary_controls' );

    if ( noAudio ) {

        const noAudioLabelEl = document.createElement( 'div' );
        noAudioLabelEl.classList.add( 'no_audio_label' );
        noAudioLabelEl.innerHTML = 'This slide is not narrated.';
        secondaryControlDiv.appendChild( noAudioLabelEl );

    }

    const expandContractBtn = document.createElement( 'button' );
    expandContractBtn.setAttribute( 'id', 'expand_contract_btn' );
    expandContractBtn.setAttribute( 'title', 'Expand/Contract' );
    expandContractBtn.setAttribute( 'aria-label', 'Expand/Contract' );

    secondaryControlDiv.appendChild(expandContractBtn);
    secondaryControlDiv.addEventListener( 'click', toggleExpandContractView );

    $( SBPLUS.layout.mediaContent ).append( secondaryControlDiv );

}

function removeSecondaryControls() {

    const secondaryControlsDiv = document.querySelector( '.sbplus_secondary_controls' );

    if ( secondaryControlsDiv ) {
        const expandBtn = document.querySelector( '#expand_contract_btn' );
        expandBtn.removeEventListener( 'click', toggleExpandContractView );
    }

}

function setupMarkers ( player, markers ) {

    if ( markers ) {

        player.markers( {
            markers: markers
        } );

    }

}

function displayWidgetContent( id, str ) {
    
    $( SBPLUS.widget.content ).html( str ).promise().done( ( element ) => {

            element.attr( 'role', 'tabpanel' );
            element.attr( 'tabindex', 0 );
            element.attr( 'aria-labelledby', id );
            
            if ( element.find( 'a' ).length ) {

        		element.find( 'a' ).each( function() {
            		
        			$( this ).attr( "target", "_blank" );
        
                } );
        
            }
            
        } );
    
}

// function guid() {
    
//     function s4() {
//         return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring (1 );
//     }
    
//     return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    
// }

function toSeconds( str ) {
    
    const arr = str.split( ':' );
    
    if ( arr.length >= 3 ) {
        return Number( arr[0] * 60 ) * 60 + Number( arr[1] * 60 ) + Number( arr[2] );
    } else {
        return Number( arr[0] * 60 ) + Number( arr[1] );
    }
    
}

function isUrl(s) {
   const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
   return regexp.test(s);
}

/**
 * Injects API calls into the head of a document
 * as the src for a img tag
 * img is better than script tag for CORS
 * @param {string} requestURL The URL to call to send the data
 * @return true
 */
function sendData( requestURL ) {
    const scriptElement = document.createElement( 'img' );
    scriptElement.setAttribute( 'src', requestURL );
    scriptElement.setAttribute( 'alt', '' );
    scriptElement.setAttribute( 'aria-hidden', 'true' );
    scriptElement.style.display = 'none';
    document.getElementsByTagName( 'body' )[0].appendChild( scriptElement );
    return true;
}

export { Page };