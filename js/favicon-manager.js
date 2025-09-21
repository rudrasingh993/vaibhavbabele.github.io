/**
 * Favicon Manager - Dynamic Theme-Aware Favicon System
 * Handles favicon switching based on theme, device preferences, and user states
 */
class FaviconManager {
    constructor() {
        this.currentTheme = 'light';
        this.faviconElements = {};
        this.init();
    }

    /**
     * Initialize the favicon manager
     */
    init() {
        this.detectTheme();
        this.createFaviconElements();
        this.setupThemeListener();
        this.setupVisibilityListener();
        this.updateFavicon();
    }

    /**
     * Detect current theme from various sources
     */
    detectTheme() {
        // Check if theme is set in localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
            return;
        }

        // Check data-theme attribute on html element
        const htmlTheme = document.documentElement.getAttribute('data-theme');
        if (htmlTheme) {
            this.currentTheme = htmlTheme;
            return;
        }

        // Check for dark mode class on body
        if (document.body.classList.contains('dark-mode') || 
            document.documentElement.classList.contains('dark-mode')) {
            this.currentTheme = 'dark';
            return;
        }

        // Fall back to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme = 'dark';
        } else {
            this.currentTheme = 'light';
        }
    }

    /**
     * Create and cache favicon elements
     */
    createFaviconElements() {
        // Get existing favicon elements
        this.faviconElements.svg = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
        this.faviconElements.png32 = document.querySelector('link[rel="icon"][sizes="32x32"]');
        this.faviconElements.png16 = document.querySelector('link[rel="icon"][sizes="16x16"]');
        this.faviconElements.appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');

        // Create SVG favicon element if it doesn't exist
        if (!this.faviconElements.svg) {
            this.faviconElements.svg = document.createElement('link');
            this.faviconElements.svg.rel = 'icon';
            this.faviconElements.svg.type = 'image/svg+xml';
            document.head.appendChild(this.faviconElements.svg);
        }
    }

    /**
     * Setup theme change listener
     */
    setupThemeListener() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                this.detectTheme();
                this.updateFavicon();
            });
        }

        // Listen for manual theme changes
        document.addEventListener('themeChanged', (event) => {
            this.currentTheme = event.detail.theme;
            this.updateFavicon();
        });

        // Listen for localStorage changes (for cross-tab synchronization)
        window.addEventListener('storage', (event) => {
            if (event.key === 'theme') {
                this.currentTheme = event.newValue || 'light';
                this.updateFavicon();
            }
        });

        // Observe changes to html data-theme attribute
        if (window.MutationObserver) {
            const observer = new MutationObserver(() => {
                this.detectTheme();
                this.updateFavicon();
            });
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme', 'class']
            });
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    /**
     * Setup page visibility listener for dynamic favicon updates
     */
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.setFaviconState('inactive');
            } else {
                this.setFaviconState('active');
            }
        });
    }

    /**
     * Update favicon based on current theme
     */
    updateFavicon() {
        const basePath = this.getFaviconBasePath();
        
        // Use existing SVG favicon (favicon.svg) as the main favicon
        // The theme-specific versions (favicon-light.svg, favicon-dark.svg) are available
        // but we'll use the main favicon.svg for better compatibility
        if (this.faviconElements.svg) {
            this.faviconElements.svg.href = `${basePath}favicon.svg`;
        }

        // Update theme color meta tag
        this.updateThemeColor();
        
        // Dispatch custom event for other components
        this.dispatchFaviconUpdate();
    }

    /**
     * Set favicon state (active/inactive for tab visibility)
     */
    setFaviconState(state) {
        const basePath = this.getFaviconBasePath();
        let faviconFile;

        if (state === 'inactive') {
            // Use a dimmed version or different icon when tab is not active
            faviconFile = this.currentTheme === 'dark' ? 'favicon-dark.svg' : 'favicon-light.svg';
        } else {
            // Use normal favicon when tab is active
            faviconFile = this.currentTheme === 'dark' ? 'favicon-dark.svg' : 'favicon-light.svg';
        }

        if (this.faviconElements.svg) {
            this.faviconElements.svg.href = `${basePath}${faviconFile}`;
        }
    }

    /**
     * Update theme color meta tag
     */
    updateThemeColor() {
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }

        const themeColors = {
            light: '#4f46e5',
            dark: '#1f2937'
        };

        themeColorMeta.content = themeColors[this.currentTheme] || themeColors.light;
    }

    /**
     * Get the base path for favicon files
     */
    getFaviconBasePath() {
        const currentPath = window.location.pathname;
        const depth = (currentPath.match(/\//g) || []).length - 1;
        
        if (depth === 0) {
            return 'favicon/';
        } else {
            return '../'.repeat(depth) + 'favicon/';
        }
    }

    /**
     * Dispatch favicon update event
     */
    dispatchFaviconUpdate() {
        const event = new CustomEvent('faviconUpdated', {
            detail: {
                theme: this.currentTheme,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manually set theme
     */
    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
        this.updateFavicon();
        
        // Dispatch theme change event
        const event = new CustomEvent('themeChanged', {
            detail: { theme: theme }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current theme
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Preload favicon assets
     */
    preloadFavicons() {
        const basePath = this.getFaviconBasePath();
        const favicons = ['favicon-light.svg', 'favicon-dark.svg', 'favicon.svg'];
        
        favicons.forEach(favicon => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = `${basePath}${favicon}`;
            document.head.appendChild(link);
        });
    }
}

// Initialize favicon manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.faviconManager = new FaviconManager();
    });
} else {
    window.faviconManager = new FaviconManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FaviconManager;
}
