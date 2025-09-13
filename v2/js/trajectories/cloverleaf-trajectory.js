/**
 * CloverleafTrajectory - Generates four-leaf clover trajectories
 */
class CloverleafTrajectory {
    static displayName = 'Cloverleaf';
    static description = 'Four-lobed rose curve pattern';
    static order = 16;

    /**
     * Generates a cloverleaf (4-leaf rose) trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            petalLength = 60,        // Maximum radius of petals
            centerX = 0,
            centerY = 0,
            rotations = 2,           // Number of complete rotations
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];
        const omega = 2 * Math.PI * rotations / duration; // Angular frequency

        for (let t = 0; t <= duration; t += dt) {
            const theta = omega * t;

            // Rose curve equation: r = a * cos(k*θ)
            // For 4-leaf clover: k = 2, so r = a * cos(2*θ)
            const radius = petalLength * Math.abs(Math.cos(2 * theta));

            const position = [
                centerX + radius * Math.cos(theta),
                centerY + radius * Math.sin(theta)
            ];

            // Calculate velocity using polar coordinate derivatives
            // dr/dt = -a * sin(2*θ) * 2 * dθ/dt * sign(cos(2*θ))
            // dθ/dt = omega
            const radiusRate = petalLength * Math.abs(Math.sin(2 * theta)) * 2 * omega *
                             (Math.cos(2 * theta) >= 0 ? -1 : 1);

            // Convert to Cartesian velocity
            const velocity = [
                radiusRate * Math.cos(theta) - radius * omega * Math.sin(theta),
                radiusRate * Math.sin(theta) + radius * omega * Math.cos(theta)
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