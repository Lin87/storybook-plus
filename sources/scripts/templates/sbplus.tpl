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
            
            <h1 class="sb_title"></h1>
            <h2 class="sb_subtitle"></h2>
            <p class="sb_author"></p>

            <div class="sb_context">

                <p class="sb_duration"></p>
                <p id="splash_cta" class="sb_cta">
                    <button id="sbplus_start_btn" aria-label="Start presentation">Start</button>
                    <button id="sbplus_resume_btn" aria-label="Resume presentation">Resume</button>
                </p>
                <p class="sb_downloads"></p>

            </div>
 
        </div>
        
        <div id="sb_splash_logo" aria-hidden="true"></div>
        <div id="sb_splash_bg" class="animated"></div>
        
    </div> <!-- Splash screen END -->
    
    <div id="sbplus_main_screen" class="hide" aria-hidden="true">
        <div class="sr-page-status visually-hidden-focusable" tabindex="0">
            You are currently on slide 
            <span class="sr-current-page" >#</span> of <span class="sr-total-pages">#</span>: 
            <span class="sr-page-title">Slide title</span>. <span class="sr-has-notes"></span>
        </div>
        <!-- Banner (black title) bar -->
        <div id="sbplus_banner_bar">
            
            <h1 id="sbplus_lesson_title"></h1>
            
            <div id="sbplus_menu_area">
                
                <button id="sbplus_author_name" aria-label="Show author profile button"></button>
                
                <nav id="sbplus_menu_btn_wrapper" aria-label="Main Menu">
                    <button id="sbplus_menu_btn" aria-label="Toggle Menu" aria-haspopup="menu" aria-expanded="false" aria-controls="sbplus_menu_list">
                        <span class="menu-icon material-symbols-outlined" aria-hidden="true">more_horiz</span>
                    </button>
                    <ul id="sbplus_menu_list" class="menu" aria-hidden="false" role="menu">
    
                        <li class="menu-item sbplus_author_profile" role="none">
                            <button onclick="SBPLUS.openMenuItem('sbplus_author_profile');" aria-controls="menu_item_content" role="menuitem">
                                <span class="material-symbols-outlined small">person</span>
                                Author Profile
                            </button>
                        </li>
                        
                        <li class="menu-item sbplus_general_info" role="none">
                            <button onclick="SBPLUS.openMenuItem('sbplus_general_info');" aria-controls="menu_item_content" role="menuitem">
                                <span class="material-symbols-outlined small" aria-hidden="true">info</span>
                                General Info
                            </button>
                        </li>
                        
                        <li class="menu-item sbplus_settings" role="none">
                            <button onclick="SBPLUS.openMenuItem('sbplus_settings');" aria-controls="menu_item_content" role="menuitem">
                                <span class="material-symbols-outlined small" aria-hidden="true">settings</span>
                                Settings
                            </button>
                        </li>
                        
                    </ul>
                    
                </nav>
                
            </div>
            
        </div> <!-- Banner (black title) bar END -->
        
        <div id="sbplus_content_wrapper">
        
            <div id="sbplus_side_content_col">
                
                <div id="sbplus_sub_bar">
                    <h2 class="title">Contents</h2>
                </div>
                
                <nav id="sbplus_table_of_contents_wrapper" aria-label="Table of Contents"></nav>

                <!-- control bar -->
                <div id="sbplus_control_bar">
            
                    <button id="sbplus_view_note_btn" title="View Notes" aria-label="View Notes">
                        <span class="material-symbols-outlined" aria-hidden="true">notes</span> View Notes
                    </button>

                    <div id="sbplus_page_status">
                        <div>
                            Slide <span class="current">#</span> of 
                            <span class="total">#</span>
                        </div>
                    </div>

                    <div class="controls">

                        <button id="sbplus_previous_btn" title="Previous" aria-label="Previous" aria-controls="sbplus_main_content_col">
                            <span class="material-symbols-outlined large" aria-hidden="true">chevron_backward</span>
                        </button>
                        
                        <button id="sbplus_next_btn" title="Next" aria-label="Next" aria-controls="sbplus_main_content_col">
                            <span class="material-symbols-outlined large" aria-hidden="true">chevron_forward</span>
                        </button>

                        <button id="mobile_toc_toggle_btn" title="Toggle Table of Contents" aria-label="Toggle Table of Contents" aria-controls="sbplus_table_of_contents_wrapper">
                            <span class="material-symbols-outlined" aria-hidden="true">list</span>
                        </button>
                        
                        <div id="sbplus_download_btn_wrapper">
                            
                            <button id="sbplus_download_btn" aria-label="Toggle Downloadable Files" aria-expanded="false" aria-haspopup="menu" aria-expanded="false" aria-controls="sbplus_file_list">
                                <span class="material-symbols-outlined" aria-hidden="true">download</span>
                            </button>
                            <ul id="sbplus_file_list" class="downloadFiles menu" role="menu" aria-hidden="true"></ul>
                            
                        </div>

                    </div>
                    
                </div>
                
            </div>

            <div id="sbplus_main_content_col">
                
                <div id="sbplus_media_wrapper" tabindex="0">
                    <div class="sbplus_media_error"></div>
                    <div class="sbplus_media_msg hide"></div>
                    <div class="sbplus_media_content animated"></div>
                </div>

                <div id="sbplus_quiz_wrapper" class="hidden"></div>
                
                <div id="sbplus_widget">
                    
                    <div class="widget_controls_bar">
                        <div class="tab_segment" role="tablist"></div>
                    </div>
                    
                    <div id="widget_content" class="segment_content"></div>
                    
                </div>

                <a class="visually-hidden-focusable" href="#sbplus_previous_btn">Skip to previous slide button</a>
                <a class="visually-hidden-focusable" href="#sbplus_next_btn">Skip to next slide button</a>
                <a class="visually-hidden-focusable" href="#sbplus_table_of_contents_wrapper">Skip to Table of Contents</a>
                
            </div>
        
        </div>
        
        <div id="menu_item_content" class="animated">
            <div class="sbplus_menu_title_bar">
                <div class="title"></div>
                <button id="sbplus_menu_close_btn"><span class="material-symbols-outlined" aria-hidden="true">close</span> Close</button>
            </div>
            <div class="container">
                <div class="content" tabindex="0"></div>
                <nav class="side_menu">
                    <ul class="menu" role="menu">
                        
                    </div>
                </nav>
            </div>
        </div>

    </div>
    
</div>
<!-- END Main SB+ UI -->

<!-- Copyright info -->
<div id="copyright-footer">
    <p>&copy; <span class="copyright-year"></span> <span class="notice"></span></p>
</div>

