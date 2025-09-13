/**
 * ZigzagTrajectory - Generates zigzag/sawtooth trajectories
 */
class ZigzagTrajectory {
    static displayName = 'Zigzag';
    static description = 'Sharp angular back-and-forth motion';
    static order = 11;

    /**
     * Generates a zigzag trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            amplitude = 40,          // Half-width of zigzag
            wavelength = 30,         // Distance for one complete zigzag cycle
            forwardSpeed = 20,       // Forward motion speed
            centerX = 0,
            centerY = 0,
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];

        for (let t = 0; t <= duration; t += dt) {
            const forwardDistance = forwardSpeed * t;

            // Calculate how many wavelengths we've completed
            const cycleProgress = (forwardDistance % wavelength) / wavelength;

            // Sawtooth wave: linear rise from -1 to 1, then sharp drop
            let zigzagValue;
            if (cycleProgress < 0.5) {
                zigzagValue = -1 + 4 * cycleProgress; // -1 to 1 over first half
            } else {
                zigzagValue = 3 - 4 * cycleProgress;  // 1 to -1 over second half
            }

            const position = [
                centerX + forwardDistance,
                centerY + amplitude * zigzagValue
            ];

            // Calculate velocity
            const forwardVelocity = forwardSpeed;

            // Perpendicular velocity from sawtooth derivative
            const period = wavelength / forwardSpeed; // Time for one complete cycle
            const frequency = 1 / period;
            const perpendicularVelocity = cycleProgress < 0.5 ?
                (4 * amplitude * frequency) :
                (-4 * amplitude * frequency);

            const velocity = [forwardVelocity, perpendicularVelocity];

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