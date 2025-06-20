const fs = require('fs');
const path = require('path');
const { MTLLexer, MTLParser, compileMTL } = require('./clean-compiler');

// Enable debug logging
process.env.DEBUG = 'true';

// Path to the template file
const templateFile = path.join(__dirname, 'templates', 'fixed-like-kong-kong-pair.mtl');

// Read the template file
console.log(`Reading template file: ${templateFile}`);
const source = fs.readFileSync(templateFile, 'utf8');
console.log('\nSource content:');
console.log('-' + '-'.repeat(78));
console.log(source);
console.log('-' + '-'.repeat(78));

// Compile the template
console.log('\n=== TOKENIZATION ===');
const lexer = new MTLLexer(source);
const tokens = lexer.tokenize();

console.log('\nTokens:');
console.log('-' + '-'.repeat(78));
tokens.forEach((token, i) => {
    console.log(`${i.toString().padStart(3)}: ${JSON.stringify(token)}`);
});
console.log('-' + '-'.repeat(78));

console.log('\n=== PARSING ===');
try {
    const parser = new MTLParser(tokens);
    const result = parser.parse();
    
    // Display the result
    console.log('\n✅ Compilation successful! Result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Write to a file
    const outputFile = path.join(__dirname, 'compiled-template.json');
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`\nOutput written to: ${outputFile}`);
    
} catch (error) {
    console.error('\n❌ Error during parsing:');
    console.error(error);
    
    // Log the current token that caused the error if available
    if (error.token) {
        console.error('\nError at token:', JSON.stringify(error.token));
        const tokenIndex = tokens.findIndex(t => 
            t.type === error.token.type && 
            t.value === error.token.value &&
            t.line === error.token.line &&
            t.column === error.token.column
        );
        
        if (tokenIndex !== -1) {
            console.error('Surrounding tokens:');
            const start = Math.max(0, tokenIndex - 2);
            const end = Math.min(tokens.length - 1, tokenIndex + 2);
            
            for (let i = start; i <= end; i++) {
                const indicator = i === tokenIndex ? '>>>' : '   ';
                console.log(`${indicator} ${i}: ${JSON.stringify(tokens[i])}`);
            }
        }
    }
    
    process.exit(1);
}
