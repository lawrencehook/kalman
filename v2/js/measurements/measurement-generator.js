/**
 * MeasurementGenerator - Converts ground truth to noisy measurements
 */
class MeasurementGenerator {
    /**
     * Add Gaussian noise to a value
     * @private
     */
    static _gaussianNoise(mean = 0, stdDev = 1) {
        // Box-Muller transform
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    /**
     * Generate noisy measurements from ground truth trajectory
     * @param {Array} trajectoryPoints - Ground truth TrajectoryPoint[]
     * @param {Object} config - Measurement configuration
     * @returns {Object} FilterInput object with measurements and config
     */
    static generateMeasurements(trajectoryPoints, config = {}) {
        const {
            measurementNoise = 5.0,    // Standard deviation of measurement noise
            processNoise = 1.0,        // Process noise for filter config
            dt = null                  // Optional fixed timestep
        } = config;

        const measurements = [];

        // Generate 1 measurement for every ground truth point
        for (let i = 0; i < trajectoryPoints.length; i++) {
            const truthPoint = trajectoryPoints[i];

            // Add noise to position
            const noisyPosition = [
                truthPoint.position[0] + this._gaussianNoise(0, measurementNoise),
                truthPoint.position[1] + this._gaussianNoise(0, measurementNoise)
            ];

            const measurement = {
                time: truthPoint.time,
                position: noisyPosition,
                noise: measurementNoise  // Store noise level used
            };

            measurements.push(measurement);
        }

        // Create filter input according to schema
        const filterInput = {
            measurements: measurements,
            config: {
                processNoise: processNoise,
                measurementNoise: measurementNoise  // Default if not specified per measurement
            }
        };

        // Add optional dt if specified
        if (dt !== null) {
            filterInput.config.dt = dt;
        }

        return filterInput;
    }

    /**
     * Generate measurements with varying noise levels
     * @param {Array} trajectoryPoints - Ground truth TrajectoryPoint[]
     * @param {Object} config - Configuration with noise function
     * @returns {Object} FilterInput object
     */
    static generateVariableNoiseMeasurements(trajectoryPoints, config = {}) {
        const {
            noiseFunction = (t) => 5.0,  // Function of time returning noise level
            samplingRatio = 1.0,
            processNoise = 1.0,
            dt = null
        } = config;

        const measurements = [];

        // Generate 1 measurement for every ground truth point
        for (let i = 0; i < trajectoryPoints.length; i++) {
            const truthPoint = trajectoryPoints[i];
            const noiseLevel = noiseFunction(truthPoint.time);

            const noisyPosition = [
                truthPoint.position[0] + this._gaussianNoise(0, noiseLevel),
                truthPoint.position[1] + this._gaussianNoise(0, noiseLevel)
            ];

            const measurement = {
                time: truthPoint.time,
                position: noisyPosition,
                noise: noiseLevel  // Per-measurement noise level
            };

            measurements.push(measurement);
        }

        const filterInput = {
            measurements: measurements,
            config: {
                processNoise: processNoise
            }
        };

        if (dt !== null) {
            filterInput.config.dt = dt;
        }

        return filterInput;
    }
}