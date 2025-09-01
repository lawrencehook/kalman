// ================================
// STATE DISPLAY ENGINE
// ================================

class StateDisplayEngine {
    constructor() { 
        this.elements = {};
        this.timeline = [];
        this.maxTimelineLength = 15;
        this.initialized = false;
        this.updateCount = 0;
    }

    cacheElements() {
        const timelineElement = document.getElementById('measurementTimeline');
        console.log('cacheElements: measurementTimeline =', timelineElement);
        
        return {
            measurementTimeline: timelineElement,
            stateX: document.getElementById('state-x'),
            stateY: document.getElementById('state-y'),
            stateVx: document.getElementById('state-vx'),
            stateVy: document.getElementById('state-vy'),
            stateAx: document.getElementById('state-ax'),
            stateAy: document.getElementById('state-ay'),
            p00: document.getElementById('p00'),
            p01: document.getElementById('p01'),
            p10: document.getElementById('p10'),
            p11: document.getElementById('p11'),
            posError: document.getElementById('pos-error'),
            stdX: document.getElementById('std-x'),
            stdY: document.getElementById('std-y'),
            coverage95: document.getElementById('coverage-95'),
            innovationX: document.getElementById('innovation-x'),
            innovationY: document.getElementById('innovation-y'),
            kalmanGainElements: [
                'k00', 'k01', 'k10', 'k11', 'k20', 'k21',
                'k30', 'k31', 'k40', 'k41', 'k50', 'k51'
            ].map(id => ({ id, element: document.getElementById(id) }))
        };
    }

    displayMatrix(matrix, elementId) {
        const container = document.getElementById(elementId);
        if (!container) return;
        container.innerHTML = '';
        matrix.forEach(row => {
            row.forEach(val => {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                const num = typeof val === 'number' ? val : 0;
                if (Math.abs(num) < 0.001 && num !== 0) cell.textContent = num.toExponential(1);
                else if (Math.abs(num) < 0.01) cell.textContent = num.toFixed(4);
                else cell.textContent = num.toFixed(3);
                container.appendChild(cell);
            });
        });
    }

    updateDisplay(filterState, groundTruth, systemMatrices, showMatrices) {
        console.log('StateDisplayEngine.updateDisplay called with:', filterState);
        
        // Initialize timeline on first call (after DOM is ready)
        if (!this.initialized) {
            console.log('Initializing StateDisplayEngine for first time');
            this.elements = this.cacheElements();
            this.initializeTimeline();
            this.initialized = true;
        }

        const { state, covariance, innovation, kalmanGain, innovationCovariance, hadMeasurement, initialized, bootstrapCount, bootstrapNeeded } = filterState;

        // Update timeline with current state
        console.log('About to update timeline:', { initialized, hadMeasurement, bootstrapCount, bootstrapNeeded });
        this.updateTimeline(initialized, hadMeasurement, bootstrapCount, bootstrapNeeded);

        // State vector
        const setVal = (el, val) => {
            if (!el) return; // Skip if element doesn't exist
            if (val === null || val === undefined) { el.textContent = '--'; el.classList.add('inactive'); }
            else { el.textContent = val.toFixed(2); el.classList.remove('inactive'); }
        };

        if (!initialized || !state) {
            [this.elements.stateX, this.elements.stateY, this.elements.stateVx, this.elements.stateVy, this.elements.stateAx, this.elements.stateAy].forEach(el => {
                if (el) { el.textContent = '--'; el.classList.add('inactive'); }
            });
            [this.elements.p00, this.elements.p01, this.elements.p10, this.elements.p11, this.elements.posError, this.elements.stdX, this.elements.stdY].forEach(el => {
                if (el) { el.textContent = '--'; el.classList.add('inactive'); }
            });
            // Innovation / gain placeholders
            this.updateInnovationAndGain(null, null, true);
        } else {
            setVal(this.elements.stateX, state[0]);
            setVal(this.elements.stateY, state[1]);
            setVal(this.elements.stateVx, state[2]);
            setVal(this.elements.stateVy, state[3]);
            setVal(this.elements.stateAx, state[4]);
            setVal(this.elements.stateAy, state[5]);

            // Position covariance & metrics
            if (covariance) {
                setVal(this.elements.p00, covariance[0][0]);
                setVal(this.elements.p01, covariance[0][1]);
                setVal(this.elements.p10, covariance[1][0]);
                setVal(this.elements.p11, covariance[1][1]);

                const posError = Math.sqrt(Math.pow(state[0] - groundTruth[0], 2) + Math.pow(state[1] - groundTruth[1], 2));
                setVal(this.elements.posError, posError);
                setVal(this.elements.stdX, Math.sqrt(covariance[0][0]));
                setVal(this.elements.stdY, Math.sqrt(covariance[1][1]));
                // Coverage display
                if (typeof filterState.coveragePct === 'number') {
                    this.elements.coverage95.textContent = (filterState.coveragePct * 100).toFixed(1) + '%';
                    this.elements.coverage95.classList.remove('inactive');
                } else { this.elements.coverage95.textContent = '--'; }
            }

            // Innovation / gain
            this.updateInnovationAndGain(innovation, kalmanGain, !hadMeasurement);
        }

        if (showMatrices && systemMatrices) {
            this.displayMatrix(systemMatrices.F, 'matrix-F');
            this.displayMatrix(systemMatrices.H, 'matrix-H');
            this.displayMatrix(systemMatrices.Q, 'matrix-Q');
            this.displayMatrix(systemMatrices.R, 'matrix-R');
            if (covariance) this.displayMatrix(filterState.fullCovariance, 'matrix-P-full');
            else document.getElementById('matrix-P-full').innerHTML = '<div class="matrix-cell inactive">Not initialized</div>';

            if (innovationCovariance) this.displayMatrix(innovationCovariance, 'matrix-S');
            else document.getElementById('matrix-S').innerHTML = '<div class="matrix-cell inactive">Not computed</div>';
        }
    }

    updateInnovationAndGain(innovation, kalmanGain, inactive) {
        if (innovation) {
            if (this.elements.innovationX) {
                this.elements.innovationX.textContent = innovation[0].toFixed(2);
                if (inactive) this.elements.innovationX.classList.add('inactive'); 
                else this.elements.innovationX.classList.remove('inactive');
            }
            if (this.elements.innovationY) {
                this.elements.innovationY.textContent = innovation[1].toFixed(2);
                if (inactive) this.elements.innovationY.classList.add('inactive'); 
                else this.elements.innovationY.classList.remove('inactive');
            }
        } else {
            if (this.elements.innovationX) {
                this.elements.innovationX.textContent = '--';
                this.elements.innovationX.classList.add('inactive');
            }
            if (this.elements.innovationY) {
                this.elements.innovationY.textContent = '--';
                this.elements.innovationY.classList.add('inactive');
            }
        }

        if (kalmanGain) {
            this.elements.kalmanGainElements.forEach(({ element }, index) => {
                if (!element) return;
                const row = Math.floor(index / 2), col = index % 2;
                element.textContent = kalmanGain[row][col].toFixed(3);
                if (inactive) element.classList.add('inactive'); else element.classList.remove('inactive');
            });
        } else {
            this.elements.kalmanGainElements.forEach(({ element }) => {
                if (element) {
                    element.textContent = '--'; 
                    element.classList.add('inactive');
                }
            });
        }
    }

    initializeTimeline() {
        console.log('initializeTimeline called');
        console.log('measurementTimeline element:', this.elements.measurementTimeline);
        
        if (!this.elements.measurementTimeline) {
            console.warn('measurementTimeline element not found!');
            return;
        }
        
        // Create 15 circles initially filled with gray (no data)
        this.elements.measurementTimeline.innerHTML = '';
        console.log('Creating', this.maxTimelineLength, 'circles');
        
        for (let i = 0; i < this.maxTimelineLength; i++) {
            const circle = document.createElement('div');
            circle.className = 'timeline-circle';
            circle.dataset.index = i;
            circle.style.backgroundColor = '#666'; // Gray for no data
            circle.title = 'No data yet';
            this.elements.measurementTimeline.appendChild(circle);
        }
        
        console.log('Timeline initialized with', this.elements.measurementTimeline.children.length, 'circles');
        
        // Initialize timeline state array with individual objects
        this.timeline = Array.from({ length: this.maxTimelineLength }, () => ({ type: 'none', tooltip: 'No data yet' }));
    }

    updateTimeline(initialized, hadMeasurement, bootstrapCount, bootstrapNeeded) {
        this.updateCount++;
        console.log(`StateDisplayEngine.updateTimeline #${this.updateCount} called with:`, { initialized, hadMeasurement, bootstrapCount, bootstrapNeeded });
        
        // Initialize timeline on first call (after DOM is ready)
        if (!this.initialized) {
            console.log('Initializing StateDisplayEngine timeline for first time');
            this.elements = this.cacheElements();
            this.initializeTimeline();
            this.initialized = true;
        }

        if (!this.elements.measurementTimeline) return;
        
        // Determine current state
        let currentState;
        if (!initialized) {
            const bCount = bootstrapCount || 0;
            const bNeeded = bootstrapNeeded || 3;
            console.log(`Filter not initialized - bootstrapping (${bCount}/${bNeeded})`);
            currentState = {
                type: 'bootstrapping',
                tooltip: `Bootstrapping (${bCount}/${bNeeded})`,
                color: '#f84' // Direct color value for warning/orange
            };
        } else if (hadMeasurement) {
            console.log('Filter initialized with measurement update');
            currentState = {
                type: 'measurement',
                tooltip: 'Measurement Update',
                color: '#4f4' // Direct color value for success/green
            };
        } else {
            console.log('Filter initialized with prediction only');
            currentState = {
                type: 'prediction',
                tooltip: 'Prediction Only', 
                color: '#f44' // Direct color value for error/red
            };
        }
        
        console.log('Timeline update:', currentState.type, 'color:', currentState.color);
        console.log('Current state values:', { initialized, hadMeasurement, bootstrapCount, bootstrapNeeded });
        
        // Add new state to timeline (shift left, add right)
        this.timeline.shift();
        this.timeline.push(currentState);
        
        // Update visual circles
        const circles = this.elements.measurementTimeline.querySelectorAll('.timeline-circle');
        console.log('Found', circles.length, 'circles to update');
        
        circles.forEach((circle, index) => {
            const state = this.timeline[index];
            console.log(`Circle ${index}:`, state);
            
            if (state && state.type === 'none') {
                circle.style.setProperty('background-color', '#666', 'important');
                circle.title = state.tooltip;
            } else if (state) {
                circle.style.setProperty('background-color', state.color, 'important');
                circle.title = state.tooltip;
                console.log(`Set circle ${index} to color:`, state.color);
            }
        });
        
        console.log('Updated', circles.length, 'circles');
    }
}