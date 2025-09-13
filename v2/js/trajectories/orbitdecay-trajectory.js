/**
 * OrbitDecayTrajectory - Generates decaying elliptical orbit trajectories
 */
class OrbitDecayTrajectory {
    static displayName = 'Orbit Decay';
    static description = 'Elliptical orbit with gradually decreasing radius';
    static order = 12;

    /**
     * Generates an orbit decay trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            initialRadiusA = 80,      // Initial semi-major axis
            initialRadiusB = 60,      // Initial semi-minor axis
            finalRadiusA = 20,        // Final semi-major axis
            finalRadiusB = 15,        // Final semi-minor axis
            centerX = 0,
            centerY = 0,
            angularVelocity = 1.5,    // rad/s
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];

        for (let t = 0; t <= duration; t += dt) {
            const angle = angularVelocity * t;

            // Decay progress (0 to 1 over duration)
            const decayProgress = Math.min(t / duration, 1.0);

            // Interpolate ellipse radii
            const currentRadiusA = initialRadiusA - (initialRadiusA - finalRadiusA) * decayProgress;
            const currentRadiusB = initialRadiusB - (initialRadiusB - finalRadiusB) * decayProgress;

            // Elliptical position
            const position = [
                centerX + currentRadiusA * Math.cos(angle),
                centerY + currentRadiusB * Math.sin(angle)
            ];

            // Calculate velocity considering both orbital motion and decay
            const radialDecayRateA = -(initialRadiusA - finalRadiusA) / duration;
            const radialDecayRateB = -(initialRadiusB - finalRadiusB) / duration;

            // Orbital velocity components
            const vOrbitalX = -currentRadiusA * angularVelocity * Math.sin(angle);
            const vOrbitalY = currentRadiusB * angularVelocity * Math.cos(angle);

            // Decay velocity components (inward)
            const vDecayX = radialDecayRateA * Math.cos(angle);
            const vDecayY = radialDecayRateB * Math.sin(angle);

            const velocity = [
                vOrbitalX + vDecayX,
                vOrbitalY + vDecayY
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