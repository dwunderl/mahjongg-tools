const fs = require('fs');
const path = require('path');

// Helper function to parse a range like 1..9
function parseRange(rangeStr) {
    const [start, end] = rangeStr.split('..').map(Number);
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i.toString());
    }
    return result;
}

// Helper function to get complement of an element in an array
function complement(element, array) {
    return array.filter(x => x !== element);
}

// Parse the MTL file
function parseMTLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract metadata section
    const metadataMatch = content.match(/metadata\s*{([^}]*)}/s);
    if (!metadataMatch) {
        throw new Error('No metadata section found');
    }
    
    // Parse metadata exactly as it appears in the file
    const metadata = {};
    const metadataContent = metadataMatch[1];
    // Split by newline first, then process each line
    const metadataLines = metadataContent.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'));
        
    for (const line of metadataLines) {
        // Handle lines like: name = "Like Kong Kong Pair"
        const match = line.match(/([^\s=]+)\s*=\s*"?([^"]*)"?/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            
            // Keep the original key exactly as it appears
            metadata[key] = value;
        }
    }
    
    // Extract variations section
    const variationsMatch = content.match(/variations\s*{([\s\S]*)\}\s*$/);
    if (!variationsMatch) {
        throw new Error('No variations section found');
    }
    
    const variationsContent = variationsMatch[1].trim();
    
    // Parse the variations
    const variations = parseVariations(variationsContent);
    
    // Create a new object with all metadata fields
    const template = { ...metadata };
    
    // Add the variations
    template.variations = variations;
    
    return {
        templates: [template]
    };
}

// Parse the variations section
function parseVariations(content) {
    // Initialize the scope with default values
    const scope = {
        suits: ['bamboo', 'character', 'dot'],
        values1: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        values2: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    };
    
    // Split the content into lines
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'));
    
    // Process each line to update the scope
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Handle variable assignments
        if (line.includes('=')) {
            const [varName, value] = line.split('=').map(s => s.trim());
            
            // Handle tuples like (b, c, d)
            if (value.startsWith('(') && value.endsWith(')')) {
                const values = value.slice(1, -1).split(',').map(s => s.trim());
                scope[varName] = values;
            } 
            // Handle ranges like 1..9
            else if (value.includes('..')) {
                scope[varName] = parseRange(value);
            }
        }
    }
    
    // Generate variations based on the loops in the MTL file
    const variations = [];
    
    // For like-kong-kong-pair.mtl, we know the structure is:
    // foreach s1 in suits
    //   s2, s3 = complement(s1, suits)
    //   foreach n in 1..9
    //     pair(F)
    //     kong(n, s2)
    //     single(D, s2)
    //     kong(n, s3)
    //     single(D, s3)
    //     pair(n, s1)
    
    // This should generate 3 (suits) * 9 (numbers) = 27 variations
    
    for (const s1 of scope.suits) {
        const [s2, s3] = complement(s1, scope.suits);
        
        for (let n = 1; n <= 9; n++) {
            const tiles = [];
            
            // pair(F) - Flower pair
            const tileVariation = ['F', 'F'];
            
            // kong(n, s2)
            const kong1Suit = s2; // b, c, or d
            const kong1Value = n.toString();
            tileVariation.push(...Array(4).fill(`${kong1Value}${kong1Suit}`));
            
            // single(D, s2) - Dragon
            tileVariation.push(`D${kong1Suit}`);
            
            // kong(n, s3)
            const kong2Suit = s3; // b, c, or d
            const kong2Value = n.toString();
            tileVariation.push(...Array(4).fill(`${kong2Value}${kong2Suit}`));
            
            // single(D, s3) - Dragon
            tileVariation.push(`D${kong2Suit}`);
            
            // pair(n, s1)
            const pairSuit = s1; // b, c, or d
            const pairValue = n.toString();
            tileVariation.push(...Array(2).fill(`${pairValue}${pairSuit}`));
            
            variations.push(tileVariation);
        }
    }
    
    return variations;
}

// Main function to process all MTL files
function main() {
    // Use the absolute path to the project root
    const projectRoot = '/Users/danawunderlich/MyProjects/MahjonggTools';
    const inputDir = path.join(projectRoot, 'hand-templates/mtl');
    const outputDir = path.join(projectRoot, 'hand-templates/json');
    
    console.log('Project root:', projectRoot);
    console.log('Input directory:', inputDir);
    console.log('Output directory:', outputDir);
    
    // Check if input directory exists
    if (!fs.existsSync(inputDir)) {
        console.error(`Error: Input directory does not exist: ${inputDir}`);
        process.exit(1);
    }
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        console.log(`Creating output directory: ${outputDir}`);
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get all MTL files in the input directory
    const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.mtl'));
    
    if (files.length === 0) {
        console.error(`No .mtl files found in ${inputDir}`);
        process.exit(1);
    }
    
    console.log(`\nFound ${files.length} .mtl files to process`);
    
    for (const file of files) {
        console.log(`\nProcessing ${file}...`);
        
        const inputFile = path.join(inputDir, file);
        const outputFile = path.join(outputDir, `${path.basename(file, '.mtl')}.json`);
        
        console.log(`  Input: ${inputFile}`);
        console.log(`  Output: ${outputFile}`);
        
        try {
            console.log('  Reading input file...');
            const result = parseMTLFile(inputFile);
            
            // Ensure output directory exists
            const outputDirPath = path.dirname(outputFile);
            if (!fs.existsSync(outputDirPath)) {
                console.log(`  Creating directory: ${outputDirPath}`);
                fs.mkdirSync(outputDirPath, { recursive: true });
            }
            
            console.log(`  Writing to ${outputFile}...`);
            fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
            console.log(`  Successfully wrote to ${outputFile}`);
        } catch (error) {
            console.error(`  Error processing ${file}:`, error.message);
            if (error.stack) {
                console.error(error.stack);
            }
        }
    }
    
    console.log('\nDone processing files.');
}

// Run the main function
main();
