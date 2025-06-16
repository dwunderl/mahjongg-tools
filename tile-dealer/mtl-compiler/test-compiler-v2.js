const { compileMTL } = require('./compiler-v2');

// Test the new compiler with our templates
const testTemplates = [
    'templates/like-kong-kong-pair.mtl',
    'templates/sequence-kong-kong.mtl',
    'templates/p3k6p6k9.mtl'
];

// Run tests
async function runTests() {
    for (const template of testTemplates) {
        const outputFile = template.replace('templates/', 'output/v2-').replace('.mtl', '.json');
        console.log(`\nTesting ${template} -> ${outputFile}`);
        
        try {
            await compileMTL(template, outputFile);
            console.log(`✅ Successfully compiled ${template}`);
        } catch (error) {
            console.error(`❌ Failed to compile ${template}:`, error.message);
        }
    }
}

runTests().catch(console.error);
