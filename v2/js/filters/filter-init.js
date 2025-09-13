/**
 * FilterInit - Initialize and register all filter types
 * This file should be loaded after all individual filter files
 */
(function() {
    // Register all available filter types (in display order)
    FilterRegistry.register('ca', CAFilter);

    // Create enum-like constants for easy access
    window.FILTER_TYPES = FilterRegistry.getEnum();

    console.log('📋 Filter Registry initialized with', FilterRegistry.getAll().length, 'filters:',
        FilterRegistry.getAll().map(f => f.displayName).join(', '));
})();