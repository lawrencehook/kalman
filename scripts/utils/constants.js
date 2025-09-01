/**
 * Application Constants
 * Centralized location for all constant values used throughout the application
 */

// ================================
// COLOR PALETTE
// ================================

const COLORS = {
    // Primary theme colors
    BACKGROUND_DARK: '#1a1a1a',
    BACKGROUND_PANEL: '#2a2a2a',
    BACKGROUND_CANVAS: '#0a0a0a',
    
    // UI colors
    BORDER_DEFAULT: '#444',
    TEXT_PRIMARY: '#fff',
    TEXT_SECONDARY: '#aaa',
    TEXT_MUTED: '#888',
    TEXT_INACTIVE: '#666',
    TEXT_ACCENT: '#4af',
    
    // Visualization colors
    GROUND_TRUTH: '#0f0',           // Bright green
    MEASUREMENTS: '#f0f',           // Magenta
    ESTIMATES: '#0ff',              // Cyan
    CONFIDENCE_BOUNDS: '#fa4',      // Orange
    CONFIDENCE_ELLIPSE: 'rgba(0,255,255,0.3)',
    
    // Error graph colors
    ERROR_ACTUAL: '#f44',           // Red
    ERROR_CONFIDENCE: '#fa4',       // Orange
    CURRENT_TIME: '#4af',           // Blue
    
    // Filter-specific colors
    IMM_MODEL_0: '#0f0',            // Green (smooth model)
    IMM_MODEL_1: '#f0f',            // Magenta (maneuver model)
    IMM_INNOVATION_0: '#00cc66',    // Distinct green (smooth model innovation)
    IMM_INNOVATION_1: '#cc6600',    // Distinct orange (maneuver model innovation)
    
    // Grid and axes
    GRID_MAJOR: '#333',
    GRID_MINOR: '#222',
    AXES: '#666',
    
    // UI states
    SUCCESS: '#4f4',                // Green
    WARNING: '#f84',                // Orange
    ERROR: '#f44',                  // Red
    
    // Matrix display
    MATRIX_BRACKETS: '#4af',        // Blue
    MATRIX_VALUES: '#0ff',          // Cyan
    MATRIX_VALUES_INACTIVE: '#666', // Gray
    
    // Generic fallback
    DEFAULT: '#fff'                 // White
};

// ================================
// MATHEMATICAL CONSTANTS
// ================================

const MATH_CONSTANTS = {
    // Statistical thresholds
    CHI_SQUARE_95_2DOF: 5.991,     // χ²(2, 0.95) for 95% confidence in 2D
    
    // Numerical limits
    EPSILON: 1e-10,                 // Small value for numerical stability
    MIN_EIGENVALUE: 1e-12,          // Minimum eigenvalue for matrix operations
    
    // Physical constants
    GRAVITY: 9.81,                  // m/s² (if needed for physics models)
};

// ================================
// UI CONSTANTS
// ================================

const UI_CONSTANTS = {
    // Animation and timing
    ANIMATION_FPS: 60,
    FRAME_TIME_MS: 1000 / 60,
    
    // Canvas dimensions
    DEFAULT_CANVAS_WIDTH: 650,
    DEFAULT_CANVAS_HEIGHT: 450,
    ERROR_GRAPH_HEIGHT: 150,
    
    // UI spacing and sizing
    TOOLTIP_DELAY_MS: 500,
    TOOLTIP_MAX_WIDTH: 300,
    BUTTON_HOVER_TRANSITION: '0.2s',
    
    // Matrix display
    MATRIX_CELL_MIN_WIDTH: 38,
    MATRIX_FONT_SIZE: '9px',
    
    // Precision and formatting
    DEFAULT_DECIMAL_PLACES: 3,
    SCIENTIFIC_NOTATION_THRESHOLD: 1e-6,
    DISPLAY_WIDTH_PADDING: 8,
    
    // Simulation parameters
    DEFAULT_DT: 0.05,               // 20Hz simulation rate
    DEFAULT_MAX_TIME: 30,           // 30 second simulations
    DEFAULT_MEASUREMENT_RATIO: 2.0, // 2x measurement rate vs prediction
    DEFAULT_BOOTSTRAP_COUNT: 3,     // Measurements needed for initialization
};

// ================================
// STRING CONSTANTS
// ================================

const STRINGS = {
    // Application info
    APP_NAME: 'Filter Visualization Lab',
    APP_DESCRIPTION: 'Interactive state estimation and filtering algorithms',
    
    // Default placeholders
    PLACEHOLDER_VALUE: '--',
    LOADING_TEXT: 'Loading...',
    ERROR_TEXT: 'Error',
    
    // Icon symbols (Unicode)
    ICONS: {
        PLAY: '▶',          // Play button
        PAUSE: '⏸',         // Pause button  
        STEP_FORWARD: '⏭',  // Step forward
        STEP_BACKWARD: '⏮', // Step backward
        RESET: '↻',         // Reset/refresh
        EXPAND: '▼',        // Expand section
        COLLAPSE: '▲',      // Collapse section
        SETTINGS: '⚙',      // Settings gear
        INFO: 'ℹ',          // Information
        WARNING: '⚠',       // Warning
        SUCCESS: '✓',       // Check mark
        ERROR: '✗',         // X mark
    },
    
    // Tooltips and help text
    TOOLTIPS: {
        PLAY_PAUSE: 'Play/pause simulation (Space)',
        STEP_FORWARD: 'Step forward one frame (→)',
        STEP_BACKWARD: 'Step backward one frame (←)', 
        RESET: 'Reset simulation (R)',
        ZOOM_INFO: 'Mouse wheel: zoom, Drag: pan, Double-click: reset view',
    }
};

// ================================
// PHYSICS AND FILTER CONSTANTS
// ================================

const FILTER_CONSTANTS = {
    // Default noise parameters
    DEFAULT_MEASUREMENT_NOISE: 15,
    DEFAULT_PROCESS_NOISE: 1.0,
    
    // IMM filter parameters
    IMM_DEFAULT_TRANSITION_PROB: 0.95,  // Probability of staying in same model
    IMM_SMOOTH_NOISE_FACTOR: 0.5,       // Model 0 uses 0.5x process noise
    IMM_MANEUVER_NOISE_FACTOR: 3.0,     // Model 1 uses 3.0x process noise
    
    // Trajectory parameters
    DEFAULT_TRAJECTORY_SCALE: 150,
    
    // Visualization parameters
    CONFIDENCE_ALPHA: 0.3,              // Transparency for confidence ellipses
    TRAJECTORY_FADE_STEPS: 50,          // Number of fading trail points
};

// ================================
// EXPORTS
// ================================

// Make constants available globally
window.COLORS = COLORS;
window.MATH_CONSTANTS = MATH_CONSTANTS;
window.UI_CONSTANTS = UI_CONSTANTS;
window.STRINGS = STRINGS;
window.FILTER_CONSTANTS = FILTER_CONSTANTS;

// Export for modules (if using ES6 modules in future)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COLORS,
        MATH_CONSTANTS,
        UI_CONSTANTS, 
        STRINGS,
        FILTER_CONSTANTS
    };
}