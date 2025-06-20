const fs = require('fs');
const path = require('path');
const { MTLLexer } = require('./clean-compiler');

// Read the test file
const filePath = path.join(__dirname, 'test/__fixtures__/hand-templates/like-kong-kong-pair.mtl');
const input = fs.readFileSync(filePath, 'utf8');

// Tokenize the input
const lexer = new MTLLexer(input);
const tokens = lexer.tokenize();

// Log the tokens
console.log('Tokens:');
tokens.forEach((token, i) => {
    console.log(`${i}:`, token);
});
