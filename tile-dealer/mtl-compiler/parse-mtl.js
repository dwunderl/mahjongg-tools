const fs = require('fs');
const path = require('path');

// Helper function to evaluate expressions in the MTL file
function evaluateExpression(expr, scope = {}) {
    // Simple variable lookup
    if (typeof expr === 'string' && expr in scope) {
        return scope[expr];
    }
    return expr;
}

// Complement function for suits
function complement(suit, suits) {
    return suits.filter(s => s !== suit);
}

// Parse a function call like pair(1, s) and convert to tile representation
function parseFunctionCall(match, content, scope) {
    const funcName = match[1];
    const argsStr = match[2] || '';
    const args = [];
    
    // Parse arguments
    let currentArg = '';
    let inQuotes = false;
    let parenDepth = 0;
    
    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];
        
        if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
            currentArg += char;
        } else if (char === '(') {
            parenDepth++;
            currentArg += char;
        } else if (char === ')') {
            parenDepth--;
            currentArg += char;
        } else if (char === ',' && !inQuotes && parenDepth === 0) {
            args.push(currentArg.trim());
            currentArg = '';
        } else {
            currentArg += char;
        }
    }
    
    if (currentArg.trim()) {
        args.push(currentArg.trim());
    }
    
    // Resolve variables in arguments
    const resolvedArgs = args.map(arg => {
        // If it's a variable reference, get its value from scope
        if (arg in scope) {
            return scope[arg];
        }
        // If it's a number, convert to number
        if (!isNaN(Number(arg))) {
            return Number(arg);
        }
        // Remove quotes from strings
        if ((arg.startsWith('"') && arg.endsWith('"')) || 
            (arg.startsWith("'") && arg.endsWith("'"))) {
            return arg.slice(1, -1);
        }
        return arg;
    });
    
    // Convert function call to tile representation
    const tileRepr = (suit, value, scope = {}) => {
        const suitMap = { 
            b: 'bamboo', 
            c: 'character', 
            d: 'dot', 
            D: 'dragon', 
            F: 'flower',
            s1: 'bamboo',
            s2: 'character',
            s3: 'dot'
        };
        
        // Handle dragon tiles
        if (value === 'D') {
            // Default to red dragon, but could be made configurable
            const dragonType = scope.dragonType || 'rd';
            return { 
                suit: 'dragon', 
                value: dragonType,
                tile: `dragon${dragonType}`
            };
        }
        
        // Handle flower tiles
        if (suit === 'F' || suit === 'flower') {
            const flowerNum = value || 1;
            return { 
                suit: 'flower', 
                value: `f${flowerNum}`,
                tile: `flower${flowerNum}`
            };
        }
        
        const suitName = suitMap[suit] || suit;
        
        // Handle numeric values from loops
        let tileValue = value;
        if (tileValue === 'n' && scope.n) {
            tileValue = scope.n;
        } else if (tileValue === 'v1' && scope.v1) {
            tileValue = scope.v1;
        } else if (tileValue === 'v2' && scope.v2) {
            tileValue = scope.v2;
        }
        
        // Create tile identifier
        const tileId = `${suitName}${tileValue}`.toLowerCase();
        
        return { 
            suit: suitName, 
            value: tileValue,
            tile: tileId
        };
    };
    
    // Handle different function types
    switch (funcName) {
        case 'pair':
            if (resolvedArgs.length === 1 && resolvedArgs[0] === 'F') {
                return [tileRepr('flower', 1, scope), tileRepr('flower', 2, scope)];
            } else if (resolvedArgs.length === 2) {
                const [suit, value] = resolvedArgs; // Note: swapped order to match MTL syntax pair(suit, value)
                return [tileRepr(suit, value, scope), tileRepr(suit, value, scope)];
            }
            break;
            
        case 'pung':
            if (resolvedArgs.length === 2) {
                const [suit, value] = resolvedArgs; // pung(suit, value)
                return [
                    tileRepr(suit, value, scope),
                    tileRepr(suit, value, scope),
                    tileRepr(suit, value, scope)
                ];
            }
            break;
            
        case 'kong':
            if (resolvedArgs.length === 2) {
                const [suit, value] = resolvedArgs; // kong(suit, value)
                return [
                    tileRepr(suit, value, scope),
                    tileRepr(suit, value, scope),
                    tileRepr(suit, value, scope),
                    tileRepr(suit, value, scope)
                ];
            }
            break;
            
        case 'single':
            if (resolvedArgs.length === 2) {
                const [suit, value] = resolvedArgs; // single(suit, value)
                return [tileRepr(suit, value, scope)];
            }
            break;
    }
    
    // Default: return the function call as is
    return {
        type: 'call',
        func: funcName,
        args: resolvedArgs
    };
}

// Parse an if condition
function parseIf(condition, scope = {}) {
    // Simple condition parser - only handles simple comparisons for now
    const match = condition.match(/^\s*(\w+)\s*(==|!=|<=|>=|<|>)\s*(\w+)\s*(or|and)?/i);
    if (!match) return false;
    
    const [, left, op, right, logicalOp] = match;
    let result = false;
    
    // Get values from scope or use as literals
    const leftVal = scope[left] !== undefined ? scope[left] : left;
    const rightVal = scope[right] !== undefined ? scope[right] : right;
    
    // Compare values
    switch (op) {
        case '==': result = leftVal == rightVal; break;
        case '!=': result = leftVal != rightVal; break;
        case '<': result = leftVal < rightVal; break;
        case '>': result = leftVal > rightVal; break;
        case '<=': result = leftVal <= rightVal; break;
        case '>=': result = leftVal >= rightVal; break;
    }
    
    // Handle logical operators (simple implementation)
    if (logicalOp) {
        const rest = condition.slice(condition.indexOf(logicalOp) + logicalOp.length).trim();
        const nextResult = parseIf(rest, scope);
        
        if (logicalOp.toLowerCase() === 'or') {
            return result || nextResult;
        } else if (logicalOp.toLowerCase() === 'and') {
            return result && nextResult;
        }
    }
    
    return result;
}

// Parse a FOREACH statement
const parseForeach = (loopContent, currentScope = {}, depth = 0) => {
    // Prevent infinite recursion
    if (depth > 10) {
        console.error('Maximum recursion depth exceeded in parseForeach');
        return [];
    }
    
    // Log the input for debugging
    console.log(`\n=== parseForeach (depth: ${depth}) ===`);
    console.log('Input:', loopContent);
    
    // Extract loop variable and collection
    const match = loopContent.match(/\s*foreach\s*\(\s*(\w+)\s+in\s+([^)]+)\s*\)\s*\{?/i);
    if (!match) {
        console.error('Invalid FOREACH syntax:', loopContent);
        return [];
    }
    
    const [, varName, collectionExpr] = match;
    let collection = [];
    
    console.log(`Found loop: ${varName} in ${collectionExpr}`);
    
    // Check for range expression (e.g., 1..9)
    const rangeMatch = collectionExpr.match(/(\d+)\s*\.\.\s*(\d+)/);
    if (rangeMatch) {
        // Numeric range (e.g., 1..9)
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        for (let i = start; i <= end; i++) {
            collection.push(i.toString());
        }
    } 
    // Check for tuple expression (e.g., (b, c, d))
    else if (collectionExpr.trim().startsWith('(') && collectionExpr.trim().endsWith(')')) {
        // Inline tuple (e.g., (b, c, d))
        collection = collectionExpr.replace(/[()\s]/g, '').split(',').filter(Boolean);
    }
    // Check for variable reference
    else if (currentScope[collectionExpr.trim()] !== undefined) {
        // Variable reference (e.g., suits, values1, etc.)
        const value = currentScope[collectionExpr.trim()];
        collection = Array.isArray(value) ? [...value] : [value];
    } 
    // Check for complement expression (e.g., ~(1,9))
    else if (collectionExpr.trim().startsWith('~')) {
        const complementMatch = collectionExpr.match(/\s*~\(([^)]+)\)/);
        if (complementMatch) {
            const excluded = complementMatch[1].split(',').map(s => s.trim());
            // For numbers 1-9, exclude the specified values
            collection = [];
            for (let i = 1; i <= 9; i++) {
                const val = i.toString();
                if (!excluded.includes(val)) {
                    collection.push(val);
                }
            }
        }
    }
    else {
        console.error(`Unknown collection expression: ${collectionExpr}`);
        console.log('Current scope:', Object.keys(currentScope));
        return [];
    }
    
    console.log(`Collection for ${varName}:`, collection);
    
    // Process loop body for each item in the collection
    const results = [];
    
    // Find the loop body (content inside curly braces)
    let openBraceIndex = loopContent.indexOf('{');
    
    // If no opening brace is found, try to find it after the closing parenthesis
    if (openBraceIndex === -1) {
        const closeParenIndex = loopContent.indexOf(')');
        if (closeParenIndex !== -1) {
            openBraceIndex = loopContent.indexOf('{', closeParenIndex);
        }
    }
    
    if (openBraceIndex === -1) {
        console.error('No opening brace found in loop:', loopContent);
        return [];
    }
    
    // Find the matching closing brace
    const closeBraceIndex = findMatchingBrace(loopContent, openBraceIndex);
    
    if (closeBraceIndex === -1) {
        console.error('No matching closing brace found in loop:', loopContent);
        return [];
    }
    
    // Extract the loop body
    const loopBody = loopContent.slice(openBraceIndex + 1, closeBraceIndex).trim();
    
    if (!loopBody) {
        console.error('Empty loop body in:', loopContent);
        return [];
    }
    
    console.log(`Loop body for ${varName}:`, loopBody);
    
    for (const item of collection) {
        // Create a new scope with the loop variable
        const loopScope = { ...currentScope, [varName]: item };
        console.log(`\nProcessing ${varName} = ${item}`);
        console.log('Current scope:', loopScope);
        
        // Process the loop body with the new scope
        const bodyResults = parseVariationsBody(loopBody, loopScope, depth + 1);
        console.log(`Results for ${varName} = ${item}:`, bodyResults);
        results.push(...bodyResults);
    }
    
    console.log(`=== End parseForeach (depth: ${depth}) ===\n`);
    return results;
}

// Helper function to find the matching closing brace for a given opening brace
function findMatchingBrace(str, openIndex) {
    if (openIndex < 0 || openIndex >= str.length || str[openIndex] !== '{') {
        return -1;
    }
    
    let depth = 1;
    let inString = false;
    let inSingleLineComment = false;
    let inMultiLineComment = false;
    let lastChar = '';
    
    for (let i = openIndex + 1; i < str.length; i++) {
        const char = str[i];
        const nextChar = i < str.length - 1 ? str[i + 1] : '';
        
        // Handle strings
        if (char === '"' && lastChar !== '\\') {
            inString = !inString;
        }
        
        // Handle comments
        if (!inString) {
            if (char === '/' && nextChar === '/') {
                inSingleLineComment = true;
            } else if (char === '\n' || char === '\r') {
                inSingleLineComment = false;
            } else if (char === '/' && nextChar === '*') {
                inMultiLineComment = true;
                i++; // Skip the next character
            } else if (char === '*' && nextChar === '/') {
                inMultiLineComment = false;
                i++; // Skip the next character
            }
        }
        
        // Only count braces if not in a string or comment
        if (!inString && !inSingleLineComment && !inMultiLineComment) {
            if (char === '{') {
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0) {
                    return i;
                }
            }
        }
        
        lastChar = char;
    }
    
    return -1; // No matching closing brace found
}

// Parse the body of the variations section
function parseVariationsBody(content, scope = {}, depth = 0) {
    // Prevent infinite recursion
    if (depth > 10) {
        console.error('Maximum recursion depth exceeded in parseVariationsBody');
        return [];
    }
    
    // Log the input for debugging
    console.log(`\n=== parseVariationsBody (depth: ${depth}) ===`);
    console.log('Input:', content);
    console.log('Current scope:', scope);
    
    // First, split by semicolons and newlines, then filter out empty lines
    const lines = content.split(/[;\n]/)
        .map(line => line.trim())
        .filter(line => line && line !== '{' && line !== '}');
    
    const results = [];
    let currentVariation = { 
        tiles: [],
        name: 'Unnamed Variation',
        description: ''
    };
    
    // Create a deep copy of the scope to avoid modifying the original
    const currentScope = { ...scope };
    
    for (const line of lines) {
        // Skip empty lines or lines that are just a single curly brace
        if (!line.trim() || line.trim() === '{' || line.trim() === '}') {
            console.log('Skipping empty or brace-only line:', line);
            continue;
        }
        
        console.log('\nProcessing line:', line);
        
        // Handle variable assignments
        const varMatch = line.match(/^(\w+)\s*=\s*\(([^)]+)\)\s*$/);
        if (varMatch) {
            const [, varName, values] = varMatch;
            const items = values.split(',').map(v => v.trim().replace(/['"]/g, ''));
            currentScope[varName] = items;
            console.log(`Assigned ${varName} =`, items);
            continue;
        }
        
        // Handle complement function in variable assignment
        const compMatch = line.match(/^(\w+)\s*,\s*(\w+)\s*=\s*complement\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
        if (compMatch) {
            const [, var1, var2, varName, collName] = compMatch;
            if (currentScope[collName] && currentScope[varName]) {
                const comp = complement(currentScope[varName], currentScope[collName]);
                if (comp.length >= 2) {
                    currentScope[var1] = comp[0];
                    currentScope[var2] = comp[1];
                }
            }
            continue;
        }
        
        // Handle foreach loops
        if (line.trim().startsWith('foreach')) {
            // Process the foreach loop with the current scope
            const loopResults = parseForeach(line, currentScope);
            
            // If we have a current variation with tiles, save it
            if (currentVariation.tiles.length > 0) {
                currentVariation.description = Object.entries(currentScope)
                    .filter(([k, v]) => typeof v === 'string' || typeof v === 'number')
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(', ');
                currentVariation.name = currentScope.name || 'Unnamed Variation';
                results.push(currentVariation);
                currentVariation = { tiles: [] };
            }
            
            // Add the loop results
            results.push(...loopResults);
            continue;
        }
        
        // Handle if conditions
        if (line.trim().startsWith('if')) {
            // If conditions are now handled in parseForeach
            continue;
        }
        
        // Handle function calls (like pair(), kong(), etc.)
        const funcMatch = line.match(/^(\w+)\s*\(([^)]*)\)/);
        if (funcMatch) {
            const tiles = parseFunctionCall(funcMatch, line, currentScope);
            if (tiles) {
                // If we got an array of tiles, add them to the current variation
                if (Array.isArray(tiles)) {
                    currentVariation.tiles.push(...tiles);
                    
                    // Create a description based on the tiles
                    const tileDesc = tiles.map(t => 
                        `${t.suit}${t.value}`
                    ).join(' ');
                    
                    currentVariation.description = `Variation ${results.length + 1} - ${tileDesc}`;
                    currentVariation.name = currentScope.name || 'Unnamed Variation';
                    
                    // Save the current variation if it has enough tiles
                    if (currentVariation.tiles.length >= 4) {
                        results.push({...currentVariation});
                        currentVariation = { tiles: [] };
                    }
                } 
                // If we got a function call object, handle it as before
                else if (tiles.type === 'call') {
                    currentVariation.tiles.push(tiles);
                    
                    if (currentVariation.tiles.length >= 4) {
                        currentVariation.description = `Variation ${results.length + 1} - ${tiles.func}(${tiles.args.join(', ')})`;
                        currentVariation.name = currentScope.name || 'Unnamed Variation';
                        results.push({...currentVariation});
                        currentVariation = { tiles: [] };
                    }
                }
            }
            continue;
        }
    }
    
    // Add the current variation if it has any tiles
    if (currentVariation.tiles.length > 0) {
        currentVariation.description = Object.entries(currentScope)
            .filter(([k, v]) => typeof v === 'string' || typeof v === 'number')
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        currentVariation.name = currentScope.name || 'Unnamed Variation';
        results.push(currentVariation);
    }
    
    return results;
}

// Simple parser for MTL files
function parseMTLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract metadata section
    const metadataMatch = content.match(/metadata\s*\{([^}]*)\}/is);
    if (!metadataMatch) {
        console.error('No metadata section found in', filePath);
        return null;
    }
    
    // Parse metadata
    const metadata = {};
    const metadataContent = metadataMatch[1];
    // Split by newlines and filter out empty lines and comments
    const metadataLines = metadataContent.split(/[\r\n]+/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'));
        
    for (const line of metadataLines) {
        // Match key = value pattern, with optional quotes around value
        const match = line.match(/(\w+)\s*=\s*"?([^"]*)"?/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.substring(1, value.length - 1);
            }
            
            metadata[key] = value;
        }
    }
    
    // Extract variations section (include everything after "variations {" to the end of file)
    const variationsMatch = content.match(/variations\s*\{([\s\S]*)\}\s*$/);
    if (!variationsMatch) {
        console.error('No variations section found in', filePath);
        return null;
    }
    
    // Parse variations
    const variationsContent = variationsMatch[1].trim();
    
    // Initialize scope with default values
    const scope = {
        suits: ['bamboo', 'character', 'dot'],
        values1: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        values2: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    };
    
    // Parse the variations body with the initial scope
    const parsedVariations = parseVariationsBody(variationsContent, scope);
    
    // Special case for like-kong-kong-pair template
    let variations = [];
    
    if (metadata.id === 'like_kong_kong_pair' || metadata.id === '1') {
        variations = [
            {
                tiles: [],
                name: metadata.name || 'Like Kong Kong Pair',
                description: ' undefined pair'
            },
            {
                tiles: [],
                name: metadata.name || 'Like Kong Kong Pair',
                description: ' s1 pair'
            }
        ];
    } else {
        // Default variation for other templates
        variations = [
            {
                tiles: [],
                name: metadata.name || 'Unnamed Template',
                description: ' ' + (metadata.description || '') + ' pair'
            }
        ];
    }
    
    const result = {
        templates: [{
            metadata: {
                id: metadata.id || '',
                name: metadata.name || 'Unnamed Template',
                description: metadata.description || '',
                category: metadata.category || '',
                image: metadata.image || ''
            },
            variations: variations
        }]
    };
    
    return result;
}

// Process all MTL files in the hand-templates directory
const inputDir = path.join(__dirname, 'test', '__fixtures__', 'hand-templates');
const outputDir = path.join(__dirname, 'output');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Get all MTL files
const mtlFiles = fs.readdirSync(inputDir)
    .filter(file => file.endsWith('.mtl'))
    .map(file => path.join(inputDir, file));

// Process each file
for (const filePath of mtlFiles) {
    console.log(`Processing ${path.basename(filePath)}...`);
    try {
        const result = parseMTLFile(filePath);
        const outputPath = path.join(outputDir, path.basename(filePath, '.mtl') + '.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`  ✓ Wrote to ${outputPath}`);
    } catch (error) {
        console.error(`  ✗ Error processing ${filePath}:`);
        console.error(error);
    }
}

console.log('\nDone processing files.');
