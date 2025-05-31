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
        analyzeButton: null,
        handContainer: null,
        resultsContainer: null,
        debugContainer: null,
        tilesRemaining: null
    };
    
    // Constants
    const TILE_TYPES = {
        CHARACTERS: 'C',
        BAMBOO: 'B',
        DOTS: 'D',
        WINDS: 'W',
        DRAGONS: 'F',
        FLOWERS: 'FL',
        JOKERS: 'JK'
    };
    
    // Debug logging
    function debugLog(message) {
        console.log(message);
        
        if (elements.debugContainer) {
            const line = document.createElement('div');
            line.textContent = `[${new Date().toISOString()}] ${message}`;
            elements.debugContainer.appendChild(line);
            elements.debugContainer.scrollTop = elements.debugContainer.scrollHeight;
        }
    }
    
    // Initialize the game
    function init() {
        if (isInitialized) {
            debugLog('Game already initialized');
            return;
        }
        
        debugLog('Initializing Mahjongg Dealer...');
        
        // Cache DOM elements
        elements.deal13Btn = document.getElementById('deal-13-btn');
        elements.deal14Btn = document.getElementById('deal-14-btn');
        elements.resetDeckBtn = document.getElementById('reset-deck-btn');
        elements.sortSuitRankBtn = document.getElementById('sort-suit-rank-btn');
        elements.sortRankSuitBtn = document.getElementById('sort-rank-suit-btn');
        elements.analyzeButton = document.getElementById('analyze-hand-btn');
        elements.handContainer = document.getElementById('tiles-row'); // Updated ID
        elements.resultsContainer = document.getElementById('analysis-results-content');
        elements.debugContainer = document.getElementById('debug-messages');
        elements.tilesRemaining = document.getElementById('tile-count'); // Updated ID
        
        // Add event listeners
        setupEventListeners();
        
        // Initialize the deck
        resetDeck();
        
        // Update UI
        updateUI();
        
        isInitialized = true;
        debugLog('Mahjongg Dealer initialized successfully');
    }
    
    // Set up event listeners
    function setupEventListeners() {
        if (elements.deal13Btn) {
            elements.deal13Btn.addEventListener('click', () => dealHand(13));
        }
        
        if (elements.deal14Btn) {
            elements.deal14Btn.addEventListener('click', () => dealHand(14));
        }
        
        if (elements.resetDeckBtn) {
            elements.resetDeckBtn.addEventListener('click', resetDeck);
        }
        
        if (elements.analyzeButton) {
            elements.analyzeButton.addEventListener('click', analyzeHand);
        }
        
        // Add window resize handler
        window.addEventListener('resize', handleResize);
    }
    
    // Handle window resize
    function handleResize() {
        if (currentHand.length > 0) {
            displayHand(currentHand);
        }
    }
    
    // Reset the deck and game state
    function resetDeck() {
        debugLog('Resetting deck...');
        fullDeck = createFullDeck();
        currentHand = [];
        shuffleDeck(fullDeck);
        updateUI();
        debugLog('Deck reset complete. Tiles remaining: ' + fullDeck.length);
    }
    
    // Create a full deck of Mahjongg tiles (152 tiles)
    function createFullDeck() {
        const deck = [];
        const suits = [TILE_TYPES.CHARACTERS, TILE_TYPES.BAMBOO, TILE_TYPES.DOTS];
        const honors = ['N', 'E', 'S', 'W', 'RD', 'GD', 'WD']; // Winds and Dragons
        
        // Number tiles (4 of each, 1-9 for each suit)
        suits.forEach(suit => {
            for (let value = 1; value <= 9; value++) {
                for (let i = 0; i < 4; i++) {
                    deck.push(`${value}${suit}`);
                }
            }
        });
        
        // Honor tiles (4 of each)
        honors.forEach(honor => {
            for (let i = 0; i < 4; i++) {
                deck.push(honor);
            }
        });
        
        // Bonus tiles (8 flowers, 8 jokers)
        for (let i = 0; i < 8; i++) {
            deck.push(TILE_TYPES.FLOWERS);
            deck.push(TILE_TYPES.JOKERS);
        }
        
        debugLog(`Created deck with ${deck.length} tiles`);
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
        if (numTiles > fullDeck.length) {
            debugLog(`Not enough tiles remaining to deal ${numTiles} tiles`);
            return [];
        }
        
        const hand = fullDeck.splice(0, numTiles);
        currentHand = [...hand];
        
        debugLog(`Dealt ${numTiles} tiles. Remaining: ${fullDeck.length}`);
        
        displayHand(hand);
        updateUI();
        
        return hand;
    }
    
    // Display the hand in the UI
    function displayHand(hand) {
        if (!elements.handContainer) {
            debugLog('Hand container not found');
            return;
        }
        
        // Clear existing hand
        elements.handContainer.innerHTML = '';
        
        if (hand.length === 0) {
            debugLog('No tiles to display');
            return;
        }
        
        // Create and append tile elements
        hand.forEach((tile, index) => {
            const tileElement = createTileElement(tile, index);
            elements.handContainer.appendChild(tileElement);
        });
        
        debugLog(`Displayed ${hand.length} tiles`);
    }
    
    // Create a tile element
    function createTileElement(tileCode, index) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.tile = tileCode;
        tile.dataset.index = index;
        
        // Extract suit and value for styling
        const suit = getSuitFromTileCode(tileCode);
        const value = tileCode.replace(/[^0-9]/g, '');
        
        // Set data attributes for styling
        tile.dataset.suit = suit || tileCode;
        
        // Create content div for the tile
        const content = document.createElement('div');
        content.className = 'tile-content';
        
        // Set tile content with proper display text
        if (isNumberTile(tileCode)) {
            // For numbered tiles (e.g., 1C, 2B, 3D)
            content.textContent = value;
            // Map single-letter suit codes to full names
            const suitNames = { 'C': 'Crack', 'B': 'Bam', 'D': 'Dot' };
            tile.dataset.corner = suitNames[suit] || suit;
        } else if (tileCode === 'RD') {
            content.textContent = 'Red';
            tile.dataset.corner = 'Dragon';
        } else if (tileCode === 'GD') {
            content.textContent = 'Green';
            tile.dataset.corner = 'Dragon';
        } else if (tileCode === 'WD') {
            content.textContent = 'Soap';
            tile.dataset.corner = 'Dragon';
        } else if (['N', 'E', 'S', 'W'].includes(tileCode)) {
            // Use single letter for wind directions
            content.textContent = tileCode;
            tile.dataset.corner = 'Wind';
        } else if (tileCode === 'FL') {
            content.textContent = '🌸';
            tile.dataset.corner = 'Flower';
        } else if (tileCode === 'JK') {
            content.textContent = '🃏';
            tile.dataset.corner = 'Joker';
        } else {
            content.textContent = tileCode;
        }
        
        tile.appendChild(content);
        return tile;
    }
    
    // Get suit from tile code
    function getSuitFromTileCode(tileCode) {
        if (!tileCode) return '';
        
        if (isNumberTile(tileCode)) {
            return tileCode[1];
        }
        
        // Handle special tiles
        if (['N', 'E', 'S', 'W'].includes(tileCode)) {
            return 'W'; // Wind
        } else if (['RD', 'GD', 'WD'].includes(tileCode)) {
            return 'D'; // Dragon
        } else if (tileCode === 'FL') {
            return 'F'; // Flower
        } else if (tileCode === 'JK') {
            return 'J'; // Joker
        }
        
        return '';
    }
    
    // Check if tile is a numbered tile (e.g., '1C', '2B', '3D')
    function isNumberTile(tileCode) {
        return /^[1-9][CBD]$/.test(tileCode);
    }
    
    // Get display name for special tiles
    function getTileDisplayName(tileCode) {
        const names = {
            'N': 'North',
            'E': 'East',
            'S': 'South',
            'W': 'West',
            'RD': 'Red Dragon',
            'GD': 'Green Dragon',
            'WD': 'White Dragon',
            'FL': 'Flower',
            'JK': 'Joker'
        };
        
        return names[tileCode] || tileCode;
    }
    
    // Update UI elements
    function updateUI() {
        // Update tiles remaining
        if (elements.tilesRemaining) {
            elements.tilesRemaining.textContent = `Tiles remaining: ${fullDeck.length}`;
        }
        
        // Update button states
        updateButtonStates();
    }
    
    // Update button states based on game state
    function updateButtonStates() {
        if (elements.deal13Btn) {
            elements.deal13Btn.disabled = fullDeck.length < 13;
        }
        
        if (elements.deal14Btn) {
            elements.deal14Btn.disabled = fullDeck.length < 14;
        }
        
        if (elements.analyzeButton) {
            elements.analyzeButton.disabled = currentHand.length === 0;
        }
    }
    
    // Analyze the current hand
    function analyzeHand() {
        debugLog('Analyzing hand...');
        
        if (currentHand.length === 0) {
            debugLog('No hand to analyze');
            return null;
        }
        
        const analysis = {
            pairs: [],
            pungs: [],
            kongs: [],
            chows: [],
            singles: [],
            timestamp: new Date().toISOString()
        };
        
        // Count occurrences of each tile
        const counts = {};
        currentHand.forEach(tile => {
            counts[tile] = (counts[tile] || 0) + 1;
        });
        
        // Categorize tiles into sets
        for (const [tile, count] of Object.entries(counts)) {
            if (count === 4) {
                analysis.kongs.push(tile);
            } else if (count === 3) {
                analysis.pungs.push(tile);
            } else if (count === 2) {
                analysis.pairs.push(tile);
            } else if (count === 1) {
                analysis.singles.push(tile);
            }
        }
        
        // Detect chows (sequences of 3+ consecutive numbers in the same suit)
        const suits = new Set(currentHand
            .filter(tile => isNumberTile(tile))
            .map(tile => tile[1]));
            
        for (const suit of suits) {
            const suitedTiles = currentHand
                .filter(tile => isNumberTile(tile) && tile[1] === suit)
                .map(tile => parseInt(tile[0]))
                .sort((a, b) => a - b);
                
            if (suitedTiles.length >= 3) {
                for (let i = 0; i <= suitedTiles.length - 3; i++) {
                    if (suitedTiles[i] + 1 === suitedTiles[i + 1] && 
                        suitedTiles[i] + 2 === suitedTiles[i + 2]) {
                        analysis.chows.push(`${suitedTiles[i]}${suit}`);
                    }
                }
            }
        }
        
        debugLog('Hand analysis complete:', analysis);
        displayAnalysisResults(analysis);
        
        return analysis;
    }
    
    // Display analysis results in the UI
    function displayAnalysisResults(analysis) {
        if (!elements.resultsContainer) {
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
                            `${createTileHtml(pair[0])} ${createTileHtml(pair[1])}`
                        ).join(' ')}
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
                            `${createTileHtml(pung[0])} ${createTileHtml(pung[1])} ${createTileHtml(pung[2])}`
                        ).join(' ')}
                    </div>
                </div>`;
        }
        
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
                            `${createTileHtml(kong[0])} ${createTileHtml(kong[1])} ${createTileHtml(kong[2])} ${createTileHtml(kong[3])}`
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
        
        elements.resultsContainer.innerHTML = html;
        debugLog('Analysis results displayed');
    }
    
    // Make functions available globally
    window.MahjonggDealer = {
        init,
        dealHand,
        resetDeck,
        analyzeHand,
        getCurrentHand: () => [...currentHand],
        getRemainingTiles: () => [...fullDeck]
    };
    
    // Add touch event polyfill for desktop browsers
    if (!('ontouchstart' in window)) {
        const style = document.createElement('style');
        style.textContent = `
            @media (hover: hover) {
                .tile:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 10px rgba(0,0,0,0.2);
                }
    } else {
        debugLog('ERROR: Could not find Deal 13 button');
    }
    
    if (deal14Btn) {
        deal14Btn.onclick = () => handleDeal(14);
        debugLog('Added click handler to Deal 14 button');
    } else {
        debugLog('ERROR: Could not find Deal 14 button');
    }
    
    if (resetBtn) {
        resetBtn.onclick = resetDeck;
        debugLog('Added click handler to Reset Deck button');
    } else {
        debugLog('WARNING: Could not find Reset Deck button');
    }
    
    debugLog('Initialization complete');
}

// Create a full deck of Mahjongg tiles
function createFullDeck() {
    const deck = [];
    
    // Add number tiles (1-9) for each suit (Crack, Bam, Dot)
    const suits = ['C', 'B', 'D'];
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    // Add 4 of each number tile for each suit
    suits.forEach(suit => {
        numbers.forEach(number => {
            for (let i = 0; i < 4; i++) {
                deck.push(`${number}${suit}`);
            }
        });
    });
    
    // Add honor tiles (Winds: N, E, S, W; Dragons: RD, GD, WD)
    const honors = ['N', 'E', 'S', 'W', 'RD', 'GD', 'WD'];
    honors.forEach(honor => {
        for (let i = 0; i < 4; i++) {
            deck.push(honor);
        }
    });
    
    // Add flowers (FL) and jokers (JK)
    for (let i = 0; i < 8; i++) {
        deck.push('FL'); // Flowers
    }
    
    for (let i = 0; i < 8; i++) {
        deck.push('JK'); // Jokers
    }
    
    debugLog(`Created deck with ${deck.length} tiles`);
    return deck;
}

// Shuffle the deck using Fisher-Yates algorithm
function shuffleDeck(deck) {
    debugLog('Shuffling deck...');
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Deal a hand of tiles
function dealHand(numTiles) {
    debugLog(`\n=== DEALING ${numTiles} TILES ===`);
    
    // Create new deck if needed
    if (fullDeck.length < numTiles) {
        debugLog('Not enough tiles, creating new deck...');
        fullDeck = createFullDeck();
        shuffleDeck(fullDeck);
    }
    
    // Deal the tiles
    const hand = [];
    for (let i = 0; i < numTiles; i++) {
        if (fullDeck.length === 0) {
            debugLog('WARNING: Deck is empty!');
            break;
        }
        const tile = fullDeck.pop();
        hand.push(tile);
        debugLog(`Dealt: ${tile} (${fullDeck.length} remaining)`);
    }
    
    return hand;
}

// Reset the deck
function resetDeck() {
    debugLog('Resetting deck...');
    fullDeck = createFullDeck();
    shuffleDeck(fullDeck);
    
    // Clear the current hand
    const container = document.getElementById('tiles-row');
    if (container) {
        container.innerHTML = '';
    }
    
    // Update remaining tiles count
    const tileCountEl = document.getElementById('tile-count');
    if (tileCountEl) {
        tileCountEl.textContent = fullDeck.length;
    }
    
    debugLog('Deck has been reset and shuffled');
    alert('Deck has been reset and shuffled!');
}

// Calculate optimal tile size based on viewport width
function calculateOptimalTileSize(tileCount) {
    // Use the full viewport width minus some padding
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
    const tiles = document.querySelectorAll('.tile');
    if (tiles.length === 0) return;
    
    const { width, height } = calculateOptimalTileSize(tileCount);
    
    // Update CSS variables
    document.documentElement.style.setProperty('--tile-width', `${width}px`);
    document.documentElement.style.setProperty('--tile-height', `${height}px`);
    
    // Adjust font sizes proportionally
    const baseFontSize = Math.max(10, Math.min(20, Math.floor(width / 2.2)));
    const suitFontSize = Math.max(8, Math.floor(baseFontSize * 0.7));
    
    document.documentElement.style.setProperty('--tile-font-size', `${baseFontSize}px`);
    document.documentElement.style.setProperty('--tile-suit-size', `${suitFontSize}px`);
    
    // Adjust font size for dragon tiles
    tiles.forEach(tile => {
        if (tile.hasAttribute('data-original-suit')) {
            tile.style.fontSize = `${Math.max(8, Math.floor(baseFontSize * 0.8))}px`;
            tile.style.lineHeight = '1';
        }
    });
}

// Display the hand on the page
function displayHand(hand) {
    debugLog(`Displaying hand with ${hand.length} tiles`);
    const container = document.getElementById('tiles-row');
    if (!container) {
        debugLog('ERROR: Could not find tiles row container');
        return;
    }
    
    // Clear previous hand
    container.innerHTML = '';
    
    // Add each tile
    hand.forEach((tileCode) => {
        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        
        // Extract suit and value for styling
        const suitMatch = tileCode.match(/[A-Za-z]+/);
        const valueMatch = tileCode.match(/\d+/);
        const suit = suitMatch ? suitMatch[0] : '';
        const value = valueMatch ? valueMatch[0] : '';
        
        // Set data attributes for styling
        tileEl.setAttribute('data-suit', suit || tileCode);
        if (value) tileEl.setAttribute('data-value', value);
        
        // Set tile content with proper display text
        let displayText = tileCode;
        if (suit && value) {
            // For numbered tiles (e.g., 1C, 2B, 3D)
            displayText = value;
            // Map single-letter suit codes to full names
            const suitNames = { 'C': 'Crack', 'B': 'Bam', 'D': 'Dot' };
            tileEl.setAttribute('data-corner', suitNames[suit] || suit);
        } else if (tileCode === 'RD') {
            displayText = 'Red';
            tileEl.setAttribute('data-corner', 'Dragon');
        } else if (tileCode === 'GD') {
            displayText = 'Green';
            tileEl.setAttribute('data-corner', 'Dragon');
        } else if (tileCode === 'WD') {
            displayText = 'Soap';
            tileEl.setAttribute('data-corner', 'Dragon');
        } else if (['N', 'E', 'S', 'W'].includes(tileCode)) {
            // Use single letter for wind directions
            displayText = tileCode;
            tileEl.setAttribute('data-corner', 'Wind');
        } else if (tileCode === 'FL') {
            displayText = '🌺';
            tileEl.setAttribute('data-corner', 'Flower');
        } else if (tileCode === 'JK') {
            displayText = '🃏';
            tileEl.setAttribute('data-corner', 'Joker');
        }
        
        tileEl.textContent = displayText;
        container.appendChild(tileEl);
    });
    
    // Update tile sizes to fit viewport
    updateTileSizes(hand.length);
    
    debugLog(`Displayed ${hand.length} tiles`);
    
    // Update remaining tiles count
    const tileCountEl = document.getElementById('tile-count');
    if (tileCountEl) {
        tileCountEl.textContent = fullDeck.length;
    }
    
    // Perform hand analysis
    analyzeHand(hand);
}

// Handle deal button click
function handleDeal(numTiles) {
    debugLog(`\n=== HANDLE DEAL (${numTiles} tiles) ===`);
    try {
        // Deal a new hand
        currentHand = dealHand(numTiles);
        
        // Display the hand
        displayHand(currentHand);
        
        debugLog('=== DEAL COMPLETE ===');
    } catch (error) {
        const errorMsg = `ERROR: ${error.message}`;
        debugLog(errorMsg);
        alert(errorMsg);
    }
}

// Analyze the current hand
function analyzeHand(hand) {
    debugLog('Analyzing hand...');
    const analysisEl = document.getElementById('analysis-results-content');
    if (!analysisEl) {
        debugLog('WARNING: Could not find analysis results container');
        return;
    }
    
    // Simple analysis - group by tile type
    const tileCounts = {};
    hand.forEach(tile => {
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
    const groups = {};
    sortedTiles.forEach(tile => {
        const count = tileCounts[tile];
        if (!groups[count]) {
            groups[count] = [];
        }
        groups[count].push(tile);
    });
    
    // Generate HTML for analysis
    let html = '';
    
    // Pairs (2 of a kind)
    if (groups[2]) {
        html += `
            <div class="analysis-group">
                <div class="analysis-group-title">
                    Pairs <span class="tile-count">${groups[2].length}</span>:
                </div>
                <div class="analysis-tiles">
                    ${groups[2].map(tile => createTileHtml(tile, 2)).join('')}
                </div>
            </div>`;
    }
    
    // Pungs (3 of a kind)
    if (groups[3]) {
        html += `
            <div class="analysis-group">
                <div class="analysis-group-title">
                    Pungs <span class="tile-count">${groups[3].length}</span>:
                </div>
                <div class="analysis-tiles">
                    ${groups[3].map(tile => createTileHtml(tile, 3)).join('')}
                </div>
            </div>`;
    }
    
    // Kongs (4 of a kind)
    if (groups[4]) {
        html += `
            <div class="analysis-group">
                <div class="analysis-group-title">
                    Kongs <span class="tile-count">${groups[4].length}</span>:
                </div>
                <div class="analysis-tiles">
                    ${groups[4].map(tile => createTileHtml(tile, 4)).join('')}
                </div>
            </div>`;
    }
    
    // Singles
    if (groups[1]) {
        html += `
            <div class="analysis-group">
                <div class="analysis-group-title">
                    Singles <span class="tile-count">${groups[1].length}</span>:
                </div>
                <div class="analysis-tiles">
                    ${groups[1].map(tile => createTileHtml(tile, 1)).join('')}
                </div>
            </div>`;
    }
    
    analysisEl.innerHTML = html || '<p>No analysis available.</p>';
    debugLog('Hand analysis complete');
}

// Create HTML for a tile in the analysis
function createTileHtml(tileCode, count) {
    const tileEl = document.createElement('div');
    tileEl.className = 'tile';
    tileEl.style.display = 'inline-flex';
    tileEl.style.margin = '0 2px 2px 0';
    
    // Extract suit and value for styling
    const suitMatch = tileCode.match(/[A-Za-z]+/);
    const valueMatch = tileCode.match(/\d+/);
    const suit = suitMatch ? suitMatch[0] : '';
    const value = valueMatch ? valueMatch[0] : '';
    
    // Set data attributes for styling
    tileEl.setAttribute('data-suit', suit || tileCode);
    if (value) tileEl.setAttribute('data-value', value);
    
    // Set tile content with proper display text
    let displayText = tileCode;
    if (suit && value) {
        // For numbered tiles (e.g., 1C, 2B, 3D)
        displayText = value;
        // Map single-letter suit codes to full names
        const suitNames = { 'C': 'Crack', 'B': 'Bam', 'D': 'Dot' };
        tileEl.setAttribute('data-corner', suitNames[suit] || suit);
    } else if (tileCode === 'RD') {
        displayText = 'Red';
        tileEl.setAttribute('data-corner', 'Dragon');
    } else if (tileCode === 'GD') {
        displayText = 'Green';
        tileEl.setAttribute('data-corner', 'Dragon');
    } else if (tileCode === 'WD') {
        displayText = 'Soap';
        tileEl.setAttribute('data-corner', 'Dragon');
    } else if (['N', 'E', 'S', 'W'].includes(tileCode)) {
        // Use single letter for wind directions
        displayText = tileCode;
        tileEl.setAttribute('data-corner', 'Wind');
    } else if (tileCode === 'FL') {
        displayText = '🌺';
        tileEl.setAttribute('data-corner', 'Flower');
    } else if (tileCode === 'JK') {
        displayText = '🃏';
        tileEl.setAttribute('data-corner', 'Joker');
    }
    
    tileEl.textContent = displayText;
    
    // Create a container for the tile and count
    const container = document.createElement('div');
    container.className = 'analysis-tile-container';
    container.style.display = 'inline-block';
    container.style.textAlign = 'center';
    container.style.margin = '0 2px';
    
    // Add the tile
    container.appendChild(tileEl);
    
    // Add count if more than 1
    if (count > 1) {
        const countEl = document.createElement('div');
        countEl.textContent = `×${count}`;
        countEl.style.fontSize = '10px';
        countEl.style.lineHeight = '1';
        container.appendChild(countEl);
    }
    
    return container.outerHTML;
}

// Handle window resize to adjust tile sizes
function handleResize() {
    const container = document.getElementById('tiles-row');
    if (container && container.children.length > 0) {
        updateTileSizes(container.children.length);
    }
}

// Start the app when the page loads
function startApp() {
    debugLog('Starting app...');
    try {
        init();
        
        // Add resize event listener
        window.addEventListener('resize', handleResize);
        
        debugLog('App started successfully');
    } catch (error) {
        const errorMsg = `Failed to start app: ${error.message}`;
        debugLog(errorMsg);
        console.error(errorMsg, error);
        alert(errorMsg);
    }
    
    // Expose the analyzeHand function globally for the button
    window.analyzeHand = function() {
        return window.MahjonggDealer.analyzeHand();
    };
    
    debugLog('Mahjongg Dealer module loaded and ready');
})();
