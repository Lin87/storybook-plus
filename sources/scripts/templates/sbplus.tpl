<!-- Global error screen -->
<div id="sbplus_error_screen"></div>

<!-- Program logo -->
<div id="sbplus_loading_screen" class="animated">
    <div class="program_logo"></div>
</div>

<!-- Main SB+ UI -->
<div id="sbplus">
    
    <!-- Splash screen -->
    <div id="sbplus_splash_screen" class="animated">
        
        <div id="sbplus_presentation_info">
            
            <p class="sb_title" tabindex="0"></p>
            <p class="sb_subtitle" tabindex="0"></p>
            <p class="sb_author" tabindex="0"></p>

            <div class="sb_context">

                <p class="sb_duration" tabindex="0"></p>
                <p id="splash_cta" class="sb_cta">
                    <button id="sbplus_start_btn" tabindex="0" aria-label="Start presentation">Start</button>
                    <button id="sbplus_resume_btn" tabindex="0" aria-label="Resume presentation">Resume</button>
                </p>
                <p class="sb_downloads"></p>

            </div>
 
        </div>
        
        <div id="sb_splash_logo"></div>
        <div id="sb_splash_bg" class="animated"></div>
        
    </div> <!-- Splash screen END -->
    
    <div class="sr-page-status" tabindex="0" aria-live="assertive">
        You are currently on slide 
        <span class="sr-current-page" >#</span> of <span class="sr-total-pages">#</span>: 
        <span class="sr-page-title">Slide title</span>. <span class="sr-has-notes"></span>
    </div>
    
    <!-- Banner (black title) bar -->
    <div id="sbplus_banner_bar">
        
        <div id="sbplus_lesson_title" tabindex="-1"></div>
        
        <div id="sbplus_menu_area">
            
            <button id="sbplus_author_name" tabindex="-1"></button>
            
            <div id="sbplus_menu_btn_wrapper">
                
                <ul id="sbplus_menu_btn" class="root-level" role="menubar" title="Menu">
                    
                    <li class="menu-parent" role="menuitem" aria-label="Menu" tabindex="0" aria-haspopup="true" aria-expanded="false">
                        <span class="icon-menu menu-icon"></span>
                        <ul class="menu" role="menu" aria-hidden="true" aria-expanded="false">
                            
                            <li tabindex="-1" role="menuitem" aria-live="polite" class="menu-item sbplus_author_profile">
                                <a href="javascript:void(0);" onclick="SBPLUS.openMenuItem('sbplus_author_profile');">
                                    <span class="icon-profile"></span>
                                    Author Profile
                                </a>
                            </li>
                            
                            <li tabindex="-1" role="menuitem" aria-live="polite" class="menu-item sbplus_general_info">
                                <a href="javascript:void(0);" onclick="SBPLUS.openMenuItem('sbplus_general_info');">
                                    <span class="icon-info"></span>
                                    General Info
                                </a>
                            </li>
                            
                            <li tabindex="-1" role="menuitem" aria-live="polite" class="menu-item sbplus_settings">
                                <a href="javascript:void(0);" onclick="SBPLUS.openMenuItem('sbplus_settings');">
                                    <span class="icon-settings"></span>
                                    Settings
                                </a>
                            </li>

                            <li id="sbplus_version" tabindex="-1"></li>
                            
                        </ul>
                        
                    </li>
                    
                </ul>
                
            </div>
            
        </div>
        
    </div> <!-- Banner (black title) bar END -->
    
    <div id="sbplus_content_wrapper">
    
        <div id="sbplus_left_col" aria-live="polite" aria-atomic="true">
            
            <div id="sbplus_media_wrapper">
                <div class="sbplus_media_error" tabindex="0"></div>
                <div class="sbplus_media_msg hide" tabindex="0"></div>
                <div class="sbplus_media_content animated" tabindex="0"></div>
            </div>
            
            <div id="sbplus_widget">
                
                <div class="widget_controls_bar">
                    <div class="tab_segment" role="tablist"></div>
                </div>
                
                <div id="widget_content" class="segment_content" role="tabpanel"></div>
                
            </div>
            
        </div>
        
        <div id="sbplus_right_col">
            
            <div id="sbplus_sub_bar">
                <div class="title" tabindex="-1">Contents</div>
            </div>
            
            <nav id="sbplus_table_of_contents_wrapper" tabindex="0"></nav>

            <!-- control bar -->
            <div id="sbplus_control_bar">
        
                <button id="sbplus_new_note_btn" title="View Notes" tabindex="0" aria-label="View Notes">
                    <span class="icon-notes"></span> View Notes
                </button>

                <div id="sbplus_page_status">
                    <div tabindex="0">
                        Slide <span class="current">#</span> of 
                        <span class="total">#</span>
                    </div>
                </div>

                <div class="controls">

                    <button id="sbplus_previous_btn" title="Previous" tabindex="0" aria-label="Previous" aria-controls="sbplus_left_col">
                    <span class="icon-left"></span>
                    </button>
                    
                    <button id="sbplus_next_btn" title="Next" tabindex="0" aria-label="Next" aria-controls="sbplus_left_col">
                        <span class="icon-right"></span>
                    </button>

                    <button id="mobile_toc_toggle_btn" title="Toggle Table of Contents" tabindex="0" aria-label="Toggle Table of Contents" aria-controls="sbplus_table_of_contents_wrapper">
                        <span class="icon-contents"></span>
                    </button>
                    
                    <div id="sbplus_download_btn_wrapper">
                        
                        <div id="sbplus_download_btn" class="root-level" role="menubar" title="Downloads">
                            
                            <div class="menu-parent" role="menuitem" aria-label="Downloads Menu" tabindex="0" aria-haspopup="true" aria-expanded="false">
                                <span class="icon-download"></span>
                                <ul class="downloadFiles menu" role="menu" aria-hidden="true" aria-expanded="false"></ul>
                            </div>
                            
                        </div>
                        
                    </div>

                </div>
                
            </div>
            
        </div>
    
    </div>
    
    <div id="menu_item_content" class="animated" tabindex="-1">
        <div class="sbplus_menu_title_bar">
            <div class="title"></div>
            <button id="sbplus_menu_close_btn"><span class="icon-close"></span> Close</button>
        </div>
        <div class="container">
            <div class="content"></div>
            <div class="side_menu">
                <ul class="menu" role="menu">
                    
                </div>
            </div>
        </div>
    </div>
    
</div>
<!-- END Main SB+ UI -->

<!-- Copyright info -->
<div id="copyright-footer">
    <p>&copy; <span class="copyright-year"></span> <span class="notice"></span></p>
</div>

