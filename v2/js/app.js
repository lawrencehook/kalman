/**
 * App - Main application component (UI + Coordinator)
 */
class App {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentData = null;
        this.currentTime = 0;
        this.isPlaying = false;
        this.playInterval = null;

        // View transform state
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.config = {
            trajectoryType: 'line',
            filterType: 'ca',
            measurementNoise: 5.0,
            processNoise: 1.0,
            samplingRatio: 0.5,
            playSpeed: 50,  // ms per frame
            showRatio: 1.0,  // 1.0 = show all estimates, 0.0 = show all measurements
            estimateRatio: 1.0  // Default 1:1 ratio
        };

        // Visibility toggles
        this.visibility = {
            groundTruth: true,
            measurements: true,
            estimates: true,
            confidence: true
        };

        // Error analysis data
        this.errorData = {
            times: [],
            mahalanobis: [],
            chisquare95: [], // 95% confidence threshold (chi-square with 2 DOF = 5.991)
            ellipseCoverage: 0
        };

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupControls();
        this.generateAndRun();
    }

    // Helper methods for ratio slider logarithmic scaling
    linearToLogScale(linearRatio) {
        return Math.log10(linearRatio) * 10; // Convert to -10 to 10 scale
    }

    logToLinearScale(logValue) {
        return Math.pow(10, logValue / 10); // Convert from -10 to 10 scale
    }

    setupCanvas() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) {
            // Create fullscreen canvas
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'canvas';
            document.body.appendChild(this.canvas);
        }

        // Make canvas fullscreen
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.ctx = this.canvas.getContext('2d');

        // Setup mouse interaction
        this.setupMouseEvents();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Redraw after resize
        if (this.currentData) {
            this.draw();
        }
    }

    setupMouseEvents() {
        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Zoom towards mouse position (reduced sensitivity)
            const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
            const newZoom = Math.max(0.1, Math.min(10, this.zoom * zoomFactor));

            // Adjust pan to zoom towards mouse
            const zoomRatio = newZoom / this.zoom;
            this.panX = mouseX - (mouseX - this.panX) * zoomRatio;
            this.panY = mouseY - (mouseY - this.panY) * zoomRatio;

            this.zoom = newZoom;
            this.draw();
        });

        // Mouse down - start dragging
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        // Mouse move - pan when dragging
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;

                this.panX += deltaX;
                this.panY += deltaY;

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;

                this.draw();
            }
        });

        // Mouse up - stop dragging
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        // Double click - reset view
        this.canvas.addEventListener('dblclick', () => {
            this.resetView();
        });

        // Set initial cursor
        this.canvas.style.cursor = 'grab';
    }

    resetView() {
        this.zoom = 1.0;
        // Position origin (0,0) in upper-right area to avoid overlays
        this.panX = this.canvas.width * 0.60;   // 60% to the right
        this.panY = this.canvas.height * 0.45;  // 45% down from top
        this.draw();
    }

    setupControls() {
        // Create overlay controls
        const controls = document.createElement('div');
        controls.id = 'controls';
        controls.innerHTML = `
            <div class="dropdown-row">
                <div class="custom-dropdown" id="filterDropdown">
                    <span id="filterSelected">Loading...</span>
                    <div class="dropdown-options" id="filterOptions">
                        <!-- Options will be populated dynamically -->
                    </div>
                </div>

                <div class="custom-dropdown" id="trajectoryDropdown">
                    <span id="trajectorySelected">Loading...</span>
                    <div class="dropdown-options" id="trajectoryOptions">
                        <!-- Options will be populated dynamically -->
                    </div>
                </div>
            </div>

            <label>Measurement Noise:
                <div class="slider-container">
                    <input type="range" id="noiseSlider" min="-10" max="10" value="7" step="1">
                    <span id="noiseValue">5.0</span>
                </div>
            </label>

            <label>Process Noise:
                <div class="slider-container">
                    <input type="range" id="processNoiseSlider" min="-10" max="10" value="0" step="1">
                    <span id="processNoiseValue">1.0</span>
                </div>
            </label>

            <label>Estimate/Measurement Ratio:
                <div class="slider-container">
                    <input type="range" id="ratioSlider" min="-10" max="10" value="0" step="1">
                    <span id="ratioValue">1.0</span>
                </div>
            </label>

            <div class="control-buttons">
                <div class="time-container">
                    <input type="range" id="timeSlider" min="0" max="30" value="0" step="0.1" style="width: 300px;">
                    <span id="timeValue">0.0s</span>
                </div>
                <div class="button-group">
                    <button id="stepBackBtn">◀</button>
                    <button id="playBtn">Play</button>
                    <button id="stepForwardBtn">▶</button>
                    <button id="resetBtn">Reset</button>
                </div>
                <div style="text-align: center; margin-top: 8px; font-size: 11px; color: #aaa;">
                    <span id="ellipseCoverage">95% ellipse coverage: --</span>
                </div>
            </div>
        `;

        // Replace existing controls or add to body
        const existing = document.getElementById('controls');
        if (existing) {
            existing.replaceWith(controls);
        } else {
            document.body.appendChild(controls);
        }

        // Populate dropdowns from registries
        this.populateTrajectoryDropdown();
        this.populateFilterDropdown();

        // Event listeners
        document.getElementById('playBtn').onclick = () => this.togglePlay();
        document.getElementById('resetBtn').onclick = () => this.reset();
        document.getElementById('stepBackBtn').onclick = () => this.stepTime(-0.1);
        document.getElementById('stepForwardBtn').onclick = () => this.stepTime(0.1);

        // Custom dropdown functionality for trajectory
        const trajectoryDropdown = document.getElementById('trajectoryDropdown');
        const trajectorySelected = document.getElementById('trajectorySelected');
        const trajectoryOptions = document.getElementById('trajectoryOptions');

        trajectoryDropdown.onclick = () => {
            trajectoryDropdown.classList.toggle('open');
        };

        trajectoryOptions.onclick = (e) => {
            if (e.target.dataset.value) {
                trajectorySelected.textContent = e.target.textContent;
                this.config.trajectoryType = e.target.dataset.value;
                trajectoryDropdown.classList.remove('open');
                this.generateAndRun();
            }
        };

        // Custom dropdown functionality for filter
        const filterDropdown = document.getElementById('filterDropdown');
        const filterSelected = document.getElementById('filterSelected');
        const filterOptions = document.getElementById('filterOptions');

        filterDropdown.onclick = () => {
            filterDropdown.classList.toggle('open');
        };

        filterOptions.onclick = (e) => {
            if (e.target.dataset.value) {
                filterSelected.textContent = e.target.textContent;
                this.config.filterType = e.target.dataset.value;
                filterDropdown.classList.remove('open');
                this.generateAndRun();
            }
        };

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!trajectoryDropdown.contains(e.target)) {
                trajectoryDropdown.classList.remove('open');
            }
            if (!filterDropdown.contains(e.target)) {
                filterDropdown.classList.remove('open');
            }
        });

        document.getElementById('noiseSlider').oninput = (e) => {
            const logValue = parseFloat(e.target.value);
            const linearNoise = this.logToLinearScale(logValue);
            this.config.measurementNoise = linearNoise;
            document.getElementById('noiseValue').textContent = linearNoise.toFixed(1);
            this.generateAndRun();
        };
        document.getElementById('processNoiseSlider').oninput = (e) => {
            const logValue = parseFloat(e.target.value);
            const linearNoise = this.logToLinearScale(logValue);
            this.config.processNoise = linearNoise;
            document.getElementById('processNoiseValue').textContent = linearNoise.toFixed(1);
            this.generateAndRun();
        };
        document.getElementById('ratioSlider').oninput = (e) => {
            const logValue = parseFloat(e.target.value);
            const linearRatio = this.logToLinearScale(logValue);

            this.config.estimateRatio = linearRatio;

            // Format display value nicely
            let displayValue;
            if (linearRatio >= 1) {
                displayValue = linearRatio.toFixed(1);
            } else {
                displayValue = linearRatio.toFixed(2);
            }
            document.getElementById('ratioValue').textContent = displayValue;
            this.generateAndRun(); // Regenerate with new ratio
        };
        document.getElementById('timeSlider').oninput = (e) => {
            this.currentTime = parseFloat(e.target.value);
            document.getElementById('timeValue').textContent = `${e.target.value}s`;
            this.draw();
        };

        // Keyboard event listeners
        this.setupKeyboardEvents();
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // Prevent default only for our specific keys
            if (['Space', 'ArrowLeft', 'ArrowRight'].includes(e.code) ||
                (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey)) {
                e.preventDefault();
            }

            switch(e.code) {
                case 'Space':
                    this.togglePlay();
                    break;
                case 'KeyR':
                    if (!e.metaKey && !e.ctrlKey) { // Allow Cmd+R for refresh
                        this.reset();
                    }
                    break;
                case 'ArrowLeft':
                    this.stepTime(-0.1);
                    break;
                case 'ArrowRight':
                    this.stepTime(0.1);
                    break;
            }
        });

        // Initialize slider values
        this.initializeSliderValues();

        // Create legend and error chart overlays
        this.createLegendOverlay();
        this.createErrorChartOverlay();
    }

    initializeSliderValues() {
        // Set all sliders to logarithmic positions for their default values

        // Measurement noise slider (default 5.0)
        const measurementLogValue = this.linearToLogScale(this.config.measurementNoise);
        document.getElementById('noiseSlider').value = measurementLogValue;
        document.getElementById('noiseValue').textContent = this.config.measurementNoise.toFixed(1);

        // Process noise slider (default 1.0)
        const processLogValue = this.linearToLogScale(this.config.processNoise);
        document.getElementById('processNoiseSlider').value = processLogValue;
        document.getElementById('processNoiseValue').textContent = this.config.processNoise.toFixed(1);

        // Ratio slider (default 1.0)
        const ratioLogValue = this.linearToLogScale(this.config.estimateRatio);
        document.getElementById('ratioSlider').value = ratioLogValue;
        document.getElementById('ratioValue').textContent = this.config.estimateRatio.toFixed(1);
    }

    populateTrajectoryDropdown() {
        const trajectories = TrajectoryRegistry.getAll();
        const selectedSpan = document.getElementById('trajectorySelected');
        const optionsDiv = document.getElementById('trajectoryOptions');

        // Clear existing options
        optionsDiv.innerHTML = '';

        // Add options from registry
        for (const trajectory of trajectories) {
            const option = document.createElement('div');
            option.setAttribute('data-value', trajectory.id);
            option.textContent = trajectory.displayName;
            optionsDiv.appendChild(option);
        }

        // Set default to 'line' if available, otherwise first trajectory
        let defaultTrajectory = trajectories.find(t => t.id === 'line') || trajectories[0];
        if (defaultTrajectory) {
            this.config.trajectoryType = defaultTrajectory.id;
            selectedSpan.textContent = defaultTrajectory.displayName;
        }
    }

    populateFilterDropdown() {
        const filters = FilterRegistry.getAll();
        const selectedSpan = document.getElementById('filterSelected');
        const optionsDiv = document.getElementById('filterOptions');

        // Clear existing options
        optionsDiv.innerHTML = '';

        // Add options from registry
        for (const filter of filters) {
            const option = document.createElement('div');
            option.setAttribute('data-value', filter.id);
            option.textContent = filter.displayName;
            optionsDiv.appendChild(option);
        }

        // Set default to 'ca' if available, otherwise first filter
        let defaultFilter = filters.find(f => f.id === 'ca') || filters[0];
        if (defaultFilter) {
            this.config.filterType = defaultFilter.id;
            selectedSpan.textContent = defaultFilter.displayName;
        }
    }

    createLegendOverlay() {
        // Create legend overlay
        const legend = document.createElement('div');
        legend.id = 'legend';
        legend.innerHTML = `
            <div class="legend-item">
                <input type="checkbox" id="toggleGroundTruth" checked>
                <label for="toggleGroundTruth" style="color: #32cd32;">● Ground Truth</label>
            </div>
            <div class="legend-item">
                <input type="checkbox" id="toggleMeasurements" checked>
                <label for="toggleMeasurements" style="color: #ff1493;">● Measurements</label>
            </div>
            <div class="legend-item">
                <input type="checkbox" id="toggleEstimates" checked>
                <label for="toggleEstimates" style="color: #00ffff;">● Estimates</label>
            </div>
            <div class="legend-item">
                <input type="checkbox" id="toggleConfidence" checked>
                <label for="toggleConfidence" style="color: rgba(0, 255, 255, 0.6);">○ Confidence</label>
            </div>
            <div style="color: #aaa; font-size: 11px; margin-top: 8px; margin-bottom: 2px;">Wheel: zoom, Drag: pan</div>
            <div style="color: #aaa; font-size: 11px;">Double-click: reset view</div>
        `;

        // Replace existing legend or add to body
        const existing = document.getElementById('legend');
        if (existing) {
            existing.replaceWith(legend);
        } else {
            document.body.appendChild(legend);
        }

        // Add event listeners for toggles
        this.setupLegendToggleListeners();
    }

    setupLegendToggleListeners() {
        document.getElementById('toggleGroundTruth').onchange = (e) => {
            this.visibility.groundTruth = e.target.checked;
            this.draw();
        };

        document.getElementById('toggleMeasurements').onchange = (e) => {
            this.visibility.measurements = e.target.checked;
            this.draw();
        };

        document.getElementById('toggleEstimates').onchange = (e) => {
            this.visibility.estimates = e.target.checked;
            this.draw();
        };

        document.getElementById('toggleConfidence').onchange = (e) => {
            this.visibility.confidence = e.target.checked;
            this.draw();
        };
    }

    createErrorChartOverlay() {
        // Create error chart overlay with canvas
        const errorChart = document.createElement('div');
        errorChart.id = 'errorChart';
        errorChart.innerHTML = `
            <canvas id="errorCanvas" width="480" height="240"></canvas>
        `;

        // Replace existing error chart or add to body
        const existing = document.getElementById('errorChart');
        if (existing) {
            existing.replaceWith(errorChart);
        } else {
            document.body.appendChild(errorChart);
        }

        // Initialize error chart canvas
        this.errorCanvas = document.getElementById('errorCanvas');
        this.errorCtx = this.errorCanvas.getContext('2d');

        // Create error chart legend overlay
        this.createErrorChartLegend();
    }

    createErrorChartLegend() {
        // Create error chart legend overlay
        const legend = document.createElement('div');
        legend.id = 'errorChartLegend';
        legend.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 10px;">
                <div style="font-weight: 600; margin-bottom: 2px; color: #ccc;">Mahalanobis Distance</div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 2px; background: #ffffff;"></div>
                    <span>Position Error</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 2px; background: rgba(0, 255, 150, 0.9);"></div>
                    <span>95% Confidence Bound</span>
                </div>
            </div>
        `;

        // Replace existing legend or add to error chart container
        const existing = document.getElementById('errorChartLegend');
        const errorChart = document.getElementById('errorChart');
        if (existing) {
            existing.replaceWith(legend);
        } else if (errorChart) {
            errorChart.appendChild(legend);
        } else {
            document.body.appendChild(legend);
        }
    }

    stepTime(deltaTime) {
        if (this.isPlaying) return; // Don't step while playing

        const timeSlider = document.getElementById('timeSlider');
        const maxTime = parseFloat(timeSlider.max);

        this.currentTime = Math.max(0, Math.min(maxTime, this.currentTime + deltaTime));

        timeSlider.value = this.currentTime;
        document.getElementById('timeValue').textContent = `${this.currentTime.toFixed(1)}s`;

        this.draw();
    }

    async generateAndRun() {
        try {
            console.log('🔄 Generating trajectory...');

            // 1. Generate ground truth trajectory
            const trajectoryRadius = Math.min(this.canvas.width, this.canvas.height) * 0.8 / 2; // 0.8 of min dimension
            const trajectoryPoints = TrajectoryRegistry.generate(this.config.trajectoryType, {
                radius: trajectoryRadius,
                duration: 30,              // 30 seconds total
                dt: 0.1,
                angularVelocity: 3 * 2 * Math.PI / 30,  // 3 full circles in 30s
                // Line trajectory parameters
                startX: -trajectoryRadius,
                startY: 0,
                endX: trajectoryRadius,
                endY: 0
            });

            console.log('📏 Generated trajectory:', trajectoryPoints.length, 'points');

            // Validate trajectory data
            for (const point of trajectoryPoints.slice(0, 3)) {
                await SchemaValidator.validate('trajectory-point', point);
            }
            console.log('✅ Trajectory validation passed');

            // 2. Generate noisy measurements
            const filterInput = MeasurementGenerator.generateMeasurements(trajectoryPoints, {
                measurementNoise: this.config.measurementNoise,
                processNoise: this.config.processNoise,
                estimateRatio: this.config.estimateRatio,
                dt: 0.1
            });

            console.log('📡 Generated measurements:', filterInput.measurements.length, 'points');

            // Validate filter input
            await SchemaValidator.validate('filter-input', filterInput);
            console.log('✅ Filter input validation passed');

            // 3. Process through filter
            const filterClass = FilterRegistry.get(this.config.filterType).filterClass;
            const filterOutput = filterClass.process(filterInput);

            console.log('🎯 Generated estimates:', filterOutput.estimates.length, 'points');

            // Validate filter output
            await SchemaValidator.validate('filter-output', filterOutput);
            console.log('✅ Filter output validation passed');

            // 4. Prepare visualization data
            const vizData = {
                groundTruth: trajectoryPoints.map(p => ({time: p.time, position: p.position})),
                measurements: filterInput.measurements.map(m => ({time: m.time, position: m.position})),
                estimates: filterOutput.estimates
            };

            // Validate viz data
            await SchemaValidator.validate('viz-data', vizData);
            console.log('✅ Viz data validation passed');

            this.currentData = vizData;
            this.currentTime = 0;

            // Calculate error analysis data
            this.calculateErrorData();

            // Update time slider range based on data duration
            const maxTime = Math.max(...vizData.groundTruth.map(p => p.time));
            const timeSlider = document.getElementById('timeSlider');
            if (timeSlider) {
                timeSlider.max = maxTime;
                timeSlider.value = 0;
                document.getElementById('timeValue').textContent = '0.0s';
            }

            // Initialize view if not set
            if (this.panX === 0 && this.panY === 0) {
                this.resetView();
            } else {
                this.draw();
            }

            console.log('🎉 End-to-end pipeline complete!');

        } catch (error) {
            console.error('❌ Pipeline failed:', error);
        }
    }

    calculateErrorData() {
        if (!this.currentData) return;

        const { groundTruth, estimates } = this.currentData;

        // Reset error data
        this.errorData = {
            times: [],
            mahalanobis: [],
            chisquare95: [], // 95% confidence threshold (chi-square with 2 DOF = 5.991)
            ellipseCoverage: 0
        };

        // Calculate errors for each estimate that has corresponding ground truth
        let validPoints = 0;
        let coveredPoints = 0;

        for (const estimate of estimates) {
            // Find corresponding ground truth point
            const gtPoint = groundTruth.find(gt => Math.abs(gt.time - estimate.time) < 0.05);
            if (!gtPoint) continue;

            validPoints++;
            const dx = gtPoint.position[0] - estimate.position[0];
            const dy = gtPoint.position[1] - estimate.position[1];

            // Calculate squared Mahalanobis distance
            const cov = estimate.covariance;
            const detCov = cov[0][0] * cov[1][1] - cov[0][1] * cov[1][0];

            let mahalanobisSq = 0;
            if (Math.abs(detCov) > 1e-10) { // Check for non-singular covariance
                const invCov = [
                    [cov[1][1] / detCov, -cov[0][1] / detCov],
                    [-cov[1][0] / detCov, cov[0][0] / detCov]
                ];

                mahalanobisSq = dx * (invCov[0][0] * dx + invCov[0][1] * dy) +
                               dy * (invCov[1][0] * dx + invCov[1][1] * dy);

                // For 95% confidence, chi-square with 2 DOF = 5.991
                if (mahalanobisSq <= 5.991) {
                    coveredPoints++;
                }
            } else {
                // Fallback for singular covariance: use Euclidean distance
                mahalanobisSq = (dx * dx + dy * dy) / Math.max(cov[0][0], cov[1][1], 1e-6);
            }

            this.errorData.times.push(estimate.time);
            this.errorData.mahalanobis.push(Math.sqrt(mahalanobisSq)); // Store as distance, not squared
            this.errorData.chisquare95.push(Math.sqrt(5.991)); // 95% confidence bound
        }

        // Calculate overall ellipse coverage percentage
        this.errorData.ellipseCoverage = validPoints > 0 ? (coveredPoints / validPoints) * 100 : 0;
    }

    drawErrorChart() {
        if (!this.errorCanvas || !this.errorData || this.errorData.times.length === 0) return;

        const ctx = this.errorCtx;
        const canvas = this.errorCanvas;
        const { width, height } = canvas;

        // Clear canvas (transparent background handled by CSS)
        ctx.clearRect(0, 0, width, height);

        // Chart styling with minimal margins
        const margin = { top: 8, right: 8, bottom: 15, left: 15 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom; // Single plot

        // Data bounds
        const timeRange = [Math.min(...this.errorData.times), Math.max(...this.errorData.times)];
        const errorRange = [0, Math.max(
            ...this.errorData.mahalanobis,
            ...this.errorData.chisquare95
        )];

        // Helper functions
        const timeToX = (time) => margin.left + ((time - timeRange[0]) / (timeRange[1] - timeRange[0])) * chartWidth;
        const errorToY = (error) => margin.top + chartHeight - (error / errorRange[1]) * chartHeight;

        // Draw Mahalanobis distance chart
        this.drawMahalanobisChart(ctx, timeToX, errorToY);

        // Update ellipse coverage display in controls
        const coverageElement = document.getElementById('ellipseCoverage');
        if (coverageElement) {
            coverageElement.textContent = `95% ellipse coverage: ${this.errorData.ellipseCoverage.toFixed(1)}%`;
        }

        // Draw current time indicator
        if (this.currentTime >= timeRange[0] && this.currentTime <= timeRange[1]) {
            const timeX = timeToX(this.currentTime);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(timeX, margin.top);
            ctx.lineTo(timeX, height - margin.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawMahalanobisChart(ctx, timeToX, errorToY) {
        // Draw 95% confidence bound (filled area)
        ctx.fillStyle = 'rgba(0, 255, 150, 0.15)'; // Neon green transparent
        ctx.beginPath();
        for (let i = 0; i < this.errorData.times.length; i++) {
            const x = timeToX(this.errorData.times[i]);
            const y = errorToY(this.errorData.chisquare95[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        for (let i = this.errorData.times.length - 1; i >= 0; i--) {
            const x = timeToX(this.errorData.times[i]);
            const y = errorToY(0); // Bottom bound
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Draw confidence bound line (95% threshold)
        ctx.strokeStyle = 'rgba(0, 255, 150, 0.9)'; // Neon green
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.errorData.times.length; i++) {
            const x = timeToX(this.errorData.times[i]);
            const y = errorToY(this.errorData.chisquare95[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Mahalanobis distance line
        ctx.strokeStyle = '#ffffff'; // White
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.errorData.times.length; i++) {
            const x = timeToX(this.errorData.times[i]);
            const y = errorToY(this.errorData.mahalanobis[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Chart title is now in the legend overlay
    }

    draw() {
        if (!this.currentData) return;

        const ctx = this.ctx;

        // Clear canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply zoom and pan transform
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.zoom, this.zoom);

        const { groundTruth, measurements, estimates } = this.currentData;

        // Filter data by current time
        const currentGroundTruth = groundTruth.filter(p => p.time <= this.currentTime);
        const currentMeasurements = measurements.filter(m => m.time <= this.currentTime);
        const currentEstimates = estimates.filter(e => e.time <= this.currentTime);

        // Calculate constant dot sizes (inverse of zoom to maintain constant screen size)
        const groundTruthRadius = 3 / this.zoom;
        const measurementRadius = 4 / this.zoom;
        const estimateRadius = 3 / this.zoom;

        // Helper function to calculate fade alpha based on time age
        const calculateFadeAlpha = (pointTime, currentTime, fadeWindow = 5.0) => {
            const age = currentTime - pointTime;
            if (age <= 0) return 1.0; // Current or future points are fully opaque
            if (age >= fadeWindow) return 0.1; // Very old points are nearly transparent
            return 0.1 + 0.9 * (1 - age / fadeWindow); // Linear fade from 1.0 to 0.1
        };

        // Draw ground truth (bright green dots with fading)
        if (this.visibility.groundTruth) {
            for (const point of currentGroundTruth) {
                const alpha = calculateFadeAlpha(point.time, this.currentTime);
                ctx.fillStyle = `rgba(50, 205, 50, ${alpha})`;
                const [x, y] = point.position;
                ctx.beginPath();
                ctx.arc(x, y, groundTruthRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // Draw measurements (bright red dots with fading)
        if (this.visibility.measurements) {
            for (const measurement of currentMeasurements) {
                const alpha = calculateFadeAlpha(measurement.time, this.currentTime);
                ctx.fillStyle = `rgba(255, 20, 147, ${alpha})`;
                const [x, y] = measurement.position;
                ctx.beginPath();
                ctx.arc(x, y, measurementRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // Draw estimates (bright cyan dots with fading)
        if (this.visibility.estimates) {
            for (const estimate of currentEstimates) {
                const alpha = calculateFadeAlpha(estimate.time, this.currentTime);
                ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
                const [x, y] = estimate.position;
                ctx.beginPath();
                ctx.arc(x, y, estimateRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // Draw confidence ellipses (proper 2D ellipses with directional uncertainty)
        if (this.visibility.confidence) {
            ctx.lineWidth = 2 / this.zoom; // Constant line width
            for (const estimate of currentEstimates) {
                const alpha = calculateFadeAlpha(estimate.time, this.currentTime);
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.3})`; // Base alpha of 0.3, faded by time

                const [x, y] = estimate.position;
                const cov = estimate.covariance;

                // Calculate eigenvalues and eigenvectors for proper ellipse
                this.drawConfidenceEllipse(ctx, x, y, cov, 2.0); // 2-sigma (95% confidence)
            }
        }

        // Draw error chart overlay
        this.drawErrorChart();

        // Legend and error chart are now HTML overlays
    }

    /**
     * Draw a proper confidence ellipse based on 2x2 covariance matrix
     * Uses eigenvalue decomposition to get correct orientation and shape
     */
    drawConfidenceEllipse(ctx, centerX, centerY, covMatrix, sigmaLevel = 2.0) {
        // Extract covariance matrix elements
        const a = covMatrix[0][0]; // var(x)
        const b = covMatrix[0][1]; // cov(x,y)
        const c = covMatrix[1][0]; // cov(y,x) - should equal b
        const d = covMatrix[1][1]; // var(y)

        // Calculate eigenvalues of the covariance matrix
        const trace = a + d;
        const det = a * d - b * c;
        const discriminant = trace * trace - 4 * det;

        if (discriminant < 0) {
            // Fallback to circle if matrix is not positive definite
            const radius = Math.sqrt(Math.max(a, d)) * sigmaLevel;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();
            return;
        }

        const sqrtDiscriminant = Math.sqrt(discriminant);
        const lambda1 = (trace + sqrtDiscriminant) / 2; // Larger eigenvalue
        const lambda2 = (trace - sqrtDiscriminant) / 2; // Smaller eigenvalue

        // Calculate eigenvector for lambda1 (determines orientation)
        let angle;
        if (Math.abs(b) < 1e-10) {
            // Matrix is already diagonal
            angle = a >= d ? 0 : Math.PI / 2;
        } else {
            // Calculate angle of first eigenvector
            const eigenvector1_x = lambda1 - d;
            const eigenvector1_y = b;
            angle = Math.atan2(eigenvector1_y, eigenvector1_x);
        }

        // Semi-axes lengths (scaled by sigma level)
        const semiMajor = Math.sqrt(Math.max(lambda1, 0)) * sigmaLevel;
        const semiMinor = Math.sqrt(Math.max(lambda2, 0)) * sigmaLevel;

        // Draw the ellipse
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.scale(semiMajor, semiMinor);

        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, 2 * Math.PI);
        ctx.restore();
        ctx.stroke();
    }


    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const playBtn = document.getElementById('playBtn');

        if (this.isPlaying) {
            playBtn.textContent = 'Pause';
            this.playInterval = setInterval(() => {
                // Advance time
                const timeSlider = document.getElementById('timeSlider');
                const maxTime = parseFloat(timeSlider.max);

                this.currentTime += 0.1; // Advance by 0.1s each frame

                if (this.currentTime >= maxTime) {
                    this.currentTime = maxTime;
                    this.togglePlay(); // Auto-pause at end
                    return;
                }

                // Update slider and display
                timeSlider.value = this.currentTime;
                document.getElementById('timeValue').textContent = `${this.currentTime.toFixed(1)}s`;

                this.draw();
            }, this.config.playSpeed);
        } else {
            playBtn.textContent = 'Play';
            if (this.playInterval) {
                clearInterval(this.playInterval);
                this.playInterval = null;
            }
        }
    }

    reset() {
        this.currentTime = 0;
        this.isPlaying = false;
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }

        // Reset button text
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = 'Play';

        this.generateAndRun();
    }
}

// Auto-start the app
let app;
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Preload schemas
        await SchemaValidator.preloadSchemas([
            'trajectory-point', 'filter-input', 'filter-output', 'viz-data'
        ]);
        console.log('📥 Schemas loaded');

        app = new App();
    } catch (error) {
        console.error('❌ App initialization failed:', error);
    }
});