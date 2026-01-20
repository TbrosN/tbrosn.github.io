// AI-assisted: Mobile hamburger menu and navigation functionality
// Handles mobile menu toggle, keyboard navigation, and accessibility

(function() {
    'use strict';
    
    const ACTIVE_CLASS = 'active';
    const MOBILE_MENU_ID = 'mobileMenuToggle';
    const NAV_LINKS_ID = 'navLinks';
    
    // Toggle mobile menu
    function toggleMobileMenu() {
        const toggle = document.getElementById(MOBILE_MENU_ID);
        const navLinks = document.getElementById(NAV_LINKS_ID);
        
        if (!toggle || !navLinks) return;
        
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        // Toggle aria-expanded
        toggle.setAttribute('aria-expanded', !isExpanded);
        
        // Toggle active class on nav links
        navLinks.classList.toggle(ACTIVE_CLASS);
        
        // Prevent body scroll when menu is open on mobile
        if (window.innerWidth < 768) {
            document.body.style.overflow = !isExpanded ? 'hidden' : '';
        }
    }
    
    // Close mobile menu
    function closeMobileMenu() {
        const toggle = document.getElementById(MOBILE_MENU_ID);
        const navLinks = document.getElementById(NAV_LINKS_ID);
        
        if (!toggle || !navLinks) return;
        
        toggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove(ACTIVE_CLASS);
        document.body.style.overflow = '';
    }
    
    // Close menu on escape key
    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    }
    
    // Close menu when clicking outside
    function handleClickOutside(e) {
        const toggle = document.getElementById(MOBILE_MENU_ID);
        const navLinks = document.getElementById(NAV_LINKS_ID);
        
        if (!toggle || !navLinks) return;
        
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded && !toggle.contains(e.target) && !navLinks.contains(e.target)) {
            closeMobileMenu();
        }
    }
    
    // Close menu on window resize
    function handleResize() {
        if (window.innerWidth >= 768) {
            closeMobileMenu();
        }
    }
    
    // Initialize navigation
    function init() {
        const toggle = document.getElementById(MOBILE_MENU_ID);
        const navLinks = document.querySelectorAll('.nav-link');
        
        if (!toggle) return;
        
        // Set up mobile menu toggle
        toggle.addEventListener('click', toggleMobileMenu);
        
        // Close menu when clicking nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Small delay to allow smooth scroll to start
                setTimeout(closeMobileMenu, 100);
            });
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', handleEscapeKey);
        
        // Close menu when clicking outside
        document.addEventListener('click', handleClickOutside);
        
        // Close menu on window resize
        window.addEventListener('resize', handleResize);
        
        // Keyboard navigation for nav links
        navLinks.forEach((link, index) => {
            link.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextLink = navLinks[index + 1] || navLinks[0];
                    nextLink.focus();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevLink = navLinks[index - 1] || navLinks[navLinks.length - 1];
                    prevLink.focus();
                }
            });
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for use in other modules
    window.NavigationManager = {
        toggleMobileMenu: toggleMobileMenu,
        closeMobileMenu: closeMobileMenu
    };
})();
