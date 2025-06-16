/**
 * Base class for all Mahjong hand templates
 * Using prototype-based inheritance for maximum compatibility
 */
function BaseTemplate() {
    // Basic template metadata
    this.name = '';               // Template name (e.g., "Seven Pairs")
    this.description = '';        // Template description
    this.category = '';           // Category (e.g., "Standard", "Special")
    this.requiredTiles = [];      // Required tiles (if any)
    this.excludedTiles = [];      // Tiles that cannot be in the hand
    this.points = 0;              // Base points for this template
    this.variations = [];         // Generated variations
    this.mtlPattern = '';         // MTL pattern for this template
}

/**
 * Generate all possible variations of this template
 * This should be implemented by each specific template
 */
BaseTemplate.prototype.generateVariations = function() {
    throw new Error('generateVariations() must be implemented by subclass');
};

/**
 * Check if a given hand matches this template
 * @param {Array} hand - Array of tile codes
 * @returns {Object} - { matched: boolean, matchedVariations: Array, score: number }
 */
BaseTemplate.prototype.matchHand = function(hand) {
    throw new Error('matchHand() must be implemented by subclass');
};

/**
 * Parse MTL pattern and generate variations
 */
BaseTemplate.prototype.parseMTL = function() {
    // Basic MTL parsing - simplified version
    if (!this.mtlPattern || typeof this.mtlPattern !== 'string') {
        return [];
    }
    
    // Split the pattern by spaces and remove empty strings
    var tiles = [];
    var parts = this.mtlPattern.split(' ');
    
    for (var i = 0; i < parts.length; i++) {
        if (parts[i]) {
            tiles.push(parts[i]);
        }
    }
    
    // Return a single variation for now
    return [{
        name: this.name || 'Variation',
        tiles: tiles,
        description: this.description || ''
    }];
};

/**
 * Get a compact string representation of the template
 */
BaseTemplate.prototype.toString = function() {
    return this.name + ' (' + this.category + '): ' + this.description;
};

/**
 * Get HTML representation of the template and its variations
 */
BaseTemplate.prototype.toHTML = function() {
    // Create a simple string instead of using template literals
    var html = '';
    html += '<div class="template">';
    html += '<h3>' + (this.name || 'Unnamed Template') + '</h3>';
    html += '<p class="category">' + (this.category || 'No Category') + ' (' + (this.points || 0) + ' points)</p>';
    html += '<p class="description">' + (this.description || 'No description available') + '</p>';
    
    if (this.mtlPattern) {
        html += '<div class="mtl-pattern">MTL: <code>' + this.mtlPattern + '</code></div>';
    }
    
    html += '<div class="variations">';
    html += '<h4>Variations (' + ((this.variations && this.variations.length) || 0) + ')</h4>';
    html += '<div class="variation-list">';
    
    // Add each variation
    if (this.variations && this.variations.length > 0) {
        for (var i = 0; i < this.variations.length; i++) {
            html += this.variationToHTML(this.variations[i]);
        }
    } else {
        html += '<p>No variations available.</p>';
    }
    
    html += '</div></div></div>';
    return html;
};

/**
 * Convert a variation to HTML
 */
BaseTemplate.prototype.variationToHTML = function(variation) {
    if (!variation || !variation.tiles || !Array.isArray(variation.tiles)) {
        return '<div class="variation">Invalid variation data</div>';
    }
    
    var html = '<div class="variation">';
    html += '<span class="variation-name">' + (variation.name || 'Variation') + ':</span>';
    html += '<div class="tiles">';
    
    // Add each tile
    for (var i = 0; i < variation.tiles.length; i++) {
        var tile = variation.tiles[i];
        if (tile) {
            html += '<span class="tile" data-tile-code="' + tile + '">' + this.getDisplayText(tile) + '</span>';
        }
    }
    
    html += '</div>';
    
    // Add description if it exists
    if (variation.description) {
        html += '<p class="variation-desc">' + variation.description + '</p>';
    }
    
    html += '</div>';
    return html;
};

/**
 * Helper to get display text for a tile code
 */
BaseTemplate.prototype.getDisplayText = function(tileCode) {
    // Simple mapping - using if/else for maximum compatibility
    if (!tileCode) return '';
    
    // Handle number tiles
    if (tileCode.length === 2) {
        var num = tileCode[0];
        var suit = tileCode[1];
        
        if (suit === 'B') return num + 'Bam';
        if (suit === 'C') return num + 'Crak';
        if (suit === 'D') return num + 'Dot';
    }
    
    // Handle special tiles
    if (tileCode === 'RD') return 'Red';
    if (tileCode === 'GD') return 'Green';
    if (tileCode === 'WD') return 'White';
    if (tileCode === 'N') return 'North';
    if (tileCode === 'E') return 'East';
    if (tileCode === 'W') return 'West';
    if (tileCode === 'S') return 'South';
    if (tileCode === 'FL') return 'Flower';
    if (tileCode === 'JK') return 'Joker';
    
    // Default case
    return tileCode;
};

// Export for CommonJS/Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseTemplate;
}
// Export for browsers
else if (typeof window !== 'undefined') {
    window.BaseTemplate = BaseTemplate;
}
