// MTL Parser for Mahjong Template Language
// This parser handles the MTL syntax and generates an AST

class MTLParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
        this.ast = {
            metadata: {},
            variations: [],
            code: []
        };
    }

    // Check if we've reached the end of the token stream
    isAtEnd() {
        return this.current >= this.tokens.length || 
               this.tokens[this.current].type === 'EOF';
    }

    // Get the current token without consuming it
    peek() {
        if (this.isAtEnd()) return null;
        return this.tokens[this.current];
    }

    // Get the previous token
    previous() {
        if (this.current === 0) return null;
        return this.tokens[this.current - 1];
    }

    // Check if the current token matches any of the given types
    match(...types) {
        if (this.isAtEnd()) return false;
        const current = this.peek();
        if (types.includes(current.type)) {
            this.current++;
            return true;
        }
        return false;
    }

    // Consume the current token if it matches the expected type, otherwise throw an error
    consume(type, message) {
        if (this.check(type)) {
            return this.advance();
        }
        throw new Error(message || `Expected ${type}`);
    }

    // Check if the current token matches the given type
    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    // Move to the next token and return the previous one
    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    // Skip newlines and comments
    skipNewlines() {
        while (this.match('NEWLINE') || this.check('COMMENT')) {
            if (this.check('COMMENT')) this.advance();
        }
    }

    // Parse the entire MTL document
    parse() {
        try {
            // Parse metadata first
            this.parseMetadata();
            
            // Parse variations if present
            if (!this.isAtEnd()) {
                this.parseVariations();
            }
            
            return this.ast;
        } catch (error) {
            console.error('Parsing failed:', error.message);
            if (error.token && error.token.line) {
                console.error(`At line ${error.token.line}, column ${error.token.column}`);
            }
            throw error;
        }
    }

    // Parse the metadata section
    parseMetadata() {
        while (!this.isAtEnd()) {
            this.skipNewlines();
            if (this.isAtEnd()) break;
            
            const current = this.peek();
            
            // Check for the Variations section
            if (current.type === 'VARIATIONS' || 
                (current.type === 'IDENTIFIER' && current.value.toLowerCase() === 'variations')) {
                this.advance(); // Consume 'variations'
                
                // Check for either ':' or '=' after Variations
                if (this.match('COLON') || this.match('EQUAL')) {
                    // Skip any whitespace or comments after the colon/equals
                    this.skipNewlines();
                    return; // Exit metadata parsing
                } else {
                    throw new Error('Expected ":" or "=" after Variations');
                }
            }
            
            // Parse key-value pairs
            if (current.type === 'IDENTIFIER') {
                const key = this.advance().value;
                
                // Check for ':' or '='
                if (this.match('COLON') || this.match('EQUAL')) {
                    const value = this.parseValue();
                    this.ast.metadata[key] = value;
                    
                    // Skip to the next line
                    this.skipNewlines();
                    continue;
                } else {
                    throw new Error('Expected ":" or "=" after key');
                }
            }
            
            // If we get here, there's unexpected content in the metadata
            throw new Error(`Unexpected token in metadata: ${current.type} '${current.value}'`);
        }
    }
    
    // Parse a value (string, number, list, etc.)
    parseValue() {
        if (this.match('STRING')) {
            return this.previous().value;
        } else if (this.match('NUMBER')) {
            return parseFloat(this.previous().value);
        } else if (this.match('LEFT_PAREN')) {
            // Parse a list/tuple
            const elements = [];
            
            if (!this.check('RIGHT_PAREN')) {
                do {
                    elements.push(this.parseValue());
                } while (this.match('COMMA'));
            }
            
            this.consume('RIGHT_PAREN', 'Expected ")" after list');
            return elements;
        } else if (this.match('LEFT_BRACKET')) {
            // Parse an array
            const elements = [];
            
            if (!this.check('RIGHT_BRACKET')) {
                do {
                    elements.push(this.parseValue());
                } while (this.match('COMMA'));
            }
            
            this.consume('RIGHT_BRACKET', 'Expected "]" after array');
            return elements;
        } else if (this.match('IDENTIFIER')) {
            // Handle boolean values or other identifiers
            const value = this.previous().value.toLowerCase();
            if (value === 'true') return true;
            if (value === 'false') return false;
            if (value === 'null') return null;
            return value; // Return as string if not a keyword
        }
        
        throw new Error('Expected a value');
    }
    
    // Parse the variations section
    parseVariations() {
        this.ast.variations = [];
        this.ast.code = [];
        
        // Skip any leading newlines or comments
        this.skipNewlines();
        
        // Parse MTL code block
        while (!this.isAtEnd()) {
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    this.ast.code.push(stmt);
                }
                
                // Skip newlines between statements
                this.skipNewlines();
                
                // If we didn't make progress, advance to avoid infinite loop
                if (!this.match('NEWLINE') && !this.isAtEnd()) {
                    this.advance();
                }
            } catch (error) {
                console.error('Error parsing statement:', error);
                // Try to recover by skipping to the next line
                this.synchronize();
            }
        }
        
        // Generate variations by executing the MTL code
        this.generateVariations();
    }
    
    // Parse a statement
    parseStatement() {
        if (this.match('FOREACH')) {
            return this.parseForEach();
        }
        
        if (this.check('IDENTIFIER')) {
            return this.parseAssignmentOrFunctionCall();
        }
        
        // Skip unknown statements for now
        this.advance();
        return null;
    }
    
    // Parse a foreach loop
    parseForEach() {
        this.consume('LEFT_PAREN', 'Expected "(" after "foreach"');
        const variable = this.consume('IDENTIFIER', 'Expected variable name').value;
        this.consume('IN', 'Expected "in" after variable name');
        const iterable = this.parseExpression();
        this.consume('RIGHT_PAREN', 'Expected ")" after iterable');
        this.consume('COLON', 'Expected ":" after foreach header');
        
        const body = [];
        while (!this.check('END') && !this.isAtEnd()) {
            const stmt = this.parseStatement();
            if (stmt) body.push(stmt);
            this.skipNewlines();
        }
        
        if (this.match('END')) {
            this.consume('COLON', 'Expected ":" after "end"');
        }
        
        return {
            type: 'foreach',
            variable,
            iterable,
            body
        };
    }
    
    // Parse an assignment or function call
    parseAssignmentOrFunctionCall() {
        const name = this.advance().value;
        
        // Check if it's a function call
        if (this.match('LEFT_PAREN')) {
            const args = [];
            if (!this.check('RIGHT_PAREN')) {
                do {
                    args.push(this.parseExpression());
                } while (this.match('COMMA'));
            }
            this.consume('RIGHT_PAREN', 'Expected ")" after arguments');
            return { type: 'call', name, args };
        }
        
        // Check if it's an assignment
        if (this.match('EQUAL')) {
            const value = this.parseExpression();
            return { type: 'assignment', name, value };
        }
        
        // Otherwise it's just an identifier
        return { type: 'identifier', name };
    }
    
    // Parse an expression
    parseExpression() {
        if (this.match('NUMBER')) {
            return { type: 'number', value: parseFloat(this.previous().value) };
        }
        
        if (this.match('STRING')) {
            return { type: 'string', value: this.previous().value };
        }
        
        if (this.match('IDENTIFIER')) {
            return { type: 'identifier', name: this.previous().value };
        }
        
        if (this.match('LEFT_PAREN')) {
            const expr = this.parseExpression();
            this.consume('RIGHT_PAREN', 'Expected ")" after expression');
            return expr;
        }
        
        throw new Error('Expected expression');
    }
    
    // Skip to the next statement for error recovery
    synchronize() {
        this.advance();
        
        while (!this.isAtEnd()) {
            if (this.previous()?.type === 'NEWLINE') return;
            
            switch (this.peek()?.type) {
                case 'FOREACH':
                case 'END':
                    return;
            }
            
            this.advance();
        }
    }
    
    // Execute MTL code to generate variations
    generateVariations() {
        // This is a simplified version - in a real implementation, you would execute the AST
        // For now, we'll just add a placeholder variation
        this.ast.variations.push({
            tiles: [
                { type: 'character', value: 1, count: 3 },
                { type: 'bamboo', value: 2, count: 4 },
                { type: 'dot', value: 3, count: 3 },
                { type: 'dragon', value: 1, count: 4 }
            ],
            description: 'Generated variation'
        });
    }
}

module.exports = MTLParser;
