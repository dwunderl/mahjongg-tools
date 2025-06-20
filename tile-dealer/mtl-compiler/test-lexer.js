const fs = require('fs');
const { MTLLexer } = require('./compile');

// Read the test file
const source = fs.readFileSync('./test/__fixtures__/valid/simple.mtl', 'utf8');

// Tokenize
const lexer = new MTLLexer(source);
const tokens = lexer.tokenize();

// Filter out whitespace and comments for cleaner output
const filteredTokens = tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'COMMENT');

console.log('Tokens:');
console.log(filteredTokens.map(t => `${t.type}: ${JSON.stringify(t.value)}`).join('\n'));
