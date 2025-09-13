/**
 * SpiralTrajectory - Generates inward or outward spiral trajectories
 */
class SpiralTrajectory {
    static displayName = 'Spiral';
    static description = 'Spiral pattern with changing radius';
    static order = 8;

    /**
     * Generates a spiral trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            initialRadius = 80,
            finalRadius = 10,
            centerX = 0,
            centerY = 0,
            angularVelocity = 2.0, // rad/s
            spiralDirection = 'inward', // 'inward' or 'outward'
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];
        const radiusStart = spiralDirection === 'inward' ? initialRadius : finalRadius;
        const radiusEnd = spiralDirection === 'inward' ? finalRadius : initialRadius;

        for (let t = 0; t <= duration; t += dt) {
            const angle = angularVelocity * t;

            // Linear interpolation of radius over time
            const progress = t / duration;
            const radius = radiusStart + (radiusEnd - radiusStart) * progress;

            const position = [
                centerX + radius * Math.cos(angle),
                centerY + radius * Math.sin(angle)
            ];

            // Calculate velocity using polar coordinates
            const radiusRate = (radiusEnd - radiusStart) / duration; // dr/dt
            const vr = radiusRate; // Radial velocity
            const vtheta = radius * angularVelocity; // Tangential velocity

            // Convert to Cartesian velocity
            const velocity = [
                vr * Math.cos(angle) - vtheta * Math.sin(angle),
                vr * Math.sin(angle) + vtheta * Math.cos(angle)
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