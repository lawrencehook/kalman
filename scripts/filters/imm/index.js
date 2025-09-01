/**
 * IMM Filter - Module Export
 * Exports all metadata and functionality for the IMM filter
 */

// Register this filter with the registry when this module loads
(function() {
    const filterConfig = {
        // Display information
        displayInfo: {
            dropdownLabel: "IMM (2-model: CA low/high noise)",
            title: "IMM Filter (2-Model)",
            canvasTitle: "IMM Filter (2-Model)", 
            description: "Interacting Multiple Model filter with CA low-noise and high-noise models"
        },

        // Features supported by this filter
        features: ['modelProbabilities', 'activeModel', 'modelEntropy'],

        // Factory method to create filter instances
        createInstance: (config) => {
            return new IMMFilter({
                dt: config.dt,
                measurementNoise: config.measurementNoise,
                processNoiseSlow: Math.max(0.1, config.processNoise * 0.5),
                processNoiseFast: config.processNoise * 3.0,
                trans: [[0.94, 0.06], [0.06, 0.94]]
            });
        },

        // Get UI configuration
        getUIConfig: () => {
            return IMMUIConfig.getConfig();
        },

        // Extract filter-specific data
        extractData: (filterInstance, context = {}) => {
            if (!filterInstance.initialized) {
                return {};
            }

            const immData = {};
            
            // Model probabilities
            if (filterInstance.mu) {
                immData.modelProbabilities = [...filterInstance.mu];
                immData.activeModel = filterInstance.mu[0] >= filterInstance.mu[1] ? 0 : 1;
            }
            
            // Calculate model entropy: -Σ μ log μ
            if (filterInstance.mu) {
                let entropy = 0;
                for (const mu of filterInstance.mu) {
                    if (mu > 1e-10) { // avoid log(0)
                        entropy -= mu * Math.log(mu);
                    }
                }
                immData.modelEntropy = entropy;
            }
            
            // Calculate individual model position errors for plotting
            if (filterInstance.models && context.groundTruth) {
                const groundTruth = context.groundTruth;
                const plotData = [];
                
                // Model 0 error (smooth motion)
                if (filterInstance.models[0] && filterInstance.models[0].initialized) {
                    const model0Pos = filterInstance.models[0].getPosition();
                    if (model0Pos) {
                        const error0 = Math.sqrt(
                            Math.pow(groundTruth[0] - model0Pos[0], 2) + 
                            Math.pow(groundTruth[1] - model0Pos[1], 2)
                        );
                        plotData.push({
                            series: 'model0_error',
                            value: error0,
                            color: COLORS.IMM_MODEL_0,
                            lineWidth: 2,
                            alpha: 0.7
                        });
                    }
                }
                
                // Model 1 error (maneuvering motion)
                if (filterInstance.models[1] && filterInstance.models[1].initialized) {
                    const model1Pos = filterInstance.models[1].getPosition();
                    if (model1Pos) {
                        const error1 = Math.sqrt(
                            Math.pow(groundTruth[0] - model1Pos[0], 2) + 
                            Math.pow(groundTruth[1] - model1Pos[1], 2)
                        );
                        plotData.push({
                            series: 'model1_error',
                            value: error1,
                            color: COLORS.IMM_MODEL_1,
                            lineWidth: 2,
                            alpha: 0.7
                        });
                    }
                }
                
                if (plotData.length > 0) {
                    immData.additionalPlotData = plotData;
                }
            }
            
            return immData;
        },

        // Provide error graph legend configuration
        getErrorGraphLegend: () => {
            return [
                { color: COLORS.ERROR_ACTUAL, width: 12, height: 2, label: 'Combined Error' },
                { color: COLORS.CONFIDENCE_BOUNDS, width: 12, height: 2, label: '95% Confidence' },
                { color: COLORS.CURRENT_TIME, width: 2, height: 12, label: 'Current Time' },
                { color: COLORS.IMM_MODEL_0, width: 12, height: 2, label: 'Model 0 Error (Smooth)' },
                { color: COLORS.IMM_MODEL_1, width: 12, height: 2, label: 'Model 1 Error (Maneuver)' }
            ];
        },

        // Update noise parameters
        updateNoise: (filterInstance, measurementNoise, processNoise) => {
            const slow = Math.max(0.1, processNoise * 0.5);
            const fast = processNoise * 3.0;
            filterInstance.models[0].updateNoise?.(measurementNoise, slow);
            filterInstance.models[1].updateNoise?.(measurementNoise, fast);
        },

        // Create filter-specific configuration for initialization
        createFilterConfig: (baseConfig) => {
            return {
                dt: baseConfig.dt,
                measurementNoise: baseConfig.measurementNoise,
                processNoiseSlow: Math.max(0.1, baseConfig.processNoise * 0.5),
                processNoiseFast: baseConfig.processNoise * 3.0,
                trans: [[0.94, 0.06], [0.06, 0.94]]
            };
        }
    };

    // Register with the FilterRegistry
    if (typeof FilterRegistry !== 'undefined') {
        FilterRegistry.register('imm', filterConfig);
    }
})();