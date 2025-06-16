// MTL Utility Functions
const MTL_Utils = {
    // Parse MTL source and return AST
    parse(source) {
        return MTL.parse(source);
    },
    
    // Evaluate AST and return tile groups
    evaluate(ast, context = {}) {
        return MTL_Evaluator.evaluate(ast, context);
    },
    
    // Parse and evaluate MTL source in one step
    parseAndEvaluate(source, context = {}) {
        const ast = this.parse(source);
        return this.evaluate(ast, context);
    },
    
    // Generate all possible tile groups from a template
    generateTemplateVariations(templateSource) {
        try {
            const ast = this.parse(templateSource);
            const results = this.evaluate(ast);
            
            // Flatten the results and extract tile groups
            const variations = [];
            this._collectTileGroups(results, variations);
            
            return {
                name: ast.metadata.name || 'Unnamed Template',
                description: ast.metadata.description || '',
                category: ast.metadata.category || '',
                image: ast.metadata.image || '',
                variations: variations
            };
        } catch (error) {
            console.error('Error generating template variations:', error);
            return {
                name: 'Error',
                description: error.message,
                variations: []
            };
        }
    },
    
    // Helper to collect tile groups from evaluation results
    _collectTileGroups(node, results) {
        if (!node) return;
        
        if (Array.isArray(node)) {
            node.forEach(item => this._collectTileGroups(item, results));
        } else if (typeof node === 'object') {
            // Check if this is a tile group
            if (node.tiles && Array.isArray(node.tiles)) {
                results.push(node);
            }
            
            // Recursively check object properties
            Object.values(node).forEach(value => {
                if (value && typeof value === 'object') {
                    this._collectTileGroups(value, results);
                }
            });
        }
    },
    
    // Format a tile group for display
    formatTileGroup(group) {
        if (!group || !group.tiles) return '';
        
        switch (group.type) {
            case 'pair':
                return `Pair of ${this._formatTileValue(group.value, group.suit)}`;
            case 'pung':
                return `Pung of ${this._formatTileValue(group.value, group.suit)}`;
            case 'kong':
                return `Kong of ${this._formatTileValue(group.value, group.suit)}`;
            case 'quint':
                return `Quint of ${this._formatTileValue(group.value, group.suit)}`;
            case 'sequence':
                return `Sequence ${group.start}${group.suit} to ${group.start + group.length - 1}${group.suit}`;
            default:
                return group.tiles.join(' ');
        }
    },
    
    // Format a tile value for display
    _formatTileValue(value, suit) {
        if (!suit) return value; // For honors like F, D, etc.
        
        // Map suit codes to display names
        const suitNames = {
            'b': 'Bamboo',
            'c': 'Character',
            'd': 'Dot',
            'D': 'Dragon',
            'F': 'Flower',
            'N': 'North',
            'E': 'East',
            'S': 'South',
            'W': 'West'
        };
        
        const suitName = suitNames[suit] || suit;
        return `${value} ${suitName}`;
    },
    
    // Generate a random hand based on the template
    generateRandomHand(templateSource, count = 1) {
        const result = this.generateTemplateVariations(templateSource);
        if (!result.variations.length) return [];
        
        // For now, just return the tiles from the first variation
        // In a real implementation, you'd want to randomize this
        const allTiles = [];
        result.variations[0].tiles.forEach(tile => {
            allTiles.push(tile);
        });
        
        return allTiles.slice(0, count);
    }
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.MTL_Utils = MTL_Utils;
    window.MTL = window.MTL || {};
    window.MTL.Utils = MTL_Utils; // Also expose under MTL namespace
}

// Export for CommonJS/Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MTL_Utils };
}
