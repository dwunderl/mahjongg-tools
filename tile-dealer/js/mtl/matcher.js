// MTL Template Matcher - Handles matching hands against templates
const MTL_Matcher = {
    // Match a hand against a template
    matchHandToTemplate(hand, template) {
        if (!template || !template.variations || !template.variations.length) {
            return {
                match: false,
                score: 0,
                matchedTiles: [],
                message: 'No template variations found'
            };
        }

        // Convert hand to a more workable format if needed
        const normalizedHand = this.normalizeHand(hand);
        
        // Track the best match across all variations
        let bestMatch = {
            match: false,
            score: 0,
            matchedTiles: [],
            message: 'No matches found'
        };

        // Try each variation of the template
        for (const variation of template.variations) {
            const matchResult = this.matchVariation(normalizedHand, variation);
            
            // Update best match if this one is better
            if (matchResult.score > bestMatch.score) {
                bestMatch = matchResult;
                bestMatch.variationName = variation.name || 'Unnamed Variation';
                bestMatch.variationDescription = variation.description || '';
            }
        }

        return bestMatch;
    },

    // Match hand against a single variation
    matchVariation(hand, variation) {
        if (!variation.tiles || !variation.tiles.length) {
            return {
                match: false,
                score: 0,
                matchedTiles: [],
                message: 'No tiles in variation'
            };
        }

        // Make a copy of the hand to work with
        const handTiles = [...hand];
        const matchedTiles = [];
        let score = 0;

        // Sort tiles by frequency (helps with matching groups)
        const tileCounts = this.countTiles(handTiles);
        
        // Try to match each tile in the variation
        for (const tile of variation.tiles) {
            const matched = this.findMatchingTile(tile, handTiles, tileCounts);
            if (matched) {
                matchedTiles.push(matched.tile);
                score += matched.score;
                
                // Remove the matched tile from hand
                const index = handTiles.indexOf(matched.tile);
                if (index > -1) {
                    handTiles.splice(index, 1);
                    tileCounts[matched.tile]--;
                }
            }
        }

        // Calculate match percentage
        const matchPercentage = (matchedTiles.length / variation.tiles.length) * 100;
        
        return {
            match: matchPercentage === 100,
            score: matchPercentage,
            matchedTiles,
            message: matchPercentage === 100 
                ? 'Perfect match!' 
                : `Matched ${matchedTiles.length} of ${variation.tiles.length} tiles (${matchPercentage.toFixed(1)}%)`
        };
    },

    // Find a matching tile in the hand for a given template tile
    findMatchingTile(templateTile, handTiles, tileCounts) {
        // First try exact match
        for (const tile of handTiles) {
            if (this.tilesMatch(tile, templateTile)) {
                return { tile, score: 1 };
            }
        }

        // Then try wildcard matches (jokers)
        for (const tile of handTiles) {
            if (this.isJoker(tile) && this.canUseJokerFor(templateTile, tileCounts)) {
                return { tile, score: 0.8 }; // Slight penalty for using jokers
            }
        }

        // No match found
        return null;
    },

    // Check if two tiles match (with wildcard support)
    tilesMatch(tile1, tile2) {
        // Handle jokers
        if (this.isJoker(tile1) || this.isJoker(tile2)) {
            return false; // Jokers are handled in findMatchingTile
        }
        
        // Simple string comparison for now
        // Could be enhanced to handle tile equivalences
        return tile1 === tile2;
    },

    // Check if a tile is a joker/wildcard
    isJoker(tile) {
        return tile === 'J' || tile === 'j';
    },

    // Check if a joker can be used for a specific tile
    canUseJokerFor(tile, tileCounts) {
        // In standard Mahjong, jokers can be used for any tile
        // but we might want to add restrictions later
        return true;
    },

    // Count occurrences of each tile in the hand
    countTiles(tiles) {
        const counts = {};
        for (const tile of tiles) {
            counts[tile] = (counts[tile] || 0) + 1;
        }
        return counts;
    },

    // Normalize hand to a consistent format
    normalizeHand(hand) {
        // Convert tile objects to strings if needed
        return hand.map(tile => {
            if (typeof tile === 'object') {
                return tile.value || tile.tile || '';
            }
            return String(tile);
        }).filter(Boolean);
    },

    // Calculate a similarity score between two hands
    calculateSimilarity(hand1, hand2) {
        const counts1 = this.countTiles(hand1);
        const counts2 = this.countTiles(hand2);
        
        let matches = 0;
        let total = 0;
        
        // Count matches for each tile type
        const allTiles = new Set([...Object.keys(counts1), ...Object.keys(counts2)]);
        for (const tile of allTiles) {
            const count1 = counts1[tile] || 0;
            const count2 = counts2[tile] || 0;
            matches += Math.min(count1, count2);
            total += Math.max(count1, count2);
        }
        
        return total > 0 ? (matches / total) * 100 : 0;
    }
};

// Expose to global scope
if (typeof window !== 'undefined') {
    window.MTL_Matcher = MTL_Matcher;
    window.MTL = window.MTL || {};
    window.MTL.Matcher = MTL_Matcher; // Also expose under MTL namespace
}

// Export for CommonJS/Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MTL_Matcher };
}
