/**
 * LineTrajectory - Generates straight line trajectories
 */
class LineTrajectory {
    static displayName = 'Line';
    static description = 'Straight line motion with constant velocity';
    static order = 1; // Display order in dropdown

    /**
     * Generates a straight line trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            startX = -50,
            startY = 0,
            endX = 50,
            endY = 0,
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];
        const totalDistance = Math.sqrt((endX - startX)**2 + (endY - startY)**2);
        const velocity = totalDistance / duration;

        const directionX = (endX - startX) / totalDistance;
        const directionY = (endY - startY) / totalDistance;

        for (let t = 0; t <= duration; t += dt) {
            const distance = velocity * t;

            const position = [
                startX + distance * directionX,
                startY + distance * directionY
            ];

            const velocityVector = [
                velocity * directionX,
                velocity * directionY
            ];

            const point = {
                time: t,
                position: position,
                velocity: velocityVector
            };

            trajectoryPoints.push(point);
        }

        return trajectoryPoints;
    }
}