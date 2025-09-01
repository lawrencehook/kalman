/**
 * UI Configuration for Kalman Filter 2D
 * Defines all UI elements, tooltips, and layout specific to the 2D Kalman filter
 */

class KalmanFilter2DUIConfig {
    static getConfig() {
        return {
            filterName: "2D Filter",
            
            // State vector configuration
            stateVector: {
                title: "State Vector x̂",
                tooltip: "The filter's current estimate of the object's state, including position, velocity, and acceleration in both X and Y dimensions.",
                dimensions: [
                    { label: "Position X", id: "state-x", tooltip: "Estimated X position of the object in pixels from center" },
                    { label: "Position Y", id: "state-y", tooltip: "Estimated Y position of the object in pixels from center" },
                    { label: "Velocity X", id: "state-vx", tooltip: "Estimated velocity in X direction (pixels per second)" },
                    { label: "Velocity Y", id: "state-vy", tooltip: "Estimated velocity in Y direction (pixels per second)" },
                    { label: "Accel X", id: "state-ax", tooltip: "Estimated acceleration in X direction (pixels per second²)" },
                    { label: "Accel Y", id: "state-ay", tooltip: "Estimated acceleration in Y direction (pixels per second²)" }
                ]
            },

            // Position covariance matrix
            positionCovariance: {
                title: "Position Covariance P",
                tooltip: "The covariance matrix quantifies the uncertainty in position estimates. Larger values mean less confidence. The ellipse visualization is derived from this matrix.",
                size: [2, 2],
                elements: [
                    { id: "p00", row: 0, col: 0 },
                    { id: "p01", row: 0, col: 1 },
                    { id: "p10", row: 1, col: 0 },
                    { id: "p11", row: 1, col: 1 }
                ],
                containerId: "position-covariance-matrix"
            },

            // Error metrics
            errorMetrics: {
                title: "Error Metrics",
                tooltip: "Metrics comparing the filter's estimates to ground truth and showing the filter's confidence levels.",
                metrics: [
                    { label: "Position Error", id: "pos-error", tooltip: "Euclidean distance between the filter estimate and ground truth position" },
                    { label: "Std Dev X", id: "std-x", tooltip: "Square root of X variance from covariance matrix. Represents 1-sigma uncertainty in X direction" },
                    { label: "Std Dev Y", id: "std-y", tooltip: "Square root of Y variance from covariance matrix. Represents 1-sigma uncertainty in Y direction" },
                    { label: "Ellipse Coverage (95%)", id: "coverage-95", tooltip: "Share of time (up to current t) that the true position lay inside the filter's 95% error ellipse (Mahalanobis distance² ≤ χ²₂,0.95 ≈ 5.991)." }
                ]
            },

            // Innovation (residual)
            innovation: {
                title: "Innovation (Residual)",
                tooltip: "The innovation (or residual) is the difference between what was measured and what the filter predicted. Large innovations indicate surprising measurements.",
                size: [2, 1],
                elements: [
                    { id: "innovation-x", row: 0, col: 0 },
                    { id: "innovation-y", row: 1, col: 0 }
                ],
                containerId: "innovation-matrix"
            },

            // Kalman gain matrix
            kalmanGain: {
                title: "Kalman Gain K",
                tooltip: "The Kalman gain determines how much the filter trusts new measurements versus its predictions. Higher values mean more trust in measurements, lower values mean more trust in the model.",
                size: [6, 2],
                elements: [
                    { id: "k00", row: 0, col: 0 }, { id: "k01", row: 0, col: 1 },
                    { id: "k10", row: 1, col: 0 }, { id: "k11", row: 1, col: 1 },
                    { id: "k20", row: 2, col: 0 }, { id: "k21", row: 2, col: 1 },
                    { id: "k30", row: 3, col: 0 }, { id: "k31", row: 3, col: 1 },
                    { id: "k40", row: 4, col: 0 }, { id: "k41", row: 4, col: 1 },
                    { id: "k50", row: 5, col: 0 }, { id: "k51", row: 5, col: 1 }
                ],
                containerId: "kalman-gain-matrix"
            },

            // System matrices for educational display
            systemMatrices: {
                title: "System Matrices & Equations",
                matrices: [
                    {
                        name: "F",
                        title: "State Transition F (6×6)",
                        description: "Predicts next state from current state",
                        size: [6, 6],
                        id: "matrix-F"
                    },
                    {
                        name: "H",
                        title: "Measurement H (2×6)",
                        description: "Maps state to expected measurement (extracts position)",
                        size: [2, 6],
                        id: "matrix-H"
                    },
                    {
                        name: "Q",
                        title: "Process Noise Q (6×6)",
                        description: "Uncertainty added during prediction",
                        size: [6, 6],
                        id: "matrix-Q"
                    },
                    {
                        name: "R",
                        title: "Measurement Noise R (2×2)",
                        description: "Expected measurement uncertainty",
                        size: [2, 2],
                        id: "matrix-R"
                    },
                    {
                        name: "P",
                        title: "Full Covariance P (6×6)",
                        description: "Uncertainty in all state variables",
                        size: [6, 6],
                        id: "matrix-P-full"
                    },
                    {
                        name: "S",
                        title: "Innovation Covariance S (2×2)",
                        description: "S = H×P×H<sup>T</sup> + R (measurement prediction uncertainty)",
                        size: [2, 2],
                        id: "matrix-S"
                    }
                ]
            },

            // Filter equations
            equations: {
                title: "Filter Equations",
                tooltip: "The mathematical operations performed during prediction and update steps",
                sections: [
                    {
                        title: "Variables (hover for definitions):",
                        variables: [
                            { symbol: "x̂ₖ|ₖ", definition: "State estimate at time k given measurements up to k" },
                            { symbol: "Pₖ|ₖ", definition: "Error covariance matrix at time k given measurements up to k" },
                            { symbol: "zₖ", definition: "Measurement vector at time k" },
                            { symbol: "yₖ", definition: "Innovation/residual (measurement - prediction)" },
                            { symbol: "F", definition: "State transition matrix (predicts next state)" },
                            { symbol: "H", definition: "Measurement matrix (maps state to measurement)" },
                            { symbol: "Q", definition: "Process noise covariance (model uncertainty)" },
                            { symbol: "R", definition: "Measurement noise covariance (sensor uncertainty)" },
                            { symbol: "Kₖ", definition: "Kalman gain (optimal blending weights)" },
                            { symbol: "Sₖ", definition: "Innovation covariance (H×P×H<sup>T</sup> + R)" },
                            { symbol: "I", definition: "Identity matrix" }
                        ]
                    },
                    {
                        title: "Prediction Step (every 0.05s):",
                        equations: [
                            "x̂ₖ₊₁|ₖ = F × x̂ₖ|ₖ",
                            "Pₖ₊₁|ₖ = F × Pₖ|ₖ × F<sup>T</sup> + Q"
                        ]
                    },
                    {
                        title: "Update Step (when measurement arrives):",
                        equations: [
                            "yₖ = zₖ - H × x̂ₖ|ₖ₋₁ (innovation)",
                            "Sₖ = H × Pₖ|ₖ₋₁ × H<sup>T</sup> + R",
                            "Kₖ = Pₖ|ₖ₋₁ × H<sup>T</sup> × Sₖ⁻¹",
                            "x̂ₖ|ₖ = x̂ₖ|ₖ₋₁ + Kₖ × yₖ",
                            "Pₖ|ₖ = (I - Kₖ × H) × Pₖ|ₖ₋₁"
                        ]
                    }
                ]
            }
        };
    }
}