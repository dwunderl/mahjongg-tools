// Simple debug logging function
function debugLog(message) {
    console.log(message);
    const debugEl = document.getElementById('debug-messages');
    if (debugEl) {
        const line = document.createElement('div');
        line.textContent = `[${new Date().toISOString()}] ${message}`;
        debugEl.appendChild(line);
        debugEl.scrollTop = debugEl.scrollHeight;
    }
}

// Global variables
let fullDeck = [];
let currentHand = [];

// Initialize the application
function init() {
    debugLog('Initializing Mahjongg Dealer...');
    
    // Create and shuffle the initial deck
    fullDeck = createFullDeck();
    shuffleDeck(fullDeck);
    
    // Set up event listeners
    const deal13Btn = document.getElementById('deal-13-btn');
    const deal14Btn = document.getElementById('deal-14-btn');
    const resetBtn = document.getElementById('reset-deck-btn');
    
    if (deal13Btn) {
        deal13Btn.onclick = () => handleDeal(13);
        debugLog('Added click handler to Deal 13 button');
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
        
        // Add specific class for dot tiles and white dragon
        if (suit === 'D' || tileCode === 'WD') {
            tileEl.classList.add('dot-tile');
        }
        
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
        
        // Create a span for the tile content for better styling control
        const contentSpan = document.createElement('span');
        contentSpan.className = 'tile-content';
        contentSpan.textContent = displayText;
        tileEl.appendChild(contentSpan);
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
        // Initialize the application
        init();
        
        // Add resize event listener
        window.addEventListener('resize', handleResize);
        
        // Make sure the deck is created and shuffled
        if (fullDeck.length === 0) {
            fullDeck = createFullDeck();
            shuffleDeck(fullDeck);
        }
        
        // Update the tile count display
        const tileCountEl = document.getElementById('tile-count');
        if (tileCountEl) {
            tileCountEl.textContent = fullDeck.length;
        }
        
        debugLog('App started successfully');
    } catch (error) {
        const errorMsg = `Failed to start app: ${error.message}`;
        debugLog(errorMsg);
        console.error(errorMsg, error);
        alert(errorMsg);
    }
}

// Make sure the debugLog is available globally
window.debugLog = debugLog;

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    debugLog('Waiting for DOM to load...');
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    debugLog('DOM already loaded, starting app...');
    startApp();
}

// Make sure debug log is visible
setTimeout(() => {
    const debugEl = document.getElementById('debug-messages');
    if (debugEl) {
        debugEl.scrollTop = debugEl.scrollHeight;
    }
}, 1000);

