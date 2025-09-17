// ===== PORTFOLIO WEBSITE - ADVANCED JAVASCRIPT =====
// Modern, performance-optimized JavaScript with smooth animations

// ===== GLOBAL VARIABLES & CONFIGURATION =====
const CONFIG = {
    // Animation timing
    ANIMATION_DURATION: {
        fast: 150,
        normal: 300,
        slow: 500
    },
    
    // Intersection Observer options
    OBSERVER_OPTIONS: {
        root: null,
        rootMargin: '-10% 0px -10% 0px',
        threshold: 0.1
    },
    
    // Throttle/debounce timing
    THROTTLE_DELAY: 16, // ~60fps
    DEBOUNCE_DELAY: 300,
    
    // Breakpoints
    BREAKPOINTS: {
        mobile: 640,
        tablet: 968,
        desktop: 1200
    }
};

// ===== UTILITY FUNCTIONS =====
class Utils {
    // Throttle function for performance
    static throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }
    
    // Debounce function for performance
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    // Smooth scroll to element
    static scrollTo(element, offset = 0) {
        const elementTop = element.offsetTop - offset;
        window.scrollTo({
            top: elementTop,
            behavior: 'smooth'
        });
    }
    
    // Check if element is in viewport
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Get current breakpoint
    static getCurrentBreakpoint() {
        const width = window.innerWidth;
        if (width <= CONFIG.BREAKPOINTS.mobile) return 'mobile';
        if (width <= CONFIG.BREAKPOINTS.tablet) return 'tablet';
        return 'desktop';
    }
    
    // Animate CSS properties
    static animate(element, properties, duration = CONFIG.ANIMATION_DURATION.normal) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const startValues = {};
            
            // Get initial values
            for (const prop in properties) {
                startValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
            }
            
            function updateAnimation(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                
                // Update properties
                for (const prop in properties) {
                    const start = startValues[prop];
                    const end = properties[prop];
                    const current = start + (end - start) * easeOut;
                    
                    if (prop === 'opacity') {
                        element.style.opacity = current;
                    } else if (prop === 'transform') {
                        element.style.transform = `translateY(${current}px)`;
                    }
                }
                
                if (progress < 1) {
                    requestAnimationFrame(updateAnimation);
                } else {
                    resolve();
                }
            }
            
            requestAnimationFrame(updateAnimation);
        });
    }
}

// ===== LOADING SCREEN MANAGER =====
class LoadingScreen {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.querySelector('.loading-progress');
        this.isLoaded = false;
    }
    
    init() {
        // Simulate loading progress
        this.simulateProgress();
        
        // Hide loading screen when everything is loaded
        window.addEventListener('load', () => {
            setTimeout(() => this.hide(), 500);
        });
        
        // Fallback: hide after 3 seconds maximum
        setTimeout(() => {
            if (!this.isLoaded) this.hide();
        }, 3000);
    }
    
    simulateProgress() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) {
                progress = 100;
                clearInterval(interval);
            }
            this.progressBar.style.width = `${progress}%`;
        }, 100);
    }
    
    hide() {
        if (this.isLoaded) return;
        this.isLoaded = true;
        
        this.loadingScreen.classList.add('hidden');
        document.body.style.overflow = 'visible';
        
        // Remove from DOM after animation
        setTimeout(() => {
            this.loadingScreen.remove();
        }, 500);
    }
}

// ===== NAVIGATION MANAGER =====
class Navigation {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.navMenu = document.getElementById('nav-menu');
        this.hamburger = document.getElementById('hamburger');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.isMenuOpen = false;
        
        this.init();
    }
    
    init() {
        this.setupScrollEffect();
        this.setupMobileMenu();
        this.setupSmoothScroll();
        this.setupActiveSection();
    }
    
    setupScrollEffect() {
        const handleScroll = Utils.throttle(() => {
            if (window.scrollY > 50) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        }, CONFIG.THROTTLE_DELAY);
        
        window.addEventListener('scroll', handleScroll);
    }
    
    setupMobileMenu() {
        this.hamburger.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // Close menu when clicking nav links
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (this.isMenuOpen) {
                    this.toggleMobileMenu();
                }
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.navMenu.contains(e.target) && !this.hamburger.contains(e.target)) {
                this.toggleMobileMenu();
            }
        });
    }
    
    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.navMenu.classList.toggle('active');
        this.hamburger.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = this.isMenuOpen ? 'hidden' : 'visible';
    }
    
    setupSmoothScroll() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    Utils.scrollTo(targetElement, 80);
                }
            });
        });
    }
    
    setupActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        
        const handleScroll = Utils.throttle(() => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });
            
            this.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }, CONFIG.THROTTLE_DELAY);
        
        window.addEventListener('scroll', handleScroll);
    }
}

// ===== THEME MANAGER =====
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.toggleButtons = document.querySelectorAll('.theme-toggle');
        
        this.init();
    }
    
    init() {
        this.applyTheme(this.currentTheme);
        this.setupToggleButtons();
    }
    
    setupToggleButtons() {
        this.toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.toggleTheme();
            });
        });
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }
    
    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update toggle icons
        this.toggleButtons.forEach(button => {
            const icon = button.querySelector('.toggle-icon');
            icon.textContent = theme === 'light' ? '🌙' : '☀️';
        });
    }
}

// ===== PORTFOLIO FILTER =====
class PortfolioFilter {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.portfolioItems = document.querySelectorAll('.portfolio-item');
        
        this.init();
    }
    
    init() {
        this.setupFilterButtons();
    }
    
    setupFilterButtons() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                this.filterPortfolio(filter);
                this.updateActiveButton(button);
            });
        });
    }
    
    filterPortfolio(filter) {
        this.portfolioItems.forEach(item => {
            const category = item.getAttribute('data-category');
            const shouldShow = filter === 'all' || category === filter;
            
            if (shouldShow) {
                this.showItem(item);
            } else {
                this.hideItem(item);
            }
        });
    }
    
    showItem(item) {
        item.style.display = 'block';
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 10);
    }
    
    hideItem(item) {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        setTimeout(() => {
            item.style.display = 'none';
        }, CONFIG.ANIMATION_DURATION.normal);
    }
    
    updateActiveButton(activeButton) {
        this.filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }
}

// ===== MODAL MANAGER =====
class ModalManager {
    constructor() {
        this.modal = document.getElementById('project-modal');
        this.modalBody = document.getElementById('modal-body');
        this.closeButtons = document.querySelectorAll('[onclick="closeProjectModal()"]');
        
        this.init();
    }
    
    init() {
        this.setupCloseEvents();
    }
    
    setupCloseEvents() {
        // Close button events
        this.closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.close();
            });
        });
        
        // Close on overlay click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.close();
                }
            });
        }
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }
    
    open(content) {
        this.modalBody.innerHTML = content;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = 'visible';
    }
}

// ===== PROJECT MODAL CONTENT =====
const ProjectModals = {
    mangopets: {
        title: "MangoPets - Ultimate Pet Lifestyle App",
        image: "assets/mangopets-preview.jpg",
        description: "A comprehensive pet lifestyle application that combines health management, social community features, and event discovery. Built with modern web technologies and optimized for mobile-first experience.",
        technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "SEO Optimization", "Performance Optimization"],
        features: [
            "Health management dashboard for pets",
            "Social community for pet parents",
            "Event discovery and booking system",
            "Mobile-first responsive design",
            "Interactive app screenshots gallery",
            "Comprehensive SEO optimization"
        ],
        challenges: "Creating an engaging user experience while maintaining fast loading times and mobile optimization. Implemented advanced CSS animations and interactive elements without sacrificing performance.",
        results: "Successfully launched with excellent mobile performance scores and user engagement. Optimized for search engines with comprehensive structured data implementation.",
        liveUrl: "https://mymangopets.com",
        category: "Web Application"
    },
    
    phoenixstar: {
        title: "Phoenix Star Inc - Corporate Website",
        image: "assets/phoenixstar-preview.jpg",
        description: "Professional corporate website showcasing comprehensive business services with modern design, optimal user experience, and strong SEO foundation.",
        technologies: ["HTML5", "CSS3", "JavaScript", "SEO Optimization", "Responsive Design", "Performance Optimization"],
        features: [
            "Modern professional design system",
            "Comprehensive service showcase",
            "Interactive contact forms",
            "Multi-page architecture",
            "Cross-browser compatibility",
            "Mobile-optimized experience"
        ],
        challenges: "Balancing professional aesthetics with modern web standards while ensuring fast loading times across all devices and browsers.",
        results: "Delivered a polished corporate presence with excellent performance metrics and professional user experience that effectively communicates the company's expertise.",
        liveUrl: "https://ohlluu.github.io/phoenixstar/",
        category: "Corporate Website"
    },
    
    ecommerce: {
        title: "E-Commerce Platform Solution",
        image: null,
        description: "Custom e-commerce platforms with secure payment processing, comprehensive inventory management, and conversion-optimized user experience.",
        technologies: ["React", "Node.js", "PostgreSQL", "Stripe API", "Redis", "AWS"],
        features: [
            "Secure payment processing with Stripe",
            "Real-time inventory management",
            "Advanced product filtering and search",
            "Shopping cart and wishlist functionality",
            "Order tracking and management",
            "Admin dashboard with analytics"
        ],
        challenges: "Building secure, scalable e-commerce solutions that handle high traffic while maintaining fast performance and ensuring PCI compliance.",
        results: "Delivered robust e-commerce platforms that increase conversion rates by 35% on average, with 99.9% uptime and secure transaction processing.",
        liveUrl: null,
        category: "E-Commerce Development"
    },
    
    dashboard: {
        title: "Analytics Dashboard Platform",
        image: null,
        description: "Interactive analytics dashboard with real-time data visualization, custom reporting capabilities, and performance metrics tracking.",
        technologies: ["Vue.js", "D3.js", "Python", "WebSocket", "MongoDB", "Docker"],
        features: [
            "Real-time data visualization",
            "Interactive charts and graphs",
            "Custom report generation",
            "Multi-user collaboration",
            "Data export functionality",
            "Mobile-responsive design"
        ],
        challenges: "Creating performant real-time visualizations while handling large datasets and ensuring smooth user interactions across different screen sizes.",
        results: "Delivered powerful analytics platforms that help businesses make data-driven decisions, with 50% improvement in decision-making speed reported by clients.",
        liveUrl: null,
        category: "Web Application"
    }
};

// ===== FORM HANDLER =====
class FormHandler {
    constructor() {
        this.contactForm = document.getElementById('contact-form');
        this.initEmailJS();
        this.init();
    }
    
    initEmailJS() {
        // Initialize EmailJS with your public key
        if (typeof emailjs !== 'undefined') {
            emailjs.init('YOUR_PUBLIC_KEY'); // You'll replace this with your actual public key
        }
    }
    
    init() {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => {
                this.handleSubmit(e);
            });
        }
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.contactForm);
        const data = Object.fromEntries(formData);
        
        // Basic validation
        if (!this.validateForm(data)) {
            return;
        }
        
        // Show loading state
        this.showLoadingState();
        
        // Send email using EmailJS
        emailjs.send(
            'service_ohlluu', // Service ID (you'll need to create this)
            'template_ohlluu', // Template ID (you'll need to create this)
            {
                from_name: data.name,
                from_email: data.email,
                company: data.company || 'Not specified',
                budget: data.budget || 'Not specified',
                project_type: data.project_type || 'Not specified',
                message: data.message,
                to_email: 'ohlluumarketing@gmail.com'
            },
            'YOUR_PUBLIC_KEY' // Public key (you'll get this from EmailJS)
        ).then(
            (response) => {
                console.log('Email sent successfully!', response.status, response.text);
                this.showSuccessMessage();
                this.contactForm.reset();
            },
            (error) => {
                console.error('Email failed to send:', error);
                this.showError('Failed to send message. Please try again or email me directly at ohlluumarketing@gmail.com');
            }
        );
    }
    
    validateForm(data) {
        if (!data.name || !data.email || !data.message) {
            this.showError('Please fill in all required fields.');
            return false;
        }
        
        if (!this.isValidEmail(data.email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }
        
        return true;
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    showLoadingState() {
        const submitButton = this.contactForm.querySelector('.form-submit');
        const originalText = submitButton.querySelector('.btn-text').textContent;
        
        submitButton.disabled = true;
        submitButton.querySelector('.btn-text').textContent = 'Sending...';
        submitButton.style.opacity = '0.7';
    }
    
    showSuccessMessage() {
        const submitButton = this.contactForm.querySelector('.form-submit');
        
        submitButton.disabled = false;
        submitButton.querySelector('.btn-text').textContent = 'Message Sent! ✓';
        submitButton.style.background = '#10B981';
        
        setTimeout(() => {
            submitButton.querySelector('.btn-text').textContent = 'Send Message';
            submitButton.style.background = '';
            submitButton.style.opacity = '';
        }, 3000);
    }
    
    showError(message) {
        // Create or update error message
        let errorElement = this.contactForm.querySelector('.form-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            errorElement.style.cssText = `
                color: #EF4444;
                background: rgba(239, 68, 68, 0.1);
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                font-size: 14px;
                border: 1px solid rgba(239, 68, 68, 0.3);
            `;
            this.contactForm.insertBefore(errorElement, this.contactForm.firstChild);
        }
        
        errorElement.textContent = message;
        
        // Remove error after 5 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
    }
}

// ===== SCROLL ANIMATIONS =====
class ScrollAnimations {
    constructor() {
        this.observer = null;
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.observeElements();
    }
    
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, CONFIG.OBSERVER_OPTIONS);
    }
    
    observeElements() {
        // Elements to animate on scroll
        const elementsToAnimate = document.querySelectorAll(`
            .portfolio-item,
            .service-card,
            .skill-category,
            .contact-card,
            .about-stats .stat
        `);
        
        elementsToAnimate.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(50px)';
            element.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.observer.observe(element);
        });
    }
    
    animateElement(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }
}

// ===== PERFORMANCE MONITORING =====
class PerformanceMonitor {
    constructor() {
        this.init();
    }
    
    init() {
        this.monitorPageLoad();
        this.setupLazyLoading();
    }
    
    monitorPageLoad() {
        window.addEventListener('load', () => {
            // Log performance metrics
            const navigation = performance.getEntriesByType('navigation')[0];
            const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
            
            console.log(`Page loaded in ${loadTime}ms`);
            
            // Track Core Web Vitals if supported
            if ('PerformanceObserver' in window) {
                this.trackWebVitals();
            }
        });
    }
    
    trackWebVitals() {
        // Track Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            console.log('LCP:', lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Track First Input Delay (FID)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                console.log('FID:', entry.processingStart - entry.startTime);
            });
        }).observe({ entryTypes: ['first-input'] });
    }
    
    setupLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    }
}

// ===== GLOBAL MODAL FUNCTIONS =====
// These functions are called from HTML onclick attributes
window.openProjectModal = function(projectId) {
    const modalManager = window.modalManager;
    const project = ProjectModals[projectId];
    
    if (!project || !modalManager) return;
    
    const modalContent = `
        <div class="project-modal-content">
            <div class="project-modal-header">
                <div class="project-modal-category">${project.category}</div>
                <h2 class="project-modal-title">${project.title}</h2>
                <p class="project-modal-description">${project.description}</p>
                ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" class="btn btn-primary" style="margin-top: 1rem;">View Live Site</a>` : ''}
            </div>
            
            ${project.image ? `
                <div class="project-modal-image">
                    <img src="${project.image}" alt="${project.title}" style="width: 100%; border-radius: 12px; margin: 2rem 0;">
                </div>
            ` : ''}
            
            <div class="project-modal-details">
                <div class="project-modal-section">
                    <h3>Technologies Used</h3>
                    <div class="tech-tags" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 1rem;">
                        ${project.technologies.map(tech => `<span class="tech-tag" style="background: var(--gradient-primary); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${tech}</span>`).join('')}
                    </div>
                </div>
                
                <div class="project-modal-section" style="margin-top: 2rem;">
                    <h3>Key Features</h3>
                    <ul style="margin-top: 1rem; list-style: none; padding: 0;">
                        ${project.features.map(feature => `<li style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;"><span style="color: var(--primary); font-weight: 600;">✓</span>${feature}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="project-modal-section" style="margin-top: 2rem;">
                    <h3>Challenges & Solutions</h3>
                    <p style="margin-top: 1rem; line-height: 1.6; color: var(--text-secondary);">${project.challenges}</p>
                </div>
                
                <div class="project-modal-section" style="margin-top: 2rem;">
                    <h3>Results & Impact</h3>
                    <p style="margin-top: 1rem; line-height: 1.6; color: var(--text-secondary);">${project.results}</p>
                </div>
                
                ${project.liveUrl ? `
                    <div class="project-modal-actions" style="margin-top: 2rem; text-align: center;">
                        <a href="${project.liveUrl}" target="_blank" class="btn btn-primary">Visit Live Site</a>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <style>
            .project-modal-content {
                max-width: 100%;
            }
            
            .project-modal-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .project-modal-category {
                display: inline-block;
                background: var(--gradient-primary);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 1rem;
            }
            
            .project-modal-title {
                font-size: 2rem;
                font-weight: 800;
                color: var(--text-primary);
                margin-bottom: 1rem;
                line-height: 1.2;
            }
            
            .project-modal-description {
                font-size: 1.125rem;
                color: var(--text-secondary);
                line-height: 1.6;
                max-width: 600px;
                margin: 0 auto;
            }
            
            .project-modal-section h3 {
                font-size: 1.25rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 0.5rem;
            }
            
            @media (max-width: 640px) {
                .project-modal-title {
                    font-size: 1.5rem;
                }
                
                .project-modal-description {
                    font-size: 1rem;
                }
                
                .tech-tags {
                    justify-content: center;
                }
            }
        </style>
    `;
    
    modalManager.open(modalContent);
};

window.closeProjectModal = function() {
    const modalManager = window.modalManager;
    if (modalManager) {
        modalManager.close();
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Ohlluu Portfolio - Initializing...');
    
    // Initialize all components
    const loadingScreen = new LoadingScreen();
    const navigation = new Navigation();
    const themeManager = new ThemeManager();
    const portfolioFilter = new PortfolioFilter();
    const modalManager = new ModalManager();
    const formHandler = new FormHandler();
    const scrollAnimations = new ScrollAnimations();
    const performanceMonitor = new PerformanceMonitor();
    
    // Make modal manager globally available
    window.modalManager = modalManager;
    
    // Initialize loading screen
    loadingScreen.init();
    
    console.log('✅ Portfolio initialized successfully!');
    
    // Add some easter eggs for developers
    console.log(`
    🎨 Welcome to Ohlluu's Portfolio!
    
    Built with:
    - Vanilla JavaScript (ES6+)
    - Modern CSS (Grid, Flexbox, Custom Properties)
    - Performance-optimized animations
    - Mobile-first responsive design
    - Accessibility best practices
    
    💼 Looking for a developer? Let's connect!
    📧 ohlluumarketing@gmail.com
    `);
});

// ===== SERVICE WORKER REGISTRATION (PWA SUPPORT) =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}