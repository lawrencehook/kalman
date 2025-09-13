/**
 * Test cases for JSON Schema Validator
 * Run in browser console to verify schema enforcement
 */

// Test data examples
const validTrajectoryPoint = {
    time: 0.05,
    position: [10.5, 20.3],
    velocity: [1.2, -0.8],
    acceleration: [0.1, 0.05]
};

const validFilterInput = {
    measurement: [10.2, 20.1],
    timestamp: 0.05,
    measurementNoise: 15.0
};

const validFilterOutput = {
    estimate: [10.3, 20.2],
    covariance: [[4.2, 0.1], [0.1, 4.8]],
    innovation: [0.1, -0.1],
    confidence: 0.95
};

const validVizData = {
    groundTruth: [[10, 20], [11, 21], [12, 22]],
    measurements: [[10.1, 20.2], [11.1, 21.1]],
    estimates: [[10.05, 20.1], [11.02, 21.05]],
    currentTime: 0.10
};

const validConfig = {
    dt: 0.05,
    measurementNoise: 15.0,
    processNoise: 1.0,
    trajectoryType: "circle",
    filterType: "kalman"
};

// Test runner - async version that loads schemas
async function runSchemaTests() {
    console.log("🧪 Running JSON Schema Validation Tests...\n");

    try {
        // Preload all schemas
        console.log("📥 Loading schemas...");
        await SchemaValidator.preloadSchemas([
            'trajectory-point', 'filter-input', 'filter-output', 'viz-data', 'config'
        ]);
        console.log(`✅ Loaded schemas: ${SchemaValidator.getLoadedSchemas().join(', ')}\n`);

        // Test valid cases
        console.log("✅ Testing valid data:");
        await testValid("trajectory-point", validTrajectoryPoint);
        await testValid("filter-input", validFilterInput);
        await testValid("filter-output", validFilterOutput);
        await testValid("viz-data", validVizData);
        await testValid("config", validConfig);

        // Test invalid cases
        console.log("\n❌ Testing invalid data:");
        await testInvalid("TrajectoryPoint missing time", "trajectory-point", { position: [1, 2] });

        await testInvalid("FilterInput bad measurement array", "filter-input", {
            measurement: [10.2], // Should be length 2
            timestamp: 0.05,
            measurementNoise: 15.0
        });

        await testInvalid("FilterOutput bad covariance matrix", "filter-output", {
            estimate: [10, 20],
            covariance: [[1, 2, 3], [4, 5]] // Should be 2x2
        });

        await testInvalid("VizData wrong array element type", "viz-data", {
            groundTruth: [[10, "invalid"], [11, 21]], // String in number array
            measurements: [],
            estimates: [],
            currentTime: 0.05
        });

        console.log("\n🎉 JSON Schema validation tests complete!");

    } catch (error) {
        console.error("❌ Test setup failed:", error);
    }
}

async function testValid(schemaName, data) {
    try {
        const result = await SchemaValidator.validate(schemaName, data);
        console.log(`  ✅ ${schemaName}: ${result === true ? 'PASS' : 'UNEXPECTED'}`);
    } catch (error) {
        console.log(`  ❌ ${schemaName}: FAIL - ${error.message}`);
    }
}

async function testInvalid(name, schemaName, data) {
    try {
        await SchemaValidator.validate(schemaName, data);
        console.log(`  ❌ ${name}: FAIL - Should have thrown error`);
    } catch (error) {
        console.log(`  ✅ ${name}: PASS - ${error.message}`);
    }
}

// Synchronous test runner (for preloaded schemas)
function runSyncTests() {
    console.log("⚡ Running synchronous validation tests...\n");

    try {
        console.log("✅ Testing sync validation:");
        console.log(`  ✅ trajectory-point: ${SchemaValidator.validateSync('trajectory-point', validTrajectoryPoint)}`);
        console.log(`  ✅ filter-input: ${SchemaValidator.validateSync('filter-input', validFilterInput)}`);
        console.log(`  ✅ filter-output: ${SchemaValidator.validateSync('filter-output', validFilterOutput)}`);

        console.log("\n🎉 Synchronous tests complete!");
    } catch (error) {
        console.error("❌ Sync test failed:", error.message);
    }
}