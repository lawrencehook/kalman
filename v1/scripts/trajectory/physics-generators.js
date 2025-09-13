// ================================
// PHYSICS-BASED TRAJECTORY GENERATORS
// ================================

class ConstantVelocityGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const phase = Math.min(Math.max(t / maxTime, 0), 1); // 0→1 over run
        const x = -scale + 2*scale*phase; // left to right exactly once
        const y = 0;
        return [x, y];
    }
    getName() { return 'Constant Velocity Line'; }
}

class ConstantAccelerationGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const phase = Math.min(Math.max(t / maxTime, 0), 1); // 0→1
        // constant accel from rest: x(t) = x0 + 0.5 a t²
        const x0 = -scale;
        const xf = scale;
        const T = maxTime;
        const a = 2*(xf - x0)/(T*T);  // so that x(T)=xf
        const x = x0 + 0.5*a*t*t;
        const y = 0;
        return [x, y];
    }
    getName() { return 'Constant Acceleration Line'; }
}

class SineWaveGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const frequency = 6 / maxTime;
        const x = scale * Math.sin(2 * Math.PI * frequency * t);
        const y = 0;
        return [x, y];
    }
    getName() { return 'Sine Wave'; }
}

class ParabolicGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const cycleTime = maxTime / 2;
        const phase = Math.min(Math.max(t / maxTime, 0), 1); // single arc over full duration [0,1]
        const x = scale * (phase * 2 - 1);
        const height = scale * 0.8;
        const y = height * (1 - 4 * phase * (1 - phase));
        return [x, y];
    }
    getName() { return 'Parabolic Arc'; }
}

class StepFunctionGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const stepDuration = maxTime / 6;
        const stepIndex = Math.floor(t / stepDuration);
        const positions = [
            [-scale, -scale * 0.5],
            [scale, -scale * 0.5],
            [-scale, scale * 0.5],
            [scale, scale * 0.5],
            [0, -scale],
            [0, scale]
        ];
        return positions[stepIndex % positions.length];
    }
    getName() { return 'Step Function'; }
}

class StopAndGoGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const cycleDuration = maxTime / 4;
        const phase = (t % cycleDuration) / cycleDuration;
        let x, y;
        if (phase < 0.7) {
            const movePhase = phase / 0.7;
            const angle = (Math.floor(t / cycleDuration) % 4) * Math.PI / 2;
            x = scale * movePhase * Math.cos(angle);
            y = scale * movePhase * Math.sin(angle);
        } else {
            const angle = (Math.floor(t / cycleDuration) % 4) * Math.PI / 2;
            x = scale * Math.cos(angle);
            y = scale * Math.sin(angle);
        }
        return [x, y];
    }
    getName() { return 'Stop and Go'; }
}

/**
 * Const-Accel Bezier (Quadratic) – zero jerk (C^2)
 * p(τ) = (1-τ)^2 P0 + 2(1-τ)τ C + τ^2 P1, τ = t/T
 * Quadratic in time ⇒ constant acceleration.
 */
class ConstAccelBezierGenerator extends TrajectoryGenerator {
    constructor(config = {}) {
        super(config);
        const s = this.config.scale;
        // Endpoints left→right, control above center for a smooth arch
        this.P0 = [-s, 0];
        this.P1 = [ s, 0];
        this.C  = [ 0, -0.8*s ]; // negative y to arc upward on canvas
    }
    generatePosition(t) {
        const T = this.config.maxTime;
        const τ = Math.min(Math.max(t / T, 0), 1);
        const u = 1 - τ;
        const bx = u*u*this.P0[0] + 2*u*τ*this.C[0] + τ*τ*this.P1[0];
        const by = u*u*this.P0[1] + 2*u*τ*this.C[1] + τ*τ*this.P1[1];
        return [bx, by];
    }
    getName() { return 'Const-Accel Bezier'; }
}

/**
 * Const-Accel Diagonal – zero jerk
 * Start at (-s,-s), end at (+s,+s) with v0=0, a chosen so x(T)=xf, y(T)=yf.
 * x(t) = x0 + 0.5 a_x t^2,  a_x = 2(xf-x0)/T^2  (same for y).
 */
class ConstAccelLineGenerator extends TrajectoryGenerator {
    constructor(config = {}) {
        super(config);
        const s = this.config.scale;
        this.x0 = -s; this.y0 = -s;
        this.xf =  s; this.yf =  s;
        const T = this.config.maxTime;
        this.ax = 2*(this.xf - this.x0)/(T*T);
        this.ay = 2*(this.yf - this.y0)/(T*T);
    }
    generatePosition(t) {
        const x = this.x0 + 0.5*this.ax*t*t;
        const y = this.y0 + 0.5*this.ay*t*t;
        return [x, y];
    }
    getName() { return 'Const-Accel Diagonal'; }
}

/**
 * Minimum-Jerk Arc (C∞)
 * s(τ) = 10τ^3 − 15τ^4 + 6τ^5, τ∈[0,1]
 * Moves from (-scale,0) to (+scale,0) with a smooth arch in Y.
 * Real-world: human arm/robot point-to-point profiles.
 */
class MinimumJerkGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const tau = Math.min(Math.max(t / maxTime, 0), 1);
        const s = 10*tau**3 - 15*tau**4 + 6*tau**5; // C∞ easing
        const x = -scale + 2*scale*s;
        // smooth arch: C∞ bump via sine of eased progress
        const A = 0.6 * scale;
        const y = A * Math.sin(Math.PI * s);
        return [x, y];
    }
    getName() { return 'Minimum-Jerk Arc'; }
}