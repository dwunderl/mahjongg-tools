/**
 * Mahjongg Dealer Class
 * Combines tile rendering from tile-dealer-exp with analysis from index-simple.html
 */
class MahjonggDealer {
    constructor(options = {}) {
        // DOM elements
        this.handContainer = options.handContainer || document.getElementById('hand-container');
        this.analysisContainer = options.analysisContainer || document.getElementById('analysis-results');
        this.debugContainer = options.debugContainer || document.getElementById('debug-messages');
        
        // Game state
        this.deck = [];
        this.hand = [];
        this.tileType = 'suit'; // Default to suit tiles
        
        // Initialize
        this.initializeDeck();
        this.debugLog('MahjonggDealer initialized');
    }
    
    /**
     * Initialize a full deck of Mahjongg tiles
     */
    initializeDeck() {
        this.deck = [];
        
        // Add suit tiles (Bamboo, Characters, Dots)
        const suits = ['B', 'C', 'D'];
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // 4 of each tile in a full set
        for (let i = 0; i < 4; i++) {
            // Suit tiles
            suits.forEach(suit => {
                values.forEach(value => {
                    this.deck.push({ type: 'suit', suit, value });
                });
            });
            
            // Dragons
            this.deck.push({ type: 'dragon', suit: 'RD' }); // Red Dragon
            this.deck.push({ type: 'dragon', suit: 'GD' }); // Green Dragon
            this.deck.push({ type: 'dragon', suit: 'WD' }); // White Dragon
            
            // Winds
            this.deck.push({ type: 'wind', suit: 'east' });
            this.deck.push({ type: 'wind', suit: 'south' });
            this.deck.push({ type: 'wind', suit: 'west' });
            this.deck.push({ type: 'wind', suit: 'north' });
            
            // Flowers
            this.deck.push({ type: 'flower', suit: 'F' });
        }
        
        this.shuffleDeck();
        this.debugLog(`Deck initialized with ${this.deck.length} tiles`);
    }
    
    /**
     * Shuffle the deck using Fisher-Yates algorithm
     */
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
        this.debugLog('Deck shuffled');
    }
    
    /**
     * Deal a new hand with the specified number of tiles
     * @param {number} count - Number of tiles to deal
     */
    dealNewHand(count = 13) {
        if (this.deck.length < count) {
            this.debugLog('Not enough tiles in deck. Reshuffling...');
            this.initializeDeck();
        }
        
        this.hand = [];
        for (let i = 0; i < count; i++) {
            this.addTile();
        }
        
        this.renderHand();
        this.debugLog(`Dealt new hand of ${count} tiles`);
    }
    
    /**
     * Add a tile to the current hand
     */
    addTile() {
        if (this.deck.length === 0) {
            this.debugLog('No more tiles in deck!');
            return;
        }
        
        let tile = this.deck.pop();
        this.hand.push(tile);
        this.renderHand();
        this.debugLog(`Added tile: ${this.formatTile(tile)}`);
    }
    
    /**
     * Sort the current hand
     */
    sortHand() {
        // Sort by type, then by suit, then by value
        this.hand.sort((a, b) => {
            // First sort by type
            const typeOrder = { 'suit': 1, 'dragon': 2, 'wind': 3, 'flower': 4 };
            if (typeOrder[a.type] !== typeOrder[b.type]) {
                return typeOrder[a.type] - typeOrder[b.type];
            }
            
            // Then by suit
            if (a.suit !== b.suit) {
                return a.suit.localeCompare(b.suit);
            }
            
            // Then by value (if applicable)
            if (a.value && b.value) {
                return a.value - b.value;
            }
            
            return 0;
        });
        
        this.renderHand();
        this.debugLog('Hand sorted');
    }
    
    /**
     * Render the current hand in the UI
     */
    renderHand() {
        // Clear the container
        this.handContainer.innerHTML = '';
        
        // Add each tile
        this.hand.forEach((tile, index) => {
            const tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.dataset.index = index;
            
            // Add appropriate classes based on tile type
            if (tile.type === 'suit') {
                tileEl.classList.add(`tile-${tile.suit.toLowerCase()}`);
                tileEl.textContent = tile.value;
                tileEl.title = `${tile.value}${tile.suit}`;
                tileEl.dataset.suit = tile.suit;
                tileEl.dataset.value = tile.value;
            } 
            else if (tile.type === 'dragon') {
                tileEl.classList.add('tile-dragon');
                tileEl.classList.add(`tile-dragon-${tile.suit.toLowerCase() === 'rd' ? 'red' : tile.suit.toLowerCase() === 'gd' ? 'green' : 'white'}`);
                tileEl.textContent = tile.suit === 'RD' ? '中' : tile.suit === 'GD' ? '發' : '白';
                tileEl.title = `${tile.suit === 'RD' ? 'Red' : tile.suit === 'GD' ? 'Green' : 'White'} Dragon`;
                tileEl.dataset.suit = tile.suit;
            }
            else if (tile.type === 'wind') {
                tileEl.classList.add('tile-wind');
                const windLetter = tile.suit.charAt(0).toUpperCase();
                tileEl.textContent = windLetter;
                tileEl.title = `${tile.suit.charAt(0).toUpperCase() + tile.suit.slice(1)} Wind`;
                tileEl.dataset.suit = 'W';
            }
            else if (tile.type === 'flower') {
                tileEl.classList.add('tile-flower');
                tileEl.innerHTML = '❀';
                tileEl.title = 'Flower';
                tileEl.dataset.suit = 'F';
            }
            
            // Add click handler to remove tile
            tileEl.addEventListener('click', () => this.removeTile(index));
            
            this.handContainer.appendChild(tileEl);
        });
    }
    
    /**
     * Remove a tile from the hand
     * @param {number} index - Index of the tile to remove
     */
    removeTile(index) {
        if (index >= 0 && index < this.hand.length) {
            const removed = this.hand.splice(index, 1)[0];
            this.renderHand();
            this.debugLog(`Removed tile: ${this.formatTile(removed)}`);
        }
    }
    
    /**
     * Analyze the current hand
     */
    analyzeHand() {
        if (this.hand.length === 0) {
            this.analysisContainer.innerHTML = '<p>No tiles in hand to analyze.</p>';
            return;
        }
        
        // Group tiles by type and value
        const groups = {};
        this.hand.forEach(tile => {
            const key = tile.type === 'suit' ? `${tile.suit}${tile.value}` : tile.suit;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(tile);
        });
        
        // Count combinations
        const pairs = [];
        const pungs = [];
        const kongs = [];
        
        Object.values(groups).forEach(group => {
            if (group.length >= 2) {
                pairs.push(group[0]);
            }
            if (group.length >= 3) {
                pungs.push(group[0]);
            }
            if (group.length >= 4) {
                kongs.push(group[0]);
            }
        });
        
        // Find potential chows (only for suit tiles with numbers)
        const chows = this.findChows();
        
        // Generate HTML for analysis
        let html = `
            <div class="analysis-section">
                <h4>Hand Summary</h4>
                <p>Total Tiles: ${this.hand.length}</p>
            </div>
            
            <div class="analysis-section">
                <h4>Combinations</h4>
                <p>Pairs: ${pairs.length}</p>
                <div class="tile-group">
                    ${pairs.map(tile => this.createTileHtml(tile)).join('')}
                </div>
                
                <p>Pungs (3 of a kind): ${pungs.length}</p>
                <div class="tile-group">
                    ${pungs.map(tile => this.createTileHtml(tile)).join('')}
                </div>
                
                <p>Kongs (4 of a kind): ${kongs.length}</p>
                <div class="tile-group">
                    ${kongs.map(tile => this.createTileHtml(tile)).join('')}
                </div>
                
                <p>Potential Chows: ${chows.length}</p>
                ${chows.map(chow => `
                    <div class="tile-group">
                        ${chow.map(tile => this.createTileHtml(tile)).join('')}
                    </div>
                `).join('')}
            </div>
        `;
        
        this.analysisContainer.innerHTML = html;
        this.debugLog('Hand analysis completed');
    }
    
    /**
     * Find potential chows in the hand
     */
    findChows() {
        const chows = [];
        const suitTiles = this.hand.filter(tile => tile.type === 'suit');
        
        // Group by suit
        const bySuit = {};
        suitTiles.forEach(tile => {
            if (!bySuit[tile.suit]) {
                bySuit[tile.suit] = [];
            }
            bySuit[tile.suit].push(tile);
        });
        
        // Find sequences in each suit
        Object.values(bySuit).forEach(suitTiles => {
            // Sort by value
            suitTiles.sort((a, b) => a.value - b.value);
            
            // Look for sequences of 3+ consecutive numbers
            for (let i = 0; i <= suitTiles.length - 3; i++) {
                const sequence = [suitTiles[i]];
                let nextVal = suitTiles[i].value + 1;
                
                for (let j = i + 1; j < suitTiles.length; j++) {
                    if (suitTiles[j].value === nextVal) {
                        sequence.push(suitTiles[j]);
                        nextVal++;
                        
                        if (sequence.length >= 3) {
                            chows.push([...sequence]);
                        }
                    } else if (suitTiles[j].value > nextVal) {
                        break;
                    }
                }
            }
        });
        
        return chows;
    }
    
    /**
     * Create HTML for a tile in the analysis
     */
    createTileHtml(tile) {
        if (Array.isArray(tile)) {
            // Handle array of tiles (for chows)
            return tile.map(t => this.createTileHtml(t)).join('');
        }
        
        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        
        if (tile.type === 'suit') {
            tileEl.classList.add(`tile-${tile.suit.toLowerCase()}`);
            tileEl.textContent = tile.value;
            tileEl.title = `${tile.value}${tile.suit}`;
        } 
        else if (tile.type === 'dragon') {
            tileEl.classList.add('tile-dragon');
            tileEl.classList.add(`tile-dragon-${tile.suit.toLowerCase() === 'rd' ? 'red' : tile.suit.toLowerCase() === 'gd' ? 'green' : 'white'}`);
            tileEl.textContent = tile.suit === 'RD' ? '中' : tile.suit === 'GD' ? '發' : '白';
            tileEl.title = `${tile.suit === 'RD' ? 'Red' : tile.suit === 'GD' ? 'Green' : 'White'} Dragon`;
        }
        else if (tile.type === 'wind') {
            tileEl.classList.add('tile-wind');
            const windLetter = tile.suit.charAt(0).toUpperCase();
            tileEl.textContent = windLetter;
            tileEl.title = `${tile.suit.charAt(0).toUpperCase() + tile.suit.slice(1)} Wind`;
        }
        else if (tile.type === 'flower') {
            tileEl.classList.add('tile-flower');
            tileEl.innerHTML = '❀';
            tileEl.title = 'Flower';
        }
        
        return tileEl.outerHTML;
    }
    
    /**
     * Set the tile type for the next deal
     * @param {string} type - Type of tiles to deal (suit, dragon, wind, flower)
     */
    setTileType(type) {
        this.tileType = type;
        this.debugLog(`Tile type set to: ${type}`);
    }
    
    /**
     * Format a tile for display in logs
     */
    formatTile(tile) {
        if (!tile) return 'unknown';
        
        if (tile.type === 'suit') {
            return `${tile.value}${tile.suit}`;
        } else if (tile.type === 'dragon') {
            return `${tile.suit} Dragon`;
        } else if (tile.type === 'wind') {
            return `${tile.suit} Wind`;
        } else if (tile.type === 'flower') {
            return 'Flower';
        }
        
        return JSON.stringify(tile);
    }
    
    /**
     * Log a debug message
     */
    debugLog(message) {
        console.log(message);
        
        if (this.debugContainer) {
            const line = document.createElement('div');
            line.textContent = `[${new Date().toISOString()}] ${message}`;
            this.debugContainer.appendChild(line);
            this.debugContainer.scrollTop = this.debugContainer.scrollHeight;
        }
    }
}

// Make the class available globally
window.MahjonggDealer = MahjonggDealer;
