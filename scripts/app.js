// ================================
// APPLICATION STARTUP
// ================================

function startApplication() {
    // Initialize the Filter UI Manager
    const filterUIManager = new FilterUIManager();
    filterUIManager.initialize();
    
    // Initialize custom dropdowns
    initializeCustomDropdowns();
    
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
    
    // Connect dropdown events to simulation
    connectDropdownsToSimulation(simulation);
    
    simulation.start();
}

// Global dropdown instances
let filterDropdown = null;
let trajectoryDropdown = null;

function initializeCustomDropdowns() {
    // Initialize filter dropdown
    let availableFilters = [];
    try {
        availableFilters = FilterRegistry.getAvailableFilters().map(filter => ({
            value: filter.value,
            label: filter.label,
            description: filter.description
        }));
        
        filterDropdown = new CustomDropdown('filter-dropdown-container', {
            placeholder: 'Select Filter...',
            items: availableFilters,
            onSelect: (item) => {
                // Handle filter selection - will be connected later
                console.log('Filter selected:', item.value);
            }
        });
    } catch (error) {
        console.error('Failed to initialize filter dropdown:', error);
    }
    
    // Initialize trajectory dropdown
    const trajectoryOptions = [
        { value: 'constantacceleration', label: 'Constant Acceleration', description: 'Linear motion with constant acceleration' },
        { value: 'constantvelocity', label: 'Constant Velocity', description: 'Linear motion with constant speed' },
        { value: 'sinewave', label: 'Sine Wave', description: 'Sinusoidal trajectory pattern' },
        { value: 'parabolic', label: 'Parabolic Arc', description: 'Parabolic motion path' },
        { value: 'circle', label: 'Circle', description: 'Circular trajectory path' },
        { value: 'infinity', label: 'Infinity (∞)', description: 'Figure-eight infinity shape' },
        { value: 'star', label: 'Star', description: 'Star-shaped trajectory pattern' }
    ];
    
    trajectoryDropdown = new CustomDropdown('trajectory-dropdown-container', {
        placeholder: 'Select Trajectory...',
        items: trajectoryOptions,
        onSelect: (item) => {
            // Handle trajectory selection - will be connected later
            console.log('Trajectory selected:', item.value);
        }
    });
    
    // Set default selections
    if (filterDropdown && availableFilters.length > 0) {
        filterDropdown.setSelectedValue(availableFilters[0].value);
    }
    
    trajectoryDropdown.setSelectedValue('circle');
}

function connectDropdownsToSimulation(simulation) {
    // Connect filter dropdown to simulation
    if (filterDropdown) {
        filterDropdown.options.onSelect = (item) => {
            simulation.setFilterType(item.value);
        };
    }
    
    // Connect trajectory dropdown to simulation
    if (trajectoryDropdown) {
        trajectoryDropdown.options.onSelect = (item) => {
            simulation.setTrajectoryType(item.value);
        };
    }
}

function getSelectedFilterKey() {
    try {
        // Get from custom dropdown if available
        if (filterDropdown) {
            return filterDropdown.getSelectedValue();
        }
        
        // Fallback to first available filter
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