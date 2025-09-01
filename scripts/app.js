// ================================
// APPLICATION STARTUP
// ================================

function startApplication() {
    // Populate filter dropdown dynamically
    populateFilterDropdown();
    
    // Initialize the Filter UI Manager
    const filterUIManager = new FilterUIManager();
    filterUIManager.initialize();
    
    // Get the actual selected filter from dropdown after population
    const selectedFilterKey = getSelectedFilterKey();
    
    const config = { 
        maxTime: 30, 
        dt: 0.05, 
        measurementRate: 0.1,
        filterUIManager: filterUIManager,
        initialFilterType: selectedFilterKey
    };
    const simulation = new SimulationController(config);
    
    // Load the selected filter UI
    filterUIManager.loadFilterUI(selectedFilterKey, null);
    
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
        // No fallback - let the system handle the error gracefully
    }
}

function getSelectedFilterKey() {
    try {
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect && filterSelect.value) {
            return filterSelect.value;
        }
        
        // Fallback to first available filter if dropdown not populated yet
        const availableFilters = FilterRegistry.getAvailableFilters();
        return availableFilters.length > 0 ? availableFilters[0].value : null;
    } catch (error) {
        console.error('Failed to get selected filter:', error);
        const availableFilters = FilterRegistry.getAvailableFilters();
        return availableFilters.length > 0 ? availableFilters[0].value : null;
    }
}

// Start the application when the page loads
startApplication();