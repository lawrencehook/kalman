/**
 * UTurnTrajectory - Generates U-turn trajectories with sharp direction reversal
 */
class UTurnTrajectory {
    static displayName = 'U-Turn';
    static description = 'Sharp 180° direction reversal';
    static order = 14;

    /**
     * Generates a U-turn trajectory
     * @param {Object} config - Generation parameters
     * @returns {Array} Array of TrajectoryPoint objects
     */
    static generate(config = {}) {
        const {
            startX = -50,
            startY = 0,
            turnRadius = 25,
            approachDistance = 30,   // Distance traveled before turn
            exitDistance = 30,       // Distance traveled after turn
            speed = 20,              // Constant speed throughout
            duration = 10.0,
            dt = 0.1
        } = config;

        const trajectoryPoints = [];

        // Calculate phase durations
        const approachTime = approachDistance / speed;
        const turnCircumference = Math.PI * turnRadius; // Half circle
        const turnTime = turnCircumference / speed;
        const exitTime = exitDistance / speed;

        // Turn center position
        const turnCenterX = startX + approachDistance;
        const turnCenterY = startY + turnRadius;

        for (let t = 0; t <= duration; t += dt) {
            let position, velocity;

            if (t <= approachTime) {
                // Phase 1: Approach - straight line
                const distance = speed * t;
                position = [startX + distance, startY];
                velocity = [speed, 0];

            } else if (t <= approachTime + turnTime) {
                // Phase 2: U-turn - semicircular arc
                const turnProgress = (t - approachTime) / turnTime;
                const angle = turnProgress * Math.PI; // 0 to π

                position = [
                    turnCenterX + turnRadius * Math.cos(angle + Math.PI), // Start from left side
                    turnCenterY + turnRadius * Math.sin(angle + Math.PI)
                ];

                // Tangential velocity for circular motion
                velocity = [
                    -speed * Math.sin(angle + Math.PI),
                    speed * Math.cos(angle + Math.PI)
                ];

            } else {
                // Phase 3: Exit - straight line in opposite direction
                const exitElapsed = t - approachTime - turnTime;
                const exitDistance_current = speed * exitElapsed;

                position = [
                    turnCenterX - exitDistance_current,
                    startY
                ];
                velocity = [-speed, 0];
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