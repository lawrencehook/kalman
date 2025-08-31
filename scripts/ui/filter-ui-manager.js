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
    }

    /**
     * Initialize the UI manager with DOM containers
     */
    initialize() {
        this.statePanelContainer = document.querySelector('.state-panel');
        this.systemMatricesContainer = document.querySelector('.system-matrices') || 
            this.createSystemMatricesContainer();
        this.equationsContainer = document.querySelector('.filter-equations');
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
    }

    /**
     * Get UI configuration for a filter type
     * @param {string} filterType - The filter type
     * @returns {Object|null} The configuration object
     */
    getFilterConfig(filterType) {
        switch (filterType) {
            case 'kalman-filter-2d':
                return KalmanFilter2DUIConfig.getConfig();
            case 'imm':
                return IMMUIConfig.getConfig();
            // Future filters can be added here
            // case 'particle-filter':
            //     return ParticleFilterUIConfig.getConfig();
            default:
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
            <h2 style="color: #4af; text-align: center; margin-top: 0; cursor: help;" 
                data-tooltip="The ${config.filterName} waits for a few measurements to initialize, then fuses measurements with the motion model.">
                Filter State
            </h2>
            
            <div id="measurementStatus" class="measurement-indicator bootstrapping">
                Bootstrapping (0/3)
            </div>
        `;

        // Generate sections
        const stateVectorHtml = StateRenderer.createStateVector(config.stateVector);
        
        // IMM-specific sections
        let modelProbabilitiesHtml = '';
        let activeModelHtml = '';
        if (config.modelProbabilities) {
            // Convert models to metrics format for StateRenderer
            const modelProbConfig = {
                title: config.modelProbabilities.title,
                tooltip: config.modelProbabilities.tooltip,
                metrics: config.modelProbabilities.models
            };
            modelProbabilitiesHtml = StateRenderer.createMetricsSection(modelProbConfig);
        }
        if (config.activeModel) {
            activeModelHtml = `
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
        const fullHtml = titleHtml + stateVectorHtml + modelProbabilitiesHtml + activeModelHtml + 
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
        // Set up matrices toggle with optional callback
        EquationRenderer.setupMatricesToggle('matricesSection', 'toggleMatrices', onMatrixToggle);
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

        // Update model probabilities (IMM-specific)
        if (additionalData.modelProbabilities && config.modelProbabilities) {
            config.modelProbabilities.models.forEach((model, index) => {
                const probability = additionalData.modelProbabilities[index];
                if (probability !== undefined) {
                    StateRenderer.updateStateValue(model.id, (probability * 100).toFixed(1) + '%');
                }
            });
        }

        // Update active model (IMM-specific)
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

        // Update measurement status
        const statusElement = document.getElementById('measurementStatus');
        if (statusElement) {
            if (isBootstrapping) {
                statusElement.className = 'measurement-indicator bootstrapping';
            } else {
                statusElement.className = 'measurement-indicator';
            }
        }
    }

    /**
     * Update measurement status display
     * @param {string} status - Status text to display
     * @param {string} className - CSS class for styling
     */
    updateMeasurementStatus(status, className = 'measurement-indicator') {
        const statusElement = document.getElementById('measurementStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = className;
        }
    }
}