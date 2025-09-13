/**
 * FilterBase - Base class for all filtering algorithms
 * 
 * Provides common interface and functionality for filtering implementations.
 * All filters must implement predict() and update() methods.
 */
class FilterBase {
    constructor(config = {}) {
        this.config = config;
        this.lastInnovation = null;
        this.lastKalmanGain = null;
        this.lastInnovationCovariance = null;
    }
    
    predict() { 
        throw new Error('predict must be implemented by subclass'); 
    }
    
    update(measurement) { 
        throw new Error('update must be implemented by subclass'); 
    }
    
    getState() { 
        return this.state; 
    }
    
    getPosition() {
        if (!this.state || this.state.length < 2) return null;
        return [this.state[0][0], this.state[1][0]];
    }
    
    getPositionCovariance() {
        if (!this.covariance) return null;
        return MatrixUtils.extractSubmatrix(this.covariance, 0, 1, 0, 1);
    }
    
    getSystemMatrices() { 
        return {}; 
    }
    
    getName() { 
        return 'Generic Filter'; 
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterBase;
}