// ================================
// TRAJECTORY GENERATOR BASE CLASS
// ================================

class TrajectoryGenerator {
    constructor(config = {}) {
        this.config = { maxTime: 30, scale: 150, ...config };
    }
    generatePosition(t) { throw new Error('generatePosition must be implemented by subclass'); }
    getName() { return 'Generic Trajectory'; }
}