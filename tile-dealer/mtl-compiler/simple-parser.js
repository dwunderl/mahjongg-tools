const fs = require('fs');
const { Lexer, TokenType } = require('./simple-lexer');

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
    }

    // Helper methods
    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    check(type) {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }


    // Error handling
    error(token, message) {
        console.error(`[Parser Error] ${message} at line ${token.line}, column ${token.column}\n  ${token.lineContent}\n  ${' '.repeat(token.column)}^`);
        throw new Error('Parsing failed');
    }
    
    // Synchronize the parser by skipping tokens until we find a statement boundary
    synchronize() {
        this.advance();
        
        while (!this.isAtEnd()) {
            const current = this.peek();
            
            // Statement boundaries
            if (current.type === TokenType.SEMICOLON || 
                current.type === TokenType.RIGHT_BRACE ||
                current.type === TokenType.LEFT_BRACE) {
                return;
            }
            
            // Start of statements that we can recover to
            if (current.type === TokenType.IF ||
                current.type === TokenType.FOREACH ||
                current.type === TokenType.PUNG ||
                current.type === TokenType.KONG ||
                current.type === TokenType.CHOW ||
                current.type === TokenType.PERMUTATIONS) {
                return;
            }
            
            this.advance();
        }
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();
        this.error(this.peek(), message);
    }

    // Grammar rules
    parse() {
        console.log('Starting parser...');
        const ast = {
            type: 'Program',
            metadata: {},
            variations: []
        };

        try {
            // First parse metadata
            console.log('Parsing metadata...');
            ast.metadata = this.metadata();
            
            // Skip any newlines after metadata
            while (this.match(TokenType.NEWLINE)) {}
            
            // Then parse variations if there are any tokens left
            if (!this.isAtEnd()) {
                console.log('Parsing variations...');
                ast.variations = this.variations();
                console.log(`Parsed ${ast.variations.length} variations`);
            }
            
            console.log('Parsing completed successfully');
            return ast;
        } catch (error) {
            console.error('Parsing failed:', error.message);
            return null;
        }
    }


    // Metadata parsing
    metadata() {
        const metadata = {};
        
        while (!this.isAtEnd()) {
            const current = this.peek();
            console.log(`Processing metadata token: ${current.type} '${current.lexeme}'`);
            
            // Check for start of variations section
            if (current.type === TokenType.PUNG || 
                current.type === TokenType.KONG || 
                current.type === TokenType.CHOW ||
                current.type === TokenType.IF ||
                current.type === TokenType.FOREACH ||
                current.type === TokenType.PERMUTATIONS) {
                console.log('End of metadata section');
                break;
            }
            
            // Skip newlines
            if (this.match(TokenType.NEWLINE)) {
                continue;
            }
            
            // Parse key-value pairs
            if (current.type === TokenType.IDENTIFIER || current.type === TokenType.STRING) {
                const key = current.lexeme;
                this.advance(); // Consume the key
                
                // Skip whitespace after key
                while (this.match(TokenType.NEWLINE)) {}
                
                // Expect an equals sign
                if (!this.match(TokenType.EQUAL)) {
                    console.error(`Expected '=' after metadata key '${key}', found ${this.peek().type}`);
                    this.synchronize();
                    continue;
                }
                
                // Skip whitespace after equals
                while (this.match(TokenType.NEWLINE)) {}
                
                // Parse the value
                let value;
                
                if (this.check(TokenType.NUMBER)) {
                    const numToken = this.advance();
                    value = {
                        type: 'NumericLiteral',
                        value: parseFloat(numToken.literal)
                    };
                } else if (this.check(TokenType.STRING)) {
                    const strToken = this.advance();
                    value = {
                        type: 'StringLiteral',
                        value: strToken.lexeme.slice(1, -1) // Remove quotes
                    };
                } else if (this.match(TokenType.TRUE)) {
                    value = { type: 'BooleanLiteral', value: true };
                } else if (this.match(TokenType.FALSE)) {
                    value = { type: 'BooleanLiteral', value: false };
                } else if (this.match(TokenType.NULL)) {
                    value = { type: 'NullLiteral', value: null };
                } else if (this.check(TokenType.LEFT_BRACKET)) {
                    // Parse array literal
                    value = this.array();
                } else if (this.check(TokenType.IDENTIFIER)) {
                    // Handle identifiers (could be variables or enums)
                    const idToken = this.advance();
                    value = {
                        type: 'Identifier',
                        name: idToken.lexeme
                    };
                } else {
                    console.error(`Unexpected token in metadata value: ${this.peek().type} '${this.peek().lexeme}'`);
                    this.synchronize();
                    continue;
                }
                
                // Store the key-value pair
                console.log(`Parsed metadata: ${key} =`, value);
                metadata[key] = value;
                
                // Skip to end of line
                while (!this.isAtEnd() && !this.check(TokenType.NEWLINE)) {
                    this.advance();
                }
                
                // Consume the newline
                this.match(TokenType.NEWLINE);
            } else {
                // Skip any unexpected tokens
                console.log(`Skipping unexpected token in metadata: ${current.type} '${current.lexeme}'`);
                this.advance();
            }
        }
        
        return metadata;
    }

    // Array literal
    array() {
        const elements = [];
        
        this.consume(TokenType.LEFT_BRACKET, "Expected '[' before array elements");
        
        if (!this.check(TokenType.RIGHT_BRACKET)) {
            do {
                if (this.check(TokenType.STRING)) {
                    elements.push({
                        type: 'StringLiteral',
                        value: this.advance().literal
                    });
                } else if (this.check(TokenType.NUMBER)) {
                    elements.push({
                        type: 'NumericLiteral',
                        value: parseFloat(this.advance().literal)
                    });
                } else if (this.check(TokenType.IDENTIFIER)) {
                    elements.push({
                        type: 'Identifier',
                        name: this.advance().lexeme
                    });
                } else {
                    this.error(this.peek(), 'Expected value in array');
                }
            } while (this.match(TokenType.COMMA));
        }
        
        this.consume(TokenType.RIGHT_BRACKET, "Expected ']' after array elements");
        
        return {
            type: 'ArrayExpression',
            elements
        };
    }

    // Variations parsing
    variations() {
        console.log('Starting to parse variations...');
        const variations = [];
        
        while (!this.isAtEnd()) {
            const current = this.peek();
            console.log(`Current token in variations: ${current.type} '${current.lexeme}'`);
            
            // Skip newlines
            if (this.match(TokenType.NEWLINE)) {
                continue;
            }
            
            // Check for end of block or file
            if (this.check(TokenType.RIGHT_BRACE) || this.check(TokenType.EOF)) {
                break;
            }
            
            let variation = null;
            
            try {
                // Handle different types of variations
                if (this.match(TokenType.IF)) {
                    variation = this.ifStatement();
                } else if (this.match(TokenType.FOREACH)) {
                    variation = this.foreachStatement();
                } else if (this.match(TokenType.LEFT_BRACE)) {
                    // Handle block of statements
                    const block = [];
                    
                    // Parse statements until we hit a right brace
                    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                        const stmts = this.variations();
                        if (stmts && stmts.length > 0) {
                            block.push(...stmts);
                        } else if (!this.match(TokenType.NEWLINE)) {
                            // Skip any non-newline tokens we don't understand
                            console.log(`Skipping token in block: ${this.peek().type} '${this.peek().lexeme}'`);
                            this.advance();
                        }
                    }
                    
                    // Consume the right brace
                    if (this.match(TokenType.RIGHT_BRACE)) {
                        console.log('Consumed right brace');
                    } else {
                        console.log('Expected right brace after block');
                    }
                    
                    variation = { 
                        type: 'Block', 
                        statements: block,
                        line: current.line,
                        column: current.column
                    };
                } else if (this.check(TokenType.PUNG) || this.check(TokenType.KONG) || 
                          this.check(TokenType.CHOW) || this.check(TokenType.QUINT) || 
                          this.check(TokenType.PERMUTATIONS)) {
                    // Handle function calls like pung(), kong(), etc.
                    const funcToken = this.advance();
                    const funcName = funcToken.type.toLowerCase();
                    this.consume(TokenType.LEFT_PAREN, `Expected '(' after ${funcName}`);
                    
                    // Parse arguments
                    const args = [];
                    if (!this.check(TokenType.RIGHT_PAREN)) {
                        do {
                            if (args.length > 0) {
                                this.consume(TokenType.COMMA, 'Expected comma between arguments');
                            }
                            
                            // Try to parse an expression as the argument
                            try {
                                const expr = this.expression();
                                if (expr) {
                                    args.push(expr);
                                } else {
                                    throw new Error(`Expected expression, got ${this.peek().type}`);
                                }
                            } catch (e) {
                                console.error(`Error parsing argument: ${e.message}`);
                                this.synchronize();
                                break;
                            }
                        } while (!this.check(TokenType.RIGHT_PAREN) && !this.isAtEnd());
                    }
                    
                    this.consume(TokenType.RIGHT_PAREN, `Expected ')' after ${funcName} arguments`);
                    
                    variation = {
                        type: 'FunctionCall',
                        name: funcName,
                        arguments: args,
                        line: funcToken.line,
                        column: funcToken.column
                    };
                    
                    console.log(`Parsed function call: ${funcName} with ${args.length} arguments`);
                } else {
                    // Try to parse as an expression statement
                    const expr = this.expression();
                    if (expr) {
                        variation = { 
                            type: 'ExpressionStatement', 
                            expression: expr,
                            line: current.line,
                            column: current.column
                        };
                    } else {
                        throw new Error(`Unexpected token: ${current.type} '${current.lexeme}'`);
                    }
                }
                
                if (variation) {
                    variations.push(variation);
                }
                
                // Consume semicolon if present
                this.match(TokenType.SEMICOLON);
                
            } catch (error) {
                console.error(`Error parsing variation: ${error.message}`);
                this.synchronize();
            }
        }
        
        console.log(`Parsed ${variations.length} variations`);
        return variations;
    }

    // Function call
    callExpression() {
        const callee = this.advance();
        
        // Handle built-in functions
        let calleeName;
        if ([TokenType.PUNG, TokenType.KONG, TokenType.CHOW, 
             TokenType.QUINT, TokenType.PERMUTATIONS].includes(callee.type)) {
            calleeName = callee.type.toLowerCase();
        } else {
            calleeName = callee.lexeme;
        }
        
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after function name");
        
        const args = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (this.check(TokenType.LEFT_BRACKET)) {
                    args.push(this.array());
                } else if (this.match(TokenType.NUMBER)) {
                    args.push({
                        type: 'NumericLiteral',
                        value: parseFloat(this.previous().literal)
                    });
                } else if (this.match(TokenType.STRING)) {
                    args.push({
                        type: 'StringLiteral',
                        value: this.previous().literal
                    });
                } else if (this.match(TokenType.IDENTIFIER)) {
                    args.push({
                        type: 'Identifier',
                        name: this.previous().lexeme
                    });
                } else {
                    this.error(this.peek(), 'Expected argument in function call');
                }
            } while (this.match(TokenType.COMMA));
        }
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
        
        return {
            type: 'CallExpression',
            callee: {
                type: 'Identifier',
                name: calleeName
            },
            arguments: args
        };
    }
    
    // If statement
    ifStatement() {
        console.log('Parsing if statement...');
        
        const ifToken = this.previous();
        
        // Parse the condition
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'");
        const condition = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after if condition");
        
        // Parse the then branch (must be a block)
        if (!this.match(TokenType.LEFT_BRACE)) {
            throw this.error(this.peek(), "Expected '{' after if condition");
        }
        
        const thenBranch = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const stmts = this.variations();
            if (stmts && stmts.length > 0) {
                thenBranch.push(...stmts);
            } else if (!this.match(TokenType.NEWLINE)) {
                this.advance(); // Skip unexpected tokens
            }
        }
        
        if (!this.match(TokenType.RIGHT_BRACE)) {
            throw this.error(this.peek(), "Expected '}' after if block");
        }
        
        // Parse else if/else branches if they exist
        let elseBranch = null;
        if (this.match(TokenType.ELSE)) {
            if (this.match(TokenType.IF)) {
                // Handle else if
                elseBranch = [this.ifStatement()];
            } else if (this.match(TokenType.LEFT_BRACE)) {
                // Handle else block
                elseBranch = [];
                while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                    const stmts = this.variations();
                    if (stmts && stmts.length > 0) {
                        elseBranch.push(...stmts);
                    } else if (!this.match(TokenType.NEWLINE)) {
                        this.advance(); // Skip unexpected tokens
                    }
                }
                
                if (!this.match(TokenType.RIGHT_BRACE)) {
                    throw this.error(this.peek(), "Expected '}' after else block");
                }
            } else {
                throw this.error(this.peek(), "Expected 'if' or '{' after 'else'");
            }
        }
        
        return {
            type: 'IfStatement',
            condition,
            thenBranch,
            elseBranch,
            line: ifToken.line,
            column: ifToken.column
        };
    }

    // ForEach statement
    foreachStatement() {
        console.log('Parsing foreach statement...');
        
        const foreachToken = this.previous();
        
        // Parse the loop variable and iterable
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'foreach'");
        
        const variable = this.consume(TokenType.IDENTIFIER, "Expected variable name after 'foreach('");
        this.consume(TokenType.IN, "Expected 'in' after variable in foreach");
        
        let iterable;
        if (this.match(TokenType.LEFT_BRACKET)) {
            // Parse array literal
            iterable = this.array();
        } else if (this.match(TokenType.IDENTIFIER)) {
            // Parse variable reference
            iterable = {
                type: 'Identifier',
                name: this.previous().lexeme
            };
        } else {
            throw this.error(this.peek(), "Expected array or identifier after 'in' in foreach");
        }
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after foreach header");
        
        // Parse the loop body (must be a block)
        if (!this.match(TokenType.LEFT_BRACE)) {
            throw this.error(this.peek(), "Expected '{' after foreach header");
        }
        
        const body = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const stmts = this.variations();
            if (stmts && stmts.length > 0) {
                body.push(...stmts);
            } else if (!this.match(TokenType.NEWLINE)) {
                this.advance(); // Skip unexpected tokens
            }
        }
        
        if (!this.match(TokenType.RIGHT_BRACE)) {
            throw this.error(this.peek(), "Expected '}' after foreach block");
        }
        
        return {
            type: 'ForEachStatement',
            variable: {
                type: 'Variable',
                name: variable.lexeme,
                line: variable.line,
                column: variable.column
            },
            iterable,
            body,
            line: foreachToken.line,
            column: foreachToken.column
        };
    }

    // Expression parsing
    expression() {
        return this.logicalOr();
    }
    
    logicalOr() {
        let expr = this.logicalAnd();
        
        while (this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.logicalAnd();
            expr = {
                type: 'LogicalExpression',
                operator: operator.lexeme,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }
    
    logicalAnd() {
        let expr = this.equality();
        
        while (this.match(TokenType.AND)) {
            const operator = this.previous();
            const right = this.equality();
            expr = {
                type: 'LogicalExpression',
                operator: operator.lexeme,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }
    
    equality() {
        let expr = this.comparison();
        
        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = {
                type: 'BinaryExpression',
                operator: operator.lexeme,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }
    
    comparison() {
        let expr = this.term();
        
        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, 
                          TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator = this.previous();
            const right = this.term();
            expr = {
                type: 'BinaryExpression',
                operator: operator.lexeme,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }
    
    term() {
        let expr = this.factor();
        
        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.previous();
            const right = this.factor();
            expr = {
                type: 'BinaryExpression',
                operator: operator.lexeme,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }
    
    factor() {
        let expr = this.unary();
        
        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator = this.previous();
            const right = this.unary();
            expr = {
                type: 'BinaryExpression',
                operator: operator.lexeme,
                left: expr,
                right: right
            };
        }
        
        return expr;
    }
    
    unary() {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary();
            return {
                type: 'UnaryExpression',
                operator: operator.lexeme,
                argument: right
            };
        }
        
        return this.primary();
    }
    
    primary() {
        if (this.match(TokenType.FALSE)) return { type: 'BooleanLiteral', value: false };
        if (this.match(TokenType.TRUE)) return { type: 'BooleanLiteral', value: true };
        if (this.match(TokenType.NULL)) return { type: 'NullLiteral', value: null };
        
        if (this.match(TokenType.NUMBER)) {
            return {
                type: 'NumericLiteral',
                value: parseFloat(this.previous().literal)
            };
        }
        
        if (this.match(TokenType.STRING)) {
            return {
                type: 'StringLiteral',
                value: this.previous().literal.slice(1, -1) // Remove quotes
            };
        }
        
        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
            return {
                type: 'Grouping',
                expression: expr
            };
        }
        
        if (this.match(TokenType.IDENTIFIER)) {
            return {
                type: 'Identifier',
                name: this.previous().lexeme
            };
        }
        
        throw this.error(this.peek(), 'Expected expression.');
    }
}

// Test the parser
function testParser() {
    try {
        // Read the test template file
        const source = fs.readFileSync('test-template.mtl', 'utf8');
        console.log('\nTesting parser with template file...');
        
        // Lex the source
        const lexer = new Lexer(source);
        const tokens = lexer.scanTokens();
        
        // Parse the tokens
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        console.log('\nAST:');
        console.log(JSON.stringify(ast, null, 2));
        
        return ast;
    } catch (error) {
        console.error('Error during parsing:', error.message);
        process.exit(1);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testParser();
}

module.exports = {
    Parser
};
