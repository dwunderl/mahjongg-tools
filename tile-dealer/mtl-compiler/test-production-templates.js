const fs = require('fs');
const path = require('path');
const { compileMTL } = require('./clean-compiler');

// Paths
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get all .mtl files in the templates directory
const templateFiles = fs.readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.mtl'));

if (templateFiles.length === 0) {
    console.error('No template files found in', TEMPLATES_DIR);
    process.exit(1);
}

console.log(`Found ${templateFiles.length} template files to compile.`);

// Compile each template
let successCount = 0;
const errors = [];

templateFiles.forEach(templateFile => {
    try {
        const inputPath = path.join(TEMPLATES_DIR, templateFile);
        const outputFile = `${path.basename(templateFile, '.mtl')}.json`;
        const outputPath = path.join(OUTPUT_DIR, outputFile);
        
        console.log(`\nCompiling ${templateFile}...`);
        
        // Compile the template
        const ast = compileMTL(inputPath, outputPath);
        
        // Basic validation
        if (!ast.metadata || !ast.variations) {
            throw new Error('Invalid AST: missing metadata or variations');
        }
        
        console.log(`  ✓ Success! Generated ${outputPath}`);
        console.log(`  - Metadata:`, Object.keys(ast.metadata).join(', '));
        console.log(`  - Variations: ${ast.variations.length}`);
        
        successCount++;
    } catch (error) {
        console.error(`  ✗ Error compiling ${templateFile}:`, error.message);
        errors.push({
            file: templateFile,
            error: error.message
        });
    }
});

// Print summary
console.log('\n=== Compilation Summary ===');
console.log(`Templates: ${templateFiles.length}`);
console.log(`Success: ${successCount}`);
console.log(`Failed: ${errors.length}`);

if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.file}: ${err.error}`);
    });
    process.exit(1);
}

console.log('\nAll templates compiled successfully!');
