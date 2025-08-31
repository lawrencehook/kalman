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
        extractData: (filterInstance, filterState) => {
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
            
            return immData;
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