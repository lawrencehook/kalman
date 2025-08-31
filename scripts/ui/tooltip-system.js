/**
 * Dynamic Tooltip System
 * Provides intelligent positioning and styling for all tooltips
 */

class TooltipSystem {
    constructor() {
        this.tooltip = null;
        this.currentElement = null;
        this.showTimeout = null;
        this.hideTimeout = null;
        this.init();
    }

    init() {
        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'dynamic-tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: #1a1a1a;
            border: 1px solid #4af;
            border-radius: 4px;
            padding: 10px 14px;
            font-size: 13px;
            line-height: 1.4;
            color: #fff;
            font-family: Arial, sans-serif;
            font-weight: normal;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
            opacity: 0;
            transform: translateY(-5px);
            transition: opacity 0.2s ease, transform 0.2s ease;
            max-width: 300px;
            word-wrap: break-word;
            white-space: normal;
        `;
        document.body.appendChild(this.tooltip);

        // Set up event listeners for all tooltip elements
        this.attachListeners();
        
        // Update listeners when DOM changes (for dynamic content)
        this.observeDOM();
    }

    attachListeners() {
        // Find all elements with data-tooltip attribute
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => this.show(e.target));
            element.addEventListener('mouseleave', (e) => this.hide(e.target));
            element.addEventListener('mousemove', (e) => this.updatePosition(e));
        });
    }

    show(element) {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.currentElement = element;
        const tooltipText = element.getAttribute('data-tooltip');
        
        if (!tooltipText) return;

        this.tooltip.textContent = tooltipText;
        this.tooltip.style.display = 'block';
        
        // Position tooltip
        this.positionTooltip(element);
        
        // Show with animation
        this.showTimeout = setTimeout(() => {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.transform = 'translateY(0)';
        }, 100);
    }

    hide(element) {
        if (this.currentElement !== element) return;
        
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }

        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'translateY(-5px)';
        
        this.hideTimeout = setTimeout(() => {
            this.tooltip.style.display = 'none';
            this.currentElement = null;
        }, 200);
    }

    updatePosition(event) {
        if (!this.currentElement || this.tooltip.style.opacity === '0') return;
        this.positionTooltip(this.currentElement, event);
    }

    positionTooltip(element, event = null) {
        const elementRect = element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        let left, top;
        const margin = 10;
        const tooltipHeight = tooltipRect.height || 50; // fallback for initial positioning
        const tooltipWidth = tooltipRect.width || 250;

        // Determine horizontal position
        // Try to center on element first
        left = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        
        // Check if tooltip would go off the left edge
        if (left < margin) {
            left = margin;
        }
        // Check if tooltip would go off the right edge  
        else if (left + tooltipWidth > viewportWidth - margin) {
            left = viewportWidth - tooltipWidth - margin;
        }

        // Determine vertical position
        // Try above element first
        top = elementRect.top - tooltipHeight - margin;
        
        // If not enough space above, position below
        if (top < margin) {
            top = elementRect.bottom + margin;
        }
        
        // If still not enough space, position at top or bottom of viewport
        if (top + tooltipHeight > viewportHeight - margin) {
            if (elementRect.top > viewportHeight / 2) {
                // Element is in bottom half, position at top
                top = margin;
            } else {
                // Element is in top half, position at bottom
                top = viewportHeight - tooltipHeight - margin;
            }
        }

        // Apply scroll offsets
        left += scrollX;
        top += scrollY;

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    }

    observeDOM() {
        // Watch for changes to dynamically update tooltip listeners
        const observer = new MutationObserver((mutations) => {
            let shouldReattach = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if any added nodes have data-tooltip
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.hasAttribute && node.hasAttribute('data-tooltip') ||
                                node.querySelector && node.querySelector('[data-tooltip]')) {
                                shouldReattach = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldReattach) {
                this.attachListeners();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Method to manually trigger tooltip positioning update
    refresh() {
        this.attachListeners();
    }
}

// Initialize tooltip system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tooltipSystem = new TooltipSystem();
    });
} else {
    window.tooltipSystem = new TooltipSystem();
}