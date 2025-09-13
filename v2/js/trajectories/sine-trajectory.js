/**
 * SineTrajectory - Generates sinusoidal wave trajectories
 */
class SineTrajectory {
    static displayName = 'Sine Wave';
    static description = 'Smooth sinusoidal oscillation';
    static order = 6;

    /**
     * Generates a sine wave trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            amplitude = 50,          // Wave amplitude
            frequency = 1.0,         // Hz
            direction = 'horizontal', // 'horizontal', 'vertical', or 'both'
            centerX = -300,          // Start much further left to keep trajectory on screen
            centerY = 0,
            speed = 30,              // Forward speed for horizontal waves
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];
        const omega = 2 * Math.PI * frequency; // Angular frequency

        for (let t = 0; t <= duration; t += dt) {
            let position, velocity;

            switch (direction) {
                case 'horizontal':
                    // Horizontal sine wave (moving forward with vertical oscillation)
                    position = [
                        centerX + speed * t,
                        centerY + amplitude * Math.sin(omega * t)
                    ];
                    velocity = [
                        speed,
                        amplitude * omega * Math.cos(omega * t)
                    ];
                    break;

                case 'vertical':
                    // Vertical sine wave (moving upward with horizontal oscillation)
                    position = [
                        centerX + amplitude * Math.sin(omega * t),
                        centerY + speed * t
                    ];
                    velocity = [
                        amplitude * omega * Math.cos(omega * t),
                        speed
                    ];
                    break;

                case 'both':
                    // Both X and Y sinusoidal (Lissajous curve)
                    position = [
                        centerX + amplitude * Math.sin(omega * t),
                        centerY + amplitude * Math.cos(omega * t * 1.3) // Different frequency
                    ];
                    velocity = [
                        amplitude * omega * Math.cos(omega * t),
                        -amplitude * omega * 1.3 * Math.sin(omega * t * 1.3)
                    ];
                    break;

                default:
                    // Default to horizontal
                    position = [
                        centerX + speed * t,
                        centerY + amplitude * Math.sin(omega * t)
                    ];
                    velocity = [
                        speed,
                        amplitude * omega * Math.cos(omega * t)
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