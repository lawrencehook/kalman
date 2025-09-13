/**
 * FilterRegistry - Central registry for all filter types
 * Similar to TrajectoryRegistry but for filtering algorithms
 */
class FilterRegistry {
    static _filters = new Map();

    /**
     * Register a filter class
     * @param {string} id - Unique identifier for the filter
     * @param {Function} filterClass - Filter class constructor
     */
    static register(id, filterClass) {
        // Validate filter class has required static properties
        if (!filterClass.displayName) {
            throw new Error(`Filter ${id} must have static displayName property`);
        }

        const filterInfo = {
            id: id,
            displayName: filterClass.displayName,
            description: filterClass.description || '',
            order: filterClass.order || 999,
            filterClass: filterClass
        };

        this._filters.set(id, filterInfo);
        console.log(`📋 Registered filter: ${id} (${filterClass.displayName})`);
    }

    /**
     * Get all registered filters, sorted by order
     * @returns {Array} Array of filter info objects
     */
    static getAll() {
        return Array.from(this._filters.values())
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Get a specific filter by ID
     * @param {string} id - Filter identifier
     * @returns {Object|null} Filter info object or null if not found
     */
    static get(id) {
        return this._filters.get(id) || null;
    }

    /**
     * Create a filter instance
     * @param {string} filterId - Filter identifier
     * @param {Object} config - Filter configuration
     * @returns {Object} Filter instance
     */
    static createFilter(filterId, config = {}) {
        const filterInfo = this.get(filterId);
        if (!filterInfo) {
            throw new Error(`Filter not found: ${filterId}`);
        }

        return new filterInfo.filterClass(config);
    }

    /**
     * Get enum-like constants for easy access
     * @returns {Object} Object with filter IDs as constants
     */
    static getEnum() {
        const enumObj = {};
        for (const [id, info] of this._filters) {
            const constantName = id.toUpperCase().replace(/-/g, '_');
            enumObj[constantName] = id;
        }
        return enumObj;
    }

    /**
     * Check if a filter is registered
     * @param {string} id - Filter identifier
     * @returns {boolean} True if filter is registered
     */
    static has(id) {
        return this._filters.has(id);
    }

    /**
     * Get list of filter IDs
     * @returns {Array} Array of filter IDs
     */
    static getIds() {
        return Array.from(this._filters.keys());
    }
}