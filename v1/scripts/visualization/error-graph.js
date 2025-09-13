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

    draw(data, filterType = null) {
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
        
        // Check if any filter states contain additional plottable data
        if (filterStates) {
            filterStates.forEach(state => {
                if (state && state.additionalPlotData) {
                    state.additionalPlotData.forEach(plotData => {
                        if (plotData.value != null && Number.isFinite(plotData.value)) {
                            maxError = Math.max(maxError, plotData.value);
                        }
                    });
                }
            });
        }
        
        // Use adaptive scaling with a small minimum to avoid zero scale  
        maxError = Math.max(maxError, 0.1); // Minimum scale of 0.1 pixel
        
        // Add 10% padding to the top for better visualization
        maxError = maxError * 1.1;
        
        console.log('Error graph max value:', maxError); // Debug log

        // Draw axes
        this.ctx.strokeStyle = COLORS.AXES;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        // Y axis
        this.ctx.moveTo(plotLeft, plotTop);
        this.ctx.lineTo(plotLeft, plotTop + plotHeight);
        // X axis
        this.ctx.lineTo(plotLeft + plotWidth, plotTop + plotHeight);
        this.ctx.stroke();

        // Y axis labels
        this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
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
                this.ctx.strokeStyle = COLORS.GRID_MAJOR;
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
                this.ctx.strokeStyle = COLORS.GRID_MAJOR;
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(x, plotTop);
                this.ctx.lineTo(x, plotTop + plotHeight);
                this.ctx.stroke();
            }
        }

        // Time axis label - moved to far left
        this.ctx.fillStyle = COLORS.TEXT_ACCENT;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Time (seconds)', plotLeft, this.canvas.height - 15);

        this.ctx.save();
        this.ctx.translate(27, plotTop + plotHeight / 2); // Moved 7px further from edge
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Position Error (pixels)', 0, 0);
        this.ctx.restore();

        // Draw zones where actual error exceeds confidence bound
        this.ctx.fillStyle = 'rgba(255, 68, 68, 0.2)'; // Light red background
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
        this.ctx.strokeStyle = COLORS.CONFIDENCE_BOUNDS;
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
        this.ctx.strokeStyle = COLORS.ERROR_ACTUAL;
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

        // Draw additional filter-specific plot data if available
        if (filterStates) {
            // Group plot data by series
            const plotSeries = {};
            
            filterStates.forEach((state, i) => {
                if (state && state.additionalPlotData) {
                    state.additionalPlotData.forEach(plotData => {
                        const seriesKey = plotData.series || 'default';
                        if (!plotSeries[seriesKey]) {
                            plotSeries[seriesKey] = {
                                points: [],
                                color: plotData.color || COLORS.DEFAULT,
                                lineWidth: plotData.lineWidth || 2,
                                alpha: plotData.alpha || 0.7
                            };
                        }
                        
                        if (plotData.value != null && Number.isFinite(plotData.value)) {
                            const t = i * dt;
                            plotSeries[seriesKey].points.push({ t, value: plotData.value });
                        }
                    });
                }
            });
            
            // Draw each series
            Object.values(plotSeries).forEach(series => {
                if (series.points.length > 0) {
                    this.ctx.strokeStyle = series.color;
                    this.ctx.lineWidth = series.lineWidth;
                    this.ctx.globalAlpha = series.alpha;
                    this.ctx.beginPath();
                    
                    let firstPoint = true;
                    series.points.forEach(point => {
                        const [x, y] = dataToCanvas(point.t, point.value);
                        if (firstPoint) {
                            this.ctx.moveTo(x, y);
                            firstPoint = false;
                        } else {
                            this.ctx.lineTo(x, y);
                        }
                    });
                    
                    this.ctx.stroke();
                }
            });
        }

        // Draw current time indicator
        const currentTimeX = plotLeft + (currentTime / maxTime) * plotWidth;
        this.ctx.strokeStyle = COLORS.CURRENT_TIME;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(currentTimeX, plotTop);
        this.ctx.lineTo(currentTimeX, plotTop + plotHeight);
        this.ctx.stroke();

        // Draw legend in bottom right using filter-supplied configuration
        this.drawLegend(plotLeft, plotTop, plotWidth, plotHeight, filterType);

        // Draw filter-specific information if available
        if (filterStates && filterStates.length > 0 && filterStates[0].filterSpecificData && filterStates[0].filterSpecificData.modelProbabilities) {
            this.drawModelProbabilities(filterStates, plotLeft, plotTop, plotWidth, plotHeight, maxTime, dt);
        }

        this.ctx.restore();
    }

    drawLegend(plotLeft, plotTop, plotWidth, plotHeight, filterType) {
        // Get legend items from filter registry
        let legendItems;
        if (filterType && typeof FilterRegistry !== 'undefined') {
            legendItems = FilterRegistry.getErrorGraphLegend(filterType);
        } else {
            // Fallback to default legend
            legendItems = [
                { color: COLORS.ERROR_ACTUAL, width: 12, height: 2, label: 'Actual Error' },
                { color: COLORS.CONFIDENCE_BOUNDS, width: 12, height: 2, label: '95% Confidence' },
                { color: COLORS.CURRENT_TIME, width: 2, height: 12, label: 'Current Time' }
            ];
        }

        // Position legend horizontally at bottom of plot area
        // Calculate available space after "Time (seconds)" label
        const timeTextWidth = this.ctx.measureText('Time (seconds)').width + 30; // Add more padding
        const legendStartX = plotLeft + timeTextWidth;
        const availableWidth = plotWidth - timeTextWidth - 20; // Reserve space at right edge
        const legendY = this.canvas.height - 15; // Same y position as time label
        
        this.ctx.font = '10px Arial'; // Slightly smaller font
        this.ctx.textBaseline = 'middle';
        
        // Calculate total width needed for all legend items
        let totalItemWidth = 0;
        const itemWidths = [];
        legendItems.forEach((item) => {
            const textWidth = this.ctx.measureText(item.label).width;
            const itemWidth = item.width + 5 + textWidth + 15; // icon + gap + text + spacing
            itemWidths.push(itemWidth);
            totalItemWidth += itemWidth;
        });
        
        // Use horizontal layout with maximum 2 rows
        const maxItemsPerRow = Math.ceil(legendItems.length / 2); // Split into at most 2 rows
        const rowHeight = 12;
        const baseY = this.canvas.height - 30; // Start higher to accommodate 2 rows
        
        for (let i = 0; i < legendItems.length; i++) {
            const item = legendItems[i];
            const row = Math.floor(i / maxItemsPerRow);
            const col = i % maxItemsPerRow;
            
            // Calculate position for this item
            const itemY = baseY + (row * rowHeight);
            const itemX = legendStartX + (col * (availableWidth / maxItemsPerRow));
            
            // Draw color indicator
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(itemX, itemY - item.height / 2, item.width, item.height);
            
            // Draw label
            this.ctx.fillStyle = COLORS.TEXT_PRIMARY;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(item.label, itemX + item.width + 5, itemY);
        }
    }

    drawModelProbabilities(filterStates, plotLeft, plotTop, plotWidth, plotHeight, maxTime, dt) {
        // Draw model probability traces in the bottom portion of the graph
        const immHeight = Math.min(60, plotHeight * 0.3); // Use bottom 30% or max 60px
        const immTop = plotTop + plotHeight - immHeight;
        
        // Draw separator line
        this.ctx.strokeStyle = COLORS.AXES;
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
        this.ctx.strokeStyle = COLORS.SUCCESS;
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
        this.ctx.strokeStyle = COLORS.WARNING;
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
        this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Model Prob.', plotLeft - 50, immTop + immHeight / 2);

        // Add legend for model probabilities
        const legendY = immTop + 10;
        this.ctx.fillStyle = COLORS.SUCCESS;
        this.ctx.fillRect(plotLeft + 10, legendY, 12, 3);
        this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
        this.ctx.font = '10px Arial';
        this.ctx.fillText('CA Low-Noise', plotLeft + 25, legendY + 2);
        
        this.ctx.fillStyle = COLORS.WARNING;
        this.ctx.fillRect(plotLeft + 90, legendY, 12, 3);
        this.ctx.fillStyle = COLORS.TEXT_SECONDARY;
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