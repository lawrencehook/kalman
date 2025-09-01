/**
 * Kalman Filter 2D - Module Export
 * Exports all metadata and functionality for the 2D Kalman filter
 */

// Register this filter with the registry when this module loads
(function() {
    const filterConfig = {
        // Display information
        displayInfo: {
            dropdownLabel: "Kalman (CA 6-state)",
            title: "2D Filter", 
            canvasTitle: "2D Filter",
            description: "Standard filter with constant acceleration motion model"
        },

        // Features supported by this filter
        features: ['standardKalman'],

        // Factory method to create filter instances
        createInstance: (config) => {
            return new KalmanFilter2D(config);
        },

        // Get UI configuration
        getUIConfig: () => {
            return KalmanFilter2DUIConfig.getConfig();
        },

        // Extract filter-specific data (none for basic Kalman)
        extractData: (filterInstance, context = {}) => {
            // Basic Kalman filter has no special data to extract
            return {};
        },

        // Provide error graph legend configuration
        getErrorGraphLegend: () => {
            return [
                { color: COLORS.ERROR_ACTUAL, width: 12, height: 2, label: 'Actual Error' },
                { color: COLORS.CONFIDENCE_BOUNDS, width: 12, height: 2, label: '95% Confidence' },
                { color: COLORS.CURRENT_TIME, width: 2, height: 12, label: 'Current Time' }
            ];
        },

        // Update noise parameters
        updateNoise: (filterInstance, measurementNoise, processNoise) => {
            if (filterInstance.updateNoise) {
                filterInstance.updateNoise(measurementNoise, processNoise);
            }
        },

        // Create filter-specific configuration for initialization
        createFilterConfig: (baseConfig) => {
            return {
                dt: baseConfig.dt,
                measurementNoise: baseConfig.measurementNoise,
                processNoise: baseConfig.processNoise
            };
        }
    };

    // Register with the FilterRegistry
    if (typeof FilterRegistry !== 'undefined') {
        FilterRegistry.register('kalman-2d', filterConfig);
    }
})();