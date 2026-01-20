// AI-assisted: Terminal-style typewriter effect for hero section
// Cycles through role descriptions with smooth typing and erasing animations

(function() {
    'use strict';
    
    // Configuration
    const ROLES = [
        'Software Engineer',
        'AI/ML Researcher',
        'Music Producer'
    ];
    
    const TYPING_SPEED = 100; // ms per character
    const ERASING_SPEED = 50; // ms per character
    const PAUSE_BEFORE_ERASE = 2000; // ms to pause before erasing
    const PAUSE_BEFORE_TYPE = 500; // ms to pause before typing next
    
    let roleIndex = 0;
    let charIndex = 0;
    let isErasing = false;
    let typingTimeout = null;
    
    // Get the typewriter element
    function getElement() {
        return document.getElementById('typewriterText');
    }
    
    // Type one character
    function type() {
        const element = getElement();
        if (!element) return;
        
        const currentRole = ROLES[roleIndex];
        
        if (!isErasing) {
            // Typing
            if (charIndex < currentRole.length) {
                element.textContent += currentRole.charAt(charIndex);
                charIndex++;
                typingTimeout = setTimeout(type, TYPING_SPEED);
            } else {
                // Finished typing, pause before erasing
                isErasing = true;
                typingTimeout = setTimeout(type, PAUSE_BEFORE_ERASE);
            }
        } else {
            // Erasing
            if (charIndex > 0) {
                element.textContent = currentRole.substring(0, charIndex - 1);
                charIndex--;
                typingTimeout = setTimeout(type, ERASING_SPEED);
            } else {
                // Finished erasing, move to next role
                isErasing = false;
                roleIndex = (roleIndex + 1) % ROLES.length;
                typingTimeout = setTimeout(type, PAUSE_BEFORE_TYPE);
            }
        }
    }
    
    // Start the typewriter effect
    function start() {
        const element = getElement();
        if (!element) return;
        
        // Clear any existing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        
        // Reset state
        roleIndex = 0;
        charIndex = 0;
        isErasing = false;
        element.textContent = '';
        
        // Start typing
        typingTimeout = setTimeout(type, PAUSE_BEFORE_TYPE);
    }
    
    // Stop the typewriter effect
    function stop() {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
    }
    
    // Initialize typewriter
    function init() {
        const element = getElement();
        if (!element) {
            console.warn('Typewriter element not found');
            return;
        }
        
        // Start the effect
        start();
        
        // Pause when tab is not visible (performance optimization)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for use in other modules
    window.TypewriterEffect = {
        start: start,
        stop: stop,
        setRoles: (newRoles) => {
            if (Array.isArray(newRoles) && newRoles.length > 0) {
                ROLES.length = 0;
                ROLES.push(...newRoles);
                stop();
                start();
            }
        }
    };
})();
