// AI-assisted: Animated number counters for impact metrics
// Animates from 0 to target value when element enters viewport

(function() {
    'use strict';
    
    // Configuration
    const COUNTER_SELECTOR = '[data-counter]';
    const DURATION = 1500; // Animation duration in ms
    const FPS = 60;
    const FRAME_DURATION = 1000 / FPS;
    
    // Easing function for smooth animation
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }
    
    // Format number with appropriate suffix/prefix
    function formatNumber(value, prefix = '', suffix = '') {
        let formatted;
        
        if (value >= 1000000) {
            formatted = (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 100000) {
            formatted = (value / 1000).toFixed(0) + 'k';
        } else if (value >= 1000) {
            formatted = (value / 1000).toFixed(0) + 'k';
        } else {
            formatted = Math.floor(value).toString();
        }
        
        return prefix + formatted + suffix;
    }
    
    // Animate a single counter
    function animateCounter(element, targetValue, prefix, suffix) {
        const startTime = performance.now();
        let animationFrame;
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / DURATION, 1);
            const easedProgress = easeOutQuart(progress);
            const currentValue = easedProgress * targetValue;
            
            element.textContent = formatNumber(currentValue, prefix, suffix);
            
            if (progress < 1) {
                animationFrame = requestAnimationFrame(update);
            } else {
                // Ensure final value is exact
                element.textContent = formatNumber(targetValue, prefix, suffix) + '+';
            }
        }
        
        animationFrame = requestAnimationFrame(update);
        
        // Store cancel function
        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }
    
    // Set up Intersection Observer for counters
    function createCounterObserver() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: Just show the final values
            document.querySelectorAll(COUNTER_SELECTOR).forEach(element => {
                const target = parseInt(element.getAttribute('data-counter'), 10);
                const prefix = element.getAttribute('data-prefix') || '';
                const suffix = element.getAttribute('data-suffix') || '';
                element.textContent = formatNumber(target, prefix, suffix) + '+';
            });
            return null;
        }
        
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };
        
        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    // Mark as animated to prevent re-triggering
                    entry.target.dataset.animated = 'true';
                    
                    const targetValue = parseInt(entry.target.getAttribute('data-counter'), 10);
                    const prefix = entry.target.getAttribute('data-prefix') || '';
                    const suffix = entry.target.getAttribute('data-suffix') || '';
                    
                    if (!isNaN(targetValue)) {
                        animateCounter(entry.target, targetValue, prefix, suffix);
                    }
                }
            });
        }, observerOptions);
    }
    
    // Initialize counters
    function init() {
        const observer = createCounterObserver();
        
        if (!observer) return;
        
        // Observe all counter elements
        const counters = document.querySelectorAll(COUNTER_SELECTOR);
        counters.forEach(counter => {
            // Set initial value
            counter.textContent = '0';
            observer.observe(counter);
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for use in other modules
    window.CounterAnimation = {
        animate: (element, targetValue, prefix = '', suffix = '') => {
            if (element instanceof HTMLElement) {
                return animateCounter(element, targetValue, prefix, suffix);
            }
        },
        format: formatNumber
    };
})();
