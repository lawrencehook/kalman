/**
 * Figure8Trajectory - Generates figure-8 (lemniscate) trajectories
 */
class Figure8Trajectory {
    static displayName = 'Figure-8';
    static description = 'Figure-8 pattern with smooth acceleration changes';
    static order = 3;

    /**
     * Generates a figure-8 trajectory using parametric lemniscate equations
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            scale = 150,          // Overall size scaling - increased for more space usage
            centerX = 0,
            centerY = 0,
            speed = 2.0,          // Speed factor (cycles per duration)
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];
        const omega = 2 * Math.PI * speed / duration; // Angular frequency

        for (let t = 0; t <= duration; t += dt) {
            const theta = omega * t;

            // Lemniscate (figure-8) parametric equations
            // x = a * cos(t) / (1 + sin²(t))
            // y = a * sin(t) * cos(t) / (1 + sin²(t))
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            const denominator = 1 + sinTheta * sinTheta;

            const position = [
                centerX + scale * cosTheta / denominator,
                centerY + scale * sinTheta * cosTheta / denominator
            ];

            // Compute velocity by numerical differentiation
            let velocity = [0, 0];
            if (t > 0) {
                const prevTheta = omega * (t - dt);
                const prevSin = Math.sin(prevTheta);
                const prevCos = Math.cos(prevTheta);
                const prevDenom = 1 + prevSin * prevSin;

                const prevX = centerX + scale * prevCos / prevDenom;
                const prevY = centerY + scale * prevSin * prevCos / prevDenom;

                velocity = [
                    (position[0] - prevX) / dt,
                    (position[1] - prevY) / dt
                ];
            }

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