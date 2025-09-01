/**
 * IMMFilter - Interacting Multiple Model filter
 * 
 * Uses two Kalman filters with different process noise levels:
 * - Model 0: Slow process noise (smooth motion)
 * - Model 1: Fast process noise (maneuvering motion)
 * 
 * The filter maintains model probabilities and combines estimates
 * based on likelihood of each model given the measurements.
 */
class IMMFilter extends FilterBase {
    constructor(cfg) {
        super(cfg);
        this.dt = cfg.dt;
        this.models = [
            new KalmanFilter2D({ dt: cfg.dt, measurementNoise: cfg.measurementNoise, processNoise: cfg.processNoiseSlow }),
            new KalmanFilter2D({ dt: cfg.dt, measurementNoise: cfg.measurementNoise, processNoise: cfg.processNoiseFast })
        ];
        this.mu = [0.5, 0.5];
        this.Pi = cfg.trans || [[0.95,0.05],[0.05,0.95]];
        this.initialized = false;
        this.state = null;
        this.covariance = null;
        this.lastInnovation = null;
        this.lastInnovationCovariance = null;
        this.lastKalmanGain = null;
    }

    initialize(x0, P0) {
        this.models.forEach(m => m.setInitialState ? m.setInitialState(x0, P0) : (m.initialize ? m.initialize(x0, P0) : null));
        this.state = x0;
        this.covariance = P0;
        this.initialized = true;
    }

    updateNoise(measNoise, procNoise) {
        const slow = Math.max(0.1, procNoise * 0.5);
        const fast = procNoise * 3.0;
        this.models[0].updateNoise?.(measNoise, slow);
        this.models[1].updateNoise?.(measNoise, fast);
    }

    predict() {
        if (!this.initialized) return;
        const muPrev = this.mu.slice();
        const c = [
            this.Pi[0][0]*muPrev[0] + this.Pi[1][0]*muPrev[1],
            this.Pi[0][1]*muPrev[0] + this.Pi[1][1]*muPrev[1]
        ].map(v => Math.max(v, 1e-12));
        const w = [
            [ (this.Pi[0][0]*muPrev[0])/c[0], (this.Pi[0][1]*muPrev[0])/c[1] ],
            [ (this.Pi[1][0]*muPrev[1])/c[0], (this.Pi[1][1]*muPrev[1])/c[1] ]
        ];

        for (let j = 0; j < 2; j++) {
            let x0 = Array(6).fill().map(()=>[0]);
            for (let i = 0; i < 2; i++) {
                const xi = this.models[i].getState();
                for (let r=0;r<6;r++) x0[r][0] += xi[r][0] * w[i][j];
            }
            let P0 = Array(6).fill().map(()=>Array(6).fill(0));
            for (let i = 0; i < 2; i++) {
                const Pi = this.models[i].covariance;
                const dx = this._vsub(this.models[i].getState(), x0);
                const add = this._madd(Pi, this._outer(dx));
                P0 = this._madd(P0, this._mscale(add, w[i][j]));
            }
            this.models[j].state = x0;
            this.models[j].covariance = P0;
            this.models[j].predict();
        }
        this._combineByMu();
    }

    update(z) {
        if (!this.initialized) return;
        const like = [0,0];
        for (let j=0;j<2;j++){
            this.models[j].update(z);
            const y = this.models[j].lastInnovation;
            const S = this.models[j].lastInnovationCovariance;
            const Sinv = MatrixUtils.inverse2x2(S);
            const detS = S[0][0]*S[1][1] - S[0][1]*S[1][0];
            const q = y[0][0]*(Sinv[0][0]*y[0][0] + Sinv[0][1]*y[1][0]) + y[1][0]*(Sinv[1][0]*y[0][0] + Sinv[1][1]*y[1][0]);
            like[j] = Math.exp(-0.5*Math.max(0,q)) / Math.sqrt(Math.max(detS,1e-9));
        }
        const muPrev = this.mu.slice();
        const mixPrior = [
            this.Pi[0][0]*muPrev[0] + this.Pi[1][0]*muPrev[1],
            this.Pi[0][1]*muPrev[0] + this.Pi[1][1]*muPrev[1]
        ];
        const norm = like[0]*mixPrior[0] + like[1]*mixPrior[1] + 1e-12;
        this.mu = [(like[0]*mixPrior[0])/norm, (like[1]*mixPrior[1])/norm];

        const jStar = this.mu[0] >= this.mu[1] ? 0 : 1;
        this.lastInnovation = this.models[jStar].lastInnovation;
        this.lastInnovationCovariance = this.models[jStar].lastInnovationCovariance;
        this.lastKalmanGain = this.models[jStar].lastKalmanGain;

        this._combineByMu();
    }

    _combineByMu() {
        let x = Array(6).fill().map(()=>[0]);
        for (let j=0;j<2;j++){
            const xj = this.models[j].getState();
            for (let r=0;r<6;r++) x[r][0] += xj[r][0] * this.mu[j];
        }
        let P = Array(6).fill().map(()=>Array(6).fill(0));
        for (let j=0;j<2;j++){
            const xj = this.models[j].getState();
            const dx = this._vsub(xj, x);
            const term = this._madd(this.models[j].covariance, this._outer(dx));
            P = this._madd(P, this._mscale(term, this.mu[j]));
        }
        this.state = x;
        this.covariance = P;
    }

    // Helper methods for matrix operations
    _vsub(a,b){ 
        return a.map((row,i)=>[a[i][0]-b[i][0]]); 
    }
    
    _outer(d){
        const o = Array(6).fill().map(()=>Array(6).fill(0));
        for(let i=0;i<6;i++) for(let j=0;j<6;j++) o[i][j]=d[i][0]*d[j][0];
        return o;
    }
    
    _madd(A,B){ 
        return A.map((r,i)=>r.map((v,j)=>v+B[i][j])); 
    }
    
    _mscale(A,s){ 
        return A.map(r=>r.map(v=>v*s)); 
    }

    // API methods
    getState(){ 
        return this.state; 
    }
    
    getPosition(){ 
        return this.state ? [this.state[0][0], this.state[1][0]] : null; 
    }
    
    getPositionCovariance(){ 
        return this.covariance ? MatrixUtils.extractSubmatrix(this.covariance,0,1,0,1) : null; 
    }
    
    getSystemMatrices(){
        // For IMM, provide all matrices that the UI expects
        const matrices = {};
        
        // Get matrices from both models if available
        if (this.models && this.models[0] && typeof this.models[0].getSystemMatrices === 'function') {
            const model0Matrices = this.models[0].getSystemMatrices();
            const model1Matrices = this.models[1] && typeof this.models[1].getSystemMatrices === 'function' 
                ? this.models[1].getSystemMatrices() : model0Matrices;
            
            // Standard matrices (same for both models)
            matrices.F = model0Matrices.F;
            matrices.H = model0Matrices.H;
            matrices.R = model0Matrices.R;
            
            // Model-specific process noise matrices
            matrices.Q0 = model0Matrices.Q;
            matrices.Q1 = model1Matrices.Q;
            
            // IMM-specific matrices
            matrices.Pi = this.Pi;  // Model transition probabilities
            matrices.P = this.covariance;  // Combined covariance
        } else {
            // Fallback: return null matrices
            matrices.F = null;
            matrices.H = null;
            matrices.Q0 = null;
            matrices.Q1 = null;
            matrices.R = null;
            matrices.Pi = null;
            matrices.P = null;
        }
        
        return matrices;
    }
    
    getName() {
        return 'IMM Filter (2-Model)';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IMMFilter;
}