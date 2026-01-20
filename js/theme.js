// AI-assisted: Dark/light theme toggle with localStorage persistence
// Handles theme switching, system preference detection, and smooth transitions

(function() {
    'use strict';
    
    const STORAGE_KEY = 'portfolio-theme';
    const THEME_ATTR = 'data-theme';
    const DARK_THEME = 'dark';
    const LIGHT_THEME = 'light';
    
    // Prevent flash of unstyled content
    document.body.classList.add('theme-loading');
    
    // Get stored theme or system preference
    function getInitialTheme() {
        const storedTheme = localStorage.getItem(STORAGE_KEY);
        
        if (storedTheme) {
            return storedTheme;
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return DARK_THEME;
        }
        
        return DARK_THEME; // Default to dark theme (dark-mode-first design)
    }
    
    // Apply theme
    function applyTheme(theme) {
        document.documentElement.setAttribute(THEME_ATTR, theme);
        localStorage.setItem(STORAGE_KEY, theme);
        
        // Update button aria-label
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const label = theme === DARK_THEME ? 'Switch to light mode' : 'Switch to dark mode';
            themeToggle.setAttribute('aria-label', label);
        }
    }
    
    // Toggle theme
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute(THEME_ATTR);
        const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
        applyTheme(newTheme);
    }
    
    // Initialize theme immediately
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    
    // Remove loading class after theme is applied
    setTimeout(() => {
        document.body.classList.remove('theme-loading');
        document.body.classList.add('theme-loaded');
    }, 0);
    
    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
            }
        });
    }
    
    // Set up theme toggle button when DOM is ready
    function initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
            
            // Keyboard accessibility
            themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleTheme();
                }
            });
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
        initThemeToggle();
    }
    
    // Export for use in other modules
    window.ThemeManager = {
        toggle: toggleTheme,
        apply: applyTheme,
        getCurrent: () => document.documentElement.getAttribute(THEME_ATTR),
        isDark: () => document.documentElement.getAttribute(THEME_ATTR) === DARK_THEME
    };
})();
