/**
 * Generic Equation Renderer
 * Creates HTML for mathematical equation displays that can adapt to any filter
 */

class EquationRenderer {
    /**
     * Create an equation section
     * @param {Object} config - Equation section configuration
     * @param {string} config.title - Section title
     * @param {Array} config.equations - Array of equation strings (optional)
     * @param {Array} config.variables - Array of {symbol, definition} objects (optional)
     * @param {string} config.id - Optional section ID
     */
    static createEquationSection(config) {
        const { title, equations, variables, id } = config;
        const sectionId = id ? `id="${id}"` : '';

        let content;
        if (variables) {
            // Render compact variable symbols grid
            const variableSymbols = variables.map(variable => 
                `<span class="variable-symbol" data-tooltip="${variable.definition}">${variable.symbol}</span>`
            ).join('');
            content = `<div class="variables-grid">${variableSymbols}</div>`;
        } else if (equations) {
            // Render regular equation lines
            const equationLines = equations.map(equation => 
                `<div class="equation-line">${equation}</div>`
            ).join('');
            content = equationLines;
        } else {
            content = '';
        }

        return `
            <div class="equation-section" ${sectionId}>
                <div class="eq-label">${title}</div>
                ${content}
            </div>
        `;
    }

    /**
     * Create a complete equations display with multiple sections
     * @param {Object} config - Equations configuration
     * @param {string} config.title - Main title
     * @param {string} config.tooltip - Main tooltip
     * @param {Array} config.sections - Array of {title, equations, id} objects
     */
    static createEquationsDisplay(config) {
        const { title, tooltip, sections } = config;

        const equationSections = sections.map(section => 
            this.createEquationSection(section)
        ).join('');

        return `
            <div class="state-section">
                <h3 data-tooltip="${tooltip}">${title}</h3>
                ${equationSections}
            </div>
        `;
    }

    /**
     * Create a system matrices section with equations
     * @param {Object} config - System matrices configuration
     * @param {string} config.title - Main title
     * @param {Array} config.matrices - Array of matrix configurations
     * @param {Object} config.equations - Equations configuration
     */
    static createSystemMatricesSection(config) {
        const { title, matrices, equations } = config;

        // Create matrix displays
        const matrixDisplays = matrices.map(matrix => 
            MatrixRenderer.createTitledMatrix(matrix)
        ).join('');

        // Create equations display
        const equationsHtml = equations ? this.createEquationsDisplay(equations) : '';

        return `
            <div class="system-matrices">
                <div class="toggle-section" id="toggleMatrices">
                    ${title} ▼
                </div>
                <div class="matrices-section" id="matricesSection">
                    <div class="matrices-grid">
                        ${matrixDisplays}
                    </div>
                    ${equationsHtml}
                </div>
            </div>
        `;
    }

    /**
     * Toggle the visibility of the matrices section
     * @param {string} sectionId - The matrices section ID (default: 'matricesSection')
     * @param {string} toggleId - The toggle button ID (default: 'toggleMatrices')
     * @param {Function} onToggle - Optional callback when visibility changes (receives isVisible)
     */
    static setupMatricesToggle(sectionId = 'matricesSection', toggleId = 'toggleMatrices', onToggle = null) {
        const toggleButton = document.getElementById(toggleId);
        const matricesSection = document.getElementById(sectionId);

        if (toggleButton && matricesSection) {
            toggleButton.addEventListener('click', () => {
                const isVisible = matricesSection.classList.contains('visible');
                
                if (isVisible) {
                    matricesSection.classList.remove('visible');
                    toggleButton.textContent = toggleButton.textContent.replace('▲', '▼');
                } else {
                    matricesSection.classList.add('visible');
                    toggleButton.textContent = toggleButton.textContent.replace('▼', '▲');
                }
                
                // Call the callback with the new visibility state
                if (onToggle) {
                    onToggle(!isVisible);
                }
            });
        }
    }
}