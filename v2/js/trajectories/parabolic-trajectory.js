/**
 * ParabolicTrajectory - Generates ballistic parabolic trajectories
 */
class ParabolicTrajectory {
    static displayName = 'Parabolic Arc';
    static description = 'Ballistic motion with gravity (constant acceleration)';
    static order = 4;

    /**
     * Generates a parabolic trajectory simulating projectile motion
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            startX = -50,
            startY = 0,
            initialVelocityX = 40,    // m/s horizontal
            initialVelocityY = 30,    // m/s vertical
            gravity = -9.81,          // m/s² (negative for downward)
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];

        for (let t = 0; t <= duration; t += dt) {
            // Kinematic equations for projectile motion
            // x = x0 + v0x * t
            // y = y0 + v0y * t + (1/2) * g * t²
            const position = [
                startX + initialVelocityX * t,
                startY + initialVelocityY * t + 0.5 * gravity * t * t
            ];

            // Velocity equations
            // vx = v0x (constant)
            // vy = v0y + g * t
            const velocity = [
                initialVelocityX,
                initialVelocityY + gravity * t
            ];

            const point = {
                time: t,
                position: position,
                velocity: velocity
            };

            trajectoryPoints.push(point);

            // Stop if object hits ground (y <= initial Y position)
            if (position[1] <= startY && t > 0.1) {
                break;
            }
        }

        return trajectoryPoints;
    }
}