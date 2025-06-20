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
                    'metadata': 'METADATA',
                    'variations': 'VARIATIONS',
                    'foreach': 'FOREACH',
                    'in': 'IN',
                    'pair': 'PAIR',
                    'pung': 'PUNG',
                    'kong': 'KONG',
                    'quint': 'QUINT',
                    'sequence': 'SEQUENCE',
                    'suits': 'SUITS',
                    'true': 'BOOLEAN',
                    'false': 'BOOLEAN',
                    'null': 'NULL',
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
        this.ast = {
            type: 'Program',
            metadata: {},
            variations: []
        };
    }
    
    currentToken() {
        if (this.position >= this.tokens.length) return null;
        return this.tokens[this.position];
    }
    
    eat(tokenType, value = null) {
        const token = this.currentToken();
        if (!token) {
            throw new Error(`Unexpected end of input, expected ${tokenType}`);
        }
        
        if (token.type !== tokenType || (value !== null && token.value !== value)) {
            throw new Error(`Expected ${tokenType}${value ? ' ' + value : ''}, got ${token.type} ${token.value}`);
        }
        
        this.position++;
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
    
    parseMetadata() {
        this.eat('IDENTIFIER', 'metadata');
        this.eat('EQUALS');
        this.eat('LBRACE');
        
        while (true) {
            this.skipWhitespaceAndComments();
            const keyToken = this.currentToken();
            if (keyToken.type === 'RBRACE') break;
            
            const key = keyToken.value;
            this.eat('IDENTIFIER');
            this.eat('COLON');
            
            const valueToken = this.currentToken();
            let value;
            
            if (valueToken.type === 'STRING') {
                value = valueToken.value;
                this.eat('STRING');
            } else if (valueToken.type === 'NUMBER') {
                value = parseFloat(valueToken.value);
                this.eat('NUMBER');
            } else if (valueToken.type === 'IDENTIFIER') {
                value = valueToken.value;
                this.eat('IDENTIFIER');
            } else {
                throw new Error(`Unexpected token in metadata: ${JSON.stringify(valueToken)}`);
            }
            
            this.ast.metadata[key] = value;
            
            // Check for comma or closing brace
            this.skipWhitespaceAndComments();
            const nextToken = this.currentToken();
            if (nextToken?.type === 'COMMA') {
                this.eat('COMMA');
            } else if (nextToken?.type !== 'RBRACE') {
                throw new Error('Expected comma or closing brace after metadata value');
            }
        }
        
        this.eat('RBRACE');
    }
    
    parseVariations() {
        this.eat('IDENTIFIER', 'variations');
        this.eat('EQUALS');
        this.eat('LBRACE');
        
        // Skip whitespace and comments
        this.skipWhitespaceAndComments();
        
        // Look for 'suits' definition
        const suitsToken = this.currentToken();
        if (suitsToken.type === 'IDENTIFIER' && suitsToken.value === 'suits') {
            this.eat('IDENTIFIER');
            this.eat('EQUALS');
            this.eat('LBRACKET');
            
            const suits = [];
            while (true) {
                const suitToken = this.currentToken();
                if (suitToken.type === 'RBRACKET') break;
                
                if (suitToken.type === 'IDENTIFIER' && ['b', 'c', 'd'].includes(suitToken.value)) {
                    suits.push(suitToken.value);
                    this.eat('IDENTIFIER');
                } else {
                    throw new Error(`Unexpected token in suits array: ${JSON.stringify(suitToken)}`);
                }
                
                const nextToken = this.currentToken();
                if (nextToken.type === 'COMMA') {
                    this.eat('COMMA');
                } else if (nextToken.type !== 'RBRACKET') {
                    throw new Error('Expected comma or closing bracket in suits array');
                }
            }
            this.eat('RBRACKET');
            
            // Process foreach loop
            this.skipWhitespaceAndComments();
            this.eat('FOREACH');
            this.eat('LPAREN');
            const varName = this.eat('IDENTIFIER').value;
            this.eat('IN');
            this.eat('IDENTIFIER', 'suits');
            this.eat('RPAREN');
            this.eat('LBRACE');
            
            // Parse the foreach body
            this.skipWhitespaceAndComments();
            const funcCallToken = this.currentToken();
            if (funcCallToken.type === 'PAIR') {
                this.eat('PAIR');
                this.eat('LPAREN');
                const number = parseInt(this.eat('NUMBER').value);
                this.eat('COMMA');
                const suitVar = this.eat('IDENTIFIER').value;
                this.eat('RPAREN');
                
                // Generate variations for each suit
                for (const suit of suits) {
                    this.ast.variations.push({
                        type: 'variation',
                        calls: [{
                            type: 'pair',
                            number,
                            suit: suit
                        }]
                    });
                }
            }
            
            this.eat('RBRACE');
        }
        
        this.eat('RBRACE');
    }

    parse() {
        console.log('Starting parse()');
        
        // Parse metadata block
        this.parseMetadata();
        
        // Parse variations block
        this.parseVariations();
        
        console.log('AST:', JSON.stringify(this.ast, null, 2));
        return this.ast;
    }
                
                // Skip any whitespace or comments before ':'
                this.skipWhitespaceAndComments();
                this.eat('COLON');
                
                // Skip any whitespace or comments after ':'
                this.skipWhitespaceAndComments();
                
                // Get the value
                const valueToken = this.currentToken();
                if (!valueToken) {
                    throw new Error('Expected value after colon in metadata');
                }
                
                // Store the value (remove quotes from strings if present)
                let value = valueToken.value;
                if (valueToken.type === 'STRING' && 
                    ((value.startsWith('"') && value.endsWith('"')) || 
                     (value.startsWith("'") && value.endsWith("'")))) {
                    value = value.substring(1, value.length - 1);
                }
                
                this.metadata[key] = value;
                this.position++; // Skip the value
                
        
        // Initialize AST
        const ast = {
            type: 'PROGRAM',
            body: [],
            metadata: {},
            variations: []
        };
        
        this.ast = ast;
        
        // Initialize statements array
        const statements = [];
        
        // First, find and parse metadata block if it exists
        const metadataTokenIndex = this.tokens.findIndex(t => t.type === 'IDENTIFIER' && t.value === 'metadata');
        if (metadataTokenIndex !== -1) {
            this.position = metadataTokenIndex;
            console.log('Found metadata block');
            this.position++; // Skip 'metadata'
            this.eat('EQUALS');
            this.eat('LBRACE');
            
            // Parse metadata properties
            while (this.position < this.tokens.length) {
                const propToken = this.currentToken();
                if (!propToken) break;
                
                // Check for end of metadata block
                if (propToken.type === 'RBRACE') {
                    this.position++; // Skip '}'
                    break;
                }
                
                // Skip whitespace and comments
                if (propToken.type === 'WHITESPACE' || propToken.type === 'COMMENT') {
                    this.position++;
                    continue;
                }
                
                if (propToken.type === 'IDENTIFIER') {
                    const propName = propToken.value;
                    this.position++; // Skip identifier
                    this.eat('COLON');
                    
                    // Get the property value (can be string, number, or identifier)
                    const valueToken = this.currentToken();
                    let value;
                    
                    if (valueToken.type === 'STRING') {
                        value = valueToken.value;
                    } else if (valueToken.type === 'NUMBER') {
                        value = parseFloat(valueToken.value);
                    } else if (valueToken.type === 'IDENTIFIER') {
                        value = valueToken.value;
                    } else {
                        throw new Error(`Unexpected token in metadata: ${JSON.stringify(valueToken)}`);
                    }
                    
                    // Store the metadata property
                    ast.metadata[propName] = value;
                    this.position++; // Skip the value token
                    
                    // Check for comma or closing brace
                    this.skipWhitespaceAndComments();
                    const nextToken = this.currentToken();
                    if (nextToken?.type === 'COMMA') {
                        this.position++; // Skip comma
                    } else if (nextToken?.type !== 'RBRACE') {
                        throw new Error('Expected comma or closing brace after metadata value');
                    }
                } else {
                    this.position++;
                }
            }
        }
        
        // Reset position to start of file
        this.position = 0;
        
        // Find variations block
        const variationsTokenIndex = this.tokens.findIndex(t => t.type === 'IDENTIFIER' && t.value === 'variations');
        if (variationsTokenIndex !== -1) {
            this.position = variationsTokenIndex;
            console.log('Found variations block');
            this.position++; // Skip 'variations'
            this.eat('EQUALS');
            this.eat('LBRACE');
        }
        
        // Process all tokens after metadata and variations blocks
        while (this.position < this.tokens.length) {
            const token = this.currentToken();
            console.log('Current token:', token);
            
            if (!token) break;
            
            // Skip whitespace and comments
            if (token.type === 'WHITESPACE' || token.type === 'COMMENT') {
                this.position++;
                continue;
            }
            
            // Check for end of variations block
            if (token.type === 'RBRACE') {
                this.position++;
                continue;
            }
            
            // Handle different types of statements
            if (token.type === 'FOREACH') {
                console.log('Found FOREACH statement');
                const forEachNode = this.parseForEach();
                console.log('Finished parsing FOREACH');
                statements.push(forEachNode);
                
                // Add variations from the FOREACH to the AST
                if (forEachNode.variations) {
                    ast.variations.push(...forEachNode.variations);
                }
            } else if (token.type === 'IDENTIFIER' && token.value === 'suits') {
                console.log('Found suits definition');
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
        
        ast.body = statements;
        console.log('Final AST variations:', ast.variations);
        console.log('Final AST:', JSON.stringify(ast, null, 2));
        
        return ast;
    }
    
    handleFunctionCallForEach(varName) {
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
            body: [] // Will be filled in by parseForEach
        };
    }
    
    handleSimpleForEach(varName, nextToken) {
        const rangeVar = this.eat(nextToken.type).value;
        
        // Check for complement operator
        let complement = false;
        this.skipWhitespaceAndComments();
        if (this.currentToken()?.type === 'COMPLEMENT') {
            this.eat('COMPLEMENT');
            this.skipWhitespaceAndComments();
            complement = true;
        }
        
        return {
            type: 'FOREACH',
            varName,
            rangeVar,
            complement,
            body: [] // Will be filled in by parseForEach
        };
    }
    
    handleNumericRangeForEach(varName) {
        const rangeStart = parseInt(this.eat('NUMBER').value, 10);
        this.skipWhitespaceAndComments();
        this.eat('RANGE');
        this.skipWhitespaceAndComments();
        const rangeEnd = parseInt(this.eat('NUMBER').value, 10);
        
        return {
            type: 'FOREACH_RANGE',
            varName,
            start: rangeStart,
            end: rangeEnd,
            body: [] // Will be filled in by parseForEach
        };
    }
    
    parseForEachBody() {
        const bodyTokens = [];
        let braceDepth = 1;
        let hasBraces = false;
        
        // Skip whitespace and comments
        this.skipWhitespaceAndComments();
        
        // Check if the body is enclosed in braces
        if (this.currentToken()?.type === 'LBRACE') {
            hasBraces = true;
            this.eat('LBRACE');
            this.skipWhitespaceAndComments();
        }
        
        // Collect tokens until the end of the body
        while (this.position < this.tokens.length) {
            const token = this.currentToken();
            
            // If we're in a braced body, look for the matching closing brace
            if (hasBraces) {
                if (token.type === 'LBRACE') {
                    braceDepth++;
                } else if (token.type === 'RBRACE') {
                    braceDepth--;
                    if (braceDepth === 0) {
                        this.position++; // Skip the closing brace
                        break;
                    }
                }
            } 
            // If we're not in a braced body, stop at the next END token
            else if (token.type === 'END' || token.type === 'ELSE' || token.type === 'ELIF' || token.type === 'EOF') {
                break;
            }
            
            bodyTokens.push(token);
            this.position++;
        }
        
        // If we're not in a braced body, skip the END token if present
        if (!hasBraces && this.currentToken()?.type === 'END') {
            this.eat('END');
        }
        
        console.log('parseForEachBody - bodyTokens:', JSON.stringify(bodyTokens, null, 2));
        
        // Process the body tokens to find function calls
        const body = this.parseBodyTokens(bodyTokens);
        console.log('parseForEachBody - parsed body:', JSON.stringify(body, null, 2));
        
        // Create variations for each function call in the body
        const variations = [];
        if (body.calls && body.calls.length > 0) {
            // For each function call, create a separate variation
            for (const call of body.calls) {
                variations.push({
                    calls: [call]
                });
            }
        }
        
        // If we found variations in the body, add them to the AST
        if (variations.length > 0) {
            if (!this.ast.variations) {
                this.ast.variations = [];
            }
            console.log('parseForEachBody - adding variations to AST:', variations);
            this.ast.variations.push(...variations);
            
            // Return the parsed body with variations
            return {
                type: 'FOREACH_BODY',
                variations: variations,
                tokens: bodyTokens
            };
        }
        
        console.log('parseForEachBody - no variations found in body');
        // Return an empty object if no variations were found
        return { 
            type: 'FOREACH_BODY', 
            variations: [], 
            tokens: bodyTokens 
        };
    }
    
    parseBodyTokens(tokens) {
        console.log('parseBodyTokens called with tokens:', tokens);
        const variations = [];
        let currentVariation = { calls: [] };
        
        // Process tokens to find function calls
        for (let i = 0; i < tokens.length; i++) {
            console.log(`Token ${i}:`, tokens[i]);
            const token = tokens[i];
            
            // Look for function calls (identifiers or pair keyword followed by parentheses)
            console.log(`Checking token ${i}: type=${token.type}, value=${token.value}, next token type=${i + 1 < tokens.length ? tokens[i + 1]?.type : 'undefined'}`);
            
            // Check if this is a function call (either IDENTIFIER or PAIR followed by LPAREN)
            const isFunctionCall = (token.type === 'IDENTIFIER' || token.type === 'PAIR') && 
                                 i + 1 < tokens.length && 
                                 tokens[i + 1]?.type === 'LPAREN';
            
            if (isFunctionCall) {
                console.log('Found function call!');
                
                const funcName = token.value;
                const args = [];
                let parenDepth = 0;
                
                // Skip the function name and opening parenthesis
                i += 2; 
                console.log('Starting to parse function arguments at token', i, tokens[i]);
                
                // Collect arguments until we find the matching closing parenthesis
                let currentArg = [];
                while (i < tokens.length) {
                    const t = tokens[i];
                    console.log('  Processing token:', t, 'currentArg:', currentArg, 'args:', args, 'parenDepth:', parenDepth);
                    
                    if (t.type === 'LPAREN') {
                        console.log('  Found LPAREN');
                        parenDepth++;
                        currentArg.push(t.value);
                    } else if (t.type === 'RPAREN') {
                        console.log('  Found RPAREN with parenDepth:', parenDepth);
                        if (parenDepth === 0) {
                            // Found the matching closing parenthesis
                            console.log('  Found matching RPAREN, finalizing args');
                            if (currentArg.length > 0) {
                                args.push(currentArg.join(''));
                            }
                            break;
                        } else {
                            console.log('  Nested RPAREN, decrementing depth');
                            parenDepth--;
                            currentArg.push(t.value);
                        }
                    } else if (t.type === 'COMMA' && parenDepth === 0) {
                        // End of an argument
                        console.log('  Found COMMA, finalizing current argument');
                        if (currentArg.length > 0) {
                            args.push(currentArg.join(''));
                            currentArg = [];
                        }
                    } else if (t.type !== 'WHITESPACE' && t.type !== 'COMMENT') {
                        console.log('  Adding to current argument:', t.value);
                        currentArg.push(t.value);
                    } else {
                        console.log('  Skipping token:', t.type);
                    }
                    
                    i++;
                }
                
                // Create the function call object
                const call = {
                    function: funcName,
                    args: args
                };
                
                console.log('Adding function call to current variation:', call);
                
                // Always add the call to the current variation
                currentVariation.calls.push(call);
                
                // If this is a pair call, add the current variation to variations
                if (funcName === 'pair') {
                    console.log('Found pair call, adding variation:', currentVariation);
                    // Create a deep copy of the current variation
                    variations.push(JSON.parse(JSON.stringify(currentVariation)));
                    // Reset for the next variation
                    currentVariation = { calls: [] };
                }
                
                // Decrement i since we'll increment it again in the loop
                i--;
            }
        }
        
        // Add the last variation if it has any calls
        if (currentVariation.calls.length > 0) {
            variations.push(currentVariation);
        }
        
        return { variations };
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
        console.log('Starting parseForEach()');
        this.eat('FOREACH');
        console.log('After eating FOREACH');
        
        // Handle optional whitespace and comments before LPAREN
        this.skipWhitespaceAndComments();
        
        // Make LPAREN optional for more flexible syntax
        if (this.currentToken()?.type === 'LPAREN') {
            console.log('Found LPAREN, eating it');
            this.eat('LPAREN');
        } else {
            console.log('No LPAREN found, continuing');
        }
        
        const varName = this.eat('IDENTIFIER').value;
        console.log(`Found variable name: ${varName}`);
        this.eat('IN');
        console.log('After eating IN');
        
        this.skipWhitespaceAndComments();
        const nextToken = this.currentToken();
        let result;
        
        // Parse the range expression first
        // Handle function calls like permutations(suits)
        if (nextToken.type === 'IDENTIFIER' && this.tokens[this.position + 1]?.type === 'LPAREN') {
            result = this.handleFunctionCallForEach(varName);
        } 
        // Handle simple variable iteration
        else if (nextToken.type === 'IDENTIFIER' || nextToken.type === 'SUITS') {
            result = this.handleSimpleForEach(varName, nextToken);
        } 
        // Handle numeric ranges (like 1..9)
        else if (nextToken.type === 'NUMBER') {
            result = this.handleNumericRangeForEach(varName);
        } else {
            throw new Error(`Unexpected token in foreach: ${JSON.stringify(nextToken)}`);
        }
        
        // Now parse the loop body and add it to the result
        const loopBody = this.parseForEachBody();
        console.log('parseForEach - loopBody:', JSON.stringify(loopBody, null, 2));
        
        // Keep the original tokens for reference
        result.body = loopBody.tokens || [];
        
        // Add variations to the result and AST
        if (loopBody.variations && loopBody.variations.length > 0) {
            result.variations = loopBody.variations;
            
            if (!this.ast.variations) {
                this.ast.variations = [];
            }
            console.log('Adding variations to AST:', loopBody.variations);
            this.ast.variations.push(...loopBody.variations);
        } else {
            console.log('No variations found in loop body');
            result.variations = [];
        }
        
        return result;
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
        // Check if we have a custom template with variations
        if (this.ast.variations && this.ast.variations.length > 0) {
            return this.generateFromAST();
        }
        
        // Fall back to hardcoded templates for backward compatibility
        const templateName = this.ast.metadata.name || '';
        const templateId = this.ast.metadata.catid || '';
        
        console.log(`Generating template: name=${templateName}, id=${templateId}`);
        
        if (templateName.includes('Like Kong Kong Pair') || templateName.includes('like-kong-kong-pair') || templateId === '1a') {
            this.generateKongKongPair();
        } else if (templateName.includes('Sequence Kong Kong') || templateName.includes('sequence-kong-kong') || templateId === '1c') {
            this.generateSequenceKongKong();
        } else if (templateName.includes('p3 k6 p6 k9') || templateName.includes('p3k6p6k9') || templateId === '1b') {
            this.generateP3K6P6K9();
        } else if (templateName.includes('Simple Test Template') || templateId === 'test1') {
            this.generateSimpleTemplate();
        } else {
            console.warn(`No generator found for template: name=${templateName}, id=${templateId}`);
        }
        
        return this.variations;
    }
    
    generateFromAST() {
        // Process each variation defined in the AST
        for (const variation of this.ast.variations) {
            const tiles = [];
            
            // Process each function call in the variation
            for (const call of variation.calls || []) {
                if (call.function === 'pair') {
                    const [suit, value] = call.args;
                    // Add two of the same tile for a pair (format as 'b1' instead of '1b')
                    tiles.push(`${suit}${value}`, `${suit}${value}`);
                    
                    // Set name and description based on the suit
                    let suitName = '';
                    if (suit === 'b') suitName = 'Bamboo';
                    else if (suit === 'c') suitName = 'Character';
                    else if (suit === 'd') suitName = 'Dot';
                    
                    const name = this.ast.metadata.name || 'Custom Template';
                    const description = `${suitName} ${value} pair`;
                    
                    // Add the generated variation
                    this.variations.push({
                        tiles: tiles,
                        name: name,
                        description: description
                    });
                    
                    // Reset tiles for the next variation
                    tiles.length = 0;
                } else if (call.function === 'pung') {
                    const [suit, value] = call.args;
                    // Add three of the same tile for a pung (format as 'b1' instead of '1b')
                    tiles.push(...Array(3).fill(`${suit}${value}`));
                } else if (call.function === 'kong') {
                    const [suit, value] = call.args;
                    // Add four of the same tile for a kong (format as 'b1' instead of '1b')
                    tiles.push(...Array(4).fill(`${suit}${value}`));
                } else if (call.function === 'quint') {
                    const [suit, value] = call.args;
                    // Add five of the same tile for a quint (format as 'b1' instead of '1b')
                    tiles.push(...Array(5).fill(`${suit}${value}`));
                }
            }
        }
        
        // If we didn't add any variations (e.g., no pair calls), add a default one
        if (this.variations.length === 0) {
            this.variations.push({
                tiles: [],
                name: this.ast.metadata.name || 'Custom Template',
                description: this.ast.metadata.description || 'A custom hand template'
            });
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
    
    generateSimpleTemplate() {
        // For the simple test template, we expect pairs in each suit (b, c, d)
        const suits = ['b', 'c', 'd'];
        
        for (const suit of suits) {
            // Create a variation with a pair in the current suit
            const variation = [
                `1${suit}`, `1${suit}`  // Pair of 1s in the current suit
            ];
            
            this.variations.push({
                tiles: variation,
                name: `Pair of 1s in ${suit.toUpperCase()} suit`,
                description: `A simple pair of 1s in the ${suit.toUpperCase()} suit`
            });
        }
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
        
        // Create output object with metadata and variations
        const output = {
            templates: [{
                metadata: {
                    id: ast.metadata.catid,
                    name: ast.metadata.name,
                    description: ast.metadata.description,
                    category: ast.metadata.category,
                    image: ast.metadata.image
                },
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

module.exports = { 
    compileMTL,
    MTLLexer,
    MTLParser,
    MTLGenerator
};
