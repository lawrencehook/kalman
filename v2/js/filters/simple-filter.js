/**
 * SimpleFilter - Minimal Kalman filter implementation for testing
 *
 * This is a barebones 2D constant velocity Kalman filter
 * for getting the end-to-end pipeline working
 */
class SimpleFilter {
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
     * Process measurements through simple Kalman filter
     * @param {Object} filterInput - FilterInput schema object
     * @returns {Object} FilterOutput schema object
     */
    static process(filterInput) {
        const { measurements, config } = filterInput;
        const { processNoise, measurementNoise, dt } = config;

        // Default parameters
        const defaultDt = dt || 0.1;
        const defaultMeasNoise = measurementNoise || 5.0;
        const q = processNoise || 1.0;

        // Wait for at least 3 measurements to estimate initial velocity
        const initMeasurements = Math.min(3, measurements.length);
        let state, startIndex;

        if (measurements.length < 2) {
            // Fallback to simple initialization if too few measurements
            state = [
                [measurements[0].position[0]],  // x
                [measurements[0].position[1]],  // y
                [0],                            // vx
                [0]                             // vy
            ];
            startIndex = 0;
        } else {
            // Estimate initial velocity from first few measurements
            const p1 = measurements[0];
            const p2 = measurements[initMeasurements - 1];
            const deltaT = p2.time - p1.time;

            const initialVx = deltaT > 0 ? (p2.position[0] - p1.position[0]) / deltaT : 0;
            const initialVy = deltaT > 0 ? (p2.position[1] - p1.position[1]) / deltaT : 0;

            // Initialize state at the last measurement used for velocity estimation
            state = [
                [p2.position[0]],   // x
                [p2.position[1]],   // y
                [initialVx],        // vx
                [initialVy]         // vy
            ];
            startIndex = initMeasurements - 1;
        }

        // Initial covariance (high uncertainty)
        let P = [
            [100, 0, 0, 0],
            [0, 100, 0, 0],
            [0, 0, 10, 0],
            [0, 0, 0, 10]
        ];

        // Constant velocity motion model
        const F = [
            [1, 0, defaultDt, 0],
            [0, 1, 0, defaultDt],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];

        // Process noise covariance
        const Q = [
            [q * defaultDt**4 / 4, 0, q * defaultDt**3 / 2, 0],
            [0, q * defaultDt**4 / 4, 0, q * defaultDt**3 / 2],
            [q * defaultDt**3 / 2, 0, q * defaultDt**2, 0],
            [0, q * defaultDt**3 / 2, 0, q * defaultDt**2]
        ];

        // Measurement matrix (observe position only)
        const H = [
            [1, 0, 0, 0],
            [0, 1, 0, 0]
        ];

        const estimates = [];

        // Add estimates for initialization period (before filter starts)
        for (let i = 0; i < startIndex; i++) {
            const measurement = measurements[i];
            estimates.push({
                time: measurement.time,
                position: [measurement.position[0], measurement.position[1]], // Use raw measurements
                covariance: [[100, 0], [0, 100]] // High uncertainty
            });
        }

        // Process remaining measurements through filter
        for (let i = startIndex; i < measurements.length; i++) {
            const measurement = measurements[i];
            // Prediction step
            state = this._multiply(F, state);
            const FP = this._multiply(F, P);
            P = this._add(this._multiply(FP, [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]), Q);

            // Update step
            const measurementNoise_i = measurement.noise || defaultMeasNoise;
            const R = [
                [measurementNoise_i, 0],
                [0, measurementNoise_i]
            ];

            const predicted_z = this._multiply(H, state);
            const innovation = this._subtract([[measurement.position[0]], [measurement.position[1]]], predicted_z);

            const HP = this._multiply(H, P);
            const S = this._add(this._multiply(HP, [[1, 0], [0, 1], [0, 0], [0, 0]]), R);

            const K = this._multiply(this._multiply(P, [[1, 0], [0, 1], [0, 0], [0, 0]]), this._inverse2x2(S));

            state = this._add(state, this._multiply(K, innovation));

            // Joseph form covariance update (for numerical stability)
            const I_KH = this._subtract(
                [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
                this._multiply(K, H)
            );
            P = this._multiply(I_KH, P);

            // Extract position and covariance for output
            const estimate = {
                time: measurement.time,
                position: [state[0][0], state[1][0]],
                covariance: [
                    [P[0][0], P[0][1]],
                    [P[1][0], P[1][1]]
                ]
            };

            estimates.push(estimate);
        }

        return { estimates };
    }
}