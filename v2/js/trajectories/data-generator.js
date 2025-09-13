/**
 * DataGenerator - Creates ground truth trajectory sequences
 */
class DataGenerator {
    /**
     * Generates a simple circular trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generateCircle(config = {}) {
        const {
            radius = 50,
            centerX = 0,
            centerY = 0,
            angularVelocity = 1.0, // rad/s
            duration = 10.0,       // seconds
            dt = 0.1               // time step
        } = config;

        const trajectoryPoints = [];

        for (let t = 0; t <= duration; t += dt) {
            const angle = angularVelocity * t;

            const position = [
                centerX + radius * Math.cos(angle),
                centerY + radius * Math.sin(angle)
            ];

            // Optional: compute velocity analytically
            const velocity = [
                -radius * angularVelocity * Math.sin(angle),
                radius * angularVelocity * Math.cos(angle)
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

    /**
     * Generates a simple straight line trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generateStraightLine(config = {}) {
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

    /**
     * Generate trajectory based on type
     * @param {string} type - Trajectory type ('circle', 'line')
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(type, config = {}) {
        switch (type) {
            case 'circle':
                return this.generateCircle(config);
            case 'line':
                return this.generateStraightLine(config);
            default:
                console.warn(`Unknown trajectory type: ${type}, defaulting to circle`);
                return this.generateCircle(config);
        }
    }
}