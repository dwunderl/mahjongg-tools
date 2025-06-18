const { FIXTURES_DIR, OUTPUT_DIR } = require('../test-utils');
const path = require('path');
const fs = require('fs');
const { compileMTL } = require('../../compile');

// Helper function to get all .mtl files in a directory recursively
function findMTLFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            // Skip node_modules and other common directories
            if (!['node_modules', '.git', '.DS_Store'].includes(file.name)) {
                findMTLFiles(filePath, fileList);
            }
        } else if (file.name.endsWith('.mtl') && !file.name.startsWith('_')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

describe('Hand Template Compilation', () => {
    // Find all MTL files in the fixtures directory
    const mtlFiles = findMTLFiles(FIXTURES_DIR);
    
    if (mtlFiles.length === 0) {
        console.warn('No MTL files found in fixtures directory:', FIXTURES_DIR);
    }
    
    // Test each template file
    mtlFiles.forEach(mtlFilePath => {
        const relativePath = path.relative(FIXTURES_DIR, mtlFilePath);
        const templateName = path.basename(mtlFilePath, '.mtl');
        const expectedPath = path.join(
            path.dirname(mtlFilePath), 
            `expected_${templateName}.json`
        );
        
        test(`compiles ${relativePath}`, async () => {
            // Create a temporary file with a short name
            const tempDir = path.join(__dirname, '__temp__');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const tempFilePath = path.join(tempDir, `${templateName}.mtl`);
            const outputPath = path.join(OUTPUT_DIR, 'hand-templates', `${templateName}.json`);
            
            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            // Copy the source file to the temp file
            fs.copyFileSync(mtlFilePath, tempFilePath);
            
            // Compile the template using the temp file path
            const output = compileMTL(tempFilePath, outputPath);
            
            // Clean up the temp file
            try {
                fs.unlinkSync(tempFilePath);
            } catch (e) {
                console.error('Error cleaning up temp file:', e);
            }
            
            // Basic structure validation
            expect(output).toHaveProperty('templates');
            expect(Array.isArray(output.templates)).toBe(true);
            expect(output.templates.length).toBeGreaterThan(0);
            
            // Get the template - it should be an object with the template properties
            const template = output.templates[0];
            expect(typeof template).toBe('object');
            
            // Check for required fields in metadata
            expect(template).toHaveProperty('metadata');
            expect(template.metadata).toHaveProperty('name');
            expect(template.metadata).toHaveProperty('description');
            expect(template.metadata).toHaveProperty('category');
            
            // Check if we have either metadata.id or catid
            expect(template.metadata.id || template.metadata.catid).toBeDefined();
            
            // Check variations
            const variations = template.variations || [];
            expect(Array.isArray(variations)).toBe(true);
            
            // Look for expected output in the fixtures directory
            const expectedOutputPath = path.join(FIXTURES_DIR, 'hand-templates', 'expected', `${templateName}.json`);
            
            if (fs.existsSync(expectedOutputPath)) {
                const expected = JSON.parse(fs.readFileSync(expectedOutputPath, 'utf8'));
                // Compare the output with the expected result
                expect(output).toEqual(expected);
            } else {
                // If no expected output, log the result for manual verification
                console.log(`No expected output for ${relativePath}, result:`, JSON.stringify(output, null, 2));
                // For now, just log the number of variations
                console.log(`Generated ${variations.length} variations`);
            }
        });
    });

    // Add a test case to ensure we found template files
    test('should find template files', () => {
        expect(mtlFiles.length).toBeGreaterThan(0);
        console.log(`Found MTL files:\n${mtlFiles.map(f => `- ${f}`).join('\n')}`);
    });
});
