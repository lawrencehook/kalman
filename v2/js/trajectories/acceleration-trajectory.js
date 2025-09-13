/**
 * AccelerationTrajectory - Generates trajectories with distinct acceleration phases
 */
class AccelerationTrajectory {
    static displayName = 'Acceleration Phases';
    static description = 'Constant velocity → acceleration → constant velocity';
    static order = 13;

    /**
     * Generates a trajectory with acceleration phases
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            startX = -60,
            startY = 0,
            initialVelocity = 15,     // Initial constant velocity
            acceleration = 20,        // Acceleration during middle phase
            finalVelocity = 35,       // Final constant velocity
            phase1Duration = 2.0,     // Constant velocity phase 1
            accelDuration = 3.0,      // Acceleration phase
            phase3Duration = 5.0,     // Constant velocity phase 2
            direction = [1, 0],       // Direction vector [x, y]
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];

        // Normalize direction vector
        const dirLength = Math.sqrt(direction[0]**2 + direction[1]**2);
        const dirX = direction[0] / dirLength;
        const dirY = direction[1] / dirLength;

        let currentX = startX;
        let currentY = startY;
        let currentVelocity = initialVelocity;

        for (let t = 0; t <= duration; t += dt) {
            let velocity, acceleration_current = 0;

            if (t <= phase1Duration) {
                // Phase 1: Constant initial velocity
                velocity = currentVelocity = initialVelocity;
                acceleration_current = 0;
            } else if (t <= phase1Duration + accelDuration) {
                // Phase 2: Constant acceleration
                const accelTime = t - phase1Duration;
                currentVelocity = initialVelocity + acceleration * accelTime;
                velocity = currentVelocity;
                acceleration_current = acceleration;
            } else {
                // Phase 3: Constant final velocity
                velocity = currentVelocity = finalVelocity;
                acceleration_current = 0;
            }

            // Update position
            currentX += velocity * dirX * dt;
            currentY += velocity * dirY * dt;

            const point = {
                time: t,
                position: [currentX, currentY],
                velocity: [velocity * dirX, velocity * dirY],
                acceleration: [acceleration_current * dirX, acceleration_current * dirY] // Optional extra data
            };

            trajectoryPoints.push(point);
        }

        return trajectoryPoints;
    }
}