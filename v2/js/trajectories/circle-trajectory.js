/**
 * CircleTrajectory - Generates circular trajectories
 */
class CircleTrajectory {
    static displayName = 'Circle';
    static description = 'Circular motion with constant angular velocity';
    static order = 2; // Display order in dropdown

    /**
     * Generates a circular trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            radius = 50,
            centerX = 0,
            centerY = 0,
            angularVelocity = 1.0, // rad/s
            duration = 10.0,       // seconds
            dt = 0.1               // time step
        } = config;

        const trajectoryPoints = [];

        for (let t = 0; t <= duration; t += dt) {
            const angle = angularVelocity * t;

            const position = [
                centerX + radius * Math.cos(angle),
                centerY + radius * Math.sin(angle)
            ];

            // Compute velocity analytically
            const velocity = [
                -radius * angularVelocity * Math.sin(angle),
                radius * angularVelocity * Math.cos(angle)
            ];

            const point = {
                time: t,
                position: position,
                velocity: velocity
            };

            trajectoryPoints.push(point);
        }

        return trajectoryPoints;
    }
}