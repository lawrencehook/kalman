/**
 * Generic State Renderer
 * Creates HTML for state vector displays and metrics that can adapt to any filter
 */

class StateRenderer {
    /**
     * Create a state vector display
     * @param {Object} config - State vector configuration
     * @param {string} config.title - Section title
     * @param {string} config.tooltip - Section tooltip
     * @param {Array} config.dimensions - Array of {label, id, tooltip} objects
     */
    static createStateVector(config) {
        const { title, tooltip, dimensions } = config;

        const stateRows = dimensions.map(dim => `
            <div class="state-row">
                <span class="state-label" data-tooltip="${dim.tooltip}">${dim.label}:</span>
                <span class="state-value" id="${dim.id}">--</span>
            </div>
        `).join('');

        return `
            <div class="state-section">
                <h3 data-tooltip="${tooltip}">${title}</h3>
                ${stateRows}
            </div>
        `;
    }

    /**
     * Create a metrics display section
     * @param {Object} config - Metrics configuration
     * @param {string} config.title - Section title
     * @param {string} config.tooltip - Section tooltip
     * @param {Array} config.metrics - Array of {label, id, tooltip} objects
     */
    static createMetricsSection(config) {
        const { title, tooltip, metrics } = config;

        const metricRows = metrics.map(metric => `
            <div class="state-row">
                <span class="state-label" data-tooltip="${metric.tooltip}">${metric.label}:</span>
                <span class="state-value" id="${metric.id}">--</span>
            </div>
        `).join('');

        return `
            <div class="state-section">
                <h3 data-tooltip="${tooltip}">${title}</h3>
                ${metricRows}
            </div>
        `;
    }

    /**
     * Create a matrix section (for covariance, innovation, etc.)
     * @param {Object} config - Matrix section configuration
     * @param {string} config.title - Section title
     * @param {string} config.tooltip - Section tooltip
     * @param {Array} config.size - [rows, cols]
     * @param {Array} config.elements - Array of {id, row, col} objects
     */
    static createMatrixSection(config) {
        const { title, tooltip } = config;
        const matrixHtml = MatrixRenderer.createMatrix(config);

        return `
            <div class="state-section">
                <h3 data-tooltip="${tooltip}">${title}</h3>
                ${matrixHtml}
            </div>
        `;
    }

    /**
     * Update a state value in the DOM
     * @param {string} elementId - The element ID
     * @param {*} value - The value to display
     * @param {number} precision - Number of decimal places for numbers
     */
    static updateStateValue(elementId, value, precision = 2) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let displayValue;
        if (typeof value === 'number') {
            if (isNaN(value)) {
                displayValue = '--'.padStart(8);
            } else if (Math.abs(value) < 1e-6 && value !== 0) {
                // Very small numbers: use scientific notation with consistent width
                displayValue = value.toExponential(1).padStart(8);
            } else {
                // All other numbers: use fixed decimal places with consistent width
                displayValue = value.toFixed(3).padStart(8);
            }
        } else {
            displayValue = (value || '--').toString().padStart(8);
        }

        element.textContent = displayValue;
    }

    /**
     * Update multiple state values at once
     * @param {Object} values - Object with elementId: value pairs
     * @param {number} precision - Number of decimal places for numbers
     */
    static updateStateValues(values, precision = 2) {
        Object.entries(values).forEach(([elementId, value]) => {
            this.updateStateValue(elementId, value, precision);
        });
    }

    /**
     * Set inactive state for elements (grayed out during bootstrap)
     * @param {Array} elementIds - Array of element IDs to mark as inactive
     * @param {boolean} inactive - Whether to mark as inactive
     */
    static setInactiveState(elementIds, inactive = true) {
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (inactive) {
                    element.classList.add('inactive');
                } else {
                    element.classList.remove('inactive');
                }
            }
        });
    }
}