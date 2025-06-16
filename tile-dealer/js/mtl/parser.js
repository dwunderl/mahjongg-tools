// MTL Parser - Converts MTL source to AST
const MTL = {
    parse(source) {
        const lines = source.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('//'));
        
        const ast = {
            type: 'Program',
            metadata: {},
            body: []
        };
        
        let i = 0;
        
        // Parse metadata (name, description, etc.)
        while (i < lines.length && lines[i].includes('=')) {
            const [key, ...valueParts] = lines[i].split('=').map(s => s.trim());
            let value = valueParts.join('=').trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith('"') && value.endsWith('"'))) {
                value = value.slice(1, -1);
            }
            
            ast.metadata[key] = value;
            i++;
        }
        
        // Skip template start if present
        if (lines[i] === 'template:') {
            i++;
        }
        
        // Parse the template body
        ast.body = this.parseBlock(lines, i);
        
        return ast;
    },
    
    parseBlock(lines, startIndex) {
        const block = [];
        let i = startIndex;
        
        while (i < lines.length) {
            const line = lines[i];
            
            if (line.startsWith('foreach')) {
                // Parse both 'foreach(x in y)' and 'foreach x in y:' syntax
                const funcStyleMatch = line.match(/^foreach\s*\(\s*(\w+)\s+in\s+([^)]+)\s*\)/);
                const blockStyleMatch = line.match(/^foreach\s+(\w+)\s+in\s+([^:]+):/);
                
                if (!funcStyleMatch && !blockStyleMatch) {
                    throw new Error(`Invalid foreach syntax: ${line}`);
                }
                
                const isBlockStyle = !!blockStyleMatch;
                const match = isBlockStyle ? blockStyleMatch : funcStyleMatch;
                
                const loopVar = match[1];
                const range = match[2].trim();
                
                const loopNode = {
                    type: 'ForeachLoop',
                    variable: loopVar,
                    range: this.parseRange(range),
                    body: []
                };
                
                // For block style, parse the indented body
                if (isBlockStyle) {
                    i++;
                    let depth = 1;
                    while (i < lines.length && depth > 0) {
                        if (lines[i].startsWith('foreach')) depth++;
                        if (lines[i] === 'End:') depth--;
                        
                        if (depth > 0) {
                            this.parseStatementLine(lines[i], loopNode.body);
                            i++;
                        }
                    }
                } else {
                    // For function style, treat it as a single statement
                    i++;
                    if (i < lines.length) {
                        this.parseStatementLine(lines[i], loopNode.body);
                        i++;
                    }
                }
                
                block.push(loopNode);
            } else if (line === 'End:') {
                // End of current block
                break;
            } else if (line.match(/^\w+\s*=\s*.+/)) {
                // Variable assignment outside loops
                const [varName, ...valueParts] = line.split('=').map(s => s.trim());
                const value = valueParts.join('=').trim();
                
                block.push({
                    type: 'Assignment',
                    variable: varName,
                    value: this.parseValue(value)
                });
                i++;
            } else if (line.match(/^\w+\s*\(/)) {
                // Function call (tile group) outside loops
                const funcMatch = line.match(/^(\w+)\s*\(([^)]*)\)/);
                if (funcMatch) {
                    const funcName = funcMatch[1];
                    const args = funcMatch[2].split(',').map(s => s.trim()).filter(Boolean);
                    
                    block.push({
                        type: 'FunctionCall',
                        name: funcName,
                        arguments: args.map(arg => this.parseValue(arg))
                    });
                }
                i++;
            } else {
                i++;
            }
        }
        
        return block;
    },
    
    parseStatementLine(line, statements) {
        if (!line.trim()) return;
        
        if (line.match(/^\w+\s*=\s*.+/)) {
            // Variable assignment
            const [varName, ...valueParts] = line.split('=').map(s => s.trim());
            const value = valueParts.join('=').trim();
            
            statements.push({
                type: 'Assignment',
                variable: varName,
                value: this.parseValue(value)
            });
        } else if (line.match(/^\w+\s*\(/)) {
            // Function call (tile group)
            const funcMatch = line.match(/^(\w+)\s*\(([^)]*)\)/);
            if (funcMatch) {
                const funcName = funcMatch[1];
                const args = funcMatch[2].split(',').map(s => s.trim()).filter(Boolean);
                
                statements.push({
                    type: 'FunctionCall',
                    name: funcName,
                    arguments: args.map(arg => this.parseValue(arg))
                });
            }
        } else if (line.trim() !== 'End:') {
            console.warn('Unrecognized statement:', line);
        }
    },
    
    parseRange(range) {
        // Check for number range (1..9)
        const rangeMatch = range.match(/^(\d+)\.\.(\d+)$/);
        if (rangeMatch) {
            return {
                type: 'NumberRange',
                start: parseInt(rangeMatch[1]),
                end: parseInt(rangeMatch[2])
            };
        }
        
        // Check for array literal [1,2,3] or ['a','b','c']
        if (range.startsWith('[') && range.endsWith(']')) {
            return range.slice(1, -1).split(',').map(s => s.trim())
                .filter(Boolean)
                .map(item => this.parseValue(item));
        }
        
        // Single value
        return this.parseValue(range);
    },
    
    parseValue(value) {
        if (value === undefined || value === null) return null;
        
        // Convert to string for parsing
        const strValue = String(value).trim();
        
        // Handle empty string
        if (strValue === '') return '';
        
        // Handle string literals (single or double quoted)
        if ((strValue.startsWith('"') && strValue.endsWith('"')) ||
            (strValue.startsWith('\'') && strValue.endsWith('\''))) {
            return strValue.slice(1, -1);
        }
        
        // Handle numbers (integers and floats)
        if (/^-?\d+(\.\d+)?$/.test(strValue)) {
            return parseFloat(strValue);
        }
        
        // Handle boolean values
        if (strValue.toLowerCase() === 'true') return true;
        if (strValue.toLowerCase() === 'false') return false;
        
        // Handle null/undefined
        if (strValue.toLowerCase() === 'null') return null;
        if (strValue.toLowerCase() === 'undefined') return undefined;
        
        // Handle arrays
        if (strValue.startsWith('[') && strValue.endsWith(']')) {
            try {
                // Handle empty array
                if (strValue.trim() === '[]') return [];
                
                // Parse array elements
                return strValue.slice(1, -1)
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s !== '') // Remove empty strings
                    .map(item => this.parseValue(item));
            } catch (e) {
                console.warn('Error parsing array:', strValue, e);
                return [];
            }
        }
        
        // Handle function calls
        if (strValue.includes('(') && strValue.endsWith(')')) {
            try {
                const funcMatch = strValue.match(/^(\w+)\s*\(([^)]*)\)/);
                if (funcMatch) {
                    const funcName = funcMatch[1];
                    const args = funcMatch[2].split(',')
                        .map(s => s.trim())
                        .filter(s => s !== '') // Remove empty strings
                        .map(arg => this.parseValue(arg));
                    
                    return {
                        type: 'FunctionCall',
                        name: funcName,
                        arguments: args
                    };
                }
            } catch (e) {
                console.warn('Error parsing function call:', strValue, e);
            }
        }
        
        // Handle template literals with ${...}
        if (strValue.includes('${')) {
            // Simple template literal handling - just remove the ${} for now
            // TODO: Implement proper template literal evaluation
            return strValue.replace(/\$\{([^}]+)\}/g, (_, expr) => {
                return this.parseValue(expr.trim());
            });
        }
        
        // Handle variable references (identifiers)
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(strValue)) {
            return {
                type: 'Identifier',
                name: strValue
            };
        }
        
        // Default: return as string
        return strValue;
    }
};

// Create the MTL_Parser object with the parse function at the top level
const MTL_Parser = {
    parse: MTL.parse.bind(MTL),
    MTL: MTL // Also expose the full MTL object
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.MTL_Parser = MTL_Parser;
    window.MTL = MTL; // Also expose MTL directly for backward compatibility
}

// Export for CommonJS/Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MTL, MTL_Parser };
}
