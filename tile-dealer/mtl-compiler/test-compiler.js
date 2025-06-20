const { compileMTL } = require('./clean-compiler');
const path = require('path');

// Test with a production template
const inputFile = path.join(__dirname, 'templates', 'like-kong-kong-pair.mtl');
const outputFile = path.join(__dirname, 'output', 'like-kong-kong-pair.json');

try {
    console.log(`Compiling ${inputFile}...`);
    const ast = compileMTL(inputFile, outputFile);
    console.log('Compilation successful!');
    console.log(`Output written to: ${outputFile}`);
    console.log('Variations generated:', ast.variations.length);
} catch (error) {
    console.error('Error during compilation:', error);
    process.exit(1);
}
