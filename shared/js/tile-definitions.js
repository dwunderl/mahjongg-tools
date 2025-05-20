// Shared tile definitions for Mahjongg Tools

// Tile types and their properties
const TileDefinitions = {
    // Suits
    suits: ['C', 'B', 'D'], // Crack, Bam, Dot
    suitNames: {
        'C': 'Crack',
        'B': 'Bam',
        'D': 'Dot'
    },
    
    // Numbers (for numbered tiles)
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    
    // Winds
    winds: ['N', 'E', 'S', 'W'],
    windNames: {
        'N': 'North',
        'E': 'East',
        'S': 'South',
        'W': 'West'
    },
    
    // Dragons
    dragons: ['RD', 'GD', 'WD'],
    dragonNames: {
        'RD': 'Red Dragon',
        'GD': 'Green Dragon',
        'WD': 'White Dragon'
    },
    
    // Special tiles
    flowers: ['FL'],
    jokers: ['JK'],
    
    // Get the full name of a tile
    getTileName: function(tileCode) {
        if (!tileCode) return 'Unknown';
        
        // Numbered tiles (e.g., '1C')
        if (tileCode.length === 2 && !isNaN(tileCode[0])) {
            const number = tileCode[0];
            const suit = tileCode[1];
            return `${number} ${this.suitNames[suit] || suit}`;
        }
        
        // Winds
        if (this.winds.includes(tileCode)) {
            return this.windNames[tileCode] || tileCode;
        }
        
        // Dragons
        if (this.dragons.includes(tileCode)) {
            return this.dragonNames[tileCode] || tileCode;
        }
        
        // Special cases
        switch(tileCode) {
            case 'FL': return 'Flower';
            case 'JK': return 'Joker';
            default: return tileCode; // Fallback
        }
    },
    
    // Check if a tile code is valid
    isValidTile: function(tileCode) {
        if (!tileCode) return false;
        
        // Check for numbered tiles (e.g., '1C')
        if (tileCode.length === 2 && !isNaN(tileCode[0])) {
            const number = tileCode[0];
            const suit = tileCode[1];
            return this.numbers.includes(number) && this.suits.includes(suit);
        }
        
        // Check for winds, dragons, etc.
        return this.winds.includes(tileCode) || 
               this.dragons.includes(tileCode) ||
               this.flowers.includes(tileCode) ||
               this.jokers.includes(tileCode);
    }
};

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TileDefinitions;
}
