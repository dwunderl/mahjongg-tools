/**
 * Mahjongg Dealer Script
 * Handles tile dealing, hand analysis, and game logic for American Mahjongg
 */

console.log('Mahjongg dealer script loaded!');

(function() {
    'use strict';
    
    // Game state variables
    let fullDeck = [];
    let currentHand = [];
    let isInitialized = false;
    
    // DOM elements cache
    const elements = {
        deal13Btn: null,
        deal14Btn: null,
        resetDeckBtn: null,
        sortSuitRankBtn: null,
        sortRankSuitBtn: null,
        analyzeHandBtn: null,
        tilesRow: null,
        tileCountEl: null,
        resultsContainer: null
    };

    // Debug logging helper
    function debugLog(message, ...args) {
        if (console && console.debug) {
            console.debug(`[Mahjongg] ${message}`, ...args);
        }
    }

    // Initialize the game
    function init() {
        debugLog('Initializing Mahjongg Dealer...');
        
        try {
            // Cache DOM elements
            elements.deal13Btn = document.getElementById('deal-13');
            elements.deal14Btn = document.getElementById('deal-14');
            elements.resetDeckBtn = document.getElementById('reset-deck');
            elements.sortSuitRankBtn = document.getElementById('sort-suit-rank');
            elements.sortRankSuitBtn = document.getElementById('sort-rank-suit');
            elements.analyzeHandBtn = document.getElementById('analyze-hand-btn');
            elements.tilesRow = document.getElementById('tiles-row');
            elements.tileCountEl = document.getElementById('tile-count');
            elements.resultsContainer = document.getElementById('analysis-results');
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize the deck
            resetDeck();
            
            // Initial UI update
            updateUI();
            
            isInitialized = true;
            debugLog('Mahjongg Dealer initialized');
        } catch (error) {
            console.error('Failed to initialize Mahjongg Dealer:', error);
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        if (elements.deal13Btn) {
            elements.deal13Btn.addEventListener('click', () => handleDeal(13));
        }
        if (elements.deal14Btn) {
            elements.deal14Btn.addEventListener('click', () => handleDeal(14));
        }
        if (elements.resetDeckBtn) {
            elements.resetDeckBtn.addEventListener('click', resetDeck);
        }
        if (elements.analyzeHandBtn) {
            elements.analyzeHandBtn.addEventListener('click', analyzeHand);
        }
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (currentHand.length > 0) {
                    updateTileSizes(currentHand.length);
                }
            }, 100);
        });
    }

    // Reset the deck to a full, shuffled state
    function resetDeck() {
        debugLog('Resetting deck...');
        fullDeck = createFullDeck();
        shuffleDeck(fullDeck);
        currentHand = [];
        
        // Clear the display
        if (elements.tilesRow) {
            elements.tilesRow.innerHTML = '';
        }
        
        // Update UI
        updateUI();
        debugLog('Deck reset and shuffled');
    }

    // Create a full deck of Mahjongg tiles (152 tiles)
    function createFullDeck() {
        const deck = [];
        
        // Add number tiles (1-9) for each suit (Cracks, Bams, Dots)
        const suits = ['C', 'B', 'D'];
        suits.forEach(suit => {
            for (let i = 1; i <= 9; i++) {
                // Add 4 of each number for each suit
                for (let j = 0; j < 4; j++) {
                    deck.push(`${i}${suit}`);
                }
            }
        });
        
        // Add honor tiles (4 of each)
        const honors = ['RD', 'GD', 'WD']; // Red Dragon, Green Dragon, White Dragon
        honors.forEach(honor => {
            for (let i = 0; i < 4; i++) {
                deck.push(honor);
            }
        });
        
        // Add wind tiles (4 of each)
        const winds = ['E', 'S', 'W', 'N'];
        winds.forEach(wind => {
            for (let i = 0; i < 4; i++) {
                deck.push(wind);
            }
        });
        
        // Add flowers (8 total)
        for (let i = 0; i < 8; i++) {
            deck.push('FL');
        }
        
        // Add jokers (8 total)
        for (let i = 0; i < 8; i++) {
            deck.push('JK');
        }
        
        return deck;
    }

    // Shuffle the deck using Fisher-Yates algorithm
    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    // Deal a hand of tiles
    function dealHand(numTiles) {
        if (fullDeck.length < numTiles) {
            debugLog(`Not enough tiles in deck (${fullDeck.length} remaining, ${numTiles} requested)`);
            return [];
        }
        
        const hand = fullDeck.splice(0, numTiles);
        currentHand = [...hand];
        
        // Update UI
        displayHand(hand);
        updateUI();
        
        return hand;
    }

    // Display the hand on the page
    function displayHand(hand) {
        debugLog(`Displaying hand with ${hand.length} tiles`);
        const container = elements.tilesRow;
        if (!container) {
            debugLog('Tiles container not found');
            return;
        }
        
        // Clear previous hand
        container.innerHTML = '';
        
        // Add each tile to the container
        hand.forEach((tileCode, index) => {
            const tileEl = createTileElement(tileCode, index);
            if (tileEl) {
                container.appendChild(tileEl);
            }
        });
        
        // Update tile sizes
        updateTileSizes(hand.length);
    }

    // Create a tile element
    function createTileElement(tileCode, index) {
        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        tileEl.dataset.tile = tileCode;
        tileEl.dataset.index = index;
        
        // Extract suit and value for styling
        const suit = getSuitFromTileCode(tileCode);
        const value = tileCode.replace(/[^0-9]/g, '');
        
        // Set data attributes for styling
        tileEl.dataset.suit = suit || tileCode;
        if (value) tileEl.dataset.value = value;
        
        // Set tile content with proper display text
        let displayText = tileCode;
        if (suit && value) {
            // For numbered tiles (e.g., 1C, 2B, 3D)
            displayText = value;
            // Map single-letter suit codes to full names
            const suitNames = { 'C': 'Crack', 'B': 'Bam', 'D': 'Dot' };
            tileEl.dataset.corner = suitNames[suit] || suit;
        } else if (tileCode === 'RD') {
            displayText = 'Red';
            tileEl.dataset.corner = 'Dragon';
            tileEl.classList.add('dragon', 'red');
        } else if (tileCode === 'GD') {
            displayText = 'Green';
            tileEl.dataset.corner = 'Dragon';
            tileEl.classList.add('dragon', 'green');
        } else if (tileCode === 'WD') {
            displayText = 'Soap';
            tileEl.dataset.corner = 'Dragon';
            tileEl.classList.add('dragon', 'white');
        } else if (['N', 'E', 'S', 'W'].includes(tileCode)) {
            // Use single letter for wind directions
            displayText = tileCode;
            tileEl.dataset.corner = 'Wind';
            tileEl.classList.add('wind');
        } else if (tileCode === 'FL') {
            displayText = '🌸';
            tileEl.dataset.corner = 'Flower';
            tileEl.classList.add('flower');
        } else if (tileCode === 'JK') {
            displayText = '🃏';
            tileEl.dataset.corner = 'Joker';
            tileEl.classList.add('joker');
        }
        
        tileEl.textContent = displayText;
        return tileEl;
    }

    // Get suit from tile code
    function getSuitFromTileCode(tileCode) {
        if (!tileCode) return '';
        
        // For numbered tiles (e.g., '1C', '2B', '3D')
        if (tileCode.length >= 2 && /^\d/.test(tileCode)) {
            return tileCode.slice(-1);
        }
        
        // For honor tiles, dragons, etc.
        return '';
    }

    // Check if tile is a numbered tile (e.g., '1C', '2B', '3D')
    function isNumberTile(tileCode) {
        return /^\d+[CBD]$/.test(tileCode);
    }

    // Get display name for special tiles
    function getTileDisplayName(tileCode) {
        const names = {
            'RD': 'Red Dragon',
            'GD': 'Green Dragon',
            'WD': 'White Dragon',
            'E': 'East',
            'S': 'South',
            'W': 'West',
            'N': 'North',
            'FL': 'Flower',
            'JK': 'Joker'
        };
        return names[tileCode] || tileCode;
    }

    // Update UI elements
    function updateUI() {
        // Update remaining tiles count
        if (elements.tileCountEl) {
            elements.tileCountEl.textContent = fullDeck.length;
        }
        
        // Update button states
        updateButtonStates();
    }

    // Update button states based on game state
    function updateButtonStates() {
        const canDeal13 = fullDeck.length >= 13;
        const canDeal14 = fullDeck.length >= 14;
        
        if (elements.deal13Btn) {
            elements.deal13Btn.disabled = !canDeal13;
        }
        if (elements.deal14Btn) {
            elements.deal14Btn.disabled = !canDeal14;
        }
        if (elements.analyzeHandBtn) {
            elements.analyzeHandBtn.disabled = currentHand.length === 0;
        }
    }

    // Calculate optimal tile size based on viewport width
    function calculateOptimalTileSize(tileCount) {
        const viewportWidth = Math.min(window.innerWidth, 1400) - 40;
        const minTileWidth = 30; // Smaller minimum width to fit more tiles
        const maxTileWidth = 65; // Slightly smaller maximum width
        const tileGap = 1; // Minimal gap between tiles
        
        // Calculate available width for tiles
        const availableWidth = viewportWidth - (tileCount * tileGap);
        
        // Calculate optimal width per tile
        let tileWidth = Math.min(maxTileWidth, Math.max(minTileWidth, availableWidth / tileCount));
        
        // For very small screens, use a fixed smaller size
        if (window.innerWidth < 480) {
            tileWidth = Math.min(tileWidth, 32);
        }
        
        // Round to nearest 1px for more precision
        tileWidth = Math.floor(tileWidth);
        
        // Calculate height maintaining aspect ratio (3:4)
        const tileHeight = Math.round(tileWidth * 1.5);
        
        return { width: tileWidth, height: tileHeight };
    }

    // Update tile sizes based on viewport and number of tiles
    function updateTileSizes(tileCount) {
        const container = elements.tilesRow;
        if (!container) return;
        
        const { width: tileWidth, height: tileHeight } = calculateOptimalTileSize(tileCount);
        const baseFontSize = Math.max(10, Math.min(20, Math.floor(tileWidth / 2.2)));
        const suitFontSize = Math.max(8, Math.floor(baseFontSize * 0.7));
        
        // Apply styles to tiles
        const tiles = container.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.style.width = `${tileWidth}px`;
            tile.style.height = `${tileHeight}px`;
            tile.style.fontSize = `${baseFontSize}px`;
            tile.style.lineHeight = `${tileHeight}px`;
            
            // Adjust font size for dragon tiles
            if (tile.classList.contains('dragon')) {
                tile.style.fontSize = `${Math.max(12, Math.floor(baseFontSize * 0.8))}px`;
                tile.style.lineHeight = '1';
            }
        });
        
        // Update CSS variables
        document.documentElement.style.setProperty('--tile-width', `${tileWidth}px`);
        document.documentElement.style.setProperty('--tile-height', `${tileHeight}px`);
        document.documentElement.style.setProperty('--tile-font-size', `${baseFontSize}px`);
        document.documentElement.style.setProperty('--tile-suit-size', `${suitFontSize}px`);
    }

    // Handle deal button click
    function handleDeal(numTiles) {
        if (fullDeck.length < numTiles) {
            alert(`Not enough tiles in the deck (${fullDeck.length} remaining, ${numTiles} requested)`);
            return;
        }
        
        // Deal new hand
        currentHand = dealHand(numTiles);
        
        // Update UI
        displayHand(currentHand);
        updateUI();
    }

    // Analyze the current hand
    async function analyzeHand() {
        if (currentHand.length === 0) {
            alert('Please deal a hand first!');
            return;
        }
        
        debugLog('Analyzing hand...');
        
        try {
            // Simple analysis - group by tile type
            const tileCounts = {};
            currentHand.forEach(tile => {
                tileCounts[tile] = (tileCounts[tile] || 0) + 1;
            });
            
            // Sort tiles by count (descending) and then by tile code
            const sortedTiles = Object.keys(tileCounts).sort((a, b) => {
                if (tileCounts[b] !== tileCounts[a]) {
                    return tileCounts[b] - tileCounts[a];
                }
                return a.localeCompare(b);
            });
            
            // Group by count
            const groups = {
                pairs: [],
                pungs: [],
                kongs: [],
                chows: [],
                singles: []
            };
            
            // Categorize tiles
            sortedTiles.forEach(tile => {
                const count = tileCounts[tile];
                
                if (count === 2) {
                    groups.pairs.push([tile, tile]);
                } else if (count === 3) {
                    groups.pungs.push([tile, tile, tile]);
                } else if (count === 4) {
                    groups.kongs.push([tile, tile, tile, tile]);
                } else if (count === 1) {
                    groups.singles.push(tile);
                }
            });
            
            // Check for chows (sequences of 3+ consecutive numbers in the same suit)
            const numberTiles = sortedTiles.filter(isNumberTile);
            const suits = new Set(numberTiles.map(tile => tile.slice(-1)));n            
            suits.forEach(suit => {
                const suitTiles = numberTiles
                    .filter(tile => tile.endsWith(suit))
                    .map(tile => parseInt(tile.slice(0, -1), 10))
                    .sort((a, b) => a - b);
                
                for (let i = 0; i <= suitTiles.length - 3; i++) {
                    if (suitTiles[i] + 1 === suitTiles[i + 1] && 
                        suitTiles[i + 1] + 1 === suitTiles[i + 2]) {
                        const chow = [
                            `${suitTiles[i]}${suit}`,
                            `${suitTiles[i + 1]}${suit}`,
                            `${suitTiles[i + 2]}${suit}`
                        ];
                        groups.chows.push(chow);
                        
                        // Remove these tiles from singles to avoid double-counting
                        chow.forEach(tile => {
                            const index = groups.singles.indexOf(tile);
                            if (index !== -1) {
                                groups.singles.splice(index, 1);
                            }
                        });
                        
                        // Skip the next two tiles since they're part of this chow
                        i += 2;
                    }
                }
            });
            
            // Display analysis results
            displayAnalysisResults(groups);
            
            return groups;
        } catch (error) {
            console.error('Error analyzing hand:', error);
            debugLog('Analysis error:', error);
            alert('An error occurred while analyzing the hand. Please check the console for details.');
            return null;
        }
    }

    // Display analysis results
    function displayAnalysisResults(analysis) {
        const container = elements.resultsContainer;
        if (!container) {
            debugLog('Results container not found');
            return;
        }
        
        let html = `
            <div class="analysis-section">
                <h3>Hand Analysis</h3>
                <div class="analysis-summary">
                    <div class="summary-item">
                        <span class="summary-count">${currentHand.length}</span>
                        <span class="summary-label">Tiles in Hand</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-count">${fullDeck.length}</span>
                        <span class="summary-label">Tiles Remaining</span>
                    </div>
                </div>
                <div class="analysis-details">
        `;
        
        // Helper function to create a tile element for display
        const createTileHtml = (tileCode) => {
            const suit = getSuitFromTileCode(tileCode);
            const displayName = isNumberTile(tileCode) ? tileCode[0] : getTileDisplayName(tileCode);
            return `<span class="analysis-tile" data-suit="${suit}">${displayName}</span>`;
        };
        
        // Add kongs
        if (analysis.kongs && analysis.kongs.length > 0) {
            html += `
                <div class="analysis-group">
                    <div class="group-header">
                        <span class="group-title">Kongs (${analysis.kongs.length})</span>
                        <span class="group-count">${analysis.kongs.length * 4} tiles</span>
                    </div>
                    <div class="group-tiles">
                        ${analysis.kongs.map(kong => 
                            `<div class="tile-group">
                                ${kong.map(tile => createTileHtml(tile)).join(' ')}
                            </div>`
                        ).join('')}
                    </div>
                </div>`;
        }
        
        // Add pungs
        if (analysis.pungs && analysis.pungs.length > 0) {
            html += `
                <div class="analysis-group">
                    <div class="group-header">
                        <span class="group-title">Pungs (${analysis.pungs.length})</span>
                        <span class="group-count">${analysis.pungs.length * 3} tiles</span>
                    </div>
                    <div class="group-tiles">
                        ${analysis.pungs.map(pung => 
                            `<div class="tile-group">
                                ${pung.map(tile => createTileHtml(tile)).join(' ')}
                            </div>`
                        ).join('')}
                    </div>
                </div>`;
        }
        
        // Add chows
        if (analysis.chows && analysis.chows.length > 0) {
            html += `
                <div class="analysis-group">
                    <div class="group-header">
                        <span class="group-title">Chows (${analysis.chows.length})</span>
                        <span class="group-count">${analysis.chows.length * 3} tiles</span>
                    </div>
                    <div class="group-tiles">
                        ${analysis.chows.map(chow => 
                            `<div class="tile-group">
                                ${chow.map(tile => createTileHtml(tile)).join(' ')}
                            </div>`
                        ).join('')}
                    </div>
                </div>`;
        }
        
        // Add pairs
        if (analysis.pairs && analysis.pairs.length > 0) {
            html += `
                <div class="analysis-group">
                    <div class="group-header">
                        <span class="group-title">Pairs (${analysis.pairs.length})</span>
                        <span class="group-count">${analysis.pairs.length * 2} tiles</span>
                    </div>
                    <div class="group-tiles">
                        ${analysis.pairs.map(pair => 
                            `<div class="tile-group">
                                ${pair.map(tile => createTileHtml(tile)).join(' ')}
                            </div>`
                        ).join(' ')}
                    </div>
                </div>`;
        }
        
        // Add singles
        if (analysis.singles && analysis.singles.length > 0) {
            html += `
                <div class="analysis-group">
                    <div class="group-header">
                        <span class="group-title">Singles (${analysis.singles.length})</span>
                    </div>
                    <div class="group-tiles">
                        ${analysis.singles.map(tile => createTileHtml(tile)).join(' ')}
                    </div>
                </div>`;
        }
        
        // Close the details and section divs
        html += `
                </div>
            </div>`;
        
        container.innerHTML = html;
        
        // Add hover effect for tiles
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: hover) {
                .tile:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 10px rgba(0,0,0,0.2);
                    z-index: 10;
                }
            }`;
        document.head.appendChild(style);
        
        debugLog('Analysis results displayed');
    }

    // Make functions available globally
    window.MahjonggDealer = {
        init,
        dealHand,
        resetDeck,
        analyzeHand,
        getCurrentHand: () => [...currentHand],
        getRemainingTiles: () => fullDeck.length
    };
    
    // Initialize the app when the DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            debugLog('DOM fully loaded, initializing...');
            init();
        });
    } else {
        // DOMContentLoaded has already fired
        debugLog('DOM already loaded, initializing...');
        init();
    }
})();
