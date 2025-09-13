/**
 * CAFilter - 2D Constant Acceleration Kalman filter
 *
 * State vector: [x, y, vx, vy, ax, ay] (position, velocity, acceleration)
 * 6-dimensional state space for full 2D motion modeling
 */
class CAFilter {
    static displayName = 'Constant Acceleration';
    static description = 'Standard Kalman filter with constant acceleration model';
    static order = 1;
    /**
     * Simple 2x2 matrix inverse
     * @private
     */
    static _inverse2x2(matrix) {
        const [[a, b], [c, d]] = matrix;
        const det = a * d - b * c;
        if (Math.abs(det) < 1e-10) {
            throw new Error("Matrix is singular");
        }
        return [
            [d / det, -b / det],
            [-c / det, a / det]
        ];
    }

    /**
     * Matrix multiplication
     * @private
     */
    static _multiply(A, B) {
        const rows = A.length;
        const cols = B[0].length;
        const inner = B.length;

        const result = Array(rows).fill().map(() => Array(cols).fill(0));

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                for (let k = 0; k < inner; k++) {
                    result[i][j] += A[i][k] * B[k][j];
                }
            }
        }
        return result;
    }

    /**
     * Matrix addition
     * @private
     */
    static _add(A, B) {
        return A.map((row, i) => row.map((val, j) => val + B[i][j]));
    }

    /**
     * Matrix subtraction
     * @private
     */
    static _subtract(A, B) {
        return A.map((row, i) => row.map((val, j) => val - B[i][j]));
    }

    /**
     * Process measurements through CA Kalman filter
     * @param {Object} filterInput - FilterInput schema object
     * @returns {Object} FilterOutput schema object
     */
    static process(filterInput) {
        const { measurements, config } = filterInput;
        const { processNoise, measurementNoise, dt, estimateRatio, trajectoryPoints } = config;

        // Default parameters
        const defaultDt = dt || 0.1;
        const defaultMeasNoise = measurementNoise || 5.0;
        const q = processNoise || 1.0;

        // Wait for at least 3 measurements to estimate initial velocity and acceleration
        const minMeasurementsNeeded = Math.min(5, measurements.length);
        let state, bootstrapTime;

        if (measurements.length < 3) {
            // Fallback to simple initialization if too few measurements
            state = [
                [measurements[0].position[0]],  // x
                [measurements[0].position[1]],  // y
                [0],                            // vx
                [0],                            // vy
                [0],                            // ax
                [0]                             // ay
            ];
            bootstrapTime = measurements[0].time;
        } else {
            // Use actual measurements available, not theoretical count
            const p1 = measurements[0];
            const p2 = measurements[Math.floor(minMeasurementsNeeded / 2)];
            const p3 = measurements[minMeasurementsNeeded - 1];

            const dt1 = p2.time - p1.time;
            const dt2 = p3.time - p2.time;

            // Velocity estimates
            const v1x = dt1 > 0 ? (p2.position[0] - p1.position[0]) / dt1 : 0;
            const v1y = dt1 > 0 ? (p2.position[1] - p1.position[1]) / dt1 : 0;
            const v2x = dt2 > 0 ? (p3.position[0] - p2.position[0]) / dt2 : 0;
            const v2y = dt2 > 0 ? (p3.position[1] - p2.position[1]) / dt2 : 0;

            // Acceleration estimates
            const ax = (dt1 > 0 && dt2 > 0) ? (v2x - v1x) / ((dt1 + dt2) / 2) : 0;
            const ay = (dt1 > 0 && dt2 > 0) ? (v2y - v1y) / ((dt1 + dt2) / 2) : 0;

            // Initialize state at the last measurement used for estimation
            state = [
                [p3.position[0]],   // x
                [p3.position[1]],   // y
                [v2x],              // vx
                [v2y],              // vy
                [ax],               // ax
                [ay]                // ay
            ];
            bootstrapTime = p3.time; // Filter starts estimating AFTER this time
        }

        // Initial covariance (6x6 for CA model)
        let P = [
            [100, 0, 0, 0, 0, 0],
            [0, 100, 0, 0, 0, 0],
            [0, 0, 50, 0, 0, 0],
            [0, 0, 0, 50, 0, 0],
            [0, 0, 0, 0, 10, 0],
            [0, 0, 0, 0, 0, 10]
        ];

        // Constant acceleration motion model (6x6)
        const F = [
            [1, 0, defaultDt, 0, defaultDt*defaultDt/2, 0],
            [0, 1, 0, defaultDt, 0, defaultDt*defaultDt/2],
            [0, 0, 1, 0, defaultDt, 0],
            [0, 0, 0, 1, 0, defaultDt],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ];

        // Process noise covariance (6x6)
        const dt2 = defaultDt * defaultDt;
        const dt3 = dt2 * defaultDt;
        const dt4 = dt3 * defaultDt;
        const Q = [
            [q*dt4/4, 0, q*dt3/2, 0, q*dt2/2, 0],
            [0, q*dt4/4, 0, q*dt3/2, 0, q*dt2/2],
            [q*dt3/2, 0, q*dt2, 0, q*defaultDt, 0],
            [0, q*dt3/2, 0, q*dt2, 0, q*defaultDt],
            [q*dt2/2, 0, q*defaultDt, 0, q, 0],
            [0, q*dt2/2, 0, q*defaultDt, 0, q]
        ];

        // Measurement matrix (observe position only) - 2x6
        const H = [
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0]
        ];

        // Identity matrices for calculations
        const I6 = [
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ];

        const HT = [[1, 0], [0, 1], [0, 0], [0, 0], [0, 0], [0, 0]]; // H transpose

        const estimates = [];

        // Don't emit estimates during bootstrap period - filter is still initializing
        // Tick-based processing: fixed 0.1s ticks, measurements and estimates on different schedules
        if (!trajectoryPoints || trajectoryPoints.length === 0) {
            return { estimates };
        }

        // Start processing AFTER bootstrap period
        const startTime = bootstrapTime + defaultDt; // Start one tick after initialization
        const endTime = trajectoryPoints[trajectoryPoints.length - 1].time;

        if (startTime >= endTime) {
            // Not enough time after bootstrap to generate estimates
            return { estimates };
        }

        const totalTicks = Math.round((endTime - startTime) / defaultDt);

        // Calculate tick intervals based on ratio
        const measurementTicks = estimateRatio >= 1 ? Math.round(estimateRatio) : 1;  // How often measurements occur
        const estimateTicks = estimateRatio < 1 ? Math.round(1 / estimateRatio) : 1;   // How often estimates occur

        // Create measurement lookup by time
        const measurementMap = new Map();
        for (const measurement of measurements) {
            const timeKey = measurement.time.toFixed(1);
            measurementMap.set(timeKey, measurement);
        }

        let measurementIndex = 0;

        // Process each tick from start to end
        for (let tick = 0; tick <= totalTicks; tick++) {
            const currentTime = startTime + (tick * defaultDt);
            const timeKey = currentTime.toFixed(1);

            // Always perform prediction step
            state = this._multiply(F, state);
            const FP = this._multiply(F, P);
            const FT = [
                [1, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0],
                [defaultDt, 0, 1, 0, 0, 0],
                [0, defaultDt, 0, 1, 0, 0],
                [defaultDt*defaultDt/2, 0, defaultDt, 0, 1, 0],
                [0, defaultDt*defaultDt/2, 0, defaultDt, 0, 1]
            ];
            P = this._add(this._multiply(FP, FT), Q);

            // Update step: only if we have a measurement at this tick
            if (measurementMap.has(timeKey)) {
                const measurement = measurementMap.get(timeKey);
                const measurementNoise_i = measurement.noise || defaultMeasNoise;
                const R = [
                    [measurementNoise_i, 0],
                    [0, measurementNoise_i]
                ];

                const predicted_z = this._multiply(H, state);
                const innovation = this._subtract([[measurement.position[0]], [measurement.position[1]]], predicted_z);

                const HP = this._multiply(H, P);
                const S = this._add(this._multiply(HP, HT), R);

                const K = this._multiply(this._multiply(P, HT), this._inverse2x2(S));

                state = this._add(state, this._multiply(K, innovation));

                // Joseph form covariance update
                const I_KH = this._subtract(I6, this._multiply(K, H));
                P = this._multiply(I_KH, P);
            }

            // Output estimate: based on estimate tick schedule
            if (tick % estimateTicks === 0) {
                const estimate = {
                    time: currentTime,
                    position: [state[0][0], state[1][0]],
                    covariance: [
                        [P[0][0], P[0][1]],
                        [P[1][0], P[1][1]]
                    ]
                };
                estimates.push(estimate);
            }
        }

        return { estimates };
    }
}