const fs = require('fs');
const path = require('path');
const { compileMTL } = require('./clean-compiler');

// Directory containing the production templates
const TEMPLATES_DIR = path.join(__dirname, 'templates');

// Output directory for compiled templates
const OUTPUT_DIR = path.join(__dirname, 'compiled-templates');

// Enable debug logging
process.env.DEBUG = 'true';

console.log('Current working directory:', process.cwd());
console.log('Templates directory:', TEMPLATES_DIR);
console.log('Output directory:', OUTPUT_DIR);

// Ensure templates directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
    console.error(`Templates directory not found: ${TEMPLATES_DIR}`);
    process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`Creating output directory: ${OUTPUT_DIR}`);
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get all .mtl files in the templates directory
let templateFiles = [];
try {
    templateFiles = fs.readdirSync(TEMPLATES_DIR)
        .filter(file => file.endsWith('.mtl'))
        .map(file => ({
            name: file,
            path: path.join(TEMPLATES_DIR, file)
        }));
    
    console.log(`\nFound ${templateFiles.length} template files in ${TEMPLATES_DIR}:`);
    templateFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name}`);
    });
} catch (error) {
    console.error(`Error reading templates directory: ${error.message}`);
    process.exit(1);
}

if (templateFiles.length === 0) {
    console.error('No template files found in the templates directory.');
    process.exit(1);
}

// Compile each template
let successCount = 0;
let errorCount = 0;

console.log('\nStarting compilation...');
console.log('='.repeat(80));

for (const { name, path: templatePath } of templateFiles) {
    try {
        const outputFile = path.join(OUTPUT_DIR, `${path.basename(name, '.mtl')}.json`);
        
        console.log(`\n[${new Date().toISOString()}] Compiling: ${name}`);
        console.log(`Input:  ${templatePath}`);
        console.log(`Output: ${outputFile}`);
        console.log('-'.repeat(80));
        
        // Read the source file
        const source = fs.readFileSync(templatePath, 'utf8');
        console.log('Source content:');
        console.log('-' + '-'.repeat(78));
        console.log(source);
        console.log('-' + '-'.repeat(78));
        
        // Compile the template
        console.log('\nCompiling...');
        
        // Create lexer and tokenize
        const { MTLLexer, MTLParser } = require('./clean-compiler');
        const lexer = new MTLLexer(source);
        const tokens = lexer.tokenize();
        
        console.log('\nTokens:');
        tokens.forEach((t, i) => console.log(`${i}: ${JSON.stringify(t)}`));
        
        // Parse the tokens
        const parser = new MTLParser(tokens, lexer);
        const result = parser.parse();
        
        // Display the result
        console.log('\n✅ Compilation successful! Result:');
        const resultStr = JSON.stringify(result, null, 2);
        console.log(resultStr);
        
        // Write the output file
        fs.writeFileSync(outputFile, resultStr);
        console.log(`\n📝 Output written to: ${outputFile}`);
        
        successCount++;
        
    } catch (error) {
        console.error(`\n❌ Error compiling ${name}:`);
        console.error(error);
        errorCount++;
    }
    
    console.log('='.repeat(80));
}

// Summary
console.log('\nCompilation Summary:');
console.log('='.repeat(80));
console.log(`Total templates: ${templateFiles.length}`);
console.log(`✅ Successfully compiled: ${successCount}`);
console.log(`❌ Failed: ${errorCount}`);
console.log('\nCompilation complete.');

if (errorCount > 0) {
    process.exit(1);
}
