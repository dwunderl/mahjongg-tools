// Using prototype-based inheritance for maximum compatibility
function SevenPairsTemplate() {
    // Call parent constructor
    BaseTemplate.call(this);
    
    // Set up template properties
    this.name = 'Seven Pairs';
    this.description = 'A hand consisting of seven pairs of identical tiles';
    this.category = 'Standard';
    this.points = 4;
    this.mtlPattern = '11 22 33 44 55 66 77';
}

// Set up inheritance
SevenPairsTemplate.prototype = Object.create(BaseTemplate.prototype);
SevenPairsTemplate.prototype.constructor = SevenPairsTemplate;

/**
 * Generate variations for the Seven Pairs template
 */
SevenPairsTemplate.prototype.generateVariations = function() {
    // This is a simplified version - in reality, you'd generate all possible 7-pair combinations
    // For now, we'll use the MTL pattern to generate a basic variation
    this.variations = this.parseMTL();
    
    // Add a more descriptive name to the first variation
    if (this.variations && this.variations.length > 0) {
        this.variations[0] = this.variations[0] || {};
        this.variations[0].name = 'Basic Seven Pairs';
        this.variations[0].description = 'Simple sequence of seven pairs from 1 to 7';
    }
    
    return this.variations || [];
};

/**
 * Check if a hand matches the Seven Pairs pattern
 * @param {Array} hand - Array of tile codes
 * @returns {Object} - { matched: boolean, matchedVariations: Array, score: number }
 */
SevenPairsTemplate.prototype.matchHand = function(hand) {
    // Simple implementation - checks if hand has exactly 14 tiles with 7 pairs
    var tileCounts = {};
    
    // Count occurrences of each tile
    for (var i = 0; i < hand.length; i++) {
        var tile = hand[i];
        tileCounts[tile] = (tileCounts[tile] || 0) + 1;
    }
    
    // Check for exactly 7 pairs
    var pairs = 0;
    var tileCodes = Object.keys(tileCounts);
    for (var j = 0; j < tileCodes.length; j++) {
        if (tileCounts[tileCodes[j]] === 2) {
            pairs++;
        }
    }
    
    var isMatch = (pairs === 7) && (hand.length === 14);
    
    // Prepare the result
    var result = {
        matched: isMatch,
        matchedVariations: [],
        score: isMatch ? this.points : 0
    };
    
    if (isMatch) {
        // Create a copy of the hand array
        var handCopy = [];
        for (var k = 0; k < hand.length; k++) {
            handCopy.push(hand[k]);
        }
        
        result.matchedVariations = [{
            name: 'Seven Pairs',
            description: 'Hand contains seven pairs',
            tiles: handCopy,
            score: this.points
        }];
    }
    
    return result;
};

// Export for CommonJS/Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SevenPairsTemplate;
}
// Export for browsers
else if (typeof window !== 'undefined') {
    window.SevenPairsTemplate = SevenPairsTemplate;
}
