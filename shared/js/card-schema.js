// Schema for Mahjongg card definitions

const CardSchema = {
    // The complete schema for a Mahjongg card
    schema: {
        type: 'object',
        required: ['version', 'name', 'hands'],
        properties: {
            version: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            hands: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['id', 'name', 'sections'],
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string' },
                        sections: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['name', 'hands'],
                                properties: {
                                    name: { type: 'string' },
                                    description: { type: 'string' },
                                    hands: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            required: ['name', 'tiles'],
                                            properties: {
                                                name: { type: 'string' },
                                                description: { type: 'string' },
                                                tiles: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        required: ['type'],
                                                        properties: {
                                                            type: { 
                                                                type: 'string',
                                                                enum: ['like', 'pung', 'kong', 'kongExposed', 'quint', 'sextet', 'septet', 'octet', 'pair', 'single']
                                                            },
                                                            count: { type: 'number', minimum: 1 },
                                                            suit: { type: 'string' },
                                                            value: { type: 'string' },
                                                            description: { type: 'string' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    // Create a new, empty card definition
    createEmptyCard: function() {
        return {
            version: '2025',
            name: 'Custom Mahjongg Card',
            description: 'A custom Mahjongg card definition',
            hands: []
        };
    },

    // Validate a card definition against the schema
    validate: function(cardData) {
        // This is a simplified validation - in a real app, you might want to use a library like AJV
        if (!cardData) {
            return { valid: false, error: 'No card data provided' };
        }

        if (!cardData.version || typeof cardData.version !== 'string') {
            return { valid: false, error: 'Invalid or missing version' };
        }

        if (!cardData.name || typeof cardData.name !== 'string') {
            return { valid: false, error: 'Invalid or missing name' };
        }

        if (!Array.isArray(cardData.hands)) {
            return { valid: false, error: 'Hands must be an array' };
        }

        // More detailed validation would go here...

        
        return { valid: true };
    }
};

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CardSchema;
}
