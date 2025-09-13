// ================================
// MAIN SIMULATION CONTROLLER
// ================================

class SimulationController {
    constructor(config = {}) {
        this.config = {
            maxTime: 30,
            dt: 0.05,
            measurementRatio: 2.0,
            bootstrapMeasurements: 3,
            ...config
        };
        this.updateMeasurementRate();

        this.trajectoryType = 'circle';
        this.trajectoryGenerator = this.createTrajectoryGenerator();
        this.filterType = config.initialFilterType || this.getDefaultFilterKey(); // Use provided initial type
        if (!this.filterType) {
            throw new Error('No filter types available in registry');
        }
        this.filter = this.createFilter();
        this.visualization = new VisualizationEngine('canvas');
        this.errorGraph = new ErrorGraphVisualization('errorGraph');
        this.filterUIManager = config.filterUIManager;

        this.currentTime = 0;
        this.playing = false;
        this.showMatrices = false;

        this.groundTruth = [];
        this.measurements = [];
        this.estimates = [];
        this.covariances = [];
        this.filterStates = [];
        this.errorHistory = [];
        this.confidenceHistory = [];

        this.generateData();
    }

    createFilter() {
        const baseConfig = {
            dt: this.config.dt,
            measurementNoise: this.getMeasurementNoise(),
            processNoise: this.getProcessNoise()
        };
        
        return FilterRegistry.createFilter(this.filterType, baseConfig);
    }

    setFilterType(filterType) {
        this.filterType = filterType;
        this.filter = this.createFilter();
        
        // Update UI configuration based on filter type
        if (this.filterUIManager) {
            this.filterUIManager.loadFilterUI(this.filterType, this.filter);
        }
        
        // Update canvas title
        this.updateCanvasTitle();
        
        this.generateData();
        if (this.ui) this.ui.updateTimeDisplay();
        this.draw();
    }

    createTrajectoryGenerator() {
        const config = { maxTime: this.config.maxTime, scale: 150 };
        switch (this.trajectoryType) {
            case 'minjerk':
                return new MinimumJerkGenerator(config);
            case 'lissajous':
                return new LissajousGenerator(config);
            case 'clothoid':
                return new ClothoidGenerator(config);
            case 'rfsmooth':
                return new RandomFourierSmoothGenerator(config);
            case 'constaccel_bezier':
                return new ConstAccelBezierGenerator(config);
            case 'constaccel_line':
                return new ConstAccelLineGenerator(config);
            case 'figure8': return new Figure8Generator(config);
            case 'circle': return new CircleGenerator(config);
            case 'constantvelocity': return new ConstantVelocityGenerator(config);
            case 'constantacceleration': return new ConstantAccelerationGenerator(config);
            case 'sinewave': return new SineWaveGenerator(config);
            case 'parabolic': return new ParabolicGenerator(config);
            case 'square': return new SquareGenerator(config);
            case 'spiral': return new SpiralGenerator(config);
            case 'heart': return new HeartGenerator(config);
            case 'star': return new StarGenerator(config);
            case 'infinity': return new InfinityGenerator(config);
            case 'stepfunction': return new StepFunctionGenerator(config);
            case 'stopandgo': return new StopAndGoGenerator(config);
            case 'randomwalk': return new RandomWalkGenerator(config);
            default: return new Figure8Generator(config);
        }
    }

    getMeasurementNoise() { return parseFloat(document.getElementById('measurementNoise').value); }
    getProcessNoise() { return parseFloat(document.getElementById('processNoise').value); }

    updateMeasurementRate() {
        this.config.measurementRate = this.config.dt * this.config.measurementRatio;
    }

    getMeasurementRatio() {
        return parseFloat(document.getElementById('measurementRatio').value);
    }

    // Helper to build an initial covariance (position from R, big uncertainty elsewhere)
    buildInitialCovariance(measVar) {
        const P = MatrixUtils.identity(6).map(row => row.map(() => 0));
        P[0][0] = measVar * 4;  // position x
        P[1][1] = measVar * 4;  // position y
        P[2][2] = 1000;         // velocity x
        P[3][3] = 1000;         // velocity y
        P[4][4] = 10000;        // acceleration x
        P[5][5] = 10000;        // acceleration y
        return P;
    }

    // Initialize using last 3 measurements (central/second differences)
    initializeFromBuffer(buffer) {
        // buffer has entries: {time, pos:[x,y]}
        const n = buffer.length;
        const m1 = buffer[n-3], m2 = buffer[n-2], m3 = buffer[n-1];

        const x3 = (m1.pos[0] + m2.pos[0] + m3.pos[0]) / 3;
        const y3 = (m1.pos[1] + m2.pos[1] + m3.pos[1]) / 3;
        const vx = 0;
        const vy = 0;
        const ax = 0;
        const ay = 0;

        const x0 = [[x3],[y3],[vx],[vy],[ax],[ay]];
        const r = this.getMeasurementNoise();
        const P0 = this.buildInitialCovariance(r*r);
        if (this.filter.initialize) this.filter.initialize(x0, P0);
        else this.filter.setInitialState(x0, P0);
    }

    generateData() {
        this.groundTruth = [];
        this.measurements = [];
        this.estimates = [];
        this.covariances = [];
        this.filterStates = [];
        this.errorHistory = [];
        this.confidenceHistory = [];

        this.filter = this.createFilter();
        const measurementNoise = this.getMeasurementNoise();
        let lastMeasurementTime = -Infinity;

        let lastInnovation = null;
        let lastKalmanGain = null;
        let lastInnovationCovariance = null;
        // Coverage counters (cumulative over time)
        let coverageHits = 0;
        let coverageTotal = 0;

        // Bootstrapping buffer
        const bootstrapNeeded = this.config.bootstrapMeasurements;
        const buffer = [];

        for (let t = 0; t <= this.config.maxTime + 1e-9; t += this.config.dt) {
            const truth = this.trajectoryGenerator.generatePosition(t);
            this.groundTruth.push(truth);

            // Decide if a measurement arrives at this time
            let hadMeasurement = false;
            if (t - lastMeasurementTime >= this.config.measurementRate - this.config.dt/2) {
                const measurement = NoiseUtils.addGaussianNoise(truth, measurementNoise);
                this.measurements.push({ time: t, pos: measurement });
                lastMeasurementTime = t;
                hadMeasurement = true;

                // Accumulate for bootstrap
                buffer.push({ time: t, pos: measurement });
                if (!this.filter.initialized && buffer.length >= bootstrapNeeded) {
                    this.initializeFromBuffer(buffer);
                }
            }

            // Run filter only after initialization
            if (this.filter.initialized) {
                this.filter.predict();
                if (hadMeasurement) {
                    this.filter.update([[this.measurements[this.measurements.length-1].pos[0]], [this.measurements[this.measurements.length-1].pos[1]]]);
                }

                if (this.filter.lastInnovation) lastInnovation = [...this.filter.lastInnovation.map(row => row[0])];
                if (this.filter.lastKalmanGain) lastKalmanGain = this.filter.lastKalmanGain.map(row => [...row]);
                if (this.filter.lastInnovationCovariance) lastInnovationCovariance = this.filter.lastInnovationCovariance.map(row => [...row]);

                const position = this.filter.getPosition();
                const covPos = this.filter.getPositionCovariance();
                this.estimates.push(position);
                this.covariances.push(covPos);

                // Calculate position error and 95% confidence bound
                if (position && covPos) {
                    // Position error (Euclidean distance)
                    const error = Math.sqrt(Math.pow(truth[0] - position[0], 2) + Math.pow(truth[1] - position[1], 2));
                    this.errorHistory.push(error);

                    // 95% confidence bound (major axis of confidence ellipse)
                    const a = covPos[0][0], b = covPos[0][1], c = covPos[1][1];
                    const trace = a + c;
                    const det = a * c - b * b;
                    const disc = Math.sqrt(Math.max(0, trace * trace - 4 * det));
                    const maxEigenvalue = (trace + disc) / 2;
                    const confidence95 = Math.sqrt(Math.max(0, maxEigenvalue * 5.991)); // chi2(2,0.95) = 5.991
                    this.confidenceHistory.push(confidence95);
                } else {
                    this.errorHistory.push(null);
                    this.confidenceHistory.push(null);
                }

                // Update coverage only after filter is initialized
                // (inside 95% ellipse => r^T S^{-1} r <= 5.991)
                if (this.filter.initialized && position && covPos) {
                    const r0 = truth[0] - position[0];
                    const r1 = truth[1] - position[1];
                    const Sinv = MatrixUtils.inverse2x2(covPos);
                    const d2 = r0 * (Sinv[0][0]*r0 + Sinv[0][1]*r1) + r1 * (Sinv[1][0]*r0 + Sinv[1][1]*r1);
                    if (Number.isFinite(d2)) {
                        coverageTotal += 1;
                        if (d2 <= 5.991) coverageHits += 1;
                    }
                }
            } else {
                // Not initialized yet: no estimate/covariance
                this.estimates.push(null);
                this.covariances.push(null);
                this.errorHistory.push(null);
                this.confidenceHistory.push(null);
            }

            // Store state snapshot for the panel
            let stateArray = null, posCov2x2 = null, fullP = null;
            if (this.filter.initialized) {
                stateArray = [...this.filter.getState().map(row => row[0])];
                fullP = this.filter.covariance.map(row => [...row]);
                posCov2x2 = MatrixUtils.extractSubmatrix(this.filter.covariance, 0, 1, 0, 1);
            }

            // Extract filter-specific data using registry
            let filterSpecificData = {};
            try {
                const context = { groundTruth: truth };
                filterSpecificData = FilterRegistry.extractFilterData(this.filterType, this.filter, context);
            } catch (error) {
                console.warn('Filter data extraction failed:', error.message);
            }

            const filterState = {
                state: stateArray,
                covariance: posCov2x2,
                fullCovariance: fullP,
                innovation: lastInnovation,
                kalmanGain: lastKalmanGain,
                innovationCovariance: lastInnovationCovariance,
                hadMeasurement: hadMeasurement,
                initialized: this.filter.initialized,
                bootstrapCount: Math.min(buffer.length, bootstrapNeeded),
                bootstrapNeeded: bootstrapNeeded,
                coveragePct: coverageTotal > 0 ? (coverageHits / coverageTotal) : null,
                filterSpecificData: filterSpecificData
            };
            
            // Include additional plot data for error graph if provided by filter
            if (filterSpecificData && filterSpecificData.additionalPlotData) {
                filterState.additionalPlotData = filterSpecificData.additionalPlotData;
            }
            
            this.filterStates.push(filterState);
        }

        // Update fixed, whole-duration coverage display in Controls
        const totalEl = document.getElementById('total-coverage-95');
        if (totalEl) totalEl.textContent = coverageTotal > 0 ? ((coverageHits / coverageTotal) * 100).toFixed(1) + '%' : '--';
    }

    updateNoiseParams() {
        this.config.measurementRatio = this.getMeasurementRatio();
        this.updateMeasurementRate();
        
        // Use registry to update noise parameters in a filter-agnostic way
        try {
            FilterRegistry.updateNoise(this.filterType, this.filter, this.getMeasurementNoise(), this.getProcessNoise());
        } catch (error) {
            console.warn('Filter noise update not supported:', error.message);
        }
        
        this.generateData();
        this.draw();
    }

    setTime(newTime) {
        this.currentTime = Math.max(0, Math.min(newTime, this.config.maxTime));
        this.draw();
    }

    togglePlay() { 
        this.playing = !this.playing; 
        this.updatePlayButton();
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.textContent = this.playing ? '⏸' : '▶';
        }
    }

    step() {
        this.playing = false;
        this.updatePlayButton();
        this.currentTime += this.config.dt;
        if (this.currentTime > this.config.maxTime) this.currentTime = 0;
        this.ui.updateTimeDisplay();
        this.draw();
    }

    stepBackward() {
        this.playing = false;
        this.updatePlayButton();
        this.currentTime -= this.config.dt;
        if (this.currentTime < 0) this.currentTime = this.config.maxTime;
        this.draw();
    }

    reset() {
        this.playing = false;
        this.updatePlayButton();
        this.currentTime = 0;
        this.generateData();
        this.ui.updateTimeDisplay();
        this.draw();
    }

    setMatrixVisibility(visible) { this.showMatrices = visible; this.draw(); }

    setTrajectoryType(trajectoryType) {
        this.trajectoryType = trajectoryType;
        this.trajectoryGenerator = this.createTrajectoryGenerator();
        this.generateData();
        this.currentTime = 0;
        if (this.ui) this.ui.updateTimeDisplay();
        this.draw();
    }

    draw() {
        this.visualization.draw({
            currentTime: this.currentTime,
            dt: this.config.dt,
            groundTruth: this.groundTruth,
            measurements: this.measurements,
            estimates: this.estimates,
            covariances: this.covariances
        });

        this.errorGraph.draw({
            currentTime: this.currentTime,
            maxTime: this.config.maxTime,
            dt: this.config.dt,
            errorHistory: this.errorHistory,
            confidenceHistory: this.confidenceHistory,
            filterStates: this.filterStates
        }, this.filterType);

        const timeIndex = Math.floor(this.currentTime / this.config.dt);
        if (timeIndex < this.filterStates.length && this.filterUIManager) {
            const filterState = this.filterStates[timeIndex];
            const groundTruth = this.groundTruth[timeIndex];
            
            // Prepare filter state for the new API
            const systemMatrices = this.filter.getSystemMatrices();
            // Add P (full covariance) and S (innovation covariance) matrices
            if (filterState.fullCovariance) {
                systemMatrices.P = filterState.fullCovariance;
            }
            if (filterState.innovationCovariance) {
                systemMatrices.S = filterState.innovationCovariance;
            }
            
            const formattedFilterState = {
                state: filterState.state ? filterState.state.map(val => [val]) : null, // Convert to column vector format
                positionCovariance: filterState.covariance,
                innovation: filterState.innovation ? filterState.innovation.map(val => [val]) : null, // Convert to column vector format  
                kalmanGain: filterState.kalmanGain,
                systemMatrices: systemMatrices
            };
            
            // Calculate error metrics
            let errorMetrics = {};
            if (filterState.state && groundTruth) {
                const posError = Math.sqrt(Math.pow(filterState.state[0] - groundTruth[0], 2) + Math.pow(filterState.state[1] - groundTruth[1], 2));
                errorMetrics['pos-error'] = posError;
                
                if (filterState.covariance) {
                    errorMetrics['std-x'] = Math.sqrt(filterState.covariance[0][0]);
                    errorMetrics['std-y'] = Math.sqrt(filterState.covariance[1][1]);
                }
                
                if (typeof filterState.coveragePct === 'number') {
                    errorMetrics['coverage-95'] = (filterState.coveragePct * 100).toFixed(1) + '%';
                }
                
                // Add filter-specific error metrics
                if (filterState.filterSpecificData && filterState.filterSpecificData.modelEntropy !== undefined) {
                    errorMetrics['model-entropy'] = filterState.filterSpecificData.modelEntropy.toFixed(3);
                }
            }
            
            // Prepare additional data for UI
            const additionalData = {
                errorMetrics: errorMetrics,
                modelProbabilities: filterState.filterSpecificData ? filterState.filterSpecificData.modelProbabilities : null,
                activeModel: filterState.filterSpecificData ? filterState.filterSpecificData.activeModel : null
            };
            
            this.filterUIManager.updateDisplay(formattedFilterState, additionalData);
            
            // Update measurement status
            // Timeline is now updated directly in StateDisplayEngine.updateDisplay()
        }
    }

    animate() {
        if (this.playing) {
            this.currentTime += this.config.dt;
            if (this.currentTime > this.config.maxTime) this.currentTime = 0;
            if (this.ui) this.ui.updateTimeDisplay();
            this.draw();
        }
        requestAnimationFrame(() => this.animate());
    }

    updateCanvasTitle() {
        const titleElement = document.getElementById('canvas-title');
        if (titleElement) {
            try {
                const displayInfo = FilterRegistry.getDisplayInfo(this.filterType);
                titleElement.textContent = displayInfo.canvasTitle;
            } catch (error) {
                console.warn('Could not get filter display info:', error.message);
                titleElement.textContent = 'Unknown Filter';
            }
        }
    }

    start() {
        this.ui = new UIController(this);
        this.updateCanvasTitle(); // Set initial title
        this.draw();
        this.visualization.initializeResetHandler();
        this.visualization.setOnViewChange(() => this.draw()); // redraw even when paused
        this.animate();
    }

    getDefaultFilterKey() {
        try {
            const availableFilters = FilterRegistry.getAvailableFilters();
            return availableFilters.length > 0 ? availableFilters[0].value : null;
        } catch (error) {
            console.error('Failed to get default filter:', error);
            return null;
        }
    }
}