/**
 * Filter Registry - Central registry for all available filters
 * Provides a modular system for filter management without hardcoded references
 */

class FilterRegistry {
    static #filters = new Map();

    /**
     * Register a filter with the system
     * @param {string} key - Unique identifier for the filter
     * @param {Object} config - Filter configuration object
     */
    static register(key, config) {
        this.#filters.set(key, config);
    }

    /**
     * Get all available filters for dropdown population
     * @returns {Array} Array of filter options
     */
    static getAvailableFilters() {
        return Array.from(this.#filters.entries()).map(([key, config]) => ({
            value: key,
            label: config.displayInfo.dropdownLabel,
            description: config.displayInfo.description
        }));
    }

    /**
     * Create a filter instance
     * @param {string} filterKey - Filter identifier
     * @param {Object} config - Filter configuration
     * @returns {Object} Filter instance
     */
    static createFilter(filterKey, config) {
        const filterConfig = this.#filters.get(filterKey);
        if (!filterConfig) {
            throw new Error(`Unknown filter type: ${filterKey}`);
        }
        return filterConfig.createInstance(config);
    }

    /**
     * Get UI configuration for a filter
     * @param {string} filterKey - Filter identifier
     * @returns {Object} UI configuration
     */
    static getUIConfig(filterKey) {
        const filterConfig = this.#filters.get(filterKey);
        if (!filterConfig) {
            throw new Error(`Unknown filter type: ${filterKey}`);
        }
        return filterConfig.getUIConfig();
    }

    /**
     * Get display information for a filter
     * @param {string} filterKey - Filter identifier
     * @returns {Object} Display information (title, description, etc.)
     */
    static getDisplayInfo(filterKey) {
        const filterConfig = this.#filters.get(filterKey);
        if (!filterConfig) {
            throw new Error(`Unknown filter type: ${filterKey}`);
        }
        return filterConfig.displayInfo;
    }

    /**
     * Check if a filter supports specific features
     * @param {string} filterKey - Filter identifier
     * @param {string} feature - Feature name (e.g., 'modelProbabilities')
     * @returns {boolean} Whether the filter supports the feature
     */
    static supportsFeature(filterKey, feature) {
        const filterConfig = this.#filters.get(filterKey);
        return filterConfig && filterConfig.features && filterConfig.features.includes(feature);
    }

    /**
     * Extract filter-specific data from filter instance
     * @param {string} filterKey - Filter identifier
     * @param {Object} filterInstance - The filter instance
     * @returns {Object} Filter-specific data
     */
    static extractFilterData(filterKey, filterInstance) {
        const filterConfig = this.#filters.get(filterKey);
        if (!filterConfig || !filterConfig.extractData) {
            return {};
        }
        return filterConfig.extractData(filterInstance);
    }

    /**
     * Update noise parameters for a filter
     * @param {string} filterKey - Filter identifier
     * @param {Object} filterInstance - Filter instance
     * @param {number} measurementNoise - Measurement noise value
     * @param {number} processNoise - Process noise value
     */
    static updateNoise(filterKey, filterInstance, measurementNoise, processNoise) {
        const filterConfig = this.#filters.get(filterKey);
        if (!filterConfig || !filterConfig.updateNoise) {
            throw new Error(`Filter ${filterKey} does not support noise updates`);
        }
        filterConfig.updateNoise(filterInstance, measurementNoise, processNoise);
    }

    /**
     * Get error graph legend configuration for a filter
     * @param {string} filterKey - Filter identifier
     * @returns {Array} Legend configuration array
     */
    static getErrorGraphLegend(filterKey) {
        const filterConfig = this.#filters.get(filterKey);
        if (!filterConfig || !filterConfig.getErrorGraphLegend) {
            // Return default legend if filter doesn't provide one
            return [
                { color: '#f44', width: 12, height: 2, label: 'Actual Error' },
                { color: '#fa4', width: 12, height: 2, label: '95% Confidence' },
                { color: '#4af', width: 2, height: 12, label: 'Current Time' }
            ];
        }
        return filterConfig.getErrorGraphLegend();
    }

    /**
     * Get all registered filter keys
     * @returns {Array<string>} Array of filter keys
     */
    static getFilterKeys() {
        return Array.from(this.#filters.keys());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterRegistry;
}