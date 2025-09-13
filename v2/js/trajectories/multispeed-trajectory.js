/**
 * MultiSpeedTrajectory - Generates trajectories with different speed segments
 */
class MultiSpeedTrajectory {
    static displayName = 'Multi-Speed';
    static description = 'Different velocity segments along straight path';
    static order = 15;

    /**
     * Generates a multi-speed trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            startX = -60,
            startY = 0,
            endX = 60,
            endY = 0,
            speedSegments = [10, 30, 15, 25], // Different speeds for each segment
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];
        const totalDistance = Math.sqrt((endX - startX)**2 + (endY - startY)**2);
        const directionX = (endX - startX) / totalDistance;
        const directionY = (endY - startY) / totalDistance;

        // Calculate segment durations and distances
        const numSegments = speedSegments.length;
        const segmentDuration = duration / numSegments;

        let currentX = startX;
        let currentY = startY;

        for (let t = 0; t <= duration; t += dt) {
            // Determine current segment
            const segmentIndex = Math.min(Math.floor(t / segmentDuration), numSegments - 1);
            const currentSpeed = speedSegments[segmentIndex];

            // Calculate velocity
            const velocity = [
                currentSpeed * directionX,
                currentSpeed * directionY
            ];

            // Update position
            if (t > 0) {
                currentX += velocity[0] * dt;
                currentY += velocity[1] * dt;

                // Clamp to end position
                if (directionX > 0 && currentX > endX) currentX = endX;
                if (directionX < 0 && currentX < endX) currentX = endX;
                if (directionY > 0 && currentY > endY) currentY = endY;
                if (directionY < 0 && currentY < endY) currentY = endY;
            }

            const point = {
                time: t,
                position: [currentX, currentY],
                velocity: velocity
            };

            trajectoryPoints.push(point);
        }

        return trajectoryPoints;
    }
}