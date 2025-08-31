# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Kalman filter educational and visualization project. The repository contains:

- **kalman.html**: Interactive HTML/JavaScript visualization of 2D Kalman filter with real-time animation
- **kalman_filter_barebones.md**: Concise reference of core Kalman filter equations and symbols
- **kalman_filter_concepts_illustrated.md**: Comprehensive educational material explaining Kalman filter concepts

## Architecture

The application is built with a modular structure separating concerns:

**HTML Structure (`index.html`)**:
- Complete UI layout with controls, visualization canvases, and state displays
- References external CSS and JavaScript files

**Styling (`styles.css`)**:
- Dark theme with professional green/cyan color scheme
- Matrix visualization with mathematical brackets
- Interactive tooltips for educational content
- Responsive flexbox layout

**Logic (`script.js`)**:
- Complete 2D Kalman filter implementation
- Interactive visualization with Canvas API
- Error tracking and graphing capabilities
- Support for different motion models and measurement configurations

Key components in script.js:
- `MatrixUtils` - Matrix operations (multiply, transpose, inverse, etc.)
- `KalmanFilter2D` - Standard Kalman filter with constant acceleration model
- `IMMFilter` - Interactive Multiple Model filter
- `VisualizationEngine` - Canvas-based plotting with zoom/pan
- `ErrorGraphVisualization` - Real-time error analysis
- `StateDisplayEngine` - Live filter state display
- `SimulationController` - Main application coordination

## Development

This project uses vanilla HTML/CSS/JavaScript with no build system or external dependencies. To work with the visualization:

1. Open `index.html` directly in a web browser
2. Modify HTML structure in `index.html`
3. Edit styles in `styles.css`
4. Update logic in `script.js`
5. Refresh the browser to see changes

## File Structure

- `index.html` - Main application HTML structure
- `styles.css` - All CSS styles and visual theming
- `script.js` - Complete JavaScript implementation
- `kalman.html` - Original monolithic file (legacy)
- `kalman_filter_barebones.md` - Quick reference for equations and symbols  
- `kalman_filter_concepts_illustrated.md` - Detailed educational content
- `README.md` - Basic project description

## Key Implementation Details

The Kalman filter implementation supports:
- Configurable state transition matrices for different motion models
- Adjustable process and measurement noise parameters
- Real-time state estimation and uncertainty visualization
- Error metrics and convergence analysis
- Interactive parameter tuning for educational purposes