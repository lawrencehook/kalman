// ================================
// APPLICATION STARTUP
// ================================

function startApplication() {
    // Initialize the Filter UI Manager first
    const filterUIManager = new FilterUIManager();
    filterUIManager.initialize();
    
    const config = { 
        maxTime: 30, 
        dt: 0.05, 
        measurementRate: 0.1,
        filterUIManager: filterUIManager 
    };
    const simulation = new SimulationController(config);
    
    // Load the default filter UI (Kalman 2D)
    filterUIManager.loadFilterUI('kalman-filter-2d', null);
    
    // Set up event handlers with matrix toggle callback
    filterUIManager.setupEventHandlers((isVisible) => simulation.setMatrixVisibility(isVisible));
    
    simulation.start();
}

// Start the application when the page loads
startApplication();