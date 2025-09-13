// ================================
// RANDOM TRAJECTORY GENERATORS
// ================================

class RandomWalkGenerator extends TrajectoryGenerator {
    constructor(config = {}) { super(config); this.positions = []; this.generateWalk(); }
    generateWalk() {
        const { maxTime, scale } = this.config;
        const dt = 0.05;
        const steps = Math.ceil(maxTime / dt);
        const stepSize = scale * 0.02;
        let x = 0, y = 0;
        this.positions = [];
        for (let i = 0; i <= steps; i++) {
            this.positions.push([x, y]);
            const angle = Math.random() * 2 * Math.PI;
            x += stepSize * Math.cos(angle);
            y += stepSize * Math.sin(angle);
            const maxPos = scale * 1.2;
            x = Math.max(-maxPos, Math.min(maxPos, x));
            y = Math.max(-maxPos, Math.min(maxPos, y));
        }
    }
    generatePosition(t) {
        const dt = 0.05;
        const index = Math.min(Math.floor(t / dt), this.positions.length - 1);
        return this.positions[index];
    }
    getName() { return 'Random Walk'; }
}

class SpiralGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const phase = t * 4 * Math.PI / maxTime;
        const radius = scale * (0.2 + 0.8 * t / maxTime);
        const x = radius * Math.cos(phase);
        const y = radius * Math.sin(phase);
        return [x, y];
    }
    getName() { return 'Spiral'; }
}