/**
 * Dynamic Filter UI Manager
 * Orchestrates the creation and management of filter-specific UI elements
 */

class FilterUIManager {
    constructor() {
        this.currentFilterConfig = null;
        this.statePanelContainer = null;
        this.systemMatricesContainer = null;
        this.equationsContainer = null;
        this.stateDisplayEngine = null;
    }

    /**
     * Initialize the UI manager with DOM containers
     */
    initialize() {
        this.statePanelContainer = document.querySelector('.state-panel');
        this.systemMatricesContainer = document.querySelector('.system-matrices') || 
            this.createSystemMatricesContainer();
        this.equationsContainer = document.querySelector('.filter-equations');
        this.stateDisplayEngine = new StateDisplayEngine();
    }

    /**
     * Load and display UI for a specific filter
     * @param {string} filterType - Type of filter (e.g., 'kalman-filter-2d')
     * @param {Object} filterInstance - The filter instance
     */
    loadFilterUI(filterType, filterInstance) {
        // Get UI configuration for this filter type
        const config = this.getFilterConfig(filterType);
        if (!config) {
            console.error(`No UI configuration found for filter type: ${filterType}`);
            return;
        }

        this.currentFilterConfig = config;

        // Generate and inject the UI
        this.generateStatePanel(config);
        this.generateSystemMatricesSection(config);
        this.generateEquationsSection(config);
        
        // Reset timeline initialization after UI regeneration
        if (this.stateDisplayEngine) {
            this.stateDisplayEngine.initialized = false;
        }
        
        // Re-setup event handlers after generating new UI
        if (this.matrixToggleCallback) {
            this.setupEventHandlers(this.matrixToggleCallback);
        }
    }

    /**
     * Get UI configuration for a filter type
     * @param {string} filterType - The filter type
     * @returns {Object|null} The configuration object
     */
    getFilterConfig(filterType) {
        try {
            return FilterRegistry.getUIConfig(filterType);
        } catch (error) {
            console.error(`Failed to get UI config for filter: ${filterType}`, error);
            return null;
        }
    }

    /**
     * Generate the state panel HTML
     * @param {Object} config - Filter UI configuration
     */
    generateStatePanel(config) {
        if (!this.statePanelContainer) return;

        // Create filter state title
        const titleHtml = `
            <h2 style="color: ${COLORS.TEXT_ACCENT}; text-align: center; margin-top: 0; cursor: help;" 
                data-tooltip="The ${config.filterName} waits for a few measurements to initialize, then fuses measurements with the motion model.">
                Filter State
            </h2>
            
            <div id="measurementTimeline" class="measurement-timeline">
                <!-- Timeline circles will be generated dynamically -->
            </div>
        `;

        // Generate sections
        const stateVectorHtml = StateRenderer.createStateVector(config.stateVector);
        
        // Filter-specific sections (dynamic based on config)
        let filterSpecificHtml = '';
        
        // Model probabilities section (if supported)
        if (config.modelProbabilities) {
            const modelProbConfig = {
                title: config.modelProbabilities.title,
                tooltip: config.modelProbabilities.tooltip,
                metrics: config.modelProbabilities.models
            };
            filterSpecificHtml += StateRenderer.createMetricsSection(modelProbConfig);
        }
        
        // Active model section (if supported)
        if (config.activeModel) {
            filterSpecificHtml += `
                <div class="state-section">
                    <h3 data-tooltip="${config.activeModel.tooltip}">${config.activeModel.title}</h3>
                    <div class="state-row">
                        <span class="state-value" id="${config.activeModel.id}">--</span>
                    </div>
                </div>
            `;
        }
        
        const positionCovarianceHtml = StateRenderer.createMatrixSection(config.positionCovariance);
        const errorMetricsHtml = StateRenderer.createMetricsSection(config.errorMetrics);
        const innovationHtml = StateRenderer.createMatrixSection(config.innovation);
        const kalmanGainHtml = StateRenderer.createMatrixSection(config.kalmanGain);

        // Combine all sections
        const fullHtml = titleHtml + stateVectorHtml + filterSpecificHtml + 
                        positionCovarianceHtml + errorMetricsHtml + innovationHtml + kalmanGainHtml;

        this.statePanelContainer.innerHTML = fullHtml;

        // Ensure matrix CSS classes exist
        MatrixRenderer.ensureMatrixClass(...config.positionCovariance.size);
        MatrixRenderer.ensureMatrixClass(...config.innovation.size);
        MatrixRenderer.ensureMatrixClass(...config.kalmanGain.size);
    }


    /**
     * Generate the system matrices section HTML
     * @param {Object} config - Filter UI configuration
     */
    generateSystemMatricesSection(config) {
        if (!this.systemMatricesContainer) return;

        const systemMatricesHtml = EquationRenderer.createSystemMatricesSection({
            title: config.systemMatrices.title,
            matrices: config.systemMatrices.matrices,
            equations: null // Equations are now rendered separately
        });

        this.systemMatricesContainer.outerHTML = systemMatricesHtml;
        
        // Re-get the container reference after replacing
        this.systemMatricesContainer = document.querySelector('.system-matrices');

        // Ensure all matrix CSS classes exist
        config.systemMatrices.matrices.forEach(matrix => {
            MatrixRenderer.ensureMatrixClass(...matrix.size);
        });
    }

    /**
     * Generate the equations section HTML
     * @param {Object} config - Filter UI configuration
     */
    generateEquationsSection(config) {
        if (!this.equationsContainer || !config.equations) return;

        const equationsHtml = EquationRenderer.createEquationsDisplay(config.equations);
        this.equationsContainer.innerHTML = equationsHtml;
    }

    /**
     * Create system matrices container if it doesn't exist
     */
    createSystemMatricesContainer() {
        const container = document.createElement('div');
        container.className = 'system-matrices';
        document.body.appendChild(container);
        return container;
    }

    /**
     * Set up event handlers for dynamic UI elements
     * @param {Function} onMatrixToggle - Optional callback when matrix visibility changes
     */
    setupEventHandlers(onMatrixToggle = null) {
        // Store callback for future use
        if (onMatrixToggle) {
            this.matrixToggleCallback = onMatrixToggle;
        }
        
        // Set up matrices toggle with optional callback
        EquationRenderer.setupMatricesToggle('matricesSection', 'toggleMatrices', onMatrixToggle || this.matrixToggleCallback);
    }

    /**
     * Update filter state display
     * @param {Object} filterState - Current filter state
     * @param {Object} additionalData - Additional display data (errors, coverage, etc.)
     */
    updateDisplay(filterState, additionalData = {}) {
        if (!this.currentFilterConfig) return;

        const config = this.currentFilterConfig;

        // Update state vector
        if (filterState.state && config.stateVector) {
            config.stateVector.dimensions.forEach((dim, index) => {
                const value = filterState.state[index] ? filterState.state[index][0] : null;
                StateRenderer.updateStateValue(dim.id, value);
            });
        }

        // Update position covariance
        if (filterState.positionCovariance && config.positionCovariance) {
            MatrixRenderer.updateMatrix('position-covariance-matrix', filterState.positionCovariance);
        }

        // Update filter-specific sections (dynamic based on config)
        if (additionalData.modelProbabilities && config.modelProbabilities) {
            config.modelProbabilities.models.forEach((model, index) => {
                const probability = additionalData.modelProbabilities[index];
                if (probability !== undefined) {
                    StateRenderer.updateStateValue(model.id, (probability * 100).toFixed(1) + '%');
                }
            });
        }

        if (additionalData.activeModel !== undefined && config.activeModel) {
            const modelName = additionalData.activeModel === 0 ? 'CA Low-Noise' : 'CA High-Noise';
            StateRenderer.updateStateValue(config.activeModel.id, modelName);
        }

        // Update error metrics
        if (additionalData.errorMetrics && config.errorMetrics) {
            config.errorMetrics.metrics.forEach(metric => {
                if (additionalData.errorMetrics[metric.id] !== undefined) {
                    StateRenderer.updateStateValue(metric.id, additionalData.errorMetrics[metric.id]);
                }
            });
        }

        // Update innovation
        if (filterState.innovation && config.innovation) {
            MatrixRenderer.updateMatrix('innovation-matrix', filterState.innovation);
        }

        // Update Kalman gain
        if (filterState.kalmanGain && config.kalmanGain) {
            MatrixRenderer.updateMatrix('kalman-gain-matrix', filterState.kalmanGain);
        }

        // Update system matrices
        if (filterState.systemMatrices && config.systemMatrices) {
            config.systemMatrices.matrices.forEach(matrix => {
                if (filterState.systemMatrices[matrix.name]) {
                    MatrixRenderer.updateMatrix(matrix.id, filterState.systemMatrices[matrix.name]);
                }
            });
        }

        // Update timeline display via StateDisplayEngine
        if (this.stateDisplayEngine) {
            console.log('Full filterState object:', filterState);
            console.log('FilterUIManager passing to timeline:', {
                initialized: filterState.initialized,
                hadMeasurement: filterState.hadMeasurement,
                bootstrapCount: filterState.bootstrapCount,
                bootstrapNeeded: filterState.bootstrapNeeded
            });
            this.stateDisplayEngine.updateTimeline(
                filterState.initialized, 
                filterState.hadMeasurement, 
                filterState.bootstrapCount, 
                filterState.bootstrapNeeded
            );
        }
    }

    /**
     * Set bootstrap state (inactive/active)
     * @param {boolean} isBootstrapping - Whether the filter is in bootstrap mode
     */
    setBootstrapState(isBootstrapping) {
        if (!this.currentFilterConfig) return;

        const config = this.currentFilterConfig;
        const allElementIds = [
            ...config.stateVector.dimensions.map(d => d.id),
            ...config.errorMetrics.metrics.map(m => m.id)
        ];

        StateRenderer.setInactiveState(allElementIds, isBootstrapping);

        // Timeline is now managed by StateDisplayEngine
    }

    // updateMeasurementStatus method removed - timeline now managed by StateDisplayEngine
}