const fs = require('fs');
const compiler = require('./compiler-v2');
const Lexer = compiler.Lexer;
const Parser = compiler.Parser;

// Read the MTL file
const filePath = process.argv[2] || 'examples/simple.mtl';
const source = fs.readFileSync(filePath, 'utf-8');

console.log('Source file:', filePath);
console.log('Source length:', source.length, 'characters');

// Tokenize the source
console.log('\nTokenizing source...');
const lexer = new Lexer(source);
const tokens = lexer.scanTokens();
console.log('Generated', tokens.length, 'tokens');

// Parse the tokens
console.log('\nParsing tokens...');
const parser = new Parser(tokens);
const ast = parser.parse();

// Output the AST
console.log('\nAST:');
console.log(JSON.stringify(ast, null, 2));

console.log('\nDone!');
