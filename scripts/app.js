// ================================
// APPLICATION STARTUP
// ================================

function startApplication() {
    // Populate filter dropdown dynamically
    populateFilterDropdown();
    
    // Initialize the Filter UI Manager
    const filterUIManager = new FilterUIManager();
    filterUIManager.initialize();
    
    const config = { 
        maxTime: 30, 
        dt: 0.05, 
        measurementRate: 0.1,
        filterUIManager: filterUIManager 
    };
    const simulation = new SimulationController(config);
    
    // Load the default filter UI
    const defaultFilterKey = getDefaultFilterKey();
    filterUIManager.loadFilterUI(defaultFilterKey, null);
    
    // Set up event handlers with matrix toggle callback
    filterUIManager.setupEventHandlers((isVisible) => simulation.setMatrixVisibility(isVisible));
    
    simulation.start();
}

function populateFilterDropdown() {
    const filterSelect = document.getElementById('filterSelect');
    if (!filterSelect) return;
    
    try {
        const availableFilters = FilterRegistry.getAvailableFilters();
        
        // Clear existing options
        filterSelect.innerHTML = '';
        
        // Add filter options
        availableFilters.forEach((filter, index) => {
            const option = document.createElement('option');
            option.value = filter.value;
            option.textContent = filter.label;
            option.title = filter.description;
            
            // Select first option as default
            if (index === 0) {
                option.selected = true;
            }
            
            filterSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to populate filter dropdown:', error);
        // Fallback option
        const option = document.createElement('option');
        option.value = 'kalman-2d';
        option.textContent = 'Kalman (CA 6-state)';
        option.selected = true;
        filterSelect.appendChild(option);
    }
}

function getDefaultFilterKey() {
    try {
        const availableFilters = FilterRegistry.getAvailableFilters();
        return availableFilters.length > 0 ? availableFilters[0].value : 'kalman-2d';
    } catch (error) {
        console.error('Failed to get default filter:', error);
        return 'kalman-2d';
    }
}

// Start the application when the page loads
startApplication();