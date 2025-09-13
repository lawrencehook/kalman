/**
 * StationaryTrajectory - Generates stationary (fixed position) trajectories
 */
class StationaryTrajectory {
    static displayName = 'Stationary';
    static description = 'Fixed position - ideal for testing noise filtering';
    static order = 5;

    /**
     * Generates a stationary trajectory (fixed position over time)
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            positionX = 0,
            positionY = 0,
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];

        for (let t = 0; t <= duration; t += dt) {
            const point = {
                time: t,
                position: [positionX, positionY],
                velocity: [0, 0]  // Always zero velocity
            };

            trajectoryPoints.push(point);
        }

        return trajectoryPoints;
    }
}