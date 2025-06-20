const fs = require('fs');
const path = require('path');

class MTLLexer {
    constructor(source) {
        this.source = source;
        this.position = 0;
        this.tokens = [];
        this.currentLine = 1;
        this.currentColumn = 1;
        this.inMetadata = false; // Track if we're inside a metadata object
    }

    tokenize() {
        const keywords = {
            'metadata': 'METADATA',
            'variations': 'VARIATIONS',
            'foreach': 'FOREACH',
            'in': 'IN',
            'end': 'END',
            'pair': 'PAIR',
            'pung': 'PUNG',
            'kong': 'KONG',
            'single': 'SINGLE',
            'complement': 'COMPLEMENT',
            'permutations': 'PERMUTATIONS',
            'suits': 'SUITS',
            'true': 'BOOLEAN',
            'false': 'BOOLEAN',
            'null': 'NULL'
        };
        
        // Store original source for error reporting
        const originalSource = this.source;
        // Convert to lowercase for case-insensitive matching but keep original for values
        const lowerSource = this.source.toLowerCase();
        let inString = false;
        let inComment = false;
        let modifiedSource = '';
        
        // Pre-process the source to only lowercase non-string, non-comment parts
        for (let i = 0; i < this.source.length; i++) {
            const char = this.source[i];
            const prevChar = i > 0 ? this.source[i-1] : '';
            
            // Handle comments
            if (char === '/' && this.source[i+1] === '/' && !inString) {
                inComment = true;
                modifiedSource += '//';
                i++; // Skip the second slash
                continue;
            }
            
            if (char === '\n' && inComment) {
                inComment = false;
                modifiedSource += char;
                continue;
            }
            
            if (inComment) {
                modifiedSource += char;
                continue;
            }
            
            // Handle strings
            if ((char === '"' || char === "'") && (i === 0 || this.source[i-1] !== '\\')) {
                inString = !inString;
                modifiedSource += char;
                continue;
            }
            
            // Only lowercase non-string, non-comment characters
            modifiedSource += inString ? char : char.toLowerCase();
        }
        
        // Use the modified source for tokenization
        this.source = modifiedSource;
        
        console.log('Starting tokenization...');
        
        // Common metadata keys that should be treated as identifiers
        const metadataKeys = ['category', 'catid', 'image', 'name', 'description'];
        
        // Debug: Print the source being tokenized
        console.log('Source to tokenize:');
        console.log('---');
        console.log(this.source.substring(0, 200) + '...');
        console.log('---');

        while (this.position < this.source.length) {
            const char = this.source[this.position];
            
            // Skip whitespace but track newlines for metadata parsing
            if (this.isWhitespace(char)) {
                // If we're in a metadata object, treat newlines as separators
                if (char === '\n' && this.inMetadata) {
                    // If the last token wasn't a comma or opening brace, add a comma
                    const lastToken = this.tokens[this.tokens.length - 1];
                    if (lastToken && lastToken.type !== 'COMMA' && lastToken.type !== 'LBRACE') {
                        this.tokens.push({ type: 'COMMA', value: ',' });
                    }
                }
                this.position++;
                continue;
            }

            // Handle comments
            if (char === '/' && this.source[this.position + 1] === '/') {
                while (this.position < this.source.length && this.source[this.position] !== '\n') {
                    this.position++;
                }
                continue;
            }


            // Handle strings with single or double quotes
            if (char === '"' || char === "'") {
                const quoteChar = char;
                const isSingleQuote = (quoteChar === "'");
                let str = '';
                this.position++; // Skip opening quote
                
                while (this.position < this.source.length && this.source[this.position] !== quoteChar) {
                    // Handle escaped quotes
                    if (this.source[this.position] === '\\' && this.source[this.position + 1] === quoteChar) {
                        str += quoteChar;
                        this.position += 2; // Skip both backslash and quote
                    } else {
                        str += this.source[this.position];
                        this.position++;
                    }
                }
                
                if (this.position >= this.source.length) {
                    throw new SyntaxError(`Unterminated string starting with ${quoteChar}`);
                }
                
                this.position++; // Skip closing quote
                
                // Use 'SINGLE' type for single-quoted strings, 'STRING' for double-quoted
                const tokenType = isSingleQuote ? 'SINGLE' : 'STRING';
                this.tokens.push({ type: tokenType, value: str });
                
                // If we're in metadata and the next non-whitespace token is a newline or closing brace,
                // and the previous token was an identifier, then this is a key-value pair without an equals
                if (this.inMetadata) {
                    let nextPos = this.position;
                    let foundNonWhitespace = false;
                    
                    // Skip whitespace
                    while (nextPos < this.source.length && /\s/.test(this.source[nextPos])) {
                        nextPos++;
                    }
                    
                    // If next token is newline or closing brace, and previous token was identifier
                    if ((this.source[nextPos] === '\n' || this.source[nextPos] === '}') && 
                        this.tokens.length >= 2 && 
                        this.tokens[this.tokens.length - 2].type === 'IDENTIFIER') {
                        // Insert a virtual EQUALS token
                        this.tokens.splice(this.tokens.length - 1, 0, { type: 'EQUALS', value: '=' });
                        this.position = nextPos; // Skip the whitespace we just checked
                    }
                }
                
                continue;
            }

            // Handle numbers and ranges
            if (/[0-9]/.test(char)) {
                let num = '';
                while (/[0-9]/.test(this.source[this.position])) {
                    num += this.source[this.position];
                    this.position++;
                }
                // Check for range operator ..
                if (this.source[this.position] === '.' && this.source[this.position + 1] === '.') {
                    this.position += 2;
                    let endNum = '';
                    while (/[0-9]/.test(this.source[this.position])) {
                        endNum += this.source[this.position];
                        this.position++;
                    }
                    this.tokens.push({ type: 'RANGE', value: { start: parseInt(num, 10), end: parseInt(endNum, 10) } });
                } else {
                    this.tokens.push({ type: 'NUMBER', value: parseInt(num, 10) });
                }
                continue;
            }


            // Handle identifiers and keywords
            if (/[a-zA-Z_]/.test(char)) {
                let value = '';
                while (this.position < this.source.length && /[a-zA-Z0-9_-]/.test(this.source[this.position])) {
                    value += this.source[this.position++];
                }
                
                // Check if it's a keyword
                if (keywords[value]) {
                    this.tokens.push({ type: keywords[value], value });
                } else {
                    // Check for special identifiers like 'suits' which should be a keyword
                    if (value === 'suits') {
                        this.tokens.push({ type: 'SUITS', value });
                    } else {
                        this.tokens.push({ type: 'IDENTIFIER', value });
                    }
                }
                continue;
            }


            // Handle multi-character operators
            const doubleCharOps = {
                '==': 'EQ',
                '!=': 'NEQ',
                '<=': 'LTE',
                '>=': 'GTE',
                '..': 'RANGE',
                '->': 'ARROW'
            };

            // Check for multi-character operators
            if (this.position + 1 < this.source.length) {
                const twoChars = char + this.source[this.position + 1];
                if (doubleCharOps[twoChars]) {
                    this.tokens.push({ type: doubleCharOps[twoChars], value: twoChars });
                    this.position += 2;
                    continue;
                }
            }

            // Handle single-character tokens
            const singleCharTokens = {
                '=': 'EQUALS',
                '{': 'LBRACE',
                '}': 'RBRACE',
                '[': 'LBRACKET',
                ']': 'RBRACKET',
                '(': 'LPAREN',
                ')': 'RPAREN',
                ',': 'COMMA',
                ';': 'SEMICOLON',
                '.': 'DOT',
                '+': 'PLUS',
                '-': 'MINUS',
                '*': 'MUL',
                '/': 'DIV',
                '%': 'MOD',
                '!': 'NOT',
                '<': 'LT',
                '>': 'GT',
                '@': 'AT'
            };

            if (singleCharTokens[char]) {
                this.tokens.push({ type: singleCharTokens[char], value: char });
                this.position++;
                continue;
            }

            // Check for keywords (case insensitive) with both old and new syntax
            const checkKeyword = (keyword, tokenType) => {
                const keywordLower = keyword.toLowerCase();
                const nextChars = this.source.substring(this.position, this.position + keyword.length).toLowerCase();
                
                if (nextChars === keywordLower) {
                    // Check for new syntax: keyword { ... }
                    const newSyntaxMatch = this.source.substring(this.position + keyword.length).match(/^\s*\{/);
                    if (newSyntaxMatch) {
                        this.position += keyword.length; // Skip the keyword
                        this.tokens.push({ type: tokenType, value: keywordLower });
                        // Skip any whitespace after the keyword
                        while (this.position < this.source.length && /\s/.test(this.source[this.position])) {
                            this.position++;
                        }
                        return true;
                    }
                    
                    // Check for old syntax: keyword = { ... }
                    const oldSyntaxMatch = this.source.substring(this.position + keyword.length).match(/^\s*=/);
                    if (oldSyntaxMatch) {
                        this.position += keyword.length; // Skip the keyword
                        this.tokens.push({ type: tokenType, value: keywordLower });
                        // Skip any whitespace after the keyword
                        while (this.position < this.source.length && /\s/.test(this.source[this.position])) {
                            this.position++;
                        }
                        return true;
                    }
                }
                return false;
            };
            
            // Check for 'metadata' or 'variations' keywords
            if (char === 'm' || char === 'M') {
                if (checkKeyword('metadata', 'METADATA')) continue;
            } else if (char === 'v' || char === 'V') {
                if (checkKeyword('variations', 'VARIATIONS')) continue;
            }
            
            // Handle standalone colon
            if (char === ':') {
                this.tokens.push({ type: 'COLON', value: ':' });
                this.position++;
                continue;
            }
            
            // If we get here, it's an unexpected character
            throw new Error(`Unexpected character: ${char} at position ${this.position}`);
        }

        
        // Restore the original source for error reporting
        this.source = originalSource;
        
        if (process.env.DEBUG) {
            console.log('Tokens:');
            this.tokens.forEach((token, i) => {
                console.log(`${i}: ${JSON.stringify(token)}`);
            });
        }
        
        return this.tokens;
    }

    isWhitespace(char) {
        return /\s/.test(char);
    }
}

// Helper functions
const complement = (suit, suits) => suits.filter(s => s !== suit);

const permutations = (arr) => {
    if (arr.length <= 1) return [arr];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const current = arr[i];
        const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
        for (const perm of permutations(remaining)) {
            result.push([current, ...perm]);
        }
    }
    return result;
};


class MTLParser {
    constructor(tokens, lexer) {
        this.tokens = tokens;
        this.lexer = lexer; // Store lexer reference
        this.position = 0;
        this.ast = {
            type: 'Program',
            metadata: {},
            body: [],
            variations: []
        };
        this.scope = {}; // For variable scoping
    }

    currentToken() {
        return this.tokens[this.position];
    }

    eat(type, value = null) {
        const token = this.currentToken();
        if (!token) {
            throw new Error(`Unexpected end of input, expected ${type}`);
        }
        if (token.type !== type || (value !== null && token.value !== value)) {
            throw new Error(`Expected ${type}${value ? ' ' + value : ''}, got ${token.type} ${token.value}`);
        }
        this.position++;
        return token;
    }

    skipWhitespaceAndComments() {
        while (this.currentToken() && this.currentToken().type === 'COMMENT') {
            this.position++;
        }
        while (this.currentToken() && /\s/.test(this.currentToken().value)) {
            this.position++;
        }
    }
    
    getCurrentLineIndent() {
        if (this.position >= this.tokens.length) return 0;
        
        // Walk backwards to find the start of the line
        let pos = this.position;
        while (pos > 0) {
            const token = this.tokens[pos - 1];
            if (token.type === 'NEWLINE') {
                break;
            }
            pos--;
        }
        
        // Count leading whitespace
        let indent = 0;
        while (pos < this.tokens.length) {
            const token = this.tokens[pos];
            if (token.type === 'WHITESPACE') {
                // Count spaces and tabs (tabs count as 4 spaces for indent calculation)
                indent += token.value === '\t' ? 4 : 1;
                pos++;
            } else {
                break;
            }
        }
        
        return indent;
    }
    
    skipToNextLine() {
        // Skip to the end of the current line
        while (this.position < this.tokens.length && this.tokens[this.position].type !== 'NEWLINE') {
            this.position++;
        }
        
        // Skip the newline itself
        if (this.position < this.tokens.length && this.tokens[this.position].type === 'NEWLINE') {
            this.position++;
        }
    }

    parseMetadata() {
        console.log('Parsing metadata section');
        this.eat('METADATA');
        this.skipWhitespaceAndComments();
        
        // Handle optional equals sign (for backward compatibility with test files)
        if (this.currentToken().type === 'EQUALS') {
            this.eat('EQUALS');
            this.skipWhitespaceAndComments();
        }
        
        // Expect opening brace
        if (this.currentToken().type !== 'LBRACE') {
            throw new Error(`Expected '{' after metadata, got ${this.currentToken().type}`);
        }
        this.eat('LBRACE');
        
        // Parse the metadata key-value pairs
        this.parseBraceMetadata();
        
        console.log('Finished parsing metadata');
    }
    
    parseVariations() {
        this.eat('VARIATIONS');
        
        // Handle optional equals sign
        if (this.currentToken().type === 'EQUALS') {
            this.eat('EQUALS');
            // Skip any whitespace after =
            this.skipWhitespaceAndComments();
        }
        
        // Check if we have a colon, newline, or brace after 'variations'
        const nextToken = this.currentToken();
        if (nextToken.type === 'COLON') {
            this.eat('COLON');
            this.eat('NEWLINE');
        } else if (nextToken.type === 'NEWLINE') {
            this.eat('NEWLINE');
        } else if (nextToken.type === 'LBRACE') {
            // Handle variations = { ... } syntax
            this.eat('LBRACE');
            // Skip any whitespace after {
            this.skipWhitespaceAndComments();
        } else {
            throw new Error(`Expected ':', '=', newline, or '{' after 'variations', got ${nextToken.type}`);
        }
        
        // Parse the variations body
        const variations = [];
        this.ast.variations = variations;
        
        // Skip any initial whitespace/comments
        this.skipWhitespaceAndComments();
        
        // Parse variable assignments first (like 'suits = (b, c, d)')
        while (this.position < this.tokens.length) {
            const token = this.currentToken();
            
            // Check for end of variations block
            if (token.type === 'RBRACE') {
                this.eat('RBRACE');
                break;
            }
            
            // Skip empty lines
            if (token.type === 'NEWLINE') {
                this.eat('NEWLINE');
                continue;
            }
            
            // Parse variable assignments
            if (token.type === 'IDENTIFIER') {
                const varName = token.value;
                this.eat('IDENTIFIER');
                
                if (this.currentToken().type === 'EQUALS') {
                    this.eat('EQUALS');
                    this.skipWhitespaceAndComments();
                    
                    // Parse the value (could be an array, list, or expression)
                    const valueToken = this.currentToken();
                    if (valueToken.type === 'LPAREN') {
                        // Handle parenthesized list
                        this.eat('LPAREN');
                        const items = [];
                        
                        while (this.currentToken().type !== 'RPAREN') {
                            const itemToken = this.currentToken();
                            if (itemToken.type === 'IDENTIFIER') {
                                items.push(itemToken.value);
                                this.eat('IDENTIFIER');
                                
                                if (this.currentToken().type === 'COMMA') {
                                    this.eat('COMMA');
                                    this.skipWhitespaceAndComments();
                                }
                            } else {
                                throw new Error(`Expected identifier in list, got ${itemToken.type}`);
                            }
                        }
                        
                        this.eat('RPAREN');
                        this.scope[varName] = items;
                    } else {
                        throw new Error(`Expected '(', got ${valueToken.type}`);
                    }
                    
                    // Skip to the next line
                    this.skipToNextLine();
                    continue;
                }
            }
            
            // Parse foreach statements
            if (token.type === 'FOREACH') {
                this.parseForEach();
                continue;
            }
            
            // If we get here, it's an unexpected token
            throw new Error(`Unexpected token in variations block: ${JSON.stringify(token)}`);
        }
    }
    
    parseBraceMetadata() {
        this.lexer.inMetadata = true;
        try {
            while (true) {
                this.skipWhitespaceAndComments();
                const keyToken = this.currentToken();
                
                // Check for end of metadata section
                if (keyToken.type === 'RBRACE') {
                    this.eat('RBRACE');
                    this.lexer.inMetadata = false;
                    return;
                }
                
                // Expect an identifier for the key
                if (keyToken.type !== 'IDENTIFIER') {
                    throw new Error(`Expected identifier in metadata, got: ${JSON.stringify(keyToken)}`);
                }
                
                const key = keyToken.value;
                this.eat('IDENTIFIER');
                this.skipWhitespaceAndComments();
                
                // Handle optional equals sign
                if (this.currentToken()?.type === 'EQUALS') {
                    this.eat('EQUALS');
                    this.skipWhitespaceAndComments();
                }
                
                // Parse the value
                const valueToken = this.currentToken();
                if (!valueToken) {
                    throw new Error(`Unexpected end of input while parsing metadata value for key '${key}'`);
                }
                
                let value;
                if (valueToken.type === 'STRING') {
                    value = valueToken.value;
                    this.eat('STRING');
                } else if (valueToken.type === 'NUMBER') {
                    value = parseFloat(valueToken.value);
                    this.eat('NUMBER');
                } else if (valueToken.type === 'BOOLEAN') {
                    value = valueToken.value === 'true';
                    this.eat('BOOLEAN');
                } else if (valueToken.type === 'NULL') {
                    value = null;
                    this.eat('NULL');
                } else if (valueToken.type === 'IDENTIFIER') {
                    // For backward compatibility, treat unquoted strings as strings
                    value = valueToken.value;
                    this.eat('IDENTIFIER');
                } else if (valueToken.type === 'LBRACKET') {
                    // Handle array values
                    value = this.parseArray();
                } else if (valueToken.type === 'LPAREN') {
                    // Handle parenthesized lists
                    this.eat('LPAREN');
                    value = [];
                    while (this.currentToken()?.type !== 'RPAREN') {
                        const item = this.currentToken().value;
                        this.eat('IDENTIFIER');
                        value.push(item);
                        
                        this.skipWhitespaceAndComments();
                        if (this.currentToken()?.type === 'COMMA') {
                            this.eat('COMMA');
                            this.skipWhitespaceAndComments();
                        }
                    }
                    this.eat('RPAREN');
                } else {
                    throw new Error(`Unexpected token type '${valueToken.type}' for metadata value '${key}'`);
                }
                
                // Store the value in metadata
                this.ast.metadata[key] = value;
                
                // Skip optional comma or newline
                this.skipWhitespaceAndComments();
                if (this.currentToken()?.type === 'COMMA') {
                    this.eat('COMMA');
                } else if (this.currentToken()?.type === 'NEWLINE') {
                    this.eat('NEWLINE');
                }
                
                // Check for end of metadata section or next key
                const nextToken = this.currentToken();
                if (!nextToken || nextToken.type === 'RBRACE') {
                    continue;
                }
                
                if (nextToken.type === 'EQUALS' && this.ast.metadata) {
                    // If we're in the variations section, this is a variable assignment
                    // and we should stop parsing metadata
                    return;
                }
            }
        } catch (e) {
            this.lexer.inMetadata = false;
            throw e;
        }
    }
    
    parseIndentedMetadata() {
        // Skip any leading whitespace/comments
        this.skipWhitespaceAndComments();
        
        // Keep track of the initial indentation level
        const initialIndent = this.getCurrentLineIndent();
        
        while (true) {
            // Skip any whitespace and comments at the start of the line
            this.skipWhitespaceAndComments();
            
            // Check if we've reached the end of the metadata block
            const token = this.currentToken();
            if (!token || token.type === 'VARIATIONS' || this.getCurrentLineIndent() <= initialIndent) {
                break;
            }
            
            // Parse key (can be any identifier)
            if (token.type !== 'IDENTIFIER') {
                throw new Error(`Expected identifier in metadata, got: ${JSON.stringify(token)}`);
            }
            
            const key = token.value;
            this.eat('IDENTIFIER');
            
            // Parse equals sign (only = is allowed in indented style)
            if (this.currentToken().type === 'EQUALS') {
                this.position++;
            } else {
                throw new Error(`Expected = after metadata key, got ${this.currentToken().type}`);
            }
            
            // Skip any whitespace after =
            this.skipWhitespaceAndComments();
            
            // Parse value (can be string, number, or identifier)
            const valueToken = this.currentToken();
            let value;
            
            if (valueToken.type === 'STRING') {
                value = valueToken.value;
                this.eat('STRING');
            } else if (valueToken.type === 'NUMBER') {
                value = parseFloat(valueToken.value);
                this.eat('NUMBER');
            } else if (valueToken.type === 'BOOLEAN') {
                value = valueToken.value === 'true';
                this.eat('BOOLEAN');
            } else if (valueToken.type === 'NULL') {
                value = null;
                this.eat('NULL');
            } else if (valueToken.type === 'IDENTIFIER') {
                value = valueToken.value;
                this.eat('IDENTIFIER');
            } else {
                // Try to parse as a value with potential spaces
                let valueStr = '';
                while (this.position < this.tokens.length) {
                    const nextToken = this.tokens[this.position];
                    if (nextToken.type === 'NEWLINE' || 
                        nextToken.type === 'COMMENT' ||
                        (nextToken.type === 'WHITESPACE' && 
                         this.position + 1 < this.tokens.length && 
                         this.tokens[this.position + 1].type === 'NEWLINE')) {
                        break;
                    }
                    valueStr += nextToken.value || '';
                    this.position++;
                }
                value = valueStr.trim();
            }
            
            if (value === undefined) {
                throw new Error(`Could not parse metadata value for key ${key}`);
            }
            
            // Store the metadata
            this.ast.metadata[key] = value;
            
            // Skip to next line
            this.skipToNextLine();
        }
    }
    
    parseValue() {
        this.skipWhitespaceAndComments();
        const token = this.currentToken();
        
        if (token.type === 'STRING') {
            this.eat('STRING');
            return token.value;
        } else if (token.type === 'NUMBER') {
            this.eat('NUMBER');
            return token.value;
        } else if (token.type === 'BOOLEAN') {
            this.eat('BOOLEAN');
            return token.value === 'true';
        } else if (token.type === 'NULL') {
            this.eat('NULL');
            return null;
        } else if (token.type === 'IDENTIFIER') {
            this.eat('IDENTIFIER');
            return token.value;
        } else if (token.type === 'LBRACE') {
            return this.parseObject();
        } else if (token.type === 'LBRACKET' || token.type === 'LPAREN') {
            return this.parseArray();
        }
        
        throw new Error(`Unexpected token in value: ${JSON.stringify(token)}`);
    }
    
    parseObject() {
        const obj = {};
        this.eat('LBRACE');
        
        while (true) {
            this.skipWhitespaceAndComments();
            const keyToken = this.currentToken();
            if (keyToken.type === 'RBRACE') break;
            
            const key = keyToken.value;
            this.eat('IDENTIFIER');
            
            // Handle both = and : as key-value separators
            if (this.currentToken().type === 'EQUALS' || this.currentToken().type === 'COLON') {
                this.position++;
            } else {
                throw new Error(`Expected = or : after object key, got ${this.currentToken().type}`);
            };
            
            const value = this.parseValue();
            obj[key] = value;
            
            const nextToken = this.currentToken();
            if (nextToken?.type === 'COMMA') {
                this.eat('COMMA');
            } else if (nextToken?.type !== 'RBRACE') {
                throw new Error('Expected comma or closing brace after object value');
            }
        }
        
        this.eat('RBRACE');
        return obj;
    }
    
    parseArray() {
        const isParen = this.currentToken().type === 'LPAREN';
        this.position++; // Skip [ or (
        
        const arr = [];
        
        while (true) {
            this.skipWhitespaceAndComments();
            const token = this.currentToken();
            if ((isParen && token.type === 'RPAREN') || (!isParen && token.type === 'RBRACKET')) {
                break;
            }
            
            const value = this.parseValue();
            arr.push(value);
            
            const nextToken = this.currentToken();
            if (nextToken.type === 'COMMA') {
                this.eat('COMMA');
            } else if ((isParen && nextToken.type !== 'RPAREN') || (!isParen && nextToken.type !== 'RBRACKET')) {
                throw new Error('Expected comma or closing bracket in array');
            }
        }
        
        this.position++; // Skip ) or ]
        return arr;
    }

    parseVariations() {
        console.log('Starting to parse variations section');
        
        // Skip any whitespace after the VARIATIONS token
        this.skipWhitespaceAndComments();
        
        // Check if we're using brace syntax or colon/newline syntax
        const useBraces = this.currentToken().type === 'LBRACE';
        
        if (useBraces) {
            console.log('  Using brace syntax for variations');
            this.eat('LBRACE');
        } else {
            console.log('  Using colon/newline syntax for variations');
            // For non-brace syntax, we expect a newline after the colon
            if (this.currentToken().type === 'COLON') {
                this.eat('COLON');
            }
            // Skip any whitespace including newlines
            this.skipWhitespaceAndComments();
        }
        
        // Initialize variations array in AST if not exists
        if (!this.ast.variations) {
            this.ast.variations = [];
        }
        
        // Parse all statements in the variations block
        while (true) {
            this.skipWhitespaceAndComments();
            const token = this.currentToken();
            
            // Check for end of variations block
            if (!token || (useBraces && token.type === 'RBRACE') || 
                (!useBraces && token.type === 'END')) {
                break;
            }
            
            try {
                // Parse the statement
                this.parseStatement();
                
                // If we have a current variation, add it to the AST
                if (this.currentVariation) {
                    this.ast.variations.push(this.currentVariation);
                    this.currentVariation = null;
                }
            } catch (error) {
                console.error('Error parsing statement:', error);
                throw error;
            }
            
            // Skip any whitespace or comments between statements
            this.skipWhitespaceAndComments();
            
            // Check for semicolon after each statement
            if (this.currentToken()?.type === 'SEMICOLON') {
                this.eat('SEMICOLON');
            }
        }
        
        // Consume the closing token
        if (useBraces) {
            this.eat('RBRACE');
        } else if (this.currentToken()?.type === 'END') {
            this.eat('END');
            if (this.currentToken()?.type === 'SEMICOLON') {
                this.eat('SEMICOLON');
            }
        }
        
        console.log(`Parsed ${this.ast.variations.length} variations`);
    }
    
    parseStatement() {
        const token = this.currentToken();
        if (!token) {
            throw new Error('Unexpected end of input in statement');
        }
        
        console.log(`Parsing statement starting with: ${token.type} (${token.value})`);
        
        // Skip empty statements (just a semicolon)
        if (token.type === 'SEMICOLON') {
            console.log('  Found empty statement (;)');
            this.eat('SEMICOLON');
            return;
        }
        
        // Handle variable assignment
        if (token.type === 'IDENTIFIER' && this.lookahead()?.type === 'EQUALS') {
            const varName = token.value;
            console.log(`  Found variable assignment: ${varName} = ...`);
            
            this.eat('IDENTIFIER');
            this.eat('EQUALS');
            
            const value = this.parseExpression();
            console.log(`  Assigned value to ${varName}:`, value);
            
            this.scope[varName] = value;
            
            // Semicolon is optional
            if (this.currentToken()?.type === 'SEMICOLON') {
                this.eat('SEMICOLON');
            }
        }
    }
    
    parseForEach() {
        console.log('Parsing foreach loop');
        this.eat('FOREACH');
        this.eat('LPAREN');
        
        // Parse loop variable(s)
        const varNames = [];
        let isDestructuring = false;
        
        // First get the initial identifier
        const firstVar = this.eat('IDENTIFIER').value;
        
        // Check if this is a destructuring assignment (var1, var2 = ...)
        if (this.currentToken().type === 'COMMA') {
            isDestructuring = true;
            varNames.push(firstVar);
            
            // Parse additional variables in the destructuring pattern
            while (this.currentToken().type === 'COMMA') {
                this.eat('COMMA');
                // Check if there's another identifier or if we've reached the end
                if (this.currentToken().type === 'IDENTIFIER') {
                    varNames.push(this.eat('IDENTIFIER').value);
                } else {
                    break;
                }
            }
            
            // Expect an equals sign after the destructuring pattern
            if (this.currentToken().type !== 'EQUALS') {
                throw new Error(`Expected = after destructuring pattern, got ${this.currentToken().type}`);
            }
            this.eat('EQUALS');
            
            // The first variable is before the first comma, so we need to add it to the beginning
            varNames.unshift(this.tokens[this.position - 2].value);
            
            console.log(`Destructuring assignment with variables: ${varNames.join(', ')}`);
        } else {
            // Simple variable: a in ...
            varNames.push(firstVar);
            console.log(`Simple loop variable: ${firstVar}`);
        }
        
        // Parse 'in' keyword
        this.eat('IN');
        
        // Parse the iterable expression (e.g., (b, c, d) or range(1, 10) or someArray)
        console.log('Parsing iterable expression...');
        const iterable = this.parseExpression();
        console.log('Iterable expression result:', iterable);
        
        // Expect closing parenthesis
        this.eat('RPAREN');
        
        // Parse the loop body
        const useBraces = this.currentToken().type === 'LBRACE';
        const startPos = this.position;
        let endPos = this.position;
    
        if (useBraces) {
            // For brace-delimited blocks, find the matching closing brace
            this.eat('LBRACE');
            let braceCount = 1;
            
            while (endPos < this.tokens.length && braceCount > 0) {
                const token = this.tokens[endPos];
                if (token.type === 'LBRACE') braceCount++;
                if (token.type === 'RBRACE') braceCount--;
                if (braceCount === 0) break;
                endPos++;
            }
            
            if (braceCount !== 0) {
                throw new Error('Unclosed brace in foreach loop');
            }
            
            console.log(`Found loop body from ${startPos} to ${endPos} (${endPos - startPos} tokens)`);
        } else {
            // For single-statement loops, find the end of the statement
            while (endPos < this.tokens.length && this.tokens[endPos].type !== 'SEMICOLON') {
                endPos++;
            }
        }
    
        // Save the current scope
        const oldScope = { ...this.scope };
        
        console.log(`Processing foreach loop with iterable:`, iterable);
        
        // Process the loop body for each item in the iterable
        if (Array.isArray(iterable)) {
            console.log(`Loop will run ${iterable.length} times`);
            
            for (let i = 0; i < iterable.length; i++) {
                const item = iterable[i];
                console.log(`Iteration ${i + 1}/${iterable.length}, item:`, item);
                
                // Set the loop variable in the scope
                if (isDestructuring && Array.isArray(item)) {
                    // Handle destructuring assignment (a, b, c) = [1, 2, 3]
                    console.log(`  Destructuring assignment: ${varNames.join(', ')} =`, item);
                    
                    for (let j = 0; j < Math.min(varNames.length, item.length); j++) {
                        const varName = varNames[j];
                        const varValue = item[j];
                        console.log(`    ${varName} =`, varValue);
                        this.scope[varName] = varValue;
                    }
                } else {
                    // Simple assignment: a in [1, 2, 3]
                    console.log(`  Simple assignment: ${varNames[0]} =`, item);
                    this.scope[varNames[0]] = item;
                }
                
                // Create a new parser for the loop body with the current scope
                const bodyTokens = this.tokens.slice(startPos, endPos);
                const bodyParser = new MTLParser(bodyTokens, this.lexer);
                
                // Clone the current scope for the body parser
                bodyParser.scope = { ...this.scope };
                bodyParser.ast = this.ast;
                
                console.log('  Parsing loop body...');
                
                try {
                    // Parse the loop body
                    while (bodyParser.position < bodyParser.tokens.length) {
                        bodyParser.parseStatement();
                        bodyParser.skipWhitespaceAndComments();
                    }
                    console.log('  Loop body parsed successfully');
                } catch (error) {
                    console.error('Error in loop body:', error);
                    throw error;
                }
            }
        } else {
            console.warn('Foreach iterable is not an array:', iterable);
        }
        
        // Restore the original scope
        this.scope = oldScope;
        
        // Skip past the loop body in the main parser
        this.position = endPos;
        if (useBraces) {
            this.eat('RBRACE');
        } else if (this.currentToken()?.type === 'SEMICOLON') {
            this.eat('SEMICOLON');
        } else {
            this.eat('END');
            this.eat('SEMICOLON');
        }
    }

    parseTileCall() {
        const tileType = this.currentToken().type.toLowerCase();
        console.log(`Parsing tile call: ${tileType}`);
        
        // Eat the tile type (PAIR, KONG, etc.)
        this.eat(tileType.toUpperCase());
        
        // Expect an opening parenthesis
        this.eat('LPAREN');
        
        const args = [];
        
        // Parse arguments until we hit a closing parenthesis
        while (true) {
            this.skipWhitespaceAndComments();
            const token = this.currentToken();
            
            // Check for end of arguments
            if (token.type === 'RPAREN') break;
            
            // Handle special case for 'F' (flowers)
            if (token.type === 'IDENTIFIER' && token.value.toUpperCase() === 'F') {
                console.log('  Found flower tile');
                args.push({ type: 'flower' });
                this.eat('IDENTIFIER');
            } else {
                // Parse the argument expression
                const value = this.parseExpression();
                console.log(`  Parsed argument:`, value);
                args.push(value);
            }
            
            // Check for comma or closing parenthesis
            const nextToken = this.currentToken();
            if (nextToken.type === 'COMMA') {
                this.eat('COMMA');
            } else if (nextToken.type !== 'RPAREN') {
                throw new Error(`Expected comma or closing parenthesis in tile call, got ${nextToken.type}`);
            }
        }
        
        // Eat the closing parenthesis
        this.eat('RPAREN');
        
        // Return the tile call node
        return {
            type: 'TileCall',
            tileType,
            arguments: args
        };
    }

    parseFunctionCall() {
        const funcName = this.currentToken().value;
        console.log(`Parsing function call: ${funcName}`);
        
        // Eat the function name
        this.eat('IDENTIFIER');
        
        // Expect an opening parenthesis
        this.eat('LPAREN');
        
        const args = [];
        
        // Parse arguments until we hit a closing parenthesis
        while (true) {
            this.skipWhitespaceAndComments();
            const token = this.currentToken();
            
            // Check for end of arguments
            if (token.type === 'RPAREN') break;
            
            // Parse the argument expression
            const arg = this.parseExpression();
            console.log(`  Parsed argument:`, arg);
            args.push(arg);
            
            // Check for comma or closing parenthesis
            const nextToken = this.currentToken();
            if (nextToken.type === 'COMMA') {
                this.eat('COMMA');
            } else if (nextToken.type !== 'RPAREN') {
                throw new Error(`Expected comma or closing parenthesis in ${funcName}() call, got ${nextToken.type}`);
            }
        }
        
        // Eat the closing parenthesis
        this.eat('RPAREN');
        
        console.log(`  Calling ${funcName} with arguments:`, args);
        
        try {
            // Handle built-in functions
            if (funcName === 'range') {
                if (args.length !== 2) {
                    throw new Error(`range() expects 2 arguments, got ${args.length}`);
                }
                const [start, end] = args.map(arg => {
                    if (typeof arg !== 'number') {
                        throw new Error(`range() arguments must be numbers, got ${typeof arg}`);
                    }
                    return arg;
                });
                
                // Generate range array
                const result = [];
                for (let i = start; i <= end; i++) {
                    result.push(i);
                }
                return result;
                
            } else if (funcName === 'suits') {
                // Return all suits
                return ['bam', 'crack', 'dot'];
                
            } else if (funcName === 'complement') {
                // Return complement of a suit
                if (args.length !== 2) {
                    throw new Error(`complement() expects 2 arguments, got ${args.length}`);
                }
                const [suit, suits] = args;
                return complement(suit, suits);
                
            } else if (funcName === 'permutations') {
                // Return all permutations of an array
                if (args.length !== 1) {
                    throw new Error(`permutations() expects 1 argument, got ${args.length}`);
                }
                return permutations(args[0]);
                
            } else {
                throw new Error(`Unknown function: ${funcName}`);
            }
            
        } catch (error) {
            console.error(`Error in ${funcName}() call:`, error);
            throw error;
        }
    }
    
    lookahead(count = 1) {
        return this.tokens[this.position + count];
    }
    
    parseArray() {
        const isParen = this.currentToken().type === 'LPAREN';
        const openToken = isParen ? 'LPAREN' : 'LBRACKET';
        const closeToken = isParen ? 'RPAREN' : 'RBRACKET';
        
        console.log(`Parsing ${isParen ? 'parenthesized' : 'array'} expression`);
        this.eat(openToken);
        
        const elements = [];
        let elementCount = 0;
        
        // Handle empty array/parens
        if (this.currentToken().type === closeToken) {
            console.log('  Empty array/parens');
            this.eat(closeToken);
            return elements;
        }
        
        // Parse array elements
        while (true) {
            this.skipWhitespaceAndComments();
            
            // Check for end of array
            if (this.currentToken().type === closeToken) {
                break;
            }
            
            // Parse the element expression
            elementCount++;
            console.log(`  Parsing element ${elementCount}`);
            
            const element = this.parseExpression();
            elements.push(element);
            
            console.log(`  Added element ${elementCount}:`, element);
            
            // Check for comma or end of array
            this.skipWhitespaceAndComments();
            const nextToken = this.currentToken();
            
            if (nextToken.type === 'COMMA') {
                this.eat('COMMA');
                console.log('  Found comma, expecting more elements');
            } else if (nextToken.type !== closeToken) {
                throw new Error(
                    `Expected comma or ${closeToken} after element ${elementCount} in array, ` +
                    `got ${nextToken.type} (${JSON.stringify(nextToken)})`
                );
            }
        }
        
        console.log(`  End of array with ${elements.length} elements`);
        this.eat(closeToken);
        
        return elements;
    }

    parse() {
        console.log('Starting parse...');
        
        // Initialize AST with the structure expected by the test
        this.ast = {
            type: 'Program',
            metadata: {},
            body: [],
            variations: []
        };
        
        // Skip any initial whitespace or comments
        this.skipWhitespaceAndComments();
            
        // First token should be 'metadata' (case insensitive)
        const firstToken = this.currentToken();
        if (!firstToken || firstToken.type !== 'METADATA') {
            throw new Error('Expected "metadata" at the beginning of the file');
        }

        console.log('Found metadata section');
        this.eat('METADATA');
        this.skipWhitespaceAndComments();
        
        // Handle optional equals sign (old syntax)
        if (this.currentToken()?.type === 'EQUALS') {
            this.eat('EQUALS');
            this.skipWhitespaceAndComments();
        }
        
        // Expect an opening brace after metadata
        if (this.currentToken()?.type !== 'LBRACE') {
            throw new Error(`Expected '{' after 'metadata', got ${this.currentToken()?.type}`);
        }
        
        // Eat the opening brace
        this.eat('LBRACE');
        this.skipWhitespaceAndComments();
        
        // Parse metadata section
        this.parseBraceMetadata();
        
        // Expect closing brace for metadata
        if (this.currentToken()?.type !== 'RBRACE') {
            throw new Error(`Expected '}' after metadata section, got ${this.currentToken()?.type}`);
        }
        this.eat('RBRACE');
        
        console.log('Metadata parsed successfully:', this.ast.metadata);

        // Skip whitespace and comments after metadata
        this.skipWhitespaceAndComments();

        // Look for 'variations' keyword (case insensitive)
        const variationsToken = this.currentToken();
        console.log('Current token after metadata:', variationsToken);
        
        // Check if we have the 'variations' token
        if (!variationsToken || variationsToken.type !== 'VARIATIONS') {
            throw new Error(`Expected "variations" after metadata, got ${variationsToken ? variationsToken.type : 'EOF'}`);
        }
        
        console.log('Found variations section');
        this.eat('VARIATIONS');
        this.skipWhitespaceAndComments();
        
        // Handle optional colon or equals (old syntax)
        const nextToken = this.currentToken();
        if (nextToken?.type === 'COLON' || nextToken?.type === 'EQUALS') {
            this.eat(nextToken.type);
            this.skipWhitespaceAndComments();
        }
        
        // Expect an opening brace after variations
        if (this.currentToken()?.type !== 'LBRACE') {
            throw new Error(`Expected '{' after 'variations', got ${this.currentToken()?.type}`);
        }
        
        // Eat the opening brace
        this.eat('LBRACE');
        this.skipWhitespaceAndComments();
        
        // Parse variations section
        this.parseVariations();
        
        // Expect closing brace for variations
        if (this.currentToken()?.type !== 'RBRACE') {
            throw new Error(`Expected '}' after variations section, got ${this.currentToken()?.type}`);
        }
        this.eat('RBRACE');
            
        // Copy variations to the AST
        this.ast.variations = [...(this.ast.variations || [])];

        // Parse the rest of the template body if there are any tokens left
        if (this.position < this.tokens.length) {
            this.parseBody();
        }

        // Check if we've consumed all tokens
        if (this.position < this.tokens.length - 1) {
            const token = this.currentToken();
            if (token && token.type !== 'EOF') {
                console.warn(`Unexpected tokens remaining at position ${this.position}:`, token);
                throw new Error(`Unexpected token: ${token.type} (${token.value}) at line ${token.line}, column ${token.column}`);
            }
        }

        console.log('Parse completed successfully');

        return this.ast;
    }
}

// Compile an MTL file to JSON
// @param {string} inputPath Path to the input .mtl file
// @param {string} outputPath Path to the output .json file
// @returns {Object} The compiled AST
function compileMTL(inputPath, outputPath) {
    try {
        // Read input file
        const source = fs.readFileSync(inputPath, 'utf8');
        
        // Tokenize
        const lexer = new MTLLexer(source);
        const tokens = lexer.tokenize();
        
        // Parse
        const parser = new MTLParser(tokens, lexer);
        const ast = parser.parse();
        
        // Write output
        if (outputPath) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, JSON.stringify(ast, null, 2));
            console.log(`Successfully compiled ${inputPath} to ${outputPath}`);
        }
        
        return ast;
    } catch (error) {
        console.error('Compilation failed:', error);
        throw error;
    }
}

// Export the public API
module.exports = {
    MTLLexer,
    MTLParser,
    compileMTL
};

// Run the compiler if this file is executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node clean-compiler.js <input.mtl> <output.json>');
        process.exit(1);
    }
    
    const inputPath = args[0];
    const outputPath = args[1];
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    compileMTL(inputPath, outputPath);
};
