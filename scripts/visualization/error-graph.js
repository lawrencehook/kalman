// ================================
// ERROR GRAPH VISUALIZATION ENGINE
// ================================

class ErrorGraphVisualization {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = {
            marginLeft: 60,
            marginRight: 30,
            marginTop: 30,
            marginBottom: 50,
            ...config
        };
    }

    draw(data) {
        const { currentTime, maxTime, dt, errorHistory, confidenceHistory, filterStates } = data;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();

        const plotWidth = this.canvas.width - this.config.marginLeft - this.config.marginRight;
        const plotHeight = this.canvas.height - this.config.marginTop - this.config.marginBottom;
        const plotLeft = this.config.marginLeft;
        const plotTop = this.config.marginTop;

        // Find max value for Y axis scaling
        let maxError = 0;
        errorHistory.forEach(err => {
            if (err !== null && Number.isFinite(err)) {
                maxError = Math.max(maxError, err);
            }
        });
        confidenceHistory.forEach(conf => {
            if (conf !== null && Number.isFinite(conf)) {
                maxError = Math.max(maxError, conf);
            }
        });
        
        // Use adaptive scaling with a small minimum to avoid zero scale  
        maxError = Math.max(maxError, 0.1); // Minimum scale of 0.1 pixel
        
        // Add 10% padding to the top for better visualization
        maxError = maxError * 1.1;
        
        console.log('Error graph max value:', maxError); // Debug log

        // Draw axes
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        // Y axis
        this.ctx.moveTo(plotLeft, plotTop);
        this.ctx.lineTo(plotLeft, plotTop + plotHeight);
        // X axis
        this.ctx.lineTo(plotLeft + plotWidth, plotTop + plotHeight);
        this.ctx.stroke();

        // Y axis labels
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const value = (maxError * i / yTicks);
            const y = plotTop + plotHeight - (i / yTicks) * plotHeight;
            // Use appropriate precision based on the scale
            const precision = maxError < 10 ? 1 : (maxError < 100 ? 0 : 0);
            this.ctx.fillText(value.toFixed(precision), plotLeft - 5, y);

            // Grid lines
            if (i > 0) {
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(plotLeft, y);
                this.ctx.lineTo(plotLeft + plotWidth, y);
                this.ctx.stroke();
            }
        }

        // X axis labels
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        const xTicks = 6;
        for (let i = 0; i <= xTicks; i++) {
            const value = (maxTime * i / xTicks);
            const x = plotLeft + (i / xTicks) * plotWidth;
            this.ctx.fillText(value.toFixed(1) + 's', x, plotTop + plotHeight + 5);

            // Grid lines
            if (i > 0) {
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(x, plotTop);
                this.ctx.lineTo(x, plotTop + plotHeight);
                this.ctx.stroke();
            }
        }

        // Axis labels
        this.ctx.fillStyle = '#4af';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Time (seconds)', plotLeft + plotWidth / 2, this.canvas.height - 15);

        this.ctx.save();
        this.ctx.translate(15, plotTop + plotHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Position Error (pixels)', 0, 0);
        this.ctx.restore();

        // Draw zones where actual error exceeds confidence bound
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.2)'; // Light red background
        for (let i = 0; i < errorHistory.length - 1; i++) {
            const err = errorHistory[i];
            const conf = confidenceHistory[i];
            const nextErr = errorHistory[i + 1];
            const nextConf = confidenceHistory[i + 1];

            if (err !== null && conf !== null && err > conf) {
                const t1 = i * dt;
                const t2 = (i + 1) * dt;
                const x1 = plotLeft + (t1 / maxTime) * plotWidth;
                const x2 = plotLeft + (t2 / maxTime) * plotWidth;

                this.ctx.fillRect(x1, plotTop, x2 - x1, plotHeight);
            }
        }

        // Helper function to convert data coordinates to canvas coordinates
        const dataToCanvas = (t, error) => {
            const x = plotLeft + (t / maxTime) * plotWidth;
            const y = plotTop + plotHeight - (error / maxError) * plotHeight;
            return [x, y];
        };

        // Draw confidence bound (95%) first (so it appears behind the error line)
        this.ctx.strokeStyle = '#fa4';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        let firstConfPoint = true;
        for (let i = 0; i < confidenceHistory.length; i++) {
            const conf = confidenceHistory[i];
            if (conf !== null && Number.isFinite(conf)) {
                const t = i * dt;
                const [x, y] = dataToCanvas(t, conf);
                if (firstConfPoint) {
                    this.ctx.moveTo(x, y);
                    firstConfPoint = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        this.ctx.stroke();

        // Draw actual error line
        this.ctx.strokeStyle = '#f44';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 1.0;
        this.ctx.beginPath();
        let firstErrorPoint = true;
        for (let i = 0; i < errorHistory.length; i++) {
            const err = errorHistory[i];
            if (err !== null && Number.isFinite(err)) {
                const t = i * dt;
                const [x, y] = dataToCanvas(t, err);
                if (firstErrorPoint) {
                    this.ctx.moveTo(x, y);
                    firstErrorPoint = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        this.ctx.stroke();

        // Draw current time indicator
        const currentTimeX = plotLeft + (currentTime / maxTime) * plotWidth;
        this.ctx.strokeStyle = '#4af';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(currentTimeX, plotTop);
        this.ctx.lineTo(currentTimeX, plotTop + plotHeight);
        this.ctx.stroke();

        // Draw filter-specific information if available
        if (filterStates && filterStates.length > 0 && filterStates[0].filterSpecificData && filterStates[0].filterSpecificData.modelProbabilities) {
            this.drawModelProbabilities(filterStates, plotLeft, plotTop, plotWidth, plotHeight, maxTime, dt);
        }

        this.ctx.restore();
    }

    drawModelProbabilities(filterStates, plotLeft, plotTop, plotWidth, plotHeight, maxTime, dt) {
        // Draw model probability traces in the bottom portion of the graph
        const immHeight = Math.min(60, plotHeight * 0.3); // Use bottom 30% or max 60px
        const immTop = plotTop + plotHeight - immHeight;
        
        // Draw separator line
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(plotLeft, immTop);
        this.ctx.lineTo(plotLeft + plotWidth, immTop);
        this.ctx.stroke();

        // Helper function to convert data coordinates to canvas coordinates for IMM section
        const dataToIMMCanvas = (t, probability) => {
            const x = plotLeft + (t / maxTime) * plotWidth;
            const y = immTop + immHeight - (probability * immHeight);
            return [x, y];
        };

        // Draw model 0 (smooth) probability
        this.ctx.strokeStyle = '#4f4';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        let firstPoint = true;
        for (let i = 0; i < filterStates.length; i++) {
            const state = filterStates[i];
            if (state.filterSpecificData && state.filterSpecificData.modelProbabilities) {
                const t = i * dt;
                const prob0 = state.filterSpecificData.modelProbabilities[0];
                const [x, y] = dataToIMMCanvas(t, prob0);
                if (firstPoint) {
                    this.ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        this.ctx.stroke();

        // Draw model 1 (maneuvering) probability
        this.ctx.strokeStyle = '#f84';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        firstPoint = true;
        for (let i = 0; i < filterStates.length; i++) {
            const state = filterStates[i];
            if (state.filterSpecificData && state.filterSpecificData.modelProbabilities) {
                const t = i * dt;
                const prob1 = state.filterSpecificData.modelProbabilities[1];
                const [x, y] = dataToIMMCanvas(t, prob1);
                if (firstPoint) {
                    this.ctx.moveTo(x, y);
                    firstPoint = false;
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        this.ctx.stroke();

        // Add IMM section labels
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Model Prob.', plotLeft - 50, immTop + immHeight / 2);

        // Add legend for model probabilities
        const legendY = immTop + 10;
        this.ctx.fillStyle = '#4f4';
        this.ctx.fillRect(plotLeft + 10, legendY, 12, 3);
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '10px Arial';
        this.ctx.fillText('CA Low-Noise', plotLeft + 25, legendY + 2);
        
        this.ctx.fillStyle = '#f84';
        this.ctx.fillRect(plotLeft + 90, legendY, 12, 3);
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText('CA High-Noise', plotLeft + 105, legendY + 2);

        // Mark model switches with vertical lines
        let prevActiveModel = null;
        for (let i = 0; i < filterStates.length; i++) {
            const state = filterStates[i];
            if (state.filterSpecificData && state.filterSpecificData.activeModel !== undefined) {
                const currentActiveModel = state.filterSpecificData.activeModel;
                if (prevActiveModel !== null && currentActiveModel !== prevActiveModel) {
                    // Model switch detected
                    const t = i * dt;
                    const x = plotLeft + (t / maxTime) * plotWidth;
                    this.ctx.strokeStyle = '#ff4';
                    this.ctx.lineWidth = 1;
                    this.ctx.globalAlpha = 0.7;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, immTop);
                    this.ctx.lineTo(x, immTop + immHeight);
                    this.ctx.stroke();
                }
                prevActiveModel = currentActiveModel;
            }
        }
    }
}