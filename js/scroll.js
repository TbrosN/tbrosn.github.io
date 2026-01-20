// AI-assisted: Scroll-triggered animations using Intersection Observer
// Handles fade-in animations with stagger effects for performance

(function() {
    'use strict';
    
    // Configuration
    const OBSERVER_OPTIONS = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const VISIBLE_CLASS = 'visible';
    const ANIMATED_SELECTOR = '[data-animated]';
    
    // Create Intersection Observer
    function createScrollObserver() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for browsers that don't support Intersection Observer
            // Just show all elements immediately
            document.querySelectorAll(ANIMATED_SELECTOR).forEach(el => {
                el.classList.add(VISIBLE_CLASS);
            });
            return null;
        }
        
        return new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Add visible class when element enters viewport
                    entry.target.classList.add(VISIBLE_CLASS);
                    
                    // Optional: Unobserve after animation to improve performance
                    // observer.unobserve(entry.target);
                }
            });
        }, OBSERVER_OPTIONS);
    }
    
    // Observe elements with stagger effect
    function observeElements(observer) {
        if (!observer) return;
        
        const elements = document.querySelectorAll(ANIMATED_SELECTOR);
        
        elements.forEach((element, index) => {
            // Check if element is in a group that should stagger together
            const parent = element.parentElement;
            const siblings = parent?.querySelectorAll(ANIMATED_SELECTOR);
            
            // Apply stagger delay for grouped elements
            if (siblings && siblings.length > 1) {
                const siblingIndex = Array.from(siblings).indexOf(element);
                element.style.transitionDelay = `${siblingIndex * 100}ms`;
            }
            
            observer.observe(element);
        });
    }
    
    // Update active navigation link based on scroll position
    function updateActiveNav() {
        const sections = document.querySelectorAll('section[data-section]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Find which section is currently in view
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const scrollPosition = window.scrollY + window.innerHeight / 3;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('data-section');
            }
        });
        
        // Update active link
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentSection}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Smooth scroll to section
    function smoothScrollTo(targetId) {
        const target = document.querySelector(targetId);
        
        if (target) {
            const navHeight = document.querySelector('.nav-header')?.offsetHeight || 80;
            const targetPosition = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
    
    // Set up smooth scroll for navigation links
    function initSmoothScroll() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                
                // Only handle internal links
                if (targetId && targetId !== '#') {
                    e.preventDefault();
                    smoothScrollTo(targetId);
                    
                    // Close mobile menu if open
                    const mobileMenu = document.getElementById('navLinks');
                    if (mobileMenu?.classList.contains('active')) {
                        mobileMenu.classList.remove('active');
                        const toggleBtn = document.getElementById('mobileMenuToggle');
                        if (toggleBtn) {
                            toggleBtn.setAttribute('aria-expanded', 'false');
                        }
                    }
                }
            });
        });
    }
    
    // Hide/show navigation on scroll
    let lastScrollY = window.scrollY;
    let ticking = false;
    
    function handleNavScroll() {
        const navHeader = document.querySelector('.nav-header');
        if (!navHeader) return;
        
        const currentScrollY = window.scrollY;
        
        // Show nav when scrolling up, hide when scrolling down
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down
            navHeader.classList.add('hidden');
        } else {
            // Scrolling up
            navHeader.classList.remove('hidden');
        }
        
        lastScrollY = currentScrollY;
        ticking = false;
    }
    
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleNavScroll();
                updateActiveNav();
            });
            ticking = true;
        }
    }
    
    // Initialize scroll functionality
    function init() {
        const observer = createScrollObserver();
        observeElements(observer);
        initSmoothScroll();
        
        // Set up scroll listener with debouncing
        window.addEventListener('scroll', onScroll, { passive: true });
        
        // Initial check for active section
        updateActiveNav();
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for use in other modules
    window.ScrollManager = {
        scrollTo: smoothScrollTo,
        updateActiveNav: updateActiveNav
    };
})();
