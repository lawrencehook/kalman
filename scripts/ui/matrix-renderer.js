/**
 * Generic Matrix Renderer
 * Creates HTML for matrix displays that can adapt to any size and configuration
 */

class MatrixRenderer {
    /**
     * Create a matrix display HTML element
     * @param {Object} config - Matrix configuration
     * @param {string} config.title - Display title
     * @param {string} config.tooltip - Tooltip text
     * @param {Array} config.size - [rows, cols]
     * @param {Array} config.elements - Array of {id, row, col} objects
     * @param {string} config.containerId - Optional container ID
     */
    static createMatrix(config) {
        const { title, tooltip, size, elements, containerId } = config;
        const [rows, cols] = size;
        const matrixClass = `matrix-${rows}x${cols}`;
        
        // Create matrix grid elements
        const matrixCells = elements.map(element => 
            `<div class="matrix-cell" id="${element.id}">--</div>`
        ).join('');

        return `
            <div class="matrix-container">
                <div class="matrix-brackets">
                    <div id="${containerId || ''}" class="matrix-grid ${matrixClass}">
                        ${matrixCells}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create a titled matrix display with description
     * @param {Object} config - Matrix configuration with title and description
     */
    static createTitledMatrix(config) {
        const { title, description, size, id } = config;
        const [rows, cols] = size;
        const matrixClass = `matrix-${rows}x${cols}`;

        return `
            <div class="matrix-display">
                <div class="matrix-title">${title}</div>
                <div style="font-size: 9px; color: ${COLORS.TEXT_MUTED}; margin-bottom: 8px;">${description}</div>
                <div class="matrix-container">
                    <div class="matrix-brackets">
                        <div id="${id}" class="matrix-grid ${matrixClass}"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update matrix values in the DOM
     * @param {string} matrixId - The matrix container ID
     * @param {Array} values - 2D array of values
     * @param {number} precision - Number of decimal places (default: 3)
     */
    static updateMatrix(matrixId, values, precision = 3) {
        const container = document.getElementById(matrixId);
        if (!container) return;

        let cells = container.querySelectorAll('.matrix-cell');
        
        // If no cells exist (e.g., system matrices), create them dynamically
        if (cells.length === 0) {
            container.innerHTML = '';
            for (let i = 0; i < values.length; i++) {
                for (let j = 0; j < values[i].length; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'matrix-cell';
                    container.appendChild(cell);
                }
            }
            cells = container.querySelectorAll('.matrix-cell');
        }

        // Update cell values
        let cellIndex = 0;
        for (let i = 0; i < values.length; i++) {
            for (let j = 0; j < values[i].length; j++) {
                if (cellIndex < cells.length) {
                    const value = values[i][j];
                    let displayValue;
                    if (typeof value === 'number') {
                        // Normalize all numbers to consistent width formatting
                        if (Math.abs(value) < 1e-6 && value !== 0) {
                            // Very small numbers: use scientific notation with consistent width
                            displayValue = value.toExponential(1).padStart(8);
                        } else {
                            // All other numbers: use fixed decimal places with consistent width
                            displayValue = value.toFixed(3).padStart(8);
                        }
                    } else {
                        displayValue = '--'.padStart(8);
                    }
                    cells[cellIndex].textContent = displayValue;
                    cellIndex++;
                }
            }
        }
    }

    /**
     * Create CSS classes for a new matrix size if not already defined
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     */
    static ensureMatrixClass(rows, cols) {
        const className = `matrix-${rows}x${cols}`;
        const existingStyle = document.querySelector(`style[data-matrix-class="${className}"]`);
        
        if (!existingStyle) {
            const style = document.createElement('style');
            style.setAttribute('data-matrix-class', className);
            style.textContent = `.${className} { grid-template-columns: repeat(${cols}, 1fr); }`;
            document.head.appendChild(style);
        }
    }
}