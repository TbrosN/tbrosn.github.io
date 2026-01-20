// AI-assisted: Main JavaScript coordinator
// Initializes all modules and handles cross-module communication

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        enableAnalytics: false,
        enablePerformanceMonitoring: false,
        debugMode: false
    };
    
    // Log initialization
    function log(...args) {
        if (CONFIG.debugMode) {
            console.log('[Portfolio]', ...args);
        }
    }
    
    // Error handler
    function handleError(error, context = 'Unknown') {
        console.error(`[Portfolio Error - ${context}]`, error);
        
        // Graceful degradation - don't break the site
        // Could send to error tracking service in production
    }
    
    // Check browser support
    function checkBrowserSupport() {
        const features = {
            intersectionObserver: 'IntersectionObserver' in window,
            localStorage: 'localStorage' in window,
            requestAnimationFrame: 'requestAnimationFrame' in window,
            customProperties: CSS.supports('--custom-property', '0'),
            backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)')
        };
        
        log('Browser feature support:', features);
        
        // Show warning for very old browsers
        const isSupported = Object.values(features).filter(Boolean).length >= 4;
        
        if (!isSupported) {
            console.warn('Some features may not be available in your browser');
        }
        
        return features;
    }
    
    // Performance monitoring
    function monitorPerformance() {
        if (!CONFIG.enablePerformanceMonitoring || !window.performance) return;
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                
                if (perfData) {
                    log('Performance metrics:', {
                        'DOM Load': Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart) + 'ms',
                        'Page Load': Math.round(perfData.loadEventEnd - perfData.loadEventStart) + 'ms',
                        'Total Time': Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms'
                    });
                }
            }, 0);
        });
    }
    
    // Initialize external links
    function initExternalLinks() {
        const externalLinks = document.querySelectorAll('a[href^="http"]');
        
        externalLinks.forEach(link => {
            // Add target="_blank" to external links if not already set
            if (!link.getAttribute('target')) {
                link.setAttribute('target', '_blank');
            }
            
            // Add rel="noopener noreferrer" for security
            const rel = link.getAttribute('rel') || '';
            if (!rel.includes('noopener')) {
                link.setAttribute('rel', (rel + ' noopener noreferrer').trim());
            }
        });
    }
    
    // Handle loading states
    function handleLoadingStates() {
        // Remove loading states after everything is initialized
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    }
    
    // Initialize lazy loading for images
    function initLazyLoading() {
        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading is supported
            const images = document.querySelectorAll('img[loading="lazy"]');
            log('Native lazy loading enabled for', images.length, 'images');
        } else {
            // Fallback for browsers that don't support native lazy loading
            const images = document.querySelectorAll('img[loading="lazy"]');
            
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                            }
                            imageObserver.unobserve(img);
                        }
                    });
                });
                
                images.forEach(img => imageObserver.observe(img));
            } else {
                // Just load all images immediately as fallback
                images.forEach(img => {
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                });
            }
        }
    }
    
    // Handle print styles
    function initPrintHandler() {
        window.addEventListener('beforeprint', () => {
            log('Preparing page for print');
            // Could expand collapsed sections, etc.
        });
        
        window.addEventListener('afterprint', () => {
            log('Print completed');
        });
    }
    
    // Initialize analytics (placeholder)
    function initAnalytics() {
        if (!CONFIG.enableAnalytics) return;
        
        // Placeholder for analytics initialization
        // Could integrate Google Analytics, Plausible, etc.
        log('Analytics initialized');
    }
    
    // Main initialization
    function init() {
        try {
            log('Initializing portfolio...');
            
            // Check browser support
            const features = checkBrowserSupport();
            
            // Initialize all modules
            // Note: Individual modules initialize themselves via IIFE
            // This just coordinates them
            
            // Set up external links
            initExternalLinks();
            
            // Initialize lazy loading
            initLazyLoading();
            
            // Set up print handler
            initPrintHandler();
            
            // Initialize analytics
            initAnalytics();
            
            // Monitor performance
            monitorPerformance();
            
            // Handle loading states
            handleLoadingStates();
            
            log('Portfolio initialized successfully');
            
            // Verify all managers are available
            const managers = {
                Theme: window.ThemeManager,
                Scroll: window.ScrollManager,
                Navigation: window.NavigationManager,
                Typewriter: window.TypewriterEffect,
                Counter: window.CounterAnimation
            };
            
            log('Available managers:', Object.keys(managers).filter(key => managers[key]));
            
        } catch (error) {
            handleError(error, 'Initialization');
        }
    }
    
    // Error boundary for the entire application
    window.addEventListener('error', (event) => {
        handleError(event.error, 'Global');
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        handleError(event.reason, 'Promise');
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for debugging
    window.Portfolio = {
        config: CONFIG,
        init: init,
        version: '1.0.0'
    };
})();
