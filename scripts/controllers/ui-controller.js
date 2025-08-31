// ================================
// UI CONTROLLER
// ================================

class UIController {
    constructor(simulationController) {
        this.sim = simulationController;
        this.initializeControls();
    }

    initializeControls() {
        document.getElementById('trajectorySelect').addEventListener('change', (e) => {
            this.sim.setTrajectoryType(e.target.value);
        });

        const timeSlider = document.getElementById('timeSlider');
        const timeValue = document.getElementById('timeValue');
        timeSlider.max = this.sim.config.maxTime / this.sim.config.dt;

        timeSlider.addEventListener('input', (e) => {
            this.sim.setTime(e.target.value * this.sim.config.dt);
            timeValue.textContent = this.sim.currentTime.toFixed(2) + 's';
        });

        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect) {
            filterSelect.value = this.sim.filterType || 'kf';
            filterSelect.addEventListener('change', (e) => this.sim.setFilterType(e.target.value));
        }

        document.getElementById('measurementNoise').addEventListener('input', (e) => {
            document.getElementById('measurementNoiseValue').textContent = e.target.value;
            this.sim.updateNoiseParams();
        });

        document.getElementById('processNoise').addEventListener('input', (e) => {
            document.getElementById('processNoiseValue').textContent = e.target.value;
            this.sim.updateNoiseParams();
        });

        document.getElementById('measurementRatio').addEventListener('input', (e) => {
            const ratio = parseFloat(e.target.value);
            document.getElementById('measurementRatioValue').textContent = ratio.toFixed(1) + 'x';
            this.sim.config.measurementRatio = ratio;
            this.sim.updateMeasurementRate();
            this.sim.generateData();
            this.sim.draw();
        });

        document.getElementById('playBtn').addEventListener('click', () => this.sim.togglePlay());
        document.getElementById('stepBtn').addEventListener('click', () => this.sim.step());
        document.getElementById('resetBtn').addEventListener('click', () => this.sim.reset());

        document.getElementById('toggleMatrices').addEventListener('click', () => {
            const section = document.getElementById('matricesSection');
            const toggle = document.getElementById('toggleMatrices');
            const isVisible = section.classList.toggle('visible');
            toggle.textContent = isVisible ? 'Hide System Matrices & Equations ▲' : 'Show System Matrices & Equations ▼';
            this.sim.setMatrixVisibility(isVisible);
        });
    }

    updateTimeDisplay() {
        document.getElementById('timeSlider').value = this.sim.currentTime / this.sim.config.dt;
        document.getElementById('timeValue').textContent = this.sim.currentTime.toFixed(2) + 's';
    }
}