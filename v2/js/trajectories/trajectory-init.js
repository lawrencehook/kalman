/**
 * TrajectoryInit - Initialize and register all trajectory types
 * This file should be loaded after all individual trajectory files
 */
(function() {
    // Register all available trajectory types
    TrajectoryRegistry.register('line', LineTrajectory);
    TrajectoryRegistry.register('circle', CircleTrajectory);

    // Create enum-like constants for easy access
    window.TRAJECTORY_TYPES = TrajectoryRegistry.getEnum();

    console.log('📋 Trajectory Registry initialized:',
        TrajectoryRegistry.getAll().map(t => t.displayName).join(', '));
})();