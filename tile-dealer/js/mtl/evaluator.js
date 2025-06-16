// MTL Evaluator - Evaluates AST to generate tile groups
// MTL Evaluator - Evaluates MTL AST
const MTL_Evaluator = {
    evaluate(ast, context = {}) {
        if (!ast) return [];
        
        // Initialize context with built-in functions
        const evalContext = {
            ...context,
            functions: {
                complement: (suit, suits) => suits.filter(s => s !== suit),
                // Add more built-in functions as needed
            }
        };
        
        // Evaluate the program
        return this.evaluateNode(ast, evalContext);
    },
    
    evaluateNode(node, context) {
        if (!node) return [];
        
        switch (node.type) {
            case 'Program':
                return this.evaluateProgram(node, context);
                
            case 'Assignment':
                return this.evaluateAssignment(node, context);
                
            case 'ForeachLoop':
                return this.evaluateForeach(node, context);
                
            case 'FunctionCall':
                return this.evaluateFunctionCall(node, context);
                
            case 'NumberRange':
                return this.evaluateNumberRange(node, context);
                
            case 'Tuple':
                return this.evaluateTuple(node, context);
                
            case 'Identifier':
                return this.evaluateIdentifier(node, context);
                
            case 'Number':
            case 'String':
                return node.value;
                
            default:
                console.warn('Unknown node type:', node.type, node);
                return [];
        }
    },
    
    evaluateProgram(program, context) {
        // First evaluate all metadata
        const metadataContext = { ...context };
        if (program.metadata) {
            Object.assign(metadataContext, program.metadata);
        }
        
        // Then evaluate the body
        return this.evaluateBlock(program.body, metadataContext);
    },
    
    evaluateBlock(statements, context) {
        let results = [];
        
        for (const stmt of statements) {
            const result = this.evaluateNode(stmt, context);
            if (Array.isArray(result)) {
                results.push(...result);
            } else if (result !== undefined) {
                results.push(result);
            }
        }
        
        return results;
    },
    
    evaluateAssignment(assignment, context) {
        const value = this.evaluateNode(assignment.value, context);
        context[assignment.variable] = value;
        return value;
    },
    
    evaluateForeach(foreachNode, context) {
        try {
            // Handle both 'foreach x in y' and 'foreach(x in y)' syntax
            let variable, collection;
            
            if (foreachNode.range && foreachNode.variable) {
                // Standard foreach node with variable and range
                variable = foreachNode.variable;
                collection = this.evaluateNode(foreachNode.range, context);
            } else if (Array.isArray(foreachNode.arguments) && foreachNode.arguments.length >= 3 && 
                      foreachNode.arguments[1] === 'in') {
                // Handle function-style foreach(in) call
                [variable, , collection] = foreachNode.arguments;
                collection = this.evaluateNode(collection, context);
            } else {
                throw new Error('Invalid foreach syntax');
            }
            
            const results = [];
            
            if (!collection) {
                console.warn('Empty or invalid collection in foreach:', collection);
                return results;
            }
            
            // Handle different collection types
            if (collection.type === 'NumberRange') {
                // Handle numeric range (1..9)
                for (let i = collection.start; i <= collection.end; i++) {
                    const loopContext = { ...context };
                    loopContext[variable] = i;
                    
                    const loopResults = this.evaluateBlock(foreachNode.body, loopContext);
                    results.push(...loopResults);
                }
            } else if (Array.isArray(collection)) {
                // Handle array iteration (foreach x in array)
                for (const item of collection) {
                    const loopContext = { ...context };
                    loopContext[variable] = item;
                    
                    const loopResults = this.evaluateBlock(foreachNode.body, loopContext);
                    results.push(...loopResults);
                }
            } else if (typeof collection === 'object' && collection !== null) {
                // Handle object properties
                for (const [key, value] of Object.entries(collection)) {
                    const loopContext = { ...context };
                    loopContext[variable] = { key, value };
                    
                    const loopResults = this.evaluateBlock(foreachNode.body, loopContext);
                    results.push(...loopResults);
                }
            } else if (typeof collection === 'string') {
                // Handle string iteration (foreach c in "abc")
                for (const char of collection) {
                    const loopContext = { ...context };
                    loopContext[variable] = char;
                    
                    const loopResults = this.evaluateBlock(foreachNode.body, loopContext);
                    results.push(...loopResults);
                }
            } else {
                console.warn('Unsupported collection type in foreach:', typeof collection, collection);
            }
            
            return results;
            
        } catch (error) {
            console.error('Error in foreach loop:', error);
            throw error;
        }
    },
    
    evaluateFunctionCall(funcCall, context) {
        try {
            const args = funcCall.arguments.map(arg => this.evaluateNode(arg, context));
            const funcName = funcCall.name.toLowerCase();
            
            // Handle built-in functions
            if (context.functions && context.functions[funcName]) {
                return context.functions[funcName](...args);
            }
            
            // Handle control structures and tile groups
            switch (funcName) {
                case 'foreach':
                    // Handle foreach(var in collection) syntax
                    if (args.length >= 3 && args[1] === 'in') {
                        const [varName, , collection] = args;
                        if (!collection) {
                            console.warn('Empty collection in foreach:', collection);
                            return [];
                        }
                        
                        // Create a synthetic foreach node
                        const foreachNode = {
                            type: 'ForeachLoop',
                            variable: varName,
                            range: collection,
                            body: funcCall.body || { type: 'BlockStatement', body: [] }
                        };
                        
                        return this.evaluateForeach(foreachNode, context);
                    }
                    break;
                    
                case 'pair':
                    return this.createTileGroup('pair', args, context);
                    
                case 'pung':
                    return this.createTileGroup('pung', args, context);
                    
                case 'kong':
                    return this.createTileGroup('kong', args, context);
                    
                case 'quint':
                    return this.createTileGroup('quint', args, context);
                    
                case 'single':
                    return this.createTileGroup('single', args, context);
                    
                case 'sequence':
                    return this.createSequence(args, context);
                    
                default:
                    console.warn('Unknown function:', funcCall.name);
                    return [];
            }
            
            return [];
            
        } catch (error) {
            console.error(`Error in function call ${funcCall.name}:`, error);
            throw error;
        }
    },
    
    createTileGroup(type, args, context) {
        // Handle different function signatures:
        // pair(F)
        // pair(n, s)
        // pung(n, s)
        
        let value, suit;
        
        if (args.length === 1) {
            // Single argument (e.g., pair(F))
            value = args[0];
            suit = null;
        } else if (args.length >= 2) {
            // Two arguments (e.g., pair(1, b))
            value = args[0];
            suit = args[1];
        }
        
        // Determine count based on group type
        let count;
        switch (type.toLowerCase()) {
            case 'single': count = 1; break;
            case 'pair':   count = 2; break;
            case 'pung':   count = 3; break;
            case 'kong':   count = 4; break;
            case 'quint':  count = 5; break;
            default:       count = 1;
        }
        
        // Create the tile group
        const tiles = [];
        for (let i = 0; i < count; i++) {
            const tile = suit ? `${value}${suit}` : value;
            tiles.push(tile);
        }
        
        return {
            type: type,
            tiles: tiles,
            value: value,
            suit: suit
        };
    },
    
    createSequence(args, context) {
        // sequence(start, suit, length)
        if (args.length < 3) {
            console.warn('Sequence requires at least 3 arguments');
            return [];
        }
        
        const start = parseInt(args[0], 10);
        const suit = args[1];
        const length = parseInt(args[2], 10);
        
        const tiles = [];
        for (let i = 0; i < length; i++) {
            tiles.push(`${start + i}${suit}`);
        }
        
        return {
            type: 'sequence',
            tiles: tiles,
            start: start,
            suit: suit,
            length: length
        };
    },
    
    evaluateNumberRange(range, context) {
        // Already evaluated in the parser
        return range;
    },
    
    evaluateTuple(tuple, context) {
        return tuple.elements.map(elem => this.evaluateNode(elem, context));
    },
    
    evaluateIdentifier(identifier, context) {
        // Look up the identifier in the context
        return context[identifier.name];
    }
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.MTL_Evaluator = MTL_Evaluator;
    window.MTL = window.MTL || {};
    window.MTL.Evaluator = MTL_Evaluator; // Also expose under MTL namespace
}

// Export for CommonJS/Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MTL_Evaluator };
}
