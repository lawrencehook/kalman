/**
 * TrajectoryInit - Initialize and register all trajectory types
 * This file should be loaded after all individual trajectory files
 */
(function() {
    // Register all available trajectory types (in display order)
    TrajectoryRegistry.register('line', LineTrajectory);
    TrajectoryRegistry.register('circle', CircleTrajectory);
    TrajectoryRegistry.register('figure8', Figure8Trajectory);
    TrajectoryRegistry.register('parabolic', ParabolicTrajectory);
    TrajectoryRegistry.register('stationary', StationaryTrajectory);
    TrajectoryRegistry.register('sine', SineTrajectory);
    TrajectoryRegistry.register('square', SquareTrajectory);
    TrajectoryRegistry.register('spiral', SpiralTrajectory);
    TrajectoryRegistry.register('randomwalk', RandomWalkTrajectory);
    TrajectoryRegistry.register('stopgo', StopGoTrajectory);
    TrajectoryRegistry.register('zigzag', ZigzagTrajectory);
    TrajectoryRegistry.register('orbitdecay', OrbitDecayTrajectory);
    TrajectoryRegistry.register('acceleration', AccelerationTrajectory);
    TrajectoryRegistry.register('uturn', UTurnTrajectory);
    TrajectoryRegistry.register('multispeed', MultiSpeedTrajectory);
    TrajectoryRegistry.register('cloverleaf', CloverleafTrajectory);

    // Create enum-like constants for easy access
    window.TRAJECTORY_TYPES = TrajectoryRegistry.getEnum();

    console.log('📋 Trajectory Registry initialized with', TrajectoryRegistry.getAll().length, 'trajectories:',
        TrajectoryRegistry.getAll().map(t => t.displayName).join(', '));
})();