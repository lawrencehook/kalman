/**
 * SquareTrajectory - Generates square/rectangular trajectories
 */
class SquareTrajectory {
    static displayName = 'Square';
    static description = 'Rectangular path with sharp corners';
    static order = 7;

    /**
     * Generates a square trajectory with sharp corners
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            sideLength = 80,
            centerX = 0,
            centerY = 0,
            speed = 20,          // Linear speed along each side
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];
        const halfSide = sideLength / 2;

        // Define the four corners of the square
        const corners = [
            [centerX - halfSide, centerY - halfSide], // Bottom-left
            [centerX + halfSide, centerY - halfSide], // Bottom-right
            [centerX + halfSide, centerY + halfSide], // Top-right
            [centerX - halfSide, centerY + halfSide]  // Top-left
        ];

        const sideTime = sideLength / speed; // Time to traverse one side
        const totalCycleTime = sideTime * 4;

        for (let t = 0; t <= duration; t += dt) {
            // Determine which cycle and position within cycle
            const cycleTime = t % totalCycleTime;
            const sideIndex = Math.floor(cycleTime / sideTime);
            const sideProgress = (cycleTime % sideTime) / sideTime;

            // Get current and next corner
            const currentCorner = corners[sideIndex];
            const nextCorner = corners[(sideIndex + 1) % 4];

            // Linear interpolation between corners
            const position = [
                currentCorner[0] + (nextCorner[0] - currentCorner[0]) * sideProgress,
                currentCorner[1] + (nextCorner[1] - currentCorner[1]) * sideProgress
            ];

            // Calculate velocity direction
            const deltaX = nextCorner[0] - currentCorner[0];
            const deltaY = nextCorner[1] - currentCorner[1];
            const sideDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            const velocity = [
                (deltaX / sideDistance) * speed,
                (deltaY / sideDistance) * speed
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