/**
 * UI Configuration for IMM Filter
 * Defines all UI elements, tooltips, and layout specific to the Interacting Multiple Model filter
 */

class IMMUIConfig {
    static getConfig() {
        return {
            filterName: "IMM Filter (2-Model)",
            
            // State vector configuration (combined from both models)
            stateVector: {
                title: "Combined State Vector x̂",
                tooltip: "The IMM filter's combined estimate from both motion models, weighted by their probabilities.",
                dimensions: [
                    { label: "Position X", id: "state-x", tooltip: "Combined estimated X position (weighted average of both models)" },
                    { label: "Position Y", id: "state-y", tooltip: "Combined estimated Y position (weighted average of both models)" },
                    { label: "Velocity X", id: "state-vx", tooltip: "Combined estimated velocity in X direction" },
                    { label: "Velocity Y", id: "state-vy", tooltip: "Combined estimated velocity in Y direction" },
                    { label: "Accel X", id: "state-ax", tooltip: "Combined estimated acceleration in X direction" },
                    { label: "Accel Y", id: "state-ay", tooltip: "Combined estimated acceleration in Y direction" }
                ]
            },

            // IMM-specific model information
            modelProbabilities: {
                title: "Model Probabilities μ",
                tooltip: "The probability that each motion model is currently active. These probabilities are updated based on how well each model explains the measurements.",
                models: [
                    { label: "CA Low-Noise (μ₀)", id: "model-prob-0", tooltip: "Probability of CA model with low process noise (smooth/predictable motion)" },
                    { label: "CA High-Noise (μ₁)", id: "model-prob-1", tooltip: "Probability of CA model with high process noise (erratic/maneuvering motion)" }
                ]
            },

            // Active model indicator
            activeModel: {
                title: "Active Model",
                tooltip: "Which motion model is currently dominant (higher probability)",
                id: "active-model"
            },

            // Position covariance matrix (combined)
            positionCovariance: {
                title: "Combined Position Covariance P",
                tooltip: "Combined covariance matrix from both models, accounting for model uncertainty. This includes both estimation uncertainty and model-switching uncertainty.",
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
                tooltip: "Metrics comparing the combined IMM estimate to ground truth and showing confidence levels.",
                metrics: [
                    { label: "Position Error", id: "pos-error", tooltip: "Euclidean distance between the IMM estimate and ground truth position" },
                    { label: "Std Dev X", id: "std-x", tooltip: "Square root of combined X variance. Includes model uncertainty" },
                    { label: "Std Dev Y", id: "std-y", tooltip: "Square root of combined Y variance. Includes model uncertainty" },
                    { label: "Ellipse Coverage (95%)", id: "coverage-95", tooltip: "Share of time that the true position lay inside the IMM's 95% error ellipse" },
                    { label: "Model Entropy", id: "model-entropy", tooltip: "Measure of model uncertainty: -μ₀×log(μ₀) - μ₁×log(μ₁). Higher values indicate more uncertainty about which model is active." }
                ]
            },

            // Innovation (from active model)
            innovation: {
                title: "Innovation (Active Model)",
                tooltip: "The innovation from whichever model is currently dominant. This reflects how surprising the measurement was to the active model.",
                size: [2, 1],
                elements: [
                    { id: "innovation-x", row: 0, col: 0 },
                    { id: "innovation-y", row: 1, col: 0 }
                ],
                containerId: "innovation-matrix"
            },

            // Kalman gain matrix (from active model)
            kalmanGain: {
                title: "Kalman Gain K (Active Model)",
                tooltip: "The Kalman gain from the currently active model. This determines how much the combined estimate should be adjusted based on the new measurement.",
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
                title: "System Matrices & Model Parameters",
                matrices: [
                    {
                        name: "F",
                        title: "State Transition F (6×6)",
                        description: "Predicts next state from current state (same for both models)",
                        size: [6, 6],
                        id: "matrix-F"
                    },
                    {
                        name: "H",
                        title: "Measurement H (2×6)",
                        description: "Maps state to expected measurement (same for both models)",
                        size: [2, 6],
                        id: "matrix-H"
                    },
                    {
                        name: "Q0",
                        title: "Process Noise Q₀ (6×6) - Smooth",
                        description: "Process noise for smooth motion model (lower values)",
                        size: [6, 6],
                        id: "matrix-Q0"
                    },
                    {
                        name: "Q1",
                        title: "Process Noise Q₁ (6×6) - Maneuver",
                        description: "Process noise for maneuvering model (higher values)",
                        size: [6, 6],
                        id: "matrix-Q1"
                    },
                    {
                        name: "R",
                        title: "Measurement Noise R (2×2)",
                        description: "Expected measurement uncertainty (same for both models)",
                        size: [2, 2],
                        id: "matrix-R"
                    },
                    {
                        name: "Pi",
                        title: "Transition Matrix Π (2×2)",
                        description: "Model switching probabilities: Π[i][j] = P(model j at k+1 | model i at k)",
                        size: [2, 2],
                        id: "matrix-Pi"
                    },
                    {
                        name: "P",
                        title: "Combined Covariance P (6×6)",
                        description: "Combined uncertainty from both models and model switching",
                        size: [6, 6],
                        id: "matrix-P-full"
                    },
                    {
                        name: "S",
                        title: "Innovation Covariance S (2×2)",
                        description: "Measurement prediction uncertainty from active model",
                        size: [2, 2],
                        id: "matrix-S"
                    }
                ]
            },

            // IMM equations
            equations: {
                title: "IMM Algorithm",
                tooltip: "The Interacting Multiple Model algorithm steps for handling model uncertainty",
                sections: [
                    {
                        title: "Variables (hover for definitions):",
                        variables: [
                            { symbol: "μₖ", definition: "Model probability vector at time k" },
                            { symbol: "Π", definition: "Markov chain transition matrix for model switching" },
                            { symbol: "x̂ʲₖ|ₖ", definition: "State estimate from model j at time k" },
                            { symbol: "Pʲₖ|ₖ", definition: "Covariance matrix from model j at time k" },
                            { symbol: "Λⱼ", definition: "Likelihood of measurement under model j" },
                            { symbol: "ωᵢⱼ", definition: "Mixing weight from model i to model j" },
                            { symbol: "cⱼ", definition: "Normalization constant for mixing to model j" },
                            { symbol: "x̂ₖ|ₖ", definition: "Combined IMM state estimate" },
                            { symbol: "Pₖ|ₖ", definition: "Combined IMM covariance matrix" }
                        ]
                    },
                    {
                        title: "Step 1: Model Mixing",
                        equations: [
                            "cⱼ = Σᵢ Πᵢⱼ × μᵢ,ₖ₋₁ (mixing probabilities)",
                            "ωᵢⱼ = (Πᵢⱼ × μᵢ,ₖ₋₁) / cⱼ (mixing weights)",
                            "x̂⁰ʲₖ₋₁|ₖ₋₁ = Σᵢ ωᵢⱼ × x̂ⁱₖ₋₁|ₖ₋₁ (mixed initial conditions)"
                        ]
                    },
                    {
                        title: "Step 2: Model-Specific Filtering",
                        equations: [
                            "For each model j: Run Kalman predict & update",
                            "Λⱼ = N(yⱼₖ; 0, Sⱼₖ) (measurement likelihood)",
                            "x̂ʲₖ|ₖ, Pʲₖ|ₖ from individual Kalman filters"
                        ]
                    },
                    {
                        title: "Step 3: Model Probability Update",
                        equations: [
                            "μⱼ,ₖ = (Λⱼ × cⱼ) / Σᵢ(Λᵢ × cᵢ) (model probabilities)"
                        ]
                    },
                    {
                        title: "Step 4: Estimate Combination",
                        equations: [
                            "x̂ₖ|ₖ = Σⱼ μⱼ,ₖ × x̂ʲₖ|ₖ (combined estimate)",
                            "Pₖ|ₖ = Σⱼ μⱼ,ₖ × [Pʲₖ|ₖ + (x̂ʲₖ|ₖ - x̂ₖ|ₖ)(x̂ʲₖ|ₖ - x̂ₖ|ₖ)ᵀ]"
                        ]
                    }
                ]
            }
        };
    }
}