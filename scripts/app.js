// ================================
// APPLICATION STARTUP
// ================================

function startApplication() {
    const config = { maxTime: 30, dt: 0.05, measurementRate: 0.1 };
    const simulation = new SimulationController(config);
    simulation.start();
}

// Start the application when the page loads
startApplication();