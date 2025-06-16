const fs = require('fs');

// Token types
const TokenType = {
    // Single-character tokens
    LEFT_PAREN: 'LEFT_PAREN',    // (
    RIGHT_PAREN: 'RIGHT_PAREN',  // )
    LEFT_BRACE: 'LEFT_BRACE',    // {
    RIGHT_BRACE: 'RIGHT_BRACE',  // }
    LEFT_BRACKET: 'LEFT_BRACKET',  // [
    RIGHT_BRACKET: 'RIGHT_BRACKET', // ]
    COMMA: 'COMMA',             // ,
    DOT: 'DOT',                 // .
    MINUS: 'MINUS',            // -
    PLUS: 'PLUS',              // +
    SEMICOLON: 'SEMICOLON',    // ;
    SLASH: 'SLASH',            // /
    STAR: 'STAR',              // *
    COLON: 'COLON',            // :
    EQUAL: 'EQUAL',            // =
    BANG: 'BANG',              // !
    BANG_EQUAL: 'BANG_EQUAL',  // !=
    EQUAL_EQUAL: 'EQUAL_EQUAL', // ==
    GREATER: 'GREATER',        // >
    GREATER_EQUAL: 'GREATER_EQUAL', // >=
    LESS: 'LESS',              // <
    LESS_EQUAL: 'LESS_EQUAL',  // <=
    
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
    
    // Built-in functions
    PERMUTATIONS: 'PERMUTATIONS',
    PUNG: 'PUNG',
    KONG: 'KONG',
    QUINT: 'QUINT',
    CHOW: 'CHOW',
    
    // Other
    NEWLINE: 'NEWLINE',
    EOF: 'EOF'
};

class Token {
    constructor(type, lexeme, literal, line, column) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
        this.column = column;
    }

    toString() {
        return `${this.type} ${this.lexeme} ${this.literal}`;
    }
}

class Lexer {
    constructor(source) {
        this.source = source;
        this.tokens = [];
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.column = 1;
        
        this.keywords = {
            // Control flow
            'if': TokenType.IF,
            'else': TokenType.ELSE,
            'for': TokenType.FOR,
            'while': TokenType.WHILE,
            'return': TokenType.RETURN,
            'var': TokenType.VAR,
            'fun': TokenType.FUN,
            'class': TokenType.CLASS,
            'super': TokenType.SUPER,
            'this': TokenType.THIS,
            'print': TokenType.PRINT,
            
            // Logical operators
            'and': TokenType.AND,
            'or': TokenType.OR,
            'true': TokenType.TRUE,
            'false': TokenType.FALSE,
            'null': TokenType.NIL,
            
            // MTL specific
            'variations': TokenType.VARIATIONS,
            'foreach': TokenType.FOREACH,
            'in': TokenType.IN,
            'end': TokenType.END,
            
            // Built-in functions
            'permutations': TokenType.PERMUTATIONS,
            'pung': TokenType.PUNG,
            'kong': TokenType.KONG,
            'quint': TokenType.QUINT,
            'chow': TokenType.CHOW
        };
    }
    
    // Helper methods
    isAtEnd() {
        return this.current >= this.source.length;
    }
    
    advance() {
        this.current++;
        this.column++;
        return this.source[this.current - 1];
    }
    
    addToken(type, literal = null) {
        const text = this.source.substring(this.start, this.current);
        const token = new Token(type, text, literal, this.line, this.column - text.length);
        this.tokens.push(token);
        console.log(`[LEXER] Added token: ${type} '${text}' at line ${this.line}, col ${this.column - text.length}`);
    }
    
    match(expected) {
        if (this.isAtEnd()) return false;
        if (this.source[this.current] !== expected) return false;
        
        this.current++;
        this.column++;
        return true;
    }
    
    peek() {
        if (this.isAtEnd()) return '\0';
        return this.source[this.current];
    }
    
    string(quote) {
        let value = '';
        
        while (this.peek() !== quote && !this.isAtEnd()) {
            if (this.peek() === '\n') {
                this.line++;
                this.column = 0;
            }
            
            // Handle escape sequences
            if (this.peek() === '\\') {
                this.advance(); // Skip the backslash
                
                // Handle common escape sequences
                switch (this.peek()) {
                    case 'n': value += '\n'; break;
                    case 't': value += '\t'; break;
                    case 'r': value += '\r'; break;
                    case '\\': value += '\\'; break;
                    case quote: value += quote; break;
                    default:
                        // Just include the character after the backslash
                        value += this.peek();
                }
                this.advance();
            } else {
                value += this.advance();
            }
        }
        
        if (this.isAtEnd()) {
            throw new Error(`[Lexer] Unterminated string at line ${this.line}, column ${this.column}`);
        }
        
        // The closing quote
        this.advance();
        
        this.addToken(TokenType.STRING, value);
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
    
    number() {
        while (this.isDigit(this.peek())) this.advance();
        
        // Look for a fractional part
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();
            
            while (this.isDigit(this.peek())) this.advance();
        }
        
        const value = parseFloat(this.source.substring(this.start, this.current));
        this.addToken(TokenType.NUMBER, value);
    }
    
    peekNext() {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source[this.current + 1];
    }
    
    identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        
        const text = this.source.substring(this.start, this.current);
        let type = this.keywords[text.toLowerCase()];
        if (!type) type = TokenType.IDENTIFIER;
        
        this.addToken(type);
    }
    
    scanToken() {
        const c = this.advance();
        
        // Handle single-character tokens
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
            
            // Handle multi-character operators
            case '!':
                this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case '=':
                this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case '<':
                this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case '>':
                this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case '&':
                if (this.match('&')) {
                    this.addToken(TokenType.AND);
                } else {
                    throw new Error(`[Lexer] Unexpected character: '&' at line ${this.line}, column ${this.column}`);
                }
                break;
            case '|':
                if (this.match('|')) {
                    this.addToken(TokenType.OR);
                } else {
                    throw new Error(`[Lexer] Unexpected character: '|' at line ${this.line}, column ${this.column}`);
                }
                break;
            
            // Handle comments
            case '/':
                if (this.match('/')) {
                    // A comment goes until the end of the line
                    while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
                
            // Handle whitespace
            case ' ':
            case '\r':
            case '\t':
                // Ignore whitespace
                break;
                
            case '\n':
                this.line++;
                this.column = 0;
                this.addToken(TokenType.NEWLINE);
                break;
                
            // Handle string literals (both single and double quotes)
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
                    throw new Error(`[Lexer] Unexpected character: '${c}' (${c.charCodeAt(0)}) at line ${this.line}, column ${this.column}`);
                }
                break;
        }
    }
    
    scanTokens() {
        console.log('Starting lexing...');
        console.log('Source length:', this.source.length, 'characters');
        
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        
        this.tokens.push(new Token(TokenType.EOF, '', null, this.line, this.column));
        return this.tokens;
    }
}

// Test the lexer with a template file
function testLexer() {
    try {
        // Read the test template file
        const source = fs.readFileSync('test-template.mtl', 'utf8');
        console.log('\nTesting lexer with template file...');
        
        const lexer = new Lexer(source);
        const tokens = lexer.scanTokens();
        
        console.log('\nTokens:');
        console.log('--------');
        
        // Group tokens by line for better readability
        const tokensByLine = new Map();
        
        tokens.forEach(token => {
            if (!tokensByLine.has(token.line)) {
                tokensByLine.set(token.line, []);
            }
            tokensByLine.get(token.line).push(token);
        });
        
        // Print tokens line by line
        for (const [lineNum, lineTokens] of tokensByLine.entries()) {
            console.log(`\nLine ${lineNum}:`);
            console.log('  ' + lineTokens.map(t => `${t.type} '${t.lexeme}'`).join(', '));
        }
        
        console.log('\nLexing completed successfully!');
        console.log(`Total tokens: ${tokens.length}`);
        
        return tokens;
    } catch (error) {
        console.error('Error during lexing:', error.message);
        process.exit(1);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testLexer();
}

module.exports = {
    Lexer,
    Token,
    TokenType
};
