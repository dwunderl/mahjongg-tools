const path = require('path');
const fs = require('fs');
const { compileMTL } = require('../compile');

const FIXTURES_DIR = path.join(__dirname, '__fixtures__');
const OUTPUT_DIR = path.join(__dirname, '__output__');

function compileFixture(fixturePath) {
    // Handle both direct paths and fixture names
    let inputPath, outputPath;
    
    // If it's a direct path to a file
    if (fixturePath.endsWith('.mtl')) {
        // If it's already an absolute path, use it as is
        if (path.isAbsolute(fixturePath)) {
            inputPath = fixturePath;
        } else {
            // Otherwise, try to resolve it relative to the fixtures directory first
            const fixtureInFixtures = path.join(FIXTURES_DIR, fixturePath);
            if (fs.existsSync(fixtureInFixtures)) {
                inputPath = fixtureInFixtures;
            } else {
                // Fall back to resolving from the current working directory
                inputPath = path.resolve(process.cwd(), fixturePath);
            }
        }
        
        // Calculate output path relative to the fixtures directory
        const relativePath = path.relative(FIXTURES_DIR, inputPath)
            .replace(/\.mtl$/i, ''); // Remove .mtl extension case-insensitively
            
        outputPath = path.join(OUTPUT_DIR, `${relativePath}.json`);
    } else {
        // Legacy behavior for backward compatibility
        // First try in the valid subdirectory, then in the root of fixtures
        const validPath = path.join(FIXTURES_DIR, 'valid', `${fixturePath}.mtl`);
        const rootPath = path.join(FIXTURES_DIR, `${fixturePath}.mtl`);
        
        if (fs.existsSync(validPath)) {
            inputPath = validPath;
        } else if (fs.existsSync(rootPath)) {
            inputPath = rootPath;
        } else {
            // If not found, use the valid subdirectory as default
            inputPath = validPath;
        }
        
        outputPath = path.join(OUTPUT_DIR, `${fixturePath.replace(/[\\\/]/g, '-')}.json`);
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Compile the template
    compileMTL(inputPath, outputPath);
    
    // Read and parse the output
    const output = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    return { inputPath, outputPath, output };
}

function loadExpectedOutput(fixtureName) {
    const expectedPath = path.join(FIXTURES_DIR, 'valid', `expected_${fixtureName}.json`);
    if (fs.existsSync(expectedPath)) {
        return JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
    }
    return null;
}

module.exports = {
    FIXTURES_DIR,
    OUTPUT_DIR,
    compileFixture,
    loadExpectedOutput
};
