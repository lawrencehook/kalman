/**
 * StopGoTrajectory - Generates stop-and-go motion trajectories
 */
class StopGoTrajectory {
    static displayName = 'Stop-and-Go';
    static description = 'Alternating motion and stationary periods';
    static order = 10;

    /**
     * Generates a stop-and-go trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            startX = -50,
            startY = 0,
            endX = 50,
            endY = 0,
            moveDuration = 2.0,      // Time spent moving
            stopDuration = 1.0,      // Time spent stopped
            speed = 20,              // Speed during motion phases
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];
        const cycleTime = moveDuration + stopDuration;
        const totalDistance = Math.sqrt((endX - startX)**2 + (endY - startY)**2);
        const directionX = (endX - startX) / totalDistance;
        const directionY = (endY - startY) / totalDistance;

        let currentX = startX;
        let currentY = startY;

        for (let t = 0; t <= duration; t += dt) {
            const cyclePosition = t % cycleTime;
            let velocity = [0, 0];

            if (cyclePosition < moveDuration) {
                // Moving phase
                velocity = [speed * directionX, speed * directionY];
                currentX += velocity[0] * dt;
                currentY += velocity[1] * dt;

                // Clamp to end position
                if (directionX > 0 && currentX > endX) currentX = endX;
                if (directionX < 0 && currentX < endX) currentX = endX;
                if (directionY > 0 && currentY > endY) currentY = endY;
                if (directionY < 0 && currentY < endY) currentY = endY;
            } else {
                // Stopped phase - maintain position
                velocity = [0, 0];
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