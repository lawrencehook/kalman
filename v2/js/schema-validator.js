/**
 * Generic JSON Schema Validator
 *
 * Loads schema definitions from JSON files and validates data against them
 * This separation allows schema evolution without code changes
 */

class SchemaValidator {
    static #loadedSchemas = new Map();
    static #schemaCache = new Map();

    /**
     * Validates data against a named schema
     * @param {string} schemaName - Name of schema file (without .json)
     * @param {Object} data - Data to validate
     * @returns {Promise<boolean>} - True if valid
     * @throws {Error} - If validation fails
     */
    static async validate(schemaName, data) {
        const schema = await this.loadSchema(schemaName);
        return this._validateAgainstSchema(data, schema);
    }

    /**
     * Synchronous validation (requires schema to be preloaded)
     * @param {string} schemaName - Name of schema
     * @param {Object} data - Data to validate
     * @returns {boolean} - True if valid
     * @throws {Error} - If validation fails or schema not loaded
     */
    static validateSync(schemaName, data) {
        const schema = this.#schemaCache.get(schemaName);
        if (!schema) {
            throw new Error(`Schema '${schemaName}' not loaded. Use loadSchema() first.`);
        }
        return this._validateAgainstSchema(data, schema);
    }

    /**
     * Loads a schema from JSON file
     * @param {string} schemaName - Name of schema file (without .json)
     * @returns {Promise<Object>} - Schema definition
     */
    static async loadSchema(schemaName) {
        if (this.#schemaCache.has(schemaName)) {
            return this.#schemaCache.get(schemaName);
        }

        try {
            const response = await fetch(`schemas/${schemaName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load schema: ${schemaName}`);
            }

            const schema = await response.json();
            this.#schemaCache.set(schemaName, schema);
            return schema;
        } catch (error) {
            throw new Error(`Error loading schema '${schemaName}': ${error.message}`);
        }
    }

    /**
     * Preloads multiple schemas for synchronous validation
     * @param {string[]} schemaNames - Array of schema names to preload
     * @returns {Promise<void>}
     */
    static async preloadSchemas(schemaNames) {
        const promises = schemaNames.map(name => this.loadSchema(name));
        await Promise.all(promises);
    }

    /**
     * Gets list of loaded schemas
     * @returns {string[]} - Array of loaded schema names
     */
    static getLoadedSchemas() {
        return Array.from(this.#schemaCache.keys());
    }

    /**
     * Core validation engine
     * @private
     */
    static _validateAgainstSchema(data, schema) {
        if (typeof data !== 'object' || data === null) {
            throw new Error(`${schema.name}: Expected object, got ${typeof data}`);
        }

        // Check required fields
        for (const requiredField of (schema.required || [])) {
            if (!(requiredField in data)) {
                throw new Error(`${schema.name}: Missing required field '${requiredField}'`);
            }
        }

        // Validate each property
        for (const [field, value] of Object.entries(data)) {
            const propertySchema = schema.properties[field];
            if (!propertySchema) {
                throw new Error(`${schema.name}: Unknown field '${field}'`);
            }

            this._validateProperty(value, propertySchema, `${schema.name}.${field}`);
        }

        return true;
    }

    /**
     * Validates individual property against its schema definition
     * @private
     */
    static _validateProperty(value, propertySchema, fieldPath) {
        // Skip validation for optional fields that are undefined
        if (propertySchema.optional && value === undefined) {
            return;
        }

        const type = propertySchema.type;

        if (type === 'number') {
            if (typeof value !== 'number' || !isFinite(value)) {
                throw new Error(`${fieldPath}: Expected finite number, got ${typeof value}`);
            }
        }
        else if (type === 'string') {
            if (typeof value !== 'string') {
                throw new Error(`${fieldPath}: Expected string, got ${typeof value}`);
            }
        }
        else if (type === 'object') {
            if (typeof value !== 'object' || value === null) {
                throw new Error(`${fieldPath}: Expected object, got ${typeof value}`);
            }
        }
        else if (type === 'array') {
            if (!Array.isArray(value)) {
                throw new Error(`${fieldPath}: Expected array, got ${typeof value}`);
            }

            // Check length constraint
            if (propertySchema.length !== undefined && value.length !== propertySchema.length) {
                throw new Error(`${fieldPath}: Expected array length ${propertySchema.length}, got ${value.length}`);
            }

            // Check element types
            if (propertySchema.elementType) {
                value.forEach((elem, i) => {
                    if (typeof propertySchema.elementType === 'string') {
                        this._validateProperty(elem, { type: propertySchema.elementType }, `${fieldPath}[${i}]`);
                    } else {
                        this._validateProperty(elem, propertySchema.elementType, `${fieldPath}[${i}]`);
                    }
                });
            }
        }
        else if (type === 'matrix') {
            if (!Array.isArray(value)) {
                throw new Error(`${fieldPath}: Expected matrix (array), got ${typeof value}`);
            }

            const [rows, cols] = propertySchema.dimensions || [0, 0];
            if (value.length !== rows) {
                throw new Error(`${fieldPath}: Expected ${rows} rows, got ${value.length}`);
            }

            value.forEach((row, i) => {
                if (!Array.isArray(row) || row.length !== cols) {
                    throw new Error(`${fieldPath}[${i}]: Expected array of length ${cols}`);
                }
                row.forEach((elem, j) => {
                    if (propertySchema.elementType === 'number') {
                        if (typeof elem !== 'number' || !isFinite(elem)) {
                            throw new Error(`${fieldPath}[${i}][${j}]: Expected finite number`);
                        }
                    }
                });
            });
        }
        else {
            throw new Error(`Unknown property type: ${type}`);
        }
    }

    /**
     * Creates a validated data wrapper that throws on access to invalid data
     * @param {Object} data - Data to wrap
     * @param {Function} validator - Validation function
     * @returns {Proxy} - Validated data proxy
     */
    static createValidatedProxy(data, validator) {
        validator(data); // Initial validation

        return new Proxy(data, {
            set(target, property, value) {
                const newData = { ...target, [property]: value };
                validator(newData); // Validate on modification
                target[property] = value;
                return true;
            }
        });
    }

    /**
     * Development mode helper - logs validation errors instead of throwing
     * @param {Function} validationFn - Validation function to wrap
     * @param {any} data - Data to validate
     * @returns {boolean} - True if valid, false if invalid (logged)
     */
    static validateSafe(validationFn, data) {
        try {
            return validationFn(data);
        } catch (error) {
            console.error('Schema Validation Failed:', error.message);
            console.error('Data:', data);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemaValidator;
}