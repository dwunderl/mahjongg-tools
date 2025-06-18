const { compileMTL } = require('./compile');
const fs = require('fs');
const path = require('path');

function generateExpected(templateName) {
    const inputPath = path.join(__dirname, 'test', '__fixtures__', 'hand-templates', `${templateName}.mtl`);
    const outputPath = path.join(__dirname, 'test', '__fixtures__', 'hand-templates', 'expected', `${templateName}.json`);
    
    console.log(`Generating expected output for ${templateName}...`);
    
    try {
        const output = compileMTL(inputPath, outputPath);
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Successfully generated ${outputPath}`);
    } catch (error) {
        console.error(`Error generating expected output for ${templateName}:`, error);
    }
}

// Generate expected output for our new templates
generateExpected('like-kong-kong-pair');
generateExpected('sequence-kong-kong');
