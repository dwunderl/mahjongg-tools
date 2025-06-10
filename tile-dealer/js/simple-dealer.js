class MahjonggDealer {
    constructor() {
        this.tiles = [];
        this.hand = [];
        this.initializeTiles();
        this.shuffleTiles();
        this.setupEventListeners();
        this.updateTileCount();
        
        // Debug logging
        console.log('MahjonggDealer initialized');
        console.log('Tiles in deck:', this.tiles.length);
    }

    initializeTiles() {
        // Clear any existing tiles
        this.tiles = [];
        
        // Add suit tiles (bamboo, characters, dots) - 4 of each
        const suits = ['bamboo', 'characters', 'dots'];
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        suits.forEach(suit => {
            values.forEach(value => {
                // Add 4 of each tile
                for (let i = 0; i < 4; i++) {
                    this.tiles.push({
                        type: 'suit',
                        suit: suit,
                        value: value,
                        id: `${suit}-${value}-${i}`
                    });
                }
            });
        });
        
        // Add honor tiles (dragons and winds)
        const dragons = ['red', 'green', 'white'];
        const winds = ['east', 'south', 'west', 'north'];
        
        // Add dragons (4 of each)
        dragons.forEach(dragon => {
            for (let i = 0; i < 4; i++) {
                this.tiles.push({
                    type: 'dragon',
                    suit: dragon,
                    value: dragon.charAt(0).toUpperCase(),
                    id: `dragon-${dragon}-${i}`
                });
            }
        });
        
        // Add winds (4 of each)
        winds.forEach(wind => {
            for (let i = 0; i < 4; i++) {
                this.tiles.push({
                    type: 'wind',
                    suit: wind,
                    value: wind.charAt(0).toUpperCase(),
                    id: `wind-${wind}-${i}`
                });
            }
        });
        
        // Add flowers (4 total)
        for (let i = 0; i < 4; i++) {
            this.tiles.push({
                type: 'flower',
                suit: 'flower',
                value: 'F',
                id: `flower-${i}`
            });
        }
        
        // Add jokers (8 total)
        for (let i = 0; i < 8; i++) {
            this.tiles.push({
                type: 'joker',
                suit: 'joker',
                value: 'JOKER',
                id: `joker-${i}`
            });
        }
        
        console.log('Initialized tiles:', this.tiles.length);
    }

    shuffleTiles() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
        console.log('Shuffled tiles');
    }

    dealHand(count) {
        // Reset hand
        this.hand = [];
        
        // Deal specified number of tiles
        for (let i = 0; i < count && this.tiles.length > 0; i++) {
            this.hand.push(this.tiles.pop());
        }
        
        console.log('Dealt hand:', this.hand);
        this.renderHand();
        this.updateTileCount();
        this.analyzeHand();
    }

    renderHand() {
        const container = document.getElementById('hand');
        if (!container) {
            console.error('Hand container not found');
            return;
        }
        
        container.innerHTML = '';
        
        // Sort the hand for better display
        this.sortHand();
        
        // Add each tile to the container
        this.hand.forEach(tile => {
            const tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.setAttribute('data-suit', tile.suit);
            tileEl.setAttribute('data-type', tile.type);
            
            // Create tile content div
            const tileContent = document.createElement('div');
            tileContent.className = 'tile-content';
            
            // Set tile display based on type
            if (tile.type === 'suit') {
                tileEl.classList.add(`tile-${tile.suit.toLowerCase()}`);
                tileContent.textContent = tile.value;
                tileEl.setAttribute('title', `${tile.value} ${tile.suit}`);
                tileEl.setAttribute('data-corner', tile.suit); // For corner indicator
            } 
            // Handle dragon tiles
            else if (tile.type === 'dragon') {
                tileEl.classList.add('tile-dragon');
                if (tile.suit === 'red') {
                    tileEl.classList.add('tile-dragon-red');
                    tileContent.textContent = 'Red';
                    tileEl.setAttribute('title', 'Red Dragon');
                } else if (tile.suit === 'green') {
                    tileEl.classList.add('tile-dragon-green');
                    tileContent.textContent = 'Green';
                    tileEl.setAttribute('title', 'Green Dragon');
                } else { // white
                    tileEl.classList.add('tile-dragon-white');
                    tileContent.textContent = 'Soap';
                    tileEl.setAttribute('title', 'White Dragon');
                }
            } 
            // Handle wind tiles
            else if (tile.type === 'wind') {
                tileEl.classList.add('tile-wind');
                const windLetter = tile.suit[0].toUpperCase();
                tileContent.textContent = windLetter;
                tileEl.setAttribute('title', tile.suit.charAt(0).toUpperCase() + tile.suit.slice(1) + ' Wind');
            } 
            // Handle flower tiles
            else if (tile.type === 'flower') {
                tileEl.classList.add('tile-flower');
                tileContent.innerHTML = '❀'; // Flower icon
                tileEl.setAttribute('title', 'Flower');
            } 
            // Handle joker tiles
            else if (tile.type === 'joker') {
                tileEl.classList.add('tile-joker');
                tileContent.textContent = 'J';
                tileEl.setAttribute('title', 'Joker');
            }
            
            // Add click event to remove tile
            tileEl.addEventListener('click', () => {
                this.removeTile(tile);
            });
            
            tileEl.appendChild(tileContent);
            container.appendChild(tileEl);
        });
        
        console.log('Rendered hand with', this.hand.length, 'tiles');
    }

    removeTile(tileToRemove) {
        const index = this.hand.findIndex(tile => 
            tile.id === tileToRemove.id
        );
        
        if (index !== -1) {
            this.hand.splice(index, 1);
            this.renderHand();
            this.analyzeHand();
            console.log('Removed tile, hand now has', this.hand.length, 'tiles');
        } else {
            console.warn('Tile not found in hand:', tileToRemove);
        }
    }

    sortHand() {
        // Sort order: Bamboos, Characters, Dots, Winds (E, S, W, N), Dragons (Red, Green, White), Flowers, Jokers
        const suitOrder = { 'bamboo': 0, 'characters': 1, 'dots': 2 };
        const windOrder = { 'east': 0, 'south': 1, 'west': 2, 'north': 3 };
        const dragonOrder = { 'red': 0, 'green': 1, 'white': 2 };
        
        this.hand.sort((a, b) => {
            // Sort by type first
            const typeOrder = { 'suit': 0, 'wind': 1, 'dragon': 2, 'flower': 3, 'joker': 4 };
            if (typeOrder[a.type] !== typeOrder[b.type]) {
                return typeOrder[a.type] - typeOrder[b.type];
            }
            
            // Within types, sort by suit
            if (a.type === 'suit' && b.type === 'suit') {
                if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                    return suitOrder[a.suit] - suitOrder[b.suit];
                }
                return a.value - b.value;
            }
            
            // Sort winds
            if (a.type === 'wind' && b.type === 'wind') {
                return windOrder[a.suit] - windOrder[b.suit];
            }
            
            // Sort dragons
            if (a.type === 'dragon' && b.type === 'dragon') {
                return dragonOrder[a.suit] - dragonOrder[b.suit];
            }
            
            // For flowers and jokers, maintain current order
            return 0;
        });
        
        console.log('Sorted hand');
    }

    analyzeHand() {
        console.log('Analyzing hand...');
        const analysis = {
            pairs: [],
            pungs: [],
            kongs: [],
            chows: [],
            singles: []
        };
        
        // Create a copy of the hand and sort it
        const sortedHand = [...this.hand];
        sortedHand.sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return a.value - b.value;
        });
        
        // Count occurrences of each tile
        const tileCounts = {};
        sortedHand.forEach(tile => {
            const key = `${tile.type}-${tile.suit}-${tile.value}`;
            if (!tileCounts[key]) {
                tileCounts[key] = [];
            }
            tileCounts[key].push(tile);
        });
        
        // Categorize tiles
        Object.values(tileCounts).forEach(tileGroup => {
            if (tileGroup.length >= 4) {
                analysis.kongs.push(tileGroup);
            } else if (tileGroup.length === 3) {
                analysis.pungs.push(tileGroup);
            } else if (tileGroup.length === 2) {
                analysis.pairs.push(tileGroup);
            } else {
                analysis.singles.push(tileGroup[0]);
            }
        });
        
        // Find potential chows (only for suit tiles)
        const suitTiles = sortedHand.filter(tile => tile.type === 'suit');
        const suits = [...new Set(suitTiles.map(tile => tile.suit))];
        
        // Make a copy of suit tiles to track which ones we've used in chows
        const availableTiles = [...suitTiles];
        
        suits.forEach(suit => {
            const suitValues = suitTiles
                .filter(tile => tile.suit === suit)
                .map(tile => tile.value)
                .sort((a, b) => a - b);
                
            // Simple chow detection (just for demonstration)
            for (let i = 0; i < suitValues.length - 2; i++) {
                const val1 = suitValues[i];
                const val2 = suitValues[i + 1];
                const val3 = suitValues[i + 2];
                
                if (val1 + 1 === val2 && val2 + 1 === val3) {
                    // Find the actual tile objects
                    const chow = [
                        suitTiles.find(t => t.suit === suit && t.value === val1),
                        suitTiles.find(t => t.suit === suit && t.value === val2),
                        suitTiles.find(t => t.suit === suit && t.value === val3)
                    ];
                    
                    // Only add if all tiles are still available
                    if (chow.every(tile => availableTiles.includes(tile))) {
                        analysis.chows.push(chow);
                        
                        // Remove used tiles from available tiles
                        chow.forEach(tile => {
                            const index = availableTiles.findIndex(t => t.id === tile.id);
                            if (index !== -1) {
                                availableTiles.splice(index, 1);
                            }
                        });
                    }
                }
            }
        });
        
        this.displayAnalysis(analysis);
        return analysis;
    }

    displayAnalysis(analysis) {
        const container = document.getElementById('analysisContent');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Helper function to create a tile element
        const createTileElement = (tile) => {
            const tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.setAttribute('data-suit', tile.suit);
            tileEl.setAttribute('data-type', tile.type);
            
            const tileContent = document.createElement('div');
            tileContent.className = 'tile-content';
            
            if (tile.type === 'suit') {
                tileEl.classList.add(`tile-${tile.suit.toLowerCase()}`);
                tileContent.textContent = tile.value;
            } else if (tile.type === 'dragon') {
                tileEl.classList.add('tile-dragon');
                if (tile.suit === 'red') {
                    tileEl.classList.add('tile-dragon-red');
                    tileContent.textContent = 'Red';
                } else if (tile.suit === 'green') {
                    tileEl.classList.add('tile-dragon-green');
                    tileContent.textContent = 'Green';
                } else {
                    tileEl.classList.add('tile-dragon-white');
                    tileContent.textContent = 'Soap';
                }
            } else if (tile.type === 'wind') {
                tileEl.classList.add('tile-wind');
                tileContent.textContent = tile.suit[0].toUpperCase();
            } else if (tile.type === 'flower') {
                tileEl.classList.add('tile-flower');
                tileContent.innerHTML = '❀';
            } else if (tile.type === 'joker') {
                tileEl.classList.add('tile-joker');
                tileContent.textContent = 'J';
            }
            
            tileEl.appendChild(tileContent);
            return tileEl;
        };
        
        // Display pairs
        if (analysis.pairs.length > 0) {
            const section = document.createElement('div');
            section.className = 'analysis-section';
            section.innerHTML = `<h4>Pairs (${analysis.pairs.length})</h4>`;
            
            const tilesContainer = document.createElement('div');
            tilesContainer.className = 'analysis-tiles';
            
            analysis.pairs.forEach(pair => {
                pair.forEach(tile => {
                    tilesContainer.appendChild(createTileElement(tile));
                });
                // Add a small space between pairs
                tilesContainer.appendChild(document.createTextNode(' '));
            });
            
            section.appendChild(tilesContainer);
            container.appendChild(section);
        }
        
        // Display pungs
        if (analysis.pungs.length > 0) {
            const section = document.createElement('div');
            section.className = 'analysis-section';
            section.innerHTML = `<h4>Pungs (${analysis.pungs.length})</h4>`;
            
            const tilesContainer = document.createElement('div');
            tilesContainer.className = 'analysis-tiles';
            
            analysis.pungs.forEach(pung => {
                pung.forEach(tile => {
                    tilesContainer.appendChild(createTileElement(tile));
                });
                // Add a small space between pungs
                tilesContainer.appendChild(document.createTextNode(' '));
            });
            
            section.appendChild(tilesContainer);
            container.appendChild(section);
        }
        
        // Display kongs
        if (analysis.kongs.length > 0) {
            const section = document.createElement('div');
            section.className = 'analysis-section';
            section.innerHTML = `<h4>Kongs (${analysis.kongs.length})</h4>`;
            
            const tilesContainer = document.createElement('div');
            tilesContainer.className = 'analysis-tiles';
            
            analysis.kongs.forEach(kong => {
                kong.forEach(tile => {
                    tilesContainer.appendChild(createTileElement(tile));
                });
                // Add a small space between kongs
                tilesContainer.appendChild(document.createTextNode(' '));
            });
            
            section.appendChild(tilesContainer);
            container.appendChild(section);
        }
        
        // Display chows
        if (analysis.chows.length > 0) {
            const section = document.createElement('div');
            section.className = 'analysis-section';
            section.innerHTML = `<h4>Chows (${analysis.chows.length})</h4>`;
            
            const tilesContainer = document.createElement('div');
            tilesContainer.className = 'analysis-tiles';
            
            analysis.chows.forEach(chow => {
                chow.forEach(tile => {
                    tilesContainer.appendChild(createTileElement(tile));
                });
                // Add a small space between chows
                tilesContainer.appendChild(document.createTextNode(' '));
            });
            
            section.appendChild(tilesContainer);
            container.appendChild(section);
        }
        
        // Display singles
        if (analysis.singles.length > 0) {
            const section = document.createElement('div');
            section.className = 'analysis-section';
            section.innerHTML = `<h4>Singles (${analysis.singles.length})</h4>`;
            
            const tilesContainer = document.createElement('div');
            tilesContainer.className = 'analysis-tiles';
            
            analysis.singles.forEach(tile => {
                tilesContainer.appendChild(createTileElement(tile));
            });
            
            section.appendChild(tilesContainer);
            container.appendChild(section);
        }
        
        // Display hand composition
        const composition = document.createElement('div');
        composition.className = 'analysis-section';
        composition.innerHTML = `
            <h4>Hand Composition</h4>
            <p>Total Tiles: ${this.hand.length}</p>
            <p>Unique Tiles: ${Object.keys(tileCounts).length}</p>
            <p>Pairs: ${analysis.pairs.length}</p>
            <p>Pungs: ${analysis.pungs.length}</p>
            <p>Kongs: ${analysis.kongs.length}</p>
            <p>Chows: ${analysis.chows.length}</p>
            <p>Singles: ${analysis.singles.length}</p>
        `;
        container.appendChild(composition);
    }

    updateTileCount() {
        const countElement = document.getElementById('tile-count');
        if (countElement) {
            countElement.textContent = this.tiles.length;
        }
    }

    setupEventListeners() {
        // New Hand button
        const newHandBtn = document.getElementById('newHand');
        if (newHandBtn) {
            newHandBtn.addEventListener('click', () => {
                this.initializeTiles();
                this.shuffleTiles();
                this.hand = [];
                this.renderHand();
                this.updateTileCount();
                this.analyzeHand();
            });
        }
        
        // Add Tile button
        const addTileBtn = document.getElementById('addTile');
        if (addTileBtn) {
            addTileBtn.addEventListener('click', () => {
                if (this.tiles.length > 0) {
                    this.hand.push(this.tiles.pop());
                    this.renderHand();
                    this.updateTileCount();
                    this.analyzeHand();
                } else {
                    console.warn('No more tiles in the deck!');
                    alert('No more tiles in the deck!');
                }
            });
        }
        
        // Sort Hand button
        const sortHandBtn = document.getElementById('sortHand');
        if (sortHandBtn) {
            sortHandBtn.addEventListener('click', () => {
                this.sortHand();
                this.renderHand();
            });
        }
        
        // Tile type selector
        const tileTypeSelect = document.getElementById('tileType');
        const suitTypeSelect = document.getElementById('suitType');
        const tileValueInput = document.getElementById('tileValue');
        
        if (tileTypeSelect) {
            tileTypeSelect.addEventListener('change', (e) => {
                const type = e.target.value;
                
                // Enable/disable suit and value inputs based on tile type
                if (type === 'suit') {
                    suitTypeSelect.disabled = false;
                    tileValueInput.disabled = false;
                } else {
                    suitTypeSelect.disabled = true;
                    tileValueInput.disabled = true;
                }
            });
        }
    }
}

// Initialize the dealer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dealer = new MahjonggDealer();
    
    // Auto-deal a hand on load
    setTimeout(() => {
        dealer.dealHand(13);
    }, 100);
});
