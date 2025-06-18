const { compileFixture, loadExpectedOutput } = require('../test-utils');
const path = require('path');
const fs = require('fs');

describe('Template Integration Tests', () => {
    test('compiles simple template', () => {
        const fixtureName = 'simple';
        const { output } = compileFixture(fixtureName);
        
        // Verify basic structure
        expect(output).toHaveProperty('templates');
        expect(Array.isArray(output.templates)).toBe(true);
        expect(output.templates.length).toBe(1);
        
        const template = output.templates[0];
        
        // Verify metadata
        expect(template).toMatchObject({
            category: 'Test',
            id: 'test1',
            name: 'Simple Test Template',
            description: 'A simple test template'
        });
        
        // Verify variations
        expect(template).toHaveProperty('variations');
        expect(Array.isArray(template.variations)).toBe(true);
        
        // Should generate 3 variations (one for each suit)
        expect(template.variations.length).toBe(3);
        
        // Verify each variation has the expected structure
        template.variations.forEach(variation => {
            expect(variation).toHaveProperty('tiles');
            expect(Array.isArray(variation.tiles)).toBe(true);
            expect(variation).toHaveProperty('name');
            expect(variation).toHaveProperty('description');
            
            // Should have exactly one pair
            expect(variation.tiles.length).toBe(2);
            expect(variation.tiles[0]).toBe(variation.tiles[1]); // Should be a pair
        });
    });
});
