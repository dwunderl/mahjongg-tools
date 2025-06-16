const fs = require('fs');
const path = require('path');
const { compileMTL } = require('./compile');

// Directory containing MTL files
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get all MTL files in the templates directory
const mtlFiles = fs.readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.mtl'))
    .map(file => ({
        input: path.join(TEMPLATES_DIR, file),
        output: path.join(OUTPUT_DIR, file.replace(/\.mtl$/, '.json'))
    }));

// Compile each MTL file
console.log(`Found ${mtlFiles.length} MTL files to compile:`);

mtlFiles.forEach(({input, output}) => {
    try {
        console.log(`\nCompiling ${path.basename(input)}...`);
        compileMTL(input, output);
        console.log(`  → Successfully compiled to ${path.relative(process.cwd(), output)}`);
    } catch (error) {
        console.error(`  ❌ Error compiling ${input}:`, error.message);
    }
});

console.log('\nCompilation complete!');
