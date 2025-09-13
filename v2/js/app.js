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

        this.config = {
            trajectoryType: 'circle',
            measurementNoise: 5.0,
            processNoise: 1.0,
            samplingRatio: 0.5,
            playSpeed: 50  // ms per frame
        };

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupControls();
        this.generateAndRun();
    }

    setupCanvas() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) {
            // Create canvas if it doesn't exist
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'canvas';
            this.canvas.width = 600;
            this.canvas.height = 400;
            document.body.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2); // Center origin
    }

    setupControls() {
        // Create simple controls
        const controls = document.createElement('div');
        controls.innerHTML = `
            <div style="margin: 10px;">
                <button id="playBtn">Play</button>
                <button id="resetBtn">Reset</button>
                <label>Trajectory:
                    <select id="trajectorySelect">
                        <option value="circle">Circle</option>
                        <option value="line">Line</option>
                    </select>
                </label>
                <label>Measurement Noise:
                    <input type="range" id="noiseSlider" min="1" max="20" value="5" step="0.5">
                    <span id="noiseValue">5.0</span>
                </label>
                <label>Process Noise:
                    <input type="range" id="processNoiseSlider" min="0.1" max="5" value="1" step="0.1">
                    <span id="processNoiseValue">1.0</span>
                </label>
                <br>
                <label>Time:
                    <input type="range" id="timeSlider" min="0" max="10" value="0" step="0.1">
                    <span id="timeValue">0.0s</span>
                </label>
            </div>
        `;

        if (document.getElementById('controls')) {
            document.getElementById('controls').replaceWith(controls);
        } else {
            document.body.insertBefore(controls, this.canvas);
        }
        controls.id = 'controls';

        // Event listeners
        document.getElementById('playBtn').onclick = () => this.togglePlay();
        document.getElementById('resetBtn').onclick = () => this.reset();
        document.getElementById('trajectorySelect').onchange = (e) => {
            this.config.trajectoryType = e.target.value;
            this.generateAndRun();
        };
        document.getElementById('noiseSlider').oninput = (e) => {
            this.config.measurementNoise = parseFloat(e.target.value);
            document.getElementById('noiseValue').textContent = e.target.value;
            this.generateAndRun();
        };
        document.getElementById('processNoiseSlider').oninput = (e) => {
            this.config.processNoise = parseFloat(e.target.value);
            document.getElementById('processNoiseValue').textContent = e.target.value;
            this.generateAndRun();
        };
        document.getElementById('timeSlider').oninput = (e) => {
            this.currentTime = parseFloat(e.target.value);
            document.getElementById('timeValue').textContent = `${e.target.value}s`;
            this.draw();
        };
    }

    async generateAndRun() {
        try {
            console.log('🔄 Generating trajectory...');

            // 1. Generate ground truth trajectory
            const trajectoryPoints = DataGenerator.generate(this.config.trajectoryType, {
                radius: 100,
                duration: 10,
                dt: 0.1
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
                samplingRatio: this.config.samplingRatio,
                processNoise: this.config.processNoise,
                dt: 0.1
            });

            console.log('📡 Generated measurements:', filterInput.measurements.length, 'points');

            // Validate filter input
            await SchemaValidator.validate('filter-input', filterInput);
            console.log('✅ Filter input validation passed');

            // 3. Process through filter
            const filterOutput = CAFilter.process(filterInput);

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

            // Update time slider range based on data duration
            const maxTime = Math.max(...vizData.groundTruth.map(p => p.time));
            const timeSlider = document.getElementById('timeSlider');
            if (timeSlider) {
                timeSlider.max = maxTime;
                timeSlider.value = 0;
                document.getElementById('timeValue').textContent = '0.0s';
            }

            this.draw();

            console.log('🎉 End-to-end pipeline complete!');

        } catch (error) {
            console.error('❌ Pipeline failed:', error);
        }
    }

    draw() {
        if (!this.currentData) return;

        const ctx = this.ctx;

        // Clear canvas
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();

        const { groundTruth, measurements, estimates } = this.currentData;

        // Filter data by current time
        const currentGroundTruth = groundTruth.filter(p => p.time <= this.currentTime);
        const currentMeasurements = measurements.filter(m => m.time <= this.currentTime);
        const currentEstimates = estimates.filter(e => e.time <= this.currentTime);

        // Draw ground truth (blue dots)
        ctx.fillStyle = '#0066cc';
        for (const point of currentGroundTruth) {
            const [x, y] = point.position;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw measurements (red dots)
        ctx.fillStyle = '#cc0000';
        for (const measurement of currentMeasurements) {
            const [x, y] = measurement.position;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw estimates (green dots)
        ctx.fillStyle = '#00cc00';
        for (const estimate of currentEstimates) {
            const [x, y] = estimate.position;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw confidence ellipses (simplified - just circles for now)
        ctx.strokeStyle = '#00cc0055';
        ctx.lineWidth = 1;
        for (const estimate of currentEstimates) {
            const [x, y] = estimate.position;
            const cov = estimate.covariance;
            const radius = Math.sqrt(cov[0][0] + cov[1][1]) * 2; // Rough approximation

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Draw legend
        this.drawLegend();
    }

    drawLegend() {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.fillStyle = '#000';
        ctx.font = '12px monospace';

        ctx.fillStyle = '#0066cc'; ctx.fillText('● Ground Truth', 10, 20);
        ctx.fillStyle = '#cc0000'; ctx.fillText('● Measurements', 10, 35);
        ctx.fillStyle = '#00cc00'; ctx.fillText('● Estimates', 10, 50);
        ctx.fillStyle = '#00cc00'; ctx.fillText('○ Confidence', 10, 65);

        ctx.restore();
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