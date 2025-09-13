/**
 * TrajectoryRegistry - Central registry for all trajectory types
 * Provides an enum-like structure for trajectory management
 */
class TrajectoryRegistry {
    static trajectories = new Map();

    /**
     * Register a trajectory type
     * @param {string} id - Unique identifier (e.g., 'line', 'circle')
     * @param {Object} trajectoryClass - Class that implements the trajectory
     */
    static register(id, trajectoryClass) {
        if (this.trajectories.has(id)) {
            console.warn(`Trajectory type '${id}' is already registered, overwriting...`);
        }
        this.trajectories.set(id, trajectoryClass);
    }

    /**
     * Get all registered trajectory types
     * @returns {Array} Array of trajectory info objects
     */
    static getAll() {
        const trajectories = [];
        for (const [id, trajectoryClass] of this.trajectories) {
            trajectories.push({
                id: id,
                displayName: trajectoryClass.displayName || id,
                description: trajectoryClass.description || '',
                class: trajectoryClass
            });
        }
        return trajectories.sort((a, b) => (a.order || 999) - (b.order || 999));
    }

    /**
     * Get a trajectory generator by ID
     * @param {string} id - Trajectory type ID
     * @returns {Object|null} Trajectory class or null if not found
     */
    static get(id) {
        return this.trajectories.get(id) || null;
    }

    /**
     * Check if a trajectory type exists
     * @param {string} id - Trajectory type ID
     * @returns {boolean} True if exists
     */
    static has(id) {
        return this.trajectories.has(id);
    }

    /**
     * Generate trajectory points using the registered generator
     * @param {string} type - Trajectory type ID
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(type, config = {}) {
        const trajectoryClass = this.get(type);
        if (!trajectoryClass) {
            console.warn(`Unknown trajectory type: ${type}, falling back to first available`);
            const available = this.getAll();
            if (available.length === 0) {
                throw new Error('No trajectory types registered');
            }
            return available[0].class.generate(config);
        }
        return trajectoryClass.generate(config);
    }

    /**
     * Get trajectory types as enum-like object
     * @returns {Object} Object with trajectory IDs as keys
     */
    static getEnum() {
        const enumObj = {};
        for (const id of this.trajectories.keys()) {
            enumObj[id.toUpperCase()] = id;
        }
        return enumObj;
    }
}