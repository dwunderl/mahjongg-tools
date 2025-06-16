const fs = require('fs');

// Token types
const TokenType = {
    // Single-character tokens
    LEFT_PAREN: 'LEFT_PAREN',
    RIGHT_PAREN: 'RIGHT_PAREN',
    LEFT_BRACE: 'LEFT_BRACE',
    RIGHT_BRACE: 'RIGHT_BRACE',
    LEFT_BRACKET: 'LEFT_BRACKET',
    RIGHT_BRACKET: 'RIGHT_BRACKET',
    COMMA: 'COMMA',
    DOT: 'DOT',
    MINUS: 'MINUS',
    PLUS: 'PLUS',
    SEMICOLON: 'SEMICOLON',
    SLASH: 'SLASH',
    STAR: 'STAR',
    PERCENT: 'PERCENT',
    COLON: 'COLON',
    EQUAL: 'EQUAL',
    BANG: 'BANG',
    BANG_EQUAL: 'BANG_EQUAL',
    EQUAL_EQUAL: 'EQUAL_EQUAL',
    GREATER: 'GREATER',
    GREATER_EQUAL: 'GREATER_EQUAL',
    LESS: 'LESS',
    LESS_EQUAL: 'LESS_EQUAL',
    
    // Literals
    IDENTIFIER: 'IDENTIFIER',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    
    // Keywords
    AND: 'AND',
    OR: 'OR',
    IF: 'IF',
    ELSE: 'ELSE',
    TRUE: 'TRUE',
    FALSE: 'FALSE',
    NIL: 'NIL',
    VAR: 'VAR',
    FUN: 'FUN',
    RETURN: 'RETURN',
    FOR: 'FOR',
    WHILE: 'WHILE',
    CLASS: 'CLASS',
    SUPER: 'SUPER',
    THIS: 'THIS',
    PRINT: 'PRINT',
    
    // MTL specific
    VARIATIONS: 'VARIATIONS',
    FOREACH: 'FOREACH',
    IN: 'IN',
    END: 'END',
    
    // Other
    NEWLINE: 'NEWLINE',
    EOF: 'EOF',
    
    // For MTL
    KEYWORD: 'KEYWORD',
    SYMBOL: 'SYMBOL'
};

// Keywords
const KEYWORDS = ['foreach', 'in', 'End', 'suits', 'and', 'class', 'else', 'false', 'fun', 'for', 'if', 'nil', 'or', 'print', 'return', 'super', 'this', 'true', 'var', 'while'];

class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

class Lexer {
    constructor(source) {
        if (typeof source !== 'string') {
            throw new Error('Source must be a string');
        }
        
        this.source = source;
        this.tokens = [];
        this.start = 0;
        this.position = 0;
        this.line = 1;
        this.column = 1;
        
        this.keywords = {
            'variations': TokenType.VARIATIONS,
            'foreach': TokenType.FOREACH,
            'in': TokenType.IN,
            'end': TokenType.END,
            'permutations': TokenType.IDENTIFIER,
            'pung': TokenType.IDENTIFIER,
            'kong': TokenType.IDENTIFIER,
            'quint': TokenType.IDENTIFIER,
            'and': TokenType.AND,
            'or': TokenType.OR,
            'true': TokenType.TRUE,
            'false': TokenType.FALSE,
            'null': TokenType.NIL
        };
        
        // Built-in functions
        this.functions = new Set(['permutations', 'pung', 'kong', 'quint']);
    }
    
    // Helper methods
    isAtEnd(offset = 0) {
        return this.position + offset >= this.source.length;
    }
    
    peek(offset = 0) {
        return this.isAtEnd(offset) ? '\0' : this.source[this.position + offset];
    }
    
    peekNext() {
        return this.peek(1);
    }
    
    advance() {
        const char = this.source[this.position++];
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        return char;
    }
    
    match(expected) {
        if (this.isAtEnd() || this.source[this.position] !== expected) {
            return false;
        }
        this.position++;
        this.column++;
        return true;
    }
    
    isDigit(c) {
        return c >= '0' && c <= '9';
    }
    
    isAlpha(c) {
        return (c >= 'a' && c <= 'z') || 
               (c >= 'A' && c <= 'Z') || 
               c === '_';
    }
    
    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
    
    isWhitespace(c) {
        return c === ' ' || c === '\r' || c === '\t';
    }
    
    addToken(type, value = null) {
        const text = this.source.substring(this.start, this.position);
        const token = new Token(type, value || text, this.line, this.column);
        
        // Only log non-whitespace, non-newline tokens
        if (type !== TokenType.WHITESPACE && type !== TokenType.NEWLINE) {
            console.log(`[LEXER] Added token: ${type} '${value || text}' at line ${this.line}, col ${this.column}`);
        }
        
        this.tokens.push(token);
        return token;
    }
    
    isAtEnd(offset = 0) {
        return this.position + offset >= this.source.length;
    }
    
    peek(offset = 0) {
        if (this.isAtEnd(offset)) return '\0';
        return this.source.charAt(this.position + offset);
    }
    
    peekNext() {
        return this.peek(1);
    }
    
    advance() {
        if (this.isAtEnd()) return '\0';
        this.position++;
        this.column++;
        return this.source.charAt(this.position - 1);
    }
    
    match(expected) {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.position) !== expected) return false;
        
        this.position++;
        this.column++;
        return true;
    }
    
    isDigit(c) {
        return c >= '0' && c <= '9';
    }
    
    isAlpha(c) {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
               c === '_';
    }
    
    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
    
    addToken(type, value = null) {
        const text = this.source.substring(this.start, this.position);
        this.tokens.push({
            type,
            value: value !== null ? value : text,
            line: this.line,
            column: this.column - (this.position - this.start)
        });
    }
    
    scanToken() {
        // Log the start of a new token
        console.log('\n--- Starting new token ---');
        console.log('Current position:', this.position, 'line:', this.line, 'column:', this.column);
        
        // Skip whitespace (except newlines)
        while (this.isWhitespace(this.peek()) && this.peek() !== '\n') {
            this.advance();
        }
        
        if (this.isAtEnd()) return;
        
        const c = this.advance();
        
        // Debug: Log the current character and position
        // console.log(`Processing char: '${c}' (${c.charCodeAt(0)}) at position ${this.position-1}, line ${this.line}, column ${this.column-1}`);
        
        // Handle newlines
        if (c === '\n') {
            console.log('Found newline');
            this.addToken(TokenType.NEWLINE);
            return;
        }
        
        // Handle comments
        if (c === '/' && this.peek() === '/') {
            console.log('Found comment');
            // Single-line comment - skip until newline
            while (this.peek() !== '\n' && !this.isAtEnd()) {
                this.advance();
            }
            // Don't add a newline token here - let the main loop handle it
            return;
        }
        
        // Handle string literals
        if (c === '"' || c === '\'') {
            console.log('Found string literal');
            this.string(c);
            return;
        }
        
        // Handle equals sign for key-value pairs
        if (c === '=') {
            console.log('Found equals sign');
            // Skip optional whitespace after equals
            while (this.isWhitespace(this.peek())) {
                this.advance();
            }
            this.addToken(TokenType.EQUAL);
            return;
        }
        
        // Handle colons
        if (c === ':') {
            this.addToken(TokenType.COLON);
            return;
        }
        
        // Handle identifiers and keywords
        if (this.isAlpha(c)) {
            while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
                this.advance();
            }
            
            const text = this.source.substring(this.start, this.position);
            let type = this.keywords[text.toLowerCase()] || TokenType.IDENTIFIER;
            
            // If it's a built-in function, keep it as IDENTIFIER
            if (this.functions.has(text)) {
                type = TokenType.IDENTIFIER;
            }
            
            this.addToken(type);
            return;
        }
        
        // Single character tokens
        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); return;
            case ')': this.addToken(TokenType.RIGHT_PAREN); return;
            case '{': this.addToken(TokenType.LEFT_BRACE); return;
            case '}': this.addToken(TokenType.RIGHT_BRACE); return;
            case '[': this.addToken(TokenType.LEFT_BRACKET); return;
            case ']': this.addToken(TokenType.RIGHT_BRACKET); return;
            case ',': this.addToken(TokenType.COMMA); return;
            case '.': this.addToken(TokenType.DOT); return;
            case '-': this.addToken(TokenType.MINUS); return;
            case '+': this.addToken(TokenType.PLUS); return;
            case ';': this.addToken(TokenType.SEMICOLON); return;
            case '*': this.addToken(TokenType.STAR); return;
            case ':': this.addToken(TokenType.COLON); return;
            case '=': this.addToken(TokenType.EQUAL); return;
            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '/':
                if (this.match('/')) {
                    // Comment goes until end of line
                    while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace
                break;
            case '\n':
                this.line++;
                this.column = 1;
                this.addToken(TokenType.NEWLINE);
                break;
            case '"':
            case '\'':
                this.string(c);
                break;
            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    // Get more context around the error
                    const start = Math.max(0, this.position - 10);
                    const end = Math.min(this.source.length, this.position + 10);
                    const context = this.source.substring(start, end);
                    const error = new Error(`Unexpected character: '${c}' (${c.charCodeAt(0)})`);
                    error.line = this.line;
                    error.column = this.column - 1;
                    error.context = context;
                    error.position = this.position - 1;
                    throw error;
                }
        }

        
        // Helper functions for tile group generation
        this.pung = (value, suit) => {
            return { type: 'pung', value, suit, count: 3 };
        };
        
        this.kong = (value, suit) => {
            return { type: 'kong', value, suit, count: 4 };
        };
        
        this.quint = (value, suit) => {
            return { type: 'quint', value, suit, count: 5 };
        };
        
        this.single = (value, suit) => {
            return { type: 'single', value, suit, count: 1 };
        };
        
        this.chow = (values, suit) => {
            return { type: 'chow', value: values, suit, count: 3 };
        };
    }

    isAlpha(c) {
        if (c === undefined || c === null || typeof c !== 'string' || c.length !== 1) {
            return false;
        }
        return /^[a-zA-Z_]$/.test(c);
    }

    isDigit(c, allowHex = false) {
        if (c === undefined || c === null || typeof c !== 'string' || c.length !== 1) {
            return false;
        }
        return allowHex ? /^[0-9a-fA-F]$/.test(c) : /^[0-9]$/.test(c);
    }

    isAlphaNumeric(c) {
        return this.isAlpha(c) || this.isDigit(c);
    }
    
    isHexDigit(c) {
        return /^[0-9a-fA-F]$/.test(c);
    }

    isWhitespace(c) {
        return /^\s$/.test(c);
    }

    isNewline(c) {
        return c === '\n' || c === '\r';
    }

    advance() {
        if (this.isAtEnd()) {
            throw new Error('Unexpected end of input');
        }
        
        // Ensure position is a valid number
        if (isNaN(this.position) || this.position < 0 || this.position >= this.source.length) {
            throw new Error(`Invalid position: ${this.position}`);
        }
        
        const char = this.source[this.position];
        this.position++;
        
        // Update line and column tracking
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        
        // Ensure position remains valid
        if (isNaN(this.position) || this.position > this.source.length) {
            throw new Error(`Position became invalid after advancing: ${this.position}`);
        }
        
        return char;
    }

    peek(offset = 0) {
        if (this.isAtEnd(offset)) return '\0';
        return this.source[this.position + offset];
    }

    peekNext() {
        if (this.position + 1 >= this.source.length) return '\0';
        return this.source[this.position + 1];
    }
    
    checkPreviousToken(expectedType) {
        if (this.tokens.length === 0) return false;
        return this.tokens[this.tokens.length - 1].type === expectedType;
    }
    
    // Check if we're in a function call context
    isFunctionCall() {
        if (this.tokens.length < 2) return false;
        
        // Look for pattern: IDENTIFIER LEFT_PAREN ...
        for (let i = this.tokens.length - 1; i >= 0; i--) {
            const token = this.tokens[i];
            
            // Skip whitespace and newlines
            if (token.type === TokenType.WHITESPACE || token.type === TokenType.NEWLINE) {
                continue;
            }
            
            // If we find a left parenthesis, check if the previous token was an identifier
            if (token.type === TokenType.LEFT_PAREN) {
                // Look backwards for an identifier
                for (let j = i - 1; j >= 0; j--) {
                    const prevToken = this.tokens[j];
                    if (prevToken.type === TokenType.IDENTIFIER) {
                        return true;
                    } else if (prevToken.type !== TokenType.WHITESPACE && 
                              prevToken.type !== TokenType.NEWLINE) {
                        // Not a whitespace or newline, and not an identifier
                        break;
                    }
                }
                return false;
            }
            
            // If we hit something else, it's not a function call
            return false;
        }
        
        return false;
    }
    
    // Get context around the current position for error messages
    getContext(range = 20) {
        const start = Math.max(0, this.position - range);
        const end = Math.min(this.source.length, this.position + range);
        return this.source.substring(start, end);
    }

    addToken(type, value = null) {
        const text = this.source.substring(this.start, this.position);
        const token = new Token(type, value || text, this.line, this.column);
        
        // Only log non-whitespace, non-newline tokens
        if (type !== TokenType.WHITESPACE && type !== TokenType.NEWLINE) {
            console.log(`[LEXER] Added token: ${type} '${value || text}' at line ${this.line}, col ${this.column}`);
        }
        
        // Log the current state for debugging
        console.log('  Current state:', {
            position: this.position,
            line: this.line,
            column: this.column,
            currentChar: this.position < this.source.length ? 
                `'${this.source[this.position]}' (${this.source.charCodeAt(this.position)})` : 'EOF',
            context: this.source.substring(
                Math.max(0, this.position - 10), 
                Math.min(this.source.length, this.position + 10)
            )
        });
        
        this.tokens.push(token);
        
        // Update position tracking
        const newlines = (text.match(/\n/g) || []).length;
        if (newlines > 0) {
            this.line += newlines;
            this.column = text.length - text.lastIndexOf('\n') - 1;
        } else {
            this.column += text.length;
        }
        
        return token;
    }

    scanToken() {
        // Log the start of a new token
        console.log('\n--- Starting new token ---');
        console.log('Current position:', this.position, 'line:', this.line, 'column:', this.column);
        
        if (this.isAtEnd()) return;
        
        const c = this.advance();
        
        // Skip whitespace (except newlines which we want to track)
        if (c === ' ' || c === '\r' || c === '\t') {
            return;
        }
        
        // Handle newlines
        if (c === '\n') {
            console.log('Found newline');
            this.addToken(TokenType.NEWLINE);
            return;
        }
        
        // Handle comments
        if (c === '/' && this.peek() === '/') {
            console.log('Found comment');
            // Single-line comment - skip until newline
            while (this.peek() !== '\n' && !this.isAtEnd()) {
                this.advance();
            }
            // Don't add a newline token here - let the main loop handle it
            return;
        }
        
        // Handle string literals
        if (c === '"' || c === '\'') {
            console.log('Found string literal');
            this.string(c);
            return;
        }
        
        // Handle equals sign for key-value pairs
        if (c === '=') {
            console.log('Found equals sign');
            // Skip optional whitespace after equals
            while (this.isWhitespace(this.peek())) {
                this.advance();
            }
            this.addToken(TokenType.EQUAL);
            return;
        }
            this.line++;
            this.column = 1;
            this.addToken(TokenType.NEWLINE);
            return;
        }
        
        // Handle comments
        if (c === '/' && this.peek() === '/') {
            // Single-line comment - skip to end of line
            while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
            return;
        }
        
        // Handle metadata key-value pairs (e.g., "Name: Value")
        if (c === ':' && this.checkPreviousToken(TokenType.IDENTIFIER)) {
            this.addToken(TokenType.COLON);
            // The value will be the rest of the line
            this.start = this.position;
            while (this.peek() !== '\n' && !this.isAtEnd()) {
                this.advance();
            }
            const value = this.source.substring(this.start, this.position).trim();
            if (value) {
                this.addToken(TokenType.STRING, value);
            }
            return;
        }
        
        // Handle strings
        if (c === '"' || c === '\'') {
            this.string(c);
            return;
        }
        
        // Handle numbers
        if (this.isDigit(c)) {
            this.number();
            return;
        }
        
        // Handle identifiers and keywords
        if (this.isAlpha(c)) {
            this.identifier();
            return;
        }
        
        // Single character tokens
        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case '[': this.addToken(TokenType.LEFT_BRACKET); break;
            case ']': this.addToken(TokenType.RIGHT_BRACKET); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break;
            case ':': this.addToken(TokenType.COLON); break;
            case '=': this.addToken(TokenType.EQUAL); break;
            default:
                // Skip unknown characters for now
                console.warn(`Unexpected character: ${c} (${c.charCodeAt(0)})`);
        }
        
        // If we get here, we encountered an unexpected character
        throw new Error(`Unexpected character: ${c}`);
    }

    identifier() {
        // First, check if this is a function call (identifier followed by '(')
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        
        const text = this.source.substring(this.start, this.position).trim();
        if (!text) return; // Skip empty identifiers
        
        let type = TokenType.IDENTIFIER;
        const lowerText = text.toLowerCase();
        
        // Check for keywords
        if (lowerText in this.keywords) {
            type = this.keywords[lowerText];
            
            // Special handling for Variations keyword
            if (type === TokenType.VARIATIONS) {
                // Skip any whitespace after Variations
                while (this.peek() === ' ' || this.peek() === '\t') {
                    this.advance();
                }
                // Check for ':' or '=' after Variations
                if (this.peek() === ':' || this.peek() === '=') {
                    this.advance(); // consume the ':' or '='
                }
            }
        }
        
        this.addToken(type, text);
        
        // If this is a function call (identifier followed by '(')
        while (this.peek() === ' ' || this.peek() === '\t') {
            this.advance();
        }
        
        if (this.peek() === '(') {
            this.addToken(TokenType.LEFT_PAREN);
            this.advance();
        }
    }

    number() {
        let isFloat = false;
        
        // Parse the integer part
        while (this.isDigit(this.peek())) {
            this.advance();
        }
        
        // Look for a fractional part
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            isFloat = true;
            this.advance();
            
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }
        
        const numStr = this.source.substring(this.start, this.position);
        const value = isFloat ? parseFloat(numStr) : parseInt(numStr, 10);
        
        if (isNaN(value)) {
            const error = new Error(`Invalid number format: ${numStr} at line ${this.line}, column ${this.column}`);
            error.line = this.line;
            error.column = this.column - (this.position - this.start);
            error.context = this.getContext();
            throw error;
        }
        
        this.addToken(TokenType.NUMBER, value);
        
        // If this is part of a function call, check for comma or closing parenthesis
        if (this.isFunctionCall()) {
            // Skip whitespace
            while (this.peek() === ' ' || this.peek() === '\t') {
                this.advance();
            }
            
            // If there's a comma, add a comma token
            if (this.peek() === ',') {
                this.addToken(TokenType.COMMA);
                this.advance();
            }
        }
    }
    
    string(quote) {
        let value = '';
        let startLine = this.line;
        let startCol = this.column;
        
        // Skip the opening quote
        this.start = this.position;
        
        while (!this.isAtEnd() && this.peek() !== quote) {
            if (this.peek() === '\\' && this.peekNext() === quote) {
                // Handle escaped quote
                this.advance(); // Skip the backslash
                value += this.advance(); // Add the quote
            } else if (this.peek() === '\\' && this.peekNext() === 'n') {
                // Handle newline escape
                this.advance(); // Skip the backslash
                this.advance(); // Skip the 'n'
                value += '\n';
            } else if (this.peek() === '\\' && this.peekNext() === 't') {
                // Handle tab escape
                this.advance(); // Skip the backslash
                this.advance(); // Skip the 't'
                value += '\t';
            } else if (this.peek() === '\\') {
                // Handle other escape sequences
                this.advance(); // Skip the backslash
                value += this.advance(); // Add the escaped character
            } else {
                value += this.advance();
            }
        }
        
        // Check for unterminated string
        if (this.isAtEnd()) {
            const error = new Error('Unterminated string');
            error.line = startLine;
            error.column = startCol;
            error.context = this.source.substring(
                Math.max(0, this.start - 20), 
                Math.min(this.source.length, this.start + 20)
            );
            throw error;
        }
        
        // Consume the closing quote
        this.advance();
        
        this.addToken(TokenType.STRING, value);
    }
    
    number() {
        let isFloat = false;
        
        // Parse the integer part
        while (this.isDigit(this.peek())) {
            this.advance();
        }
        
        // Look for a fractional part
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            isFloat = true;
            this.advance(); // Consume the .
            
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }
        
        // Parse the number
        const numStr = this.source.substring(this.start, this.position);
        const value = isFloat ? parseFloat(numStr) : parseInt(numStr, 10);
        
        if (isNaN(value)) {
            throw new Error(`Invalid number: ${numStr}`);
        }
        
        this.addToken(TokenType.NUMBER, value);
    }
    
    identifier() {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        
        const text = this.source.substring(this.start, this.position);
        let type = this.keywords[text.toLowerCase()] || TokenType.IDENTIFIER;
        
        // Check if it's a built-in function
        if (this.functions.has(text)) {
            type = TokenType.IDENTIFIER;
        }
        
        this.addToken(type);
    }
    
    isFunctionCall() {
        if (this.tokens.length < 2) return false;
        
        // Look for pattern: IDENTIFIER LEFT_PAREN ...
        for (let i = this.tokens.length - 1; i >= 0; i--) {
            const token = this.tokens[i];
            
            // Skip whitespace and newlines
            if (token.type === TokenType.WHITESPACE || token.type === TokenType.NEWLINE) {
                continue;
            }
            
            // If we find a left parenthesis, check if the previous token was an identifier
            if (token.type === TokenType.LEFT_PAREN) {
                // Look backwards for an identifier
                for (let j = i - 1; j >= 0; j--) {
                    const prevToken = this.tokens[j];
                    if (prevToken.type === TokenType.IDENTIFIER) {
                        return true;
                    } else if (prevToken.type !== TokenType.WHITESPACE && 
                              prevToken.type !== TokenType.NEWLINE) {
                        // Not a whitespace or newline, and not an identifier
                        break;
                    }
                }
                return false;
            }
            
            // If we hit something else, it's not a function call
            return false;
        }
        
        return false;
    }

    scanTokens() {
        console.log('Starting lexing...');
        console.log(`Source length: ${this.source.length} characters`);
        
        // Ensure proper initialization
        this.position = 0;
        this.start = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        
        if (typeof this.position !== 'number' || isNaN(this.position)) {
            throw new Error('Invalid initial position in lexer');
        }
        
        let tokenCount = 0;
        const maxTokens = 5000; // Increased to handle larger files
        const startTime = Date.now();
        const MAX_EXECUTION_TIME = 5000; // 5 seconds max execution time
        
        try {
            console.log('Starting tokenization...');
            while (!this.isAtEnd() && tokenCount < maxTokens) {
                const currentTime = Date.now();
                if (currentTime - startTime > MAX_EXECUTION_TIME) {
                    throw new Error(`Lexing timed out after ${(currentTime - startTime)}ms. Possible infinite loop.`);
                }
                
                const startPos = this.position;
                const currentChar = this.peek();
                
                // Process the token
                this.scanToken();
                
                // Safety check - ensure we're making progress
                if (this.position === startPos) {
                    throw new Error(`No progress made in scanToken() at position ${this.position}. ` +
                                  `Current character: '${currentChar}' (${currentChar.charCodeAt(0)})`);
                }
                
                tokenCount++;
                
                // Log first 10 tokens and then every 50th token
                if (tokenCount <= 10 || tokenCount % 50 === 0) {
                    console.log(`[${tokenCount}] Processed token at position ${this.position}/${this.source.length}`);
                }
            }
            
            if (tokenCount >= maxTokens) {
                throw new Error(`Safety limit of ${maxTokens} tokens reached. Possible infinite loop.`);
            }
            
            this.addToken(TokenType.EOF, '');
            console.log(`Lexing complete. Generated ${this.tokens.length} tokens in ${(Date.now() - startTime)}ms`);
            return this.tokens;
            
        } catch (error) {
            console.error('Lexing error:', error.message);
            console.error('Current state:', {
                position: this.position,
                line: this.line,
                column: this.column,
                currentChar: this.peek(),
                charCode: this.peek().charCodeAt(0),
                context: this.source.substring(Math.max(0, this.position - 10), Math.min(this.source.length, this.position + 10))
            });
            throw error; // Re-throw to stop execution
        }
    }
}

// Parser
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
        this.metadata = {};
        this.ast = {
            type: 'Program',
            body: [],
            metadata: {}
        };
    }

    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    peek() {
        return this.tokens[this.current];
    }

    previous() {
        return this.tokens[this.current - 1];
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    check(type, value = null) {
        if (this.isAtEnd()) return false;
        if (this.peek().type !== type) return false;
        if (value !== null && this.peek().value !== value) return false;
        return true;
    }

    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            } else if (typeof type === 'string' && this.check(TokenType.IDENTIFIER, type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    checkNext(tokenType, value = null) {
        if (this.position + 1 >= this.tokens.length) return false;
        const nextToken = this.tokens[this.position + 1];
        if (!nextToken || !nextToken.type) return false;
        return nextToken.type === tokenType && (value === null || nextToken.value === value);
    }

    consume(type, message) {
        if (this.check(type)) return this.advance();
        throw new Error(`${message} at line ${this.peek().line}, column ${this.peek().column}`);
    }

    error(message) {
        const token = this.peek();
        const line = token ? token.line : 'unknown';
        const column = token ? token.column : 'unknown';
        const context = token ? ` at line ${line}, column ${column}` : ' at end of file';
        const snippet = token ? ` near '${token.value}'` : '';
        return new Error(`Error${context}${snippet}: ${message}`);
    }

    checkComment() {
        if (this.check(TokenType.SLASH) && this.checkNext(TokenType.SLASH)) {
            while (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) this.advance();
            return true;
        }
        return false;
    }

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
            console.error('Compilation failed:', error.message);
            if (error.line && error.column) {
                console.error(`At line ${error.line}, column ${error.column}`);
            }
            throw error;
        }
    }
    
    // Parse MTL expressions and statements
    parseExpression() {
        if (this.match(TokenType.NUMBER)) {
            return { type: 'number', value: this.previous().value };
        }
        
        if (this.match(TokenType.STRING)) {
            return { type: 'string', value: this.previous().value };
        }
        
        if (this.match(TokenType.IDENTIFIER)) {
            return { type: 'identifier', name: this.previous().value };
        }
        
        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.parseExpression();
            this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after expression.');
            return expr;
        }
        
        throw this.error('Expect expression.');
    }
    
    // Parse a statement
    parseStatement() {
        if (this.match(TokenType.FOREACH)) {
            return this.parseForEach();
        }
        
        if (this.match(TokenType.IDENTIFIER)) {
            const name = this.previous().value;
            
            // Check if it's a function call
            if (this.match(TokenType.LEFT_PAREN)) {
                const args = [];
                if (!this.check(TokenType.RIGHT_PAREN)) {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(TokenType.COMMA));
                }
                this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after arguments.');
                return { type: 'call', name, args };
            }
            
            // Check if it's an assignment
            if (this.match(TokenType.EQUAL)) {
                const value = this.parseExpression();
                return { type: 'assignment', name, value };
            }
            
            // Otherwise it's just an identifier
            return { type: 'identifier', name };
        }
        
        throw this.error('Expect statement.');
    }
    
    // Parse a foreach loop
    parseForEach() {
        this.consume(TokenType.LEFT_PAREN, 'Expect "(" after "foreach".');
        const variable = this.consume(TokenType.IDENTIFIER, 'Expect variable name after "(".').value;
        this.consume(TokenType.IN, 'Expect "in" after variable name.');
        const iterable = this.parseExpression();
        this.consume(TokenType.RIGHT_PAREN, 'Expect ")" after iterable.');
        this.consume(TokenType.COLON, 'Expect ":" after foreach header.');
        
        const body = [];
        while (!this.check(TokenType.END) && !this.isAtEnd()) {
            body.push(this.parseStatement());
            if (this.match(TokenType.NEWLINE)) {
                // Skip newlines between statements
                while (this.match(TokenType.NEWLINE)) {}
            }
        }
        
        if (this.match(TokenType.END)) {
            this.consume(TokenType.COLON, 'Expect ":" after "end".');
        }
        
        return {
            type: 'foreach',
            variable,
            iterable,
            body
        };
    }

    parseMetadata() {
        console.log('[PARSER] Starting metadata parsing');
        while (!this.isAtEnd()) {
            // Skip empty lines and comments
            while (this.match(TokenType.NEWLINE) || this.checkComment()) {
                console.log('[PARSER] Skipping newline or comment');
                continue;
            }
            
            if (this.isAtEnd()) {
                console.log('[PARSER] Reached end of input');
                break;
            }
            
            const currentToken = this.peek();
            console.log(`[PARSER] Current token:`, JSON.stringify({
                type: TokenType[currentToken.type],
                value: currentToken.value,
                line: currentToken.line,
                column: currentToken.column
            }, null, 2));
            
            if (!currentToken) {
                console.log('[PARSER] No current token');
                break;
            }
            
            // Check for the Variations section
            if (currentToken.type === TokenType.VARIATIONS) {
                console.log('[PARSER] Found Variations section');
                this.advance(); // Consume 'variations'
                
                // Check for either ':' or '=' after Variations
                if (this.match(TokenType.COLON) || this.match(TokenType.EQUAL)) {
                    console.log('[PARSER] Found Variations separator');
                    // Skip any whitespace or comments after the colon/equals
                    while (this.match(TokenType.NEWLINE) || this.checkComment()) {
                        console.log('[PARSER] Skipping after Variations separator');
                    }
                    console.log('[PARSER] Exiting metadata parsing');
                    return; // Exit metadata parsing
                } else {
                    const err = this.error('Expected \":\" or \"=\" after Variations');
                    console.error('[PARSER] Error:', err.message);
                    throw err;
                }
            }
            
            // Parse key-value pair (format: IDENTIFIER COLON value)
            if (this.check(TokenType.IDENTIFIER)) {
                console.log('[PARSER] Found potential metadata key-value pair');
                const keyToken = this.consume(TokenType.IDENTIFIER, 'Expected metadata key');
                console.log(`[PARSER] Found key: ${keyToken.value}`);
                
                // Check for colon
                if (!this.match(TokenType.COLON)) {
                    throw this.error('Expected \":\" after metadata key');
                }
                
                // Skip any whitespace after ':'
                while (this.match(TokenType.NEWLINE) || this.checkComment()) {
                    console.log('[PARSER] Skipping whitespace after colon');
                }
                
                // Parse the value (read until end of line)
                const valueTokens = [];
                while (!this.check(TokenType.NEWLINE) && !this.isAtEnd()) {
                    const token = this.advance();
                    if (token.type !== TokenType.NEWLINE) {
                        valueTokens.push(token);
                    }
                }
                
                // Join token values to form the complete value string
                let value = valueTokens.map(t => t.value).join('').trim();
                console.log(`[PARSER] Extracted value: "${value}"`);
                
                // Try to parse as number if it looks like one
                if (/^\d+(\.\d+)?$/.test(value)) {
                    value = parseFloat(value);
                    console.log(`[PARSER] Parsed as number: ${value}`);
                }
                // Check for boolean values
                else if (value.toLowerCase() === 'true') {
                    value = true;
                    console.log('[PARSER] Parsed as boolean: true');
                }
                else if (value.toLowerCase() === 'false') {
                    value = false;
                    console.log('[PARSER] Parsed as boolean: false');
                }
                // Check for null/undefined
                else if (value.toLowerCase() === 'null') {
                    value = null;
                    console.log('[PARSER] Parsed as null');
                }
                else if (value.toLowerCase() === 'undefined') {
                    value = undefined;
                    console.log('[PARSER] Parsed as undefined');
                } else {
                    console.log(`[PARSER] Kept as string: "${value}"`);
                }
                
                // Store the metadata
                this.ast.metadata[keyToken.value] = value;
                
                // Skip the newline if present
                this.match(TokenType.NEWLINE);
                // Skip the newline
                if (this.check(TokenType.NEWLINE)) {
                    console.log('[PARSER] Skipping newline after value');
                    this.advance();
                }
            } else {
                // If we get here, we have an unexpected token
                throw this.error('Unexpected token in metadata');
            }
        }
    }

    parseVariations() {
        // console.log('Starting to parse variations');
        this.ast.variations = [];
        this.ast.code = [];
        
        // Skip any leading newlines or comments
        while (this.match(TokenType.NEWLINE) || this.checkComment()) {}
        
        // Parse MTL code block
        while (!this.isAtEnd()) {
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    this.ast.code.push(stmt);
                }
                
                // Skip newlines between statements
                if (this.match(TokenType.NEWLINE)) {
                    while (this.match(TokenType.NEWLINE)) {}
                } else if (!this.isAtEnd() && !this.check(TokenType.END) && !this.check(TokenType.EOF)) {
                    // If we didn't get a newline or END, but there are more tokens, 
                    // there might be a syntax error
                    throw this.error('Unexpected token: ' + this.peek().type);
                }
            } catch (error) {
                console.error('Error parsing variation:', error);
                // Try to recover by skipping to the next line
                this.synchronize();
            }
        }
        
        // Generate variations by executing the MTL code
        this.generateVariations();
        
        return this.ast.variations;
    }
    
    // Generate variations based on the parsed code
    generateVariations() {
        // This is a simplified implementation
        // In a real implementation, you would execute the AST to generate variations
        const variation = {
            tiles: [
                { type: 'character', value: 1, count: 3 },
                { type: 'bamboo', value: 2, count: 4 },
                { type: 'dot', value: 3, count: 3 },
                { type: 'dragon', value: 1, count: 4 }
            ],
            description: 'Generated variation'
        };
        this.ast.variations.push(variation);
    }

    expression() {
        // Simple expression parser that handles numbers, strings, and identifiers
        if (this.match(TokenType.NUMBER)) {
            return { type: 'literal', value: this.previous().value };
        }
        
        if (this.match(TokenType.STRING)) {
            return { type: 'string', value: this.previous().value };
        }
    }
}

// Scope for variable management
class Scope {
    constructor(enclosing = null) {
        this.values = new Map();
        this.enclosing = enclosing;
    }
    
    define(name, value) {
        this.values.set(name, value);
    }
    
    get(name) {
        if (this.values.has(name)) {
            return this.values.get(name);
        }
        if (this.enclosing) {
            return this.enclosing.get(name);
        }
        throw new Error(`Undefined variable: ${name}`);
    }
    
    has(name) {
        return this.values.has(name) || (this.enclosing && this.enclosing.has(name));
    }
}

// Interpreter
class Interpreter {
    constructor() {
        this.variations = [];
        this.scope = new Scope();
        this.currentVariation = [];
        this.setupBuiltins();
    }
    
    setupBuiltins() {
        // Permutations function
        this.scope.define('permutations', {
            call: (interpreter, args) => {
                if (args.length !== 1) {
                    throw new Error('permutations() takes exactly 1 argument');
                }
                const items = interpreter.evaluate(args[0]);
                if (!Array.isArray(items)) {
                    throw new Error('permutations() argument must be an array');
                }
                return this.getPermutations(items);
            }
        });
        
        // Complement function
        this.scope.define('complement', {
            call: (interpreter, args) => {
                if (args.length !== 1) {
                    throw new Error('complement() takes exactly 1 argument (tile group)');
                }
                const group = interpreter.evaluate(args[0]);
                if (!group || !group.type) {
                    throw new Error('complement() argument must be a tile group');
                }
                return this.getComplement(group);
            }
        });
        
        // Tile group functions
        const tileFuncs = {
            pung: 3,
            kong: 4,
            pair: 2,
            single: 1,
            chow: 3
        };
        
        for (const [func, count] of Object.entries(tileFuncs)) {
            this.scope.define(func, {
                call: (interpreter, args) => {
                    if (args.length < 1 || args.length > 2) {
                        throw new Error(`${func}() takes 1 or 2 arguments`);
                    }
                    
                    const value = interpreter.evaluate(args[0]);
                    const suit = args.length > 1 ? interpreter.evaluate(args[1]) : null;
                    
                    if (func === 'chow' && (!Array.isArray(value) || value.length !== 3)) {
                        throw new Error('chow() requires an array of 3 values');
                    }
                    
                    return {
                        type: func,
                        value,
                        suit,
                        count
                    };
                }
            });
        }
    }
    
    interpret(ast) {
        try {
            // Process metadata
            for (const [key, value] of Object.entries(ast.metadata)) {
                this.scope.define(key, value);
            }
            
            // Process variations
            for (const stmt of ast.variations) {
                this.evaluate(stmt);
            }
            
            return {
                metadata: ast.metadata,
                variations: this.variations
            };
        } catch (error) {
            console.error('Interpretation error:', error.message);
            throw error;
        }
    }
    
    evaluate(node) {
        if (node === null || node === undefined) {
            return null;
        }
        
        if (Array.isArray(node)) {
            return node.map(n => this.evaluate(n));
        }
        
        if (typeof node !== 'object') {
            return node;
        }
        
        try {
            switch (node.type) {
                case 'foreach':
                    return this.visitForeach(node);
                case 'function':
                    return this.visitFunction(node);
                case 'assignment':
                    return this.visitAssignment(node);
                case 'variable':
                    return this.visitVariable(node);
                case 'literal':
                    return node.value;
                case 'string':
                    return node.value;
                case 'tuple':
                    return node.elements.map(elem => this.evaluate(elem));
                case 'call':
                    return this.visitCall(node);
                default:
                    console.warn('Unknown node type:', node.type, node);
                    return null;
            }
        } catch (error) {
            console.error('Error evaluating node:', node);
            throw error;
        }
    }
    
    visitForeach(node) {
        const iterable = this.evaluate(node.iterable);
        if (!Array.isArray(iterable)) {
            throw new Error('foreach loop requires an iterable');
        }
        
        const prevScope = this.scope;
        
        for (const item of iterable) {
            this.scope = new Scope(prevScope);
            this.scope.define(node.var, item);
            
            try {
                for (const stmt of node.body) {
                    this.evaluate(stmt);
                }
            } finally {
                this.scope = prevScope;
            }
        }
    }
    
    visitFunction(node) {
        const tiles = [];
        const prevVariation = this.currentVariation;
        this.currentVariation = [];
        
        try {
            // Process each statement in the function body
            for (const stmt of node.body) {
                const result = this.evaluate(stmt);
                if (result && result.type && result.count) {
                    tiles.push(...this.expandTileGroup(result));
                }
            }
            
            // If we have exactly 14 tiles, add as a variation
            if (tiles.length === 14) {
                this.variations.push({
                    name: node.name || 'unnamed',
                    tiles: [...tiles]
                });
            } else if (tiles.length > 0) {
                console.warn(`Skipping incomplete variation with ${tiles.length} tiles`);
            }
            
            return tiles;
        } finally {
            this.currentVariation = prevVariation;
        }
    }
    
    visitAssignment(node) {
        const value = this.evaluate(node.value);
        this.scope.define(node.name, value);
        return value;
    }
    
    visitVariable(node) {
        return this.scope.get(node.name);
    }
    
    visitCall(node) {
        const func = this.scope.get(node.name);
        if (!func || typeof func.call !== 'function') {
            throw new Error(`Undefined function: ${node.name}`);
        }
        return func.call(this, node.args);
    }
    
    // Convert a tile group into individual tiles
    expandTileGroup(group) {
        const tiles = [];
        const { type, value, suit, count } = group;
        
        try {
            if (type === 'chow') {
                // For chows, value should be an array like [2,3,4]
                if (!Array.isArray(value) || value.length !== 3) {
                    console.warn('Invalid chow:', group);
                    return [];
                }
                for (const num of value) {
                    tiles.push(`${num}${suit}`);
                }
            } else if (type === 'single') {
                // For single tiles, handle both numeric and string values
                const tileValue = typeof value === 'number' ? value : this.evaluate(value);
                const tileSuit = suit ? this.evaluate(suit) : '';
                tiles.push(`${tileValue}${tileSuit}`);
            } else {
                // For pungs, kongs, pairs, etc.
                const tileValue = typeof value === 'number' ? value : this.evaluate(value);
                const tileSuit = suit ? this.evaluate(suit) : '';
                for (let i = 0; i < count; i++) {
                    tiles.push(`${tileValue}${tileSuit}`);
                }
            }
            
            return tiles;
        } catch (error) {
            console.error('Error expanding tile group:', group, error);
            return [];
        }
    }
    
    // Generate all permutations of an array
    getPermutations(arr) {
        if (arr.length <= 1) return [arr];
        
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const perms = this.getPermutations(remaining);
            for (const perm of perms) {
                result.push([current, ...perm]);
            }
        }
        return result;
    }
    
    // Get complement of a tile group (for honor tiles, flowers, etc.)
    getComplement(group) {
        // This is a simplified version - you'll need to expand this
        // based on your specific Mahjong rules
        if (group.type === 'single' && !group.suit) {
            // Assuming it's an honor tile or flower
            return [];
        }
        return [];
    }
    
    // Helper function to get complement of a suit
    complement(suit, suits) {
        return suits.filter(s => s !== suit);
    }
    
    // Evaluate expressions
    evaluate(expr) {
        if (Array.isArray(expr)) {
            // Handle variable references and function calls
            const [fn, ...args] = expr;
            
            if (fn === 'foreach') {
                const varName = args[0];
                const collection = this.evaluate(args[2]);
                
                for (const item of collection) {
                    this.symbols.set(varName, item);
                    this.executeBlock(args.slice(4)); // Skip 'in' and collection
                }
                return;
            }
            
            if (typeof this[fn] === 'function') {
                return this[fn](...args.map(arg => this.evaluate(arg)));
            }
            
            // Handle array indexing like p[0]
            if (fn.includes('[') && fn.endsWith(']')) {
                const [varName, index] = fn.split(/\[|\]/).filter(Boolean);
                const arr = this.symbols.get(varName) || [];
                return arr[parseInt(index, 10)];
            }
            
            // Handle variable references
            if (this.symbols.has(fn)) {
                return this.symbols.get(fn);
            }
            
            return expr.join(' ');
        }
        
        // Handle literals and variables
        if (typeof expr === 'string') {
            if (this.symbols.has(expr)) {
                return this.symbols.get(expr);
            }
            return expr;
        }
        
        return expr;
    }

    executeBlock(block) {
        for (const stmt of block) {
            if (stmt[0] === 'End') break;
            this.evaluate(stmt);
        }
    }

    interpret() {
        // Set up built-in functions
        this.symbols.set('permutations', (arr) => this.getPermutations(arr));
        this.symbols.set('complement', (suit, suits) => this.complement(suit, suits));
        
        // Set up suits
        if (this.ast.suits) {
            this.symbols.set('suits', this.ast.suits);
        } else {
            this.symbols.set('suits', ['b', 'c', 'd']);
        }
        
        // Execute the code
        for (const stmt of this.ast.code) {
            this.evaluate(stmt);
        }
        
        return this.variations;
    }
}

// Main compiler function
function compileMTL(inputPath, outputPath) {
    try {
        // Read the input file
        const source = fs.readFileSync(inputPath, 'utf8');
        
        // Lexing
        const lexer = new Lexer(source);
        const tokens = lexer.scanTokens();
        
        // Parsing
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        // Interpretation
        const interpreter = new Interpreter(ast);
        const variations = interpreter.interpret();
        
        // Prepare output
        const output = {
            templates: [{
                ...ast.metadata,
                variations: variations
            }]
        };
        
        // Write output file
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Successfully compiled ${variations.length} variations to ${outputPath}`);
    } catch (error) {
        console.error('Compilation failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    if (process.argv.length < 4) {
        console.error('Usage: node compiler-v2.js <input.mtl> <output.json>');
        process.exit(1);
    }
    
    const inputPath = process.argv[2];
    const outputPath = process.argv[3];
    compileMTL(inputPath, outputPath);
}

// Export the main compiler function and classes
module.exports = { 
    compileMTL,
    Lexer,
    Parser,
    Interpreter,
    TokenType
};
