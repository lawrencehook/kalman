// ================================
// MATHEMATICAL TRAJECTORY GENERATORS
// ================================

/**
 * Lissajous (C∞)
 * Real-world: smooth cross-axis oscillations (e.g., drone).
 */
class LissajousGenerator extends TrajectoryGenerator {
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        // 2 and 3 are co-prime => closed smooth figure over period
        const w = 2*Math.PI/(maxTime/1.5);
        const x = scale * Math.sin(2*w*t + Math.PI/6);
        const y = scale * 0.7 * Math.sin(3*w*t);
        return [x, y];
    }
    getName() { return 'Lissajous'; }
}

/**
 * Euler Spiral / Clothoid (C∞)
 * Curvature κ(s) increases linearly with arclength s.
 * We numerically integrate a constant speed path where
 * heading'(t) = κ0 + κ1 * s(t), with s'(t)=v.
 * Real-world: comfortable steering (roads, rail, vehicles).
 */
class ClothoidGenerator extends TrajectoryGenerator {
    constructor(config = {}) {
        super(config);
        this.dt = 0.01;         // fine internal step for smooth precompute
        this.v  = (this.config.scale * 3) / this.config.maxTime; // avg speed
        this.k0 = 0.0;          // initial curvature
        this.k1 = (Math.PI / (this.config.scale * 2)) / (this.v * this.config.maxTime); // gentle ramp
        this.path = this.precomputePath();
    }
    precomputePath() {
        const N = Math.max(2, Math.floor(this.config.maxTime / this.dt));
        let x = -this.config.scale, y = 0, theta = 0, s = 0;
        const pts = [];
        for (let i = 0; i <= N; i++) {
            pts.push([x, y]);
            const kappa = this.k0 + this.k1 * s;   // κ(s) linear in arclength
            theta += kappa * this.v * this.dt;     // dθ/dt = κ * v
            x += this.v * Math.cos(theta) * this.dt;
            y += this.v * Math.sin(theta) * this.dt;
            s += this.v * this.dt;
        }
        // recentre roughly
        const cx = (pts[0][0] + pts[pts.length-1][0]) / 2;
        const cy = (pts[0][1] + pts[pts.length-1][1]) / 2;
        return pts.map(p => [p[0] - cx, p[1] - cy]);
    }
    generatePosition(t) {
        const idx = Math.min(
            Math.floor((t / this.config.maxTime) * (this.path.length - 1)),
            this.path.length - 1
        );
        return this.path[idx];
    }
    getName() { return 'Euler Spiral (Clothoid)'; }
}

/**
 * Random Fourier (Smooth) (C∞)
 * Low-frequency band-limited sum of sin/cos => smooth wandering path.
 * Real-world: "meandering animal/boat" with bounded speed/acc.
 */
class RandomFourierSmoothGenerator extends TrajectoryGenerator {
    constructor(config = {}) {
        super(config);
        this.freqs = [1, 2, 3];    // very low harmonics over duration
        this.ax = this.freqs.map(() => (Math.random()*2-1));
        this.bx = this.freqs.map(() => (Math.random()*2-1));
        this.ay = this.freqs.map(() => (Math.random()*2-1));
        this.by = this.freqs.map(() => (Math.random()*2-1));
        // normalize amplitude so we don't exceed scale
        const norm = Math.sqrt(
            [...this.ax, ...this.bx, ...this.ay, ...this.by]
                .reduce((s,v)=>s+v*v,0) / (4*this.freqs.length)
        );
        const target = 0.7; // use 70% of scale
        this.gain = target / Math.max(norm, 1e-6);
    }
    generatePosition(t) {
        const { maxTime, scale } = this.config;
        const w0 = 2*Math.PI / maxTime; // base angular frequency
        let x = 0, y = 0;
        for (let i = 0; i < this.freqs.length; i++) {
            const w = this.freqs[i] * w0;
            x += this.ax[i]*Math.sin(w*t) + this.bx[i]*Math.cos(w*t);
            y += this.ay[i]*Math.sin(w*t) + this.by[i]*Math.cos(w*t);
        }
        return [scale * this.gain * x, scale * this.gain * y];
    }
    getName() { return 'Random Fourier (Smooth)'; }
}