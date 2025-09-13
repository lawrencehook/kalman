/**
 * RandomWalkTrajectory - Generates random walk (Brownian motion-like) trajectories
 */
class RandomWalkTrajectory {
    static displayName = 'Random Walk';
    static description = 'Stochastic motion with random direction changes';
    static order = 9;

    /**
     * Box-Muller transform for Gaussian random numbers
     * @private
     */
    static _gaussianRandom(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    /**
     * Generates a random walk trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            startX = 0,
            startY = 0,
            stepSize = 5,            // Standard deviation of each step
            drift = [0, 0],          // Optional drift velocity [vx, vy]
            duration = 10.0,
            dt = 0.1,
            seed = null              // Optional seed for reproducibility
        } = config;

        // Simple seeding (not cryptographically secure)
        if (seed !== null) {
            Math.seedrandom = (function() {
                let s = seed;
                return function() {
                    s = Math.sin(s) * 10000;
                    return s - Math.floor(s);
                };
            })();
        }

        const trajectoryPoints = [];
        let currentX = startX;
        let currentY = startY;
        let prevX = currentX;
        let prevY = currentY;

        for (let t = 0; t <= duration; t += dt) {
            if (t === 0) {
                // Initial position
                const point = {
                    time: t,
                    position: [currentX, currentY],
                    velocity: [0, 0]
                };
                trajectoryPoints.push(point);
                continue;
            }

            // Random step with Gaussian distribution
            const stepX = this._gaussianRandom(0, stepSize) * Math.sqrt(dt);
            const stepY = this._gaussianRandom(0, stepSize) * Math.sqrt(dt);

            // Add drift
            prevX = currentX;
            prevY = currentY;
            currentX += stepX + drift[0] * dt;
            currentY += stepY + drift[1] * dt;

            // Calculate velocity from position change
            const velocity = [
                (currentX - prevX) / dt,
                (currentY - prevY) / dt
            ];

            const point = {
                time: t,
                position: [currentX, currentY],
                velocity: velocity
            };

            trajectoryPoints.push(point);
        }

        return trajectoryPoints;
    }
}