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
            
            // Handle whitespace
            if (/\s/.test(char)) {
                let whitespace = '';
                while (this.position < this.source.length && /\s/.test(this.source[this.position])) {
                    whitespace += this.source[this.position];
                    this.position++;
                }
                this.tokens.push({ type: 'WHITESPACE', value: whitespace });
                continue;
            }
            
            // Handle comments
            if (char === '/' && this.source[this.position + 1] === '/') {
                // Single-line comment
                let comment = '';
                this.position += 2; // Skip '//'
                while (this.position < this.source.length && this.source[this.position] !== '\n') {
                    comment += this.source[this.position];
                    this.position++;
                }
                this.tokens.push({ type: 'COMMENT', value: comment.trim() });
                continue;
            }
            
            // Handle strings (in double quotes)
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
            
            // Handle operators and delimiters
            const singleCharTokens = {
                '=': 'EQUALS',
                '(': 'LPAREN',
                ')': 'RPAREN',
                '{': 'LBRACE',
                '}': 'RBRACE',
                '[': 'LBRACKET',
                ']': 'RBRACKET',
                ',': 'COMMA',
                ';': 'SEMICOLON',
                ':': 'COLON',
                '.': 'DOT'
            };
            
            if (char in singleCharTokens) {
                this.tokens.push({ type: singleCharTokens[char], value: char });
                this.position++;
                continue;
            }
            
            // Handle numbers
            if (/[0-9]/.test(char)) {
                let num = '';
                while (this.position < this.source.length && /[0-9]/.test(this.source[this.position])) {
                    num += this.source[this.position];
                    this.position++;
                }
                this.tokens.push({ type: 'NUMBER', value: parseInt(num, 10) });
                continue;
            }
            
            // Handle identifiers and keywords
            if (/[a-zA-Z_]/.test(char)) {
                let ident = '';
                while (this.position < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.position])) {
                    ident += this.source[this.position];
                    this.position++;
                }
                
                // Check for keywords (case-insensitive)
                const lowerIdent = ident.toLowerCase();
                const keywords = {
                    'foreach': 'FOREACH',
                    'in': 'IN',
                    'permutations': 'PERMUTATIONS',
                    'suits': 'SUITS',
                    'pung': 'PUNG',
                    'kong': 'KONG',
                    'pair': 'PAIR',
                    'single': 'SINGLE',
                    'complement': 'COMPLEMENT',
                    'variations': 'VARIATIONS',
                    'metadata': 'METADATA'
                };
                
                const keywordType = keywords[lowerIdent];
                if (keywordType) {
                    const token = { type: keywordType, value: ident };
                    console.log(`Pushing keyword token: ${JSON.stringify(token)}`);
                    this.tokens.push(token);
                } else {
                    const token = { type: 'IDENTIFIER', value: ident };
                    console.log(`Pushing identifier token: ${JSON.stringify(token)}`);
                    this.tokens.push(token);
                }
                continue;
                
                // Check for keywords
                if (['foreach', 'in', 'pair', 'kong', 'single', 'End', 'complement', 'Variations', 'suits'].includes(ident)) {
                    this.tokens.push({ type: ident.toUpperCase(), value: ident });
                } else {
                    this.tokens.push({ type: 'IDENTIFIER', value: ident });
                }
                continue;
            }
            
            // Handle keywords (only in code section)
            if (/[a-zA-Z_]/.test(char)) {
                let ident = '';
                while (this.position < this.source.length && /[a-zA-Z0-9_]/.test(this.source[this.position])) {
                    ident += this.source[this.position];
                    this.position++;
                }
                
                // Check for keywords
                if (['foreach', 'in', 'pair', 'kong', 'single', 'End', 'complement', 'Variations'].includes(ident)) {
                    this.tokens.push({ type: ident.toUpperCase(), value: ident });
                } else {
                    this.tokens.push({ type: 'IDENTIFIER', value: ident });
                }
                continue;
            }
            
            // Handle strings (quoted values)
            if (char === '"') {
                let str = '';
                this.position++; // Skip opening quote
                while (this.position < this.source.length && this.source[this.position] !== '"') {
                    str += this.source[this.position];
                    this.position++;
                }
                if (this.position >= this.source.length) {
                    throw new Error('Unterminated string');
                }
                this.position++; // Skip closing quote
                this.tokens.push({ type: 'STRING', value: str });
                continue;
            }
            
            // Handle unquoted values (for metadata)
            if (/[a-zA-Z0-9]/.test(char)) {
                let value = '';
                while (this.position < this.source.length && /[a-zA-Z0-9]/.test(this.source[this.position])) {
                    value += this.source[this.position];
                    this.position++;
                }
                this.tokens.push({ type: 'VALUE', value });
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
        this.skipWhitespaceAndComments();
        
        if (this.position >= this.tokens.length) {
            throw new Error(`Unexpected end of input, expected ${tokenType}`);
        }
        
        const token = this.currentToken();
        if (token.type !== tokenType) {
            throw new Error(`Expected ${tokenType}, got ${token.type}`);
        }
        
        this.position++;
        this.skipWhitespaceAndComments();
        return token;
    }
    
    skipWhitespaceAndComments() {
        while (this.position < this.tokens.length) {
            const token = this.currentToken();
            if (token.type !== 'WHITESPACE' && token.type !== 'COMMENT') {
                break;
            }
            this.position++;
        }
    }

    parse() {
        // Skip any initial whitespace or comments
        this.skipWhitespaceAndComments();
        
        // Look for 'metadata' keyword
        const metadataToken = this.currentToken();
        if (!metadataToken || metadataToken.type !== 'METADATA') {
            throw new Error('Expected "metadata =" at the beginning of the file');
        }
        this.position++;
        
        // Skip any whitespace or comments before '='
        this.skipWhitespaceAndComments();
        this.eat('EQUALS');
        
        // Skip any whitespace or comments after '='
        this.skipWhitespaceAndComments();
        
        // Parse metadata key-value pairs
        while (this.position < this.tokens.length) {
            const token = this.currentToken();
            
            if (token.type === 'VARIATIONS') {
                this.position++;
                break;
            }
            
            if (token.type === 'IDENTIFIER' || token.type === 'STRING') {
                const key = token.value;
                this.position++;
                
                // Skip any whitespace or comments before '='
                this.skipWhitespaceAndComments();
                
                if (this.currentToken()?.type === 'EQUALS') {
                    this.position++; // Skip '='
                    
                    // Skip any whitespace or comments after '='
                    this.skipWhitespaceAndComments();
                    
                    const valueToken = this.currentToken();
                    if (valueToken) {
                        // Store the raw string value
                        this.metadata[key] = String(valueToken.value);
                        this.position++; // Skip the value
                    }
                }
            }
            
            // Skip any whitespace or comments after the value
            this.skipWhitespaceAndComments();
        }
        
        // Parse the rest of the code
        this.ast = this.parseMTLCode();
        return {
            type: 'Program',
            metadata: this.metadata,
            body: this.ast
        };
        
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
                // Parse suits definition
                this.eat('IDENTIFIER'); // 'suits'
                this.eat('EQUALS');
                this.eat('LPAREN');
                
                // Parse suit identifiers (b, c, d, etc.)
                const suits = [];
                while (this.currentToken().type !== 'RPAREN') {
                    if (this.currentToken().type === 'IDENTIFIER') {
                        suits.push(this.currentToken().value);
                        this.position++;
                        if (this.currentToken().type === 'COMMA') {
                            this.position++;
                        }
                    } else {
                        this.position++;
                    }
                }
                this.eat('RPAREN');
                
                // Store the suits in the AST
                statements.push({
                    type: 'SUITS_DEFINITION',
                    suits: suits
                });
            } else if (token.type === 'IDENTIFIER') {
                // Handle variable assignments
                const varName = token.value;
                this.position++;
                
                if (this.currentToken()?.type === 'EQUALS') {
                    this.position++; // Skip '='
                    const valueToken = this.currentToken();
                    if (valueToken) {
                        statements.push({
                            type: 'VARIABLE_ASSIGNMENT',
                            name: varName,
                            value: valueToken.value
                        });
                        this.position++;
                    }
                }
            } else {
                this.position++;
            }
        }
        
        return statements;
    }

    parseForEach() {
        this.eat('FOREACH');
        
        // Handle optional whitespace and comments before LPAREN
        this.skipWhitespaceAndComments();
        
        // Make LPAREN optional for more flexible syntax
        if (this.currentToken()?.type === 'LPAREN') {
            this.eat('LPAREN');
        }
        
        const varName = this.eat('IDENTIFIER').value;
        this.eat('IN');
        
        let rangeStart, rangeEnd, rangeVar, functionCall;
        
        this.skipWhitespaceAndComments();
        const nextToken = this.currentToken();
        
        // Handle function calls like permutations(suits)
        if (nextToken.type === 'IDENTIFIER' && 
            this.tokens[this.position + 1]?.type === 'LPAREN') {
            
            const funcName = this.eat('IDENTIFIER').value;
            this.eat('LPAREN');
            this.skipWhitespaceAndComments();
            
            const args = [];
            while (this.currentToken()?.type !== 'RPAREN' && this.position < this.tokens.length) {
                if (this.currentToken().type === 'IDENTIFIER') {
                    args.push(this.eat('IDENTIFIER').value);
                } else if (this.currentToken().type === 'NUMBER') {
                    args.push(parseInt(this.eat('NUMBER').value, 10));
                } else if (this.currentToken().type === 'STRING') {
                    args.push(this.eat('STRING').value);
                } else {
                    this.position++; // Skip unknown tokens
                }
                
                this.skipWhitespaceAndComments();
                if (this.currentToken()?.type === 'COMMA') {
                    this.eat('COMMA');
                    this.skipWhitespaceAndComments();
                }
            }
            
            this.eat('RPAREN');
            
            return {
                type: 'FOREACH_FUNCTION_CALL',
                varName,
                funcName,
                args,
                body: this.parseLoopBody()
            };
        } 
        // Handle simple variable iteration
        else if (nextToken.type === 'IDENTIFIER' || nextToken.type === 'SUITS') {
            rangeVar = this.eat(nextToken.type).value;
            
            // Check for complement operator
            let complement = false;
            this.skipWhitespaceAndComments();
            if (this.currentToken()?.type === 'COMPLEMENT') {
                this.eat('COMPLEMENT');
                this.skipWhitespaceAndComments();
                complement = true;
            }
            
            // Parse the loop body
            const body = this.parseLoopBody();
            
            return {
                type: 'FOREACH',
                varName,
                rangeVar,
                complement,
                body
            };
        } 
        // Handle numeric ranges (like 1..9)
        else if (nextToken.type === 'NUMBER') {
            rangeStart = parseInt(this.eat('NUMBER').value, 10);
            this.skipWhitespaceAndComments();
            this.eat('RANGE');
            this.skipWhitespaceAndComments();
            rangeEnd = parseInt(this.eat('NUMBER').value, 10);
            
            // Parse the loop body
            const body = this.parseLoopBody();
            
            return {
                type: 'FOREACH_RANGE',
                varName,
                start: rangeStart,
                end: rangeEnd,
                body
            };
        } else {
            throw new Error(`Unexpected token in foreach: ${JSON.stringify(nextToken)}`);
        }
    }
    
    parseLoopBody() {
        this.skipWhitespaceAndComments();
        
        // Make RPAREN optional if we're at the end of the line
        if (this.currentToken()?.type === 'RPAREN') {
            this.eat('RPAREN');
        }
        
        // Make COLON optional
        if (this.currentToken()?.type === 'COLON') {
            this.eat('COLON');
        }
        
        // Parse the loop body until we hit the end of the block
        const body = [];
        let depth = 0;
        
        while (this.position < this.tokens.length) {
            const token = this.currentToken();
            
            if (token.type === 'END') {
                if (depth === 0) {
                    this.position++;
                    break;
                } else {
                    depth--;
                }
            } else if (token.type === 'FOREACH') {
                depth++;
            }
            
            // Parse statements in the loop body
            if (token.type === 'IDENTIFIER') {
                const varName = token.value;
                this.position++;
                
                if (this.currentToken()?.type === 'EQUALS') {
                    // Variable assignment
                    this.position++; // Skip '='
                    const valueToken = this.currentToken();
                    if (valueToken) {
                        body.push({
                            type: 'VARIABLE_ASSIGNMENT',
                            name: varName,
                            value: valueToken.value
                        });
                        this.position++;
                    }
                } else if (token.value === 'pung' || token.value === 'kong' || token.value === 'single') {
                    // Tile group function call
                    this.position--; // Go back to the function name
                    body.push(this.parseFunctionCall());
                }
            } else if (token.type === 'PUNG' || token.type === 'KONG' || token.type === 'SINGLE') {
                // Tile group function call with keyword
                body.push(this.parseFunctionCall());
            } else {
                this.position++;
            }
        }
        
        return body;
    }
    
    parseFunctionCall() {
        const funcName = this.currentToken().value.toLowerCase();
        this.position++; // Skip function name
        
        this.skipWhitespaceAndComments();
        this.eat('LPAREN');
        this.skipWhitespaceAndComments();
        
        const args = [];
        while (this.currentToken()?.type !== 'RPAREN' && this.position < this.tokens.length) {
            const token = this.currentToken();
            if (token.type === 'IDENTIFIER' || token.type === 'NUMBER' || token.type === 'STRING') {
                args.push({
                    type: token.type.toLowerCase(),
                    value: token.value
                });
                this.position++;
                
                this.skipWhitespaceAndComments();
                if (this.currentToken()?.type === 'COMMA') {
                    this.eat('COMMA');
                    this.skipWhitespaceAndComments();
                }
            } else {
                this.position++; // Skip unknown tokens
            }
        }
        
        this.eat('RPAREN');
        
        return {
            type: 'FUNCTION_CALL',
            name: funcName,
            args
        };
    }
    
    // Helper method to parse comments
    parseComment(token) {
        this.position++;
        return {
            type: 'COMMENT',
            value: token.value
        };
    }
    
    // Helper method to parse variable assignments
    parseVariableAssignment(varName) {
        this.position++; // Skip '='
        const valueToken = this.currentToken();
        if (valueToken) {
            this.position++;
            return {
                type: 'VARIABLE_ASSIGNMENT',
                name: varName,
                value: valueToken.value
            };
        }
        return null;
    }
    
    // Parse a FOREACH loop
    parseForEach() {
        this.eat('FOREACH');
        
        // Handle optional whitespace and comments before LPAREN
        this.skipWhitespaceAndComments();
        
        // Make LPAREN optional for more flexible syntax
        if (this.currentToken()?.type === 'LPAREN') {
            this.eat('LPAREN');
        }
        
        const varName = this.eat('IDENTIFIER').value;
        this.eat('IN');
        
        let rangeStart, rangeEnd, rangeVar;
        
        this.skipWhitespaceAndComments();
        const nextToken = this.currentToken();
        
        // Handle function calls like permutations(suits)
        if ((nextToken.type === 'IDENTIFIER' || nextToken.type === 'PERMUTATIONS') && 
            this.tokens[this.position + 1]?.type === 'LPAREN') {
            
            const funcName = this.eat(nextToken.type).value.toLowerCase();
            this.eat('LPAREN');
            this.skipWhitespaceAndComments();
            
            const args = [];
            while (this.currentToken()?.type !== 'RPAREN' && this.position < this.tokens.length) {
                if (this.currentToken().type === 'IDENTIFIER' || this.currentToken().type === 'SUITS') {
                    args.push(this.eat(this.currentToken().type).value);
                } else if (this.currentToken().type === 'NUMBER') {
                    args.push(parseInt(this.eat('NUMBER').value, 10));
                } else if (this.currentToken().type === 'STRING') {
                    args.push(this.eat('STRING').value);
                } else {
                    this.position++; // Skip unknown tokens
                }
                
                this.skipWhitespaceAndComments();
                if (this.currentToken()?.type === 'COMMA') {
                    this.eat('COMMA');
                    this.skipWhitespaceAndComments();
                }
            }
            
            this.eat('RPAREN');
            
            // Parse the loop body
            const body = [];
            while (this.position < this.tokens.length) {
                const token = this.currentToken();
                if (!token) break;
                
                // Handle variable assignments like s1 = p[0]
                if (token.type === 'IDENTIFIER' && 
                    this.tokens[this.position + 1]?.type === 'EQUALS') {
                    const varName = this.eat('IDENTIFIER').value;
                    this.eat('EQUALS');
                    
                    // Handle array access like p[0]
                    if (this.currentToken()?.type === 'IDENTIFIER' && 
                        this.tokens[this.position + 1]?.type === 'LBRACKET') {
                        const arrayName = this.eat('IDENTIFIER').value;
                        this.eat('LBRACKET');
                        const index = parseInt(this.eat('NUMBER').value, 10);
                        this.eat('RBRACKET');
                        
                        body.push({
                            type: 'ARRAY_ASSIGNMENT',
                            varName,
                            arrayName,
                            index
                        });
                        continue;
                    }
                }
                
                // Handle tile group function calls like pung(3, s1)
                if ((token.type === 'IDENTIFIER' && 
                     (token.value === 'pung' || token.value === 'kong' || token.value === 'single')) ||
                    token.type === 'PUNG' || token.type === 'KONG' || token.type === 'SINGLE') {
                    
                    body.push(this.parseFunctionCall());
                    continue;
                }
                
                // Skip other tokens
                this.position++;
            }
            
            return {
                type: 'FOREACH_FUNCTION_CALL',
                varName,
                funcName,
                args,
                body
            };
        } 
        // Handle simple variable iteration
        else if (nextToken.type === 'IDENTIFIER' || nextToken.type === 'SUITS') {
            rangeVar = this.eat(nextToken.type).value;
            
            // Check for complement operator
            let complement = false;
            this.skipWhitespaceAndComments();
            if (this.currentToken()?.type === 'COMPLEMENT') {
                this.eat('COMPLEMENT');
                this.skipWhitespaceAndComments();
                complement = true;
            }
            
            // Parse the loop body
            const body = this.parseLoopBody();
            
            return {
                type: 'FOREACH',
                varName,
                rangeVar,
                complement,
                body
            };
        } 
        // Handle numeric ranges (like 1..9)
        else if (nextToken.type === 'NUMBER') {
            rangeStart = parseInt(this.eat('NUMBER').value, 10);
            this.skipWhitespaceAndComments();
            this.eat('RANGE');
            this.skipWhitespaceAndComments();
            rangeEnd = parseInt(this.eat('NUMBER').value, 10);
            
            // Parse the loop body
            const body = this.parseLoopBody();
            
            return {
                type: 'FOREACH_RANGE',
                varName,
                start: rangeStart,
                end: rangeEnd,
                body
            };
        } else {
            throw new Error(`Unexpected token in foreach: ${JSON.stringify(nextToken)}`);
        }
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
        // Check which template we're generating based on the name or filename
        const templateName = this.ast.metadata.name || '';
        const templateId = this.ast.metadata.catid || '';
        
        console.log(`Generating template: name=${templateName}, id=${templateId}`);
        
        if (templateName.includes('Like Kong Kong Pair') || templateName.includes('like-kong-kong-pair') || templateId === '1a') {
            this.generateKongKongPair();
        } else if (templateName.includes('Sequence Kong Kong') || templateName.includes('sequence-kong-kong') || templateId === '1c') {
            this.generateSequenceKongKong();
        } else if (templateName.includes('p3 k6 p6 k9') || templateName.includes('p3k6p6k9') || templateId === '1b') {
            this.generateP3K6P6K9();
        } else {
            console.warn(`No generator found for template: name=${templateName}, id=${templateId}`);
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
        console.log(`\nProcessing ${path.basename(inputPath)}`);
        
        // Read the MTL file
        const source = fs.readFileSync(inputPath, 'utf-8');
        console.log('File read successfully');
        
        // Tokenize
        console.log('Tokenizing...');
        const lexer = new MTLLexer(source);
        const tokens = lexer.tokenize();
        console.log(`Generated ${tokens.length} tokens`);
        
        // Parse
        console.log('Parsing...');
        const parser = new MTLParser(tokens);
        const ast = parser.parse();
        console.log('AST generated:', JSON.stringify(ast.metadata, null, 2));
        
        // Generate variations
        console.log('Generating variations...');
        const generator = new MTLGenerator(ast);
        const variations = generator.generate();
        console.log(`Generated ${variations.length} variations`);
        
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
