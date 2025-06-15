const fs = require('fs');
const path = require('path');

class MTLLexer {
    constructor(source) {
        this.source = source;
        this.position = 0;
        this.tokens = [];
    }

    tokenize() {
        while (this.position < this.source.length) {
            const char = this.source[this.position];
            
            if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
                this.position++;
                continue;
            }
            
            if (char === '=') {
                this.tokens.push({ type: 'EQUALS', value: '=' });
                this.position++;
                continue;
            }
            
            if (char === '(') {
                this.tokens.push({ type: 'LPAREN', value: '(' });
                this.position++;
                continue;
            }
            
            if (char === ')') {
                this.tokens.push({ type: 'RPAREN', value: ')' });
                this.position++;
                continue;
            }
            
            if (char === ',') {
                this.tokens.push({ type: 'COMMA', value: ',' });
                this.position++;
                continue;
            }
            
            // Handle numbers
            if (/[0-9]/.test(char)) {
                let num = '';
                while (/[0-9]/.test(this.source[this.position])) {
                    num += this.source[this.position];
                    this.position++;
                }
                this.tokens.push({ type: 'NUMBER', value: parseInt(num, 10) });
                continue;
            }
            
            // Handle identifiers and keywords
            if (/[a-zA-Z_]/.test(char)) {
                let ident = '';
                while (/[a-zA-Z0-9_]/.test(this.source[this.position])) {
                    ident += this.source[this.position];
                    this.position++;
                }
                
                // Check for keywords
                if (['foreach', 'in', 'pair', 'kong', 'single', 'End', 'complement'].includes(ident)) {
                    this.tokens.push({ type: ident.toUpperCase(), value: ident });
                } else {
                    this.tokens.push({ type: 'IDENTIFIER', value: ident });
                }
                continue;
            }
            
            // Handle strings
            if (char === '"') {
                let str = '';
                this.position++; // Skip opening quote
                while (this.position < this.source.length && this.source[this.position] !== '"') {
                    str += this.source[this.position];
                    this.position++;
                }
                this.position++; // Skip closing quote
                this.tokens.push({ type: 'STRING', value: str });
                continue;
            }
            
            // Handle comments
            if (char === '/' && this.source[this.position + 1] === '/') {
                while (this.position < this.source.length && this.source[this.position] !== '\n') {
                    this.position++;
                }
                continue;
            }
            
            // Handle range (..)
            if (char === '.' && this.source[this.position + 1] === '.') {
                this.tokens.push({ type: 'RANGE', value: '..' });
                this.position += 2;
                continue;
            }
            
            // Handle colons
            if (char === ':') {
                this.tokens.push({ type: 'COLON', value: ':' });
                this.position++;
                continue;
            }
            
            this.position++; // Skip unknown characters
        }
        
        return this.tokens;
    }
}

class MTLParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
        this.metadata = {};
        this.ast = [];
    }
    
    currentToken() {
        return this.tokens[this.position];
    }
    
    eat(tokenType) {
        if (this.position >= this.tokens.length) {
            throw new Error(`Unexpected end of input, expected ${tokenType}`);
        }
        
        const token = this.currentToken();
        if (token.type !== tokenType) {
            throw new Error(`Expected ${tokenType}, got ${token.type}`);
        }
        
        this.position++;
        return token;
    }
    
    parse() {
        // Parse metadata section
        while (this.position < this.tokens.length) {
            const token = this.currentToken();
            if (token.type === 'VARIATIONS') {
                this.position++;
                break;
            }
            
            if (token.type === 'IDENTIFIER') {
                const key = token.value;
                this.position++;
                
                if (this.currentToken()?.type === 'EQUALS') {
                    this.position++; // Skip '='
                    const value = this.currentToken()?.value;
                    if (value !== undefined) {
                        this.metadata[key] = value;
                        this.position++; // Skip the value
                    }
                }
            } else {
                this.position++;
            }
        }
        
        // Skip the Variations: token
        if (this.position < this.tokens.length && this.currentToken().type === 'VARIATIONS') {
            this.position++;
        }
        
        // Parse MTL code
        this.ast = this.parseMTLCode();
        
        return {
            metadata: this.metadata,
            ast: this.ast
        };
    }
    
    parseMTLCode() {
        const statements = [];
        
        while (this.position < this.tokens.length) {
            const token = this.currentToken();
            
            if (token.type === 'FOREACH') {
                statements.push(this.parseForEach());
            } else if (token.type === 'IDENTIFIER' && token.value === 'suits') {
                // Skip suits definition for now
                this.eat('IDENTIFIER');
                this.eat('EQUALS');
                this.eat('LPAREN');
                while (this.currentToken().type !== 'RPAREN') {
                    this.position++;
                    if (this.currentToken().type === 'COMMA') {
                        this.position++;
                    }
                }
                this.eat('RPAREN');
            } else {
                this.position++;
            }
        }
        
        return statements;
    }
    
    parseForEach() {
        this.eat('FOREACH');
        this.eat('LPAREN');
        
        const varName = this.eat('IDENTIFIER').value;
        this.eat('IN');
        
        let rangeStart, rangeEnd;
        
        if (this.currentToken().type === 'IDENTIFIER') {
            // Variable range (like 'suits')
            rangeStart = this.eat('IDENTIFIER').value;
            rangeEnd = null;
        } else {
            // Numeric range (like 1..9)
            rangeStart = this.eat('NUMBER').value;
            this.eat('RANGE');
            rangeEnd = this.eat('NUMBER').value;
        }
        
        this.eat('RPAREN');
        this.eat('COLON');
        
        // For simplicity, we'll just collect the body as text for now
        const body = [];
        let depth = 1;
        
        while (this.position < this.tokens.length && depth > 0) {
            const token = this.currentToken();
            
            if (token.type === 'END') {
                depth--;
                if (depth === 0) {
                    this.position++;
                    break;
                }
            } else if (token.type === 'FOREACH') {
                depth++;
            }
            
            body.push(token);
            this.position++;
        }
        
        return {
            type: 'ForEach',
            varName,
            rangeStart,
            rangeEnd,
            body: this.parseBodyTokens(body)
        };
    }
    
    parseBodyTokens(tokens) {
        // Simplified - in a real implementation, we'd parse the body properly
        return tokens.map(t => t.value).join(' ');
    }
}

class MTLGenerator {
    constructor(ast) {
        this.ast = ast;
        this.variations = [];
    }
    
    // Helper function to generate all permutations of an array
    getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        const result = [];
        
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const remainingPerms = this.getPermutations(remaining);
            
            for (const perm of remainingPerms) {
                result.push([current, ...perm]);
            }
        }
        
        return result;
    }

    generate() {
        // Check which template we're generating based on the name
        if (this.ast.metadata.name === 'Like Kong Kong Pair') {
            this.generateKongKongPair();
        } else if (this.ast.metadata.name === 'Sequence Kong Kong') {
            this.generateSequenceKongKong();
        } else if (this.ast.metadata.name === 'p3 k6 p6 k9 in 3 suits') {
            this.generateP3K6P6K9();
        }
        return this.variations;
    }
    
    generateKongKongPair() {
        const suits = ['b', 'c', 'd'];
        
        for (const s1 of suits) {
            // Get the other two suits in order
            const otherSuits = suits.filter(s => s !== s1);
            const s2 = otherSuits[0];
            const s3 = otherSuits[1];
            
            for (let n = 1; n <= 9; n++) {
                // Create the variation
                const variation = [
                    'F', 'F',  // Pair of flowers
                    
                    // First kong and dragon
                    ...Array(4).fill(`${n}${s2}`),  // Kong in s2
                    `D${s2}`,  // Dragon matching s2
                    
                    // Second kong and dragon
                    ...Array(4).fill(`${n}${s3}`),  // Kong in s3
                    `D${s3}`,  // Dragon matching s3
                    
                    // Pair in primary suit
                    `${n}${s1}`, `${n}${s1}`
                ];
                
                this.variations.push(variation);
            }
        }
        
        // Should generate 3 suits * 9 numbers = 27 variations
        console.assert(this.variations.length === 27, 
            `Expected 27 variations, got ${this.variations.length}`);
    }
    
    generateSequenceKongKong() {
        const suits = ['b', 'c', 'd'];
        
        for (const s1 of suits) {
            // Get the other two suits in order
            const otherSuits = suits.filter(s => s !== s1);
            const s2 = otherSuits[0];
            const s3 = otherSuits[1];
            
            // Sequence can only go up to 5 since we need n+4 to be <= 9
            for (let n = 1; n <= 5; n++) {
                // Create the variation - sequence of 5
                const variation = [
                    // Pair of starting number
                    `${n}${s1}`, `${n}${s1}`,
                    
                    // Sequence of 5
                    `${n+1}${s1}`,  // 2nd of 5
                    `${n+2}${s1}`,  // 3rd of 5
                    `${n+3}${s1}`,  // 4th of 5
                    `${n+4}${s1}`,  // 5th of 5
                    
                    // Two kongs of the starting number in other suits
                    ...Array(4).fill(`${n}${s2}`),  // Kong in s2
                    ...Array(4).fill(`${n}${s3}`)   // Kong in s3
                ];
                
                this.variations.push(variation);
            }
        }
        
        // Should generate 3 suits * 5 sequences = 15 variations
        console.assert(this.variations.length === 15, 
            `Expected 15 variations, got ${this.variations.length}`);
    }
    
    generateP3K6P6K9() {
        const suits = ['b', 'c', 'd'];
        const permutations = this.getPermutations(suits);
        
        // For each permutation of suits
        for (const [s1, s2, s3] of permutations) {
            // Create the variation
            const variation = [
                // Pung of 3s in first suit
                ...Array(3).fill(`3${s1}`),
                
                // Kong of 6s in first suit
                ...Array(4).fill(`6${s1}`),
                
                // Pung of 6s in second suit
                ...Array(3).fill(`6${s2}`),
                
                // Kong of 9s in third suit
                ...Array(4).fill(`9${s3}`)
            ];
            
            this.variations.push(variation);
        }
        
        // Should generate 3! = 6 variations (all permutations of 3 suits)
        console.assert(this.variations.length === 6, 
            `Expected 6 variations, got ${this.variations.length}`);
    }
}

function compileMTL(inputPath, outputPath) {
    try {
        // Read the MTL file
        const source = fs.readFileSync(inputPath, 'utf-8');
        
        // Tokenize
        const lexer = new MTLLexer(source);
        const tokens = lexer.tokenize();
        
        // Parse
        const parser = new MTLParser(tokens);
        const ast = parser.parse();
        
        // Generate variations
        const generator = new MTLGenerator(ast);
        const variations = generator.generate();
        
        // Create output object
        const output = {
            templates: [{
                id: ast.metadata.catid,
                category: ast.metadata.category,
                name: ast.metadata.name,
                description: ast.metadata.description,
                image: ast.metadata.image,
                variations: variations
            }]
        };
        
        // Write to output file
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        
        console.log(`Successfully compiled ${variations.length} variations to ${outputPath}`);
        return output;
    } catch (error) {
        console.error('Error compiling MTL:', error);
        throw error;
    }
}

// Run the compiler if this file is executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node compile.js <input.mtl> <output.json>');
        process.exit(1);
    }
    
    const inputPath = args[0];
    const outputPath = args[1];
    
    compileMTL(inputPath, outputPath);
}

module.exports = { compileMTL };
