# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Kalman filter educational and visualization project. The repository contains:

- **index.html**: Main application with interactive HTML interface
- **styles.css**: Complete styling and theming
- **scripts/**: Modular JavaScript implementation with well-organized components
- **kalman_filter_barebones.md**: Concise reference of core Kalman filter equations and symbols
- **kalman_filter_concepts_illustrated.md**: Comprehensive educational material explaining Kalman filter concepts

## Architecture

The application is built with a modular structure separating concerns:

### **CRITICAL ARCHITECTURAL PRINCIPLE: Filter Isolation**

**🚨 MANDATORY RULE: Code outside the `scripts/filters/` directory MUST NEVER contain references to specific filter types (e.g., 'imm', 'kalman-2d', etc.).**

**Why this matters:**
- **Extensibility**: New filters can be added without modifying existing code
- **Maintainability**: Changes to filter implementations don't break other components  
- **Modularity**: Each filter is completely self-contained
- **Registry Pattern**: All filter interaction goes through `FilterRegistry`

**How to follow this rule:**
- **✅ CORRECT**: Use `FilterRegistry.createFilter(filterType, config)` 
- **❌ INCORRECT**: `if (filterType === 'imm') { /* specific behavior */ }`
- **✅ CORRECT**: Filters provide their own UI configurations, plot data, legends
- **❌ INCORRECT**: Hard-coding filter-specific UI or visualization logic

**Enforcement:**
- Visualization components must be completely generic
- Controllers must work with any filter through the registry interface
- UI components must be driven by filter-provided configurations
- Error graphs, legends, and displays must use filter-supplied data structures

This principle ensures the architecture remains scalable as new filtering algorithms are added.

**HTML Structure (`index.html`)**:
- Complete UI layout with controls, visualization canvases, and state displays
- References external CSS and JavaScript files

**Styling (`styles.css`)**:
- Dark theme with professional green/cyan color scheme
- Matrix visualization with mathematical brackets
- Interactive tooltips for educational content
- Responsive flexbox layout

**Modular JavaScript Architecture (`scripts/`)**:
The JavaScript is organized into a well-structured modular system with clear separation of concerns:

**Core Utilities (`scripts/utils/`)**:
- `matrix-utils.js` - Matrix operations (multiply, transpose, inverse, identity, etc.)
- `noise-utils.js` - Gaussian noise generation and application

**Trajectory Generation (`scripts/trajectory/`)**:
- `trajectory-base.js` - Base class for all trajectory generators
- `geometric-generators.js` - Circle, Figure8, Square, Heart, Star, Infinity (6 generators)
- `physics-generators.js` - Motion models: ConstantVelocity, ConstantAcceleration, Sine, Parabolic, StepFunction, StopAndGo, Bezier, MinimumJerk (8 generators)  
- `mathematical-generators.js` - Lissajous curves, Clothoid spirals, RandomFourier (3 generators)
- `random-generators.js` - RandomWalk, Spiral (2 generators)

**Filter Implementations (`scripts/filters/`)**:
- `filter-base.js` - Common interface for all filtering algorithms
- `kalman-filter-2d.js` - Standard 2D Kalman filter with constant acceleration model
- `imm-filter.js` - Interactive Multiple Model filter (dual-model Kalman)

**Generic Plotting Interface**: Filters can provide additional plot data for the error graph:
```javascript
// In filter's extractFilterData method:
filterData.additionalPlotData = [
    {
        series: 'unique_name',    // Series identifier
        value: numericValue,      // Y-axis value to plot
        color: '#rgb',           // Line color
        lineWidth: 2,            // Line thickness
        alpha: 0.7               // Transparency
    }
];
```

**Visualization Components (`scripts/visualization/`)**:
- `visualization-engine.js` - Main canvas visualization with zoom/pan/interaction
- `error-graph.js` - Real-time error analysis and plotting
- `state-display.js` - Live filter state, matrices, and educational displays

**Controllers (`scripts/controllers/`)**:
- `simulation-controller.js` - Main application orchestration and state management
- `ui-controller.js` - User interface event handling and control interactions

**Application (`scripts/app.js`)**:
- Application startup and initialization

## Development

This project uses vanilla HTML/CSS/JavaScript with no build system or external dependencies. The modular architecture provides excellent development experience:

1. **Running the Application**: Open `index.html` directly in a web browser
2. **HTML Structure**: Modify interface layout in `index.html`
3. **Styling**: Edit visual appearance in `styles.css`
4. **Modular Development**: Update specific functionality in relevant module:
   - Add new trajectories in `scripts/trajectory/`
   - Modify filters in `scripts/filters/`
   - Update visualizations in `scripts/visualization/`
   - Adjust UI behavior in `scripts/controllers/`
5. **Testing**: Refresh browser to see changes immediately

**Script Loading Order**: The HTML loads modules in dependency order (utilities → trajectories → filters → visualizations → controllers → app), ensuring proper initialization.

## File Structure

```
kalman/
├── index.html                          # Main application HTML interface
├── styles.css                          # Complete CSS styling and theming
├── scripts/                            # Modular JavaScript architecture
│   ├── utils/                          # Core utilities (2 files)
│   │   ├── matrix-utils.js             # Matrix operations
│   │   └── noise-utils.js              # Gaussian noise generation
│   ├── trajectory/                     # Trajectory generators (5 files)
│   │   ├── trajectory-base.js          # Base class for all trajectories
│   │   ├── geometric-generators.js     # Geometric patterns (6 generators)
│   │   ├── physics-generators.js       # Physics-based motion (8 generators)
│   │   ├── mathematical-generators.js  # Mathematical curves (3 generators)
│   │   └── random-generators.js        # Stochastic patterns (2 generators)
│   ├── filters/                        # Filter implementations (3 files)
│   │   ├── filter-base.js              # Common filter interface
│   │   ├── kalman-filter-2d.js         # Standard 2D Kalman filter
│   │   └── imm-filter.js               # Interactive Multiple Model filter
│   ├── visualization/                  # Visualization engines (3 files)
│   │   ├── visualization-engine.js     # Main canvas with zoom/pan
│   │   ├── error-graph.js              # Error analysis plotting
│   │   └── state-display.js            # State/matrix educational display
│   ├── controllers/                    # Application controllers (2 files)
│   │   ├── simulation-controller.js    # Main simulation orchestration
│   │   └── ui-controller.js            # UI event handling
│   └── app.js                          # Application startup
├── kalman_filter_barebones.md          # Quick reference for equations
├── kalman_filter_concepts_illustrated.md # Detailed educational content
└── README.md                           # Project description
```

## Key Implementation Details

**Modular Architecture Benefits**:
- **Maintainability**: Each module has single responsibility and clear interfaces
- **Extensibility**: Easy to add new trajectory generators, filters, or visualizations
- **Testability**: Individual modules can be unit tested independently  
- **Reusability**: Utility classes and base classes can be shared across components
- **Development Experience**: Clear file organization and dependency management

**Core Features**:
- **20+ Trajectory Generators**: Geometric patterns, physics-based motion, mathematical curves, stochastic processes
- **Advanced Filtering**: Standard Kalman filter + Interactive Multiple Model (IMM) for model switching
- **Educational Visualization**: Real-time matrix displays, error analysis, confidence ellipses
- **Interactive Controls**: Adjustable noise parameters, trajectory selection, filter comparison
- **Professional UI**: Dark theme, tooltips, zoom/pan canvas, responsive layout

**Technical Highlights**:
- Pure vanilla JavaScript (no external dependencies)
- Proper matrix mathematics with numerical stability
- Real-time Canvas rendering with 60fps animation
- Bootstrap filter initialization from measurements
- Coverage analysis and statistical validation

## Git Workflow Preferences

**IMPORTANT**: Only run git add/commit/push commands when explicitly requested by the user. Make code changes as needed, but do not automatically commit them unless specifically asked.