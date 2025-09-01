/**
 * KalmanFilter2D - Standard 2D Kalman filter with constant acceleration model
 * 
 * State vector: [x, y, vx, vy, ax, ay]^T (6D)
 * - Position: (x, y)
 * - Velocity: (vx, vy)  
 * - Acceleration: (ax, ay)
 * 
 * Uses constant acceleration motion model with configurable process and measurement noise.
 */
class KalmanFilter2D extends FilterBase {
    constructor(config = {}) {
        super(config);
        const { dt, measurementNoise, processNoise } = {
            dt: 0.05, measurementNoise: 15, processNoise: 1, ...config
        };
        this.dt = dt;
        this.initialized = false;

        // State transition (constant acceleration)
        this.F = [
            [1, 0, dt, 0, 0.5*dt*dt, 0],
            [0, 1, 0, dt, 0, 0.5*dt*dt],
            [0, 0, 1, 0, dt, 0],
            [0, 0, 0, 1, 0, dt],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ];

        // Measurement matrix (position only)
        this.H = [
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0]
        ];

        // Start uninitialized: no state/covariance yet
        this.state = null;
        this.covariance = null;

        // Process noise
        this.processNoiseScalar = processNoise;
        this.measurementNoiseScalar = measurementNoise;
        this.rebuildNoise();
    }

    rebuildNoise() {
        const q = this.processNoiseScalar;
        const dt = this.dt;
        this.Q = [
            [dt**4/4 * q, 0, dt**3/2 * q, 0, dt**2/2 * q, 0],
            [0, dt**4/4 * q, 0, dt**3/2 * q, 0, dt**2/2 * q],
            [dt**3/2 * q, 0, dt**2 * q, 0, dt * q, 0],
            [0, dt**3/2 * q, 0, dt**2 * q, 0, dt * q],
            [dt**2/2 * q, 0, dt * q, 0, q, 0],
            [0, dt**2/2 * q, 0, dt * q, 0, q]
        ];
        const r = this.measurementNoiseScalar;
        this.R = [[r*r, 0], [0, r*r]];
    }

    setInitialState(x0, P0) {
        this.state = x0;         // 6x1
        this.covariance = P0;    // 6x6
        this.initialized = true;
    }

    predict() {
        if (!this.initialized) return; // no-op before init
        this.state = MatrixUtils.multiply(this.F, this.state);
        const FP = MatrixUtils.multiply(this.F, this.covariance);
        const FPFt = MatrixUtils.multiply(FP, MatrixUtils.transpose(this.F));
        this.covariance = MatrixUtils.add(FPFt, this.Q);
        this.lastInnovation = null;
        this.lastKalmanGain = null;
        this.lastInnovationCovariance = null;
    }

    update(measurement) {
        if (!this.initialized) return; // no-op before init
        const innovation = MatrixUtils.subtract(measurement, MatrixUtils.multiply(this.H, this.state));
        this.lastInnovation = innovation;

        const HP = MatrixUtils.multiply(this.H, this.covariance);
        const HPHt = MatrixUtils.multiply(HP, MatrixUtils.transpose(this.H));
        const S = MatrixUtils.add(HPHt, this.R);
        this.lastInnovationCovariance = S;

        const PHt = MatrixUtils.multiply(this.covariance, MatrixUtils.transpose(this.H));
        const K = MatrixUtils.multiply(PHt, MatrixUtils.inverse2x2(S));
        this.lastKalmanGain = K;

        const Ky = MatrixUtils.multiply(K, innovation);
        this.state = MatrixUtils.add(this.state, Ky);

        const KH = MatrixUtils.multiply(K, this.H);
        const I_KH = MatrixUtils.subtract(MatrixUtils.identity(6), KH);
        this.covariance = MatrixUtils.multiply(I_KH, this.covariance);
    }

    getSystemMatrices() { 
        return { F: this.F, H: this.H, Q: this.Q, R: this.R }; 
    }
    
    getName() { 
        return 'Kalman Filter 2D'; 
    }

    updateNoise(measurementNoise, processNoise) {
        this.processNoiseScalar = processNoise;
        this.measurementNoiseScalar = measurementNoise;
        this.rebuildNoise();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KalmanFilter2D;
}