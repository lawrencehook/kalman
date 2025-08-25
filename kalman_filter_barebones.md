# Kalman Filter: Barebones Overview

## Key Symbols and Their Meanings

- **x̂ (state vector)**: estimated state of the system (e.g. position, velocity, acceleration)

- **F (state transition matrix)**: how the state evolves from one timestep to the next

- **P (state covariance matrix)**: uncertainty in the state estimate

- **Q (process noise covariance)**: uncertainty injected by the model (unmodeled accelerations, jerks)

- **z (measurement vector)**: observed data (e.g. noisy position)

- **H (measurement matrix)**: maps state into measurement space

- **R (measurement noise covariance)**: uncertainty of sensor/measurement

- **y (innovation / residual)**: difference between measurement and predicted measurement

- **S (innovation covariance)**: expected uncertainty of the innovation

- **K (Kalman gain)**: weighting factor between prediction and measurement

- **I (identity matrix)**: used in covariance update



## Core Equations

### Prediction step

```

x̂ₖ|ₖ₋₁ = F x̂ₖ₋₁|ₖ₋₁

Pₖ|ₖ₋₁ = F Pₖ₋₁|ₖ₋₁ Fᵀ + Q

```



### Update step (when measurement arrives)

```

yₖ = zₖ - H x̂ₖ|ₖ₋₁                (innovation)

Sₖ = H Pₖ|ₖ₋₁ Hᵀ + R              (innovation covariance)

Kₖ = Pₖ|ₖ₋₁ Hᵀ Sₖ⁻¹              (Kalman gain)

x̂ₖ|ₖ = x̂ₖ|ₖ₋₁ + Kₖ yₖ           (state update)

Pₖ|ₖ = (I - Kₖ H) Pₖ|ₖ₋₁          (covariance update)

```



## Intuition

- **Prediction**: project state forward with the model (uncertainty grows via Q).

- **Update**: correct prediction with measurement (uncertainty shrinks via R).

- **Kalman gain**: balances trust between prediction and measurement.



---

This file lists the bare minimum terms and formulas for reference.
